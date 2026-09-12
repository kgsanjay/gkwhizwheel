<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SyncStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\SyncBatchRequest;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\SyncQueue;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\RefundService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Throwable;

class SyncController extends Controller
{
    /**
     * Batch process queued offline mobile actions with per-item status response.
     */
    public function sync(
        SyncBatchRequest $request,
        AvailabilityService $availabilityService,
        BookingService $bookingService,
        RefundService $refundService
    ): JsonResponse {

        $deviceId = (string) ($request->validated('device_id') ?? 'mobile_device');
        $actions = $request->validated('actions');
        $staffUser = $request->user();

        $results = [];
        $syncedCount = 0;
        $failedCount = 0;

        foreach ($actions as $action) {
            $idempotencyKey = (string) $action['idempotency_key'];
            $actionType = (string) $action['action_type'];
            $payload = $action['payload'] ?? [];

            // Check if already processed
            $existing = SyncQueue::where('idempotency_key', $idempotencyKey)->first();
            if ($existing !== null && $existing->status === SyncStatus::SYNCED) {
                $results[] = [
                    'idempotency_key' => $idempotencyKey,
                    'action_type' => $actionType,
                    'status' => 'success',
                    'message' => 'Action already synchronized previously.',
                    'data' => null,
                ];
                $syncedCount++;

                continue;
            }

            try {
                $itemData = match ($actionType) {
                    'create_booking', 'hold_booking' => $this->handleCreateBooking($payload, $idempotencyKey, $staffUser, $availabilityService),
                    'collect_payment' => $this->handleCollectPayment($payload, $staffUser, $bookingService),
                    'handover' => $this->handleHandover($payload, $staffUser, $bookingService),
                    'return', 'mark_returned' => $this->handleReturn($payload, $staffUser, $bookingService, $refundService),
                    'maintenance' => $this->handleMaintenance($payload, $staffUser),
                    default => throw new InvalidArgumentException("Unsupported action type: '{$actionType}'"),
                };

                SyncQueue::updateOrCreate(
                    ['idempotency_key' => $idempotencyKey],
                    [
                        'device_id' => $deviceId,
                        'user_id' => $staffUser->id,
                        'action_type' => $actionType,
                        'payload_json' => $payload,
                        'status' => SyncStatus::SYNCED,
                        'synced_at' => now(),
                    ]
                );

                $results[] = [
                    'idempotency_key' => $idempotencyKey,
                    'action_type' => $actionType,
                    'status' => 'success',
                    'data' => $itemData,
                    'error' => null,
                ];
                $syncedCount++;
            } catch (Throwable $e) {
                SyncQueue::updateOrCreate(
                    ['idempotency_key' => $idempotencyKey],
                    [
                        'device_id' => $deviceId,
                        'user_id' => $staffUser->id,
                        'action_type' => $actionType,
                        'payload_json' => $payload,
                        'status' => SyncStatus::FAILED,
                    ]
                );

                $results[] = [
                    'idempotency_key' => $idempotencyKey,
                    'action_type' => $actionType,
                    'status' => 'failed',
                    'data' => null,
                    'error' => $e->getMessage(),
                ];
                $failedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total' => count($actions),
                'synced_count' => $syncedCount,
                'failed_count' => $failedCount,
                'items' => $results,
            ],
            'message' => "Batch sync processed: {$syncedCount} succeeded, {$failedCount} failed.",
        ]);
    }

    /**
     * Action handler: create_booking
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function handleCreateBooking(
        array $payload,
        string $idempotencyKey,
        User $staffUser,
        AvailabilityService $availabilityService
    ): array {
        $pickupStoreId = (int) $payload['pickup_store_id'];
        $authorizedStoreIds = $staffUser->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null && ! in_array($pickupStoreId, $authorizedStoreIds, true)) {
            throw new AuthorizationException("Staff is not assigned to pickup store ID {$pickupStoreId}.");
        }

        $booking = $availabilityService->holdBooking([
            'bike_id' => (int) $payload['bike_id'],
            'user_id' => (int) ($payload['user_id'] ?? $payload['customer_id']),
            'pickup_store_id' => $pickupStoreId,
            'return_store_id' => (int) $payload['return_store_id'],
            'start_date' => (string) $payload['start_date'],
            'end_date' => (string) $payload['end_date'],
            'channel' => BookingChannel::OFFLINE,
            'idempotency_key' => $idempotencyKey,
            'coupon_code' => $payload['coupon_code'] ?? null,
            'addons' => $payload['addons'] ?? [],
            'created_by' => $staffUser->id,
        ]);

        return [
            'booking_id' => $booking->id,
            'booking_reference' => $booking->booking_reference,
            'status' => $booking->status->value,
            'total_amount' => (float) $booking->total_amount,
        ];
    }

    /**
     * Action handler: collect_payment
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function handleCollectPayment(
        array $payload,
        User $staffUser,
        BookingService $bookingService
    ): array {
        $booking = Booking::with('payments')->findOrFail((int) $payload['booking_id']);

        $authorizedStoreIds = $staffUser->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null
            && ! in_array($booking->pickup_store_id, $authorizedStoreIds, true)
            && ! in_array($booking->return_store_id, $authorizedStoreIds, true)) {
            throw new AuthorizationException("Staff is not assigned to store for booking {$booking->booking_reference}.");
        }

        // Server-side balance validation (Requirement 2)
        $totalPaid = (float) $booking->payments->where('status', PaymentStatus::SUCCESS)->sum('amount');
        $outstandingBalance = max(0.0, round((float) $booking->total_amount - $totalPaid, 2));

        $amount = isset($payload['amount']) ? (float) $payload['amount'] : $outstandingBalance;

        if ($amount <= 0.0) {
            throw new InvalidArgumentException("Payment amount must be greater than zero for booking {$booking->booking_reference}.");
        }

        if ($amount > $outstandingBalance + 0.01) {
            throw new InvalidArgumentException("Submitted payment amount of ₹{$amount} exceeds remaining outstanding balance of ₹{$outstandingBalance} for booking {$booking->booking_reference}.");
        }

        $method = PaymentMethod::tryFrom((string) ($payload['payment_method'] ?? $payload['method'] ?? 'cash')) ?? PaymentMethod::CASH;
        $gatewayRef = $payload['gateway_reference'] ?? null;

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => PaymentType::ADVANCE,
            'amount' => $amount,
            'method' => $method,
            'gateway_reference' => $gatewayRef,
            'status' => PaymentStatus::SUCCESS,
            'collected_by' => $staffUser->id,
            'notes' => $payload['notes'] ?? 'Offline sync payment collection',
        ]);

        $bookingService->confirmPayment($booking, $gatewayRef, $staffUser->id);

        return [
            'booking_id' => $booking->id,
            'payment_id' => $payment->id,
            'status' => 'confirmed',
        ];
    }

    /**
     * Action handler: handover
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function handleHandover(
        array $payload,
        User $staffUser,
        BookingService $bookingService
    ): array {
        $booking = Booking::with('bike')->findOrFail((int) $payload['booking_id']);

        $authorizedStoreIds = $staffUser->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null && ! in_array($booking->pickup_store_id, $authorizedStoreIds, true)) {
            throw new AuthorizationException("Staff is not assigned to pickup store ID {$booking->pickup_store_id} for booking {$booking->booking_reference}.");
        }

        $bookingService->markHandedOver(
            booking: $booking,
            odometerReading: (int) ($payload['odometer_reading'] ?? 0),
            signaturePath: $payload['signature_path'] ?? null,
            notes: $payload['notes'] ?? null,
            photoPaths: $payload['photo_paths'] ?? [],
            staffId: $staffUser->id
        );

        return [
            'booking_id' => $booking->id,
            'status' => 'handed_over',
            'bike_status' => 'on_rent',
        ];
    }

    /**
     * Action handler: return
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function handleReturn(
        array $payload,
        User $staffUser,
        BookingService $bookingService,
        RefundService $refundService
    ): array {
        $booking = Booking::with(['bike', 'category'])->findOrFail((int) $payload['booking_id']);

        $returnStoreId = isset($payload['return_store_id']) ? (int) $payload['return_store_id'] : $booking->return_store_id;

        $authorizedStoreIds = $staffUser->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null && ! in_array($returnStoreId, $authorizedStoreIds, true)) {
            throw new AuthorizationException("Staff is not assigned to return store ID {$returnStoreId} for booking {$booking->booking_reference}.");
        }

        $lateFee = isset($payload['late_fee_override'])
            ? (float) $payload['late_fee_override']
            : 0.0;

        $damageFee = (float) ($payload['damage_fee'] ?? 0.0);

        $bookingService->markReturned(
            booking: $booking,
            odometerReading: (int) ($payload['odometer_reading'] ?? $booking->bike->odometer_reading ?? 0),
            lateFee: $lateFee,
            damageFee: $damageFee,
            notes: $payload['notes'] ?? null,
            photoPaths: $payload['photo_paths'] ?? [],
            staffId: $staffUser->id,
            returnStoreId: $returnStoreId
        );

        if ((float) $booking->deposit_amount > 0) {
            $refundService->createDepositRefund(
                booking: $booking,
                damageDeductions: $damageFee,
                lateFeeDeductions: $lateFee,
                reason: 'Offline sync return inspection deposit refund',
                processedBy: $staffUser->id
            );
        }

        return [
            'booking_id' => $booking->id,
            'status' => 'returned',
            'bike_status' => 'available',
            'current_store_id' => $returnStoreId,
        ];
    }

    /**
     * Action handler: maintenance
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function handleMaintenance(array $payload, User $staffUser): array
    {
        $bike = Bike::findOrFail((int) $payload['bike_id']);

        $authorizedStoreIds = $staffUser->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null && ! in_array($bike->current_store_id, $authorizedStoreIds, true)) {
            throw new AuthorizationException("Staff is not assigned to store ID {$bike->current_store_id} housing bike {$bike->registration_number}.");
        }

        if (isset($payload['status'])) {
            $newStatus = BikeStatus::from((string) $payload['status']);
        } else {
            $newStatus = $bike->status === BikeStatus::MAINTENANCE
                ? BikeStatus::AVAILABLE
                : BikeStatus::MAINTENANCE;
        }

        $bike->update([
            'status' => $newStatus,
        ]);

        return [
            'bike_id' => $bike->id,
            'status' => $newStatus->value,
        ];
    }
}

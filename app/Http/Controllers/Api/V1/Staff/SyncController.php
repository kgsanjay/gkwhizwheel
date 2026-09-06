<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SyncStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\SyncBatchRequest;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\SyncQueue;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SyncController extends Controller
{
    /**
     * Authorize staff, store manager, or super admin access.
     */
    protected function authorizeStaff(Request $request): void
    {
        $user = $request->user();

        if ($user === null) {
            abort(401, 'Unauthenticated.');
        }

        $isStaff = in_array($user->role, [
            UserRole::STAFF,
            UserRole::STORE_MANAGER,
            UserRole::SUPER_ADMIN,
        ], true);

        if (! $isStaff) {
            try {
                $isStaff = $user->hasAnyRole(['staff', 'store_manager', 'super_admin', 'admin']);
            } catch (Throwable) {
                // ignore
            }
        }

        if (! $isStaff) {
            abort(403, 'Unauthorized. Staff access required.');
        }
    }

    /**
     * Batch process queued offline mobile actions with per-item status response.
     */
    public function sync(
        SyncBatchRequest $request,
        AvailabilityService $availabilityService,
        BookingService $bookingService,
        RefundService $refundService
    ): JsonResponse {
        $this->authorizeStaff($request);

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
                    'create_booking', 'hold_booking' => $this->handleCreateBooking($payload, $idempotencyKey, $staffUser->id, $availabilityService),
                    'collect_payment' => $this->handleCollectPayment($payload, $staffUser->id, $bookingService),
                    'handover' => $this->handleHandover($payload, $staffUser->id, $bookingService),
                    'return', 'mark_returned' => $this->handleReturn($payload, $staffUser->id, $bookingService, $refundService),
                    'maintenance' => $this->handleMaintenance($payload),
                    default => throw new \InvalidArgumentException("Unsupported action type: '{$actionType}'"),
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
        int $staffId,
        AvailabilityService $availabilityService
    ): array {
        $booking = $availabilityService->holdBooking([
            'bike_id' => (int) $payload['bike_id'],
            'user_id' => (int) ($payload['user_id'] ?? $payload['customer_id']),
            'pickup_store_id' => (int) $payload['pickup_store_id'],
            'return_store_id' => (int) $payload['return_store_id'],
            'start_date' => (string) $payload['start_date'],
            'end_date' => (string) $payload['end_date'],
            'channel' => BookingChannel::OFFLINE,
            'idempotency_key' => $idempotencyKey,
            'coupon_code' => $payload['coupon_code'] ?? null,
            'addons' => $payload['addons'] ?? [],
            'created_by' => $staffId,
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
        int $staffId,
        BookingService $bookingService
    ): array {
        $booking = Booking::findOrFail((int) $payload['booking_id']);
        $amount = isset($payload['amount']) ? (float) $payload['amount'] : (float) $booking->total_amount;
        $method = PaymentMethod::tryFrom((string) ($payload['payment_method'] ?? $payload['method'] ?? 'cash')) ?? PaymentMethod::CASH;
        $gatewayRef = $payload['gateway_reference'] ?? null;

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => PaymentType::ADVANCE,
            'amount' => $amount,
            'method' => $method,
            'gateway_reference' => $gatewayRef,
            'status' => PaymentStatus::SUCCESS,
            'collected_by' => $staffId,
            'notes' => $payload['notes'] ?? 'Offline sync payment collection',
        ]);

        $bookingService->confirmPayment($booking, $gatewayRef, $staffId);

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
        int $staffId,
        BookingService $bookingService
    ): array {
        $booking = Booking::with('bike')->findOrFail((int) $payload['booking_id']);

        $bookingService->markHandedOver(
            booking: $booking,
            odometerReading: (int) ($payload['odometer_reading'] ?? 0),
            signaturePath: $payload['signature_path'] ?? null,
            notes: $payload['notes'] ?? null,
            photoPaths: $payload['photo_paths'] ?? [],
            staffId: $staffId
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
        int $staffId,
        BookingService $bookingService,
        RefundService $refundService
    ): array {
        $booking = Booking::with(['bike', 'category'])->findOrFail((int) $payload['booking_id']);

        $lateFee = isset($payload['late_fee_override'])
            ? (float) $payload['late_fee_override']
            : 0.0;

        $damageFee = (float) ($payload['damage_fee'] ?? 0.0);
        $returnStoreId = isset($payload['return_store_id']) ? (int) $payload['return_store_id'] : $booking->return_store_id;

        $bookingService->markReturned(
            booking: $booking,
            odometerReading: (int) ($payload['odometer_reading'] ?? $booking->bike->odometer_reading ?? 0),
            lateFee: $lateFee,
            damageFee: $damageFee,
            notes: $payload['notes'] ?? null,
            photoPaths: $payload['photo_paths'] ?? [],
            staffId: $staffId,
            returnStoreId: $returnStoreId
        );

        if ((float) $booking->deposit_amount > 0) {
            $refundService->createDepositRefund(
                booking: $booking,
                damageDeductions: $damageFee,
                lateFeeDeductions: $lateFee,
                reason: 'Offline sync return inspection deposit refund',
                processedBy: $staffId
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
    protected function handleMaintenance(array $payload): array
    {
        $bike = Bike::findOrFail((int) $payload['bike_id']);

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

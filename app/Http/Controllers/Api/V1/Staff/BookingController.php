<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\CollectStaffPaymentRequest;
use App\Http\Requests\Staff\HandoverBookingRequest;
use App\Http\Requests\Staff\ReturnBookingRequest;
use App\Http\Requests\Staff\StoreStaffBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\RefundService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookingController extends Controller
{

    /**
     * Ensure staff member is authorized for a specific store ID or booking.
     * Logs an audit record if an explicit cross-store permission was used.
     */
    protected function authorizeStoreAccess(Request $request, int $storeId, ?Booking $booking = null, string $operation = 'access'): void
    {
        $user = $request->user();
        $authorizedStoreIds = $user->getAuthorizedStoreIds();

        if ($authorizedStoreIds === null) {
            // If user is not super admin but has explicit cross-store permission, audit it
            if ($user->role !== UserRole::SUPER_ADMIN) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'store_id' => $storeId,
                    'action' => 'cross_store_access',
                    'subject_type' => $booking ? Booking::class : Store::class,
                    'subject_id' => $booking?->id ?? $storeId,
                    'new_values' => [
                        'operation' => $operation,
                        'target_store_id' => $storeId,
                    ],
                ]);
            }

            return;
        }

        if (! in_array($storeId, $authorizedStoreIds, true)) {
            abort(403, "Unauthorized. You are not assigned to store ID {$storeId}.");
        }
    }

    /**
     * Create or retrieve an offline booking hold with idempotency key.
     */
    public function store(
        StoreStaffBookingRequest $request,
        AvailabilityService $availabilityService
    ): JsonResponse {
        $pickupStoreId = (int) $request->validated('pickup_store_id');
        $this->authorizeStoreAccess($request, $pickupStoreId, null, 'create_booking');

        $booking = $availabilityService->holdBooking([
            'bike_id' => (int) $request->validated('bike_id'),
            'user_id' => (int) $request->validated('user_id'),
            'pickup_store_id' => $pickupStoreId,
            'return_store_id' => (int) $request->validated('return_store_id'),
            'start_date' => (string) $request->validated('start_date'),
            'end_date' => (string) $request->validated('end_date'),
            'channel' => BookingChannel::OFFLINE,
            'idempotency_key' => (string) $request->validated('idempotency_key'),
            'coupon_code' => $request->validated('coupon_code'),
            'addons' => $request->validated('addons') ?? [],
            'created_by' => $request->user()->id,
        ]);

        if ($booking->wasRecentlyCreated) {
            ActivityLog::create([
                'user_id' => $request->user()->id,
                'store_id' => $pickupStoreId,
                'action' => 'booking_held_offline',
                'subject_type' => Booking::class,
                'subject_id' => $booking->id,
                'new_values' => [
                    'booking_reference' => $booking->booking_reference,
                    'channel' => 'offline',
                    'customer_id' => $booking->user_id,
                    'total_amount' => (float) $booking->total_amount,
                ],
            ]);
        }

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'user']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => $booking->wasRecentlyCreated
                ? 'Offline booking hold created successfully.'
                : 'Existing booking retrieved successfully.',
        ], $booking->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Record cash, card POS, or UPI payment and confirm booking.
     */
    public function collectPayment(
        int $id,
        CollectStaffPaymentRequest $request,
        BookingService $bookingService
    ): JsonResponse {
        $booking = Booking::with(['bike', 'pickupStore', 'returnStore', 'addons', 'payments'])->findOrFail($id);

        $authorizedStoreIds = $request->user()->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null
            && ! in_array($booking->pickup_store_id, $authorizedStoreIds, true)
            && ! in_array($booking->return_store_id, $authorizedStoreIds, true)) {
            abort(403, "Unauthorized. You are not assigned to store for booking {$booking->booking_reference}.");
        }

        if (! in_array($booking->status, [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT, BookingStatus::CONFIRMED], true)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => "Cannot collect payment for booking with status '{$booking->status->value}'.",
                'errors' => null,
            ], 422);
        }

        // Server-side outstanding balance validation
        $totalPaid = (float) $booking->payments->where('status', PaymentStatus::SUCCESS)->sum('amount');
        $outstandingBalance = max(0.0, round((float) $booking->total_amount - $totalPaid, 2));

        $amount = $request->filled('amount')
            ? (float) $request->validated('amount')
            : $outstandingBalance;

        if ($amount <= 0.0) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Payment amount must be greater than zero.',
                'errors' => ['amount' => ['Payment amount must be greater than zero.']],
            ], 422);
        }

        if ($amount > $outstandingBalance + 0.01) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => "Submitted payment amount of ₹{$amount} exceeds remaining outstanding balance of ₹{$outstandingBalance}.",
                'errors' => ['amount' => ["Amount exceeds outstanding balance of ₹{$outstandingBalance}."]],
            ], 422);
        }

        $method = PaymentMethod::from((string) $request->validated('payment_method'));
        $gatewayRef = $request->validated('gateway_reference');

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => PaymentType::ADVANCE,
            'amount' => $amount,
            'method' => $method,
            'gateway_reference' => $gatewayRef,
            'status' => PaymentStatus::SUCCESS,
            'collected_by' => $request->user()->id,
            'notes' => $request->validated('notes'),
        ]);

        if ($booking->status !== BookingStatus::CONFIRMED) {
            $bookingService->confirmPayment($booking, $gatewayRef, $request->user()->id);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $booking->pickup_store_id,
            'action' => 'payment_collected_offline',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'payment_id' => $payment->id,
                'amount' => $amount,
                'method' => $method->value,
                'status' => 'confirmed',
            ],
        ]);

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds', 'user']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Payment collected and booking confirmed successfully.',
        ]);
    }

    /**
     * Complete handover: record odometer, condition photos, customer signature, and mark handed_over.
     */
    public function handover(
        int $id,
        HandoverBookingRequest $request,
        BookingService $bookingService
    ): JsonResponse {
        $booking = Booking::with(['bike', 'pickupStore', 'returnStore'])->findOrFail($id);
        $this->authorizeStoreAccess($request, $booking->pickup_store_id, $booking, 'handover');

        if ($booking->status !== BookingStatus::CONFIRMED) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => "Booking must be in 'confirmed' status for handover. Current status: '{$booking->status->value}'.",
                'errors' => null,
            ], 422);
        }

        $photoPaths = [];
        if ($request->hasFile('condition_photos')) {
            foreach ($request->file('condition_photos') as $photoFile) {
                if ($photoFile instanceof UploadedFile) {
                    $photoPaths[] = $photoFile->store('condition/handover');
                }
            }
        }

        $signaturePath = null;
        if ($request->hasFile('signature')) {
            $signaturePath = $request->file('signature')->store('signatures/bookings');
        } elseif (is_string($request->input('signature'))) {
            $filename = 'signatures/bookings/sig_'.Str::random(20).'.png';
            Storage::disk('local')->put($filename, (string) $request->input('signature'));
            $signaturePath = $filename;
        }

        $bookingService->markHandedOver(
            booking: $booking,
            odometerReading: (int) $request->validated('odometer_reading'),
            signaturePath: $signaturePath,
            notes: $request->validated('notes'),
            photoPaths: $photoPaths,
            staffId: $request->user()->id
        );

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $booking->pickup_store_id,
            'action' => 'booking_handed_over',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'odometer_reading' => (int) $request->validated('odometer_reading'),
                'condition_photos_count' => count($photoPaths),
                'signature_recorded' => $signaturePath !== null,
                'status' => 'handed_over',
            ],
        ]);

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds', 'user']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Bike handed over and booking marked as handed_over successfully.',
        ]);
    }

    /**
     * List active bookings currently out (for return lookup).
     */
    public function active(Request $request): JsonResponse
    {
        $request->validate([
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'status' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Booking::query()
            ->with(['bike.images', 'pickupStore', 'returnStore', 'addons', 'user', 'payments', 'conditionLogs.photos'])
            ->whereIn('status', [BookingStatus::HANDED_OVER, BookingStatus::CONFIRMED]);

        $authorizedStoreIds = $request->user()->getAuthorizedStoreIds();
        if ($authorizedStoreIds !== null) {
            $query->where(function ($q) use ($authorizedStoreIds): void {
                $q->whereIn('pickup_store_id', $authorizedStoreIds)
                    ->orWhereIn('return_store_id', $authorizedStoreIds);
            });
        }

        if ($request->filled('store_id')) {
            $storeId = (int) $request->query('store_id');
            if ($authorizedStoreIds !== null && ! in_array($storeId, $authorizedStoreIds, true)) {
                abort(403, "Unauthorized. You are not assigned to store ID {$storeId}.");
            }
            $query->where(function ($q) use ($storeId): void {
                $q->where('pickup_store_id', $storeId)
                    ->orWhere('return_store_id', $storeId);
            });
        }

        if ($request->filled('status')) {
            $statusVal = (string) $request->query('status');
            $statusEnum = BookingStatus::tryFrom($statusVal);
            if ($statusEnum !== null) {
                $query->where('status', $statusEnum);
            }
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search): void {
                $q->where('booking_reference', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search): void {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('bike', function ($bq) use ($search): void {
                        $bq->where('registration_number', 'like', "%{$search}%")
                            ->orWhere('model_name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));
        $bookings = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
            'message' => 'Active bookings retrieved successfully.',
        ]);
    }

    /**
     * Process bike return: record odometer, condition photos, calculate late fees,
     * update bikes.current_store_id (one-way rental support), and process deposit refund.
     */
    public function returnBike(
        int $id,
        ReturnBookingRequest $request,
        BookingService $bookingService,
        RefundService $refundService
    ): JsonResponse {
        $booking = Booking::with(['bike', 'pickupStore', 'returnStore', 'user'])->findOrFail($id);

        $returnStoreId = $request->filled('return_store_id')
            ? (int) $request->validated('return_store_id')
            : $booking->return_store_id;

        $this->authorizeStoreAccess($request, $returnStoreId, $booking, 'return_bike');

        if ($booking->status !== BookingStatus::HANDED_OVER) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => "Booking must be in 'handed_over' status to process return. Current status: '{$booking->status->value}'.",
                'errors' => null,
            ], 422);
        }

        // Calculate late fee
        if ($request->filled('late_fee_override')) {
            $lateFee = max(0.0, (float) $request->validated('late_fee_override'));
        } else {
            $scheduledEnd = Carbon::parse($booking->end_date)->endOfDay();
            if (now()->greaterThan($scheduledEnd)) {
                $overdueDays = max(1, (int) ceil($scheduledEnd->diffInHours(now()) / 24));
                $dailyRate = (float) ($booking->bike->base_daily_rate ?? $booking->bike->category?->base_daily_rate ?? 500.0);
                $lateFee = round($overdueDays * $dailyRate, 2);
            } else {
                $lateFee = 0.0;
            }
        }

        $damageFee = max(0.0, (float) $request->validated('damage_fee', 0.0));
        $odometerReading = (int) $request->validated('odometer_reading');

        // Store condition photos
        $photoPaths = [];
        if ($request->hasFile('condition_photos')) {
            foreach ($request->file('condition_photos') as $photoFile) {
                if ($photoFile instanceof UploadedFile) {
                    $photoPaths[] = $photoFile->store('condition/return');
                }
            }
        }

        // Mark returned in BookingService (which updates bike.current_store_id and bike status to AVAILABLE)
        $bookingService->markReturned(
            booking: $booking,
            odometerReading: $odometerReading,
            lateFee: $lateFee,
            damageFee: $damageFee,
            notes: $request->validated('notes'),
            photoPaths: $photoPaths,
            staffId: $request->user()->id,
            returnStoreId: $returnStoreId
        );

        // Process security deposit refund
        if ((float) $booking->deposit_amount > 0) {
            $refund = $refundService->createDepositRefund(
                booking: $booking,
                damageDeductions: $damageFee,
                lateFeeDeductions: $lateFee,
                reason: 'Deposit refund after return inspection',
                processedBy: $request->user()->id
            );

            if ($request->filled('deposit_refund_amount')) {
                $overrideDepositRefund = round(max(0.0, (float) $request->validated('deposit_refund_amount')), 2);
                $refund->update([
                    'amount' => $overrideDepositRefund,
                ]);
            }
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $returnStoreId,
            'action' => 'booking_returned',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'odometer_reading' => $odometerReading,
                'late_fee' => $lateFee,
                'damage_fee' => $damageFee,
                'returning_store_id' => $returnStoreId,
                'status' => 'returned',
                'photos_count' => count($photoPaths),
            ],
        ]);

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds', 'user']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Bike returned, inspection recorded, and deposit refund processed successfully.',
        ]);
    }
}

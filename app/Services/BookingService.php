<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BikeConditionStage;
use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Exceptions\InvalidBookingTransitionException;
use App\Models\BikeConditionLog;
use App\Models\BikeConditionPhoto;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class BookingService
{
    /**
     * Transition booking from HELD to PENDING_PAYMENT (online checkout initiated).
     */
    public function markPendingPayment(Booking $booking): Booking
    {
        $this->ensureCurrentStatus($booking, [BookingStatus::HELD], BookingStatus::PENDING_PAYMENT);

        // Expired holds must not enter payment even when the expiry job has
        // not yet changed the stored booking status.
        if ($booking->held_until !== null && $booking->held_until->lte(now())) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'booking' => 'This reservation hold has expired. Please reserve a bike again.',
            ]);
        }

        $booking->update([
            'status' => BookingStatus::PENDING_PAYMENT,
        ]);

        return $booking->refresh();
    }

    /**
     * Transition booking to CONFIRMED once payment is verified or collected.
     */
    public function confirmPayment(
        Booking $booking,
        ?string $gatewayReference = null,
        ?int $collectedBy = null
    ): Booking {
        $this->ensureCurrentStatus(
            $booking,
            [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT],
            BookingStatus::CONFIRMED
        );

        $booking->update([
            'status' => BookingStatus::CONFIRMED,
        ]);

        // Notify only after payment and booking state have been committed.
        DB::afterCommit(static function () use ($booking): void {
            try {
                $booking->user?->notify(new \App\Notifications\BookingConfirmationNotification($booking));
            } catch (\Throwable $exception) {
                \Illuminate\Support\Facades\Log::error('Booking confirmation notification failed', [
                    'booking_id' => $booking->id,
                    'error' => $exception->getMessage(),
                ]);
            }

            // Alert SuperAdmin + Assigned Branch (store.whatsapp & store.email) via WhatsApp & Email
            try {
                // 1. SuperAdmin users
                $superAdmins = \App\Models\User::query()
                    ->where('role', \App\Enums\UserRole::SUPER_ADMIN)
                    ->where('status', \App\Enums\UserStatus::ACTIVE)
                    ->get();

                foreach ($superAdmins as $admin) {
                    try {
                        $admin->notify(new \App\Notifications\BikeManagerBookingAlertNotification($booking));
                    } catch (\Throwable) {
                    }
                }

                // 2. Branch managers assigned to pickup store
                $managers = \App\Models\User::query()
                    ->where('role', \App\Enums\UserRole::STORE_MANAGER)
                    ->where('status', \App\Enums\UserStatus::ACTIVE)
                    ->whereHas('stores', fn ($q) => $q->where('stores.id', $booking->pickup_store_id))
                    ->get();

                foreach ($managers as $manager) {
                    try {
                        $manager->notify(new \App\Notifications\BikeManagerBookingAlertNotification($booking));
                    } catch (\Throwable) {
                    }
                }

                // 3. Direct assigned branch desk (store.email & store.whatsapp)
                $store = $booking->pickupStore;
                if ($store && ($store->email || $store->whatsapp || $store->phone)) {
                    $deskRoute = Notification::route('mail', $store->email ?: 'contact@whizwheels.in');
                    $phone = $store->whatsapp ?: $store->phone;
                    if (! empty($phone)) {
                        $deskRoute->route('whatsapp', (string) $phone);
                    }
                    $deskRoute->notify(new \App\Notifications\BikeManagerBookingAlertNotification($booking));
                }
            } catch (\Throwable $exception) {
                \Illuminate\Support\Facades\Log::warning('Bike booking manager alert lookup failed', [
                    'booking_id' => $booking->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        });

        return $booking->refresh();
    }

    /**
     * Transition booking to HANDED_OVER when the customer receives the bike.
     * Flips the bike status to ON_RENT, updates odometer reading, and records inspection.
     *
     * @param  list<string>  $photoPaths
     */
    public function markHandedOver(
        Booking $booking,
        int $odometerReading,
        ?string $signaturePath = null,
        ?string $notes = null,
        array $photoPaths = [],
        ?int $staffId = null,
        bool $complianceOverride = false,
        ?string $overrideReason = null
    ): Booking {
        $this->ensureCurrentStatus($booking, [BookingStatus::CONFIRMED], BookingStatus::HANDED_OVER);

        $updated = DB::transaction(function () use (
            $booking,
            $odometerReading,
            $signaturePath,
            $notes,
            $photoPaths,
            $staffId,
            $complianceOverride,
            $overrideReason
        ): Booking {
            // Lock the booking as well as its bike. A stale Eloquent instance
            // must not authorize a duplicate inspection after first handover.
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $this->ensureCurrentStatus($booking, [BookingStatus::CONFIRMED], BookingStatus::HANDED_OVER);

            // A paid ₹100 advance does not settle the remaining balance.
            // Check inside the same transaction as the physical handover.
            if (($booking->price_breakdown_json['checkout_payment_option'] ?? null) === 'advance'
                && BikeBookingPayments::remainder($booking) > 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'payment' => 'Collect the remaining rental balance before handing over this bike.',
                ]);
            }

            $bike = \App\Models\Bike::where('id', $booking->bike_id)->lockForUpdate()->firstOrFail();

            if (! $complianceOverride) {
                app(BikeComplianceGate::class)->assertReadyForHandover($bike);
            } else {
                \App\Models\ActivityLog::create([
                    'user_id' => $staffId,
                    'store_id' => $booking->pickup_store_id,
                    'action' => 'handover.compliance_override',
                    'subject_type' => Booking::class,
                    'subject_id' => $booking->id,
                    'new_values' => [
                        'bike_id' => $bike->id,
                        'registration_number' => $bike->registration_number,
                        'override_reason' => $overrideReason,
                        'compliance_issues' => app(BikeComplianceGate::class)->problems($bike),
                    ],
                ]);
            }

            if ($odometerReading < (int) $bike->odometer_reading) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'odometer_reading' => 'Handover odometer cannot be lower than the recorded reading.',
                ]);
            }

            $booking->update([
                'status' => BookingStatus::HANDED_OVER,
                'agreement_signed_at' => now(),
                'agreement_signature_path' => $signaturePath ?? $booking->agreement_signature_path,
            ]);

            // Flip bike status to ON_RENT and record odometer
            $bike->update([
                'status' => BikeStatus::ON_RENT,
                'odometer_reading' => $odometerReading,
            ]);

            // Record condition log
            $log = BikeConditionLog::create([
                'booking_id' => $booking->id,
                'stage' => BikeConditionStage::HANDOVER,
                'odometer_reading' => $odometerReading,
                'notes' => $notes,
                'logged_by' => $staffId,
            ]);

            foreach ($photoPaths as $path) {
                BikeConditionPhoto::create([
                    'bike_condition_log_id' => $log->id,
                    'file_path' => $path,
                ]);
            }

            return $booking->refresh();
        });

        // Preserve the established caller contract: successful operations
        // update the original Eloquent instance used by staff controllers.
        $booking->refresh();
        return $updated;
    }

    /**
     * Transition booking to RETURNED when the bike is physically returned.
     * Flips the bike back to AVAILABLE, relocates it to the return store, updates odometer, and records return condition.
     *
     * @param  list<string>  $photoPaths
     */
    public function markReturned(
        Booking $booking,
        int $odometerReading,
        float $lateFee = 0.0,
        float $damageFee = 0.0,
        ?string $notes = null,
        array $photoPaths = [],
        ?int $staffId = null,
        ?int $returnStoreId = null
    ): Booking {
        $this->ensureCurrentStatus($booking, [BookingStatus::HANDED_OVER], BookingStatus::RETURNED);

        $updated = DB::transaction(function () use (
            $booking,
            $odometerReading,
            $lateFee,
            $damageFee,
            $notes,
            $photoPaths,
            $staffId,
            $returnStoreId
        ): Booking {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $this->ensureCurrentStatus($booking, [BookingStatus::HANDED_OVER], BookingStatus::RETURNED);
            if (! is_finite($lateFee) || ! is_finite($damageFee) || $lateFee < 0 || $damageFee < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'fees' => 'Return charges must be finite, non-negative amounts.',
                ]);
            }

            $bike = \App\Models\Bike::where('id', $booking->bike_id)->lockForUpdate()->firstOrFail();

            $actualReturnStoreId = $returnStoreId ?? $booking->return_store_id;
            if ($odometerReading < (int) $bike->odometer_reading) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'odometer_reading' => 'Return odometer cannot be lower than the handover reading.',
                ]);
            }
            $receivingStore = \App\Models\Store::findOrFail($actualReturnStoreId);
            if ($receivingStore->status !== \App\Enums\StoreStatus::ACTIVE) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'return_store_id' => 'The receiving branch must be active.',
                ]);
            }
            $newTotal = round((float) $booking->total_amount + $lateFee + $damageFee, 2);

            $booking->update([
                'status' => BookingStatus::RETURNED,
                'return_store_id' => $actualReturnStoreId,
                'late_fee_amount' => round($lateFee, 2),
                'damage_fee_amount' => round($damageFee, 2),
                'total_amount' => $newTotal,
                'completed_by' => $staffId ?? $booking->completed_by,
            ]);

            // A returned bike must not be published as rentable until current
            // insurance, PUC, RC and maintenance are actually verified.
            $complianceIssues = app(BikeComplianceGate::class)->problems($bike);
            $bike->update([
                'status' => $complianceIssues === [] ? BikeStatus::AVAILABLE : BikeStatus::MAINTENANCE,
                'current_store_id' => $actualReturnStoreId,
                'odometer_reading' => $odometerReading,
            ]);

            // Flag the first future pickup that the unexpected physical location
            // would prevent. Do not cancel the customer booking or invent a transfer.
            $affected = app(BikeLocationSchedule::class)->firstUnfulfillableReservation($bike);
            if ($affected !== null) {
                \App\Models\BikeRelocationTask::firstOrCreate(
                    ['affected_booking_id' => $affected->id, 'status' => 'open'],
                    [
                        'bike_id' => $bike->id,
                        'triggering_booking_id' => $booking->id,
                        'from_store_id' => $actualReturnStoreId,
                        'required_store_id' => $affected->pickup_store_id,
                    ]
                );
            }

            // Record return condition log
            $log = BikeConditionLog::create([
                'booking_id' => $booking->id,
                'stage' => BikeConditionStage::RETURN,
                'odometer_reading' => $odometerReading,
                'notes' => $notes,
                'logged_by' => $staffId,
            ]);

            foreach ($photoPaths as $path) {
                BikeConditionPhoto::create([
                    'bike_condition_log_id' => $log->id,
                    'file_path' => $path,
                ]);
            }

            return $booking->refresh();
        });

        // Preserve the established caller contract: successful operations
        // update the original Eloquent instance used by staff controllers.
        $booking->refresh();
        return $updated;
    }

    /**
     * Transition booking to COMPLETED after deposit refunds and financial reconciliation are closed.
     */
    public function complete(Booking $booking, ?int $staffId = null): Booking
    {
        $this->ensureCurrentStatus($booking, [BookingStatus::RETURNED], BookingStatus::COMPLETED);

        $booking->update([
            'status' => BookingStatus::COMPLETED,
            'completed_by' => $staffId ?? $booking->completed_by,
        ]);

        return $booking->refresh();
    }

    /**
     * Cancel an active reservation before handover.
     */
    public function cancel(Booking $booking, string $reason = '', ?int $cancelledBy = null): Booking
    {
        $this->ensureCurrentStatus(
            $booking,
            [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT, BookingStatus::CONFIRMED],
            BookingStatus::CANCELLED
        );

        $booking->update([
            'status' => BookingStatus::CANCELLED,
        ]);

        return $booking->refresh();
    }

    /**
     * Mark an abandoned checkout or unfulfilled hold as EXPIRED.
     */
    public function expire(Booking $booking): Booking
    {
        $this->ensureCurrentStatus(
            $booking,
            [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT],
            BookingStatus::EXPIRED
        );

        $booking->update([
            'status' => BookingStatus::EXPIRED,
        ]);

        return $booking->refresh();
    }

    /**
     * Mark a confirmed booking as NO_SHOW if customer failed to arrive for pickup.
     */
    public function markNoShow(Booking $booking, ?int $staffId = null): Booking
    {
        $this->ensureCurrentStatus($booking, [BookingStatus::CONFIRMED], BookingStatus::NO_SHOW);

        $booking->update([
            'status' => BookingStatus::NO_SHOW,
            'completed_by' => $staffId ?? $booking->completed_by,
        ]);

        return $booking->refresh();
    }

    /**
     * Extend an active booking with a new end date.
     *
     * @throws InvalidBookingTransitionException
     * @throws \App\Exceptions\BikeNotAvailableException
     * @throws \InvalidArgumentException
     */
    public function extend(
        Booking $booking,
        string $newEndDate,
        AvailabilityService $availabilityService,
        PricingService $pricingService
    ): Booking {
        $this->ensureCurrentStatus($booking, [BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER], BookingStatus::CONFIRMED);

        return DB::transaction(function () use (
            $booking,
            $newEndDate,
            $availabilityService,
            $pricingService
        ): Booking {
            // Concurrency safety: acquire row-level lock on bike before checking availability & updating
            $bike = \App\Models\Bike::where('id', $booking->bike_id)->lockForUpdate()->firstOrFail();

            $currentEnd = \Carbon\Carbon::parse($booking->end_date)->startOfDay();
            $targetEnd = \Carbon\Carbon::parse($newEndDate)->startOfDay();

            if ($targetEnd->lte($currentEnd)) {
                throw new \InvalidArgumentException('New end date must be after current end date.');
            }

            $extensionStart = $currentEnd->copy()->addDay()->toDateString();
            $targetEndString = $targetEnd->toDateString();

            $isAvailable = $availabilityService->checkAvailability(
                bike: $bike,
                startDate: $extensionStart,
                endDate: $targetEndString,
                excludeBookingId: $booking->id
            );

            if (! $isAvailable) {
                throw new \App\Exceptions\BikeNotAvailableException('The bike is not available for the requested extension dates.');
            }

            $extensionQuote = $pricingService->calculateQuote(
                bike: $bike,
                startDate: $extensionStart,
                endDate: $targetEndString,
                pickupStore: $booking->return_store_id,
                returnStore: $booking->return_store_id
            );

            $additionalRental = (float) ($extensionQuote['price_breakdown_json']['rental_subtotal'] ?? $extensionQuote['base_amount']);
            $newTotal = round((float) $booking->total_amount + $additionalRental, 2);
            $newBase = round((float) $booking->base_amount + (float) $extensionQuote['base_amount'], 2);

            $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : [];
            $extensions = $breakdown['extensions'] ?? [];
            $extensions[] = [
                'previous_end_date' => $booking->end_date,
                'new_end_date' => $targetEndString,
                'extension_quote' => $extensionQuote,
                'extended_at' => now()->toIso8601String(),
            ];
            $breakdown['extensions'] = $extensions;

            $booking->update([
                'end_date' => $targetEndString,
                'base_amount' => $newBase,
                'total_amount' => $newTotal,
                'price_breakdown_json' => $breakdown,
            ]);

            return $booking->refresh();
        });
    }

    /**
     * Validate that the booking's current status allows the target transition.
     *
     * @param  list<BookingStatus>  $allowedStatuses
     *
     * @throws InvalidBookingTransitionException
     */
    protected function ensureCurrentStatus(
        Booking $booking,
        array $allowedStatuses,
        BookingStatus $targetStatus
    ): void {
        $current = $booking->status;

        if (! in_array($current, $allowedStatuses, true)) {
            throw InvalidBookingTransitionException::make($booking, $targetStatus);
        }
    }
}

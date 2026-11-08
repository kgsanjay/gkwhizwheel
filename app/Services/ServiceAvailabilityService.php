<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceItemNotAvailableException;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceAvailabilityService
{
    /**
     * Check if a service item is available for a given datetime window.
     */
    public function checkAvailability(
        int|ServiceItem $serviceItem,
        CarbonInterface|string $startDateTime,
        CarbonInterface|string|null $endDateTime = null,
        int $quantity = 1,
        ?int $excludeBookingId = null
    ): bool {
        $item = $serviceItem instanceof ServiceItem ? $serviceItem : ServiceItem::findOrFail($serviceItem);

        return $item->checkAvailability(
            startDateTime: $startDateTime,
            endDateTime: $endDateTime,
            requestedQuantity: $quantity,
            excludeBookingId: $excludeBookingId
        );
    }

    /**
     * Create a concurrency-safe temporary hold on a ServiceBooking with row-level locking.
     * Mirrors AvailabilityService::holdBooking() for bikes.
     *
     * @param array<string, mixed> $params
     * @throws ServiceItemNotAvailableException
     */
    public function holdServiceBooking(array $params): ServiceBooking
    {
        $idempotencyKey = $params['idempotency_key'] ?? null;

        // An idempotency key must not disclose or reuse another customer's booking.
        if (! empty($idempotencyKey)) {
            $existing = ServiceBooking::where('idempotency_key', $idempotencyKey)->first();
            if ($existing !== null) {
                $matches = (int) $existing->user_id === (int) ($params['user_id'] ?? 0)
                    && (int) ($existing->service_item_id ?? 0) === (int) ($params['service_item_id'] ?? 0)
                    && $existing->service_type === (string) ($params['service_type'] ?? '')
                    && (int) $existing->quantity === (int) ($params['quantity'] ?? 1)
                    && $existing->start_datetime?->toDateTimeString() === Carbon::parse($params['start_datetime'])->toDateTimeString()
                    && (($existing->end_datetime === null && empty($params['end_datetime']))
                        || ($existing->end_datetime !== null && ! empty($params['end_datetime'])
                            && $existing->end_datetime->toDateTimeString() === Carbon::parse($params['end_datetime'])->toDateTimeString()));
                if (! $matches) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'idempotency_key' => 'This request key was already used for a different service booking.',
                    ]);
                }
                return $existing;
            }
        }

        $serviceItemId = $params['service_item_id'] ?? null;
        $serviceType = (string) $params['service_type'];
        $startDateTime = $params['start_datetime'];
        $endDateTime = $params['end_datetime'] ?? null;
        $quantity = (int) ($params['quantity'] ?? 1);

        return DB::transaction(function () use (
            $serviceItemId,
            $serviceType,
            $startDateTime,
            $endDateTime,
            $quantity,
            $idempotencyKey,
            $params
        ): ServiceBooking {
            $item = null;
            if (! empty($serviceItemId)) {
                // Acquire row-level lock on the specific ServiceItem
                $item = ServiceItem::where('id', (int) $serviceItemId)->lockForUpdate()->firstOrFail();
            } else {
                // If no specific item ID, lock the first available item of this service type
                $item = ServiceItem::where('service_type', $serviceType)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->first();
            }

            // Recheck after acquiring the inventory lock: two simultaneous
            // requests with the same key must never create duplicate holds.
            if (! empty($idempotencyKey)) {
                $existing = ServiceBooking::where('idempotency_key', $idempotencyKey)->first();
                if ($existing !== null) {
                    $matches = (int) $existing->user_id === (int) ($params['user_id'] ?? 0)
                        && (int) ($existing->service_item_id ?? 0) === (int) ($params['service_item_id'] ?? 0)
                        && $existing->service_type === $serviceType
                        && (int) $existing->quantity === $quantity
                        && $existing->start_datetime?->toDateTimeString() === Carbon::parse($startDateTime)->toDateTimeString()
                        && (($existing->end_datetime === null && empty($endDateTime))
                            || ($existing->end_datetime !== null && ! empty($endDateTime)
                                && $existing->end_datetime->toDateTimeString() === Carbon::parse($endDateTime)->toDateTimeString()));
                    if (! $matches) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'idempotency_key' => 'This request key was already used for a different service booking.',
                        ]);
                    }
                    return $existing;
                }
            }

            if ($item !== null) {
                // Check status
                if (! $item->isAvailable()) {
                    throw new ServiceItemNotAvailableException(
                        "Service item '{$item->name}' is currently unavailable ({$item->status})."
                    );
                }

                // Check live availability against overlapping active/held bookings
                $isAvailable = $item->checkAvailability(
                    startDateTime: $startDateTime,
                    endDateTime: $endDateTime,
                    requestedQuantity: $quantity
                );

                if (! $isAvailable) {
                    throw new ServiceItemNotAvailableException(
                        "Service item '{$item->name}' is not available for the requested time or capacity is exhausted."
                    );
                }

                $params['service_item_id'] = $item->id;
            }

            // Generate unique human-readable booking reference if not provided
            if (empty($params['booking_number'])) {
                $params['booking_number'] = $this->generateBookingNumber($serviceType);
            }

            // Enforce hold status and 10-minute hold window (mirroring bike booking hold)
            $params['status'] = 'held';
            $params['held_until'] = now()->addMinutes(10);
            if (! empty($idempotencyKey)) {
                $params['idempotency_key'] = $idempotencyKey;
            }

            return ServiceBooking::create($params);
        });
    }

    /**
     * Create a confirmed or instant service booking under row-level lock.
     *
     * @param array<string, mixed> $params
     * @throws ServiceItemNotAvailableException
     */
    public function createServiceBooking(array $params): ServiceBooking
    {
        app(ServiceBookingLifecycle::class)->assertCreation($params);
        $idempotencyKey = $params['idempotency_key'] ?? null;

        if (! empty($idempotencyKey)) {
            $existing = ServiceBooking::where('idempotency_key', $idempotencyKey)->first();
            if ($existing !== null) {
                return $existing;
            }
        }

        $serviceItemId = $params['service_item_id'] ?? null;
        $serviceType = (string) $params['service_type'];
        $startDateTime = $params['start_datetime'];
        $endDateTime = $params['end_datetime'] ?? null;
        $quantity = (int) ($params['quantity'] ?? 1);

        return DB::transaction(function () use (
            $serviceItemId,
            $serviceType,
            $startDateTime,
            $endDateTime,
            $quantity,
            $params
        ): ServiceBooking {
            $item = null;
            if (! empty($serviceItemId)) {
                $item = ServiceItem::where('id', (int) $serviceItemId)->lockForUpdate()->firstOrFail();
            } else {
                $item = ServiceItem::where('service_type', $serviceType)
                    ->where('status', 'available')
                    ->lockForUpdate()
                    ->first();
            }

            if ($item !== null) {
                if (! $item->isAvailable()) {
                    throw new ServiceItemNotAvailableException(
                        "Service item '{$item->name}' is currently unavailable ({$item->status})."
                    );
                }

                $isAvailable = $item->checkAvailability(
                    startDateTime: $startDateTime,
                    endDateTime: $endDateTime,
                    requestedQuantity: $quantity
                );

                if (! $isAvailable) {
                    throw new ServiceItemNotAvailableException(
                        "Service item '{$item->name}' is not available for the requested time or capacity is exhausted."
                    );
                }

                $params['service_item_id'] = $item->id;
            }

            if (empty($params['booking_number'])) {
                $params['booking_number'] = $this->generateBookingNumber($serviceType);
            }

            $booking = ServiceBooking::create($params);

            if ($item !== null && in_array($booking->status, ['confirmed', 'in_progress'], true)) {
                $now = now();
                $start = Carbon::parse($startDateTime);
                $end = $endDateTime ? Carbon::parse($endDateTime) : $start->copy()->endOfDay();
                if ($now->between($start, $end)) {
                    $item->decrementAvailability($quantity);
                }
            }

            return $booking;
        });
    }

    /**
     * Transition a held or pending booking to confirmed with row-level locking.
     * Mirrors confirm booking flow in bike booking lifecycle.
     *
     * @throws ServiceItemNotAvailableException
     */
    public function confirmServiceBooking(int|ServiceBooking $booking): ServiceBooking
    {
        $bookingModel = $booking instanceof ServiceBooking ? $booking : ServiceBooking::findOrFail($booking);

        return DB::transaction(function () use ($bookingModel): ServiceBooking {
            $bookingModel = ServiceBooking::whereKey($bookingModel->id)->lockForUpdate()->firstOrFail();
            if ($message = app(ServiceReservationReadiness::class)->issue($bookingModel)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['resources' => $message]);
            }
            if ($bookingModel->status === 'confirmed') {
                return $bookingModel;
            }
            app(ServiceBookingLifecycle::class)->assertTransition($bookingModel, 'confirmed');
            if ($bookingModel->service_item_id) {
                $item = ServiceItem::where('id', $bookingModel->service_item_id)->lockForUpdate()->firstOrFail();

                if (! $item->isAvailable() && $bookingModel->status !== 'confirmed') {
                    throw new ServiceItemNotAvailableException(
                        "Service item '{$item->name}' is currently unavailable ({$item->status})."
                    );
                }

                $isAvailable = $item->checkAvailability(
                    startDateTime: $bookingModel->start_datetime,
                    endDateTime: $bookingModel->end_datetime,
                    requestedQuantity: (int) $bookingModel->quantity,
                    excludeBookingId: $bookingModel->id
                );

                if (! $isAvailable && $bookingModel->status !== 'confirmed') {
                    throw new ServiceItemNotAvailableException(
                        "Service item '{$item->name}' has no available capacity for the requested booking window."
                    );
                }

                $now = now();
                $start = Carbon::parse($bookingModel->start_datetime);
                $end = $bookingModel->end_datetime ? Carbon::parse($bookingModel->end_datetime) : $start->copy()->endOfDay();
                if ($now->between($start, $end)) {
                    $item->decrementAvailability((int) $bookingModel->quantity);
                }
            }

            $bookingModel->update([
                'status' => 'confirmed',
                'held_until' => null,
            ]);

            return $bookingModel->refresh();
        });
    }

    /**
     * Release expired held service bookings back to available.
     * Mirrors AvailabilityService::releaseExpiredHolds() for bikes.
     */
    public function releaseExpiredServiceHolds(): int
    {
        $released = 0;
        ServiceBooking::query()->where('status', 'held')
            ->whereNotNull('held_until')->where('held_until', '<=', now())
            ->orderBy('id')->chunkById(100, function ($holds) use (&$released): void {
                foreach ($holds as $hold) {
                    DB::transaction(function () use ($hold, &$released): void {
                        $locked = ServiceBooking::whereKey($hold->id)->lockForUpdate()->first();
                        if ($locked === null || $locked->status !== 'held'
                            || $locked->held_until === null || $locked->held_until->isFuture()) {
                            return;
                        }
                        app(ServiceBookingLifecycle::class)->assertTransition($locked, 'expired');
                        $locked->update(['status' => 'expired']);
                        \App\Models\ActivityLog::create([
                            'user_id' => null,
                            'store_id' => $locked->store_id,
                            'action' => 'service_booking.hold_expired',
                            'subject_type' => ServiceBooking::class,
                            'subject_id' => (string) $locked->id,
                            'old_values' => ['status' => 'held'],
                            'new_values' => ['status' => 'expired'],
                        ]);
                        $released++;
                    });
                }
            });
        return $released;
    }

    /**
     * Generate human-readable service booking number.
     */
    protected function generateBookingNumber(string $serviceType): string
    {
        $prefix = match ($serviceType) {
            'two_wheelers' => 'TW',
            'taxi' => 'TX',
            'boating' => 'BT',
            'scuba' => 'SC',
            'homestay' => 'HS',
            'guide' => 'GD',
            'tours' => 'TR',
            default => 'SRV',
        };
        $dateCode = Carbon::now()->format('ymd');
        $randomCode = strtoupper(Str::random(4));

        return "GKW-{$prefix}-{$dateCode}-{$randomCode}";
    }
}

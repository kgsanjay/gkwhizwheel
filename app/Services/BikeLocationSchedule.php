<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Bike;
use App\Models\Booking;
use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Conservative, date-level physical location forecast for a single bike.
 *
 * Project active reservations in chronological order from the bike's physical
 * location. A proposed booking must fit into that sequence WITHOUT invalidating
 * an existing later customer's scheduled pickup location.
 *
 * Booking dates are inclusive; a same-day return and pickup is not supported.
 * This does not schedule manual fleet transfers or guarantee physical returns.
 */
class BikeLocationSchedule
{
    public function canReserve(
        Bike $bike,
        CarbonInterface|string $startDate,
        CarbonInterface|string $endDate,
        int $pickupStoreId,
        int $returnStoreId,
        ?int $excludeBookingId = null
    ): bool {
        $start = Carbon::parse($startDate)->toDateString();
        $end = Carbon::parse($endDate)->toDateString();

        if ($end < $start || ! $bike->current_store_id) {
            return false;
        }

        // Old, completed or cancelled bookings have already been reflected in
        // current_store_id (or are no longer reservations); do not replay them.
        $bookings = Booking::query()
            ->where('bike_id', $bike->id)
            ->where('end_date', '>=', now()->startOfDay()->toDateString())
            ->where(function ($query): void {
                $query->whereIn('status', [
                    BookingStatus::CONFIRMED->value,
                    BookingStatus::HANDED_OVER->value,
                ])->orWhere(function ($held): void {
                    $held->whereIn('status', [
                        BookingStatus::HELD->value,
                        BookingStatus::PENDING_PAYMENT->value,
                    ])->where(function ($notExpired): void {
                        $notExpired->whereNull('held_until')
                            ->orWhere('held_until', '>', now());
                    });
                });
            })
            ->when($excludeBookingId !== null, fn ($query) => $query->where('id', '!=', $excludeBookingId))
            ->orderBy('start_date')
            ->orderBy('id')
            ->get();

        $schedule = $bookings->map(static fn (Booking $booking): array => [
            'id' => $booking->id,
            'start' => $booking->start_date->toDateString(),
            'end' => $booking->end_date->toDateString(),
            'pickup' => (int) $booking->pickup_store_id,
            'return' => (int) $booking->return_store_id,
        ])->all();

        $schedule[] = [
            'id' => PHP_INT_MAX,
            'start' => $start,
            'end' => $end,
            'pickup' => $pickupStoreId,
            'return' => $returnStoreId,
        ];

        usort($schedule, static fn (array $a, array $b): int =>
            [$a['start'], $a['id']] <=> [$b['start'], $b['id']]
        );

        $expectedStore = (int) $bike->current_store_id;
        $lastEnd = null;

        foreach ($schedule as $reservation) {
            if (($lastEnd !== null && $reservation['start'] <= $lastEnd)
                || $reservation['pickup'] !== $expectedStore) {
                return false;
            }

            $lastEnd = $reservation['end'];
            $expectedStore = $reservation['return'];
        }

        return true;
    }
}

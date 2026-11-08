<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceBooking;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Optional resource-level locking foundation for future service-specific modules.
 * Existing ServiceItem booking logic remains unchanged until migrated explicitly.
 * All allocation writers MUST use this service for row-locked capacity checks.
 */
final class ServiceResourceAllocator
{
    public function allocate(
        ServiceResource|int $resource,
        ServiceBooking|int $booking,
        string $startsAt,
        string $endsAt,
        int $quantity = 1,
        string $status = 'held'
    ): ServiceResourceAllocation {
        if (! in_array($status, ['held', 'confirmed'], true) || $quantity < 1) {
            throw ValidationException::withMessages(['quantity' => 'Invalid allocation quantity or status.']);
        }

        $start = Carbon::parse($startsAt);
        $end = Carbon::parse($endsAt);
        if (! $start->lt($end)) {
            throw ValidationException::withMessages(['ends_at' => 'End time must follow start time.']);
        }

        $resourceId = $resource instanceof ServiceResource ? $resource->id : $resource;
        $bookingId = $booking instanceof ServiceBooking ? $booking->id : $booking;

        return DB::transaction(function () use ($resourceId, $bookingId, $start, $end, $quantity, $status): ServiceResourceAllocation {
            $locked = ServiceResource::whereKey($resourceId)->lockForUpdate()->firstOrFail();
            $reservation = ServiceBooking::whereKey($bookingId)->firstOrFail();

            if ($locked->status !== 'available' || $locked->capacity_units < 1) {
                throw ValidationException::withMessages(['resource' => 'Resource is not approved or available.']);
            }
            if ($locked->service_item_id !== $reservation->service_item_id
                || $locked->serviceItem?->service_type !== $reservation->service_type
                || ($locked->store_id !== null && $locked->store_id !== $reservation->store_id)) {
                throw ValidationException::withMessages(['resource' => 'Resource does not belong to the booking service or branch.']);
            }
            if (in_array($reservation->status, ['cancelled', 'completed', 'expired'], true)) {
                throw ValidationException::withMessages(['booking' => 'Cannot allocate a closed booking.']);
            }

            $existing = ServiceResourceAllocation::where('service_resource_id', $locked->id)
                ->where('service_booking_id', $reservation->id)->lockForUpdate()->first();
            if ($existing) {
                if ($existing->starts_at->equalTo($start) && $existing->ends_at->equalTo($end)
                    && $existing->quantity === $quantity && $existing->status === $status) {
                    return $existing;
                }
                throw ValidationException::withMessages(['booking' => 'This booking already has a different allocation for the resource.']);
            }

            // Half-open intervals [start, end): checkout at 11 AM allows the next
            // check-in at 11 AM; overlapping bookings must not exceed capacity.
            $reserved = (int) ServiceResourceAllocation::where('service_resource_id', $locked->id)
                ->where('starts_at', '<', $end)
                ->where('ends_at', '>', $start)
                ->where(function ($q): void {
                    $q->where('status', 'confirmed')
                        ->orWhere(function ($held): void {
                            $held->where('status', 'held')
                                ->where(function ($expiry): void {
                                    $expiry->whereNull('held_until')->orWhere('held_until', '>', now());
                                });
                        });
                })
                // Under MySQL REPEATABLE READ, a plain SUM can use an older
                // consistent snapshot created by earlier eligibility queries.
                // This current locking read must see allocations committed
                // by a competing worker after our resource row lock releases.
                ->lockForUpdate()
                ->get(['quantity'])
                ->sum('quantity');

            if ($reserved + $quantity > $locked->capacity_units) {
                throw ValidationException::withMessages(['resource' => 'Resource capacity is unavailable for those times.']);
            }

            return ServiceResourceAllocation::create([
                'service_resource_id' => $locked->id,
                'service_booking_id' => $reservation->id,
                'starts_at' => $start,
                'ends_at' => $end,
                'quantity' => $quantity,
                'status' => $status,
                'held_until' => $status === 'held' ? now()->addMinutes(10) : null,
            ]);
        });
    }
}

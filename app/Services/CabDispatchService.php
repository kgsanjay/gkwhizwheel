<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CabDispatch;
use App\Models\CabDispatchEvent;
use App\Models\CabDriver;
use App\Models\CabVehicle;
use App\Models\ServiceBooking;
use App\Models\ServiceResourceAllocation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Serializes paired cab vehicle/driver reservations under one DB transaction.
 * Never creates a customer booking or verifies a payment. Works only with
 * independently confirmed, priced and inventory-backed taxi reservations.
 */
final class CabDispatchService
{
    public function __construct(
        private readonly ServiceResourceAllocator $allocator,
        private readonly CabDispatchEligibility $eligibility,
        private readonly ServiceBookingLifecycle $lifecycle
    ) {}

    public function assign(
        ServiceBooking|int $booking,
        CabVehicle|int $vehicle,
        CabDriver|int $driver,
        User $actor,
        ?string $notes = null
    ): CabDispatch {
        $bookingId = $booking instanceof ServiceBooking ? $booking->id : $booking;
        $vehicleId = $vehicle instanceof CabVehicle ? $vehicle->id : $vehicle;
        $driverId = $driver instanceof CabDriver ? $driver->id : $driver;

        return DB::transaction(function () use ($bookingId, $vehicleId, $driverId, $actor, $notes): CabDispatch {
            $reservation = ServiceBooking::whereKey($bookingId)->lockForUpdate()->firstOrFail();
            $this->authorize($actor, $reservation);
            if ($reservation->service_type !== 'taxi'
                || $reservation->status !== 'confirmed'
                || ! $reservation->service_item_id
                || (float) $reservation->total_amount <= 0
                || $reservation->start_datetime === null
                || $reservation->end_datetime === null
                || ! $reservation->start_datetime->isFuture()
                || ! $reservation->end_datetime->gt($reservation->start_datetime)) {
                throw ValidationException::withMessages([
                    'booking' => 'Only future, fully scheduled and approved confirmed cab bookings can be assigned.',
                ]);
            }
            // Prevent legacy/client status-only confirmations from receiving
            // resources without an accepted server-owned online quotation.
            if ($reservation->booking_channel === 'online') {
                $quote = \App\Models\ServiceQuoteSnapshot::query()
                    ->where('service_booking_id', $reservation->id)->first();
                if ($quote === null || $quote->user_id !== $reservation->user_id
                    || $quote->service_item_id !== $reservation->service_item_id
                    || round((float) $quote->total_amount, 2) !== round((float) $reservation->total_amount, 2)) {
                    throw ValidationException::withMessages([
                        'booking' => 'The accepted online cab price has not been verified.',
                    ]);
                }
            }
            if (CabDispatch::where('service_booking_id', $reservation->id)->exists()) {
                throw ValidationException::withMessages(['booking' => 'This booking already has a dispatch record.']);
            }

            $cab = CabVehicle::whereKey($vehicleId)->firstOrFail();
            $operator = CabDriver::whereKey($driverId)->firstOrFail();
            if ((int) $cab->store_id !== (int) $reservation->store_id
                || (int) $operator->store_id !== (int) $reservation->store_id
                || (int) $cab->service_item_id !== (int) $reservation->service_item_id
                || (int) $operator->service_item_id !== (int) $reservation->service_item_id
                || ! $this->eligibility->vehicle($cab)
                || ! $this->eligibility->driver($operator)) {
                throw ValidationException::withMessages([
                    'resources' => 'Select a matching, documented and active cab and driver for this branch.',
                ]);
            }
            if ((int) $cab->seats < (int) $reservation->quantity) {
                throw ValidationException::withMessages([
                    'vehicle' => 'Vehicle passenger capacity is insufficient.',
                ]);
            }
            $start = $reservation->start_datetime->toDateTimeString();
            $end = $reservation->end_datetime->toDateTimeString();
            // Lock the two resources in deterministic ID order to avoid
            // inconsistent lock ordering across simultaneous requests.
            $ids = [$cab->service_resource_id, $operator->service_resource_id];
            sort($ids, SORT_NUMERIC);
            foreach ($ids as $resourceId) {
                $this->allocator->allocate($resourceId, $reservation, $start, $end, 1, 'confirmed');
            }
            $dispatch = CabDispatch::create([
                'service_booking_id' => $reservation->id,
                'cab_vehicle_id' => $cab->id,
                'cab_driver_id' => $operator->id,
                'store_id' => $reservation->store_id,
                'assigned_by' => $actor->id,
                'starts_at' => $reservation->start_datetime,
                'ends_at' => $reservation->end_datetime,
                'operations_notes' => $notes,
                'status' => 'assigned',
            ]);
            $this->event($dispatch, $actor, null, 'assigned');
            return $dispatch;
        });
    }

    public function start(CabDispatch|int $dispatch, User $actor, ?int $odometer = null): CabDispatch
    {
        $id = $dispatch instanceof CabDispatch ? $dispatch->id : $dispatch;
        return DB::transaction(function () use ($id, $actor, $odometer): CabDispatch {
            $current = CabDispatch::whereKey($id)->lockForUpdate()->firstOrFail();
            $booking = ServiceBooking::whereKey($current->service_booking_id)->lockForUpdate()->firstOrFail();
            $this->authorize($actor, $booking);
            if ($current->status !== 'assigned' || $booking->status !== 'confirmed'
                || ! $this->eligibility->vehicle($current->vehicle)
                || ! $this->eligibility->driver($current->driver)) {
                throw ValidationException::withMessages(['dispatch' => 'Trip is not eligible to start.']);
            }
            $this->lifecycle->assertTransition($booking, 'in_progress');
            $booking->update(['status' => 'in_progress']);
            $current->update([
                'status' => 'in_progress', 'trip_started_at' => now(),
                'started_by' => $actor->id, 'start_odometer' => $odometer,
            ]);
            $this->event($current, $actor, 'assigned', 'in_progress');
            return $current->fresh();
        });
    }

    public function complete(CabDispatch|int $dispatch, User $actor, ?int $odometer = null): CabDispatch
    {
        $id = $dispatch instanceof CabDispatch ? $dispatch->id : $dispatch;
        return DB::transaction(function () use ($id, $actor, $odometer): CabDispatch {
            $current = CabDispatch::whereKey($id)->lockForUpdate()->firstOrFail();
            $booking = ServiceBooking::whereKey($current->service_booking_id)->lockForUpdate()->firstOrFail();
            $this->authorize($actor, $booking);
            if ($current->status !== 'in_progress' || $booking->status !== 'in_progress') {
                throw ValidationException::withMessages(['dispatch' => 'Only an active trip may be completed.']);
            }
            if ($odometer !== null && $current->start_odometer !== null
                && $odometer < $current->start_odometer) {
                throw ValidationException::withMessages(['odometer' => 'Arrival reading cannot precede departure.']);
            }
            $this->lifecycle->assertTransition($booking, 'completed');
            $booking->update(['status' => 'completed']);
            $current->update([
                'status' => 'completed', 'trip_completed_at' => now(),
                'closed_by' => $actor->id, 'end_odometer' => $odometer,
            ]);
            $this->releaseAllocations($current);
            $this->event($current, $actor, 'in_progress', 'completed');
            return $current->fresh();
        });
    }

    public function cancel(CabDispatch|int $dispatch, User $actor): CabDispatch
    {
        $id = $dispatch instanceof CabDispatch ? $dispatch->id : $dispatch;
        return DB::transaction(function () use ($id, $actor): CabDispatch {
            $current = CabDispatch::whereKey($id)->lockForUpdate()->firstOrFail();
            $booking = ServiceBooking::whereKey($current->service_booking_id)->lockForUpdate()->firstOrFail();
            $this->authorize($actor, $booking);
            // A trip already underway needs a separately approved incident
            // process; never silently free an active cab or driver.
            if ($current->status !== 'assigned' || $booking->status !== 'confirmed') {
                throw ValidationException::withMessages(['dispatch' => 'Active trips cannot be cancelled from dispatch.']);
            }
            $this->lifecycle->assertTransition($booking, 'cancelled');
            $booking->update(['status' => 'cancelled']);
            $current->update(['status' => 'cancelled', 'closed_by' => $actor->id]);
            $this->releaseAllocations($current);
            $this->event($current, $actor, 'assigned', 'cancelled');
            return $current->fresh();
        });
    }

    private function releaseAllocations(CabDispatch $dispatch): void
    {
        $resourceIds = [
            $dispatch->vehicle->service_resource_id,
            $dispatch->driver->service_resource_id,
        ];
        ServiceResourceAllocation::query()
            ->where('service_booking_id', $dispatch->service_booking_id)
            ->whereIn('service_resource_id', $resourceIds)
            ->where('status', 'confirmed')
            ->update(['status' => 'released']);
    }

    private function authorize(User $actor, ServiceBooking $booking): void
    {
        abort_unless($actor->canManageService('taxi'), 403);
        $ids = $actor->getAuthorizedStoreIds();
        abort_unless($booking->store_id !== null && ($ids === null
            || in_array((int) $booking->store_id, $ids, true)), 403);
    }

    private function event(CabDispatch $dispatch, User $actor, ?string $from, string $to): void
    {
        CabDispatchEvent::create([
            'cab_dispatch_id' => $dispatch->id,
            'actor_user_id' => $actor->id,
            'from_status' => $from,
            'to_status' => $to,
            'occurred_at' => now(),
        ]);
    }
}

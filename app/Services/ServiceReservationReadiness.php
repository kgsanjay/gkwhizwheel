<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StoreStatus;
use App\Models\CabDispatch;
use App\Models\ServiceBooking;
use App\Models\ServiceResourceAllocation;

/** Allocation integrity gate; not certification of a service's complete operational workflow. */
final class ServiceReservationReadiness
{
    public function issue(ServiceBooking $booking): ?string
    {
        $types = match ($booking->service_type) {
            'taxi' => ['cab_vehicle', 'cab_driver'],
            'boating' => ['boat'], 'scuba' => ['scuba_slot'], 'homestay' => ['stay_room'],
            'guide' => ['tour_guide'], 'tours' => ['tour_departure'],
            default => [],
        };
        $item = $booking->serviceItem()->first();
        if ($types === [] || $item === null || ! $item->isAvailable()
            || $booking->store_id === null || $item->store_id !== $booking->store_id
            || $item->service_type !== $booking->service_type
            || $item->store?->status !== StoreStatus::ACTIVE
            || $booking->quantity < 1 || $booking->start_datetime === null
            || $booking->end_datetime === null || ! $booking->end_datetime->gt($booking->start_datetime)) {
            return 'This service needs verified branch inventory and a complete schedule before confirmation or payment.';
        }
        $allocations = ServiceResourceAllocation::with('resource')->where('service_booking_id', $booking->id)->get();
        if ($allocations->count() !== count($types)) {
            return 'The approved service resources have not been allocated. Submit an availability enquiry for staff review.';
        }
        foreach ($types as $type) {
            $matching = $allocations->filter(fn ($a) => $a->resource?->resource_type === $type);
            if ($matching->count() !== 1) {
                return 'The service resource allocation is incomplete or inconsistent.';
            }
            $allocation = $matching->first();
            $resource = $allocation->resource;
            $required = $booking->service_type === 'taxi' ? 1 : (int) $booking->quantity;
            if ($allocation->status !== 'confirmed' || $allocation->quantity !== $required
                || ! $allocation->starts_at->equalTo($booking->start_datetime)
                || ! $allocation->ends_at->equalTo($booking->end_datetime)
                || $resource->status !== 'available' || $resource->capacity_units < $required
                || $resource->service_item_id !== $booking->service_item_id
                || $resource->store_id !== $booking->store_id) {
                return 'The service resources no longer match the approved reservation.';
            }
        }
        if ($booking->service_type === 'taxi') {
            $dispatch = CabDispatch::with(['vehicle', 'driver'])->where('service_booking_id', $booking->id)->first();
            $eligibility = app(CabDispatchEligibility::class);
            if ($dispatch === null || $dispatch->store_id !== $booking->store_id
                || $dispatch->status !== ($booking->status === 'in_progress' ? 'in_progress' : 'assigned')
                || ! $dispatch->starts_at->equalTo($booking->start_datetime)
                || ! $dispatch->ends_at->equalTo($booking->end_datetime)
                || $dispatch->vehicle === null || $dispatch->driver === null
                || ! $eligibility->vehicle($dispatch->vehicle) || ! $eligibility->driver($dispatch->driver)
                || $dispatch->vehicle->seats < $booking->quantity
                || ! $allocations->contains('service_resource_id', $dispatch->vehicle->service_resource_id)
                || ! $allocations->contains('service_resource_id', $dispatch->driver->service_resource_id)) {
                return 'The cab and driver dispatch needs verification before payment.';
            }
        }
        return null;
    }
}

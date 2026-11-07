<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CabDriver;
use App\Models\CabVehicle;
use App\Models\ServiceItem;
use App\Models\Store;

final class CabDispatchEligibility
{
    /**
     * Only independently approved cab and driver resources may be dispatched.
     * An admin status toggle alone never substitutes verified documentation.
     */
    public function vehicle(CabVehicle $vehicle): bool
    {
        $vehicle->loadMissing(['store', 'serviceItem', 'resource']);
        return $vehicle->status === 'available'
            && $vehicle->documents_verified
            && $vehicle->store?->status === \App\Enums\StoreStatus::ACTIVE
            && $vehicle->serviceItem?->service_type === 'taxi'
            && $vehicle->serviceItem?->store_id === $vehicle->store_id
            && $this->linkedResourceValid($vehicle->resource, $vehicle->service_item_id, $vehicle->store_id, 'cab_vehicle')
            && $vehicle->insurance_expires_on?->greaterThanOrEqualTo(now()->startOfDay())
            && $vehicle->permit_expires_on?->greaterThanOrEqualTo(now()->startOfDay())
            && $vehicle->fitness_expires_on?->greaterThanOrEqualTo(now()->startOfDay())
            && $vehicle->last_inspected_on !== null
            && $vehicle->last_inspected_on->gte(now()->subDays(30)->startOfDay());
    }

    public function driver(CabDriver $driver): bool
    {
        $driver->loadMissing(['store', 'serviceItem', 'resource']);
        return $driver->status === 'available'
            && $driver->documents_verified
            && $driver->store?->status === \App\Enums\StoreStatus::ACTIVE
            && $driver->serviceItem?->service_type === 'taxi'
            && $driver->serviceItem?->store_id === $driver->store_id
            && $this->linkedResourceValid($driver->resource, $driver->service_item_id, $driver->store_id, 'cab_driver')
            && $driver->license_expires_on?->greaterThanOrEqualTo(now()->startOfDay())
            && $driver->last_verified_on !== null
            && $driver->last_verified_on->gte(now()->subDays(30)->startOfDay());
    }

    private function linkedResourceValid(?\App\Models\ServiceResource $resource, int $itemId, int $storeId, string $type): bool
    {
        return $resource !== null && $resource->resource_type === $type
            && $resource->status === 'available'
            && $resource->capacity_units === 1
            && $resource->service_item_id === $itemId
            && $resource->store_id === $storeId;
    }
}

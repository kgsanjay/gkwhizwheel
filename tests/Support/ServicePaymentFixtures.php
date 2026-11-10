<?php

declare(strict_types=1);

/** Synthetic boating fixtures only; payment tests must reserve real typed capacity. */
function gkwAllocatePaymentFixture(\App\Models\ServiceBooking $booking): void
{
    if ($booking->service_type !== 'boating') {
        throw new LogicException('The synthetic payment allocation fixture supports boating only.');
    }
    $item = $booking->serviceItem()->firstOrFail();
    $storeId = $item->store_id;
    if ($storeId === null) {
        $storeId = \App\Models\Store::create([
            'name' => 'Payment Resource CI', 'address_line' => 'Test Road', 'city' => 'Test City',
            'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28, 'longitude' => 74.45,
            'status' => \App\Enums\StoreStatus::ACTIVE,
        ])->id;
        $item->update(['store_id' => $storeId]);
    }
    $booking->update(['store_id' => $storeId,
        'end_datetime' => $booking->end_datetime ?? $booking->start_datetime->copy()->addHour()]);
    $resource = \App\Models\ServiceResource::create([
        'store_id' => $storeId, 'service_item_id' => $item->id, 'resource_type' => 'boat',
        'code' => 'PAYMENT-TEST-'.$booking->id, 'name' => 'Approved test resource',
        'capacity_units' => $booking->quantity, 'status' => 'available',
    ]);
    app(\App\Services\ServiceResourceAllocator::class)->allocate(
        $resource, $booking, $booking->start_datetime->toDateTimeString(),
        $booking->end_datetime->toDateTimeString(), $booking->quantity, 'confirmed'
    );
    $booking->unsetRelation('serviceItem');
}

function gkwPaymentQuoteContext(\App\Models\ServiceBooking $booking): array
{
    return ['version' => 2, 'store_id' => $booking->store_id,
        'end_datetime' => $booking->end_datetime?->toDateTimeString(),
        'price_unit' => $booking->serviceItem()->firstOrFail()->price_unit];
}

<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('service inventory and bookings support explicit branch ownership', function (): void {
    expect(Schema::hasColumn('service_items', 'store_id'))->toBeTrue();
    expect(Schema::hasColumn('service_bookings', 'store_id'))->toBeTrue();

    $store = Store::create([
        'name' => 'Murudeshwar',
        'address_line' => 'Near KSRTC Bus Stand',
        'city' => 'Murudeshwar',
        'state' => 'Karnataka',
        'pincode' => '581350',
        'latitude' => 14.09,
        'longitude' => 74.49,
        'phone' => '9999999988',
        'status' => StoreStatus::ACTIVE,
    ]);

    $item = ServiceItem::create([
        'store_id' => $store->id,
        'service_type' => 'taxi',
        'name' => 'Coastal Cab',
        'price_base' => 1500,
    ]);
    $booking = ServiceBooking::create([
        'store_id' => $store->id,
        'booking_number' => 'GKW-BRANCH-TEST-001',
        'service_type' => 'taxi',
        'service_item_id' => $item->id,
        'customer_name' => 'Customer',
        'customer_phone' => '9999999987',
        'start_datetime' => now()->addDay(),
    ]);

    expect($item->fresh()->store->id)->toBe($store->id);
    expect($booking->fresh()->store->id)->toBe($store->id);
    expect($store->serviceItems()->count())->toBe(1);
    expect($store->serviceBookings()->count())->toBe(1);
});

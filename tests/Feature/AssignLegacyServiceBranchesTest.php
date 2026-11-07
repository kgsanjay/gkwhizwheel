<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('legacy branch assignment is a dry run until explicitly applied', function (): void {
    $store = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888878001', 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create(['service_type' => 'taxi', 'name' => 'Legacy Taxi', 'price_base' => 1200]);
    $booking = ServiceBooking::create([
        'service_type' => 'taxi', 'service_item_id' => $item->id,
        'booking_number' => 'GKW-LEGACY-1', 'customer_name' => 'Customer',
        'customer_phone' => '9888878002', 'start_datetime' => now(),
    ]);
    $params = ['store' => $store->id, '--items' => [$item->id], '--bookings' => [$booking->id]];
    $this->artisan('services:assign-branch', $params)->assertSuccessful();
    expect($item->fresh()->store_id)->toBeNull();
    expect($booking->fresh()->store_id)->toBeNull();

    $this->artisan('services:assign-branch', [...$params, '--apply' => true])->assertSuccessful();
    expect($item->fresh()->store_id)->toBe($store->id);
    expect($booking->fresh()->store_id)->toBe($store->id);
});

test('legacy assignment rejects booking with unselected unassigned linked item', function (): void {
    $store = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888878003', 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create(['service_type' => 'boating', 'name' => 'Legacy Boat', 'price_base' => 900]);
    $booking = ServiceBooking::create([
        'service_type' => 'boating', 'service_item_id' => $item->id,
        'booking_number' => 'GKW-LEGACY-2', 'customer_name' => 'Guest',
        'customer_phone' => '9888878004', 'start_datetime' => now(),
    ]);
    $this->artisan('services:assign-branch', [
        'store' => $store->id, '--bookings' => [$booking->id], '--apply' => true,
    ])->assertFailed();
    expect($booking->fresh()->store_id)->toBeNull();
});

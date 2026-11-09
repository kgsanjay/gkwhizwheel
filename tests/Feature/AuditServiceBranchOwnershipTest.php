<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('branch ownership audit reports legacy rows without changing them', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'taxi', 'name' => 'Unassigned Taxi', 'price_base' => 1500,
    ]);
    $booking = ServiceBooking::create([
        'booking_number' => 'GKW-AUDIT-01', 'service_type' => 'taxi',
        'service_item_id' => $item->id, 'customer_name' => 'Guest',
        'customer_phone' => '9888890001', 'start_datetime' => now(),
    ]);

    $this->artisan('services:audit-branches')->assertSuccessful();
    $this->artisan('services:audit-branches', ['--strict' => true])->assertFailed();
    expect($item->fresh()->store_id)->toBeNull();
    expect($booking->fresh()->store_id)->toBeNull();
});

test('branch ownership audit catches mismatched item and booking assignments', function (): void {
    $a = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888890002', 'status' => StoreStatus::ACTIVE,
    ]);
    $b = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Main Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888890003', 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $a->id, 'service_type' => 'boating', 'name' => 'Honnavar Boat',
        'price_base' => 1800,
    ]);
    ServiceBooking::create([
        'store_id' => $b->id, 'service_item_id' => $item->id,
        'booking_number' => 'GKW-AUDIT-02', 'service_type' => 'boating',
        'customer_name' => 'Guest', 'customer_phone' => '9888890004',
        'start_datetime' => now(),
    ]);
    $this->artisan('services:audit-branches', ['--strict' => true])->assertFailed();
});

test('branch ownership audit is successful on fully consistent records', function (): void {
    $store = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888890005', 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $store->id, 'service_type' => 'taxi',
        'name' => 'Honnavar Taxi', 'price_base' => 1500,
    ]);
    ServiceBooking::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'booking_number' => 'GKW-AUDIT-03', 'service_type' => 'taxi',
        'customer_name' => 'Guest', 'customer_phone' => '9888890006',
        'start_datetime' => now(),
    ]);
    $this->artisan('services:audit-branches', ['--strict' => true])->assertSuccessful();
});


test('strict branch audit rejects a booking assigned to an item with no branch', function (): void {
    $store = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888890007', 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'service_type' => 'taxi', 'name' => 'Legacy Unassigned Cab',
        'price_base' => 1500,
    ]);
    $booking = ServiceBooking::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'booking_number' => 'GKW-AUDIT-04', 'service_type' => 'taxi',
        'customer_name' => 'Guest', 'customer_phone' => '9888890008',
        'start_datetime' => now(),
    ]);

    $this->artisan('services:audit-branches', ['--strict' => true, '--sample' => 0])->assertFailed();

    expect($item->fresh()->store_id)->toBeNull()
        ->and($booking->fresh()->store_id)->toBe($store->id);
});

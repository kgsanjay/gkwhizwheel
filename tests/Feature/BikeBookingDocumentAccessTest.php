<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;

test('bike confirmation, voucher and printable agreement require booking ownership', function (): void {
    $store = Store::create([
        'name' => 'Document Access Branch',
        'address_line' => 'Station Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Document Access Scooter',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa',
        'registration_number' => 'KA-47-TEST-771',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $owner = User::create([
        'name' => 'Rental Owner',
        'email' => 'rental-owner@example.test',
        'phone' => '9876543210',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $other = User::create([
        'name' => 'Other Customer',
        'email' => 'other-customer@example.test',
        'phone' => '9876543211',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $booking = Booking::create([
        'booking_reference' => 'DOC-TEST-771',
        'bike_id' => $bike->id,
        'user_id' => $owner->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 500,
        'deposit_amount' => 0,
        'total_amount' => 500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'document-access-test-771',
    ]);
    foreach ([
        "/bookings/{$booking->id}/confirmation",
        "/bookings/{$booking->id}/voucher",
        "/bookings/{$booking->id}/print",
    ] as $url) {
        $this->get($url)->assertStatus(401);
        $this->actingAs($other)->get($url)->assertForbidden();
        auth()->logout();
    }
    $this->actingAs($owner)
        ->get("/bookings/{$booking->id}/confirmation")
        ->assertOk();
});

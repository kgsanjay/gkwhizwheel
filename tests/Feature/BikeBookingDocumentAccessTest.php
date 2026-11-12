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

test('billing details cannot be replaced after bike payment initiation', function (): void {
    // Validation occurs before a gateway request, so an invalid request is safe to
    // test without actual PhonePe/Razorpay credentials.
    $customer = User::create([
        'name' => 'Billing Customer',
        'email' => 'billing-customer@example.test',
        'phone' => '9876543222',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $store = Store::create([
        'name' => 'Billing Test Branch',
        'address_line' => 'Market Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Billing Test Scooter',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Dio',
        'registration_number' => 'KA-47-TEST-772',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $originalBilling = [
        'type' => 'personal',
        'name' => 'Billing Customer',
        'address' => 'Market Road, Honnavar',
        'state_code' => '29',
    ];
    $booking = Booking::create([
        'booking_reference' => 'DOC-TEST-772',
        'bike_id' => $bike->id,
        'user_id' => $customer->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 500,
        'deposit_amount' => 0,
        'total_amount' => 500,
        'held_until' => now()->addMinutes(10),
        'price_breakdown_json' => [
            'checkout_payment_option' => 'full',
            'checkout_gateway' => 'phonepe',
            'checkout_billing' => $originalBilling,
        ],
        'idempotency_key' => 'document-access-test-772',
    ]);

    $this->actingAs($customer)->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'phonepe',
        'payment_option' => 'full',
        'billing' => [
            ...$originalBilling,
            'name' => 'Changed Identity',
        ],
    ])->assertUnprocessable()->assertJsonValidationErrors(['billing']);

    $this->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'phonepe',
        'payment_option' => 'full',
        'billing' => [
            'type' => 'business',
            'name' => 'Sample Company',
            'address' => 'Station Road, Honnavar',
            'state_code' => '29',
            'gstin' => '27ABCDE1234F1Z5',
        ],
    ])->assertUnprocessable()->assertJsonValidationErrors(['billing.gstin']);

    expect($booking->fresh()->price_breakdown_json['checkout_billing'])->toBe($originalBilling);
});

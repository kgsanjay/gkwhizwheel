<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use App\Models\Payment;
use App\Models\ServiceBooking;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->store1 = Store::create([
        'name' => 'Test Store 1',
        'address_line' => 'Line 1',
        'city' => 'City',
        'state' => 'State',
        'pincode' => '111111',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Test Store 2',
        'address_line' => 'Line 2',
        'city' => 'City',
        'state' => 'State',
        'pincode' => '222222',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Regular Staff',
        'email' => 'staff@gkwhizwheel.com',
        'phone' => '1111111111',
        'password' => Hash::make('password123'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->store1->id);

    $this->storeManager = User::create([
        'name' => 'Store Manager',
        'email' => 'manager@gkwhizwheel.com',
        'phone' => '2222222222',
        'password' => Hash::make('password123'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->storeManager->stores()->attach($this->store1->id);

    $this->customer = User::create([
        'name' => 'Customer',
        'email' => 'customer@gkwhizwheel.com',
        'phone' => '3333333333',
        'password' => Hash::make('password123'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Test Category',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 1000,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Honda',
        'model_name' => 'Activa',
        'registration_number' => 'KA01AB1234',
        'status' => 'available',
    ]);

    $this->booking = Booking::create([
        'booking_reference' => 'BK-1234',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => 'offline',
        'status' => 'confirmed',
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addDays(2)->format('Y-m-d'),
        'base_amount' => 1000,
        'deposit_amount' => 1000,
        'total_amount' => 2000,
        'idempotency_key' => 'idem-1',
        'price_breakdown_json' => [],
    ]);

    Payment::create([
        'booking_id' => $this->booking->id,
        'type' => 'advance',
        'amount' => 2000.00,
        'method' => 'cash',
        'status' => 'success',
        'gateway_reference' => 'pay_123',
    ]);
});

test('store scoping prevents staff from accessing bookings at other stores', function (): void {
    Sanctum::actingAs($this->staff);

    // Act & Assert: Accessing a booking in store1 (assigned) is allowed if it was a GET request for a booking,
    // but here we check store_id query param filtering.
    $this->getJson('/api/v1/staff/bookings/active?store_id=' . $this->store1->id)->assertStatus(200);

    // Act & Assert: Accessing a store2 booking throws 403
    $this->getJson('/api/v1/staff/bookings/active?store_id=' . $this->store2->id)->assertStatus(403);
});

test('payment amount server-validation rejects invalid amounts for booking collect payment', function (): void {
    Sanctum::actingAs($this->staff);

    // Collect payment with amount > balance due (which is 2000)
    $this->postJson('/api/v1/staff/bookings/' . $this->booking->id . '/collect-payment', [
        'amount' => 3000,
        'method' => 'cash',
        'type' => 'advance',
    ])->assertStatus(422)->assertJsonValidationErrors('amount');

    // Collect payment with negative amount
    $this->postJson('/api/v1/staff/bookings/' . $this->booking->id . '/collect-payment', [
        'amount' => -500,
        'method' => 'cash',
        'type' => 'advance',
    ])->assertStatus(422)->assertJsonValidationErrors('amount');
});

test('role restrictions allow store manager to access admin endpoints but deny staff', function (): void {
    // Endpoints that Store Managers should be able to access for Mobile App functionality:
    $endpoints = [
        ['GET', '/api/v1/admin/reports/revenue'],
        ['GET', '/api/v1/admin/reports/utilization'],
        ['GET', '/api/v1/admin/staff'],
        ['POST', '/api/v1/admin/bookings/' . $this->booking->id . '/refund', ['amount' => 100, 'reason' => 'Test']],
    ];

    // Assert Staff gets 403
    Sanctum::actingAs($this->staff);
    foreach ($endpoints as $endpoint) {
        $method = $endpoint[0];
        $url = $endpoint[1];
        $payload = $endpoint[2] ?? [];

        if ($method === 'GET') {
            $this->getJson($url)->assertStatus(403);
        } else {
            $this->postJson($url, $payload)->assertStatus(403);
        }
    }

    // Assert Store Manager gets 200/201
    Sanctum::actingAs($this->storeManager);
    foreach ($endpoints as $endpoint) {
        $method = $endpoint[0];
        $url = $endpoint[1];
        $payload = $endpoint[2] ?? [];

        if ($method === 'GET') {
            $this->getJson($url)->assertSuccessful();
        } else {
            $this->postJson($url, $payload)->assertSuccessful();
        }
    }
});

test('customer is strictly denied access to all staff operational endpoints', function (): void {
    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/staff/bookings/active')->assertStatus(403);
    $this->getJson('/api/v1/staff/service-bookings')->assertStatus(403);
    $this->postJson('/api/v1/staff/bookings/' . $this->booking->id . '/handover', [])->assertStatus(403);
});

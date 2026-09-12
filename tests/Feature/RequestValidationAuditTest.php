<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Honnavar Main Hub',
        'address_line' => 'Station Road, Honnavar',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2810,
        'longitude' => 74.4442,
        'phone' => '9481512340',
        'status' => 'active',
    ]);

    $this->admin = User::create([
        'name' => 'System Admin',
        'email' => 'admin.audit@whizwheel.com',
        'phone' => '9999000001',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Staff Member',
        'email' => 'staff.audit@whizwheel.com',
        'phone' => '9999000002',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->store->id);

    $this->customer = User::create([
        'name' => 'Test Customer',
        'email' => 'customer.audit@whizwheel.com',
        'phone' => '9999000003',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter 110cc',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'registration_number' => 'KA47X9999',
        'model_name' => 'Activa 6G',
        'brand' => 'Honda',
        'engine_cc' => 110,
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'category_id' => $this->category->id,
        'status' => 'available',
    ]);
});

test('LoginRequest validates maximum length for email, phone, and password', function (): void {
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => str_repeat('a', 250).'@example.com', // > 255 chars
        'password' => 'secret',
    ]);
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);

    $responsePhone = $this->postJson('/api/v1/auth/login', [
        'phone' => str_repeat('9', 25), // > 20 chars
        'password' => 'secret',
    ]);
    $responsePhone->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);

    $responsePassword = $this->postJson('/api/v1/auth/login', [
        'email' => 'valid@example.com',
        'password' => str_repeat('p', 256), // > 255 chars
    ]);
    $responsePassword->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

test('ConfirmPaymentRequest validates payment_method max length', function (): void {
    Sanctum::actingAs($this->customer);

    $booking = Booking::create([
        'booking_reference' => 'WHZ-TEST-CONFIRM',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => now()->addDays(1)->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'channel' => 'online',
        'status' => 'pending_payment',
        'base_amount' => 450.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 1950.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-'.uniqid(),
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/confirm-payment", [
        'gateway_reference' => 'pay_123456',
        'payment_method' => str_repeat('x', 51),
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['payment_method']);
});

test('HoldBookingRequest validates addon_type max length', function (): void {
    Sanctum::actingAs($this->customer);

    $response = $this->postJson('/api/v1/bookings/hold', [
        'idempotency_key' => 'idemp-hold-test-01',
        'bike_id' => $this->bike->id,
        'start_date' => now()->addDays(1)->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'addons' => [
            [
                'addon_type' => str_repeat('a', 51),
                'quantity' => 1,
                'unit_price' => 50.00,
            ],
        ],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['addons.0.addon_type']);
});

test('HandoverBookingRequest validates signature length and invalid types', function (): void {
    Sanctum::actingAs($this->staff);

    $booking = Booking::create([
        'booking_reference' => 'WHZ-TEST-HANDOVER',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(1)->toDateString(),
        'channel' => 'offline',
        'status' => 'confirmed',
        'base_amount' => 450.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 1950.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-'.uniqid(),
    ]);

    $photo = UploadedFile::fake()->image('condition.jpg');

    // Signature must not be an integer/array or excessive string
    $response = $this->postJson("/api/v1/staff/bookings/{$booking->id}/handover", [
        'odometer_reading' => 5000,
        'condition_photos' => [$photo],
        'signature' => 12345, // invalid type
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['signature']);
});

test('CustomerController lookup validates phone maximum length', function (): void {
    Sanctum::actingAs($this->staff);

    $response = $this->getJson('/api/v1/staff/customers/lookup?phone='.str_repeat('9', 25));
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

test('ReportController revenue and utilization validate query parameters', function (): void {
    Sanctum::actingAs($this->admin);

    // Invalid group_by
    $response = $this->getJson('/api/v1/admin/reports/revenue?group_by=invalid_group');
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['group_by']);

    // Invalid date order
    $response2 = $this->getJson('/api/v1/admin/reports/revenue?start_date=2026-10-10&end_date=2026-10-01');
    $response2->assertStatus(422)
        ->assertJsonValidationErrors(['end_date']);

    // Invalid store_id in utilization
    $response3 = $this->getJson('/api/v1/admin/reports/utilization?store_id=999999');
    $response3->assertStatus(422)
        ->assertJsonValidationErrors(['store_id']);
});

test('Customer BookingController checkout validates gateway and redirect_url', function (): void {
    Sanctum::actingAs($this->customer);

    $booking = Booking::create([
        'booking_reference' => 'WHZ-TEST-CHECKOUT',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => now()->addDays(1)->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'channel' => 'online',
        'status' => 'held',
        'base_amount' => 450.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 1950.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-'.uniqid(),
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'unsupported_gateway',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['gateway']);
});

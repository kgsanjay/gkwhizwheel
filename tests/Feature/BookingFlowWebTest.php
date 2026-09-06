<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PaymentStatus;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store1 = Store::create([
        'name' => 'Indiranagar Hub',
        'code' => 'IND-01',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500001',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Koramangala Hub',
        'code' => 'KOR-01',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500002',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 800.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store1->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-05-AB-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 4200,
        'base_daily_rate_override' => 850.00,
        'deposit_amount_override' => 2000.00,
    ]);

    $this->customer = User::create([
        'name' => 'Rahul Sharma',
        'email' => 'rahul@example.com',
        'phone' => '9876543210',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->otherCustomer = User::create([
        'name' => 'Other Customer',
        'email' => 'other@example.com',
        'phone' => '9876543211',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated customer cannot hold booking', function (): void {
    $uuidKey = (string) Str::uuid();

    $response = $this->postJson('/api/v1/bookings/hold', [
        'bike_id' => $this->bike->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
    ], [
        'Idempotency-Key' => $uuidKey,
    ]);

    $response->assertStatus(401);
});

test('customer can hold booking with client-generated UUID Idempotency-Key and addons', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $uuidKey = (string) Str::uuid();
    $startDate = Carbon::tomorrow()->toDateString();
    $endDate = Carbon::tomorrow()->addDays(2)->toDateString();

    $payload = [
        'bike_id' => $this->bike->id,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store2->id, // One-way
        'addons' => [
            ['addon_type' => 'helmet', 'quantity' => 2, 'unit_price' => 100.00],
            ['addon_type' => 'insurance', 'quantity' => 1, 'unit_price' => 250.00],
        ],
    ];

    $response = $this->postJson('/api/v1/bookings/hold', $payload, [
        'Idempotency-Key' => $uuidKey,
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Booking hold created successfully.',
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'booking_reference',
                'status',
                'base_amount',
                'addon_amount',
                'deposit_amount',
                'total_amount',
                'addons',
            ],
        ]);

    expect($response->json('data.status'))->toBe('held');
    expect($response->json('data.addon_amount'))->toEqual(450); // (2 * 100) + (1 * 250)
    expect($response->json('data.addons'))->toHaveCount(2);

    $bookingId = $response->json('data.id');

    // Test idempotency: re-sending the same request with the same UUID key returns identical booking
    $reResponse = $this->postJson('/api/v1/bookings/hold', $payload, [
        'Idempotency-Key' => $uuidKey,
    ]);

    $reResponse->assertStatus(200);
    expect($reResponse->json('data.id'))->toBe($bookingId);
});

test('holding booking requires Idempotency-Key header', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $response = $this->postJson('/api/v1/bookings/hold', [
        'bike_id' => $this->bike->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['idempotency_key']);
});

test('customer can create Razorpay checkout order for held booking', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $uuidKey = (string) Str::uuid();
    $booking = Booking::create([
        'booking_reference' => 'BK-FLOW-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2550.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 4550.00,
        'price_breakdown_json' => [],
        'idempotency_key' => $uuidKey,
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'razorpay',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'gateway' => 'razorpay',
                'amount' => 4550.00,
                'amount_paise' => 455000,
                'status' => 'pending_payment',
            ],
        ]);
});

test('customer can create PhonePe checkout order for held booking', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $uuidKey = (string) Str::uuid();
    $booking = Booking::create([
        'booking_reference' => 'BK-FLOW-02',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2550.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 4550.00,
        'price_breakdown_json' => [],
        'idempotency_key' => $uuidKey,
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'phonepe',
        'redirect_url' => 'http://localhost/bookings/callback',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'gateway' => 'phonepe',
                'amount' => 4550.00,
                'amount_paise' => 455000,
            ],
        ]);
});

test('dev test payment simulation confirms booking and creates payment record', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-FLOW-SIM-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2550.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 4550.00,
        'price_breakdown_json' => [],
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $response = $this->postJson("/dev/bookings/{$booking->id}/simulate-payment", [
        'gateway' => 'razorpay',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'status' => 'confirmed',
            ],
        ]);

    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'confirmed',
    ]);

    $this->assertDatabaseHas('payments', [
        'booking_id' => $booking->id,
        'status' => PaymentStatus::SUCCESS->value,
    ]);
});

test('GET /bookings/{id}/confirmation renders Inertia Bookings/Confirmation component', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-FLOW-CONF-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store2->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2550.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 4550.00,
        'price_breakdown_json' => [],
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $response = $this->actingAs($this->customer)
        ->get("/bookings/{$booking->id}/confirmation");

    $response->assertStatus(200)
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Bookings/Confirmation')
            ->has('booking')
            ->where('booking.id', $booking->id)
            ->where('booking.booking_reference', 'BK-FLOW-CONF-01')
            ->where('booking.status', 'confirmed')
            ->where('booking.bike.model_name', 'Hunter 350')
        );
});

test('customer cannot view confirmation page of another customer', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-FLOW-OTHER-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store2->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2550.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 4550.00,
        'price_breakdown_json' => [],
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $response = $this->actingAs($this->otherCustomer)
        ->get("/bookings/{$booking->id}/confirmation");

    $response->assertStatus(403);
});

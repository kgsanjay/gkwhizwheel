<?php

declare(strict_types=1);

namespace Tests\Feature;

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
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->storeA = Store::create([
        'name' => 'Booking Store A',
        'address_line' => '100 Main St',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 600.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter',
        'registration_number' => 'KA-01-JJ-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer = User::create([
        'name' => 'Booking Customer',
        'email' => 'bookingcustomer@example.com',
        'phone' => '9888800001',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->otherCustomer = User::create([
        'name' => 'Other Customer',
        'email' => 'othercustomer@example.com',
        'phone' => '9888800002',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('hold booking requires authentication', function (): void {
    $response = $this->postJson('/api/v1/bookings/hold', [
        'bike_id' => $this->bike->id,
    ]);

    $response->assertStatus(401);
});

test('hold booking requires Idempotency-Key header', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $response = $this->postJson('/api/v1/bookings/hold', [
        'bike_id' => $this->bike->id,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-17',
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['idempotency_key'])
        ->assertJsonPath('errors.idempotency_key.0', 'The Idempotency-Key header is required for booking requests.');
});

test('hold booking creates held status and 10-minute hold window', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $response = $this->withHeader('Idempotency-Key', 'unique-idemp-001')
        ->postJson('/api/v1/bookings/hold', [
            'bike_id' => $this->bike->id,
            'start_date' => '2026-10-15',
            'end_date' => '2026-10-17',
            'pickup_store_id' => $this->storeA->id,
            'return_store_id' => $this->storeA->id,
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'data' => [
                'status' => 'held',
                'channel' => 'online',
                'deposit_amount' => 2000.00,
            ],
            'message' => 'Booking hold created successfully.',
        ])
        ->assertJsonStructure([
            'data' => [
                'id',
                'booking_reference',
                'held_until',
                'total_amount',
                'price_breakdown_json',
            ],
        ]);

    $this->assertDatabaseHas('bookings', [
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'status' => 'held',
        'idempotency_key' => 'unique-idemp-001',
    ]);
});

test('re-submitting same Idempotency-Key returns original booking without duplicates', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $headers = ['Idempotency-Key' => 'idemp-replay-12345'];
    $payload = [
        'bike_id' => $this->bike->id,
        'start_date' => '2026-10-20',
        'end_date' => '2026-10-22',
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
    ];

    // First request
    $firstResponse = $this->withHeaders($headers)->postJson('/api/v1/bookings/hold', $payload);
    $firstResponse->assertStatus(201);
    $firstId = $firstResponse->json('data.id');

    // Replay with same Idempotency-Key
    $secondResponse = $this->withHeaders($headers)->postJson('/api/v1/bookings/hold', $payload);
    $secondResponse->assertStatus(200);
    $secondId = $secondResponse->json('data.id');

    expect($secondId)->toBe($firstId);
    expect(Booking::where('idempotency_key', 'idemp-replay-12345')->count())->toBe(1);
});

test('confirm payment transitions booking to confirmed and creates payment record', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-PAY-CONFIRM',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-25',
        'end_date' => '2026-10-27',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-pay-01',
    ]);

    // Client-side callback alone CANNOT confirm an unconfirmed booking
    $unconfirmedResponse = $this->postJson("/api/v1/bookings/{$booking->id}/confirm-payment", [
        'gateway_reference' => 'pay_rzp_order_998877',
        'payment_method' => 'razorpay',
    ]);

    $unconfirmedResponse->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Payment is awaiting server-to-server webhook confirmation. Bookings cannot be confirmed via client callback alone.',
        ]);

    // When booking is confirmed via webhook and payment recorded
    $booking->update(['status' => BookingStatus::CONFIRMED]);
    \App\Models\Payment::create([
        'booking_id' => $booking->id,
        'type' => \App\Enums\PaymentType::ADVANCE,
        'amount' => 3800.00,
        'method' => \App\Enums\PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_rzp_order_998877',
        'status' => \App\Enums\PaymentStatus::SUCCESS,
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/confirm-payment", [
        'gateway_reference' => 'pay_rzp_order_998877',
        'payment_method' => 'razorpay',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'status' => 'confirmed',
                'payments' => [
                    [
                        'amount' => 3800.00,
                        'gateway_reference' => 'pay_rzp_order_998877',
                        'status' => 'success',
                    ],
                ],
            ],
            'message' => 'Payment verified and booking confirmed.',
        ]);

    $this->assertDatabaseHas('payments', [
        'booking_id' => $booking->id,
        'gateway_reference' => 'pay_rzp_order_998877',
        'status' => 'success',
    ]);
});

test('customer can list own bookings and view booking details', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-LIST-DETAIL',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 1200.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3200.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-list-01',
    ]);

    // Index
    $listResponse = $this->getJson('/api/v1/bookings');
    $listResponse->assertOk()
        ->assertJson([
            'success' => true,
        ]);
    expect(count($listResponse->json('data')))->toBe(1)
        ->and($listResponse->json('data.0.id'))->toBe($booking->id);

    // Show
    $showResponse = $this->getJson("/api/v1/bookings/{$booking->id}");
    $showResponse->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'booking_reference' => 'BK-LIST-DETAIL',
                'status' => 'confirmed',
            ],
        ]);
});

test('customer cannot view or cancel another customer booking', function (): void {
    Sanctum::actingAs($this->otherCustomer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-ISOLATION-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 1200.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3200.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-iso-01',
    ]);

    $showResponse = $this->getJson("/api/v1/bookings/{$booking->id}");
    $showResponse->assertStatus(404);

    $cancelResponse = $this->postJson("/api/v1/bookings/{$booking->id}/cancel", [
        'reason' => 'Unauthorized cancellation',
    ]);
    $cancelResponse->assertStatus(404);
});

test('customer can cancel booking and refund is processed if paid', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-CANCEL-REFUND',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-10', // well in advance >24h
        'end_date' => '2026-11-12',
        'base_amount' => 1200.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3200.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-cancel-01',
    ]);

    Payment::create([
        'booking_id' => $booking->id,
        'type' => \App\Enums\PaymentType::ADVANCE,
        'amount' => 3200.00,
        'method' => \App\Enums\PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_orig_cancel_01',
        'status' => \App\Enums\PaymentStatus::SUCCESS,
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/cancel", [
        'reason' => 'Changed travel plans',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'status' => 'cancelled',
            ],
            'message' => 'Booking cancelled successfully.',
        ]);

    $this->assertDatabaseHas('refunds', [
        'booking_id' => $booking->id,
        'amount' => 3200.00,
        'status' => 'completed',
    ]);
});

test('customer can extend booking dates if bike is available', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-EXTEND-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-15',
        'end_date' => '2026-11-16', // 2 days @ 600 = 1200 base + 2000 deposit = 3200
        'base_amount' => 1200.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3200.00,
        'price_breakdown_json' => ['base_amount' => 1200.00],
        'idempotency_key' => 'idemp-extend-01',
    ]);

    // Extend 1 extra day: new_end_date = 2026-11-17 (+600)
    $response = $this->postJson("/api/v1/bookings/{$booking->id}/extend", [
        'new_end_date' => '2026-11-17',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'end_date' => '2026-11-17',
                'base_amount' => 1800.00,
                'total_amount' => 3800.00,
            ],
            'message' => 'Booking extended successfully.',
        ]);

    expect($booking->refresh()->end_date->toDateString())->toBe('2026-11-17');
});

test('extending booking fails if bike is booked by another customer on extension dates', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-EXTEND-BLOCK',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-20',
        'end_date' => '2026-11-22',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-ext-block-01',
    ]);

    // Another customer books bike from 2026-11-23 to 2026-11-25
    Booking::create([
        'booking_reference' => 'BK-OTHER-BLOCK',
        'bike_id' => $this->bike->id,
        'user_id' => $this->otherCustomer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-23',
        'end_date' => '2026-11-25',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-ext-block-02',
    ]);

    // Customer tries to extend into 2026-11-24
    $response = $this->postJson("/api/v1/bookings/{$booking->id}/extend", [
        'new_end_date' => '2026-11-24',
    ]);

    // Exception should be caught or returned
    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ]);
});

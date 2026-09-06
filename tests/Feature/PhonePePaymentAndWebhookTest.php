<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('services.phonepe.merchant_id', 'PGTESTPAYUAT');
    config()->set('services.phonepe.salt_key', 'test_phonepe_salt_key_123');
    config()->set('services.phonepe.salt_index', '1');

    $this->store = Store::create([
        'name' => 'Indiranagar Hub',
        'code' => 'IND-01',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500002',
        'is_active' => true,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Touring Cruiser',
        'base_daily_rate' => 1200.00,
        'default_deposit_amount' => 3000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Meteor 350',
        'registration_number' => 'KA-01-EE-5555',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 8000,
    ]);

    $this->customer = User::create([
        'name' => 'PhonePe Customer',
        'email' => 'phonepecustomer@example.com',
        'phone' => '9876543299',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('customer checkout creates PhonePe payment order for advance + deposit combined (Option A) and transitions booking to pending_payment', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-PPE-ORDER-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2400.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 5400.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-ppe-01',
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/checkout/phonepe");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => 'BK-PPE-ORDER-01',
                'gateway' => 'phonepe',
                'amount' => 5400.00,
                'amount_paise' => 540000,
                'currency' => 'INR',
                'status' => 'pending_payment',
            ],
            'message' => 'PhonePe checkout order created successfully.',
        ]);

    expect($response->json('data.merchant_transaction_id'))->toStartWith("TXN_BK_{$booking->id}_");
    expect($response->json('data.redirect_url'))->not->toBeEmpty();

    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'pending_payment',
    ]);
});

test('PhonePe webhook with invalid signature is rejected with 400', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-PPE-INVSIG-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2400.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 5400.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-ppe-invsig-01',
    ]);

    $responsePayload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'message' => 'Payment successful',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => "TXN_BK_{$booking->id}_xyz",
            'transactionId' => 'T21000000001',
            'amount' => 540000,
            'state' => 'COMPLETED',
        ],
    ];

    $base64Response = base64_encode((string) json_encode($responsePayload, JSON_THROW_ON_ERROR));

    $response = $this->postJson('/webhooks/phonepe', [
        'response' => $base64Response,
    ], [
        'X-VERIFY' => 'invalid_checksum_hash###1',
    ]);

    $response->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'Invalid webhook signature.',
        ]);

    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'pending_payment',
    ]);
});

test('PhonePe webhook with valid signature flips booking from pending_payment to confirmed and creates Payment record', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-PPE-CONFIRM-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2400.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 5400.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-ppe-confirm-01',
    ]);

    $responsePayload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'message' => 'Payment successful',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => "TXN_BK_{$booking->id}_abc12345",
            'transactionId' => 'T21009988776',
            'amount' => 540000,
            'state' => 'COMPLETED',
        ],
    ];

    $base64Response = base64_encode((string) json_encode($responsePayload, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $base64Response.'test_phonepe_salt_key_123').'###1';

    $response = $this->postJson('/webhooks/phonepe', [
        'response' => $base64Response,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => 'BK-PPE-CONFIRM-01',
                'status' => 'confirmed',
                'gateway_reference' => 'T21009988776',
            ],
            'message' => 'PhonePe payment webhook processed and booking confirmed.',
        ]);

    // Booking actually flipped from pending_payment to confirmed in database
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'confirmed',
    ]);

    // Combined advance + deposit payment record created with method PHONEPE
    $this->assertDatabaseHas('payments', [
        'booking_id' => $booking->id,
        'type' => PaymentType::ADVANCE->value,
        'amount' => 5400.00,
        'method' => PaymentMethod::PHONEPE->value,
        'gateway_reference' => 'T21009988776',
        'status' => PaymentStatus::SUCCESS->value,
    ]);

    // Activity log recorded
    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $this->customer->id,
        'action' => 'payment.phonepe_webhook_confirmed',
        'subject_id' => $booking->id,
    ]);
});

test('PhonePe webhook idempotency prevents duplicate payment records on retransmitted events', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-PPE-IDEMP-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-03',
        'base_amount' => 2400.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 5400.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-ppe-idemp-01',
    ]);

    $responsePayload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'message' => 'Payment successful',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => "TXN_BK_{$booking->id}_dup123",
            'transactionId' => 'T2100_DUP_123',
            'amount' => 540000,
            'state' => 'COMPLETED',
        ],
    ];

    $base64Response = base64_encode((string) json_encode($responsePayload, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $base64Response.'test_phonepe_salt_key_123').'###1';

    // First call
    $firstResponse = $this->postJson('/webhooks/phonepe', [
        'response' => $base64Response,
    ], [
        'X-VERIFY' => $checksum,
    ]);
    $firstResponse->assertOk();

    // Duplicate call
    $secondResponse = $this->postJson('/webhooks/phonepe', [
        'response' => $base64Response,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $secondResponse->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Webhook already processed.',
        ]);

    expect(Payment::where('gateway_reference', 'T2100_DUP_123')->count())->toBe(1);
});

test('PhonePe webhook for unknown booking returns 404', function (): void {
    $responsePayload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'message' => 'Payment successful',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => 'TXN_BK_999999_unknown',
            'transactionId' => 'T2100_UNKNOWN',
            'amount' => 540000,
            'state' => 'COMPLETED',
        ],
    ];

    $base64Response = base64_encode((string) json_encode($responsePayload, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $base64Response.'test_phonepe_salt_key_123').'###1';

    $response = $this->postJson('/webhooks/phonepe', [
        'response' => $base64Response,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Booking not found for PhonePe payment webhook.',
        ]);
});

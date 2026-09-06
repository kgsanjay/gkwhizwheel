<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\FuelType;
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
    config()->set('services.razorpay.key_id', 'rzp_test_testkey123');
    config()->set('services.razorpay.key_secret', 'test_secret_abc123');
    config()->set('services.razorpay.webhook_secret', 'test_webhook_secret_xyz');

    $this->store = Store::create([
        'name' => 'Koramangala Hub',
        'code' => 'KRM-01',
        'address_line' => '80 Feet Road, Koramangala',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500001',
        'is_active' => true,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Premium Commuter',
        'base_daily_rate' => 900.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Yamaha',
        'model_name' => 'FZ-S V3',
        'registration_number' => 'KA-01-EQ-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
    ]);

    $this->customer = User::create([
        'name' => 'Razorpay Customer',
        'email' => 'rzpcustomer@example.com',
        'phone' => '9876543210',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('customer checkout creates Razorpay order for advance and deposit combined (Option A) and transitions booking to pending_payment', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-ORDER-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-17',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-checkout-01',
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/checkout");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => 'BK-RZP-ORDER-01',
                'amount' => 3800.00,
                'amount_paise' => 380000,
                'currency' => 'INR',
                'key_id' => 'rzp_test_testkey123',
                'status' => 'pending_payment',
            ],
            'message' => 'Checkout order created successfully.',
        ]);

    expect($response->json('data.order_id'))->toStartWith('order_');

    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'pending_payment',
    ]);
});

test('client-side callback alone CANNOT confirm an unconfirmed booking', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-NOCLIENT-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-17',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-noclient-01',
    ]);

    // Client attempts to spoof payment confirmation
    $response = $this->postJson("/api/v1/bookings/{$booking->id}/confirm-payment", [
        'gateway_reference' => 'pay_spoofed_12345',
        'payment_method' => 'razorpay',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Payment is awaiting server-to-server webhook confirmation. Bookings cannot be confirmed via client callback alone.',
        ]);

    // Verify booking is NOT confirmed
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'pending_payment',
    ]);

    // Verify no payment was created
    $this->assertDatabaseMissing('payments', [
        'booking_id' => $booking->id,
    ]);
});

test('Razorpay webhook with invalid signature is rejected with 400', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-INVSIG-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-17',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-invsig-01',
    ]);

    $payload = json_encode([
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_test_invsig_123',
                    'amount' => 380000,
                    'notes' => [
                        'booking_id' => (string) $booking->id,
                    ],
                ],
            ],
        ],
    ], JSON_THROW_ON_ERROR);

    $response = $this->call(
        'POST',
        '/webhooks/razorpay',
        [],
        [],
        [],
        [
            'HTTP_X-Razorpay-Signature' => 'invalid_signature_hash',
            'CONTENT_TYPE' => 'application/json',
        ],
        $payload
    );

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

test('Razorpay webhook with valid signature flips booking from pending_payment to confirmed and creates Payment record', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-CONFIRM-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-17',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-confirm-01',
    ]);

    $payloadArray = [
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_rzp_real_capture_987',
                    'amount' => 380000,
                    'currency' => 'INR',
                    'notes' => [
                        'booking_id' => (string) $booking->id,
                        'booking_reference' => $booking->booking_reference,
                    ],
                ],
            ],
        ],
    ];

    $payload = json_encode($payloadArray, JSON_THROW_ON_ERROR);
    $signature = hash_hmac('sha256', $payload, 'test_webhook_secret_xyz');

    $response = $this->call(
        'POST',
        '/webhooks/razorpay',
        [],
        [],
        [],
        [
            'HTTP_X-Razorpay-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ],
        $payload
    );

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => 'BK-RZP-CONFIRM-01',
                'status' => 'confirmed',
                'gateway_reference' => 'pay_rzp_real_capture_987',
            ],
            'message' => 'Payment webhook processed and booking confirmed.',
        ]);

    // Booking actually flipped from pending_payment to confirmed in database
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => 'confirmed',
    ]);

    // Combined advance + deposit payment record created
    $this->assertDatabaseHas('payments', [
        'booking_id' => $booking->id,
        'type' => PaymentType::ADVANCE->value,
        'amount' => 3800.00,
        'method' => PaymentMethod::RAZORPAY->value,
        'gateway_reference' => 'pay_rzp_real_capture_987',
        'status' => PaymentStatus::SUCCESS->value,
    ]);

    // Activity log recorded
    $this->assertDatabaseHas('activity_logs', [
        'user_id' => $this->customer->id,
        'action' => 'payment.webhook_confirmed',
        'subject_id' => $booking->id,
    ]);

    // Now, client checking confirmPayment gets confirmed 200
    Sanctum::actingAs($this->customer, ['*']);
    $clientCheck = $this->postJson("/api/v1/bookings/{$booking->id}/confirm-payment", [
        'gateway_reference' => 'pay_rzp_real_capture_987',
        'payment_method' => 'razorpay',
    ]);

    $clientCheck->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'status' => 'confirmed',
            ],
            'message' => 'Payment verified and booking confirmed.',
        ]);
});

test('Razorpay webhook idempotency prevents duplicate payment records on retransmitted events', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-IDEMP-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-17',
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-rzp-idemp-01',
    ]);

    $payloadArray = [
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_duplicate_check_1122',
                    'amount' => 380000,
                    'notes' => [
                        'booking_id' => (string) $booking->id,
                    ],
                ],
            ],
        ],
    ];

    $payload = json_encode($payloadArray, JSON_THROW_ON_ERROR);
    $signature = hash_hmac('sha256', $payload, 'test_webhook_secret_xyz');

    // First webhook call
    $firstResponse = $this->call(
        'POST',
        '/webhooks/razorpay',
        [],
        [],
        [],
        [
            'HTTP_X-Razorpay-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ],
        $payload
    );
    $firstResponse->assertOk();

    // Duplicate webhook call (Razorpay retry)
    $secondResponse = $this->call(
        'POST',
        '/webhooks/razorpay',
        [],
        [],
        [],
        [
            'HTTP_X-Razorpay-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ],
        $payload
    );

    $secondResponse->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Webhook already processed.',
        ]);

    // Exactly 1 payment in DB, not 2
    expect(Payment::where('gateway_reference', 'pay_duplicate_check_1122')->count())->toBe(1);
});

test('Razorpay webhook for unknown booking returns 404', function (): void {
    $payloadArray = [
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_unknown_bk_9999',
                    'amount' => 380000,
                    'notes' => [
                        'booking_id' => '999999',
                    ],
                ],
            ],
        ],
    ];

    $payload = json_encode($payloadArray, JSON_THROW_ON_ERROR);
    $signature = hash_hmac('sha256', $payload, 'test_webhook_secret_xyz');

    $response = $this->call(
        'POST',
        '/webhooks/razorpay',
        [],
        [],
        [],
        [
            'HTTP_X-Razorpay-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ],
        $payload
    );

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Booking not found for payment webhook.',
        ]);
});

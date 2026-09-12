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
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('services.razorpay.key_id', 'rzp_test_testkey123');
    config()->set('services.razorpay.key_secret', 'test_secret_abc123');
    config()->set('services.razorpay.webhook_secret', 'test_webhook_secret_xyz');

    config()->set('services.phonepe.merchant_id', 'TEST_MERCHANT_ID');
    config()->set('services.phonepe.salt_key', 'test_phonepe_salt_key_123');
    config()->set('services.phonepe.salt_index', 1);

    $this->store = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '80 Feet Road, Koramangala',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500001',
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
        'registration_number' => 'KA-01-EQ-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 3000,
    ]);

    $this->customer = User::create([
        'name' => 'Priya Sharma',
        'email' => 'priya.sharma@example.com',
        'phone' => '+919876543210',
        'password' => 'securepassword123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('payments table enforces unique constraint on gateway_reference', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-UNIQUE-TEST-01',
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
        'idempotency_key' => 'idemp-unique-01',
    ]);

    // First payment succeeds
    Payment::create([
        'booking_id' => $booking->id,
        'type' => PaymentType::ADVANCE,
        'amount' => 3800.00,
        'method' => PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_duplicate_test_ref_123',
        'status' => PaymentStatus::SUCCESS,
    ]);

    // Second payment with same gateway_reference must throw UniqueConstraintViolationException
    expect(fn () => Payment::create([
        'booking_id' => $booking->id,
        'type' => PaymentType::ADVANCE,
        'amount' => 3800.00,
        'method' => PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_duplicate_test_ref_123',
        'status' => PaymentStatus::SUCCESS,
    ]))->toThrow(UniqueConstraintViolationException::class);
});

test('Razorpay duplicate webhook delivery returns 200 and prevents duplicate Payment rows', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-RACE-01',
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
        'idempotency_key' => 'idemp-rzp-race-01',
    ]);

    $payloadArray = [
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_rzp_race_condition_ref_001',
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

    // First delivery: processes payment
    $response1 = $this->call(
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

    $response1->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'confirmed');

    expect(Payment::where('gateway_reference', 'pay_rzp_race_condition_ref_001')->count())->toBe(1);

    // Second concurrent delivery: should return 200 without creating a duplicate row
    $response2 = $this->call(
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

    $response2->assertOk()
        ->assertJsonPath('success', true);

    // Still exactly 1 payment record
    expect(Payment::where('gateway_reference', 'pay_rzp_race_condition_ref_001')->count())->toBe(1);
});

test('PhonePe duplicate webhook delivery returns 200 and prevents duplicate Payment rows', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-PHONPE-RACE-01',
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
        'price_breakdown_json' => [
            'phonepe_transaction_id' => 'TXN_BK_'.$booking_id = '123',
        ],
        'idempotency_key' => 'idemp-phonepe-race-01',
    ]);

    $merchantTxnId = 'TXN_BK_'.$booking->id.'_'.time();

    $payloadData = [
        'code' => 'PAYMENT_SUCCESS',
        'data' => [
            'merchantTransactionId' => $merchantTxnId,
            'transactionId' => 'T2409051800000000001',
            'amount' => 380000,
            'state' => 'COMPLETED',
        ],
    ];

    $encodedResponse = base64_encode(json_encode($payloadData, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $encodedResponse.'test_phonepe_salt_key_123').'###1';

    // First delivery
    $response1 = $this->postJson('/webhooks/phonepe', [
        'response' => $encodedResponse,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response1->assertOk()
        ->assertJsonPath('success', true);

    expect(Payment::where('gateway_reference', 'T2409051800000000001')->count())->toBe(1);

    // Duplicate delivery
    $response2 = $this->postJson('/webhooks/phonepe', [
        'response' => $encodedResponse,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response2->assertOk()
        ->assertJsonPath('success', true);

    // Still exactly 1 payment record
    expect(Payment::where('gateway_reference', 'T2409051800000000001')->count())->toBe(1);
});

test('Razorpay webhook logs warning and returns 200 when UniqueConstraintViolationException occurs', function (): void {
    Log::shouldReceive('warning')
        ->once()
        ->withArgs(function ($message, $context) {
            return str_contains((string) $message, 'Razorpay webhook duplicate delivery caught by unique constraint')
                && $context['gateway_reference'] === 'pay_simulated_unique_clash';
        });

    $booking = Booking::create([
        'booking_reference' => 'BK-RZP-CLASH-01',
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
        'idempotency_key' => 'idemp-rzp-clash-01',
    ]);

    $payloadArray = [
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_simulated_unique_clash',
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

    // Simulate another concurrent process inserting right between the lookup and the insert
    Payment::creating(function ($p) use ($booking): void {
        if ($p->gateway_reference === 'pay_simulated_unique_clash') {
            \Illuminate\Support\Facades\DB::table('payments')->insert([
                'booking_id' => $booking->id,
                'type' => PaymentType::ADVANCE->value,
                'amount' => 3800.00,
                'method' => PaymentMethod::RAZORPAY->value,
                'gateway_reference' => 'pay_simulated_unique_clash',
                'status' => PaymentStatus::SUCCESS->value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    });

    // Dispatch webhook
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
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Duplicate webhook delivery acknowledged.');
});

test('PhonePe webhook logs warning and returns 200 when UniqueConstraintViolationException occurs', function (): void {
    Log::shouldReceive('warning')
        ->once()
        ->withArgs(function ($message, $context) {
            return str_contains((string) $message, 'PhonePe webhook duplicate delivery caught by unique constraint')
                && $context['gateway_reference'] === 'T_SIMULATED_PHONEPE_CLASH';
        });

    $booking = Booking::create([
        'booking_reference' => 'BK-PHONEPE-CLASH-01',
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
        'idempotency_key' => 'idemp-phonepe-clash-01',
    ]);

    $merchantTxnId = 'TXN_BK_'.$booking->id.'_clash_test';

    $payloadData = [
        'code' => 'PAYMENT_SUCCESS',
        'data' => [
            'merchantTransactionId' => $merchantTxnId,
            'transactionId' => 'T_SIMULATED_PHONEPE_CLASH',
            'amount' => 380000,
            'state' => 'COMPLETED',
        ],
    ];

    $encodedResponse = base64_encode(json_encode($payloadData, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $encodedResponse.'test_phonepe_salt_key_123').'###1';

    Payment::creating(function ($p) use ($booking): void {
        if ($p->gateway_reference === 'T_SIMULATED_PHONEPE_CLASH') {
            \Illuminate\Support\Facades\DB::table('payments')->insert([
                'booking_id' => $booking->id,
                'type' => PaymentType::ADVANCE->value,
                'amount' => 3800.00,
                'method' => PaymentMethod::PHONEPE->value,
                'gateway_reference' => 'T_SIMULATED_PHONEPE_CLASH',
                'status' => PaymentStatus::SUCCESS->value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    });

    $response = $this->postJson('/webhooks/phonepe', [
        'response' => $encodedResponse,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Duplicate webhook delivery acknowledged.');
});

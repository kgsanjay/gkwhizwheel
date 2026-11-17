<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    Notification::fake();

    config([
        'services.phonepe.merchant_id' => 'PGTESTPAYUAT',
        'services.phonepe.salt_key' => 'test_phonepe_salt_key_123',
        'services.phonepe.salt_index' => '1',
        'services.phonepe.base_url' => 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    ]);

    $this->store = Store::create([
        'name' => 'Honnavar Hub',
        'code' => 'HON-PAY',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'address_line' => 'Palya Main Rd',
        'pincode' => '581334',
        'latitude' => 14.2798,
        'longitude' => 74.4439,
        'phone' => '9876543210',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'slug' => 'scooter-pay',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 0.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'registration_number' => 'KA-47-P-1001',
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'fuel_type' => \App\Enums\FuelType::PETROL,
        'transmission' => \App\Enums\Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'daily_rate' => 450.00,
        'deposit_amount' => 0.00,
    ]);

    $this->customer = User::create([
        'name' => 'Rider One',
        'email' => 'rider1@example.com',
        'phone' => '9845111111',
        'password' => bcrypt('password'),
        'role' => UserRole::CUSTOMER,
    ]);

    $this->otherCustomer = User::create([
        'name' => 'Other Rider',
        'email' => 'other@example.com',
        'phone' => '9845222222',
        'password' => bcrypt('password'),
        'role' => UserRole::CUSTOMER,
    ]);
});

test('customer can resume PhonePe payment from /account after payment window closes even if hold elapsed while bike is still free', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-RESUME-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => now()->addDays(2)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'base_amount' => 450.00,
        'deposit_amount' => 0.00,
        'total_amount' => 531.00,
        'held_until' => now()->subMinutes(10),
        'price_breakdown_json' => [
            'checkout_payment_option' => 'advance',
            'checkout_amount' => 100.00,
        ],
        'idempotency_key' => 'idemp-resume-01',
    ]);

    $res = $this->actingAs($this->customer, 'web')
        ->postJson("/account/bookings/{$booking->id}/pay", ['payment_option' => 'advance']);

    $res->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.mode', 'initial')
        ->assertJsonPath('data.amount', 100);

    $fresh = $booking->fresh();
    expect($fresh->held_until->isFuture())->toBeTrue();
    expect($fresh->price_breakdown_json['phonepe_transaction_id'])->toStartWith("TXN_BK_{$booking->id}_");
});

test('confirmed customer can pay remaining rental balance online via PhonePe and webhook settles it to zero', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-BAL-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->addDays(2)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'base_amount' => 450.00,
        'deposit_amount' => 0.00,
        'total_amount' => 531.00,
        'price_breakdown_json' => [
            'checkout_payment_option' => 'advance',
            'checkout_amount' => 100.00,
            'balance_due_on_pickup' => 431.00,
        ],
        'idempotency_key' => 'idemp-bal-01',
    ]);

    Payment::create([
        'booking_id' => $booking->id,
        'amount' => 100.00,
        'method' => PaymentMethod::PHONEPE,
        'type' => PaymentType::ADVANCE,
        'gateway_reference' => 'T_ADV_100',
        'status' => PaymentStatus::SUCCESS,
    ]);

    $payRes = $this->actingAs($this->customer, 'web')
        ->postJson("/account/bookings/{$booking->id}/pay", ['payment_option' => 'balance']);

    $payRes->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.mode', 'balance')
        ->assertJsonPath('data.amount', 431);

    $txnId = $payRes->json('data.merchant_transaction_id');
    expect($txnId)->toStartWith("TXN_BK_{$booking->id}_");

    $payload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => $txnId,
            'transactionId' => 'T_BAL_431',
            'amount' => 43100,
            'state' => 'COMPLETED',
        ],
    ];
    $encoded = base64_encode(json_encode($payload, JSON_THROW_ON_ERROR));
    $sig = hash('sha256', $encoded.'test_phonepe_salt_key_123').'###1';

    $this->postJson('/webhooks/phonepe', ['response' => $encoded], ['X-VERIFY' => $sig])
        ->assertOk()
        ->assertJsonPath('success', true);

    expect(\App\Services\BikeBookingPayments::remainder($booking->fresh()))->toBe(0.0);
    expect(Payment::where('booking_id', $booking->id)->count())->toBe(2);
});

test('another customer cannot trigger payment on someone elses booking', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-OWN-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->addDays(2)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'base_amount' => 450.00,
        'deposit_amount' => 0.00,
        'total_amount' => 531.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-own-01',
    ]);

    $this->actingAs($this->otherCustomer, 'web')
        ->postJson("/account/bookings/{$booking->id}/pay", ['payment_option' => 'balance'])
        ->assertForbidden();
});

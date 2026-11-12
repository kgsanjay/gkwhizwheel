<?php

declare(strict_types=1);

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use App\Notifications\BikeManagerBookingAlertNotification;
use App\Notifications\BookingConfirmationNotification;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('new guest can resolve account at checkout with zero friction', function () {
    $response = $this->postJson('/api/v1/auth/checkout-resolve', [
        'name' => 'Vikram Sharma',
        'phone' => '9845112233',
        'email' => 'vikram@example.com',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'status' => 'authenticated',
            'data' => [
                'user' => [
                    'name' => 'Vikram Sharma',
                    'phone' => '9845112233',
                    'email' => 'vikram@example.com',
                    'role' => 'customer',
                ],
            ],
        ]);

    expect($response->json('data.token'))->not->toBeNull();
    $this->assertDatabaseHas('users', [
        'phone' => '9845112233',
        'email' => 'vikram@example.com',
        'role' => UserRole::CUSTOMER->value,
    ]);
});

test('existing customer triggers 6-digit OTP challenge at checkout to protect account and KYC', function () {
    Notification::fake();

    $existing = User::create([
        'name' => 'Pooja Hegde',
        'phone' => '9876543210',
        'email' => 'pooja@example.com',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->postJson('/api/v1/auth/checkout-resolve', [
        'name' => 'Pooja Hegde',
        'phone' => '9876543210',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'status' => 'otp_required',
            'user_id' => $existing->id,
        ]);

    $cachedOtp = Cache::get("checkout_otp:{$existing->id}");
    expect($cachedOtp)->not->toBeNull()
        ->and(strlen((string) $cachedOtp))->toBe(6);

    // Verify OTP verification authenticates user
    $verifyRes = $this->postJson('/api/v1/auth/checkout-verify-otp', [
        'user_id' => $existing->id,
        'otp' => $cachedOtp,
    ]);

    $verifyRes->assertStatus(200)
        ->assertJson([
            'success' => true,
            'status' => 'authenticated',
            'data' => [
                'user' => [
                    'id' => $existing->id,
                    'phone' => '9876543210',
                ],
            ],
        ]);
});

test('phonepe payment can be initiated for travel service bookings', function () {
    $store = Store::create([
        'name' => 'Honnavar Hub',
        'address_line' => 'Station Rd',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2810,
        'longitude' => 74.4440,
        'status' => \App\Enums\StoreStatus::ACTIVE,
    ]);

    $user = User::create([
        'name' => 'Guest User',
        'email' => 'guest@example.com',
        'phone' => '9845012345',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $item = ServiceItem::create([
        'store_id' => $store->id,
        'service_type' => 'boating',
        'name' => 'Sharavathi Boat Safari',
        'price_base' => 1200.00,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);

    $serviceBooking = ServiceBooking::create([
        'store_id' => $store->id,
        'booking_number' => 'GKW-BOAT-261112-9999',
        'service_type' => 'boating',
        'service_item_id' => $item->id,
        'user_id' => $user->id,
        'customer_name' => 'Guest User',
        'customer_phone' => '9845012345',
        'customer_email' => 'guest@example.com',
        'booking_channel' => 'staff',
        'start_datetime' => now()->addDay(),
        'end_datetime' => now()->addDay()->addHour(),
        'quantity' => 1,
        'base_amount' => 1200.00,
        'total_amount' => 1200.00,
        'advance_paid' => 200.00,
        'balance_due' => 1000.00,
        'payment_status' => 'pending',
        'payment_method' => 'online',
        'status' => 'confirmed',
    ]);
    gkwAllocatePaymentFixture($serviceBooking);

    $response = $this->actingAs($user)
        ->postJson("/services/bookings/{$serviceBooking->booking_number}/initiate-payment", [
            'amount' => 1000.00,
            'gateway' => 'phonepe',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'gateway' => 'phonepe',
            'amount' => 1000.00,
            'booking_number' => $serviceBooking->booking_number,
        ]);

    expect($response->json('redirect_url'))->not->toBeNull()
        ->and($response->json('merchant_transaction_id'))->toStartWith('TXN_SRV_');
});

test('phonepe callback route redirects properly for bike and service bookings', function () {
    $bkRedirect = $this->get('/payment/phonepe/callback?merchantTransactionId=TXN_BK_123_abc');
    $bkRedirect->assertRedirect('/bookings/123/confirmation');

    $store = Store::create([
        'name' => 'Honnavar Hub',
        'address_line' => 'Station Rd',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2810,
        'longitude' => 74.4440,
        'status' => \App\Enums\StoreStatus::ACTIVE,
    ]);

    $srv = ServiceBooking::create([
        'store_id' => $store->id,
        'booking_number' => 'GKW-TAXI-261112-ABCD',
        'service_type' => 'taxi',
        'customer_name' => 'Cab Rider',
        'customer_phone' => '9845012345',
        'booking_channel' => 'online',
        'start_datetime' => now()->addDay(),
        'quantity' => 1,
        'base_amount' => 800.00,
        'total_amount' => 800.00,
        'advance_paid' => 0.00,
        'balance_due' => 800.00,
        'payment_status' => 'pending',
        'payment_method' => 'pay_on_arrival',
        'status' => 'confirmed',
    ]);

    $srvRedirect = $this->get("/payment/phonepe/callback?merchantTransactionId=TXN_SRV_{$srv->id}_xyz");
    $srvRedirect->assertRedirect("/services/bookings/{$srv->booking_number}/confirmation");
});

test('confirming bike booking notifies customer and manager', function () {
    Notification::fake();

    $store = Store::create([
        'name' => 'Honnavar Branch',
        'address_line' => 'Palya Main Rd',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2810,
        'longitude' => 74.4440,
        'status' => \App\Enums\StoreStatus::ACTIVE,
    ]);

    $manager = User::create([
        'name' => 'Honnavar Manager',
        'email' => 'manager@whizwheels.in',
        'phone' => '9845000001',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $manager->stores()->attach($store->id);

    $customer = User::create([
        'name' => 'Bike Customer',
        'email' => 'customer@example.com',
        'phone' => '9845000002',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $category = \App\Models\BikeCategory::create([
        'name' => 'Scooters',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $bike = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $store->id,
        'current_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-X-1234',
        'chassis_number' => 'CHAS12345',
        'engine_number' => 'ENG12345',
        'fuel_type' => 'petrol',
        'transmission' => \App\Enums\Transmission::AUTOMATIC,
        'daily_rate' => 450.00,
        'status' => \App\Enums\BikeStatus::AVAILABLE,
    ]);

    $booking = Booking::create([
        'booking_reference' => 'BK-TEST-123',
        'bike_id' => $bike->id,
        'user_id' => $customer->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => \App\Enums\BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 900.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1900.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'test-idemp-123',
    ]);

    $service = app(BookingService::class);
    $service->confirmPayment($booking, 'pay_mock_123');

    Notification::assertSentTo($customer, BookingConfirmationNotification::class);
    Notification::assertSentTo($manager, BikeManagerBookingAlertNotification::class);
});

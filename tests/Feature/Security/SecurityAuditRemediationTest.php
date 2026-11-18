<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\DiscountType;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Services\TwoFactorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Notification::fake();

    $this->storeA = Store::create([
        'name' => 'Honnavar Hub',
        'address_line' => 'Main Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.28,
        'longitude' => 74.45,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeB = Store::create([
        'name' => 'Murudeshwar Hub',
        'address_line' => 'Temple Road',
        'city' => 'Murudeshwar',
        'state' => 'Karnataka',
        'pincode' => '581350',
        'latitude' => 14.09,
        'longitude' => 74.49,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);

    $this->bikeA = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->storeA->id,
        'current_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-SEC-01',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->bikeB = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->storeB->id,
        'current_store_id' => $this->storeB->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-SEC-02',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer = User::factory()->create([
        'name' => 'Victim Customer',
        'email' => 'guest_9876543210@whizwheels.local',
        'phone' => '9876543210',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->managerA = User::factory()->create([
        'name' => 'Branch A Admin',
        'email' => 'brancha@whizwheels.in',
        'phone' => '9800000001',
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->managerA->stores()->attach($this->storeA->id);
    $this->managerA->syncAssignedServices(['two_wheelers']);
});

test('phonepe callback does not authenticate an unauthenticated caller as the booking owner', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-SEC-CB-01',
        'bike_id' => $this->bikeA->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'base_amount' => 500,
        'deposit_amount' => 0,
        'total_amount' => 500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'sec-cb-01',
    ]);

    $this->get('/payment/phonepe/callback?transactionId=TXN_BK_'.$booking->id.'_forged');

    $this->assertGuest('web');
});

test('admin 2fa setup cannot leak secret or bypass active 2fa challenge', function (): void {
    $twoFactor = app(TwoFactorService::class);
    $secret = $twoFactor->generateSecretKey();

    $superAdmin = User::factory()->create([
        'email' => 'superadmin-2fa-sec@whizwheels.in',
        'password' => Hash::make('VeryStrongPass#2026!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
        'two_factor_secret' => $secret,
        'two_factor_confirmed_at' => now(),
    ]);

    // Step 1: Valid password puts session into 2FA challenge state
    $this->post('/admin/login', [
        'login' => $superAdmin->email,
        'password' => 'VeryStrongPass#2026!',
    ])->assertRedirect(route('admin.2fa.challenge'));

    // Step 2: Attempting to visit /admin/2fa/setup must redirect back to challenge and never expose secret
    $this->get('/admin/2fa/setup')->assertRedirect(route('admin.2fa.challenge'));

    // Step 3: Attempting to visit /admin/2fa/recovery-codes unauthenticated must redirect to login
    $this->get('/admin/2fa/recovery-codes')->assertRedirect(route('admin.login'));
});

test('checkoutResolve does not overwrite victim email pre-OTP, leak unmasked PII, or resurrect deleted staff', function (): void {
    $res = $this->postJson('/api/v1/auth/checkout-resolve', [
        'name' => 'Attacker Name',
        'phone' => '9876543210',
        'email' => 'attacker@evil.example',
    ])->assertOk();

    // Victim email must remain untouched before OTP verification
    expect($this->customer->fresh()->email)->toBe('guest_9876543210@whizwheels.local')
        ->and($res->json('phone'))->toBeNull()
        ->and($res->json('email'))->toBeNull();

    // Soft-deleted staff account cannot be restored via checkout-resolve or customer OTP
    $deletedStaff = User::factory()->create([
        'email' => 'fired.staff@whizwheels.in',
        'phone' => '9811112222',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $deletedStaff->delete();

    $this->postJson('/login/otp/request', ['login' => 'fired.staff@whizwheels.in'])
        ->assertUnprocessable();

    expect($deletedStaff->fresh()->trashed())->toBeTrue();
});

test('service booking verify-payment rejects forged client settlement without PhonePe server verification', function (): void {
    $item = ServiceItem::create([
        'store_id' => $this->storeA->id,
        'service_type' => 'boating',
        'name' => 'Sharavathi Cruise',
        'price_base' => 1500,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);

    $booking = ServiceBooking::create([
        'store_id' => $this->storeA->id,
        'booking_number' => 'GKW-BT-SEC-FORGE',
        'service_type' => 'boating',
        'service_item_id' => $item->id,
        'user_id' => $this->customer->id,
        'customer_name' => 'Victim Customer',
        'customer_phone' => '9876543210',
        'booking_channel' => 'offline_walkin',
        'start_datetime' => now()->addDays(2),
        'quantity' => 1,
        'base_amount' => 1500,
        'total_amount' => 1500,
        'advance_paid' => 0,
        'balance_due' => 1500,
        'payment_status' => 'pending',
        'status' => 'confirmed',
    ]);

    Http::fake([
        '*/pg/v1/status/*' => Http::response(['success' => false, 'code' => 'PAYMENT_PENDING'], 200),
    ]);

    $this->actingAs($this->customer)
        ->postJson("/services/bookings/{$booking->booking_number}/verify-payment", [
            'phonepe_transaction_id' => "TXN_SRV_{$booking->id}_forged",
            'amount' => 1500,
        ])
        ->assertUnprocessable();

    expect((float) $booking->fresh()->balance_due)->toBe(1500.0)
        ->and($booking->fresh()->payment_status)->toBe('pending');
});

test('branch admin cannot refund another branch booking, read other branch utilization, promote coupon globally, or escalate staff services', function (): void {
    $bookingB = Booking::create([
        'booking_reference' => 'BK-SEC-BRB-01',
        'bike_id' => $this->bikeB->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'base_amount' => 500,
        'deposit_amount' => 0,
        'total_amount' => 500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'sec-brb-01',
    ]);

    Sanctum::actingAs($this->managerA, $this->managerA->tokenAbilities());

    // Cross-branch refund blocked
    $this->postJson("/api/v1/admin/bookings/{$bookingB->id}/refund", [
        'amount' => 100,
        'reason' => 'Unauthorized cross-branch refund',
    ])->assertForbidden();

    // Cross-branch utilization query blocked
    $this->getJson("/api/v1/admin/reports/utilization?store_id={$this->storeB->id}")
        ->assertForbidden();

    // Promoting branch coupon to global scope blocked
    $coupon = Coupon::create([
        'code' => 'BRANCHA10',
        'store_id' => $this->storeA->id,
        'discount_type' => DiscountType::FIXED,
        'value' => 50,
        'valid_from' => now()->subDay(),
        'valid_until' => now()->addMonth(),
        'is_active' => true,
    ]);

    $this->actingAs($this->managerA, 'admin')
        ->put("/admin/coupons/{$coupon->id}", [
            'store_id' => null,
        ])
        ->assertForbidden();

    // Assigning unauthorized service vertical to new staff blocked
    $this->actingAs($this->managerA, 'admin')
        ->post('/admin/staff', [
            'name' => 'Escalated Staff',
            'email' => 'escalated.staff@whizwheels.in',
            'phone' => '9822223333',
            'password' => 'StrongPass123!',
            'role' => UserRole::STAFF->value,
            'store_ids' => [$this->storeA->id],
            'services' => ['two_wheelers', 'scuba'],
        ])
        ->assertForbidden();
});

test('coupon max_uses_per_user and max_uses_total are recorded and enforced on holdBooking', function (): void {
    Coupon::create([
        'code' => 'ONCEONLY50',
        'store_id' => $this->storeA->id,
        'discount_type' => DiscountType::FIXED,
        'value' => 50,
        'max_uses_total' => 1,
        'max_uses_per_user' => 1,
        'valid_from' => now()->subDay(),
        'valid_until' => now()->addMonth(),
        'is_active' => true,
    ]);

    $availability = app(AvailabilityService::class);
    $first = $availability->holdBooking([
        'bike_id' => $this->bikeA->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'start_date' => now()->addDays(2)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'channel' => BookingChannel::ONLINE,
        'idempotency_key' => 'coupon-use-1',
        'coupon_code' => 'ONCEONLY50',
    ]);

    expect((float) $first->discount_amount)->toBe(50.0);
    $this->assertDatabaseHas('coupon_usages', [
        'booking_id' => $first->id,
        'user_id' => $this->customer->id,
    ]);

    // Second booking attempt with the same single-use coupon receives 0 discount (usage limit reached)
    $second = $availability->holdBooking([
        'bike_id' => $this->bikeA->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'start_date' => now()->addDays(10)->toDateString(),
        'end_date' => now()->addDays(11)->toDateString(),
        'channel' => BookingChannel::ONLINE,
        'idempotency_key' => 'coupon-use-2',
        'coupon_code' => 'ONCEONLY50',
    ]);

    expect((float) $second->discount_amount)->toBe(0.0);
});

test('email_verified_at persists on API OTP verify and clears when customer changes email', function (): void {
    $this->customer->forceFill(['email_verified_at' => null])->save();
    Cache::put("otp:{$this->customer->email}", '246810', now()->addMinutes(10));

    $this->postJson('/api/v1/auth/otp/verify', [
        'email' => $this->customer->email,
        'otp' => '246810',
    ])->assertOk();

    $this->customer->refresh();
    expect($this->customer->email_verified_at)->not->toBeNull();

    $this->actingAs($this->customer)
        ->post('/account/profile', [
            'name' => $this->customer->name,
            'email' => 'changed.customer@example.test',
            'phone' => $this->customer->phone,
        ])
        ->assertRedirect();

    expect($this->customer->fresh()->email)->toBe('changed.customer@example.test')
        ->and($this->customer->fresh()->email_verified_at)->toBeNull();
});

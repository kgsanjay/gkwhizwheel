<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Koramangala Hub',
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
        'name' => 'Standard Commuter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA01CD5678',
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 3000,
    ]);

    $this->customer = User::create([
        'name' => 'Aditi Rao',
        'email' => 'aditi.rao@example.com',
        'phone' => '9876543299',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->superAdmin = User::create([
        'name' => 'HQ Finance Admin',
        'email' => 'finance_admin@gkwhizwheel.com',
        'phone' => '9876500555',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Store Associate',
        'email' => 'store_associate@gkwhizwheel.com',
        'phone' => '9876500666',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->booking = Booking::create([
        'booking_reference' => 'BK-REFUND-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(5)->toDateString(),
        'base_amount' => 1500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 3000.00,
        'price_breakdown_json' => ['base_rate' => 500, 'days' => 3, 'deposit' => 1500, 'total' => 3000],
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $this->payment = Payment::create([
        'booking_id' => $this->booking->id,
        'amount' => 3000.00,
        'type' => 'advance',
        'status' => PaymentStatus::SUCCESS,
        'method' => 'razorpay',
        'gateway_reference' => 'pay_refund_test_01',
    ]);
});

test('unauthenticated users cannot access refund screen or trigger refunds', function (): void {
    $this->get("/admin/bookings/{$this->booking->id}/refund")->assertRedirect('/admin/login');
    $this->post("/admin/bookings/{$this->booking->id}/refund", [])->assertRedirect('/admin/login');
});

test('regular staff cannot process refunds and receive 403 forbidden', function (): void {
    $this->actingAs($this->staff)
        ->get("/admin/bookings/{$this->booking->id}/refund")
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->post("/admin/bookings/{$this->booking->id}/refund", [
            'amount' => 1000.00,
            'reason' => 'Unauthorized attempt',
        ])
        ->assertForbidden();
});

test('super admin can load refund screen with policy calculation', function (): void {
    $this->actingAs($this->superAdmin)
        ->get("/admin/bookings/{$this->booking->id}/refund")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Bookings/Refund')
                ->where('booking.id', $this->booking->id)
                ->where('total_paid', 3000)
                ->where('max_refundable', 3000)
                ->has('calculation')
                ->where('calculation.is_full_refund', true)
                ->where('calculation.refund_amount', 3000)
        );
});

test('super admin can execute refund and optionally mark booking as cancelled', function (): void {
    $payload = [
        'amount' => 3000.00,
        'reason' => 'Customer requested cancellation more than 48 hours prior',
        'payment_id' => $this->payment->id,
        'mark_cancelled' => true,
    ];

    $this->actingAs($this->superAdmin)
        ->post("/admin/bookings/{$this->booking->id}/refund", $payload)
        ->assertRedirect('/admin/bookings')
        ->assertSessionHas('success');

    $this->assertDatabaseHas('refunds', [
        'booking_id' => $this->booking->id,
        'amount' => 3000.00,
        'status' => RefundStatus::PENDING->value,
    ]);

    $this->booking->refresh();
    expect($this->booking->status)->toBe(BookingStatus::CANCELLED);
});

test('refund execution rejects amount higher than maximum refundable balance', function (): void {
    $this->actingAs($this->superAdmin)
        ->post("/admin/bookings/{$this->booking->id}/refund", [
            'amount' => 5000.00, // exceeds 3000 paid
            'reason' => 'Excessive refund test',
        ])
        ->assertSessionHasErrors('amount');
});

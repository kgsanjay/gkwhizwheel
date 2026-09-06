<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
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
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store1 = Store::create([
        'name' => 'Indiranagar Hub',
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

    $this->bike1 = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA01AB1234',
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
    ]);

    $this->customer = User::create([
        'name' => 'Rahul Verma',
        'email' => 'rahul.verma@example.com',
        'phone' => '9876543210',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->superAdmin = User::create([
        'name' => 'Super Admin Officer',
        'email' => 'super_admin_bk@gkwhizwheel.com',
        'phone' => '9876500333',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Store Floor Staff',
        'email' => 'staff_bk@gkwhizwheel.com',
        'phone' => '9876500444',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->booking1 = Booking::create([
        'booking_reference' => 'BK-2026-0001',
        'bike_id' => $this->bike1->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(3)->toDateString(),
        'base_amount' => 1500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 3000.00,
        'price_breakdown_json' => ['base_rate' => 500, 'total' => 3000],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
    ]);

    Payment::create([
        'booking_id' => $this->booking1->id,
        'amount' => 3000.00,
        'type' => 'advance',
        'status' => PaymentStatus::SUCCESS,
        'method' => 'razorpay',
        'gateway_reference' => 'pay_test_0001',
    ]);
});

test('unauthenticated users are redirected to login for bookings management', function (): void {
    $this->get('/admin/bookings')->assertRedirect('/admin/login');
    $this->get("/admin/bookings/{$this->booking1->id}/edit")->assertRedirect('/admin/login');
    $this->put("/admin/bookings/{$this->booking1->id}", [])->assertRedirect('/admin/login');
});

test('super admin can view unified bookings index with list and calendar data', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/bookings')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Bookings/Index')
                ->has('bookings.data', 1)
                ->has('calendar_events')
                ->has('stats')
                ->has('stores', 2)
                ->has('statuses')
                ->has('channels')
                ->where('bookings.data.0.booking_reference', 'BK-2026-0001')
                ->where('stats.confirmed', 1)
        );
});

test('bookings can be filtered by store, channel, and status', function (): void {
    // Second booking offline in store 2
    Booking::create([
        'booking_reference' => 'BK-2026-0002',
        'bike_id' => $this->bike1->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store2->id,
        'return_store_id' => $this->store2->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HANDED_OVER,
        'start_date' => Carbon::today()->toDateString(),
        'end_date' => Carbon::today()->addDays(2)->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => ['base_rate' => 500, 'total' => 2500],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
    ]);

    // Filter by channel = offline
    $this->actingAs($this->superAdmin)
        ->get('/admin/bookings?channel=offline')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Bookings/Index')
                ->has('bookings.data', 1)
                ->where('bookings.data.0.booking_reference', 'BK-2026-0002')
        );

    // Filter by store = store1
    $this->actingAs($this->superAdmin)
        ->get("/admin/bookings?store_id={$this->store1->id}")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Bookings/Index')
                ->has('bookings.data', 1)
                ->where('bookings.data.0.booking_reference', 'BK-2026-0001')
        );

    // Filter by status = handed_over
    $this->actingAs($this->superAdmin)
        ->get('/admin/bookings?status=handed_over')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Bookings/Index')
                ->has('bookings.data', 1)
                ->where('bookings.data.0.booking_reference', 'BK-2026-0002')
        );
});

test('super admin can load booking edit screen', function (): void {
    $this->actingAs($this->superAdmin)
        ->get("/admin/bookings/{$this->booking1->id}/edit")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Bookings/Edit')
                ->where('booking.id', $this->booking1->id)
                ->where('booking.booking_reference', 'BK-2026-0001')
                ->has('stores')
                ->has('statuses')
        );
});

test('regular staff cannot manually edit bookings and receive 403', function (): void {
    $this->actingAs($this->staff)
        ->get("/admin/bookings/{$this->booking1->id}/edit")
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->put("/admin/bookings/{$this->booking1->id}", [
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-12',
            'pickup_store_id' => $this->store1->id,
            'return_store_id' => $this->store1->id,
            'status' => 'confirmed',
        ])
        ->assertForbidden();
});

test('super admin can update booking dates and store locations', function (): void {
    $newStart = Carbon::tomorrow()->addDays(10)->toDateString();
    $newEnd = Carbon::tomorrow()->addDays(14)->toDateString();

    $this->actingAs($this->superAdmin)
        ->put("/admin/bookings/{$this->booking1->id}", [
            'start_date' => $newStart,
            'end_date' => $newEnd,
            'pickup_store_id' => $this->store2->id,
            'return_store_id' => $this->store2->id,
            'status' => 'confirmed',
            'late_fee_amount' => 150.00,
            'damage_fee_amount' => 0.00,
        ])
        ->assertRedirect('/admin/bookings')
        ->assertSessionHas('success');

    $this->booking1->refresh();
    expect($this->booking1->start_date?->toDateString())->toBe($newStart);
    expect($this->booking1->end_date?->toDateString())->toBe($newEnd);
    expect($this->booking1->pickup_store_id)->toBe($this->store2->id);
    expect((float) $this->booking1->late_fee_amount)->toBe(150.00);
});

test('manual edit rejects conflicting overlapping dates for the same bike', function (): void {
    // Create an existing confirmed booking for bike1 on days 20 to 25
    $conflictStart = Carbon::tomorrow()->addDays(20)->toDateString();
    $conflictEnd = Carbon::tomorrow()->addDays(25)->toDateString();

    Booking::create([
        'booking_reference' => 'BK-CONFLICT-001',
        'bike_id' => $this->bike1->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => $conflictStart,
        'end_date' => $conflictEnd,
        'base_amount' => 1500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 3000.00,
        'price_breakdown_json' => ['base_rate' => 500, 'total' => 3000],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
    ]);

    // Attempt to move booking1 to overlap with conflict dates
    $this->actingAs($this->superAdmin)
        ->put("/admin/bookings/{$this->booking1->id}", [
            'start_date' => Carbon::tomorrow()->addDays(22)->toDateString(),
            'end_date' => Carbon::tomorrow()->addDays(24)->toDateString(),
            'pickup_store_id' => $this->store1->id,
            'return_store_id' => $this->store1->id,
            'status' => 'confirmed',
        ])
        ->assertSessionHasErrors('start_date');
});

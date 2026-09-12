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
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store = Store::create([
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

    $this->category = BikeCategory::create([
        'name' => 'Electric Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Ather',
        'model_name' => '450X',
        'registration_number' => 'KA-01-EV-9999',
        'fuel_type' => FuelType::ELECTRIC,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 1200,
    ]);

    $this->superAdmin = User::create([
        'name' => 'Chief Administrator',
        'email' => 'admin@gkwhizwheel.com',
        'phone' => '9876500099',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->storeManager = User::create([
        'name' => 'Indiranagar Manager',
        'email' => 'manager.indiranagar@gkwhizwheel.com',
        'phone' => '9876500088',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->storeManager->stores()->attach($this->store->id);

    $this->staff = User::create([
        'name' => 'Ravi Kumar',
        'email' => 'staff.indiranagar@gkwhizwheel.com',
        'phone' => '9876500077',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->store->id);

    $this->customer = User::create([
        'name' => 'Normal Customer',
        'email' => 'customer@example.com',
        'phone' => '9876543210',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated user visiting /admin is redirected to /admin/login', function (): void {
    $response = $this->get('/admin');

    $response->assertRedirect('/admin/login');
});

test('unauthenticated user can view admin login page', function (): void {
    $response = $this->get('/admin/login');

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Admin/Login')
    );
});

test('customer attempting to login via /admin/login is rejected', function (): void {
    $response = $this->post('/admin/login', [
        'login' => 'customer@example.com',
        'password' => 'Password123!',
    ]);

    $response->assertSessionHasErrors(['login']);
    $this->assertGuest();
});

test('customer attempting to access /admin directly receives 403 Forbidden', function (): void {
    $response = $this->actingAs($this->customer)->get('/admin');

    $response->assertStatus(403);
});

test('super admin login via /admin/login requires 2fa setup before accessing /admin', function (): void {
    $response = $this->post('/admin/login', [
        'login' => 'admin@gkwhizwheel.com',
        'password' => 'Password123!',
    ]);

    $response->assertRedirect(route('admin.2fa.setup'));
});

test('staff member can login directly via /admin/login without 2fa and is redirected to /admin', function (): void {
    $response = $this->post('/admin/login', [
        'login' => $this->staff->email,
        'password' => 'Password123!',
    ]);

    $response->assertRedirect('/admin/dashboard');
    $this->assertAuthenticatedAs($this->staff);
});

test('super admin accessing /admin sees dashboard with system-wide stats and stores', function (): void {
    Booking::create([
        'booking_reference' => 'BK-TEST-001',
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HANDED_OVER,
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::yesterday()->toDateString(),
        'end_date' => Carbon::tomorrow()->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $response = $this->actingAs($this->superAdmin)->get('/admin');

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Admin/Dashboard')
        ->where('auth.user.role', 'super_admin')
        ->where('metrics.active_rentals', 1)
        ->where('metrics.fleet_total', 1)
        ->where('metrics.fleet_available', 1)
        ->has('recent_bookings', 1)
        ->has('stores', 1)
    );
});

test('store manager can login and access /admin with store-scoped metrics', function (): void {
    $response = $this->actingAs($this->storeManager)->get('/admin');

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Admin/Dashboard')
        ->where('auth.user.role', 'store_manager')
        ->where('current_store.id', $this->store->id)
    );
});

test('staff member can login and access /admin with operational dashboard', function (): void {
    $response = $this->actingAs($this->staff)->get('/admin');

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Admin/Dashboard')
        ->where('auth.user.role', 'staff')
        ->where('current_store.id', $this->store->id)
    );
});

test('admin user can logout and session is terminated', function (): void {
    $this->actingAs($this->superAdmin);

    $response = $this->post('/admin/logout');

    $response->assertRedirect('/admin/login');
    $this->assertGuest();
});

test('already logged-in admin visiting /admin/login is redirected to /admin', function (): void {
    $response = $this->actingAs($this->superAdmin)->get('/admin/login');

    $response->assertRedirect('/admin/dashboard');
});

test('inactive or blacklisted admin cannot login', function (): void {
    $this->superAdmin->update(['status' => UserStatus::BLACKLISTED]);

    $response = $this->post('/admin/login', [
        'login' => 'admin@gkwhizwheel.com',
        'password' => 'Password123!',
    ]);

    $response->assertSessionHasErrors(['login']);
    $this->assertGuest();
});

test('admin dashboard provides summary stat cards across all 7 service lines', function (): void {
    $serviceItem = \App\Models\ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sunset Sharavathi Boat Ride',
        'category' => 'Speedboat',
        'description' => 'Fast boat across Sharavathi backwaters.',
        'price_base' => 1200.00,
        'price_unit' => 'per_trip',
        'status' => 'available',
        'sort_order' => 1,
    ]);

    \App\Models\ServiceBooking::create([
        'booking_number' => 'SB-TEST-001',
        'service_type' => 'boating',
        'service_item_id' => $serviceItem->id,
        'customer_name' => 'Rohan Dev',
        'customer_phone' => '9876543210',
        'start_datetime' => Carbon::today()->addHours(2),
        'end_datetime' => Carbon::today()->addHours(4),
        'base_amount' => 1200.00,
        'tax_amount' => 0.00,
        'discount_amount' => 0.00,
        'total_amount' => 1200.00,
        'advance_paid' => 500.00,
        'balance_due' => 700.00,
        'payment_status' => 'partial',
        'status' => 'confirmed',
        'booking_channel' => 'online',
    ]);

    $response = $this->actingAs($this->superAdmin)->get('/admin');

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->has('service_metrics', 7)
            ->where('service_metrics.2.type', 'boating')
            ->where('service_metrics.2.available_items', 1)
            ->where('service_metrics.2.active_bookings', 1)
            ->where('service_metrics.2.today_check_ins', 1)
            ->has('metrics.fleet_booked')
            ->has('metrics.fleet_maintenance')
    );
});

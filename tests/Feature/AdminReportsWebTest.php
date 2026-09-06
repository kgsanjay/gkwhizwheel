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
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
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

    $this->category = BikeCategory::create([
        'name' => 'Electric Scooter',
        'base_daily_rate' => 600.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Ather',
        'model_name' => '450X Gen 3',
        'registration_number' => 'KA01EV9999',
        'fuel_type' => 'electric',
        'transmission' => 'automatic',
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 1200,
    ]);

    $this->customer = User::create([
        'name' => 'Sameer Khan',
        'email' => 'sameer.khan@example.com',
        'phone' => '9876500999',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->superAdmin = User::create([
        'name' => 'Executive Officer',
        'email' => 'executive@gkwhizwheel.com',
        'phone' => '9876500888',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->storeManager = User::create([
        'name' => 'Store Leader',
        'email' => 'manager_rpt@gkwhizwheel.com',
        'phone' => '9876500777',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->storeManager->stores()->attach([$this->store1->id]);

    $this->staff = User::create([
        'name' => 'Floor Associate',
        'email' => 'staff_rpt@gkwhizwheel.com',
        'phone' => '9876500666',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    // Create a completed booking with payment and partial refund
    $this->booking = Booking::create([
        'booking_reference' => 'BK-RPT-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::RETURNED,
        'start_date' => Carbon::now()->subDays(5)->toDateString(),
        'end_date' => Carbon::now()->subDays(2)->toDateString(),
        'base_amount' => 1800.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3800.00,
        'price_breakdown_json' => ['base_rate' => 600, 'days' => 3, 'deposit' => 2000, 'total' => 3800],
        'idempotency_key' => (string) Str::uuid(),
    ]);

    Payment::create([
        'booking_id' => $this->booking->id,
        'amount' => 3800.00,
        'type' => 'advance',
        'status' => PaymentStatus::SUCCESS,
        'method' => 'razorpay',
        'gateway_reference' => 'pay_rpt_01',
        'created_at' => Carbon::now()->subDays(5),
    ]);

    Refund::create([
        'booking_id' => $this->booking->id,
        'amount' => 2000.00, // deposit returned
        'reason' => 'Deposit returned after bike return',
        'status' => RefundStatus::COMPLETED,
        'processed_by' => $this->superAdmin->id,
        'gateway_reference' => 'rfnd_rpt_01',
        'created_at' => Carbon::now()->subDays(2),
    ]);
});

test('unauthenticated users cannot view reports and analytics dashboard', function (): void {
    $this->get('/admin/reports')->assertRedirect('/admin/login');
});

test('regular hub staff cannot view executive reports and receive 403', function (): void {
    $this->actingAs($this->staff)
        ->get('/admin/reports')
        ->assertForbidden();
});

test('super admin can load executive reports dashboard with revenue and utilization stats', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/reports')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->has('revenue_stats')
                ->where('revenue_stats.gross_revenue', 3800)
                ->where('revenue_stats.refunds_issued', 2000)
                ->where('revenue_stats.net_revenue', 1800)
                ->has('revenue_stats.timeline')
                ->has('revenue_stats.category_breakdown')
                ->has('revenue_stats.store_breakdown')
                ->has('revenue_stats.channel_breakdown')
                ->has('utilization_stats')
                ->where('utilization_stats.total_fleet', 1)
                ->where('utilization_stats.active_fleet', 1)
                ->has('utilization_stats.timeline')
                ->has('utilization_stats.top_bikes', 1)
                ->has('stores', 1)
                ->has('filters')
        );
});

test('store manager can view reports scoped to assigned store hub', function (): void {
    $this->actingAs($this->storeManager)
        ->get('/admin/reports')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('revenue_stats.gross_revenue', 3800)
                ->where('utilization_stats.total_fleet', 1)
        );
});

test('reports support timeframe and store filtering', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/reports?timeframe=7d')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('filters.timeframe', '7d')
        );

    $this->actingAs($this->superAdmin)
        ->get("/admin/reports?store_id={$this->store1->id}")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('filters.store_id', $this->store1->id)
        );
});

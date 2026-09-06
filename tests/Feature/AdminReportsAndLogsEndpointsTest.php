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
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::create([
        'name' => 'Reports Admin',
        'email' => 'admin_reports@gkwhizwheel.com',
        'phone' => '9999900401',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Reports Customer',
        'email' => 'customer_reports@gkwhizwheel.com',
        'phone' => '9999900402',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Store North',
        'address_line' => '100 North Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 13.0000,
        'longitude' => 77.6000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Store South',
        'address_line' => '200 South Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560078',
        'latitude' => 12.9000,
        'longitude' => 77.5800,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Commuter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike1 = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Hero',
        'model_name' => 'Splendor',
        'registration_number' => 'KA-01-SP-1001',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->bike2 = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store2->id,
        'home_store_id' => $this->store2->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter',
        'registration_number' => 'KA-01-JP-2002',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('unauthenticated users cannot access reports or activity logs', function (): void {
    $this->getJson('/api/v1/admin/reports/revenue')->assertStatus(401);
    $this->getJson('/api/v1/admin/reports/utilization')->assertStatus(401);
    $this->getJson('/api/v1/admin/activity-logs')->assertStatus(401);
});

test('non-admin users receive 403 on reports and activity logs', function (): void {
    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/admin/reports/revenue')->assertStatus(403);
    $this->getJson('/api/v1/admin/reports/utilization')->assertStatus(403);
    $this->getJson('/api/v1/admin/activity-logs')->assertStatus(403);
});

test('admin can view revenue reports grouped by store, channel, and bike', function (): void {
    Sanctum::actingAs($this->admin);

    // Seed bookings
    Booking::create([
        'booking_reference' => 'BK-REV-01',
        'bike_id' => $this->bike1->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_report_01',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-03',
        'base_amount' => 1500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 3000.00,
        'price_breakdown_json' => [],
    ]);

    Booking::create([
        'booking_reference' => 'BK-REV-02',
        'bike_id' => $this->bike2->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store2->id,
        'return_store_id' => $this->store2->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::COMPLETED,
        'idempotency_key' => 'idem_report_02',
        'start_date' => '2026-09-05',
        'end_date' => '2026-09-07',
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
    ]);

    // Grouped by store
    $storeRes = $this->getJson('/api/v1/admin/reports/revenue?start_date=2026-09-01&end_date=2026-09-30&group_by=store');
    $storeRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_revenue', 5500)
        ->assertJsonPath('data.total_bookings', 2)
        ->assertJsonCount(2, 'data.items');

    // Grouped by channel
    $channelRes = $this->getJson('/api/v1/admin/reports/revenue?start_date=2026-09-01&end_date=2026-09-30&group_by=channel');
    $channelRes->assertStatus(200)
        ->assertJsonPath('data.group_by', 'channel')
        ->assertJsonCount(2, 'data.items');

    // Grouped by bike
    $bikeRes = $this->getJson('/api/v1/admin/reports/revenue?start_date=2026-09-01&end_date=2026-09-30&group_by=bike');
    $bikeRes->assertStatus(200)
        ->assertJsonPath('data.group_by', 'bike')
        ->assertJsonCount(2, 'data.items');
});

test('admin can view fleet and per-bike utilization report', function (): void {
    Sanctum::actingAs($this->admin);

    // Bike 1 booked for 5 days: Sep 1 to Sep 5
    Booking::create([
        'booking_reference' => 'BK-UTIL-01',
        'bike_id' => $this->bike1->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_util_01',
        'start_date' => '2026-09-01',
        'end_date' => '2026-09-05',
        'base_amount' => 2500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 4000.00,
        'price_breakdown_json' => [],
    ]);

    // Window: Sep 1 to Sep 10 (10 days)
    $response = $this->getJson('/api/v1/admin/reports/utilization?start_date=2026-09-01&end_date=2026-09-10');

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_days', 10)
        ->assertJsonPath('data.total_bikes', 2)
        // Bike 1 has 5/10 days = 50%, Bike 2 has 0/10 = 0%. Overall fleet: 5 / 20 = 25%
        ->assertJsonPath('data.overall_utilization_percentage', 25)
        ->assertJsonCount(2, 'data.bikes');

    $bike1Data = collect($response->json('data.bikes'))->firstWhere('id', $this->bike1->id);
    expect($bike1Data['booked_days'])->toBe(5)
        ->and($bike1Data['utilization_percentage'])->toEqual(50);
});

test('admin can view and filter activity logs audit trail', function (): void {
    Sanctum::actingAs($this->admin);

    ActivityLog::create([
        'user_id' => $this->admin->id,
        'store_id' => $this->store1->id,
        'action' => 'admin_store_created',
        'subject_type' => Store::class,
        'subject_id' => $this->store1->id,
        'old_values' => null,
        'new_values' => ['name' => 'Store North'],
    ]);

    ActivityLog::create([
        'user_id' => $this->customer->id,
        'store_id' => $this->store2->id,
        'action' => 'customer_booking_hold',
        'subject_type' => Booking::class,
        'subject_id' => 1,
        'old_values' => null,
        'new_values' => ['status' => 'held'],
    ]);

    // List all
    $resAll = $this->getJson('/api/v1/admin/activity-logs');
    $resAll->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);

    // Filter by action
    $resAction = $this->getJson('/api/v1/admin/activity-logs?action=store_created');
    $resAction->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.action', 'admin_store_created');

    // Filter by store_id
    $resStore = $this->getJson('/api/v1/admin/activity-logs?store_id='.$this->store2->id);
    $resStore->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.action', 'customer_booking_hold');
});

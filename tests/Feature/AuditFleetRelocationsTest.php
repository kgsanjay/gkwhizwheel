<?php

declare(strict_types=1);

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
use App\Models\BikeRelocationTask;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->a = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888807001', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->b = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888807002', 'status' => StoreStatus::ACTIVE,
    ]);
    $customer = User::create([
        'name' => 'Guest', 'email' => 'fleet.audit@example.test', 'phone' => '9888807003',
        'password' => 'Password123!', 'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->bike = Bike::create([
        'category_id' => $category->id, 'current_store_id' => $this->a->id,
        'home_store_id' => $this->a->id, 'brand' => 'Honda',
        'model_name' => 'Activa', 'registration_number' => 'KA-47-FLEET-01',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $base = [
        'bike_id' => $this->bike->id, 'user_id' => $customer->id,
        'channel' => BookingChannel::ONLINE, 'status' => BookingStatus::CONFIRMED,
        'base_amount' => 1000, 'deposit_amount' => 0, 'total_amount' => 1000,
        'price_breakdown_json' => [],
    ];
    $this->trigger = Booking::create($base + [
        'booking_reference' => 'FLEET-AUDIT-PAST', 'idempotency_key' => 'fleet-audit-past',
        'pickup_store_id' => $this->a->id, 'return_store_id' => $this->a->id,
        'start_date' => now()->subDays(4)->toDateString(),
        'end_date' => now()->subDays(2)->toDateString(),
    ]);
    $this->future = Booking::create($base + [
        'booking_reference' => 'FLEET-AUDIT-FUTURE', 'idempotency_key' => 'fleet-audit-future',
        'pickup_store_id' => $this->b->id, 'return_store_id' => $this->b->id,
        'start_date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(4)->toDateString(),
    ]);
});

test('strict fleet audit detects a missing relocation task without modifying bookings', function (): void {
    $this->artisan('fleet:audit-relocations')->assertSuccessful();
    $this->artisan('fleet:audit-relocations', ['--strict' => true])->assertFailed();
    expect($this->future->fresh()->status)->toBe(BookingStatus::CONFIRMED)
        ->and($this->bike->fresh()->current_store_id)->toBe($this->a->id)
        ->and(BikeRelocationTask::count())->toBe(0);
});

test('strict fleet audit still fails for a tracked but unresolved pickup conflict', function (): void {
    BikeRelocationTask::create([
        'bike_id' => $this->bike->id, 'triggering_booking_id' => $this->trigger->id,
        'affected_booking_id' => $this->future->id, 'from_store_id' => $this->a->id,
        'required_store_id' => $this->b->id, 'status' => 'open',
    ]);
    $this->artisan('fleet:audit-relocations', ['--strict' => true])->assertFailed();
    expect(BikeRelocationTask::where('status', 'open')->count())->toBe(1);
});

test('fleet audit catches stale task after affected booking cancellation', function (): void {
    BikeRelocationTask::create([
        'bike_id' => $this->bike->id, 'triggering_booking_id' => $this->trigger->id,
        'affected_booking_id' => $this->future->id, 'from_store_id' => $this->a->id,
        'required_store_id' => $this->b->id, 'status' => 'open',
    ]);
    $this->future->update(['status' => BookingStatus::CANCELLED]);
    $this->artisan('fleet:audit-relocations', ['--strict' => true])->assertFailed();
});

test('strict fleet audit passes once bike is correctly located and obsolete task dismissed', function (): void {
    $task = BikeRelocationTask::create([
        'bike_id' => $this->bike->id, 'triggering_booking_id' => $this->trigger->id,
        'affected_booking_id' => $this->future->id, 'from_store_id' => $this->a->id,
        'required_store_id' => $this->b->id, 'status' => 'dismissed',
    ]);
    $this->bike->update(['current_store_id' => $this->b->id]);
    $this->artisan('fleet:audit-relocations', ['--strict' => true])->assertSuccessful();
    expect($task->fresh()->status)->toBe('dismissed');
});

test('fleet audit validates sample size', function (): void {
    $this->artisan('fleet:audit-relocations', ['--sample' => 101])->assertFailed();
});

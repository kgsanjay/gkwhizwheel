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
use App\Models\Booking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('branch preflight is successful on an empty migrated database', function (): void {
    $this->artisan('app:branch-preflight')->assertSuccessful();
});

test('branch preflight fails without a valid sample size', function (): void {
    $this->artisan('app:branch-preflight', ['--sample' => 101])->assertFailed();
});

test('branch preflight rejects negative and nonnumeric sample sizes', function (): void {
    $this->artisan('app:branch-preflight', ['--sample' => -1])->assertFailed();
    $this->artisan('app:branch-preflight', ['--sample' => 'invalid'])->assertFailed();
});

test('branch preflight accepts zero sample records without mutating inventory', function (): void {
    $this->artisan('app:branch-preflight', ['--sample' => 0])->assertSuccessful();
});

test('branch preflight refuses unassigned service inventory without reassigning it', function (): void {
    $item = ServiceItem::create([
        'name' => 'Legacy Taxi', 'service_type' => 'taxi',
        'price_base' => 1500, 'status' => 'available',
    ]);

    $this->artisan('app:branch-preflight', ['--sample' => 1])->assertFailed();
    expect($item->fresh()->store_id)->toBeNull();
});

test('branch preflight rejects a future pickup requiring a different physical bike location', function (): void {
    $murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888807101', 'status' => StoreStatus::ACTIVE,
    ]);
    $honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888807102', 'status' => StoreStatus::ACTIVE,
    ]);
    $customer = User::create([
        'name' => 'Test Customer', 'email' => 'preflight.customer@example.test',
        'phone' => '9888807103', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id, 'home_store_id' => $murudeshwar->id,
        'current_store_id' => $murudeshwar->id, 'brand' => 'Honda',
        'model_name' => 'Activa', 'registration_number' => 'KA-47-PREF-01',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $booking = Booking::create([
        'booking_reference' => 'PREF-BOOKING-01', 'bike_id' => $bike->id,
        'user_id' => $customer->id, 'pickup_store_id' => $honnavar->id,
        'return_store_id' => $honnavar->id, 'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(4)->toDateString(),
        'base_amount' => 1000, 'deposit_amount' => 0, 'total_amount' => 1000,
        'price_breakdown_json' => [], 'idempotency_key' => 'preflight-pickup',
    ]);

    $this->artisan('app:branch-preflight')->assertFailed();
    expect($booking->fresh()->status)->toBe(BookingStatus::CONFIRMED)
        ->and($bike->fresh()->current_store_id)->toBe($murudeshwar->id);
});

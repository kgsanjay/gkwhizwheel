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
use App\Models\BikeModel;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.44, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'KSRTC Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->model = BikeModel::create([
        'category_id' => $category->id,
        'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
    ]);
    $this->customer = User::create([
        'name' => 'Rider', 'email' => 'model.availability@example.test',
        'phone' => '9000009401', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->start = now()->addDays(8)->toDateString();
    $this->end = now()->addDays(9)->toDateString();
    $this->earlyStart = now()->addDays(3)->toDateString();
    $this->earlyEnd = now()->addDays(4)->toDateString();
});

function modelBike($test, Store $store, string $registration, BikeStatus $status = BikeStatus::AVAILABLE): Bike
{
    return Bike::create([
        'bike_model_id' => $test->model->id,
        'category_id' => $test->model->category_id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => $registration,
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'current_store_id' => $store->id, 'home_store_id' => $store->id,
        'status' => $status,
    ]);
}

function modelBooking($test, Bike $bike, Store $pickup, Store $return, string $start, string $end, BookingStatus $status, ?\Carbon\Carbon $heldUntil = null): Booking
{
    return Booking::create([
        'booking_reference' => 'BK-MODEL-'.strtoupper(\Illuminate\Support\Str::random(8)),
        'bike_id' => $bike->id, 'user_id' => $test->customer->id,
        'pickup_store_id' => $pickup->id, 'return_store_id' => $return->id,
        'start_date' => $start, 'end_date' => $end,
        'channel' => BookingChannel::ONLINE, 'status' => $status,
        'held_until' => $heldUntil,
        'base_amount' => 500, 'total_amount' => 500, 'deposit_amount' => 0,
        'price_breakdown_json' => [], 'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
    ]);
}

function availabilityQuery($test, ?Store $pickup = null, ?Store $return = null): string
{
    $pickup ??= $test->honnavar;
    $return ??= $pickup;
    return '/api/v1/bike-models/availability?'.http_build_query([
        'pickup_store_id' => $pickup->id,
        'return_store_id' => $return->id,
        'start_date' => $test->start,
        'end_date' => $test->end,
        'bike_model_id' => $test->model->id,
    ]);
}

test('model availability counts eligible physical units, not just the total fleet', function (): void {
    $available = modelBike($this, $this->honnavar, 'KA-47-MAV-01');
    $overlap = modelBike($this, $this->honnavar, 'KA-47-MAV-02');
    modelBike($this, $this->honnavar, 'KA-47-MAV-03', BikeStatus::MAINTENANCE);
    modelBike($this, $this->murudeshwar, 'KA-47-MAV-04');
    modelBooking($this, $overlap, $this->honnavar, $this->honnavar,
        $this->start, $this->end, BookingStatus::CONFIRMED);

    $this->getJson(availabilityQuery($this))
        ->assertOk()
        ->assertJsonPath('data.0.available_units', 1)
        ->assertJsonPath('data.0.is_available', true)
        ->assertJsonPath('filters.pickup_store_id', $this->honnavar->id);
    expect($available->fresh()->status)->toBe(BikeStatus::AVAILABLE);
});

test('a prior confirmed cross-branch return makes a model available at future destination', function (): void {
    $bike = modelBike($this, $this->murudeshwar, 'KA-47-MAV-05');
    modelBooking($this, $bike, $this->murudeshwar, $this->honnavar,
        $this->earlyStart, $this->earlyEnd, BookingStatus::CONFIRMED);

    $this->getJson(availabilityQuery($this, $this->honnavar, $this->honnavar))
        ->assertOk()->assertJsonPath('data.0.available_units', 1);
    $this->getJson(availabilityQuery($this, $this->murudeshwar, $this->murudeshwar))
        ->assertOk()->assertJsonPath('data.0.available_units', 0);
});

test('held reservations count only while unexpired', function (): void {
    $bike = modelBike($this, $this->honnavar, 'KA-47-MAV-06');
    $hold = modelBooking($this, $bike, $this->honnavar, $this->honnavar,
        $this->start, $this->end, BookingStatus::HELD, now()->addMinutes(10));
    $this->getJson(availabilityQuery($this))->assertOk()
        ->assertJsonPath('data.0.available_units', 0);
    $hold->update(['held_until' => now()->subMinute()]);
    $this->getJson(availabilityQuery($this))->assertOk()
        ->assertJsonPath('data.0.available_units', 1);
});

test('a proposed cross-branch return must not strand a later reserved pickup', function (): void {
    $bike = modelBike($this, $this->honnavar, 'KA-47-MAV-07');
    modelBooking($this, $bike, $this->honnavar, $this->honnavar,
        now()->addDays(13)->toDateString(), now()->addDays(14)->toDateString(),
        BookingStatus::CONFIRMED);

    $this->getJson(availabilityQuery($this, $this->honnavar, $this->murudeshwar))
        ->assertOk()->assertJsonPath('data.0.available_units', 0);
    $this->getJson(availabilityQuery($this, $this->honnavar, $this->honnavar))
        ->assertOk()->assertJsonPath('data.0.available_units', 1);
});

test('inactive pickup or return store is rejected', function (): void {
    modelBike($this, $this->honnavar, 'KA-47-MAV-08');
    $this->murudeshwar->update(['status' => StoreStatus::INACTIVE]);
    $this->getJson(availabilityQuery($this, $this->honnavar, $this->murudeshwar))
        ->assertUnprocessable();
});

test('invalid date ranges are rejected', function (): void {
    $this->getJson('/api/v1/bike-models/availability?'.http_build_query([
        'pickup_store_id' => $this->honnavar->id,
        'return_store_id' => $this->honnavar->id,
        'start_date' => now()->addDays(4)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
    ]))->assertUnprocessable();
});

test('inactive catalog model and unlinked legacy bike are not counted', function (): void {
    modelBike($this, $this->honnavar, 'KA-47-MAV-09');
    Bike::create([
        'category_id' => $this->model->category_id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-MAV-LEGACY',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'current_store_id' => $this->honnavar->id, 'home_store_id' => $this->honnavar->id,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->getJson(availabilityQuery($this))->assertOk()
        ->assertJsonPath('data.0.available_units', 1);
    $this->model->update(['is_active' => false]);
    $this->getJson(availabilityQuery($this))->assertOk()->assertJsonCount(0, 'data');
});

test('public model catalog returns one card for several Activas and does not count unlinked bikes', function (): void {
    modelBike($this, $this->honnavar, 'KA-47-CAT-01');
    modelBike($this, $this->honnavar, 'KA-47-CAT-02');
    Bike::create([
        'category_id' => $this->model->category_id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-CAT-LEGACY',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'current_store_id' => $this->honnavar->id, 'home_store_id' => $this->honnavar->id,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->getJson('/api/v1/bike-models/catalog')
        ->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.bike_model_id', $this->model->id)
        ->assertJsonPath('data.0.total_units', 2)
        ->assertJsonPath('data.0.available_units', null)
        ->assertJsonPath('data.0.availability_checked', false);
    $this->getJson('/api/v1/bike-models/catalog?'.http_build_query([
        'pickup_store_id' => $this->honnavar->id,
        'return_store_id' => $this->honnavar->id,
        'start_date' => $this->start,
        'end_date' => $this->end,
    ]))->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.available_units', 2)
        ->assertJsonPath('data.0.availability_checked', true);
});

test('catalog exposes no inactive models and rejects invalid return branches for a dated search', function (): void {
    modelBike($this, $this->honnavar, 'KA-47-CAT-03');
    $this->murudeshwar->update(['status' => StoreStatus::INACTIVE]);
    $this->getJson('/api/v1/bike-models/catalog?'.http_build_query([
        'pickup_store_id' => $this->honnavar->id,
        'return_store_id' => $this->murudeshwar->id,
        'start_date' => $this->start,
        'end_date' => $this->end,
    ]))->assertUnprocessable();
    $this->model->update(['is_active' => false]);
    $this->getJson('/api/v1/bike-models/catalog')->assertOk()->assertJsonCount(0, 'data');
});

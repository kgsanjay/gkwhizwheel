<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\Booking;
use App\Models\PickupPoint;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Branch', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.44, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Branch', 'address_line' => 'Bus Stand',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 400, 'default_deposit_amount' => 0,
    ]);
    $model = BikeModel::create([
        'category_id' => $category->id, 'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
    ]);
    Bike::create([
        'bike_model_id' => $model->id, 'category_id' => $category->id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA47A12345',
        'home_store_id' => $this->honnavar->id, 'current_store_id' => $this->honnavar->id,
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->modelId = $model->id;
    $this->station = PickupPoint::create([
        'store_id' => $this->honnavar->id, 'name' => 'Honnavar Railway Station',
        'slug' => 'railway-station', 'is_active' => true,
    ]);
    $this->busStand = PickupPoint::create([
        'store_id' => $this->honnavar->id, 'name' => 'Honnavar KSRTC Bus Stand',
        'slug' => 'ksrtc-bus-stand', 'is_active' => true,
    ]);
    $this->hotel = PickupPoint::create([
        'store_id' => $this->honnavar->id, 'name' => 'Hotels / custom location',
        'slug' => 'hotel-delivery', 'is_active' => true,
    ]);
    $this->otherBranch = PickupPoint::create([
        'store_id' => $this->murudeshwar->id, 'name' => 'Murudeshwar KSRTC Bus Stand',
        'slug' => 'ksrtc-bus-stand', 'is_active' => true,
    ]);
    $customer = User::create([
        'name' => 'Rider', 'email' => 'pickup.flow@example.test', 'phone' => '9000009522',
        'password' => 'Password123!', 'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    Sanctum::actingAs($customer);
    $this->dates = [
        'start_date' => now()->addDays(8)->toDateString(),
        'end_date' => now()->addDays(9)->toDateString(),
    ];
});

function pickupHold($test, string $key): array
{
    return [
        ...$test->dates,
        'bike_model_id' => $test->modelId,
        'pickup_store_id' => $test->honnavar->id,
        'return_store_id' => $test->honnavar->id,
        'pickup_point_id' => $test->station->id,
        'return_point_id' => $test->busStand->id,
        'idempotency_key' => $key,
    ];
}

test('model checkout hold persists pickup and return point under selected branch', function (): void {
    $res = $this->postJson('/api/v1/bookings/model-hold', pickupHold($this, 'point-flow-1'))
        ->assertCreated()
        ->assertJsonPath('data.pickup_point_id', $this->station->id)
        ->assertJsonPath('data.return_point_id', $this->busStand->id);
    $booking = Booking::findOrFail($res->json('data.id'));
    expect((float) $booking->deposit_amount)->toBe(0.0)
        ->and((float) $booking->total_amount)->toBeGreaterThan(0)
        ->and($booking->pickupPoint?->name)->toBe('Honnavar Railway Station');
});

test('cross-branch point substitution is rejected without creating booking', function (): void {
    $bad = pickupHold($this, 'point-flow-2');
    $bad['pickup_point_id'] = $this->otherBranch->id;
    $this->postJson('/api/v1/bookings/model-hold', $bad)->assertUnprocessable();
    expect(Booking::count())->toBe(0);
});

test('inactive return point is rejected', function (): void {
    $this->busStand->update(['is_active' => false]);
    $this->postJson('/api/v1/bookings/model-hold', pickupHold($this, 'point-flow-3'))->assertUnprocessable();
});

test('custom hotel address is required but not added to unconfirmed rental fee', function (): void {
    $bad = pickupHold($this, 'point-flow-4');
    $bad['pickup_point_id'] = $this->hotel->id;
    $this->postJson('/api/v1/bookings/model-hold', $bad)->assertUnprocessable();

    $good = $bad;
    $good['pickup_location_details'] = 'Beach Road, Hotel Sea View, reception';
    $res = $this->postJson('/api/v1/bookings/model-hold', $good)->assertCreated();
    $booking = Booking::findOrFail($res->json('data.id'));
    expect($booking->pickup_location_details)->toBe('Beach Road, Hotel Sea View, reception')
        ->and((float) $booking->deposit_amount)->toBe(0.0);
});

test('same idempotency key cannot silently change point details', function (): void {
    $original = pickupHold($this, 'point-flow-5');
    $this->postJson('/api/v1/bookings/model-hold', $original)->assertCreated();
    $changed = $original;
    $changed['return_point_id'] = $this->station->id;
    $this->postJson('/api/v1/bookings/model-hold', $changed)->assertUnprocessable();
    expect(Booking::count())->toBe(1);
});

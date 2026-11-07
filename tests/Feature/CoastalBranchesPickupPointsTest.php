<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\PickupPoint;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    foreach ([
        [1, 'GK WhizWheels Main Office', 'Honnavar'],
        [2, 'Honnavar Railway Station Hub', 'Honnavar'],
        [3, 'GK WhizWheels Murudeshwar Hub', 'Murudeshwar'],
    ] as [$id, $name, $city]) {
        Store::create([
            'id' => $id, 'name' => $name, 'address_line' => 'Test Address',
            'city' => $city, 'state' => 'Karnataka', 'pincode' => '581334',
            'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
        ]);
    }
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 450, 'default_deposit_amount' => 0,
    ]);
    Bike::create([
        'category_id' => $category->id, 'current_store_id' => 2, 'home_store_id' => 2,
        'brand' => 'Suzuki', 'model_name' => 'Access 125', 'registration_number' => 'KA47A1234',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('dry run does not alter current staging branch data', function (): void {
    $this->artisan('branches:reconcile-coastal')->assertSuccessful();
    expect(Store::where('status', StoreStatus::ACTIVE)->count())->toBe(3)
        ->and(PickupPoint::count())->toBe(0)
        ->and(Bike::first()->current_store_id)->toBe(2);
});

test('explicit reconciliation keeps legacy store and produces two active branches', function (): void {
    $code = \Illuminate\Support\Facades\Artisan::call('branches:reconcile-coastal', ['--apply' => true]);
    \PHPUnit\Framework\Assert::assertSame(0, $code, \Illuminate\Support\Facades\Artisan::output());
    expect(Store::where('status', StoreStatus::ACTIVE)->count())->toBe(2)
        ->and(Store::find(2))->not->toBeNull()
        ->and(Store::find(2)->status)->toBe(StoreStatus::INACTIVE)
        ->and(Store::find(1)->phone)->toBe('+918660989586')
        ->and(Store::find(3)->phone)->toBe('+917892094155')
        ->and(Store::find(3)->google_maps_url)->toBe('https://maps.app.goo.gl/DUvVetyLkxzzMP6c8')
        ->and(Bike::first()->current_store_id)->toBe(1)
        ->and(Bike::first()->home_store_id)->toBe(1)
        ->and(PickupPoint::count())->toBe(9)
        ->and(PickupPoint::where('is_active', false)->count())->toBe(2)
        ->and(PickupPoint::where('is_active', true)->count())->toBe(7);
    $this->artisan('branches:reconcile-coastal', ['--apply' => true])->assertSuccessful();
    expect(PickupPoint::count())->toBe(9);
    $this->getJson('/api/v1/pickup-points?store_id=1')->assertOk()->assertJsonCount(3, 'data');
    $this->getJson('/api/v1/pickup-points?store_id=3')->assertOk()->assertJsonCount(4, 'data');
});

test('published pickup points are shown only for their active branch', function (): void {
    PickupPoint::create([
        'store_id' => 1, 'name' => 'Honnavar Railway Station', 'slug' => 'railway-station',
        'is_active' => true, 'supports_pickup' => true, 'supports_return' => true,
    ]);
    PickupPoint::create([
        'store_id' => 3, 'name' => 'Murudeshwar Railway Station', 'slug' => 'railway-station',
        'is_active' => false, 'supports_pickup' => true, 'supports_return' => true,
    ]);
    $this->getJson('/api/v1/pickup-points?store_id=1')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/pickup-points?store_id=3')->assertOk()->assertJsonCount(0, 'data');
});

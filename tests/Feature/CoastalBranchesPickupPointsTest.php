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

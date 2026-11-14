<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888809801', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->model = BikeModel::create([
        'category_id' => $this->category->id, 'brand' => 'Honda',
        'name' => 'Activa 6G', 'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
    ]);
    $this->first = Bike::create([
        'category_id' => $this->category->id, 'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'registration_number' => 'KA-47-BM-1001',
        'home_store_id' => $this->store->id, 'current_store_id' => $this->store->id,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->second = Bike::create([
        'category_id' => $this->category->id, 'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'registration_number' => 'KA-47-BM-1002',
        'home_store_id' => $this->store->id, 'current_store_id' => $this->store->id,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('existing physical bikes remain valid with no catalog assignment', function (): void {
    expect($this->first->bike_model_id)->toBeNull()
        ->and($this->model->bikes()->count())->toBe(0)
        ->and($this->category->bikeModels()->count())->toBe(1);
});

test('two Activas can be explicitly grouped under a bike model', function (): void {
    $this->first->update(['bike_model_id' => $this->model->id]);
    $this->second->update(['bike_model_id' => $this->model->id]);

    expect($this->first->fresh()->bike_model_id)->toBe($this->model->id)
        ->and($this->second->fresh()->bike_model_id)->toBe($this->model->id)
        ->and($this->model->bikes()->count())->toBe(2)
        ->and($this->first->registration_number)->not->toBe($this->second->registration_number);
});

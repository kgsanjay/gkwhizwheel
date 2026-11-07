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

test('bike model assignment is a dry run unless apply is provided', function (): void {
    $this->artisan('bikes:assign-model', [
        'model' => $this->model->id,
        '--bike' => [$this->first->id, $this->second->id],
    ])->assertSuccessful();
    expect($this->first->fresh()->bike_model_id)->toBeNull()
        ->and($this->second->fresh()->bike_model_id)->toBeNull();
});

test('two Activas can be explicitly grouped without combining their vehicle identities', function (): void {
    $this->artisan('bikes:assign-model', [
        'model' => $this->model->id,
        '--bike' => [$this->first->id, $this->second->id],
        '--apply' => true,
    ])->assertSuccessful();
    expect($this->first->fresh()->bike_model_id)->toBe($this->model->id)
        ->and($this->second->fresh()->bike_model_id)->toBe($this->model->id)
        ->and($this->model->bikes()->count())->toBe(2)
        ->and($this->first->registration_number)->not->toBe($this->second->registration_number);
});

test('catalog assignment rejects mismatched vehicle with no partial writes', function (): void {
    $this->second->update(['model_name' => 'Dio']);
    $this->artisan('bikes:assign-model', [
        'model' => $this->model->id,
        '--bike' => [$this->first->id, $this->second->id],
        '--apply' => true,
    ])->assertFailed();
    expect($this->first->fresh()->bike_model_id)->toBeNull()
        ->and($this->second->fresh()->bike_model_id)->toBeNull();
});

test('catalog assignment requires explicit unique physical bike IDs', function (): void {
    $this->artisan('bikes:assign-model', ['model' => $this->model->id])->assertFailed();
    $this->artisan('bikes:assign-model', [
        'model' => $this->model->id,
        '--bike' => [$this->first->id, $this->first->id],
        '--apply' => true,
    ])->assertFailed();
    expect($this->first->fresh()->bike_model_id)->toBeNull();
});

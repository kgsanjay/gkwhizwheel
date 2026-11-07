<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->murudeshwar = Store::create([
        'name' => 'G.K. WhizWheel Murudeshwar',
        'address_line' => 'KSRTC Bus Stand',
        'city' => 'Murudeshwar',
        'state' => 'Karnataka',
        'pincode' => '581350',
        'latitude' => 14.09,
        'longitude' => 74.49,
        'status' => StoreStatus::ACTIVE,
    ]);
    $this->honnavar = Store::create([
        'name' => 'G.K. WhizWheel Honnavar',
        'address_line' => 'Main Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.28,
        'longitude' => 74.45,
        'status' => StoreStatus::ACTIVE,
    ]);
    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 450,
        'default_deposit_amount' => 0,
    ]);
});

test('import preview does not write anything and requires explicit branch id', function (): void {
    $this->artisan('bikes:import-murudeshwar')->assertFailed();
    $this->artisan('bikes:import-murudeshwar', ['--store' => (string) $this->murudeshwar->id])->assertSuccessful();
    expect(Bike::count())->toBe(0);
});

test('import creates ten registrations grouped by model and is repeat-safe', function (): void {
    $args = ['--store' => (string) $this->murudeshwar->id, '--apply' => true];
    $this->artisan('bikes:import-murudeshwar', $args)->assertSuccessful();
    $this->artisan('bikes:import-murudeshwar', $args)->assertSuccessful();
    expect(Bike::count())->toBe(10)
        ->and(Bike::where('model_name', 'Activa 6G')->count())->toBe(4)
        ->and(Bike::where('model_name', 'Fascino 125')->count())->toBe(2)
        ->and(Bike::where('model_name', 'Access 125')->count())->toBe(4)
        ->and(Bike::where('status', BikeStatus::MAINTENANCE)->count())->toBe(10)
        ->and(Bike::distinct()->count('bike_model_id'))->toBe(3);
});

test('rejects collision with existing registrations even when formatted differently', function (): void {
    Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->honnavar->id,
        'home_store_id' => $this->honnavar->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-A-9088',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->artisan('bikes:import-murudeshwar', [
        '--store' => (string) $this->murudeshwar->id,
        '--apply' => true,
    ])->assertFailed();
    expect(Bike::count())->toBe(1)
        ->and(Bike::first()->current_store_id)->toBe($this->honnavar->id);
});

test('cannot accidentally import the Murudeshwar fleet into Honnavar', function (): void {
    $this->artisan('bikes:import-murudeshwar', [
        '--store' => (string) $this->honnavar->id,
        '--apply' => true,
    ])->assertFailed();
    expect(Bike::count())->toBe(0);
});

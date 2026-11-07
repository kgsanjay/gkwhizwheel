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
    $this->honnavar = Store::create([
        'name' => 'Honnavar Branch', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45,
        'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Branch', 'address_line' => 'Main Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    foreach ([
        'dio' => ['Honda', 'Dio DLX'],
        'activa' => ['Honda', 'Activa STD'],
        'access' => ['Suzuki', 'Access 125'],
    ] as $key => [$brand, $name]) {
        $this->models[$key] = BikeModel::create([
            'category_id' => $category->id,
            'brand' => $brand, 'name' => $name,
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'is_active' => true,
        ]);
    }
});

function honnavarArgs($test, bool $apply = false): array
{
    return [
        '--store-id' => $test->honnavar->id,
        '--dio-model-id' => $test->models['dio']->id,
        '--activa-model-id' => $test->models['activa']->id,
        '--access-model-id' => $test->models['access']->id,
        ...($apply ? ['--apply' => true] : []),
    ];
}

test('default dry run reports ten vehicles without inserting or updating data', function (): void {
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this))->assertSuccessful();
    expect(Bike::withTrashed()->count())->toBe(0);
});

test('explicit approved apply creates ten maintenance-only physical bikes and is idempotent', function (): void {
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this, true))->assertSuccessful();
    expect(Bike::count())->toBe(10)
        ->and(Bike::where('status', BikeStatus::AVAILABLE)->count())->toBe(0)
        ->and(Bike::where('status', BikeStatus::MAINTENANCE)->count())->toBe(10)
        ->and(Bike::where('home_store_id', $this->honnavar->id)->count())->toBe(10)
        ->and(Bike::where('current_store_id', $this->honnavar->id)->count())->toBe(10)
        ->and(Bike::where('bike_model_id', $this->models['dio']->id)->count())->toBe(5)
        ->and(Bike::where('bike_model_id', $this->models['activa']->id)->count())->toBe(3)
        ->and(Bike::where('bike_model_id', $this->models['access']->id)->count())->toBe(2);

    $existing = Bike::where('registration_number', 'KA47A4047')->firstOrFail();
    $existing->update(['status' => BikeStatus::ON_RENT]);
    // Existing real bike state never gets silently overridden.
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this, true))->assertSuccessful();
    expect(Bike::count())->toBe(10)
        ->and($existing->fresh()->status)->toBe(BikeStatus::ON_RENT);
});

test('application refuses unverified Activa 6G mapping without writing any scooters', function (): void {
    $this->models['activa']->update(['name' => 'Activa 6G']);
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this, true))->assertFailed();
    expect(Bike::count())->toBe(0);
});

test('existing registration in wrong branch blocks all insertions without moving the record', function (): void {
    Bike::create([
        'category_id' => $this->models['dio']->category_id,
        'bike_model_id' => $this->models['dio']->id,
        'current_store_id' => $this->murudeshwar->id,
        'home_store_id' => $this->murudeshwar->id,
        'brand' => 'Honda',
        'model_name' => 'Dio DLX',
        'registration_number' => 'KA47A4047',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this, true))->assertFailed();
    expect(Bike::count())->toBe(1)
        ->and(Bike::first()->current_store_id)->toBe($this->murudeshwar->id);
});

test('soft deleted registration blocks reimport and preserves historical bike', function (): void {
    $bike = Bike::create([
        'category_id' => $this->models['dio']->category_id,
        'bike_model_id' => $this->models['dio']->id,
        'current_store_id' => $this->honnavar->id,
        'home_store_id' => $this->honnavar->id,
        'brand' => 'Honda', 'model_name' => 'Dio DLX',
        'registration_number' => 'KA47A4047',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::MAINTENANCE,
    ]);
    $bike->delete();
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this, true))->assertFailed();
    expect(Bike::withTrashed()->count())->toBe(1);
});

test('wrong branch, missing model IDs and inactive branch never allow apply', function (): void {
    $args = honnavarArgs($this, true);
    $args['--store-id'] = $this->murudeshwar->id;
    $this->artisan('fleet:reconcile-honnavar', $args)->assertFailed();

    $args = honnavarArgs($this, true);
    unset($args['--activa-model-id']);
    $this->artisan('fleet:reconcile-honnavar', $args)->assertFailed();

    $this->honnavar->update(['status' => StoreStatus::INACTIVE]);
    $this->artisan('fleet:reconcile-honnavar', honnavarArgs($this, true))->assertFailed();
    expect(Bike::count())->toBe(0);
});

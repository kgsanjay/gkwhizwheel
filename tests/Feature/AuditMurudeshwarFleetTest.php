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
    $this->muru = Store::create([
        'name' => 'Murudeshwar Main', 'address_line' => 'Bus Stand Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->honna = Store::create([
        'name' => 'Honnavar Main', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooters', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->models = [];
    foreach ([
        'access' => ['Suzuki', 'Access 125'],
        'activa' => ['Honda', 'Activa 6G'],
        'fascino' => ['Yamaha', 'Fascino 125'],
    ] as $key => [$brand, $name]) {
        $this->models[$key] = BikeModel::create([
            'category_id' => $category->id, 'brand' => $brand,
            'name' => $name, 'is_active' => true,
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
        ]);
    }
});

function muruBike($test, string $plate, string $key = 'access', ?Store $store = null): Bike
{
    $model = $test->models[$key];
    $store ??= $test->muru;

    return Bike::create([
        'category_id' => $model->category_id,
        'bike_model_id' => $model->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => $model->brand, 'model_name' => $model->name,
        'registration_number' => $plate,
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::MAINTENANCE,
    ]);
}

function seedMuruTen($test): void
{
    foreach ([
        'access' => ['KA47A9088', 'KA47A9089', 'KA47A9090', 'KA47A9091'],
        'activa' => ['KA47A8988', 'KA47A8989', 'KA47A9092', 'KA47A9053'],
        'fascino' => ['KA47A8991', 'KA47A8999'],
    ] as $key => $plates) {
        foreach ($plates as $plate) {
            muruBike($test, $plate, $key);
        }
    }
}

test('empty staging-like database is reported missing, never automatically seeded', function (): void {
    $this->artisan('fleet:audit-murudeshwar')->assertSuccessful();
    $this->artisan('fleet:audit-murudeshwar', ['--strict' => true])->assertFailed();

    expect(Bike::count())->toBe(0);
});

test('all ten matching records pass strict audit without changing availability or catalog', function (): void {
    seedMuruTen($this);
    $original = Bike::orderBy('registration_number')->get()
        ->map(fn (Bike $b): array => $b->getRawOriginal())->all();

    $this->artisan('fleet:audit-murudeshwar', [
        '--store-id' => $this->muru->id, '--strict' => true,
    ])->assertSuccessful();

    expect(Bike::count())->toBe(10)
        ->and(Bike::where('status', BikeStatus::MAINTENANCE)->count())->toBe(10)
        ->and(Bike::orderBy('registration_number')->get()
            ->map(fn (Bike $b): array => $b->getRawOriginal())->all())->toBe($original);
});

test('wrong branch and inconsistent variant are reported and strict mode fails', function (): void {
    muruBike($this, 'KA47A9088', 'access', $this->honna);
    $activa = muruBike($this, 'KA47A8988', 'activa');
    $activa->update(['model_name' => 'Activa STD']);

    $this->artisan('fleet:audit-murudeshwar', ['--strict' => true])->assertFailed();

    expect(Bike::findOrFail($activa->id)->model_name)->toBe('Activa STD')
        ->and(Bike::where('current_store_id', $this->honna->id)->count())->toBe(1);
});

test('soft-deleted registrations stay preserved and block strict audit', function (): void {
    $bike = muruBike($this, 'KA47A8991', 'fascino');
    $bike->delete();

    $this->artisan('fleet:audit-murudeshwar', ['--strict' => true])->assertFailed();
    expect(Bike::withTrashed()->count())->toBe(1)
        ->and(Bike::count())->toBe(0);
});

test('unlinked catalog data is flagged rather than implicitly assigned', function (): void {
    $bike = muruBike($this, 'KA47A9090', 'access');
    $bike->update(['bike_model_id' => null]);

    $this->artisan('fleet:audit-murudeshwar', ['--strict' => true])->assertFailed();

    expect($bike->fresh()->bike_model_id)->toBeNull();
});

test('inactive or ambiguous Murudeshwar branches fail closed', function (): void {
    $this->muru->update(['status' => StoreStatus::INACTIVE]);
    $this->artisan('fleet:audit-murudeshwar')->assertFailed();

    $this->muru->update(['status' => StoreStatus::ACTIVE]);
    Store::create([
        'name' => 'Duplicate Murudeshwar Branch', 'address_line' => 'Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->artisan('fleet:audit-murudeshwar')->assertFailed();
    $this->artisan('fleet:audit-murudeshwar', ['--store-id' => $this->muru->id])->assertSuccessful();
});

<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use Database\Seeders\BikeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('running legacy bike seeder never deletes or replaces real fleet data', function (): void {
    $store = Store::create([
        'name' => 'Authorized Fleet Store',
        'address_line' => 'Test Street',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.28,
        'longitude' => 74.44,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Verified Fleet Category',
        'base_daily_rate' => 650,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Verified Brand',
        'model_name' => 'Real Fleet Unit',
        'registration_number' => 'KA-47-REAL-01',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    app(BikeSeeder::class)->run();

    expect(Bike::count())->toBe(1)
        ->and(Bike::firstOrFail()->id)->toBe($bike->id)
        ->and(Bike::firstOrFail()->brand)->toBe('Verified Brand');
});

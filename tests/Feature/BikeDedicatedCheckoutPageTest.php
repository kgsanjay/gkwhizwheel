<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;

beforeEach(function (): void {
    $this->checkoutStore = Store::create([
        'name' => 'Checkout Branch',
        'address_line' => 'Market Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Checkout Scooters',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $this->checkoutBike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $this->checkoutStore->id,
        'home_store_id' => $this->checkoutStore->id,
        'brand' => 'Honda',
        'model_name' => 'Activa',
        'registration_number' => 'KA-47-CHECK-01',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('guest may open dedicated bike checkout without starting payment or creating a hold', function (): void {
    $response = $this->get('/services/bikes/checkout?'.http_build_query([
        'bike_id' => $this->checkoutBike->id,
        'pickup_store_id' => $this->checkoutStore->id,
        'return_store_id' => $this->checkoutStore->id,
        'start_date' => now()->addDays(2)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
    ]));

    $response->assertOk();
    $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
        ->component('Bikes/Checkout')
        ->where('bike.id', $this->checkoutBike->id)
        ->where('pickupStore.id', $this->checkoutStore->id)
        ->where('bikeModelId', null)
        ->etc());
    $this->assertDatabaseCount('bookings', 0);
    $this->assertDatabaseCount('payments', 0);
});

test('checkout rejects missing bike or invalid date ranges', function (): void {
    $base = [
        'pickup_store_id' => $this->checkoutStore->id,
        'return_store_id' => $this->checkoutStore->id,
        'start_date' => now()->addDays(2)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
    ];

    $this->getJson('/services/bikes/checkout?'.http_build_query($base))
        ->assertUnprocessable()->assertJsonValidationErrors(['bike_id']);

    $this->getJson('/services/bikes/checkout?'.http_build_query([
        ...$base,
        'bike_id' => $this->checkoutBike->id,
        'end_date' => now()->addDay()->toDateString(),
    ]))->assertUnprocessable()->assertJsonValidationErrors(['end_date']);

    $this->getJson('/services/bikes/checkout?'.http_build_query([
        ...$base,
        'bike_id' => $this->checkoutBike->id,
        'addons' => '[{"addon_type":"unsafe-item","quantity":1}]',
    ]))->assertUnprocessable()->assertJsonValidationErrors(['addons']);

    $this->getJson('/services/bikes/checkout?'.http_build_query([
        ...$base,
        'bike_id' => $this->checkoutBike->id,
        'bike_model_id' => 999999,
    ]))->assertUnprocessable()->assertJsonValidationErrors(['bike_id', 'bike_model_id']);
});

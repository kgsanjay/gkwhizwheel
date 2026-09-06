<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store1 = Store::create([
        'name' => 'Indiranagar Hub',
        'code' => 'IND-01',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500001',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Koramangala Hub',
        'code' => 'KOR-01',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500002',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 800.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store1->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-05-AB-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 4200,
        'base_daily_rate_override' => 850.00,
        'deposit_amount_override' => 2000.00,
    ]);
});

test('GET /bikes renders Inertia Bikes/Index component with categories and stores', function (): void {
    $response = $this->get('/bikes?category_id='.$this->category->id);

    $response->assertStatus(200);

    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Bikes/Index')
        ->has('categories', 1)
        ->has('stores', 2)
        ->has('initialFilters')
        ->where('initialFilters.category_id', (string) $this->category->id)
    );
});

test('GET /bikes/{id} renders Inertia Bikes/Show component with bike details and stores', function (): void {
    $response = $this->get("/bikes/{$this->bike->id}");

    $response->assertStatus(200);

    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Bikes/Show')
        ->has('stores', 2)
        ->has('bike')
        ->where('bike.id', $this->bike->id)
        ->where('bike.brand', 'Royal Enfield')
        ->where('bike.model_name', 'Hunter 350')
        ->where('bike.registration_number', 'KA-05-AB-1234')
    );
});

test('GET /bikes/{id} returns 404 for non-existent bike', function (): void {
    $response = $this->get('/bikes/99999');

    $response->assertStatus(404);
});

test('POST /api/v1/bikes/{id}/price-quote returns live itemized pricing breakdown', function (): void {
    $startDate = Carbon::today()->addDays(2)->format('Y-m-d');
    $endDate = Carbon::today()->addDays(4)->format('Y-m-d');

    $payload = [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
    ];

    $response = $this->postJson("/api/v1/bikes/{$this->bike->id}/price-quote", $payload);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'base_amount',
                'pricing_adjustments_amount',
                'one_way_fee_amount',
                'discount_amount',
                'deposit_amount',
                'total_amount',
                'price_breakdown_json',
            ],
            'message',
        ]);

    // 3 rental days: 3 * 850 = 2550 base_amount
    expect($response->json('data.base_amount'))->toEqual(2550);
    expect($response->json('data.deposit_amount'))->toEqual(2000);
    expect($response->json('data.total_amount'))->toBeGreaterThanOrEqual(4550);
});

test('GET /api/v1/stores returns list of active stores', function (): void {
    $response = $this->getJson('/api/v1/stores');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(2, 'data');
});

test('GET /api/v1/bike-categories returns list of bike categories', function (): void {
    $response = $this->getJson('/api/v1/bike-categories');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(1, 'data');
});

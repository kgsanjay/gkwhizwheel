<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeImage;
use App\Models\Booking;
use App\Models\PricingRule;
use App\Models\Store;
use App\Models\User;

beforeEach(function (): void {
    $this->storeA = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '123 80ft Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeB = Store::create([
        'name' => 'Indiranagar Hub',
        'address_line' => '456 100ft Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9716,
        'longitude' => 77.6412,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->catCommuter = BikeCategory::create([
        'name' => 'Commuter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->catCruiser = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 1200.00,
        'default_deposit_amount' => 3000.00,
    ]);

    $this->bike1 = Bike::create([
        'category_id' => $this->catCommuter->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-AB-1111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->bike2 = Bike::create([
        'category_id' => $this->catCruiser->id,
        'current_store_id' => $this->storeB->id,
        'home_store_id' => $this->storeB->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-01-CD-2222',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'base_daily_rate_override' => 1500.00,
        'status' => BikeStatus::AVAILABLE,
    ]);

    BikeImage::create([
        'bike_id' => $this->bike1->id,
        'file_path' => 'bikes/activa.jpg',
        'sort_order' => 1,
    ]);
});

test('public bikes list returns available bikes with standard envelope and relations', function (): void {
    $response = $this->getJson('/api/v1/bikes');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => '',
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'brand',
                    'model_name',
                    'fuel_type',
                    'transmission',
                    'status',
                    'daily_rate',
                    'deposit_amount',
                    'category' => ['id', 'name'],
                    'current_store' => ['id', 'name', 'city'],
                    'images',
                ],
            ],
            'message',
        ]);

    expect(count($response->json('data')))->toBe(2);
});

test('public bikes list filters by store_id and category_id', function (): void {
    $responseStore = $this->getJson('/api/v1/bikes?store_id='.$this->storeA->id);
    $responseStore->assertOk();
    $dataStore = $responseStore->json('data');
    expect(count($dataStore))->toBe(1)
        ->and($dataStore[0]['id'])->toBe($this->bike1->id);

    $responseCat = $this->getJson('/api/v1/bikes?category_id='.$this->catCruiser->id);
    $responseCat->assertOk();
    $dataCat = $responseCat->json('data');
    expect(count($dataCat))->toBe(1)
        ->and($dataCat[0]['id'])->toBe($this->bike2->id);
});

test('public bikes list filters by price range', function (): void {
    // bike1 is 500/day, bike2 is 1500/day
    $responseMin = $this->getJson('/api/v1/bikes?min_price=1000');
    $responseMin->assertOk();
    $dataMin = $responseMin->json('data');
    expect(count($dataMin))->toBe(1)
        ->and($dataMin[0]['id'])->toBe($this->bike2->id);

    $responseMax = $this->getJson('/api/v1/bikes?max_price=800');
    $responseMax->assertOk();
    $dataMax = $responseMax->json('data');
    expect(count($dataMax))->toBe(1)
        ->and($dataMax[0]['id'])->toBe($this->bike1->id);
});

test('public bikes list filters by date availability excluding booked bikes', function (): void {
    $customer = User::create([
        'name' => 'Booker',
        'email' => 'booker@example.com',
        'phone' => '9111122222',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    // Book bike1 from 2026-10-10 to 2026-10-15
    Booking::create([
        'booking_reference' => 'BK-TEST-AVAIL',
        'bike_id' => $this->bike1->id,
        'user_id' => $customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-15',
        'base_amount' => 3000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 4500.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'avail-key-01',
    ]);

    // Query overlapping dates: 2026-10-12 to 2026-10-14
    $response = $this->getJson('/api/v1/bikes?start_date=2026-10-12&end_date=2026-10-14');

    $response->assertOk();
    $data = $response->json('data');
    // bike1 must be excluded, bike2 must be present
    expect(count($data))->toBe(1)
        ->and($data[0]['id'])->toBe($this->bike2->id);

    // Query non-overlapping dates: 2026-10-20 to 2026-10-22
    $responseFree = $this->getJson('/api/v1/bikes?start_date=2026-10-20&end_date=2026-10-22');
    $responseFree->assertOk();
    expect(count($responseFree->json('data')))->toBe(2);
});

test('public bike list validates date ordering and returns 422 error envelope', function (): void {
    $response = $this->getJson('/api/v1/bikes?start_date=2026-10-15&end_date=2026-10-10');

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'The given data was invalid.',
        ])
        ->assertJsonValidationErrors(['end_date']);
});

test('public bike detail returns full information with images and relations', function (): void {
    $response = $this->getJson('/api/v1/bikes/'.$this->bike1->id);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $this->bike1->id,
                'brand' => 'Honda',
                'model_name' => 'Activa 6G',
                'category' => [
                    'id' => $this->catCommuter->id,
                    'name' => 'Commuter',
                ],
                'current_store' => [
                    'id' => $this->storeA->id,
                    'name' => 'Koramangala Hub',
                ],
                'images' => [
                    [
                        'file_path' => 'bikes/activa.jpg',
                        'sort_order' => 1,
                    ],
                ],
            ],
            'message' => '',
        ]);
});

test('public bike availability calendar returns unavailable date ranges for month', function (): void {
    $customer = User::create([
        'name' => 'Calendar Booker',
        'email' => 'cal@example.com',
        'phone' => '9222233333',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    Booking::create([
        'booking_reference' => 'BK-CAL-01',
        'bike_id' => $this->bike1->id,
        'user_id' => $customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-09-08',
        'end_date' => '2026-09-12',
        'base_amount' => 2500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 4000.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'cal-key-01',
    ]);

    $response = $this->getJson('/api/v1/bikes/'.$this->bike1->id.'/availability?month=2026-09');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'bike_id' => $this->bike1->id,
                'month' => '2026-09',
                'unavailable_dates' => [
                    [
                        'start_date' => '2026-09-08',
                        'end_date' => '2026-09-12',
                        'status' => 'confirmed',
                    ],
                ],
            ],
        ]);
});

test('public bike availability calendar validates month parameter', function (): void {
    $response = $this->getJson('/api/v1/bikes/'.$this->bike1->id.'/availability?month=invalid-date');

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['month']);
});

test('public bike price quote invokes pricing service and returns itemized breakdown', function (): void {
    // One-way fee rule between storeA and storeB
    PricingRule::create([
        'name' => 'Inter-store Relocation Fee',
        'rule_type' => PricingRuleType::ONE_WAY_FEE,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'value' => 350.00,
        'priority' => 1,
        'from_store_id' => $this->storeA->id,
        'to_store_id' => $this->storeB->id,
        'is_active' => true,
    ]);

    // 2 days weekday (Tuesday - Wednesday): 2026-10-06 to 2026-10-07
    // Bike 1: 500 * 2 = 1000 base + 1500 deposit + 350 one-way fee = 2850 total
    $query = http_build_query([
        'start_date' => '2026-10-06',
        'end_date' => '2026-10-07',
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeB->id,
    ]);

    $response = $this->getJson('/api/v1/bikes/'.$this->bike1->id.'/price-quote?'.$query);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'base_amount' => 1000.00,
                'one_way_fee_amount' => 350.00,
                'deposit_amount' => 1500.00,
                'total_amount' => 2850.00,
            ],
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'base_amount',
                'pricing_adjustments_amount',
                'one_way_fee_amount',
                'addon_amount',
                'discount_amount',
                'deposit_amount',
                'total_amount',
                'price_breakdown_json' => [
                    'days',
                    'deposit_amount',
                    'total_amount',
                ],
            ],
            'message',
        ]);
});

test('public bike price quote validates required store and date inputs', function (): void {
    $response = $this->getJson('/api/v1/bikes/'.$this->bike1->id.'/price-quote');

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['start_date', 'end_date', 'pickup_store_id', 'return_store_id']);
});

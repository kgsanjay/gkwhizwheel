<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\DiscountType;
use App\Enums\FuelType;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Coupon;
use App\Models\PricingRule;
use App\Models\Store;
use App\Services\PricingService;

beforeEach(function (): void {
    $this->pricingService = new PricingService();

    $this->storeA = Store::create([
        'name' => 'Store Alpha',
        'address_line' => '1 Alpha Way',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9715987,
        'longitude' => 77.5945627,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeB = Store::create([
        'name' => 'Store Beta',
        'address_line' => '2 Beta Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560002',
        'latitude' => 12.9815987,
        'longitude' => 77.6045627,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-EQ-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('plain weekday booking calculates standard base rate without adjustments', function (): void {
    // Tuesday (2026-09-08) to Thursday (2026-09-10) -> 3 days
    $quote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-08',
        endDate: '2026-09-10',
        pickupStore: $this->storeA,
        returnStore: $this->storeA
    );

    expect($quote['base_amount'])->toBe(1500.00)
        ->and($quote['pricing_adjustments_amount'])->toBe(0.00)
        ->and($quote['one_way_fee_amount'])->toBe(0.00)
        ->and($quote['addon_amount'])->toBe(0.00)
        ->and($quote['discount_amount'])->toBe(0.00)
        ->and($quote['deposit_amount'])->toBe(1500.00)
        ->and($quote['total_amount'])->toBe(3000.00)
        ->and($quote['price_breakdown_json']['days'])->toBe(3)
        ->and($quote['price_breakdown_json']['daily_breakdown'])->toHaveCount(3);
});

test('weekend rule applies percentage surcharge to weekend days', function (): void {
    // Saturday (day 6) and Sunday (day 0) receive +20% surcharge
    PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 6, // Saturday
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0, // Sunday
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    // Friday (2026-09-11) to Sunday (2026-09-13): 3 days (Fri: 500, Sat: 600, Sun: 600)
    $quote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-11',
        endDate: '2026-09-13',
        pickupStore: $this->storeA,
        returnStore: $this->storeA
    );

    expect($quote['base_amount'])->toBe(1500.00)
        ->and($quote['pricing_adjustments_amount'])->toBe(200.00)
        ->and($quote['deposit_amount'])->toBe(1500.00)
        ->and($quote['total_amount'])->toBe(3200.00)
        ->and($quote['price_breakdown_json']['daily_breakdown'][0]['adjustment'])->toBe(0.00)
        ->and($quote['price_breakdown_json']['daily_breakdown'][1]['adjustment'])->toBe(100.00)
        ->and($quote['price_breakdown_json']['daily_breakdown'][2]['adjustment'])->toBe(100.00);
});

test('holiday rule overrides weekend rule when priority is higher', function (): void {
    // Saturday (day 6) weekend rule with priority 10 (+15%)
    PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 6,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    // Saturday, 2026-09-12 holiday rule with priority 30 (+30%)
    $holidayRule = PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::HOLIDAY,
        'date_start' => '2026-09-12',
        'date_end' => '2026-09-12',
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 30.00,
        'priority' => 30,
        'is_active' => true,
    ]);

    // Booking on Saturday (2026-09-12)
    $quote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-12',
        endDate: '2026-09-12',
        pickupStore: $this->storeA,
        returnStore: $this->storeA
    );

    expect($quote['base_amount'])->toBe(500.00)
        ->and($quote['pricing_adjustments_amount'])->toBe(150.00) // 30% of 500, not 15% (75)
        ->and($quote['price_breakdown_json']['daily_breakdown'][0]['rule_id'])->toBe($holidayRule->id)
        ->and($quote['total_amount'])->toBe(2150.00); // 500 + 150 + 1500 deposit
});

test('one-way fee applies when pickup and return stores differ', function (): void {
    PricingRule::create([
        'rule_type' => PricingRuleType::ONE_WAY_FEE,
        'from_store_id' => $this->storeA->id,
        'to_store_id' => $this->storeB->id,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'value' => 350.00,
        'priority' => 5,
        'is_active' => true,
    ]);

    $quote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-08',
        endDate: '2026-09-08',
        pickupStore: $this->storeA,
        returnStore: $this->storeB
    );

    expect($quote['one_way_fee_amount'])->toBe(350.00)
        ->and($quote['total_amount'])->toBe(2350.00) // 500 base + 350 one-way + 1500 deposit
        ->and($quote['price_breakdown_json']['one_way_details']['fee'])->toBe(350.00);
});

test('coupon discount applies correctly to rental subtotal and not deposit', function (): void {
    // 1. Percentage discount coupon
    Coupon::create([
        'code' => 'SAVE10',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
        'is_active' => true,
    ]);

    // 2 days @ 500 = 1000 base. 10% discount = 100.
    $quote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-08',
        endDate: '2026-09-09',
        pickupStore: $this->storeA,
        returnStore: $this->storeA,
        couponCode: 'SAVE10'
    );

    expect($quote['base_amount'])->toBe(1000.00)
        ->and($quote['discount_amount'])->toBe(100.00)
        ->and($quote['deposit_amount'])->toBe(1500.00)
        ->and($quote['total_amount'])->toBe(2400.00) // (1000 - 100) + 1500 deposit
        ->and($quote['price_breakdown_json']['coupon']['code'])->toBe('SAVE10');

    // 2. Fixed discount coupon
    Coupon::create([
        'code' => 'FLAT150',
        'discount_type' => DiscountType::FIXED,
        'value' => 150.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
        'is_active' => true,
    ]);

    $fixedQuote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-08',
        endDate: '2026-09-08',
        pickupStore: $this->storeA,
        returnStore: $this->storeA,
        couponCode: 'FLAT150'
    );

    expect($fixedQuote['base_amount'])->toBe(500.00)
        ->and($fixedQuote['discount_amount'])->toBe(150.00)
        ->and($fixedQuote['total_amount'])->toBe(1850.00); // (500 - 150) + 1500 deposit

    // 3. Expired coupon should give 0 discount
    Coupon::create([
        'code' => 'EXPIRED',
        'discount_type' => DiscountType::FIXED,
        'value' => 200.00,
        'valid_from' => '2025-01-01',
        'valid_until' => '2025-12-31',
        'is_active' => true,
    ]);

    $expiredQuote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-08',
        endDate: '2026-09-08',
        pickupStore: $this->storeA,
        returnStore: $this->storeA,
        couponCode: 'EXPIRED'
    );

    expect($expiredQuote['discount_amount'])->toBe(0.00)
        ->and($expiredQuote['price_breakdown_json']['coupon'])->toBeNull();
});

test('bike overrides take precedence over category defaults', function (): void {
    $customBike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Vespa',
        'model_name' => 'Elegante',
        'registration_number' => 'KA-01-VP-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'base_daily_rate_override' => 750.00,
        'deposit_amount_override' => 2500.00,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $quote = $this->pricingService->calculateQuote(
        bike: $customBike,
        startDate: '2026-09-08',
        endDate: '2026-09-08',
        pickupStore: $this->storeA,
        returnStore: $this->storeA
    );

    expect($quote['base_amount'])->toBe(750.00)
        ->and($quote['deposit_amount'])->toBe(2500.00)
        ->and($quote['total_amount'])->toBe(3250.00);
});

test('addons are calculated and itemized in total and breakdown', function (): void {
    $quote = $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-08',
        endDate: '2026-09-08',
        pickupStore: $this->storeA,
        returnStore: $this->storeA,
        addons: [
            ['addon_type' => 'helmet', 'quantity' => 2, 'unit_price' => 100.00],
            ['addon_type' => 'insurance', 'quantity' => 1, 'unit_price' => 250.00],
        ]
    );

    expect($quote['addon_amount'])->toBe(450.00)
        ->and($quote['total_amount'])->toBe(2450.00) // 500 base + 450 addons + 1500 deposit
        ->and($quote['price_breakdown_json']['addons'])->toHaveCount(2);
});

test('throws exception when start date is after end date', function (): void {
    $this->pricingService->calculateQuote(
        bike: $this->bike,
        startDate: '2026-09-10',
        endDate: '2026-09-08',
        pickupStore: $this->storeA,
        returnStore: $this->storeA
    );
})->throws(InvalidArgumentException::class);

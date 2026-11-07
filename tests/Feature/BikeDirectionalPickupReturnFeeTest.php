<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\FuelType;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\PickupPoint;
use App\Models\PricingRule;
use App\Models\Store;
use App\Services\BikeBookingPayments;
use App\Services\BookingLocationFees;
use App\Services\BookingPickupPoints;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Main', 'address_line' => 'NH 66',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Main', 'address_line' => 'Bus Stand',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 500,
    ]);
    $this->bike = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $this->honnavar->id,
        'current_store_id' => $this->honnavar->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA47A4747',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->pickup = PickupPoint::create([
        'store_id' => $this->honnavar->id, 'name' => 'Honnavar Bus Stand',
        'slug' => 'bus-stand', 'supports_pickup' => true, 'supports_return' => true,
        'pickup_fee' => 60, 'return_fee' => 40, 'is_active' => true,
    ]);
    $this->return = PickupPoint::create([
        'store_id' => $this->murudeshwar->id, 'name' => 'Murudeshwar Railway',
        'slug' => 'railway-station', 'supports_pickup' => true, 'supports_return' => true,
        'pickup_fee' => 25, 'return_fee' => 75, 'is_active' => true,
    ]);
});

function bike47Route($test, bool $cross = false): array
{
    return [
        'pickup_store_id' => $test->honnavar->id,
        'return_store_id' => $cross ? $test->murudeshwar->id : $test->honnavar->id,
        'pickup_point_id' => $test->pickup->id,
        'return_point_id' => $cross ? $test->return->id : $test->pickup->id,
        'channel' => BookingChannel::ONLINE,
    ];
}

function bike47FeeRule($test, Store $from, Store $to, float $fee = 200): PricingRule
{
    return PricingRule::create([
        'name' => 'Approved directional return charge',
        'rule_type' => PricingRuleType::ONE_WAY_FEE,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'from_store_id' => $from->id,
        'to_store_id' => $to->id,
        'value' => $fee, 'priority' => 1, 'is_active' => true,
    ]);
}

test('online bookings with published locations cannot omit either point to bypass fees', function (): void {
    $route = bike47Route($this);
    $route['pickup_point_id'] = null;
    expect(fn () => app(BookingPickupPoints::class)->resolve($route))
        ->toThrow(ValidationException::class);
    $route = bike47Route($this);
    $route['return_point_id'] = null;
    expect(fn () => app(BookingPickupPoints::class)->resolve($route))
        ->toThrow(ValidationException::class);
});

test('separate pickup and return fees apply even when using the same point', function (): void {
    $route = bike47Route($this);
    $selected = app(BookingPickupPoints::class)->resolve($route);
    $fees = app(BookingLocationFees::class)->forSelection($selected);
    expect($fees['pickup_fee_amount'])->toBe(60.0)
        ->and($fees['return_fee_amount'])->toBe(40.0)
        ->and($fees['location_fee_amount'])->toBe(100.0);
});

test('direction-specific one-way price adds to independent pickup and return fees without a security deposit', function (): void {
    bike47FeeRule($this, $this->honnavar, $this->murudeshwar, 200);
    $route = bike47Route($this, true);
    $selected = app(BookingPickupPoints::class)->resolve($route);
    $fees = app(BookingLocationFees::class)->forSelection($selected);
    $start = now()->next(\Carbon\Carbon::MONDAY)->toDateString();
    $end = \Carbon\Carbon::parse($start)->addDay()->toDateString();
    $quote = app(PricingService::class)->calculateQuote(
        bike: $this->bike, startDate: $start, endDate: $end,
        pickupStore: $this->honnavar, returnStore: $this->murudeshwar
    );
    $quote['total_amount'] = round($quote['total_amount'] + $fees['location_fee_amount'], 2);
    $quote['price_breakdown_json'] = [
        ...$quote['price_breakdown_json'], ...$fees,
        'total_amount' => $quote['total_amount'],
    ];
    $quote = BikeBookingPayments::waiveDeposit($quote);
    expect($quote['base_amount'])->toBe(1000.0)
        ->and($quote['one_way_fee_amount'])->toBe(200.0)
        ->and($quote['price_breakdown_json']['pickup_fee_amount'])->toBe(60.0)
        ->and($quote['price_breakdown_json']['return_fee_amount'])->toBe(75.0)
        ->and($quote['deposit_amount'])->toBe(0.0)
        ->and($quote['total_amount'])->toBe(1335.0);
});

test('reverse direction cannot inherit the forward-only price or a global generic rule', function (): void {
    bike47FeeRule($this, $this->honnavar, $this->murudeshwar);
    PricingRule::create([
        'name' => 'Unapproved global fallback',
        'rule_type' => PricingRuleType::ONE_WAY_FEE,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'from_store_id' => null, 'to_store_id' => null,
        'value' => 0, 'priority' => 10, 'is_active' => true,
    ]);
    $start = now()->next(\Carbon\Carbon::MONDAY)->toDateString();
    expect(fn () => app(PricingService::class)->calculateQuote(
        bike: $this->bike, startDate: $start, endDate: $start,
        pickupStore: $this->murudeshwar, returnStore: $this->honnavar
    ))->toThrow(ValidationException::class);
});

test('missing fee blocks checkout even when opposite-direction fee is explicitly free', function (): void {
    $this->return->update(['return_fee' => null]);
    $selected = app(BookingPickupPoints::class)->resolve(bike47Route($this, true));
    expect(fn () => app(BookingLocationFees::class)->forSelection($selected))
        ->toThrow(ValidationException::class);
    $this->return->update(['return_fee' => 0]);
    expect(app(BookingLocationFees::class)->forSelection($selected)['return_fee_amount'])->toBe(0.0);
});

test('admin fee edits are reflected in the next quote without editing historical snapshots', function (): void {
    $selection = app(BookingPickupPoints::class)->resolve(bike47Route($this));
    $before = app(BookingLocationFees::class)->forSelection($selection);
    $this->pickup->update(['pickup_fee' => 115, 'return_fee' => 0]);
    $after = app(BookingLocationFees::class)->forSelection($selection);
    expect($before['location_fee_amount'])->toBe(100.0)
        ->and($after['location_fee_amount'])->toBe(115.0);
});

test('legacy locationless bookings remain compatible when no branch points are published', function (): void {
    $this->pickup->update(['is_active' => false]);
    $route = bike47Route($this);
    $route['pickup_point_id'] = null;
    $route['return_point_id'] = null;
    $selected = app(BookingPickupPoints::class)->resolve($route);
    expect($selected['pickup_point_id'])->toBeNull()
        ->and($selected['return_point_id'])->toBeNull();
});

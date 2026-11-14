<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CabFareRule;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use App\Services\CabFareQuoteEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honn = Store::create([
        'name' => 'Honnavar', 'address_line' => 'NH66',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->muru = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Main Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->item = ServiceItem::create([
        'store_id' => $this->honn->id, 'service_type' => 'taxi',
        'name' => 'Approved Cab Class', 'price_base' => 1000,
        'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $this->otherItem = ServiceItem::create([
        'store_id' => $this->muru->id, 'service_type' => 'taxi',
        'name' => 'Other Branch Class', 'price_base' => 1000,
        'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $this->admin = User::create([
        'name' => 'Cab Fare Admin', 'email' => 'cabfare53-admin@example.test',
        'phone' => '9000005351', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff = User::create([
        'name' => 'Honnavar Cab Staff', 'email' => 'cabfare53-staff@example.test',
        'phone' => '9000005352', 'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->honn->id);
    $this->staff->syncAssignedServices(['taxi']);
    $this->customer = User::create([
        'name' => 'Cab Fare Customer', 'email' => 'cabfare53-customer@example.test',
        'phone' => '9000005353', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
});

function cabFare53Rule($test, string $tripType = 'one_way', string $routeClass = 'honn-muru', array $extra = []): CabFareRule
{
    return CabFareRule::create([
        'store_id' => $test->honn->id, 'service_item_id' => $test->item->id,
        'trip_type' => $tripType, 'route_class' => $routeClass,
        'fixed_route_amount' => 1300,
        'driver_allowance_per_day' => 100,
        'extra_km_amount' => 15,
        'extra_hour_amount' => 100,
        'included_km' => 0, 'included_hours' => 0,
        'toll_policy' => 'excluded', 'parking_policy' => 'excluded',
        'is_active' => true, 'is_approved' => true, ...$extra,
    ]);
}

test('one way approved cab price is itemized and browser supplied prices are ignored', function (): void {
    cabFare53Rule($this);
    $result = app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'one_way', 'route_class' => 'honn-muru',
        'days' => 1, 'extra_km' => 5, 'extra_hours' => 1,
        'base_amount' => 1, 'total_amount' => 1, 'discount_amount' => 10000,
        'verified_toll_amount' => 200,
    ]);
    expect($result['breakdown']['base_fare'])->toBe(1300.0)
        ->and($result['breakdown']['extra_km'])->toBe(75.0)
        ->and($result['breakdown']['extra_hours'])->toBe(100.0)
        ->and($result['breakdown']['driver_allowance'])->toBe(100.0)
        ->and($result['breakdown']['tolls'])->toBe(0.0)
        ->and($result['total_amount'])->toBe(1575.0);
});

test('local hourly minimum and daily minimum are enforced server side', function (): void {
    cabFare53Rule($this, 'local', 'city', [
        'fixed_route_amount' => null, 'hourly_amount' => 100,
        'minimum_hours' => 4, 'daily_minimum_amount' => 550,
        'driver_allowance_per_day' => 0,
    ]);
    $result = app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'local', 'route_class' => 'city', 'estimated_hours' => 2,
    ]);
    expect($result['breakdown']['base_fare'])->toBe(550.0)
        ->and($result['total_amount'])->toBe(550.0);
});

test('round trip distance rate and interstate permit are itemized', function (): void {
    cabFare53Rule($this, 'round_trip', 'interstate', [
        'fixed_route_amount' => null, 'per_km_amount' => 12,
        'minimum_amount' => 100, 'driver_allowance_per_day' => 150,
        'interstate_permit_amount' => 400,
    ]);
    $result = app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'round_trip', 'route_class' => 'interstate',
        'days' => 2, 'estimated_km' => 100, 'interstate' => true,
    ]);
    expect($result['breakdown']['base_fare'])->toBe(1200.0)
        ->and($result['breakdown']['driver_allowance'])->toBe(300.0)
        ->and($result['breakdown']['interstate_permit'])->toBe(400.0)
        ->and($result['total_amount'])->toBe(1900.0);
});

test('airport fixed route fare cannot be forged or reused across an unapproved route', function (): void {
    cabFare53Rule($this, 'airport', 'airport-zone-a', ['fixed_route_amount' => 850]);
    $quote = app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'airport', 'route_class' => 'airport-zone-a', 'fixed_route_amount' => 2,
    ]);
    expect($quote['breakdown']['base_fare'])->toBe(850.0)
        ->and($quote['total_amount'])->toBe(950.0);
    expect(fn () => app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'airport', 'route_class' => 'airport-zone-b',
    ]))->toThrow(ValidationException::class);
});

test('unapproved and inactive fare rules never produce a quote', function (): void {
    $rule = cabFare53Rule($this, 'one_way', 'draft');
    $rule->update(['is_approved' => false]);
    expect(fn () => app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'one_way', 'route_class' => 'draft',
    ]))->toThrow(ValidationException::class);
    $rule->update(['is_approved' => true, 'is_active' => false]);
    expect(fn () => app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'one_way', 'route_class' => 'draft',
    ]))->toThrow(ValidationException::class);
});

test('unknown extras and unverified exact tolls are rejected', function (): void {
    cabFare53Rule($this, 'one_way', 'special', [
        'extra_km_amount' => null, 'toll_policy' => 'exact',
    ]);
    expect(fn () => app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'one_way', 'route_class' => 'special', 'extra_km' => 2,
    ]))->toThrow(ValidationException::class);
    expect(fn () => app(CabFareQuoteEngine::class)->quote($this->item, [
        'trip_type' => 'one_way', 'route_class' => 'special',
        'verified_toll_amount' => 200,
    ]))->toThrow(ValidationException::class);
});

test('new rule creation ignores approval flags and only correct branch staff can access rules', function (): void {
    $payload = [
        'store_id' => $this->honn->id, 'service_item_id' => $this->item->id,
        'trip_type' => 'one_way', 'route_class' => 'honn-muru',
        'fixed_route_amount' => 1250, 'toll_policy' => 'excluded',
        'parking_policy' => 'excluded', 'is_active' => true,
        'is_approved' => true,
    ];
    $this->actingAs($this->staff)->postJson('/admin/cab-fares', $payload)
        ->assertCreated()->assertJsonPath('data.is_approved', false);
    expect(CabFareRule::first()->is_active)->toBeFalse();
    $this->postJson('/admin/cab-fares/simulate', $payload)->assertUnprocessable();

    $payload['store_id'] = $this->muru->id;
    $payload['service_item_id'] = $this->otherItem->id;
    $this->postJson('/admin/cab-fares', $payload)->assertForbidden();
    $this->getJson('/admin/cab-fares')->assertJsonCount(1, 'data');

    $this->actingAs($this->customer)
        ->getJson('/admin/cab-fares')->assertForbidden();
});

test('admin preview shows only already approved server rule, not request amounts', function (): void {
    cabFare53Rule($this);
    $this->actingAs($this->admin)->postJson('/admin/cab-fares/simulate', [
        'store_id' => $this->honn->id, 'service_item_id' => $this->item->id,
        'trip_type' => 'one_way', 'route_class' => 'honn-muru',
        'estimated_km' => 50, 'total_amount' => 1,
    ])->assertOk()->assertJsonPath('preview_only', true)
        ->assertJsonPath('quote.total_amount', 1400);
});

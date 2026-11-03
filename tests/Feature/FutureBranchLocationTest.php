<?php

declare(strict_types=1);

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
use App\Exceptions\BikeNotAvailableException;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\PricingRule;
use App\Models\Store;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Hub',
        'address_line' => 'KSRTC Bus Stand',
        'city' => 'Murudeshwar', 'state' => 'Karnataka',
        'pincode' => '581350', 'latitude' => 14.09, 'longitude' => 74.49,
        'status' => StoreStatus::ACTIVE,
    ]);
    $this->honnavar = Store::create([
        'name' => 'Honnavar Hub',
        'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka',
        'pincode' => '581334', 'latitude' => 14.28, 'longitude' => 74.44,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $this->bike = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $this->murudeshwar->id,
        'current_store_id' => $this->murudeshwar->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-XX-4401',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->customer = User::create([
        'name' => 'Test Rider', 'email' => 'location-rider@example.com',
        'phone' => '9000000088', 'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    PricingRule::create([
        'rule_type' => PricingRuleType::ONE_WAY_FEE,
        'from_store_id' => $this->murudeshwar->id,
        'to_store_id' => $this->honnavar->id,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'value' => 200,
        'priority' => 1,
        'is_active' => true,
    ]);
    $this->dates = [
        'earlyStart' => Carbon::today()->addDays(3)->toDateString(),
        'earlyEnd' => Carbon::today()->addDays(4)->toDateString(),
        'lateStart' => Carbon::today()->addDays(7)->toDateString(),
        'lateEnd' => Carbon::today()->addDays(8)->toDateString(),
    ];
});

function scheduleReservation(int $pickup, int $return, string $start, string $end, BookingStatus $status = BookingStatus::CONFIRMED, ?Carbon $expiry = null): Booking
{
    return Booking::create([
        'booking_reference' => 'BK-FUTURE-'.strtoupper(\Illuminate\Support\Str::random(8)),
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $pickup,
        'return_store_id' => $return,
        'channel' => BookingChannel::ONLINE,
        'status' => $status,
        'start_date' => $start,
        'end_date' => $end,
        'base_amount' => 1000,
        'total_amount' => 1200,
        'deposit_amount' => 0,
        'price_breakdown_json' => [],
        'held_until' => $expiry,
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
    ]);
}

test('a prior one-way return makes the bike bookable at its future destination only', function (): void {
    scheduleReservation(
        $this->murudeshwar->id, $this->honnavar->id,
        $this->dates['earlyStart'], $this->dates['earlyEnd']
    );

    $availability = app(AvailabilityService::class);

    expect($availability->checkAvailability(
        $this->bike, $this->dates['lateStart'], $this->dates['lateEnd'],
        null, $this->honnavar->id, $this->honnavar->id
    ))->toBeTrue();

    expect($availability->checkAvailability(
        $this->bike, $this->dates['lateStart'], $this->dates['lateEnd'],
        null, $this->murudeshwar->id, $this->murudeshwar->id
    ))->toBeFalse();

    $this->getJson('/api/v1/bikes?store_id='.$this->honnavar->id
        .'&start_date='.$this->dates['lateStart']
        .'&end_date='.$this->dates['lateEnd'])
        ->assertOk()->assertJsonCount(1, 'data');

    $this->getJson('/api/v1/bikes?store_id='.$this->murudeshwar->id
        .'&start_date='.$this->dates['lateStart']
        .'&end_date='.$this->dates['lateEnd'])
        ->assertOk()->assertJsonCount(0, 'data');
});

test('hold allows a later Honnavar pickup after a confirmed Murudeshwar to Honnavar return', function (): void {
    scheduleReservation(
        $this->murudeshwar->id, $this->honnavar->id,
        $this->dates['earlyStart'], $this->dates['earlyEnd']
    );

    $booking = app(AvailabilityService::class)->holdBooking([
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->honnavar->id,
        'return_store_id' => $this->honnavar->id,
        'start_date' => $this->dates['lateStart'],
        'end_date' => $this->dates['lateEnd'],
        'channel' => BookingChannel::ONLINE,
        'idempotency_key' => 'destination-reservation',
    ]);

    expect($booking->status)->toBe(BookingStatus::HELD)
        ->and((int) $booking->pickup_store_id)->toBe($this->honnavar->id)
        ->and((float) $booking->one_way_fee_amount)->toBe(0.0);
});

test('inserting an earlier one-way booking cannot strand an existing later pickup', function (): void {
    scheduleReservation(
        $this->murudeshwar->id, $this->murudeshwar->id,
        $this->dates['lateStart'], $this->dates['lateEnd']
    );

    expect(fn () => app(AvailabilityService::class)->holdBooking([
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->murudeshwar->id,
        'return_store_id' => $this->honnavar->id,
        'start_date' => $this->dates['earlyStart'],
        'end_date' => $this->dates['earlyEnd'],
        'channel' => BookingChannel::ONLINE,
        'idempotency_key' => 'would-strand-future-booking',
    ]))->toThrow(BikeNotAvailableException::class);

    expect(Booking::count())->toBe(1);
});

test('inserted earlier booking is allowed if it preserves the next scheduled pickup branch', function (): void {
    scheduleReservation(
        $this->murudeshwar->id, $this->murudeshwar->id,
        $this->dates['lateStart'], $this->dates['lateEnd']
    );

    $booking = app(AvailabilityService::class)->holdBooking([
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->murudeshwar->id,
        'return_store_id' => $this->murudeshwar->id,
        'start_date' => $this->dates['earlyStart'],
        'end_date' => $this->dates['earlyEnd'],
        'channel' => BookingChannel::ONLINE,
        'idempotency_key' => 'preserves-future-pickup',
    ]);

    expect($booking->status)->toBe(BookingStatus::HELD);
});

test('pending payment bookings block date-filtered public availability', function (): void {
    scheduleReservation(
        $this->murudeshwar->id, $this->murudeshwar->id,
        $this->dates['earlyStart'], $this->dates['earlyEnd'],
        BookingStatus::PENDING_PAYMENT, Carbon::now()->addMinutes(15)
    );

    $this->getJson('/api/v1/bikes?store_id='.$this->murudeshwar->id
        .'&start_date='.$this->dates['earlyStart']
        .'&end_date='.$this->dates['earlyEnd'])
        ->assertOk()->assertJsonCount(0, 'data');
});

test('expired holds do not affect future branch projection', function (): void {
    scheduleReservation(
        $this->murudeshwar->id, $this->honnavar->id,
        $this->dates['earlyStart'], $this->dates['earlyEnd'],
        BookingStatus::HELD, Carbon::now()->subMinutes(2)
    );

    expect(app(AvailabilityService::class)->checkAvailability(
        $this->bike, $this->dates['lateStart'], $this->dates['lateEnd'],
        null, $this->murudeshwar->id, $this->murudeshwar->id
    ))->toBeTrue();
});

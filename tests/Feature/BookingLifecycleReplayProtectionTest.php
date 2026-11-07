<?php

declare(strict_types=1);

use App\Enums\BikeConditionStage;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\InvalidBookingTransitionException;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeConditionLog;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->origin = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->destination = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $this->vehicle = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $this->origin->id,
        'current_store_id' => $this->origin->id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA47A4949',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 4500,
    ]);
    \Tests\Support\VerifiedBikeDocuments::attach($this->vehicle);
    $this->customer = User::create([
        'name' => 'Bike Replay Customer',
        'email' => 'bike49-replay@example.test',
        'phone' => '9000009549',
        'password' => 'Password123!',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->rental = Booking::create([
        'user_id' => $this->customer->id,
        'booking_reference' => 'BK-P49-REPLAY-001',
        'idempotency_key' => 'bike49-stale-transition-replay-test',
        'bike_id' => $this->vehicle->id,
        'pickup_store_id' => $this->origin->id,
        'return_store_id' => $this->destination->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->addDays(2),
        'end_date' => now()->addDays(3),
        'base_amount' => 1000,
        'total_amount' => 1200,
        'one_way_fee_amount' => 200,
        'deposit_amount' => 0,
        'price_breakdown_json' => [
            'checkout_payment_option' => 'full',
            'checkout_amount' => 1200,
        ],
    ]);
});

test('duplicate handover with stale confirmed booking cannot add a second inspection or change odometer', function (): void {
    $stale = Booking::findOrFail($this->rental->id);
    $service = app(BookingService::class);
    $service->markHandedOver($this->rental, 4600, notes: 'First verified release');

    expect(fn () => $service->markHandedOver($stale, 4700))
        ->toThrow(InvalidBookingTransitionException::class);

    expect($this->rental->fresh()->status)->toBe(BookingStatus::HANDED_OVER)
        ->and($this->vehicle->fresh()->odometer_reading)->toBe(4600)
        ->and(BikeConditionLog::where('booking_id', $this->rental->id)->count())->toBe(1);
});

test('duplicate return with stale handed-over booking cannot apply fees twice or relocate again', function (): void {
    $service = app(BookingService::class);
    $service->markHandedOver($this->rental, 4600);
    $stale = Booking::findOrFail($this->rental->id);

    $service->markReturned($this->rental->fresh(), 4680, lateFee: 80, damageFee: 20);

    expect(fn () => $service->markReturned($stale, 4800, lateFee: 80, damageFee: 20))
        ->toThrow(InvalidBookingTransitionException::class);

    $booking = $this->rental->fresh();
    expect($booking->status)->toBe(BookingStatus::RETURNED)
        ->and((float) $booking->total_amount)->toBe(1300.0)
        ->and($this->vehicle->fresh()->current_store_id)->toBe($this->destination->id)
        ->and($this->vehicle->fresh()->odometer_reading)->toBe(4680)
        ->and(BikeConditionLog::where('booking_id', $booking->id)
            ->where('stage', BikeConditionStage::RETURN)->count())->toBe(1);
});

test('negative return charges cannot lower an agreed customer rental total', function (): void {
    $service = app(BookingService::class);
    $service->markHandedOver($this->rental, 4600);

    expect(fn () => $service->markReturned($this->rental->fresh(), 4680, lateFee: -100))
        ->toThrow(ValidationException::class);
    expect($this->rental->fresh()->status)->toBe(BookingStatus::HANDED_OVER)
        ->and((float) $this->rental->fresh()->total_amount)->toBe(1200.0)
        ->and(BikeConditionLog::where('booking_id', $this->rental->id)
            ->where('stage', BikeConditionStage::RETURN)->count())->toBe(0);
});

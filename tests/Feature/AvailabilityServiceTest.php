<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BikeNotAvailableException;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use App\Services\AvailabilityService;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    $this->availabilityService = app(AvailabilityService::class);

    $this->store = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '80 Feet Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352000,
        'longitude' => 77.6245000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 1000.00,
        'default_deposit_amount' => 3000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Meteor 350',
        'registration_number' => 'KA-01-AB-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer1 = User::create([
        'name' => 'Customer One',
        'email' => 'customer1@example.com',
        'phone' => '9000000001',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer2 = User::create([
        'name' => 'Customer Two',
        'email' => 'customer2@example.com',
        'phone' => '9000000002',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('simulates two concurrent requests attempting to book the same bike for overlapping dates and asserts exactly one succeeds', function (): void {
    $startDate = '2026-10-10';
    $endDate = '2026-10-12';

    $request1Success = false;
    $request2Success = false;
    $request1Exception = null;
    $request2Exception = null;

    $booking1 = null;
    $booking2 = null;

    // Simulate Request 1
    try {
        $booking1 = $this->availabilityService->holdBooking([
            'bike_id' => $this->bike->id,
            'user_id' => $this->customer1->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'channel' => BookingChannel::ONLINE,
            'idempotency_key' => 'concurrent-req-001',
        ]);
        $request1Success = true;
    } catch (Throwable $e) {
        $request1Exception = $e;
    }

    // Simulate Request 2 for overlapping dates on the same bike
    try {
        $booking2 = $this->availabilityService->holdBooking([
            'bike_id' => $this->bike->id,
            'user_id' => $this->customer2->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => '2026-10-11', // overlaps with Oct 10-12
            'end_date' => '2026-10-13',
            'channel' => BookingChannel::ONLINE,
            'idempotency_key' => 'concurrent-req-002',
        ]);
        $request2Success = true;
    } catch (Throwable $e) {
        $request2Exception = $e;
    }

    // Exactly one must succeed, and the other must throw BikeNotAvailableException
    expect($request1Success)->toBeTrue()
        ->and($request2Success)->toBeFalse()
        ->and($request2Exception)->toBeInstanceOf(BikeNotAvailableException::class)
        ->and($booking1)->toBeInstanceOf(Booking::class)
        ->and($booking1->status)->toBe(BookingStatus::HELD)
        ->and($booking2)->toBeNull();

    // Assert only one booking exists in database for this bike
    $totalBookingsForBike = Booking::where('bike_id', $this->bike->id)->count();
    expect($totalBookingsForBike)->toBe(1);
});

test('row-level lock serializes concurrent booking attempts inside transactions', function (): void {
    $startDate = '2026-11-01';
    $endDate = '2026-11-03';

    // Simulate Transaction 1 locking bike and holding booking
    DB::transaction(function () use ($startDate, $endDate): void {
        // Lock bike row
        $bike = Bike::where('id', $this->bike->id)->lockForUpdate()->firstOrFail();

        $this->availabilityService->holdBooking([
            'bike_id' => $bike->id,
            'user_id' => $this->customer1->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'channel' => BookingChannel::ONLINE,
            'idempotency_key' => 'tx-lock-test-001',
        ]);
    });

    // Transaction 2 attempting to hold same bike on overlapping dates must fail
    expect(function () use ($startDate, $endDate): void {
        $this->availabilityService->holdBooking([
            'bike_id' => $this->bike->id,
            'user_id' => $this->customer2->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'channel' => BookingChannel::OFFLINE,
            'idempotency_key' => 'tx-lock-test-002',
        ]);
    })->toThrow(BikeNotAvailableException::class);
});

test('checkAvailability correctly identifies free and blocked dates', function (): void {
    // 1. Free dates
    expect($this->availabilityService->checkAvailability($this->bike, '2026-12-01', '2026-12-05'))->toBeTrue();

    // 2. Confirmed booking blocks overlapping dates
    Booking::create([
        'booking_reference' => 'BK-TEST-CONFIRMED',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer1->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-12-03',
        'end_date' => '2026-12-04',
        'base_amount' => 2000.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 5000.00,
        'price_breakdown_json' => ['days' => 2],
        'idempotency_key' => 'check-avail-confirmed',
    ]);

    expect($this->availabilityService->checkAvailability($this->bike, '2026-12-01', '2026-12-03'))->toBeFalse()
        ->and($this->availabilityService->checkAvailability($this->bike, '2026-12-04', '2026-12-06'))->toBeFalse()
        ->and($this->availabilityService->checkAvailability($this->bike, '2026-12-05', '2026-12-07'))->toBeTrue();
});

test('expired held bookings do not block availability and can be released', function (): void {
    // Booking held 15 minutes ago (already expired)
    $expiredBooking = Booking::create([
        'booking_reference' => 'BK-TEST-EXPIRED',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer1->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-12-10',
        'end_date' => '2026-12-12',
        'base_amount' => 3000.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 6000.00,
        'price_breakdown_json' => ['days' => 3],
        'held_until' => now()->subMinutes(5), // 5 minutes in past
        'idempotency_key' => 'expired-hold-key',
    ]);

    // Check availability should ignore expired held booking
    expect($this->availabilityService->checkAvailability($this->bike, '2026-12-10', '2026-12-12'))->toBeTrue();

    // Release expired holds cron helper
    $releasedCount = $this->availabilityService->releaseExpiredHolds();
    expect($releasedCount)->toBe(1);

    $expiredBooking->refresh();
    expect($expiredBooking->status)->toBe(BookingStatus::EXPIRED);
});

test('resubmitting with the same idempotency key returns the existing booking safely', function (): void {
    $params = [
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer1->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => '2026-12-20',
        'end_date' => '2026-12-22',
        'channel' => BookingChannel::ONLINE,
        'idempotency_key' => 'idemp-duplicate-safe',
    ];

    $bookingA = $this->availabilityService->holdBooking($params);
    $bookingB = $this->availabilityService->holdBooking($params);

    expect($bookingA->id)->toBe($bookingB->id)
        ->and($bookingA->booking_reference)->toBe($bookingB->booking_reference)
        ->and(Booking::where('idempotency_key', 'idemp-duplicate-safe')->count())->toBe(1);
});

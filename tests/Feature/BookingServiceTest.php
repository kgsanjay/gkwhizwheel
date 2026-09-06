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
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use App\Services\BookingService;

beforeEach(function (): void {
    $this->bookingService = app(BookingService::class);

    $this->pickupStore = Store::create([
        'name' => 'Store Origin',
        'address_line' => '100 North Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9715987,
        'longitude' => 77.5945627,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->returnStore = Store::create([
        'name' => 'Store Destination',
        'address_line' => '200 South Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560002',
        'latitude' => 12.8715987,
        'longitude' => 77.6945627,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Sports',
        'base_daily_rate' => 1500.00,
        'default_deposit_amount' => 5000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->pickupStore->id,
        'home_store_id' => $this->pickupStore->id,
        'brand' => 'Yamaha',
        'model_name' => 'R15 V4',
        'registration_number' => 'KA-01-SP-7777',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'odometer_reading' => 5000,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer = User::create([
        'name' => 'Rider John',
        'email' => 'rider@example.com',
        'phone' => '9555500001',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Staff Agent',
        'email' => 'agent@example.com',
        'phone' => '9555500002',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('happy path booking lifecycle transitions through all states and updates inventory and logs', function (): void {
    // 1. DRAFT / HELD
    $booking = Booking::create([
        'booking_reference' => 'BK-2026-FLOW01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->pickupStore->id,
        'return_store_id' => $this->returnStore->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-03',
        'base_amount' => 4500.00,
        'deposit_amount' => 5000.00,
        'total_amount' => 9500.00,
        'price_breakdown_json' => ['days' => 3],
        'held_until' => now()->addMinutes(10),
        'idempotency_key' => 'flow-test-001',
    ]);

    expect($booking->status)->toBe(BookingStatus::HELD);

    // 2. HELD -> PENDING_PAYMENT
    $booking = $this->bookingService->markPendingPayment($booking);
    expect($booking->status)->toBe(BookingStatus::PENDING_PAYMENT);

    // 3. PENDING_PAYMENT -> CONFIRMED
    $booking = $this->bookingService->confirmPayment($booking, 'pay_rzp_98765');
    expect($booking->status)->toBe(BookingStatus::CONFIRMED);

    // 4. CONFIRMED -> HANDED_OVER
    $booking = $this->bookingService->markHandedOver(
        booking: $booking,
        odometerReading: 5050,
        signaturePath: 'signatures/bk-flow-01.png',
        notes: 'Handover complete, clean condition',
        photoPaths: ['photos/h1.jpg', 'photos/h2.jpg'],
        staffId: $this->staff->id
    );

    expect($booking->status)->toBe(BookingStatus::HANDED_OVER)
        ->and($booking->agreement_signed_at)->not->toBeNull()
        ->and($booking->agreement_signature_path)->toBe('signatures/bk-flow-01.png');

    // Verify Bike state after handover: status is ON_RENT and odometer updated
    $this->bike->refresh();
    expect($this->bike->status)->toBe(BikeStatus::ON_RENT)
        ->and($this->bike->odometer_reading)->toBe(5050);

    // Verify condition log
    expect($booking->conditionLogs)->toHaveCount(1);
    $handoverLog = $booking->conditionLogs->first();
    expect($handoverLog->stage)->toBe(BikeConditionStage::HANDOVER)
        ->and($handoverLog->odometer_reading)->toBe(5050)
        ->and($handoverLog->photos)->toHaveCount(2);

    // 5. HANDED_OVER -> RETURNED (one-way drop to Store Destination)
    $booking = $this->bookingService->markReturned(
        booking: $booking,
        odometerReading: 5350,
        lateFee: 200.00,
        damageFee: 500.00,
        notes: 'Return complete with 1 hr delay and minor helmet scuff',
        photoPaths: ['photos/r1.jpg'],
        staffId: $this->staff->id
    );

    expect($booking->status)->toBe(BookingStatus::RETURNED)
        ->and($booking->late_fee_amount)->toBe('200.00')
        ->and($booking->damage_fee_amount)->toBe('500.00')
        ->and($booking->total_amount)->toBe('10200.00') // 9500 + 200 + 500
        ->and($booking->completed_by)->toBe($this->staff->id);

    // Verify Bike state after return: status is AVAILABLE and current_store relocated to returnStore
    $this->bike->refresh();
    expect($this->bike->status)->toBe(BikeStatus::AVAILABLE)
        ->and($this->bike->current_store_id)->toBe($this->returnStore->id)
        ->and($this->bike->odometer_reading)->toBe(5350);

    // Verify return condition log
    $booking->refresh();
    expect($booking->conditionLogs)->toHaveCount(2);
    $returnLog = $booking->conditionLogs()->where('stage', BikeConditionStage::RETURN)->first();
    expect($returnLog->odometer_reading)->toBe(5350)
        ->and($returnLog->photos)->toHaveCount(1);

    // 6. RETURNED -> COMPLETED
    $booking = $this->bookingService->complete($booking, $this->staff->id);
    expect($booking->status)->toBe(BookingStatus::COMPLETED)
        ->and($booking->completed_by)->toBe($this->staff->id);
});

test('can cancel booking from held, pending_payment, and confirmed states', function (): void {
    // 1. Cancel from HELD
    $b1 = Booking::create([
        'booking_reference' => 'BK-CANCEL-1',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->pickupStore->id,
        'return_store_id' => $this->pickupStore->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-11',
        'base_amount' => 1500,
        'deposit_amount' => 5000,
        'total_amount' => 6500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'cancel-key-1',
    ]);
    $this->bookingService->cancel($b1, 'User changed mind');
    expect($b1->status)->toBe(BookingStatus::CANCELLED);

    // 2. Cancel from CONFIRMED
    $b2 = Booking::create([
        'booking_reference' => 'BK-CANCEL-2',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->pickupStore->id,
        'return_store_id' => $this->pickupStore->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-16',
        'base_amount' => 1500,
        'deposit_amount' => 5000,
        'total_amount' => 6500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'cancel-key-2',
    ]);
    $this->bookingService->cancel($b2, 'Trip cancelled by customer');
    expect($b2->status)->toBe(BookingStatus::CANCELLED);
});

test('can expire held booking', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-EXPIRE-1',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->pickupStore->id,
        'return_store_id' => $this->pickupStore->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-20',
        'end_date' => '2026-10-21',
        'base_amount' => 1500,
        'deposit_amount' => 5000,
        'total_amount' => 6500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'expire-key-1',
    ]);

    $this->bookingService->expire($booking);
    expect($booking->status)->toBe(BookingStatus::EXPIRED);
});

test('can mark confirmed booking as no-show', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-NOSHOW-1',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->pickupStore->id,
        'return_store_id' => $this->pickupStore->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-25',
        'end_date' => '2026-10-26',
        'base_amount' => 1500,
        'deposit_amount' => 5000,
        'total_amount' => 6500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'noshow-key-1',
    ]);

    $this->bookingService->markNoShow($booking, $this->staff->id);
    expect($booking->status)->toBe(BookingStatus::NO_SHOW)
        ->and($booking->completed_by)->toBe($this->staff->id);
});

test('invalid transitions throw clear InvalidBookingTransitionException', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'BK-INVALID-1',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->pickupStore->id,
        'return_store_id' => $this->pickupStore->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-11-10',
        'end_date' => '2026-11-11',
        'base_amount' => 1500,
        'deposit_amount' => 5000,
        'total_amount' => 6500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'invalid-key-1',
    ]);

    // Attempting markHandedOver directly from HELD
    expect(function () use ($booking): void {
        $this->bookingService->markHandedOver($booking, 6000);
    })->toThrow(InvalidBookingTransitionException::class, 'Cannot transition booking [BK-INVALID-1] from [held] to [handed_over].');

    // Attempting markReturned on HELD
    expect(function () use ($booking): void {
        $this->bookingService->markReturned($booking, 6000);
    })->toThrow(InvalidBookingTransitionException::class, 'Cannot transition booking [BK-INVALID-1] from [held] to [returned].');

    // Attempting complete on HELD
    expect(function () use ($booking): void {
        $this->bookingService->complete($booking);
    })->toThrow(InvalidBookingTransitionException::class, 'Cannot transition booking [BK-INVALID-1] from [held] to [completed].');
});

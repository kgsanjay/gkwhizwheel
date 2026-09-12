<?php

declare(strict_types=1);

use App\Exceptions\ServiceItemNotAvailableException;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use App\Services\ServiceAvailabilityService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->service = app(ServiceAvailabilityService::class);

    $this->customer = User::factory()->create([
        'role' => 'customer',
        'phone' => '9876543210',
    ]);
});

test('holdServiceBooking creates held booking with 10-minute hold and idempotency key', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Coastal Heritage Haven Room 1',
        'price_base' => 2000,
        'price_unit' => 'per_night',
        'capacity' => '1 Room',
        'status' => 'available',
    ]);

    $idempotencyKey = 'idem-srv-hold-001';

    $booking = $this->service->holdServiceBooking([
        'service_type' => 'homestay',
        'service_item_id' => $item->id,
        'user_id' => $this->customer->id,
        'customer_name' => 'Pooja Hegde',
        'customer_phone' => '9876543210',
        'start_datetime' => '2026-11-01 12:00:00',
        'end_datetime' => '2026-11-03 11:00:00',
        'quantity' => 1,
        'total_amount' => 4000,
        'idempotency_key' => $idempotencyKey,
    ]);

    expect($booking)->toBeInstanceOf(ServiceBooking::class)
        ->and($booking->status)->toBe('held')
        ->and($booking->idempotency_key)->toBe($idempotencyKey)
        ->and($booking->held_until)->not->toBeNull()
        ->and(Carbon::parse($booking->held_until)->diffInMinutes(now()))->toBeLessThanOrEqual(10);
});

test('submitting with the same idempotency_key returns the existing service booking without duplicating', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Deep Explorer Dive 1',
        'price_base' => 3800,
        'price_unit' => 'per_dive',
        'capacity' => '1 Diver / 1 Master',
        'status' => 'available',
    ]);

    $idempotencyKey = 'idem-double-click-scuba-999';

    $first = $this->service->holdServiceBooking([
        'service_type' => 'scuba',
        'service_item_id' => $item->id,
        'customer_name' => 'Arun Kumar',
        'customer_phone' => '9876500001',
        'start_datetime' => '2026-11-10 09:00:00',
        'quantity' => 1,
        'idempotency_key' => $idempotencyKey,
    ]);

    $second = $this->service->holdServiceBooking([
        'service_type' => 'scuba',
        'service_item_id' => $item->id,
        'customer_name' => 'Arun Kumar',
        'customer_phone' => '9876500001',
        'start_datetime' => '2026-11-10 09:00:00',
        'quantity' => 1,
        'idempotency_key' => $idempotencyKey,
    ]);

    expect($second->id)->toBe($first->id)
        ->and(ServiceBooking::where('idempotency_key', $idempotencyKey)->count())->toBe(1);
});

test('service_bookings table enforces unique constraint on idempotency_key', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Coastal Cab 01',
        'price_base' => 2000,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);

    ServiceBooking::create([
        'booking_number' => 'GKW-TX-260101-AAAA',
        'service_type' => 'taxi',
        'service_item_id' => $item->id,
        'customer_name' => 'User 1',
        'customer_phone' => '9876511111',
        'start_datetime' => '2026-11-15 10:00:00',
        'idempotency_key' => 'duplicate-test-key-123',
    ]);

    expect(function () use ($item) {
        ServiceBooking::create([
            'booking_number' => 'GKW-TX-260101-BBBB',
            'service_type' => 'taxi',
            'service_item_id' => $item->id,
            'customer_name' => 'User 2',
            'customer_phone' => '9876522222',
            'start_datetime' => '2026-11-16 10:00:00',
            'idempotency_key' => 'duplicate-test-key-123',
        ]);
    })->toThrow(QueryException::class);
});

test('active held booking blocks live availability during hold window', function (): void {
    $room = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Beachside Luxury Room 2',
        'price_base' => 3000,
        'price_unit' => 'per_night',
        'capacity' => '1 Room',
        'status' => 'available',
    ]);

    // First user places a hold on the room
    $this->service->holdServiceBooking([
        'service_type' => 'homestay',
        'service_item_id' => $room->id,
        'customer_name' => 'Held Customer',
        'customer_phone' => '9876533333',
        'start_datetime' => '2026-12-20 12:00:00',
        'end_datetime' => '2026-12-22 11:00:00',
        'quantity' => 1,
        'idempotency_key' => 'hold-active-001',
    ]);

    // Second user attempts to hold/book the same room for overlapping dates
    expect(function () use ($room) {
        $this->service->holdServiceBooking([
            'service_type' => 'homestay',
            'service_item_id' => $room->id,
            'customer_name' => 'Compromised Customer',
            'customer_phone' => '9876544444',
            'start_datetime' => '2026-12-21 12:00:00',
            'end_datetime' => '2026-12-23 11:00:00',
            'quantity' => 1,
            'idempotency_key' => 'hold-conflicted-002',
        ]);
    })->toThrow(ServiceItemNotAvailableException::class);
});

test('confirmServiceBooking confirms reservation and clears held_until', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sharavathi Estuary Luxury Yacht',
        'price_base' => 5000,
        'price_unit' => 'per_trip',
        'capacity' => '10 Persons',
        'status' => 'available',
    ]);

    $held = $this->service->holdServiceBooking([
        'service_type' => 'boating',
        'service_item_id' => $item->id,
        'customer_name' => 'Captain Guest',
        'customer_phone' => '9876555555',
        'start_datetime' => '2026-11-25 15:00:00',
        'quantity' => 4,
        'idempotency_key' => 'yacht-hold-999',
    ]);

    expect($held->status)->toBe('held');

    $confirmed = $this->service->confirmServiceBooking($held);

    expect($confirmed->status)->toBe('confirmed')
        ->and($confirmed->held_until)->toBeNull();
});

test('releaseExpiredServiceHolds flips expired holds back to available', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Peak Dive',
        'price_base' => 4000,
        'price_unit' => 'per_dive',
        'capacity' => '1 Diver',
        'status' => 'available',
    ]);

    // Create an expired hold (held_until in the past)
    $expiredHold = ServiceBooking::create([
        'booking_number' => 'GKW-SC-EXP-0001',
        'service_type' => 'scuba',
        'service_item_id' => $item->id,
        'customer_name' => 'Ghost Diver',
        'customer_phone' => '9876566666',
        'start_datetime' => '2026-12-10 09:00:00',
        'quantity' => 1,
        'status' => 'held',
        'held_until' => now()->subMinutes(5),
        'idempotency_key' => 'ghost-diver-key',
    ]);

    $releasedCount = $this->service->releaseExpiredServiceHolds();

    expect($releasedCount)->toBeGreaterThanOrEqual(1);
    expect($expiredHold->fresh()->status)->toBe('expired');

    // Slot is now free for another customer
    $newBooking = $this->service->holdServiceBooking([
        'service_type' => 'scuba',
        'service_item_id' => $item->id,
        'customer_name' => 'Real Diver',
        'customer_phone' => '9876577777',
        'start_datetime' => '2026-12-10 09:00:00',
        'quantity' => 1,
        'idempotency_key' => 'real-diver-key',
    ]);

    expect($newBooking)->not->toBeNull()
        ->and($newBooking->status)->toBe('held');
});

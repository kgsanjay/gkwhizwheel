<?php

declare(strict_types=1);

use App\Exceptions\ServiceItemNotAvailableException;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->availabilityService = app(AvailabilityService::class);

    $this->user = User::factory()->create([
        'role' => 'customer',
        'phone' => '9876543210',
    ]);
});

test('createServiceBooking locks ServiceItem, verifies availability, and creates ServiceBooking', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Sunset Heritage Villa Room 1',
        'price_base' => 2500,
        'price_unit' => 'per_night',
        'capacity' => '1 Room (2 Guests)',
        'status' => 'available',
    ]);

    $start = Carbon::now()->addDays(2)->format('Y-m-d 14:00:00');
    $end = Carbon::now()->addDays(4)->format('Y-m-d 11:00:00');

    $booking = $this->availabilityService->createServiceBooking([
        'service_type' => 'homestay',
        'service_item_id' => $item->id,
        'user_id' => $this->user->id,
        'customer_name' => 'Aditi Sharma',
        'customer_phone' => '9876543210',
        'start_datetime' => $start,
        'end_datetime' => $end,
        'quantity' => 1,
        'total_amount' => 5000,
        'advance_paid' => 1000,
        'balance_due' => 4000,
        'status' => 'confirmed',
        'payment_method' => 'online',
    ]);

    expect($booking)->toBeInstanceOf(ServiceBooking::class)
        ->and($booking->booking_number)->toStartWith('GKW-HS-')
        ->and($booking->service_item_id)->toBe($item->id)
        ->and($booking->status)->toBe('confirmed');
});

test('two simultaneous bookings for the same discrete service item cannot both succeed (e.g. homestay room)', function (): void {
    $homestay = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Aversa River Cottage Room A',
        'price_base' => 1800,
        'price_unit' => 'per_night',
        'capacity' => '1 Room',
        'status' => 'available',
    ]);

    $start = '2026-10-10 12:00:00';
    $end = '2026-10-12 11:00:00';

    // First booking takes the room
    $booking1 = $this->availabilityService->createServiceBooking([
        'service_type' => 'homestay',
        'service_item_id' => $homestay->id,
        'customer_name' => 'Customer A',
        'customer_phone' => '9876500001',
        'start_datetime' => $start,
        'end_datetime' => $end,
        'quantity' => 1,
        'status' => 'confirmed',
        'payment_method' => 'online',
    ]);

    expect($booking1)->not->toBeNull();

    // Second simultaneous booking for overlapping dates must fail with ServiceItemNotAvailableException
    expect(function () use ($homestay, $start, $end) {
        $this->availabilityService->createServiceBooking([
            'service_type' => 'homestay',
            'service_item_id' => $homestay->id,
            'customer_name' => 'Customer B',
            'customer_phone' => '9876500002',
            'start_datetime' => '2026-10-11 14:00:00', // overlapping
            'end_datetime' => '2026-10-13 11:00:00',
            'quantity' => 1,
            'status' => 'confirmed',
            'payment_method' => 'online',
        ]);
    })->toThrow(ServiceItemNotAvailableException::class);
});

test('booking the last dive slot prevents overbooking (e.g. scuba slot capacity)', function (): void {
    $scubaItem = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Island Guided Dive Master 1',
        'price_base' => 4500,
        'price_unit' => 'per_dive',
        'capacity' => '1 Diver / 1 Master',
        'status' => 'available',
    ]);

    $diveTime = '2026-11-15 08:30:00';

    // Book the only available slot
    $this->availabilityService->createServiceBooking([
        'service_type' => 'scuba',
        'service_item_id' => $scubaItem->id,
        'customer_name' => 'Diver One',
        'customer_phone' => '9876511111',
        'start_datetime' => $diveTime,
        'quantity' => 1,
        'status' => 'confirmed',
        'payment_method' => 'online',
    ]);

    // Second diver attempting to book the same slot on the same day fails
    expect(function () use ($scubaItem, $diveTime) {
        $this->availabilityService->createServiceBooking([
            'service_type' => 'scuba',
            'service_item_id' => $scubaItem->id,
            'customer_name' => 'Diver Two',
            'customer_phone' => '9876522222',
            'start_datetime' => $diveTime,
            'quantity' => 1,
            'status' => 'confirmed',
            'payment_method' => 'online',
        ]);
    })->toThrow(ServiceItemNotAvailableException::class);
});

test('service item in maintenance or booked status immediately rejects new booking', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Toyota Innova Crysta #1',
        'price_base' => 3200,
        'price_unit' => 'per_day',
        'capacity' => '7 Passengers',
        'status' => 'maintenance',
    ]);

    expect(function () use ($item) {
        $this->availabilityService->createServiceBooking([
            'service_type' => 'taxi',
            'service_item_id' => $item->id,
            'customer_name' => 'Traveler',
            'customer_phone' => '9876533333',
            'start_datetime' => '2026-12-01 09:00:00',
            'quantity' => 1,
            'status' => 'confirmed',
            'payment_method' => 'online',
        ]);
    })->toThrow(ServiceItemNotAvailableException::class);
});

test('non-overlapping bookings for the same service item both succeed', function (): void {
    $cab = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Ertiga Premier #2',
        'price_base' => 2800,
        'price_unit' => 'per_day',
        'capacity' => '6 Passengers',
        'status' => 'available',
    ]);

    $booking1 = $this->availabilityService->createServiceBooking([
        'service_type' => 'taxi',
        'service_item_id' => $cab->id,
        'customer_name' => 'Trip 1',
        'customer_phone' => '9876544441',
        'start_datetime' => '2026-12-01 08:00:00',
        'end_datetime' => '2026-12-02 20:00:00',
        'quantity' => 1,
        'status' => 'confirmed',
        'payment_method' => 'online',
    ]);

    $booking2 = $this->availabilityService->createServiceBooking([
        'service_type' => 'taxi',
        'service_item_id' => $cab->id,
        'customer_name' => 'Trip 2',
        'customer_phone' => '9876544442',
        'start_datetime' => '2026-12-05 08:00:00',
        'end_datetime' => '2026-12-06 20:00:00',
        'quantity' => 1,
        'status' => 'confirmed',
        'payment_method' => 'online',
    ]);

    expect($booking1)->not->toBeNull()
        ->and($booking2)->not->toBeNull()
        ->and($booking1->id)->not->toBe($booking2->id);
});

test('online booking controller endpoint returns 422 JSON when item is unavailable due to concurrent booking', function (): void {
    $homestay = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Beachfront Casuarina Room 101',
        'price_base' => 2200,
        'price_unit' => 'per_night',
        'capacity' => '1 Room',
        'status' => 'available',
    ]);

    $start = '2026-10-20 14:00:00';
    $end = '2026-10-22 11:00:00';

    // Existing confirmed booking
    ServiceBooking::create([
        'booking_number' => 'GKW-HS-261020-TEST',
        'service_type' => 'homestay',
        'service_item_id' => $homestay->id,
        'customer_name' => 'First Guest',
        'customer_phone' => '9876599991',
        'start_datetime' => $start,
        'end_datetime' => $end,
        'quantity' => 1,
        'status' => 'confirmed',
        'payment_method' => 'online',
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('services.book'), [
            'service_type' => 'homestay',
            'service_item_id' => $homestay->id,
            'customer_name' => 'Second Guest',
            'customer_phone' => '9876599992',
            'start_datetime' => '2026-10-21 14:00:00',
            'end_datetime' => '2026-10-23 11:00:00',
            'quantity' => 1,
            'pickup_location' => 'Honnavar Station',
            'payment_method' => 'online',
        ]);

    $response->assertStatus(422)
        ->assertJsonStructure(['message']);
});

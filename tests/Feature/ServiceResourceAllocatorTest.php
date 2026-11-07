<?php

declare(strict_types=1);

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use App\Services\ServiceResourceAllocator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->allocator = app(ServiceResourceAllocator::class);
    $this->item = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Test boat',
        'price_base' => 500,
        'price_unit' => 'per_person',
        'capacity' => '4 Persons',
        'status' => 'available',
    ]);
    $this->resource = ServiceResource::create([
        'service_item_id' => $this->item->id,
        'resource_type' => 'boat',
        'code' => 'BOAT-TEST-1',
        'name' => 'Test Vessel',
        'capacity_units' => 4,
        'status' => 'available',
    ]);
});

function resourceTestBooking($test, string $reference, ?ServiceItem $item = null): ServiceBooking
{
    $item ??= $test->item;

    return ServiceBooking::create([
        'booking_number' => $reference,
        'service_type' => $item->service_type,
        'service_item_id' => $item->id,
        'customer_name' => 'Test Guest',
        'customer_phone' => '9000009876',
        'start_datetime' => now()->addDays(10),
        'quantity' => 1,
        'status' => 'held',
        'total_amount' => 500,
    ]);
}

test('resource allocation reserves units and rejects overselling capacity', function (): void {
    $one = resourceTestBooking($this, 'GKW-RSC-0001');
    $two = resourceTestBooking($this, 'GKW-RSC-0002');
    $three = resourceTestBooking($this, 'GKW-RSC-0003');
    $start = now()->addDays(10)->startOfDay()->addHours(9)->toDateTimeString();
    $end = now()->addDays(10)->startOfDay()->addHours(10)->toDateTimeString();

    $first = $this->allocator->allocate($this->resource, $one, $start, $end, 3);
    expect($first->quantity)->toBe(3);
    $this->allocator->allocate($this->resource, $two, $start, $end, 1);

    expect(fn () => $this->allocator->allocate($this->resource, $three, $start, $end, 1))
        ->toThrow(ValidationException::class);
    expect(ServiceResourceAllocation::count())->toBe(2);
});

test('allocation is idempotent and adjacent booking intervals do not overlap', function (): void {
    $one = resourceTestBooking($this, 'GKW-RSC-0011');
    $two = resourceTestBooking($this, 'GKW-RSC-0012');
    $day = now()->addDays(12)->startOfDay();
    $start = $day->copy()->addHours(10)->toDateTimeString();
    $end = $day->copy()->addHours(11)->toDateTimeString();
    $later = $day->copy()->addHours(12)->toDateTimeString();

    $first = $this->allocator->allocate($this->resource, $one, $start, $end, 4);
    $retry = $this->allocator->allocate($this->resource, $one, $start, $end, 4);
    expect($retry->id)->toBe($first->id);
    $next = $this->allocator->allocate($this->resource, $two, $end, $later, 4);
    expect($next->id)->not->toBe($first->id)
        ->and(ServiceResourceAllocation::count())->toBe(2);
});

test('wrong item/branch and draft resources are never allocated', function (): void {
    $other = ServiceItem::create([
        'service_type' => 'scuba', 'name' => 'Dive session',
        'price_base' => 1000, 'price_unit' => 'per_person', 'status' => 'available',
    ]);
    $wrong = resourceTestBooking($this, 'GKW-RSC-0021', $other);
    $start = now()->addDays(10)->toDateTimeString();
    $end = now()->addDays(10)->addHour()->toDateTimeString();
    expect(fn () => $this->allocator->allocate($this->resource, $wrong, $start, $end))
        ->toThrow(ValidationException::class);

    $this->resource->update(['status' => 'draft']);
    $valid = resourceTestBooking($this, 'GKW-RSC-0022');
    expect(fn () => $this->allocator->allocate($this->resource, $valid, $start, $end))
        ->toThrow(ValidationException::class);
});

test('expired allocations free capacity and invalid date windows are rejected', function (): void {
    $old = resourceTestBooking($this, 'GKW-RSC-0031');
    $new = resourceTestBooking($this, 'GKW-RSC-0032');
    $start = now()->addDays(10)->toDateTimeString();
    $end = now()->addDays(10)->addHour()->toDateTimeString();
    $first = $this->allocator->allocate($this->resource, $old, $start, $end, 4);
    $first->update(['held_until' => now()->subMinute()]);
    $second = $this->allocator->allocate($this->resource, $new, $start, $end, 4);
    expect($second->id)->not->toBe($first->id);

    expect(fn () => $this->allocator->allocate($this->resource, $new, $end, $start))
        ->toThrow(ValidationException::class);
});

test('resource data does not automatically modify existing ServiceItem booking records', function (): void {
    $this->assertDatabaseCount('service_resource_allocations', 0);
    $this->assertDatabaseCount('service_bookings', 0);
    expect($this->item->fresh()->status)->toBe('available');
});

<?php

declare(strict_types=1);

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->serviceItem = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Peak Dive',
        'price_base' => 4000,
        'price_unit' => 'per_dive',
        'capacity' => '1 Diver',
        'status' => 'available',
    ]);
});

test('artisan command releases expired held service bookings and leaves active holds intact', function (): void {
    // 1. Expired hold (held_until in past)
    $expiredBooking = ServiceBooking::create([
        'booking_number' => 'SB-EXP-001',
        'service_type' => 'scuba',
        'service_item_id' => $this->serviceItem->id,
        'customer_name' => 'Ghost Diver',
        'customer_phone' => '9876543210',
        'status' => 'held',
        'start_datetime' => '2026-10-10 09:00:00',
        'quantity' => 1,
        'held_until' => now()->subMinutes(3),
        'idempotency_key' => 'sb-key-exp-001',
    ]);

    // 2. Active hold (held_until in future)
    $activeBooking = ServiceBooking::create([
        'booking_number' => 'SB-ACT-002',
        'service_type' => 'scuba',
        'service_item_id' => $this->serviceItem->id,
        'customer_name' => 'Active Diver',
        'customer_phone' => '9876543211',
        'status' => 'held',
        'start_datetime' => '2026-10-10 13:00:00',
        'quantity' => 1,
        'held_until' => now()->addMinutes(7),
        'idempotency_key' => 'sb-key-act-002',
    ]);

    // Run the artisan command
    $this->artisan('services:release-expired-holds')
        ->expectsOutput('Released 1 expired held service booking(s).')
        ->assertSuccessful();

    $expiredBooking->refresh();
    $activeBooking->refresh();

    expect($expiredBooking->status)->toBe('expired')
        ->and($activeBooking->status)->toBe('held');
});

test('command is registered in the console scheduler to run every minute', function (): void {
    $schedule = app(Schedule::class);

    $scheduledEvents = collect($schedule->events())->filter(function ($event) {
        return str_contains($event->command ?? '', 'services:release-expired-holds');
    });

    expect($scheduledEvents)->not->toBeEmpty();

    $event = $scheduledEvents->first();
    // Every minute expression is '* * * * *'
    expect($event->expression)->toBe('* * * * *');
});

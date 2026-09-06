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
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Store Command Test',
        'address_line' => '100 Terminal Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9715987,
        'longitude' => 77.5945627,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-EQ-5555',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->user = User::create([
        'name' => 'Test Customer',
        'email' => 'commandtest@example.com',
        'phone' => '9999988888',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('artisan command releases expired held bookings and leaves active holds intact', function (): void {
    // 1. Expired hold (held_until in past)
    $expiredBooking = Booking::create([
        'booking_reference' => 'BK-EXP-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->user->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-02',
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
        'held_until' => now()->subMinutes(2),
        'idempotency_key' => 'key-exp-001',
    ]);

    // 2. Active hold (held_until in future)
    $activeBooking = Booking::create([
        'booking_reference' => 'BK-ACT-002',
        'bike_id' => $this->bike->id,
        'user_id' => $this->user->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-10-05',
        'end_date' => '2026-10-06',
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
        'held_until' => now()->addMinutes(8),
        'idempotency_key' => 'key-act-002',
    ]);

    // Run the artisan command
    $this->artisan('bookings:release-expired-holds')
        ->expectsOutput('Released 1 expired held booking(s).')
        ->assertSuccessful();

    $expiredBooking->refresh();
    $activeBooking->refresh();

    expect($expiredBooking->status)->toBe(BookingStatus::EXPIRED)
        ->and($activeBooking->status)->toBe(BookingStatus::HELD);
});

test('command is registered in the console scheduler to run every minute', function (): void {
    $schedule = app(Schedule::class);

    $scheduledEvents = collect($schedule->events())->filter(function ($event) {
        return str_contains($event->command ?? '', 'bookings:release-expired-holds');
    });

    expect($scheduledEvents)->not->toBeEmpty();

    $event = $scheduledEvents->first();
    // Every minute expression is '* * * * *'
    expect($event->expression)->toBe('* * * * *');
});

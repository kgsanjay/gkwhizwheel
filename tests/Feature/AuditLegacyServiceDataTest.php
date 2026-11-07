<?php

declare(strict_types=1);

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('audit does not modify tables, bookings, migrations or legacy data', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Legacy Cab Offering',
        'price_base' => 900,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $booking = ServiceBooking::create([
        'booking_number' => 'GKW-LEGACY-AUDIT-1',
        'service_type' => 'taxi',
        'service_item_id' => $item->id,
        'customer_name' => 'Legacy Test Customer',
        'customer_phone' => '9000009777',
        'start_datetime' => now()->addDays(7),
        'quantity' => 1,
        'status' => 'confirmed',
        'total_amount' => 900,
        'advance_paid' => 0,
        'balance_due' => 900,
    ]);
    $before = $booking->fresh()->getRawOriginal();
    $migrationCount = DB::table('migrations')->count();

    $this->artisan('audit:legacy-services', ['--strict' => true])->assertSuccessful();

    expect($booking->fresh()->getRawOriginal())->toBe($before)
        ->and(DB::table('migrations')->count())->toBe($migrationCount)
        ->and(ServiceBooking::count())->toBe(1);
});

test('strict audit detects legacy confirmed bookings without a real service item', function (): void {
    ServiceBooking::create([
        'booking_number' => 'GKW-LEGACY-AUDIT-2',
        'service_type' => 'boating',
        'service_item_id' => null,
        'customer_name' => 'Legacy Test Customer',
        'customer_phone' => '9000009778',
        'start_datetime' => now()->addDays(8),
        'quantity' => 1,
        'status' => 'confirmed',
        'total_amount' => 200,
        'advance_paid' => 0,
        'balance_due' => 200,
    ]);

    $this->artisan('audit:legacy-services', ['--strict' => true])->assertFailed();
    expect(ServiceBooking::count())->toBe(1)
        ->and(ServiceBooking::first()->status)->toBe('confirmed');
});

test('audit can list warnings for review without mutating historical bookings', function (): void {
    ServiceBooking::create([
        'booking_number' => 'GKW-LEGACY-AUDIT-3',
        'service_type' => 'scuba',
        'service_item_id' => null,
        'customer_name' => 'Legacy Test Customer',
        'customer_phone' => '9000009779',
        'start_datetime' => now()->addDays(9),
        'quantity' => 1,
        'status' => 'confirmed',
        'total_amount' => 0,
        'advance_paid' => 0,
        'balance_due' => 0,
    ]);
    $this->artisan('audit:legacy-services')->assertSuccessful();
    expect(ServiceBooking::first()->status)->toBe('confirmed');
});

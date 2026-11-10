<?php

declare(strict_types=1);

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Services\ServiceResourceSchemaPreflight;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(Tests\TestCase::class);

beforeEach(function (): void {
    // This file deliberately exercises MySQL's nontransactional DDL behavior.
    // It must never reset an arbitrary developer, staging or production DB.
    if (getenv('RESOURCE_SCHEMA_RECOVERY_TESTS') !== '1') {
        $this->markTestSkipped('Requires an explicitly enabled disposable MySQL recovery job.');
    }
    if (! app()->environment('testing') || DB::getDriverName() !== 'mysql'
        || DB::getDatabaseName() !== 'gkw_cab_race_ci') {
        throw new RuntimeException('Recovery tests refuse any database except the disposable MySQL CI database.');
    }
    $this->artisan('migrate:fresh', ['--force' => true])->assertSuccessful();
});

function recovery44Fixture(): array
{
    $item = ServiceItem::create([
        'service_type' => 'taxi', 'name' => 'Recovery CI item', 'price_base' => 1000,
        'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $booking = ServiceBooking::create([
        'service_item_id' => $item->id, 'service_type' => 'taxi',
        'booking_number' => 'RECOVERY-44-CI', 'booking_channel' => 'offline_walkin',
        'customer_name' => 'Recovery CI', 'customer_phone' => '9000000044',
        'start_datetime' => now()->addDays(3), 'end_datetime' => now()->addDays(3)->addHour(),
        'quantity' => 1, 'total_amount' => 1000, 'advance_paid' => 0,
        'balance_due' => 1000, 'status' => 'confirmed',
    ]);
    $resource = ServiceResource::create([
        'service_item_id' => $item->id, 'resource_type' => 'cab_vehicle',
        'code' => 'RECOVERY-CI-CAB', 'name' => 'Recovery CI cab',
        'capacity_units' => 1, 'status' => 'available',
    ]);
    DB::table('service_resource_allocations')->insert([
        'service_resource_id' => $resource->id, 'service_booking_id' => $booking->id,
        'starts_at' => $booking->start_datetime, 'ends_at' => $booking->end_datetime,
        'quantity' => 1, 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now(),
    ]);
    return [$booking, $resource];
}

function recovery44Snapshot(): array
{
    return [
        'history' => DB::table('migrations')->orderBy('id')->get()->toJson(),
        'bookings' => DB::table('service_bookings')->orderBy('id')->get()->toJson(),
        'allocations' => Schema::hasTable('service_resource_allocations')
            ? DB::table('service_resource_allocations')->orderBy('id')->get()->toJson() : null,
        'resources' => Schema::hasTable('service_resources')
            ? DB::table('service_resources')->orderBy('id')->get()->toJson() : null,
    ];
}

test('mysql applied foundation is read only and a normal migration rerun preserves existing rows', function (): void {
    recovery44Fixture();
    $before = recovery44Snapshot();
    expect(app(ServiceResourceSchemaPreflight::class)->inspect(true)['state'])->toBe('applied');
    $this->artisan('audit:resource-schema --require-mysql --json')->assertSuccessful();
    $this->artisan('migrate', ['--force' => true])->assertSuccessful();
    expect(recovery44Snapshot())->toBe($before);
});

test('mysql oversized index failure leaves unrecorded ddl that preflight blocks without data loss', function (): void {
    recovery44Fixture();
    DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->delete();
    Schema::table('service_resource_allocations', fn ($table) => $table->dropUnique('resource_booking_unique'));
    try {
        // Reproduce main's generated 74-character index name, not a mocked error.
        Schema::table('service_resource_allocations', fn ($table) =>
            $table->unique(['service_resource_id', 'service_booking_id']));
        throw new RuntimeException('MySQL unexpectedly accepted an oversized index identifier.');
    } catch (QueryException $e) {
        expect((int) $e->errorInfo[1])->toBe(1059);
    }
    $before = recovery44Snapshot();
    $report = app(ServiceResourceSchemaPreflight::class)->inspect(true);
    expect($report['state'])->toBe('blocked')
        ->and($report['findings'])->toContain('unrecorded_existing_schema',
            'missing_unique:service_resource_allocations.service_resource_id,service_booking_id');
    $this->artisan('audit:resource-schema --require-mysql')->assertFailed();
    $this->artisan('audit:resource-schema --require-mysql --json')->assertFailed();
    expect(recovery44Snapshot())->toBe($before);

    // An operator can repair a missing index on a reviewed disposable restore,
    // but that must not silently adopt migration history or authorize a rerun.
    Schema::table('service_resource_allocations', fn ($table) =>
        $table->unique(['service_resource_id', 'service_booking_id'], 'resource_booking_unique'));
    $report = app(ServiceResourceSchemaPreflight::class)->inspect(true);
    expect($report['findings'])->toBe(['unrecorded_existing_schema'])
        ->and(recovery44Snapshot())->toBe($before);
});

test('mysql partial foundation preserves existing resource and historical booking rows', function (): void {
    recovery44Fixture();
    Schema::drop('service_resource_allocations');
    DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->delete();
    $before = recovery44Snapshot();
    $report = app(ServiceResourceSchemaPreflight::class)->inspect(true);
    expect($report['state'])->toBe('blocked')
        ->and($report['findings'])->toContain('partial_unrecorded_schema');
    $this->artisan('audit:resource-schema --require-mysql')->assertFailed();
    expect(recovery44Snapshot())->toBe($before);
});

test('mysql recorded migration with missing table is blocked', function (): void {
    Schema::drop('service_resource_allocations');
    $report = app(ServiceResourceSchemaPreflight::class)->inspect(true);
    expect($report['state'])->toBe('blocked')
        ->and($report['findings'])->toContain('recorded_migration_missing_tables');
});

test('mysql complete unrecorded schema cannot be accepted as migrated', function (): void {
    DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->delete();
    expect(app(ServiceResourceSchemaPreflight::class)->inspect(true)['findings'])->toBe(['unrecorded_existing_schema']);
    $this->artisan('audit:resource-schema --require-mysql')->assertFailed();
});

test('mysql missing allocation foreign key fails the structural contract', function (): void {
    Schema::table('service_resource_allocations', fn ($table) => $table->dropForeign(['service_booking_id']));
    expect(app(ServiceResourceSchemaPreflight::class)->inspect(true)['findings'])
        ->toContain('missing_restrict_foreign_key:service_resource_allocations.service_booking_id');
});

test('mysql nontransactional incomplete allocation table is refused', function (): void {
    Schema::drop('service_resource_allocations');
    DB::statement('CREATE TABLE service_resource_allocations (id BIGINT UNSIGNED PRIMARY KEY) ENGINE=MyISAM');
    $report = app(ServiceResourceSchemaPreflight::class)->inspect(true);
    expect($report['state'])->toBe('blocked')
        ->and($report['findings'])->toContain('non_innodb_table:service_resource_allocations',
            'missing_column:service_resource_allocations.service_resource_id');
});

test('mysql absent unrecorded foundation is pending rather than partially applied', function (): void {
    Schema::disableForeignKeyConstraints();
    try {
        Schema::drop('service_resource_allocations');
        Schema::drop('service_resources');
    } finally {
        Schema::enableForeignKeyConstraints();
    }
    DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->delete();
    $report = app(ServiceResourceSchemaPreflight::class)->inspect(true);
    expect($report['state'])->toBe('fresh_pending')->and($report['findings'])->toBe([]);
    $this->artisan('audit:resource-schema --require-mysql')->assertSuccessful();
});

<?php

declare(strict_types=1);

use App\Services\ServiceResourceSchemaPreflight;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('resource schema preflight reads applied foundation without modifying migration history', function (): void {
    $before = DB::table('migrations')->orderBy('id')->get()->toJson();
    $report = app(ServiceResourceSchemaPreflight::class)->inspect();
    expect($report['state'])->toBe('applied')
        ->and($report['findings'])->toBe([])
        ->and($report['writes_performed'])->toBeFalse()
        ->and(DB::table('migrations')->orderBy('id')->get()->toJson())->toBe($before);
    $this->artisan('audit:resource-schema --json')->assertSuccessful();
});

test('resource schema preflight blocks complete but unrecorded tables without adopting history', function (): void {
    DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->delete();
    $report = app(ServiceResourceSchemaPreflight::class)->inspect();
    expect($report['state'])->toBe('blocked')
        ->and($report['findings'])->toContain('unrecorded_existing_schema')
        ->and(DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->count())->toBe(0);
    $this->artisan('audit:resource-schema')->assertFailed();
});

test('resource schema preflight detects missing unique constraint', function (): void {
    Schema::table('service_resource_allocations', fn ($table) => $table->dropUnique('resource_booking_unique'));
    $report = app(ServiceResourceSchemaPreflight::class)->inspect();
    expect($report['state'])->toBe('blocked')
        ->and($report['findings'])->toContain('missing_unique:service_resource_allocations.service_resource_id,service_booking_id');
    $this->artisan('audit:resource-schema')->assertFailed();
});

test('resource schema preflight does not count sqlite as mysql release evidence', function (): void {
    if (DB::getDriverName() !== 'sqlite') {
        $this->markTestSkipped('SQLite guard test.');
    }
    $this->artisan('audit:resource-schema --require-mysql')->assertFailed();
});

test('resource schema preflight rejects duplicate migration history without deleting it', function (): void {
    $row = (array) DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->first();
    unset($row['id']);
    DB::table('migrations')->insert($row);
    expect(app(ServiceResourceSchemaPreflight::class)->inspect()['findings'])->toContain('duplicate_migration_history');
    $this->artisan('audit:resource-schema')->assertFailed();
    expect(DB::table('migrations')->where('migration', ServiceResourceSchemaPreflight::MIGRATION)->count())->toBe(2);
});

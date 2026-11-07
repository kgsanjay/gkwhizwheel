<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Read-only preflight for staging: never alters bookings, rates, vehicles,
 * payment records or migration history. Does not print PII or payment refs.
 */
final class AuditLegacyServiceData extends Command
{
    protected $signature = 'audit:legacy-services {--strict : Return nonzero if any historical-data integrity issue is found}';
    protected $description = 'Read-only service/booking/branch data audit for seven-service migration compatibility';

    public function handle(): int
    {
        $warnings = 0;
        $errors = 0;

        $this->info('READ-ONLY audit. No migrations, imports or record updates will be performed.');
        $required = [
            'stores', 'users', 'service_items', 'service_bookings',
            'bikes', 'bookings', 'pricing_rules',
        ];

        foreach ($required as $table) {
            if (! Schema::hasTable($table)) {
                $this->error("Missing legacy table: {$table}");
                ++$errors;
                continue;
            }
            $this->line("{$table}: ".DB::table($table)->count().' rows');
        }

        if ($errors > 0) {
            $this->error("Audit stopped: {$errors} required table(s) missing.");
            return self::FAILURE;
        }

        foreach (['service_enquiries', 'service_resources', 'service_resource_allocations', 'service_quote_snapshots', 'pickup_points'] as $table) {
            if (Schema::hasTable($table)) {
                $this->line("Additive module {$table}: ".DB::table($table)->count().' rows');
            } else {
                $this->warn("Additive module {$table}: migration NOT YET APPLIED");
                ++$warnings;
            }
        }

        $findings = [
            'service bookings with missing service item' => DB::table('service_bookings as b')
                ->leftJoin('service_items as i', 'i.id', '=', 'b.service_item_id')
                ->whereNotNull('b.service_item_id')
                ->whereNull('i.id')->count(),
            'service bookings with wrong service item type' => DB::table('service_bookings as b')
                ->join('service_items as i', 'i.id', '=', 'b.service_item_id')
                ->whereColumn('b.service_type', '<>', 'i.service_type')->count(),
            'service bookings with missing branch' => DB::table('service_bookings as b')
                ->leftJoin('stores as s', 's.id', '=', 'b.store_id')
                ->whereNotNull('b.store_id')->whereNull('s.id')->count(),
            'service items with missing branch' => DB::table('service_items as i')
                ->leftJoin('stores as s', 's.id', '=', 'i.store_id')
                ->whereNotNull('i.store_id')->whereNull('s.id')->count(),
            'service bookings with invalid quantity' => DB::table('service_bookings')
                ->where('quantity', '<', 1)->count(),
            'service bookings with negative total' => DB::table('service_bookings')
                ->where('total_amount', '<', 0)->count(),
            'service bookings with negative advance' => DB::table('service_bookings')
                ->where('advance_paid', '<', 0)->count(),
            'service bookings with advance greater than total' => DB::table('service_bookings')
                ->whereColumn('advance_paid', '>', 'total_amount')->count(),
            'service bookings with negative balance' => DB::table('service_bookings')
                ->where('balance_due', '<', 0)->count(),
            'service bookings without item while confirmed/in progress' => DB::table('service_bookings')
                ->whereNull('service_item_id')->whereIn('status', ['confirmed', 'in_progress'])->count(),
            'service bookings with confirmed/in progress and zero total' => DB::table('service_bookings')
                ->whereIn('status', ['confirmed', 'in_progress'])->where('total_amount', '<=', 0)->count(),
            'duplicate bike registrations (exact value)' => DB::table('bikes')
                ->select('registration_number')->groupBy('registration_number')
                ->havingRaw('COUNT(*) > 1')->get()->count(),
        ];

        foreach ($findings as $description => $count) {
            if ($count > 0) {
                $this->warn("REVIEW: {$description}: {$count}");
                ++$warnings;
            } else {
                $this->line("OK: {$description}");
            }
        }

        // Known historic Honnavar station ID is retained; report exact status
        // without assuming the staging branch reconciliation has been applied.
        foreach (DB::table('stores')->select('id', 'city', 'status')->orderBy('id')->get() as $store) {
            $this->line("Branch record #{$store->id}: city={$store->city} status={$store->status}");
        }

        if (Schema::hasTable('service_resource_allocations')) {
            $count = DB::table('service_resource_allocations as a')
                ->leftJoin('service_resources as r', 'r.id', '=', 'a.service_resource_id')
                ->whereNull('r.id')->count();
            $this->reportFinding('orphaned service resource allocations', $count, $warnings);
        }

        if (Schema::hasTable('service_quote_snapshots')) {
            $count = DB::table('service_quote_snapshots as q')
                ->leftJoin('service_bookings as b', 'b.id', '=', 'q.service_booking_id')
                ->whereNotNull('q.service_booking_id')->whereNull('b.id')->count();
            $this->reportFinding('quote snapshots pointing to absent bookings', $count, $warnings);
        }

        $this->info("Audit finished. Findings to review: {$warnings}; required-table errors: {$errors}.");
        if ($this->option('strict') && $warnings > 0) {
            $this->error('Strict audit failed. Resolve or explicitly document findings before deployment.');
            return self::FAILURE;
        }
        return self::SUCCESS;
    }

    private function reportFinding(string $name, int $count, int &$warnings): void
    {
        if ($count > 0) {
            $this->warn("REVIEW: {$name}: {$count}");
            ++$warnings;
        } else {
            $this->line("OK: {$name}");
        }
    }
}

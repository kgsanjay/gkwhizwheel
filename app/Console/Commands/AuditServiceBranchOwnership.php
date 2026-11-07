<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AuditServiceBranchOwnership extends Command
{
    protected $signature = 'services:audit-branches
        {--strict : Return an error when any unassigned or inconsistent service records exist}
        {--sample=20 : Maximum number of affected record IDs displayed per category (0-100)}';

    protected $description = 'Read-only audit of service branch ownership prior to staging migration.';

    public function handle(): int
    {
        $sample = filter_var($this->option('sample'), FILTER_VALIDATE_INT);
        if ($sample === false || $sample < 0 || $sample > 100) {
            $this->error('Sample size must be an integer from 0 to 100.');
            return self::FAILURE;
        }

        $unassignedItems = ServiceItem::query()->whereNull('store_id');
        $unassignedBookings = ServiceBooking::query()->whereNull('store_id');
        $mismatched = ServiceBooking::query()
            ->join('service_items', 'service_bookings.service_item_id', '=', 'service_items.id')
            ->whereNotNull('service_bookings.store_id')
            ->whereNotNull('service_items.store_id')
            ->whereColumn('service_bookings.store_id', '<>', 'service_items.store_id');
        $missingItemBranch = ServiceBooking::query()
            ->join('service_items', 'service_bookings.service_item_id', '=', 'service_items.id')
            ->whereNotNull('service_bookings.store_id')
            ->whereNull('service_items.store_id');

        $results = [
            'Unassigned service items' => [clone $unassignedItems, 'service_items.id'],
            'Unassigned service bookings' => [clone $unassignedBookings, 'service_bookings.id'],
            'Conflicting item/booking branch' => [clone $mismatched, 'service_bookings.id'],
            'Assigned bookings with unassigned items' => [clone $missingItemBranch, 'service_bookings.id'],
        ];

        $this->info('Service branch ownership audit (READ ONLY)');
        $this->line('Service items total: '.ServiceItem::count());
        $this->line('Service bookings total: '.ServiceBooking::count());
        $issues = 0;

        foreach ($results as $label => [$query, $column]) {
            $count = (clone $query)->count();
            $issues += $count;
            if ($count === 0) {
                $this->line('PASS  '.$label.': 0');
                continue;
            }

            $this->warn('WARN  '.$label.': '.$count);
            if ($sample > 0) {
                $ids = (clone $query)->orderBy($column)->limit($sample)->pluck($column)->all();
                $this->line('  Record IDs: '.implode(', ', $ids));
            }
        }

        $this->newLine();
        $this->line('No changes made. Review record IDs, verify ownership and run services:assign-branch in dry-run mode first.');
        if ($issues > 0 && $this->option('strict')) {
            $this->error('Strict audit failed: unresolved branch ownership records remain.');
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}

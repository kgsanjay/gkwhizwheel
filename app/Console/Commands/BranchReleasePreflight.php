<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class BranchReleasePreflight extends Command
{
    protected $signature = 'app:branch-preflight
        {--sample=20 : Number of example record IDs shown by the read-only audits (0-100)}';

    protected $description = 'Read-only release gate for branch ownership, future bike pickups and relocation records.';

    public function handle(): int
    {
        $sample = filter_var($this->option('sample'), FILTER_VALIDATE_INT);
        if ($sample === false || $sample < 0 || $sample > 100) {
            $this->error('Sample size must be between 0 and 100.');

            return self::FAILURE;
        }

        $this->info('GK WhizWheel multi-branch release preflight (READ ONLY)');
        $this->line('No migrations, inventory transfers, or booking changes will be performed.');

        // Never query branch-scoped models when the branch migrations are absent.
        $required = [
            'service_items' => ['store_id'],
            'service_bookings' => ['store_id'],
            'bike_relocation_tasks' => [
                'bike_id', 'triggering_booking_id', 'affected_booking_id',
                'from_store_id', 'required_store_id', 'status',
            ],
        ];

        $missing = [];
        foreach ($required as $table => $columns) {
            if (! Schema::hasTable($table)) {
                $missing[] = 'Missing table: '.$table;

                continue;
            }
            foreach ($columns as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    $missing[] = 'Missing column: '.$table.'.'.$column;
                }
            }
        }

        if ($missing !== []) {
            foreach ($missing as $issue) {
                $this->error('FAIL  '.$issue);
            }
            $this->error('Required branch migrations are not present. Review migrate:status and the staging backup before proceeding.');

            return self::FAILURE;
        }
        $this->info('PASS  Branch ownership and relocation schema exists.');

        $this->newLine();
        $this->line('Checking service branch ownership...');
        $services = $this->call('services:audit-branches', [
            '--strict' => true,
            '--sample' => $sample,
        ]);

        $this->newLine();
        $this->line('Checking physical fleet location and pending relocation tasks...');
        $fleet = $this->call('fleet:audit-relocations', [
            '--strict' => true,
            '--sample' => $sample,
        ]);

        $this->newLine();
        if ($services !== self::SUCCESS || $fleet !== self::SUCCESS) {
            $this->error('FAIL  Multi-branch preflight: resolve the audit findings before staging acceptance.');

            return self::FAILURE;
        }

        $this->info('PASS  Multi-branch preflight audits passed.');
        $this->warn('This is not a deployment authorization or a substitute for payment, role and staging browser tests.');

        return self::SUCCESS;
    }
}

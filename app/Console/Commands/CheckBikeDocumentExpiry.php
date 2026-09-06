<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\DocumentComplianceService;
use Illuminate\Console\Command;

class CheckBikeDocumentExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bikes:check-document-expiry
                            {--alert-days= : Days before expiry to trigger alert}
                            {--grace-days= : Grace period in days after expiry before hard block}
                            {--no-block : Disable auto-blocking of expired bikes}
                            {--dry-run : Run check without mutating bike statuses or sending alerts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check bike documents for insurance and emission certificates nearing or past expiry, flag bikes per grace-period/hard-block settings, and alert admins via email and WhatsApp.';

    /**
     * Execute the console command.
     */
    public function handle(DocumentComplianceService $service): int
    {
        $options = [];

        if ($this->option('alert-days') !== null) {
            $options['alert_threshold_days'] = (int) $this->option('alert-days');
        }

        if ($this->option('grace-days') !== null) {
            $options['grace_period_days'] = (int) $this->option('grace-days');
        }

        if ($this->option('no-block')) {
            $options['hard_block_expired'] = false;
        }

        if ($this->option('dry-run')) {
            $options['dry_run'] = true;
        }

        $this->info('Starting bike document compliance check...');

        $result = $service->checkAndHandleExpiry($options);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Documents Audited', $result['total_checked']],
                ['Expired Certificates', $result['expired_count']],
                ['In Grace Period', $result['grace_period_count']],
                ['Hard Blocked (Set to Maintenance)', $result['hard_blocked_count']],
                ['Nearing Expiry Warnings', $result['nearing_count']],
                ['Admin Notifications Dispatched', $result['notifications_sent_count']],
            ]
        );

        $this->info("Compliance check completed. {$result['hard_blocked_count']} bike(s) blocked, {$result['notifications_sent_count']} notification(s) dispatched.");

        return Command::SUCCESS;
    }
}

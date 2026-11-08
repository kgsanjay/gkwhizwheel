<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ServiceResourceSchemaPreflight;
use Illuminate\Console\Command;

final class AuditServiceResourceSchema extends Command
{
    protected $signature = 'audit:resource-schema {--require-mysql : Refuse SQLite as release evidence} {--json : Emit aggregate structured evidence}';
    protected $description = 'Read-only resource foundation schema/history preflight; never repairs or records migrations';

    public function handle(ServiceResourceSchemaPreflight $preflight): int
    {
        try {
            $report = $preflight->inspect((bool) $this->option('require-mysql'));
        } catch (\Throwable) {
            // SQL errors may contain connection details. Fail closed without
            // printing raw exceptions, customer data or database credentials.
            $report = ['state' => 'blocked', 'findings' => ['inspection_failed'], 'writes_performed' => false];
        }
        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_THROW_ON_ERROR));
        } else {
            $this->info('READ-ONLY resource schema preflight: '.$report['state']);
            foreach ($report['findings'] as $finding) {
                $this->error($finding);
            }
            $this->line('No DDL, row updates, migration-history changes or automatic recovery performed.');
            $this->line('A passing result does not certify backup/restore, column types, all migrations or business acceptance.');
            if ($report['state'] === 'blocked') {
                $this->error('Stop blind migration retries. Follow the Issue #44 recovery runbook on an authorized disposable restore first.');
            }
        }
        return $report['state'] === 'blocked' ? self::FAILURE : self::SUCCESS;
    }
}

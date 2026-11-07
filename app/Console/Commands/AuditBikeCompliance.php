<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BikeStatus;
use App\Models\Bike;
use App\Services\BikeComplianceGate;
use Illuminate\Console\Command;

final class AuditBikeCompliance extends Command
{
    protected $signature = 'fleet:audit-compliance {--strict : Exit unsuccessfully if an AVAILABLE vehicle has a compliance issue}';
    protected $description = 'Read-only compliance metadata and maintenance preflight (no private document paths)';

    public function handle(BikeComplianceGate $gate): int
    {
        $unsafe = 0;
        $review = 0;
        $checked = 0;
        Bike::query()->with('documents')->orderBy('id')->chunkById(100, function ($bikes) use ($gate, &$unsafe, &$review, &$checked): void {
            foreach ($bikes as $bike) {
                ++$checked;
                $issues = $gate->problems($bike);
                if ($issues === []) {
                    continue;
                }
                ++$review;
                if ($bike->status === BikeStatus::AVAILABLE) {
                    ++$unsafe;
                }
                $this->warn("Vehicle #{$bike->id} [{$bike->status->value}]: ".implode('; ', $issues));
            }
        });
        $this->info("Checked {$checked} vehicles: {$review} need compliance review; {$unsafe} marked AVAILABLE despite missing/expired/overdue metadata.");
        $this->line('Audit is read-only; verified flag requires human inspection of private documents.');
        return $this->option('strict') && $unsafe > 0 ? self::FAILURE : self::SUCCESS;
    }
}

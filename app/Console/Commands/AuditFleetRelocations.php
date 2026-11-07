<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Bike;
use App\Models\BikeRelocationTask;
use App\Services\BikeLocationSchedule;
use Illuminate\Console\Command;

class AuditFleetRelocations extends Command
{
    protected $signature = 'fleet:audit-relocations
        {--strict : Return a failure when unresolved fleet conflicts or stale tasks exist}
        {--sample=20 : Maximum number of affected bike/task IDs displayed per category (0-100)}';

    protected $description = 'Read-only audit of future bike pickup locations and pending relocation task integrity.';

    public function handle(BikeLocationSchedule $schedule): int
    {
        $sample = filter_var($this->option('sample'), FILTER_VALIDATE_INT);
        if ($sample === false || $sample < 0 || $sample > 100) {
            $this->error('Sample size must be an integer between 0 and 100.');

            return self::FAILURE;
        }

        $this->info('Fleet relocation readiness audit (READ ONLY)');
        $counts = [
            'pickup_conflicts' => 0,
            'untracked_conflicts' => 0,
            'stale_open_tasks' => 0,
        ];
        $samples = ['pickup_conflicts' => [], 'untracked_conflicts' => [], 'stale_open_tasks' => []];

        // Scan the full fleet rather than only bikes with an existing task.
        // Chunking keeps the audit safe for larger live/staging databases.
        Bike::query()->orderBy('id')->chunkById(200, function ($bikes) use ($schedule, $sample, &$counts, &$samples): void {
            foreach ($bikes as $bike) {
                $affected = $schedule->firstUnfulfillableReservation($bike);
                if ($affected === null) {
                    continue;
                }
                $counts['pickup_conflicts']++;
                if (count($samples['pickup_conflicts']) < $sample) {
                    $samples['pickup_conflicts'][] = $bike->id;
                }

                $tracked = BikeRelocationTask::query()
                    ->where('bike_id', $bike->id)
                    ->where('affected_booking_id', $affected->id)
                    ->where('status', 'open')
                    ->exists();
                if (! $tracked) {
                    $counts['untracked_conflicts']++;
                    if (count($samples['untracked_conflicts']) < $sample) {
                        $samples['untracked_conflicts'][] = $bike->id;
                    }
                }
            }
        });

        BikeRelocationTask::query()->where('status', 'open')
            ->with(['bike', 'affectedBooking'])
            ->orderBy('id')
            ->chunkById(200, function ($tasks) use ($schedule, $sample, &$counts, &$samples): void {
                foreach ($tasks as $task) {
                    $affected = $task->affectedBooking;
                    $bike = $task->bike;
                    $stillRequired = $bike !== null
                        && $affected !== null
                        && (int) $affected->bike_id === (int) $bike->id
                        && in_array($affected->status, [
                            BookingStatus::CONFIRMED,
                            BookingStatus::HELD,
                            BookingStatus::PENDING_PAYMENT,
                        ], true)
                        && $affected->start_date->toDateString() >= now()->toDateString()
                        && $schedule->firstUnfulfillableReservation($bike)?->id === $affected->id;
                    if (! $stillRequired) {
                        $counts['stale_open_tasks']++;
                        if (count($samples['stale_open_tasks']) < $sample) {
                            $samples['stale_open_tasks'][] = $task->id;
                        }
                    }
                }
            });

        $labels = [
            'pickup_conflicts' => 'Bikes with an upcoming unfulfillable pickup',
            'untracked_conflicts' => 'Pickup conflicts without an open matching relocation task',
            'stale_open_tasks' => 'Open tasks whose recorded pickup conflict no longer applies',
        ];
        foreach ($labels as $key => $label) {
            $count = $counts[$key];
            $this->{$count === 0 ? 'line' : 'warn'}(($count === 0 ? 'PASS  ' : 'WARN  ').$label.': '.$count);
            if ($count > 0 && $samples[$key] !== []) {
                $this->line('  '.($key === 'stale_open_tasks' ? 'Task IDs' : 'Bike IDs').': '.implode(', ', $samples[$key]));
            }
        }

        $this->line('No records changed. Review and resolve location conflicts before staging acceptance.');
        if ($this->option('strict') && array_sum($counts) > 0) {
            $this->error('Strict fleet readiness audit failed.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}

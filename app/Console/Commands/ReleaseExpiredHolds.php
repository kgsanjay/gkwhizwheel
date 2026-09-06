<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AvailabilityService;
use Illuminate\Console\Command;

class ReleaseExpiredHolds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:release-expired-holds';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Release 'held' bookings past their held_until timestamp back to available by updating their status to 'expired'.";

    /**
     * Execute the console command.
     */
    public function handle(AvailabilityService $availabilityService): int
    {
        $released = $availabilityService->releaseExpiredHolds();

        $this->info("Released {$released} expired held booking(s).");

        return Command::SUCCESS;
    }
}

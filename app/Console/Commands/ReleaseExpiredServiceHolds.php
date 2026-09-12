<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ServiceAvailabilityService;
use Illuminate\Console\Command;

class ReleaseExpiredServiceHolds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'services:release-expired-holds';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Release 'held' service bookings past their held_until timestamp back to available by updating their status to 'expired'.";

    /**
     * Execute the console command.
     */
    public function handle(ServiceAvailabilityService $serviceAvailabilityService): int
    {
        $released = $serviceAvailabilityService->releaseExpiredServiceHolds();

        $this->info("Released {$released} expired held service booking(s).");

        return Command::SUCCESS;
    }
}

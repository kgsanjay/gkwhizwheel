<?php

declare(strict_types=1);

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bookings:release-expired-holds')->everyMinute();
Schedule::command('services:release-expired-holds')->everyMinute();
Schedule::command('bookings:send-reminders')->hourly();
Schedule::command('bikes:check-document-expiry')->dailyAt('06:00');
Schedule::command('backup:clean')->dailyAt('01:00');
Schedule::command('backup:run --only-db')->dailyAt('01:30');

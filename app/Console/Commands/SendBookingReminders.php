<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\NotificationLog;
use App\Notifications\PickupReminderNotification;
use App\Notifications\ReturnReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendBookingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send scheduled pickup reminders to confirmed bookings and return reminders to active rentals.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        // 1. Pickup Reminders: Confirmed bookings starting today or tomorrow
        $pickupBookings = Booking::with('user', 'pickupStore', 'bike')
            ->where('status', BookingStatus::CONFIRMED)
            ->whereBetween('start_date', [$today, $tomorrow])
            ->get();

        $pickupCount = 0;
        foreach ($pickupBookings as $booking) {
            if (! $booking->user) {
                continue;
            }

            $alreadySent = NotificationLog::where('booking_id', $booking->id)
                ->where('template', 'pickup_reminder')
                ->exists();

            if (! $alreadySent) {
                $booking->user->notify(new PickupReminderNotification($booking));
                $pickupCount++;
            }
        }

        // 2. Return Reminders: Handed over rentals ending today or tomorrow
        $returnBookings = Booking::with('user', 'returnStore', 'bike')
            ->where('status', BookingStatus::HANDED_OVER)
            ->whereBetween('end_date', [$today, $tomorrow])
            ->get();

        $returnCount = 0;
        foreach ($returnBookings as $booking) {
            if (! $booking->user) {
                continue;
            }

            $alreadySent = NotificationLog::where('booking_id', $booking->id)
                ->where('template', 'return_reminder')
                ->exists();

            if (! $alreadySent) {
                $booking->user->notify(new ReturnReminderNotification($booking));
                $returnCount++;
            }
        }

        $this->info("Sent {$pickupCount} pickup reminder(s) and {$returnCount} return reminder(s).");

        return Command::SUCCESS;
    }
}

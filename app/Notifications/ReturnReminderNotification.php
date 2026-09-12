<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\LogsNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReturnReminderNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Booking $booking
    ) {
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        $returnStore = $this->booking->returnStore;
        $storeName = $returnStore?->name ?? 'Return Store';
        $endDate = $this->booking->end_date ? \Carbon\Carbon::parse($this->booking->end_date)->toFormattedDateString() : '';

        return \App\Notifications\Messages\WhatsAppMessage::create('return_reminder')
            ->parameters([
                $notifiable->name ?? 'Customer',
                $this->booking->booking_reference,
                $endDate,
                $storeName,
            ])
            ->buttonUrl(url("/bookings/{$this->booking->id}"));
    }

    public function template(): string
    {
        return 'return_reminder';
    }

    public function bookingId(): ?int
    {
        return (int) $this->booking->id;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $returnStore = $this->booking->returnStore;
        $storeName = $returnStore?->name ?? 'Return Store';
        $storeAddress = $returnStore?->address_line ?? '';
        $endDate = $this->booking->end_date ? \Carbon\Carbon::parse($this->booking->end_date)->toFormattedDateString() : '';

        return (new MailMessage())
            ->subject("Return Reminder - Booking {$this->booking->booking_reference}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your rental period for booking {$this->booking->booking_reference} concludes on {$endDate}.")
            ->line("Drop-off Location: {$storeName} ({$storeAddress})")
            ->line('Please return the vehicle on time to avoid automatic late fees.')
            ->line('Our store team will inspect the vehicle condition, record return odometer reading, and initiate your deposit refund.')
            ->action('View Booking Details', url("/bookings/{$this->booking->id}"))
            ->line('Thank you for riding with GK WhizWheel!');
    }

    /**
     * Get the Expo Push representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toExpoPush(object $notifiable): array
    {
        $storeName = $this->booking->returnStore?->name ?? 'Honnavar Station Hub';
        $endDate = $this->booking->end_date ? \Carbon\Carbon::parse($this->booking->end_date)->format('h:i A') : 'scheduled time';

        return [
            'title' => 'Return Reminder 🏁',
            'body' => "Reminder to return your bike to {$storeName} by {$endDate}. Please return with 2 helmets.",
            'data' => [
                'type' => 'return_reminder',
                'booking_id' => (int) $this->booking->id,
                'booking_reference' => $this->booking->booking_reference,
            ],
            'options' => [
                'sound' => 'default',
                'priority' => 'high',
                'badge' => 1,
            ],
        ];
    }
}

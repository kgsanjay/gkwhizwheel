<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\LogsNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LateFeeAlertNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Booking $booking,
        public readonly float $lateFeeAmount,
        public readonly int $hoursOverdue = 0
    ) {
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        $lateFeeFormatted = number_format($this->lateFeeAmount, 2);
        $returnStore = $this->booking->returnStore;
        $storeName = $returnStore?->name ?? 'Return Store';

        return \App\Notifications\Messages\WhatsAppMessage::create('late_fee_alert')
            ->parameters([
                $notifiable->name ?? 'Customer',
                $this->booking->booking_reference,
                '₹'.$lateFeeFormatted,
                (string) $this->hoursOverdue,
                $storeName,
            ])
            ->buttonUrl(url("/bookings/{$this->booking->id}"));
    }

    public function template(): string
    {
        return 'late_fee_alert';
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
        $lateFeeFormatted = number_format($this->lateFeeAmount, 2);
        $returnStore = $this->booking->returnStore;
        $storeName = $returnStore?->name ?? 'Return Store';
        $storePhone = $returnStore?->phone ?? '';

        $message = (new MailMessage())
            ->error()
            ->subject("Urgent: Overdue Return & Late Fee Alert - Booking {$this->booking->booking_reference}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your rental booking {$this->booking->booking_reference} is overdue and has not been returned.")
            ->line("Late Fee Incurred: ₹{$lateFeeFormatted}");

        if ($this->hoursOverdue > 0) {
            $message->line("Hours Overdue: {$this->hoursOverdue} hours");
        }

        return $message
            ->line("Return Location: {$storeName} (Contact: {$storePhone})")
            ->line('Please return the vehicle immediately or contact our store team to prevent additional penalty charges or legal escalation.')
            ->action('Contact Store / View Booking', url("/bookings/{$this->booking->id}"));
    }
}

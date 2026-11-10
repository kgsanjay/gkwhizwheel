<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ServiceBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Reservation cancellation notice, intentionally separate from refund settlement.
 */
final class ServiceBookingCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly ServiceBooking $booking)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Booking Cancelled - '.$this->booking->booking_number)
            ->greeting('Hello '.($notifiable->name ?? $this->booking->customer_name ?? 'Customer').',')
            ->line('Your service booking has been cancelled.')
            ->line('Booking Reference: '.$this->booking->booking_number)
            ->line('Service: '.ucwords(str_replace('_', ' ', $this->booking->service_type)))
            ->line('Booking Status: Cancelled')
            ->line('Recorded Payment: ₹'.number_format((float) $this->booking->advance_paid, 2))
            ->line('A cancellation does not mean a refund has been approved or completed.')
            ->line('Any eligible refund requires separate policy review and payment reconciliation.')
            ->action('View Booking', url('/services/booking/confirmation/'.$this->booking->booking_number));
    }
}

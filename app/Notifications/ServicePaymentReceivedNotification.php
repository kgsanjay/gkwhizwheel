<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ServiceBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Payment receipt only: never implies a new reservation approval. */
final class ServicePaymentReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ServiceBooking $booking,
        public readonly string $paymentId,
        public readonly int $amountPaise,
    ) {
    }

    public function template(): string
    {
        return 'service_payment_received';
    }

    // The receipt belongs to a service booking, never a bike rental booking.
    public function bookingId(): ?int
    {
        return null;
    }

    public function serviceBookingId(): ?int
    {
        return (int) $this->booking->id;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Payment Received - {$this->booking->booking_number}")
            ->greeting('Hello '.($notifiable->name ?? $this->booking->customer_name ?? 'Customer').',')
            ->line('We received your payment for booking '.$this->booking->booking_number.'.')
            ->line('Amount Received: ₹'.number_format($this->amountPaise / 100, 2))
            ->line('Payment Reference: '.$this->paymentId)
            ->line('Total Paid: ₹'.number_format((float) $this->booking->advance_paid, 2))
            ->line('Balance Due: ₹'.number_format((float) $this->booking->balance_due, 2))
            ->line('Reservation Status: '.ucwords(str_replace('_', ' ', $this->booking->status)))
            ->action('View Booking', url('/services/booking/confirmation/'.$this->booking->booking_number))
            ->line('This payment receipt does not change your reservation status.');
    }
}

<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Payment;
use App\Notifications\Concerns\LogsNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceiptNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Payment $payment,
        public readonly ?Booking $booking = null
    ) {
    }

    public function template(): string
    {
        return 'payment_receipt';
    }

    public function bookingId(): ?int
    {
        return $this->booking?->id ?? $this->payment->booking_id;
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        $amount = '₹'.number_format((float) $this->payment->amount, 2);
        $ref = $this->payment->gateway_reference ?: 'N/A';

        return \App\Notifications\Messages\WhatsAppMessage::create('payment_receipt')
            ->parameters([
                $notifiable->name ?? 'Customer',
                $amount,
                $ref,
                ucfirst($this->payment->type?->value ?? 'Advance'),
            ])
            ->buttonUrl(url('/bookings/'.($this->bookingId() ?? '')));
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $amountFormatted = number_format((float) $this->payment->amount, 2);
        $method = strtoupper($this->payment->method?->value ?? 'ONLINE');
        $type = ucfirst($this->payment->type?->value ?? 'Advance');
        $status = ucfirst($this->payment->status?->value ?? 'Success');
        $ref = $this->payment->gateway_reference ?: 'N/A';
        $bookingRef = $this->booking?->booking_reference ?? $this->payment->booking?->booking_reference;

        $mail = (new MailMessage())
            ->subject("Payment Receipt - ₹{$amountFormatted} ({$ref})")
            ->greeting("Hello {$notifiable->name},")
            ->line("We have received your payment of ₹{$amountFormatted}.")
            ->line("Transaction Reference: {$ref}")
            ->line("Payment Method: {$method}")
            ->line("Payment Category: {$type}")
            ->line("Status: {$status}");

        if ($bookingRef) {
            $mail->line("Associated Booking: {$bookingRef}");
        }

        $bookingId = $this->bookingId();
        if ($bookingId) {
            $mail->action('View Receipt & Booking', url("/bookings/{$bookingId}"));
        }

        return $mail->line('Please keep this receipt for your personal records.');
    }
}

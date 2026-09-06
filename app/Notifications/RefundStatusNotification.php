<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Refund;
use App\Notifications\Concerns\LogsNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RefundStatusNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Refund $refund,
        public readonly ?Booking $booking = null
    ) {
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        $amountFormatted = number_format((float) $this->refund->amount, 2);
        $status = ucfirst($this->refund->status?->value ?? 'Completed');
        $ref = $this->refund->gateway_reference ?: 'N/A';
        $bookingRef = $this->booking?->booking_reference ?? $this->refund->booking?->booking_reference ?? 'N/A';
        $bookingId = $this->bookingId();

        $message = \App\Notifications\Messages\WhatsAppMessage::create('refund_status')
            ->parameters([
                $notifiable->name ?? 'Customer',
                '₹'.$amountFormatted,
                $status,
                $bookingRef,
                $ref,
            ]);

        if ($bookingId) {
            $message->buttonUrl(url("/bookings/{$bookingId}"));
        }

        return $message;
    }

    public function template(): string
    {
        return 'refund_status';
    }

    public function bookingId(): ?int
    {
        return $this->booking?->id ?? $this->refund->booking_id;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $amountFormatted = number_format((float) $this->refund->amount, 2);
        $status = ucfirst($this->refund->status?->value ?? 'Completed');
        $ref = $this->refund->gateway_reference ?: 'N/A';
        $reason = $this->refund->reason ?: 'Deposit / Cancellation Refund';
        $bookingRef = $this->booking?->booking_reference ?? $this->refund->booking?->booking_reference;

        $mail = (new MailMessage())
            ->subject("Refund Update - ₹{$amountFormatted} ({$status})")
            ->greeting("Hello {$notifiable->name},")
            ->line("A refund of ₹{$amountFormatted} has been processed.")
            ->line("Reason: {$reason}")
            ->line("Status: {$status}")
            ->line("Gateway Refund Reference: {$ref}");

        if ($bookingRef) {
            $mail->line("Booking Reference: {$bookingRef}");
        }

        $bookingId = $this->bookingId();
        if ($bookingId) {
            $mail->action('View Booking History', url("/bookings/{$bookingId}"));
        }

        return $mail->line('Depending on your bank/payment network, funds typically reflect in your account within 5–7 working days.');
    }
}

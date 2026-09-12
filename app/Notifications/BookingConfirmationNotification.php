<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\LogsNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingConfirmationNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Booking $booking
    ) {
    }

    public function template(): string
    {
        return 'booking_confirmation';
    }

    public function bookingId(): ?int
    {
        return (int) $this->booking->id;
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $pickupStore = $this->booking->pickupStore?->name ?? 'Pickup Store';
        $startDate = $this->booking->start_date ? \Carbon\Carbon::parse($this->booking->start_date)->toFormattedDateString() : '';

        return \App\Notifications\Messages\WhatsAppMessage::create('booking_confirmation')
            ->parameters([
                $notifiable->name ?? 'Customer',
                $this->booking->booking_reference,
                $bikeName,
                "{$pickupStore} ({$startDate})",
                '₹'.number_format((float) $this->booking->total_amount, 2),
            ])
            ->buttonUrl(url("/bookings/{$this->booking->id}"));
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $regNumber = $this->booking->bike?->registration_number ? " ({$this->booking->bike->registration_number})" : '';
        $pickupStore = $this->booking->pickupStore?->name ?? 'Pickup Store';
        $returnStore = $this->booking->returnStore?->name ?? 'Return Store';
        $startDate = $this->booking->start_date ? \Carbon\Carbon::parse($this->booking->start_date)->toFormattedDateString() : '';
        $endDate = $this->booking->end_date ? \Carbon\Carbon::parse($this->booking->end_date)->toFormattedDateString() : '';

        return (new MailMessage())
            ->subject("Booking Confirmed - {$this->booking->booking_reference}")
            ->greeting("Hello {$notifiable->name},")
            ->line('Your bike rental booking has been confirmed successfully!')
            ->line("Booking Reference: {$this->booking->booking_reference}")
            ->line("Vehicle: {$bikeName}{$regNumber}")
            ->line("Pickup Location: {$pickupStore} ({$startDate})")
            ->line("Return Location: {$returnStore} ({$endDate})")
            ->line('Total Charged (Advance + Deposit): ₹'.number_format((float) $this->booking->total_amount, 2))
            ->action('View Booking Details', url("/bookings/{$this->booking->id}"))
            ->line('Thank you for choosing GK WhizWheel! Please carry your valid Driving License at pickup time.');
    }

    /**
     * Get the Expo Push representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toExpoPush(object $notifiable): array
    {
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $pickupStore = $this->booking->pickupStore?->name ?? 'Honnavar Station Hub';

        return [
            'title' => 'Booking Confirmed! 🛵',
            'body' => "Reservation #{$this->booking->booking_reference} for {$bikeName} at {$pickupStore} is confirmed.",
            'data' => [
                'type' => 'booking_confirmation',
                'booking_id' => (int) $this->booking->id,
                'booking_reference' => $this->booking->booking_reference,
            ],
            'options' => [
                'sound' => 'default',
                'badge' => 1,
            ],
        ];
    }
}

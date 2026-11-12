<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\LogsNotification;
use App\Notifications\Messages\WhatsAppMessage;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BikeManagerBookingAlertNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Booking $booking
    ) {
    }

    public function template(): string
    {
        return 'bike_manager_booking_alert';
    }

    public function bookingId(): ?int
    {
        return (int) $this->booking->id;
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): WhatsAppMessage
    {
        $managerName = $notifiable->name ?? 'Manager';
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $customerInfo = trim(($this->booking->user?->name ?? 'Customer').' ('.($this->booking->user?->phone ?? 'No phone').')');
        $pickupStore = $this->booking->pickupStore?->name ?? 'Pickup Store';
        $adminUrl = url("/admin/bookings/{$this->booking->id}/edit");

        return WhatsAppMessage::create('bike_manager_booking_alert')
            ->parameters([
                $managerName,
                $this->booking->booking_reference,
                $bikeName,
                $customerInfo,
                $pickupStore,
                '₹'.number_format((float) $this->booking->total_amount, 2),
            ])
            ->buttonUrl($adminUrl);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $managerName = $notifiable->name ?? 'Manager';
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $customerInfo = trim(($this->booking->user?->name ?? 'Customer').' ('.($this->booking->user?->phone ?? 'No phone').')');
        $pickupStore = $this->booking->pickupStore?->name ?? 'Pickup Store';
        $startDate = $this->booking->start_date ? Carbon::parse($this->booking->start_date)->toFormattedDateString() : '';
        $adminUrl = url("/admin/bookings/{$this->booking->id}/edit");

        return (new MailMessage())
            ->subject("New Bike Booking Alert - {$this->booking->booking_reference} ({$bikeName})")
            ->greeting("Hello {$managerName},")
            ->line("A new bike rental reservation has been confirmed!")
            ->line("Booking Reference: {$this->booking->booking_reference}")
            ->line("Vehicle: {$bikeName}")
            ->line("Customer: {$customerInfo}")
            ->line("Pickup Location: {$pickupStore} ({$startDate})")
            ->line('Total Charged: ₹'.number_format((float) $this->booking->total_amount, 2))
            ->action('Open in Admin Console', $adminUrl)
            ->line('Please review fleet readiness and prepare the vehicle.');
    }
}


<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ServiceBooking;
use App\Notifications\Concerns\LogsNotification;
use App\Notifications\Messages\WhatsAppMessage;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ServiceManagerBookingAlertNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly ServiceBooking $serviceBooking
    ) {
    }

    public function template(): string
    {
        return 'service_manager_booking_alert';
    }

    public function serviceBookingId(): ?int
    {
        return (int) $this->serviceBooking->id;
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): WhatsAppMessage
    {
        $itemName = $this->serviceBooking->serviceItem?->name ?? ucfirst(str_replace('_', ' ', $this->serviceBooking->service_type));
        $managerName = $notifiable->name ?? 'Manager';
        $adminUrl = url("/admin/services/{$this->serviceBooking->service_type}/bookings/{$this->serviceBooking->id}");

        return WhatsAppMessage::create('service_manager_booking_alert')
            ->parameters([
                $managerName,
                $this->serviceBooking->booking_number,
                $itemName,
                "{$this->serviceBooking->customer_name} ({$this->serviceBooking->customer_phone})",
                '₹'.number_format((float) $this->serviceBooking->total_amount, 2),
                '₹'.number_format((float) $this->serviceBooking->advance_paid, 2),
            ])
            ->buttonUrl($adminUrl);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $itemName = $this->serviceBooking->serviceItem?->name ?? ucfirst(str_replace('_', ' ', $this->serviceBooking->service_type));
        $managerName = $notifiable->name ?? 'Manager';
        $adminUrl = url("/admin/services/{$this->serviceBooking->service_type}/bookings/{$this->serviceBooking->id}");
        $startDate = $this->serviceBooking->start_datetime ? Carbon::parse($this->serviceBooking->start_datetime)->toFormattedDateString() : '';

        return (new MailMessage())
            ->subject("New Service Booking Alert - {$this->serviceBooking->booking_number} ({$itemName})")
            ->greeting("Hello {$managerName},")
            ->line("A new online booking has been confirmed for {$itemName}!")
            ->line("Booking Reference: {$this->serviceBooking->booking_number}")
            ->line("Customer: {$this->serviceBooking->customer_name} ({$this->serviceBooking->customer_phone})")
            ->line("Scheduled For: {$startDate}")
            ->line("Pickup / Spot: {$this->serviceBooking->pickup_location}")
            ->line('Total: ₹'.number_format((float) $this->serviceBooking->total_amount, 2).' | Advance: ₹'.number_format((float) $this->serviceBooking->advance_paid, 2))
            ->line('Balance Due: ₹'.number_format((float) $this->serviceBooking->balance_due, 2))
            ->action('Open in Admin Console', $adminUrl)
            ->line('Please review inventory readiness and coordinate with the guest.');
    }
}

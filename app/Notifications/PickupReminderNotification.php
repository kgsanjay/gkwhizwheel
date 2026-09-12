<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Concerns\LogsNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PickupReminderNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public function __construct(
        public readonly Booking $booking
    ) {
    }

    public function template(): string
    {
        return 'pickup_reminder';
    }

    public function bookingId(): ?int
    {
        return (int) $this->booking->id;
    }

    /**
     * Get the WhatsApp representation of the notification.
     * Includes direct deep-link to bike documents (RC, Insurance, Emission Certificate)
     * per 01-REQUIREMENTS-AND-FEATURES.md Section 5.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        $pickupStore = $this->booking->pickupStore;
        $storeName = $pickupStore?->name ?? 'Pickup Store';
        $startDate = $this->booking->start_date ? \Carbon\Carbon::parse($this->booking->start_date)->toFormattedDateString() : '';
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $documentsUrl = url("/api/v1/bookings/{$this->booking->id}/documents");

        return \App\Notifications\Messages\WhatsAppMessage::create('pickup_reminder')
            ->parameters([
                $notifiable->name ?? 'Customer',
                $this->booking->booking_reference,
                $startDate,
                $storeName,
                $bikeName,
            ])
            ->documentUrl($documentsUrl)
            ->buttonUrl(url("/bookings/{$this->booking->id}"));
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $pickupStore = $this->booking->pickupStore;
        $storeName = $pickupStore?->name ?? 'Pickup Store';
        $storeAddress = $pickupStore?->address_line ?? '';
        $storePhone = $pickupStore?->phone ?? '';
        $startDate = $this->booking->start_date ? \Carbon\Carbon::parse($this->booking->start_date)->toFormattedDateString() : '';
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));

        return (new MailMessage())
            ->subject("Upcoming Pickup Reminder - Booking {$this->booking->booking_reference}")
            ->greeting("Hello {$notifiable->name},")
            ->line("This is a reminder that your rental begins on {$startDate}.")
            ->line("Pickup Location: {$storeName} ({$storeAddress})")
            ->line("Reserved Vehicle: {$bikeName}")
            ->line("Store Phone: {$storePhone}")
            ->line('Mandatory Documents: Please bring your original Government ID and valid Driving License.')
            ->action('View Pickup Details', url("/bookings/{$this->booking->id}"))
            ->line('Our store executive will walk you through the bike condition inspection and digital handover agreement.');
    }

    /**
     * Get the Expo Push representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toExpoPush(object $notifiable): array
    {
        $bikeName = trim(($this->booking->bike?->brand ?? '').' '.($this->booking->bike?->model_name ?? 'Bike'));
        $storeName = $this->booking->pickupStore?->name ?? 'Honnavar Station Hub';

        return [
            'title' => 'Pickup Reminder (2 Hours) ⏰',
            'body' => "Your {$bikeName} is ready at {$storeName}. Please carry your original Driving License.",
            'data' => [
                'type' => 'pickup_reminder',
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

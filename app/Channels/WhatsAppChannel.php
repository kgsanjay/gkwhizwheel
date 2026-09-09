<?php

declare(strict_types=1);

namespace App\Channels;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Models\NotificationLog;
use App\Services\WhatsAppService;
use Illuminate\Notifications\Notification;

class WhatsAppChannel
{
    public function __construct(
        protected WhatsAppService $whatsAppService
    ) {
    }

    /**
     * Send the given notification via Meta WhatsApp Cloud API.
     *
     * @return array<string, mixed>|null
     */
    public function send(object $notifiable, Notification $notification): ?array
    {
        if (! method_exists($notification, 'toWhatsApp')) {
            return null;
        }

        $phone = $notifiable->routeNotificationFor('whatsapp', $notification)
            ?? $notifiable->phone
            ?? null;

        if (! $phone) {
            $this->logFailure($notifiable, $notification, 'Recipient has no phone number configured.');

            return null;
        }

        $message = $notification->toWhatsApp($notifiable);

        try {
            $result = $this->whatsAppService->sendMessage((string) $phone, $message, $notification);

            NotificationLog::create([
                'user_id' => $notifiable->id ?? null,
                'booking_id' => method_exists($notification, 'bookingId') ? $notification->bookingId() : null,
                'service_booking_id' => method_exists($notification, 'serviceBookingId') ? $notification->serviceBookingId() : null,
                'channel' => NotificationChannel::WHATSAPP,
                'template' => method_exists($notification, 'template') ? $notification->template() : 'whatsapp_template',
                'status' => NotificationStatus::SENT,
                'error_message' => null,
                'sent_at' => now(),
            ]);

            return $result;
        } catch (\Throwable $e) {
            $this->logFailure($notifiable, $notification, $e->getMessage());

            return null;
        }
    }

    protected function logFailure(object $notifiable, Notification $notification, string $errorMessage): void
    {
        NotificationLog::create([
            'user_id' => $notifiable->id ?? null,
            'booking_id' => method_exists($notification, 'bookingId') ? $notification->bookingId() : null,
            'service_booking_id' => method_exists($notification, 'serviceBookingId') ? $notification->serviceBookingId() : null,
            'channel' => NotificationChannel::WHATSAPP,
            'template' => method_exists($notification, 'template') ? $notification->template() : 'whatsapp_template',
            'status' => NotificationStatus::FAILED,
            'error_message' => $errorMessage,
            'sent_at' => now(),
        ]);
    }
}

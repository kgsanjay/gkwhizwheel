<?php

declare(strict_types=1);

namespace App\Channels;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Models\NotificationLog;
use App\Services\ExpoPushService;
use Illuminate\Notifications\Notification;

class ExpoPushChannel
{
    public function __construct(
        protected ExpoPushService $expoPushService
    ) {
    }

    /**
     * Send the given notification via Expo Push Notification Service.
     *
     * @return array<string, mixed>|null
     */
    public function send(object $notifiable, Notification $notification): ?array
    {
        if (! method_exists($notification, 'toExpoPush')) {
            return null;
        }

        $pushToken = (method_exists($notifiable, 'routeNotificationFor')
            ? $notifiable->routeNotificationFor('expo_push', $notification)
            : null) ?? ($notifiable->expo_push_token ?? null);

        if (! $pushToken) {
            return null;
        }

        $pushData = $notification->toExpoPush($notifiable);
        $title = $pushData['title'] ?? 'GK WhizWheels Update';
        $body = $pushData['body'] ?? '';
        $data = $pushData['data'] ?? [];
        $options = $pushData['options'] ?? [];

        try {
            $result = $this->expoPushService->sendNotification(
                (string) $pushToken,
                (string) $title,
                (string) $body,
                $data,
                $options
            );

            $status = ($result['status'] ?? 'error') === 'error'
                ? NotificationStatus::FAILED
                : NotificationStatus::SENT;

            NotificationLog::create([
                'user_id' => $notifiable->id ?? null,
                'booking_id' => method_exists($notification, 'bookingId') ? $notification->bookingId() : null,
                'service_booking_id' => method_exists($notification, 'serviceBookingId') ? $notification->serviceBookingId() : null,
                'channel' => NotificationChannel::EXPO_PUSH,
                'template' => method_exists($notification, 'template') ? $notification->template() : 'expo_push_template',
                'status' => $status,
                'error_message' => $status === NotificationStatus::FAILED ? ($result['message'] ?? 'Push failed') : null,
                'sent_at' => now(),
            ]);

            return $result;
        } catch (\Throwable $e) {
            NotificationLog::create([
                'user_id' => $notifiable->id ?? null,
                'booking_id' => method_exists($notification, 'bookingId') ? $notification->bookingId() : null,
                'service_booking_id' => method_exists($notification, 'serviceBookingId') ? $notification->serviceBookingId() : null,
                'channel' => NotificationChannel::EXPO_PUSH,
                'template' => method_exists($notification, 'template') ? $notification->template() : 'expo_push_template',
                'status' => NotificationStatus::FAILED,
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return null;
        }
    }
}

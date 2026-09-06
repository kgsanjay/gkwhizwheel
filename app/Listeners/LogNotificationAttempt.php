<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Models\NotificationLog;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Notifications\Events\NotificationSent;

class LogNotificationAttempt
{
    /**
     * Handle successful notification sends.
     */
    public function handleSent(NotificationSent $event): void
    {
        $this->log($event->notifiable, $event->notification, $event->channel, NotificationStatus::SENT);
    }

    /**
     * Handle failed notification sends.
     */
    public function handleFailed(NotificationFailed $event): void
    {
        $error = null;
        if (isset($event->data['exception']) && $event->data['exception'] instanceof \Throwable) {
            $error = $event->data['exception']->getMessage();
        } elseif (isset($event->data['error']) && is_string($event->data['error'])) {
            $error = $event->data['error'];
        }

        $this->log($event->notifiable, $event->notification, $event->channel, NotificationStatus::FAILED, $error);
    }

    protected function log(
        object $notifiable,
        object $notification,
        string $channel,
        NotificationStatus $status,
        ?string $errorMessage = null
    ): ?NotificationLog {
        $userId = isset($notifiable->id) ? (int) $notifiable->id : null;
        if (! $userId) {
            return null;
        }

        if ($channel === \App\Channels\WhatsAppChannel::class || $channel === 'whatsapp') {
            return null;
        }

        $mappedChannel = match ($channel) {
            'mail' => NotificationChannel::EMAIL,
            default => NotificationChannel::EMAIL,
        };

        $template = method_exists($notification, 'template')
            ? $notification->template()
            : strtolower((string) preg_replace('/(?<!^)[A-Z]/', '_$0', class_basename($notification)));

        $bookingId = method_exists($notification, 'bookingId')
            ? $notification->bookingId()
            : (isset($notification->booking->id) ? (int) $notification->booking->id : null);

        return NotificationLog::create([
            'user_id' => $userId,
            'booking_id' => $bookingId,
            'channel' => $mappedChannel,
            'template' => $template,
            'status' => $status,
            'error_message' => $errorMessage,
            'sent_at' => now(),
        ]);
    }
}

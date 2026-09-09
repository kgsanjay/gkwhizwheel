<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Models\NotificationLog;

trait LogsNotification
{
    abstract public function template(): string;

    /**
     * Get the notification's delivery channels.
     * Dispatches to WhatsApp alongside email, with automatic fallback to email-only
     * if WhatsApp delivery has failed in notification_logs or recipient has no phone.
     *
     * @return list<class-string|string>
     */
    public function via(object $notifiable): array
    {
        $phone = (method_exists($notifiable, 'routeNotificationFor') ? $notifiable->routeNotificationFor('whatsapp', $this) : null)
            ?? ($notifiable->phone ?? null);

        if (empty($phone)) {
            return ['mail'];
        }

        $userId = $notifiable->id ?? null;
        if ($userId) {
            $hasFailed = NotificationLog::where('user_id', $userId)
                ->where('channel', NotificationChannel::WHATSAPP)
                ->where('template', $this->template())
                ->where('status', NotificationStatus::FAILED)
                ->exists();

            if ($hasFailed) {
                return ['mail'];
            }
        }

        return [\App\Channels\WhatsAppChannel::class, 'mail'];
    }

    public function bookingId(): ?int
    {
        return property_exists($this, 'booking') && $this->booking !== null
            ? (int) $this->booking->id
            : null;
    }

    public function serviceBookingId(): ?int
    {
        return property_exists($this, 'serviceBooking') && $this->serviceBooking !== null
            ? (int) $this->serviceBooking->id
            : null;
    }

    /**
     * Helper to explicitly record a send attempt to notification_logs.
     */
    public function logSendAttempt(
        object $notifiable,
        NotificationChannel $channel = NotificationChannel::EMAIL,
        NotificationStatus $status = NotificationStatus::SENT,
        ?string $errorMessage = null
    ): NotificationLog {
        $userId = property_exists($notifiable, 'id') ? (int) $notifiable->id : null;

        return NotificationLog::create([
            'user_id' => $userId,
            'booking_id' => $this->bookingId(),
            'service_booking_id' => $this->serviceBookingId(),
            'channel' => $channel,
            'template' => $this->template(),
            'status' => $status,
            'error_message' => $errorMessage,
            'sent_at' => now(),
        ]);
    }
}

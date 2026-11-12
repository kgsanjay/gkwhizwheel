<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $otp
    ) {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['mail'];
        $phone = (method_exists($notifiable, 'routeNotificationFor') ? $notifiable->routeNotificationFor('whatsapp', $this) : null)
            ?? ($notifiable->phone ?? null);

        if (! empty($phone)) {
            $channels[] = \App\Channels\WhatsAppChannel::class;
        }

        return $channels;
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): \App\Notifications\Messages\WhatsAppMessage
    {
        return \App\Notifications\Messages\WhatsAppMessage::create('verification_otp')
            ->parameters([
                $this->otp,
            ]);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Your GK WhizWheel Verification Code')
            ->line('Your one-time password (OTP) for signing in is:')
            ->line($this->otp)
            ->line('This code is valid for 10 minutes. If you did not request this code, please ignore this email.');
    }
}

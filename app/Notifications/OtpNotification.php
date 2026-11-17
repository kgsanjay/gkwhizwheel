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
        $channels = [];

        $email = (method_exists($notifiable, 'routeNotificationFor') ? $notifiable->routeNotificationFor('mail', $this) : null)
            ?? ($notifiable->email ?? null);

        if (! empty($email) && filter_var((string) $email, FILTER_VALIDATE_EMAIL) && ! str_ends_with((string) $email, '@whizwheels.local')) {
            $channels[] = 'mail';
        }

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
            ->subject("Your GK WhizWheel Verification Code: {$this->otp}")
            ->line('Your one-time password (OTP) for your rental booking is:')
            ->line(new \Illuminate\Support\HtmlString("<div style='font-size: 28px; font-weight: 800; letter-spacing: 5px; color: #0D9488; padding: 12px 0;'>{$this->otp}</div>"))
            ->line('This code is valid for 10 minutes. If you did not request this code, please ignore this email.');
    }
}

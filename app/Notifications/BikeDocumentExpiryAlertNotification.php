<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Notifications\Concerns\LogsNotification;
use App\Notifications\Messages\WhatsAppMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BikeDocumentExpiryAlertNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    /**
     * @param  array<int, array<string, mixed>>  $expiredItems
     * @param  array<int, array<string, mixed>>  $nearingExpiryItems
     */
    public function __construct(
        public readonly array $expiredItems = [],
        public readonly array $nearingExpiryItems = []
    ) {
    }

    public function template(): string
    {
        return 'bike_document_expiry';
    }

    public function bookingId(): ?int
    {
        return null;
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): WhatsAppMessage
    {
        $expiredCount = count($this->expiredItems);
        $nearingCount = count($this->nearingExpiryItems);

        $affectedRegs = [];
        $blockedCount = 0;
        $graceCount = 0;

        foreach ($this->expiredItems as $item) {
            $reg = $item['bike']->registration_number ?? 'Unknown';
            $affectedRegs[] = $reg;
            if (($item['status'] ?? '') === 'hard_blocked') {
                $blockedCount++;
            } elseif (($item['status'] ?? '') === 'in_grace_period') {
                $graceCount++;
            }
        }

        foreach ($this->nearingExpiryItems as $item) {
            $reg = $item['bike']->registration_number ?? 'Unknown';
            if (! in_array($reg, $affectedRegs, true)) {
                $affectedRegs[] = $reg;
            }
        }

        $regSummary = ! empty($affectedRegs)
            ? implode(', ', array_slice($affectedRegs, 0, 3)).(count($affectedRegs) > 3 ? ' +more' : '')
            : 'None';

        $actionSummary = "{$blockedCount} blocked, {$graceCount} in grace period";

        return WhatsAppMessage::create('bike_document_expiry')
            ->parameters([
                $notifiable->name ?? 'Admin',
                (string) $expiredCount,
                (string) $nearingCount,
                $regSummary,
                $actionSummary,
            ])
            ->buttonUrl(url('/admin/bikes'));
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $expiredCount = count($this->expiredItems);
        $nearingCount = count($this->nearingExpiryItems);

        $mail = (new MailMessage())
            ->subject("[Compliance Alert] Bike Documents Expiry Report - {$expiredCount} Expired, {$nearingCount} Nearing Expiry")
            ->greeting("Hello {$notifiable->name},")
            ->line('The daily bike compliance audit detected certificates requiring attention:');

        if ($expiredCount > 0) {
            $mail->line("--- EXPIRED DOCUMENTS ({$expiredCount}) ---");
            foreach ($this->expiredItems as $item) {
                $bike = $item['bike'];
                $doc = $item['document'];
                $action = match ($item['status'] ?? '') {
                    'hard_blocked' => 'AUTO-BLOCKED (Switched to Maintenance)',
                    'in_grace_period' => "IN GRACE PERIOD ({$item['days_grace_left']} days left before hard block)",
                    default => 'EXPIRED (No status change)',
                };
                $docType = strtoupper((string) ($doc->document_type?->value ?? $doc->document_type));
                $expiryStr = $doc->expiry_date ? $doc->expiry_date->format('Y-m-d') : 'N/A';

                $mail->line("• Bike {$bike->registration_number} ({$bike->brand} {$bike->model_name}): {$docType} expired on {$expiryStr} ({$item['days_expired']}d ago) — [{$action}]");
            }
        }

        if ($nearingCount > 0) {
            $mail->line("--- NEARING EXPIRY ({$nearingCount}) ---");
            foreach ($this->nearingExpiryItems as $item) {
                $bike = $item['bike'];
                $doc = $item['document'];
                $docType = strtoupper((string) ($doc->document_type?->value ?? $doc->document_type));
                $expiryStr = $doc->expiry_date ? $doc->expiry_date->format('Y-m-d') : 'N/A';

                $mail->line("• Bike {$bike->registration_number} ({$bike->brand} {$bike->model_name}): {$docType} expires on {$expiryStr} ({$item['days_remaining']} days remaining)");
            }
        }

        return $mail
            ->action('View Bikes & Documents in Admin Panel', url('/admin/bikes'))
            ->line('Please renew and upload updated documents to maintain operational compliance.');
    }
}

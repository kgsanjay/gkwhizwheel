<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeDocument;
use App\Models\User;
use App\Notifications\BikeDocumentExpiryAlertNotification;
use Carbon\Carbon;

class DocumentComplianceService
{
    /**
     * Check bike documents for insurance and emission certificates nearing or past expiry,
     * apply configurable grace-period / hard-block behavior, and notify admins.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function checkAndHandleExpiry(array $options = []): array
    {
        $alertDays = (int) ($options['alert_threshold_days'] ?? config('compliance.document_expiry.alert_threshold_days', 15));
        $graceDays = (int) ($options['grace_period_days'] ?? config('compliance.document_expiry.grace_period_days', 7));
        $hardBlock = (bool) ($options['hard_block_expired'] ?? config('compliance.document_expiry.hard_block_expired', true));
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $notifyAdmins = (bool) ($options['notify_admins'] ?? true);

        $today = Carbon::today();

        $documents = BikeDocument::query()
            ->whereIn('document_type', [
                BikeDocumentType::INSURANCE,
                BikeDocumentType::EMISSION_CERTIFICATE,
            ])
            ->whereNotNull('expiry_date')
            ->with(['bike'])
            ->get();

        $expiredItems = [];
        $nearingExpiryItems = [];
        $blockedCount = 0;
        $graceCount = 0;

        foreach ($documents as $doc) {
            $bike = $doc->bike;
            if (! $bike) {
                continue;
            }

            $expiryDate = Carbon::parse($doc->expiry_date)->startOfDay();

            if ($expiryDate->lessThan($today)) {
                $daysExpired = (int) $today->diffInDays($expiryDate, true);

                if ($graceDays > 0 && $daysExpired <= $graceDays) {
                    // Within configurable grace period
                    $graceCount++;
                    $itemStatus = 'in_grace_period';
                    $daysGraceLeft = $graceDays - $daysExpired;
                } else {
                    // Past grace period: hard block if configured
                    $daysGraceLeft = 0;
                    if ($hardBlock && ! $dryRun) {
                        if ($bike->status === BikeStatus::AVAILABLE) {
                            $oldStatus = $bike->status;
                            $bike->update(['status' => BikeStatus::MAINTENANCE]);

                            ActivityLog::create([
                                'user_id' => null,
                                'store_id' => $bike->current_store_id,
                                'action' => 'bike_auto_blocked_document_expired',
                                'subject_type' => Bike::class,
                                'subject_id' => $bike->id,
                                'old_values' => ['status' => $oldStatus->value],
                                'new_values' => [
                                    'status' => BikeStatus::MAINTENANCE->value,
                                    'document_id' => $doc->id,
                                    'document_type' => $doc->document_type?->value ?? (string) $doc->document_type,
                                    'expiry_date' => $doc->expiry_date?->format('Y-m-d'),
                                    'reason' => 'Auto-blocked from bookings: document expired past grace period',
                                ],
                            ]);

                            $itemStatus = 'hard_blocked';
                            $blockedCount++;
                        } else {
                            $itemStatus = 'expired_unblocked';
                        }
                    } else {
                        $itemStatus = 'expired_unblocked';
                    }
                }

                $expiredItems[] = [
                    'bike' => $bike,
                    'document' => $doc,
                    'status' => $itemStatus,
                    'days_expired' => $daysExpired,
                    'days_grace_left' => $daysGraceLeft,
                ];
            } elseif ($expiryDate->lessThanOrEqualTo($today->copy()->addDays($alertDays))) {
                // Nearing expiry
                $daysRemaining = (int) $today->diffInDays($expiryDate, true);

                $nearingExpiryItems[] = [
                    'bike' => $bike,
                    'document' => $doc,
                    'days_remaining' => $daysRemaining,
                ];
            }
        }

        $notificationsSentCount = 0;

        if (! $dryRun && $notifyAdmins && (! empty($expiredItems) || ! empty($nearingExpiryItems))) {
            $admins = User::where('role', UserRole::SUPER_ADMIN)
                ->where('status', UserStatus::ACTIVE)
                ->get();

            if ($admins->isEmpty()) {
                $admins = User::whereIn('role', [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER])
                    ->where('status', UserStatus::ACTIVE)
                    ->get();
            }

            if ($admins->isEmpty()) {
                $fallbackAdmin = new User([
                    'name' => 'System Admin',
                    'email' => (string) config('compliance.document_expiry.admin_email', 'admin@gkwhizwheel.com'),
                    'phone' => (string) config('compliance.document_expiry.admin_phone', '9876543210'),
                    'role' => UserRole::SUPER_ADMIN,
                    'status' => UserStatus::ACTIVE,
                ]);
                $admins = collect([$fallbackAdmin]);
            }

            $notification = new BikeDocumentExpiryAlertNotification($expiredItems, $nearingExpiryItems);

            foreach ($admins as $admin) {
                $admin->notify($notification);
                $notificationsSentCount++;
            }
        }

        return [
            'total_checked' => $documents->count(),
            'expired_count' => count($expiredItems),
            'nearing_count' => count($nearingExpiryItems),
            'hard_blocked_count' => $blockedCount,
            'grace_period_count' => $graceCount,
            'expired_items' => $expiredItems,
            'nearing_items' => $nearingExpiryItems,
            'notifications_sent_count' => $notificationsSentCount,
        ];
    }
}

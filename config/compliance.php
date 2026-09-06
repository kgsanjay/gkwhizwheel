<?php

declare(strict_types=1);

return [
    'document_expiry' => [
        // Days before expiry to trigger a "nearing expiry" warning alert
        'alert_threshold_days' => (int) env('BIKE_DOC_EXPIRY_ALERT_DAYS', 15),

        // Grace period in days after actual expiry before hard block applies
        'grace_period_days' => (int) env('BIKE_DOC_EXPIRY_GRACE_DAYS', 7),

        // Whether to automatically set bike status to maintenance when past grace period
        'hard_block_expired' => (bool) env('BIKE_DOC_EXPIRY_HARD_BLOCK', true),

        // Fallback contact info for administrative notifications
        'admin_email' => env('ADMIN_ALERT_EMAIL', env('MAIL_FROM_ADDRESS', 'admin@gkwhizwheel.com')),
        'admin_phone' => env('ADMIN_ALERT_PHONE', '9876543210'),
    ],
];

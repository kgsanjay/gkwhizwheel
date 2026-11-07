<?php

declare(strict_types=1);

return [
    // Fixed booking advance; no security deposit on new web rentals.
    'web_advance_amount' => 100,
    'cancellation' => [
        'full_refund_hours' => (int) env('CANCELLATION_FULL_REFUND_HOURS', 24),
        'partial_refund_percentage' => (float) env('CANCELLATION_PARTIAL_REFUND_PERCENTAGE', 50.0),
    ],
];

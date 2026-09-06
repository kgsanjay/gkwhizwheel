<?php

declare(strict_types=1);

return [
    'cancellation' => [
        'full_refund_hours' => (int) env('CANCELLATION_FULL_REFUND_HOURS', 24),
        'partial_refund_percentage' => (float) env('CANCELLATION_PARTIAL_REFUND_PERCENTAGE', 50.0),
    ],
];

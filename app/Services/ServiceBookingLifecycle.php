<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceBooking;
use Illuminate\Validation\ValidationException;

final class ServiceBookingLifecycle
{
    /** States for actual capacity-backed service reservations, not initial enquiries. */
    private const NEXT = [
        'held' => ['confirmed', 'cancelled', 'expired'],
        'pending_payment' => ['confirmed', 'cancelled', 'expired'],
        'confirmed' => ['in_progress', 'cancelled'],
        'in_progress' => ['completed', 'cancelled'],
        'completed' => [],
        'cancelled' => [],
        'expired' => [],
    ];

    public function allowed(string $current): array
    {
        return self::NEXT[$current] ?? [];
    }

    public function assertTransition(ServiceBooking $booking, string $new): void
    {
        if ($booking->status === $new) {
            return; // Idempotent same-state updates.
        }
        if (! in_array($new, $this->allowed($booking->status), true)) {
            throw ValidationException::withMessages([
                'status' => "Cannot change a service booking from {$booking->status} to {$new}.",
            ]);
        }
        if ($new === 'confirmed') {
            if (! $booking->service_item_id || (float) $booking->total_amount <= 0) {
                throw ValidationException::withMessages([
                    'status' => 'Select verified inventory and establish an approved price before confirming.',
                ]);
            }
            if ($booking->status === 'held'
                && $booking->held_until !== null && $booking->held_until->isPast()) {
                throw ValidationException::withMessages([
                    'status' => 'The reservation hold expired. Check availability again before confirming.',
                ]);
            }
        }
    }

    public function assertCreation(array $params): void
    {
        $status = (string) ($params['status'] ?? '');
        if (! isset(self::NEXT[$status]) || in_array($status, ['completed', 'expired'], true)) {
            throw ValidationException::withMessages(['status' => 'Invalid initial service reservation state.']);
        }
        if (in_array($status, ['confirmed', 'in_progress'], true)
            && (empty($params['service_item_id']) || (float) ($params['total_amount'] ?? 0) <= 0)) {
            throw ValidationException::withMessages([
                'status' => 'Confirmed services require real inventory and an approved non-zero price.',
            ]);
        }
    }
}

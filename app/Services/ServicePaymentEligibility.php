<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceBooking;
use App\Models\ServiceQuoteSnapshot;

final class ServicePaymentEligibility
{
    public function issue(ServiceBooking $booking): ?string
    {
        if (! in_array($booking->status, ['confirmed', 'in_progress'], true)) {
            return 'This service request is not confirmed. Payment is unavailable.';
        }
        if ($booking->service_item_id === null || $booking->serviceItem === null
            || $booking->serviceItem->service_type !== $booking->service_type) {
            return 'The service inventory is not verified. Payment is unavailable.';
        }

        $totalPaise = (int) round((float) $booking->total_amount * 100);
        $paidPaise = (int) round((float) $booking->advance_paid * 100);
        $balancePaise = (int) round((float) $booking->balance_due * 100);
        if ($totalPaise <= 0 || $paidPaise < 0 || $balancePaise <= 0
            || $paidPaise + $balancePaise !== $totalPaise
            || $booking->payment_status === 'paid') {
            return 'Payment amounts need reconciliation or the booking is already settled.';
        }
        // Only online reservations are required to have a server-issued accepted
        // quote. Old staff/phone reservations must have separate admin review.
        if ($booking->booking_channel === 'online') {
            $quote = ServiceQuoteSnapshot::query()
                ->where('service_booking_id', $booking->id)->first();
            if ($quote === null
                || $quote->service_item_id !== $booking->service_item_id
                || $quote->user_id !== $booking->user_id
                || (int) round((float) $quote->total_amount * 100) !== $totalPaise) {
                return 'The approved online quote is missing or inconsistent.';
            }
        }
        return null;
    }

    public function amountAllowed(ServiceBooking $booking, int $amountPaise): bool
    {
        // Service-specific deposit/advance terms are not yet approved. Full
        // outstanding balance only until a formal rate/advance policy exists.
        return $amountPaise > 0
            && $amountPaise === (int) round((float) $booking->balance_due * 100);
    }
}

<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;

final class BikeBookingPayments
{
    /**
     * New web rental bookings have no refundable deposit. Leave historical
     * booking totals unchanged; gateways must charge only the chosen amount.
     */
    public static function waiveDeposit(array $quote): array
    {
        $deposit = (float) ($quote['deposit_amount'] ?? 0);
        $quote['deposit_amount'] = 0.0;
        $quote['total_amount'] = round(max(0, (float) $quote['total_amount'] - $deposit), 2);
        $quote['price_breakdown_json']['deposit_amount'] = 0.0;
        $quote['price_breakdown_json']['total_amount'] = $quote['total_amount'];
        $quote['price_breakdown_json']['deposit_waived'] = true;

        return $quote;
    }

    public static function amountFor(Booking $booking, string $option): float
    {
        $total = round((float) $booking->total_amount, 2);
        if ($option === 'advance') {
            if ((float) $booking->deposit_amount > 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'payment_option' => 'Advance-only checkout is available for deposit-free bookings.',
                ]);
            }
            if ($total <= 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'payment_option' => 'Advance checkout is not available for a zero-value booking.',
                ]);
            }
            return min($total, (float) config('booking.web_advance_amount', 100));
        }

        return $total;
    }

    public static function expectedGatewayAmount(Booking $booking): float
    {
        $breakdown = $booking->price_breakdown_json ?? [];

        return (float) ($breakdown['checkout_amount'] ?? $booking->total_amount);
    }

    public static function remainder(Booking $booking): float
    {
        $paid = (float) $booking->payments()->where('status', \App\Enums\PaymentStatus::SUCCESS)->sum('amount');

        return max(0, round((float) $booking->total_amount - $paid, 2));
    }
}

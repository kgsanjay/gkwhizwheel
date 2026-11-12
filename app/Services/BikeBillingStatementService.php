<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

/**
 * Customer-accessible statement of the booking and recorded payments.
 *
 * This is deliberately NOT a GST tax invoice. Invoice issuance will require
 * immutable invoice numbers, verified supplier details and tax jurisdiction.
 */
final class BikeBillingStatementService
{
    public function download(Booking $booking): Response
    {
        $booking->loadMissing(['bike', 'pickupStore', 'returnStore', 'user', 'payments']);
        $successfulPayments = $booking->payments
            ->filter(fn ($payment) => $payment->status === PaymentStatus::SUCCESS);
        $paid = round((float) $successfulPayments->sum('amount'), 2);
        $tax = ($booking->price_breakdown_json ?? [])['bike_gst'] ?? null;
        $billing = ($booking->price_breakdown_json ?? [])['checkout_billing'] ?? null;

        $pdf = Pdf::loadView('vouchers.bike_billing_statement', [
            'booking' => $booking,
            'billing' => $billing,
            'tax' => $tax,
            'payments' => $successfulPayments,
            'paid' => $paid,
            'balance' => max(0, round((float) $booking->total_amount - $paid, 2)),
        ])->setPaper('a4');

        return $pdf->download($booking->booking_reference.'_billing_statement.pdf');
    }
}

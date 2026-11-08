<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabRefundReview;
use App\Models\ServiceBooking;
use App\Models\ServicePaymentReceipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only cab finance reconciliation. No refund execution, adjustment,
 * stored entitlement, inferred cash payment or customer-facing settlement.
 */
final class AdminCabSettlementPreviewController extends Controller
{
    public function show(Request $request, int $bookingId): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $booking = ServiceBooking::whereKey($bookingId)->firstOrFail();
        $stores = $request->user()->getAuthorizedStoreIds();
        abort_unless($booking->service_type === 'taxi' && $booking->store_id !== null
            && ($stores === null || in_array((int) $booking->store_id, $stores, true)), 403);

        // Sum server-recorded receipts as integers to avoid float drift.
        // Receipt presence is not confirmation of an externally completed refund.
        $receipts = ServicePaymentReceipt::where('service_booking_id', $booking->id)
            ->get(['provider', 'payment_id', 'amount_paise']);
        $receiptTotal = $receipts->sum(fn (ServicePaymentReceipt $r): int => (int) $r->amount_paise);
        $advance = (int) round((float) $booking->advance_paid * 100);
        $total = (int) round((float) $booking->total_amount * 100);
        $balance = (int) round((float) $booking->balance_due * 100);
        $review = CabRefundReview::where('service_booking_id', $booking->id)->first();

        $issues = [];
        if ($receiptTotal !== $advance) {
            $issues[] = 'receipt_advance_mismatch';
        }
        if ($advance < 0 || $balance < 0 || $total < 0 || $advance + $balance !== $total) {
            $issues[] = 'booking_amounts_inconsistent';
        }
        if ($receiptTotal > $total) {
            $issues[] = 'receipt_total_exceeds_booking_total';
        }
        if ($receipts->isEmpty() && $advance > 0) {
            $issues[] = 'recorded_advance_without_gateway_receipt';
        }
        if ($booking->status === 'cancelled' && $receiptTotal > 0 && $review === null) {
            $issues[] = 'cancelled_paid_booking_requires_refund_review';
        }

        return response()->json(['data' => [
            'booking_id' => $booking->id,
            'booking_number' => $booking->booking_number,
            'booking_status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'booking_total_paise' => $total,
            'recorded_advance_paise' => $advance,
            'recorded_balance_paise' => $balance,
            'gateway_receipts_recorded_paise' => $receiptTotal,
            'gateway_receipt_count' => $receipts->count(),
            'refund_review_status' => $review?->status,
            'issues' => $issues,
            'requires_manual_reconciliation' => $issues !== [],
            'refund_eligible' => null,
            'refund_amount_paise' => null,
            'payout_status' => 'not_supported',
            'disclaimer' => 'Internal read-only ledger comparison. No refund approved, initiated, or paid.',
        ]]);
    }
}

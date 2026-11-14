<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabRefundReview;
use App\Models\ServiceBooking;
use App\Models\ServicePaymentReceipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminCabRefundReviewController extends Controller
{
    /**
     * Creates an internal review only. No refund authorization, refund amount,
     * gateway call, settlement adjustment or customer-facing payout promise.
     */
    public function store(Request $request, int $bookingId): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        abort_if($request->user()?->isManager(), 403, 'Managers cannot review cab refunds.');
        abort_unless($request->user()?->isSuperAdmin() || $request->user()?->isAdmin(), 403);
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000', 'not_regex:/^\\s*$/'],
        ]);
        $review = DB::transaction(function () use ($bookingId, $request, $data): CabRefundReview {
            $booking = ServiceBooking::whereKey($bookingId)->lockForUpdate()->firstOrFail();
            $stores = $request->user()->getAuthorizedStoreIds();
            abort_unless($booking->service_type === 'taxi'
                && $booking->store_id !== null
                && ($stores === null || in_array((int) $booking->store_id, $stores, true)), 403);

            if ($booking->status !== 'cancelled') {
                throw ValidationException::withMessages(['booking' => 'Only cancelled cab bookings may enter refund review.']);
            }
            // Bookings can have a legacy/manual advance that has not yet been
            // matched against independently verified gateway receipts.
            $receipts = (int) ServicePaymentReceipt::where('service_booking_id', $booking->id)
                ->sum('amount_paise');
            $advance = (int) round((float) $booking->advance_paid * 100);
            if ($receipts < 0 || $advance < 0) {
                throw ValidationException::withMessages(['payment' => 'Invalid payment ledger.']);
            }
            $existing = CabRefundReview::where('service_booking_id', $booking->id)
                ->lockForUpdate()->first();
            if ($existing !== null) {
                // Repeat requests are idempotent, and cannot silently alter
                // the original review evidence or authorize a second payout.
                return $existing;
            }

            return CabRefundReview::create([
                'service_booking_id' => $booking->id,
                'requested_by' => $request->user()->id,
                'verified_receipts_paise' => $receipts,
                'recorded_advance_paise' => $advance,
                'status' => 'requires_policy_review',
                'reason' => trim($data['reason']),
            ]);
        });
        return response()->json(['data' => [
            'id' => $review->id,
            'status' => $review->status,
            'verified_receipts_paise' => $review->verified_receipts_paise,
            'recorded_advance_paise' => $review->recorded_advance_paise,
            'reconciliation_required' => $review->verified_receipts_paise !== $review->recorded_advance_paise,
            'message' => 'Internal review only. No refund has been initiated or approved.',
        ]], 200);
    }
}

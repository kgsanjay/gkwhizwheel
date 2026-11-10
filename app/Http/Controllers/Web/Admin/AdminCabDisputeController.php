<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabDispute;
use App\Models\CabDisputeEvent;
use App\Models\ServiceBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminCabDisputeController extends Controller
{
    /**
     * Internal workflow state only: financial incidents cannot be closed
     * before a separately audited financial resolution system exists.
     */
    public function transition(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate([
            'status' => ['required', 'in:reviewing,closed_internal'],
            'review_notes' => ['required', 'string', 'min:10', 'max:2000', 'not_regex:/^\\s*$/'],
        ]);
        $event = DB::transaction(function () use ($request, $id, $data): CabDisputeEvent {
            $dispute = CabDispute::whereKey($id)->lockForUpdate()->firstOrFail();
            $stores = $request->user()->getAuthorizedStoreIds();
            abort_unless($dispute->store_id !== null
                && ($stores === null || in_array((int) $dispute->store_id, $stores, true)), 403);
            if (! (($dispute->status === 'open' && $data['status'] === 'reviewing')
                || ($dispute->status === 'reviewing' && $data['status'] === 'closed_internal'))) {
                throw ValidationException::withMessages(['status' => 'Invalid dispute review transition.']);
            }
            if ($data['status'] === 'closed_internal'
                && in_array($dispute->category, ['billing', 'refund'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Financial incidents require the future approved finance settlement process before closure.',
                ]);
            }
            $from = $dispute->status;
            $dispute->update(['status' => $data['status']]);
            return CabDisputeEvent::create([
                'cab_dispute_id' => $dispute->id,
                'actor_user_id' => $request->user()->id,
                'from_status' => $from,
                'to_status' => $data['status'],
                'review_notes' => trim($data['review_notes']),
                'occurred_at' => now(),
            ]);
        });
        return response()->json(['data' => [
            'id' => $event->cab_dispute_id, 'status' => $event->to_status,
            'message' => 'Internal review state updated; no payment or refund action occurred.',
        ]]);
    }

    /**
     * Incident record only. This endpoint cannot cancel bookings, alter
     * price, collect money, initiate a refund or close a dispute.
     */
    public function store(Request $request, int $bookingId): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate([
            'category' => ['required', 'in:billing,refund,service_quality,schedule,safety,other'],
            'description' => ['required', 'string', 'min:10', 'max:2000', 'not_regex:/^\\s*$/'],
        ]);
        $dispute = DB::transaction(function () use ($request, $bookingId, $data): CabDispute {
            $booking = ServiceBooking::whereKey($bookingId)->lockForUpdate()->firstOrFail();
            $stores = $request->user()->getAuthorizedStoreIds();
            abort_unless($booking->service_type === 'taxi'
                && $booking->store_id !== null
                && ($stores === null || in_array((int) $booking->store_id, $stores, true)), 403);

            return CabDispute::create([
                'service_booking_id' => $booking->id,
                'store_id' => $booking->store_id,
                'created_by' => $request->user()->id,
                'category' => $data['category'],
                'status' => 'open',
                'description' => trim($data['description']),
            ]);
        });
        return response()->json(['data' => [
            'id' => $dispute->id, 'status' => 'open',
            'message' => 'Internal incident logged. No financial action performed.',
        ]], 201);
    }
}

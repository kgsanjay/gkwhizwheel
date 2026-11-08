<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabDispatch;
use App\Models\CabRescheduleRequest;
use App\Models\ServiceBooking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminCabRescheduleController extends Controller
{
    /**
     * Record a proposal only. No booking, dispatch, allocation or price changes.
     */
    public function store(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate([
            'proposed_starts_at' => ['required', 'date', 'after:now'],
            'proposed_ends_at' => ['required', 'date', 'after:proposed_starts_at'],
            'reason' => ['required', 'string', 'min:5', 'max:1000', 'not_regex:/^\\s*$/'],
        ]);

        $proposal = DB::transaction(function () use ($request, $id, $data): CabRescheduleRequest {
            $dispatch = CabDispatch::whereKey($id)->lockForUpdate()->firstOrFail();
            $booking = ServiceBooking::whereKey($dispatch->service_booking_id)->lockForUpdate()->firstOrFail();
            $storeIds = $request->user()->getAuthorizedStoreIds();
            abort_unless($booking->service_type === 'taxi'
                && $booking->store_id !== null
                && ($storeIds === null || in_array((int) $booking->store_id, $storeIds, true)), 403);

            if ($dispatch->status !== 'assigned' || $booking->status !== 'confirmed'
                || ! $dispatch->starts_at->isFuture()) {
                throw ValidationException::withMessages([
                    'dispatch' => 'Only confirmed cab trips that have not started may request a schedule change.',
                ]);
            }
            if (CabRescheduleRequest::where('cab_dispatch_id', $dispatch->id)
                ->where('status', 'pending')->exists()) {
                throw ValidationException::withMessages([
                    'dispatch' => 'Resolve the existing reschedule request before submitting another.',
                ]);
            }

            $start = Carbon::parse($data['proposed_starts_at']);
            $end = Carbon::parse($data['proposed_ends_at']);
            if ($start->equalTo($dispatch->starts_at) && $end->equalTo($dispatch->ends_at)) {
                throw ValidationException::withMessages([
                    'proposed_starts_at' => 'Choose a different schedule.',
                ]);
            }

            return CabRescheduleRequest::create([
                'cab_dispatch_id' => $dispatch->id,
                'requested_by' => $request->user()->id,
                'original_starts_at' => $dispatch->starts_at,
                'original_ends_at' => $dispatch->ends_at,
                'proposed_starts_at' => $start,
                'proposed_ends_at' => $end,
                'status' => 'pending',
                'reason' => trim($data['reason']),
            ]);
        });

        return response()->json([
            'data' => [
                'id' => $proposal->id,
                'status' => 'pending',
                'message' => 'Schedule change requested. Existing reservation and price are unchanged.',
            ],
        ], 201);
    }
}

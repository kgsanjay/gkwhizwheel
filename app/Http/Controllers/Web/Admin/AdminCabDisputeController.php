<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabDispute;
use App\Models\ServiceBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class AdminCabDisputeController extends Controller
{
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

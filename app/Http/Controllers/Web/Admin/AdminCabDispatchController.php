<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabDispatch;
use App\Models\ServiceBooking;
use App\Services\CabDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminCabDispatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $query = CabDispatch::query()->orderByDesc('id');
        if (($stores = $request->user()->getAuthorizedStoreIds()) !== null) {
            $query->whereIn('store_id', $stores);
        }
        // Return only operational metadata. Do not leak raw licence, RC,
        // customer contact details or unrelated branch dispatches.
        return response()->json(['data' => $query->limit(100)->get([
            'id', 'service_booking_id', 'cab_vehicle_id', 'cab_driver_id',
            'store_id', 'starts_at', 'ends_at', 'status',
            'trip_started_at', 'trip_completed_at',
        ])]);
    }

    public function assign(Request $request, CabDispatchService $dispatch): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate([
            'service_booking_id' => ['required', 'integer', 'exists:service_bookings,id'],
            'cab_vehicle_id' => ['required', 'integer', 'exists:cab_vehicles,id'],
            'cab_driver_id' => ['required', 'integer', 'exists:cab_drivers,id'],
            'operations_notes' => ['nullable', 'string', 'max:1200'],
        ]);
        $created = $dispatch->assign(
            (int) $data['service_booking_id'], (int) $data['cab_vehicle_id'],
            (int) $data['cab_driver_id'], $request->user(),
            $data['operations_notes'] ?? null,
        );
        return response()->json(['data' => ['id' => $created->id, 'status' => $created->status]], 201);
    }

    public function start(Request $request, int $id, CabDispatchService $dispatch): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate(['start_odometer' => ['nullable', 'integer', 'between:0,99999999']]);
        $updated = $dispatch->start($id, $request->user(), $data['start_odometer'] ?? null);
        return response()->json(['data' => ['id' => $updated->id, 'status' => $updated->status]]);
    }

    public function complete(Request $request, int $id, CabDispatchService $dispatch): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate(['end_odometer' => ['nullable', 'integer', 'between:0,99999999']]);
        $updated = $dispatch->complete($id, $request->user(), $data['end_odometer'] ?? null);
        return response()->json(['data' => ['id' => $updated->id, 'status' => $updated->status]]);
    }

    public function cancel(Request $request, int $id, CabDispatchService $dispatch): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000', 'not_regex:/^\\s*$/']]);
        $updated = $dispatch->cancel($id, $request->user(), trim($data['reason']));
        return response()->json(['data' => ['id' => $updated->id, 'status' => $updated->status]]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceBooking;
use App\Services\ServiceBookingApproval;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminServiceApprovalController extends Controller
{
    public function approve(Request $request, int $id, ServiceBookingApproval $approval): JsonResponse
    {
        $booking = $approval->approve($id, $request->user(), $request->all());
        return response()->json(['success' => true, 'data' => ['id' => $booking->id, 'status' => $booking->status]]);
    }

    public function approveForService(Request $request, string $serviceType, int $id, ServiceBookingApproval $approval): JsonResponse
    {
        ServiceBooking::where('service_type', $serviceType)->findOrFail($id);
        return $this->approve($request, $id, $approval);
    }
}

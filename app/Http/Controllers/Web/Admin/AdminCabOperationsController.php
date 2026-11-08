<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\CabDispatch;
use App\Models\CabDriver;
use App\Models\CabRefundReview;
use App\Models\CabRescheduleRequest;
use App\Models\CabVehicle;
use App\Models\ServiceBooking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AdminCabOperationsController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $authorized = $request->user()->getAuthorizedStoreIds();
        $scope = static function ($query) use ($authorized) {
            return $authorized === null ? $query : $query->whereIn('store_id', $authorized);
        };

        $dispatches = $scope(CabDispatch::query())
            ->orderByDesc('id')->limit(100)
            ->get(['id', 'store_id', 'service_booking_id', 'cab_vehicle_id',
                'cab_driver_id', 'starts_at', 'ends_at', 'status'])
            ->map(fn (CabDispatch $d): array => [
                'id' => $d->id, 'store_id' => $d->store_id,
                'service_booking_id' => $d->service_booking_id,
                'cab_vehicle_id' => $d->cab_vehicle_id, 'cab_driver_id' => $d->cab_driver_id,
                'starts_at' => $d->starts_at?->toIso8601String(),
                'ends_at' => $d->ends_at?->toIso8601String(), 'status' => $d->status,
            ]);
        $proposals = CabRescheduleRequest::query()->whereHas('dispatch', function ($q) use ($authorized): void {
            if ($authorized !== null) $q->whereIn('store_id', $authorized);
        })->where('status', 'pending')->orderBy('id')->limit(100)->get()
            ->map(fn (CabRescheduleRequest $p): array => [
                'id' => $p->id, 'cab_dispatch_id' => $p->cab_dispatch_id,
                'proposed_starts_at' => $p->proposed_starts_at?->toIso8601String(),
                'proposed_ends_at' => $p->proposed_ends_at?->toIso8601String(),
                'status' => $p->status,
            ]);
        $reviews = CabRefundReview::query()->whereHas('booking', function ($q) use ($authorized): void {
            if ($authorized !== null) $q->whereIn('store_id', $authorized);
        })->orderByDesc('id')->limit(100)->get()
            ->map(fn (CabRefundReview $r): array => [
                'id' => $r->id, 'service_booking_id' => $r->service_booking_id,
                'status' => $r->status, 'reconciliation_required' =>
                    $r->verified_receipts_paise !== $r->recorded_advance_paise,
            ]);

        $bookings = $scope(ServiceBooking::query()->where('service_type', 'taxi'))
            ->where('status', 'confirmed')->orderBy('id')->limit(100)
            ->get(['id', 'booking_number', 'store_id', 'service_item_id', 'status', 'booking_channel']);
        $vehicles = $scope(CabVehicle::query())->orderBy('id')->get([
            'id', 'store_id', 'service_item_id', 'vehicle_class', 'status',
        ]);
        $drivers = $scope(CabDriver::query())->orderBy('id')->get([
            'id', 'store_id', 'service_item_id', 'name', 'status',
        ]);

        return Inertia::render('Admin/Cabs/Operations', [
            'dispatches' => $dispatches, 'reschedules' => $proposals,
            'refundReviews' => $reviews, 'bookings' => $bookings,
            'vehicles' => $vehicles, 'drivers' => $drivers,
        ]);
    }
}

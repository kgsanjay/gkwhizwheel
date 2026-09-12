<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Generate revenue report grouped by store, channel, or bike.
     */
    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'group_by' => ['nullable', 'string', 'in:store,channel,bike'],
        ]);

        $startDate = $request->filled('start_date')
            ? (string) $request->query('start_date')
            : now()->subDays(30)->toDateString();

        $endDate = $request->filled('end_date')
            ? (string) $request->query('end_date')
            : now()->toDateString();

        $groupBy = (string) $request->query('group_by', 'store');
        if (! in_array($groupBy, ['store', 'channel', 'bike'], true)) {
            $groupBy = 'store';
        }

        $baseQuery = Booking::query()
            ->whereNotIn('status', [BookingStatus::CANCELLED, BookingStatus::EXPIRED])
            ->whereDate('start_date', '>=', $startDate)
            ->whereDate('start_date', '<=', $endDate);

        $totalRevenue = (float) (clone $baseQuery)->sum('total_amount');
        $totalBookings = (int) (clone $baseQuery)->count();

        $items = match ($groupBy) {
            'channel' => (clone $baseQuery)
                ->select([
                    'channel',
                    DB::raw('COUNT(*) as booking_count'),
                    DB::raw('SUM(total_amount) as total_revenue'),
                    DB::raw('SUM(base_amount) as rental_revenue'),
                    DB::raw('SUM(deposit_amount) as deposit_revenue'),
                ])
                ->groupBy('channel')
                ->get()
                ->map(fn ($row) => [
                    'group_key' => $row->channel->value ?? (string) $row->channel,
                    'label' => ucfirst($row->channel->value ?? (string) $row->channel),
                    'booking_count' => (int) $row->booking_count,
                    'total_revenue' => (float) $row->total_revenue,
                    'rental_revenue' => (float) $row->rental_revenue,
                    'deposit_revenue' => (float) $row->deposit_revenue,
                ]),

            'bike' => (clone $baseQuery)
                ->with('bike')
                ->select([
                    'bike_id',
                    DB::raw('COUNT(*) as booking_count'),
                    DB::raw('SUM(total_amount) as total_revenue'),
                    DB::raw('SUM(base_amount) as rental_revenue'),
                    DB::raw('SUM(deposit_amount) as deposit_revenue'),
                ])
                ->groupBy('bike_id')
                ->get()
                ->map(fn ($row) => [
                    'group_key' => $row->bike_id,
                    'label' => $row->bike ? "{$row->bike->brand} {$row->bike->model_name} ({$row->bike->registration_number})" : "Bike #{$row->bike_id}",
                    'registration_number' => $row->bike?->registration_number,
                    'booking_count' => (int) $row->booking_count,
                    'total_revenue' => (float) $row->total_revenue,
                    'rental_revenue' => (float) $row->rental_revenue,
                    'deposit_revenue' => (float) $row->deposit_revenue,
                ]),

            default => (clone $baseQuery)
                ->with('pickupStore')
                ->select([
                    'pickup_store_id',
                    DB::raw('COUNT(*) as booking_count'),
                    DB::raw('SUM(total_amount) as total_revenue'),
                    DB::raw('SUM(base_amount) as rental_revenue'),
                    DB::raw('SUM(deposit_amount) as deposit_revenue'),
                ])
                ->groupBy('pickup_store_id')
                ->get()
                ->map(fn ($row) => [
                    'group_key' => $row->pickup_store_id,
                    'label' => $row->pickupStore?->name ?? "Store #{$row->pickup_store_id}",
                    'city' => $row->pickupStore?->city,
                    'booking_count' => (int) $row->booking_count,
                    'total_revenue' => (float) $row->total_revenue,
                    'rental_revenue' => (float) $row->rental_revenue,
                    'deposit_revenue' => (float) $row->deposit_revenue,
                ]),
        };

        return response()->json([
            'success' => true,
            'data' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy,
                'total_revenue' => $totalRevenue,
                'total_bookings' => $totalBookings,
                'items' => $items,
            ],
            'message' => 'Revenue report generated successfully.',
        ]);
    }

    /**
     * Generate fleet and per-bike utilization report.
     */
    public function utilization(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'category_id' => ['nullable', 'integer', 'exists:bike_categories,id'],
        ]);

        $startDate = $request->filled('start_date')
            ? (string) $request->query('start_date')
            : now()->subDays(30)->toDateString();

        $endDate = $request->filled('end_date')
            ? (string) $request->query('end_date')
            : now()->toDateString();

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();
        $totalDays = max(1, (int) $start->diffInDays($end) + 1);

        $bikeQuery = Bike::query()->with('currentStore');

        if ($request->filled('store_id')) {
            $bikeQuery->where('current_store_id', (int) $request->query('store_id'));
        }

        if ($request->filled('category_id')) {
            $bikeQuery->where('category_id', (int) $request->query('category_id'));
        }

        $bikes = $bikeQuery->get();
        $bikeDetails = [];
        $totalBookedDaysAcrossFleet = 0;

        foreach ($bikes as $bike) {
            $overlappingBookings = Booking::query()
                ->where('bike_id', $bike->id)
                ->whereNotIn('status', [BookingStatus::CANCELLED, BookingStatus::EXPIRED])
                ->whereDate('start_date', '<=', $endDate)
                ->whereDate('end_date', '>=', $startDate)
                ->get();

            $bikeBookedDays = 0;
            foreach ($overlappingBookings as $booking) {
                $bStart = Carbon::parse($booking->start_date)->startOfDay();
                $bEnd = Carbon::parse($booking->end_date)->startOfDay();

                $overlapStart = $bStart->greaterThan($start) ? $bStart : $start;
                $overlapEnd = $bEnd->lessThan($end) ? $bEnd : $end;

                if ($overlapStart->lessThanOrEqualTo($overlapEnd)) {
                    $bikeBookedDays += (int) ($overlapStart->diffInDays($overlapEnd) + 1);
                }
            }

            $bikeBookedDays = min((int) $totalDays, $bikeBookedDays);
            $totalBookedDaysAcrossFleet += $bikeBookedDays;
            $utilizationPct = round(($bikeBookedDays / $totalDays) * 100, 2);

            $bikeDetails[] = [
                'id' => $bike->id,
                'brand' => $bike->brand,
                'model_name' => $bike->model_name,
                'registration_number' => $bike->registration_number,
                'current_store' => $bike->currentStore?->name,
                'status' => $bike->status?->value ?? (string) $bike->status,
                'booked_days' => $bikeBookedDays,
                'total_days' => (int) $totalDays,
                'utilization_percentage' => $utilizationPct,
            ];
        }

        $fleetCapacityDays = count($bikes) * $totalDays;
        $overallUtilization = $fleetCapacityDays > 0
            ? round(($totalBookedDaysAcrossFleet / $fleetCapacityDays) * 100, 2)
            : 0.0;

        return response()->json([
            'success' => true,
            'data' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_days' => (int) $totalDays,
                'total_bikes' => count($bikes),
                'overall_utilization_percentage' => $overallUtilization,
                'bikes' => $bikeDetails,
            ],
            'message' => 'Utilization report generated successfully.',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Store;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportWebController extends Controller
{
    /**
     * Authorize that the current user is a super admin or store manager.
     */
    protected function authorizeReportAccess(Request $request): void
    {
        $user = $request->user();
        $isAuthorized = $user !== null && (
            $user->role === UserRole::SUPER_ADMIN
            || $user->role === UserRole::STORE_MANAGER
            || $user->hasRole('super_admin')
            || $user->hasRole('admin')
            || $user->hasRole('store_manager')
        );

        if (! $isAuthorized) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }

    /**
     * Display Revenue and Fleet Utilization report dashboards.
     */
    public function index(Request $request): Response
    {
        $this->authorizeReportAccess($request);

        $user = $request->user();
        $isSuperAdmin = $user->role === UserRole::SUPER_ADMIN;

        $storeId = $request->query('store_id') ? (int) $request->query('store_id') : null;
        if (! $isSuperAdmin && $storeId === null) {
            $storeId = $user->stores()->value('stores.id');
        }

        // Determine date range from timeframe parameter
        $timeframe = $request->query('timeframe', '30d');
        $now = Carbon::now();

        match ($timeframe) {
            '7d' => [
                $startDate = $now->copy()->subDays(6)->startOfDay(),
                $endDate = $now->copy()->endOfDay(),
            ],
            '90d' => [
                $startDate = $now->copy()->subDays(89)->startOfDay(),
                $endDate = $now->copy()->endOfDay(),
            ],
            'year' => [
                $startDate = $now->copy()->startOfYear(),
                $endDate = $now->copy()->endOfDay(),
            ],
            default => [ // 30d
                $startDate = $now->copy()->subDays(29)->startOfDay(),
                $endDate = $now->copy()->endOfDay(),
            ],
        };

        if ($customFrom = $request->query('from')) {
            $startDate = Carbon::parse($customFrom)->startOfDay();
        }
        if ($customTo = $request->query('to')) {
            $endDate = Carbon::parse($customTo)->endOfDay();
        }

        // ==========================================
        // 1. REVENUE ANALYTICS
        // ==========================================
        $paymentQuery = Payment::query()
            ->where('status', PaymentStatus::SUCCESS)
            ->whereBetween('created_at', [$startDate, $endDate]);

        $refundQuery = Refund::query()
            ->where('status', RefundStatus::COMPLETED)
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($storeId !== null) {
            $paymentQuery->whereHas('booking', function ($q) use ($storeId): void {
                $q->where('pickup_store_id', $storeId);
            });
            $refundQuery->whereHas('booking', function ($q) use ($storeId): void {
                $q->where('pickup_store_id', $storeId);
            });
        }

        $grossRevenue = (float) (clone $paymentQuery)->sum('amount');
        $totalRefunds = (float) (clone $refundQuery)->sum('amount');
        $netRevenue = max(0.0, round($grossRevenue - $totalRefunds, 2));

        // Advance rental vs deposit split
        $depositCollected = (float) (clone $paymentQuery)->where('type', 'deposit')->sum('amount');
        $rentalCollected = max(0.0, round($grossRevenue - $depositCollected, 2));

        // Daily revenue timeline
        $dailyRevenueMap = [];
        $period = CarbonPeriod::create($startDate->toDateString(), $endDate->toDateString());
        foreach ($period as $date) {
            $dailyRevenueMap[$date->format('Y-m-d')] = [
                'date' => $date->format('M d'),
                'raw_date' => $date->format('Y-m-d'),
                'revenue' => 0.0,
                'rentals' => 0.0,
                'refunds' => 0.0,
                'net' => 0.0,
            ];
        }

        $paymentsList = (clone $paymentQuery)->get(['created_at', 'amount', 'type']);
        foreach ($paymentsList as $payment) {
            $dayKey = $payment->created_at?->format('Y-m-d');
            if (isset($dailyRevenueMap[$dayKey])) {
                $dailyRevenueMap[$dayKey]['revenue'] += (float) $payment->amount;
                if ($payment->type === 'deposit') {
                    // deposit
                } else {
                    $dailyRevenueMap[$dayKey]['rentals'] += (float) $payment->amount;
                }
            }
        }

        $refundsList = (clone $refundQuery)->get(['created_at', 'amount']);
        foreach ($refundsList as $refund) {
            $dayKey = $refund->created_at?->format('Y-m-d');
            if (isset($dailyRevenueMap[$dayKey])) {
                $dailyRevenueMap[$dayKey]['refunds'] += (float) $refund->amount;
            }
        }

        foreach ($dailyRevenueMap as $k => $item) {
            $dailyRevenueMap[$k]['net'] = max(0.0, round($item['revenue'] - $item['refunds'], 2));
            $dailyRevenueMap[$k]['revenue'] = round($dailyRevenueMap[$k]['revenue'], 2);
            $dailyRevenueMap[$k]['rentals'] = round($dailyRevenueMap[$k]['rentals'], 2);
            $dailyRevenueMap[$k]['refunds'] = round($dailyRevenueMap[$k]['refunds'], 2);
        }
        $revenueTimeline = array_values($dailyRevenueMap);

        // Revenue by Bike Category
        $categoryRevenue = BikeCategory::query()->get()->map(function (BikeCategory $cat) use ($startDate, $endDate, $storeId): array {
            $catBookings = Booking::query()
                ->whereHas('bike', function ($bq) use ($cat): void {
                    $bq->where('category_id', $cat->id);
                })
                ->whereBetween('created_at', [$startDate, $endDate]);

            if ($storeId !== null) {
                $catBookings->where('pickup_store_id', $storeId);
            }

            $rev = (float) $catBookings->sum('total_amount');
            $count = $catBookings->count();

            return [
                'category' => $cat->name,
                'revenue' => round($rev, 2),
                'bookings_count' => $count,
            ];
        })->filter(fn ($c) => $c['revenue'] > 0 || $c['bookings_count'] > 0)->values();

        // Revenue by Store Hub
        $storeRevenue = Store::query()->where('status', StoreStatus::ACTIVE)->get()->map(function (Store $store) use ($startDate, $endDate): array {
            $bookings = Booking::where('pickup_store_id', $store->id)
                ->whereBetween('created_at', [$startDate, $endDate]);

            return [
                'store' => $store->name,
                'city' => $store->city,
                'revenue' => round((float) $bookings->sum('total_amount'), 2),
                'bookings_count' => $bookings->count(),
            ];
        });

        // Booking Channel Split (Online vs Offline)
        $channelQuery = Booking::query()->whereBetween('created_at', [$startDate, $endDate]);
        if ($storeId !== null) {
            $channelQuery->where('pickup_store_id', $storeId);
        }

        $onlineRevenue = (float) (clone $channelQuery)->where('channel', BookingChannel::ONLINE)->sum('total_amount');
        $offlineRevenue = (float) (clone $channelQuery)->where('channel', BookingChannel::OFFLINE)->sum('total_amount');
        $channelBreakdown = [
            ['name' => 'Online Platform', 'value' => round($onlineRevenue, 2), 'color' => '#1976D2'],
            ['name' => 'Store Walk-in', 'value' => round($offlineRevenue, 2), 'color' => '#2E7D32'],
        ];

        // ==========================================
        // 2. FLEET UTILIZATION ANALYTICS
        // ==========================================
        $bikeQuery = Bike::query();
        if ($storeId !== null) {
            $bikeQuery->where('current_store_id', $storeId);
        }
        $totalBikesCount = (clone $bikeQuery)->count();
        $activeBikesCount = (clone $bikeQuery)->whereNotIn('status', [BikeStatus::MAINTENANCE, BikeStatus::RETIRED])->count();

        $totalDays = max(1, $startDate->diffInDays($endDate) + 1);
        $totalAvailableBikeDays = max(1, $activeBikesCount * $totalDays);

        // Calculate rented bike days within period
        $activeBookingsQuery = Booking::query()
            ->whereIn('status', [BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER, BookingStatus::RETURNED, BookingStatus::COMPLETED])
            ->where(function ($q) use ($startDate, $endDate): void {
                $q->whereBetween('start_date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->orWhereBetween('end_date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->orWhere(function ($sub) use ($startDate, $endDate): void {
                        $sub->where('start_date', '<=', $startDate->toDateString())
                            ->where('end_date', '>=', $endDate->toDateString());
                    });
            });

        if ($storeId !== null) {
            $activeBookingsQuery->where('pickup_store_id', $storeId);
        }

        $activeBookings = $activeBookingsQuery->get(['id', 'bike_id', 'start_date', 'end_date', 'status', 'total_amount']);

        $totalRentedDays = 0;
        $dailyUtilizationMap = [];
        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $dailyUtilizationMap[$dateStr] = [
                'date' => $date->format('M d'),
                'rented_bikes' => 0,
                'utilization_rate' => 0.0,
            ];
        }

        foreach ($activeBookings as $booking) {
            $bStart = Carbon::parse($booking->start_date)->startOfDay();
            $bEnd = Carbon::parse($booking->end_date)->startOfDay();

            $overlapStart = $bStart->greaterThan($startDate) ? $bStart : $startDate;
            $overlapEnd = $bEnd->lessThan($endDate) ? $bEnd : $endDate;

            if ($overlapStart->lessThanOrEqualTo($overlapEnd)) {
                $overlapDays = $overlapStart->diffInDays($overlapEnd) + 1;
                $totalRentedDays += $overlapDays;

                $bookingPeriod = CarbonPeriod::create($overlapStart->toDateString(), $overlapEnd->toDateString());
                foreach ($bookingPeriod as $d) {
                    $dStr = $d->format('Y-m-d');
                    if (isset($dailyUtilizationMap[$dStr])) {
                        $dailyUtilizationMap[$dStr]['rented_bikes']++;
                    }
                }
            }
        }

        foreach ($dailyUtilizationMap as $dStr => $val) {
            $rate = $activeBikesCount > 0
                ? round(($val['rented_bikes'] / $activeBikesCount) * 100, 1)
                : 0.0;
            $dailyUtilizationMap[$dStr]['utilization_rate'] = min(100.0, $rate);
        }
        $utilizationTimeline = array_values($dailyUtilizationMap);

        $avgUtilizationRate = $totalAvailableBikeDays > 0
            ? round(($totalRentedDays / $totalAvailableBikeDays) * 100, 1)
            : 0.0;
        $avgUtilizationRate = min(100.0, $avgUtilizationRate);

        // Top Performing Bikes
        $topBikes = Bike::with(['category', 'currentStore'])
            ->when($storeId !== null, fn ($q) => $q->where('current_store_id', $storeId))
            ->get()
            ->map(function (Bike $bike) use ($startDate, $endDate, $totalDays): array {
                $bikeBookings = Booking::where('bike_id', $bike->id)
                    ->whereIn('status', [BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER, BookingStatus::RETURNED, BookingStatus::COMPLETED])
                    ->where(function ($q) use ($startDate, $endDate): void {
                        $q->whereBetween('start_date', [$startDate->toDateString(), $endDate->toDateString()])
                            ->orWhereBetween('end_date', [$startDate->toDateString(), $endDate->toDateString()])
                            ->orWhere(function ($sub) use ($startDate, $endDate): void {
                                $sub->where('start_date', '<=', $startDate->toDateString())
                                    ->where('end_date', '>=', $endDate->toDateString());
                            });
                    })
                    ->get(['start_date', 'end_date', 'total_amount']);

                $bikeDays = 0;
                $revenue = 0.0;
                foreach ($bikeBookings as $bk) {
                    $s = Carbon::parse($bk->start_date);
                    $e = Carbon::parse($bk->end_date);
                    $os = $s->greaterThan($startDate) ? $s : $startDate;
                    $oe = $e->lessThan($endDate) ? $e : $endDate;
                    if ($os->lessThanOrEqualTo($oe)) {
                        $bikeDays += ($os->diffInDays($oe) + 1);
                    }
                    $revenue += (float) $bk->total_amount;
                }

                $utilizationRate = round(($bikeDays / $totalDays) * 100, 1);

                return [
                    'id' => $bike->id,
                    'model' => $bike->model_name ?? 'Bike',
                    'registration_number' => $bike->registration_number,
                    'category' => $bike->category?->name,
                    'store' => $bike->currentStore?->name,
                    'rental_days' => $bikeDays,
                    'revenue' => round($revenue, 2),
                    'utilization_rate' => min(100.0, $utilizationRate),
                    'status' => $bike->status instanceof BikeStatus ? $bike->status->value : (string) $bike->status,
                ];
            })
            ->sortByDesc('revenue')
            ->values()
            ->take(10);

        $allStores = Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get(['id', 'name', 'city']);

        return Inertia::render('Admin/Reports/Index', [
            'revenue_stats' => [
                'gross_revenue' => $grossRevenue,
                'net_revenue' => $netRevenue,
                'rental_collected' => $rentalCollected,
                'deposit_collected' => $depositCollected,
                'refunds_issued' => $totalRefunds,
                'timeline' => $revenueTimeline,
                'category_breakdown' => $categoryRevenue,
                'store_breakdown' => $storeRevenue,
                'channel_breakdown' => $channelBreakdown,
            ],
            'utilization_stats' => [
                'total_fleet' => $totalBikesCount,
                'active_fleet' => $activeBikesCount,
                'average_utilization' => $avgUtilizationRate,
                'total_rented_days' => $totalRentedDays,
                'timeline' => $utilizationTimeline,
                'top_bikes' => $topBikes,
            ],
            'stores' => $allStores,
            'filters' => [
                'timeframe' => $timeframe,
                'store_id' => $storeId,
                'from' => $startDate->toDateString(),
                'to' => $endDate->toDateString(),
            ],
        ]);
    }
}

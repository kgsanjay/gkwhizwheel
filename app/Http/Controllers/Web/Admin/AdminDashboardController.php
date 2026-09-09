<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\KycDocument;
use App\Models\Payment;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the main administrative dashboard tailored to the user's role.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === UserRole::SUPER_ADMIN;
        $isStoreManager = $user->role === UserRole::STORE_MANAGER;

        // Determine store context
        $stores = Store::where('status', \App\Enums\StoreStatus::ACTIVE)->get();
        $assignedStore = null;

        if (! $isSuperAdmin) {
            $assignedStore = $user->stores()->first() ?? $stores->first();
        }

        $storeId = $request->query('store_id')
            ? (int) $request->query('store_id')
            : ($assignedStore?->id);

        // Base queries
        $today = Carbon::today()->toDateString();
        $monthStart = Carbon::now()->startOfMonth();

        $bookingQuery = Booking::query();
        $bikeQuery = Bike::query();

        if ($storeId !== null && ! $isSuperAdmin) {
            $bookingQuery->where(function ($q) use ($storeId): void {
                $q->where('pickup_store_id', $storeId)
                    ->orWhere('return_store_id', $storeId);
            });
            $bikeQuery->where('current_store_id', $storeId);
        }

        // Operational counts
        $activeRentalsCount = (clone $bookingQuery)
            ->where('status', BookingStatus::HANDED_OVER)
            ->count();

        $pendingHandoversCount = (clone $bookingQuery)
            ->where('status', BookingStatus::CONFIRMED)
            ->whereDate('start_date', '<=', $today)
            ->count();

        $expectedReturnsCount = (clone $bookingQuery)
            ->where('status', BookingStatus::HANDED_OVER)
            ->whereDate('end_date', '<=', $today)
            ->count();

        $fleetTotalCount = (clone $bikeQuery)->count();
        $fleetAvailableCount = (clone $bikeQuery)
            ->where('status', BikeStatus::AVAILABLE)
            ->count();

        $unverifiedKycCount = KycDocument::where('verified', false)->count();

        // Revenue statistics (visible to Super Admin and Store Manager)
        $monthRevenue = 0.0;
        if ($isSuperAdmin || $isStoreManager) {
            $paymentQuery = Payment::where('status', PaymentStatus::SUCCESS)
                ->where('created_at', '>=', $monthStart);

            if ($storeId !== null && ! $isSuperAdmin) {
                $paymentQuery->whereHas('booking', function ($q) use ($storeId): void {
                    $q->where('pickup_store_id', $storeId);
                });
            }

            $monthRevenue = (float) $paymentQuery->sum('amount');
        }

        // Recent bookings table
        $recentBookings = (clone $bookingQuery)
            ->with(['bike', 'user', 'pickupStore', 'returnStore', 'payments'])
            ->latest()
            ->take(8)
            ->get();

        // Multi-Service Operational Metrics (Scoped by Manager's Assigned Services or All for Super Admin)
        $assignedServices = $user->assignedServicesList();
        $allServices = ['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'];
        $servicesScope = $isSuperAdmin ? $allServices : $assignedServices;

        $serviceMetrics = [];
        $serviceLabels = [
            'two_wheelers' => 'Two Wheelers',
            'taxi' => 'Cabs & Taxi',
            'boating' => 'Boating & Cruise',
            'scuba' => 'Scuba & Watersports',
            'homestay' => 'Stays & Homestays',
            'guide' => 'Tour Guides',
            'tours' => 'Tour Packages',
        ];

        if (! empty($servicesScope)) {
            foreach ($servicesScope as $st) {
                $serviceMetrics[$st] = [
                    'type' => $st,
                    'label' => $serviceLabels[$st] ?? ucfirst($st),
                    'items_count' => \App\Models\ServiceItem::where('service_type', $st)->count(),
                    'active_bookings' => \App\Models\ServiceBooking::where('service_type', $st)
                        ->whereIn('status', ['confirmed', 'in_progress'])
                        ->count(),
                    'pending_bookings' => \App\Models\ServiceBooking::where('service_type', $st)
                        ->where('status', 'pending')
                        ->count(),
                    'month_revenue' => (float) \App\Models\ServiceBooking::where('service_type', $st)
                        ->whereIn('payment_status', ['partial', 'paid'])
                        ->where('created_at', '>=', $monthStart)
                        ->sum('advance_paid'),
                ];
            }
        }

        $recentServiceBookings = [];
        if (! empty($servicesScope)) {
            $recentServiceBookings = \App\Models\ServiceBooking::with('serviceItem')
                ->whereIn('service_type', $servicesScope)
                ->latest()
                ->take(6)
                ->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'booking_number' => $b->booking_number,
                    'service_type' => $b->service_type,
                    'service_name' => $b->serviceItem?->name ?? ucfirst($b->service_type),
                    'customer_name' => $b->customer_name,
                    'customer_phone' => $b->customer_phone,
                    'start_datetime' => $b->start_datetime ? $b->start_datetime->format('d M Y, h:i A') : 'N/A',
                    'total_amount' => (float) $b->total_amount,
                    'advance_paid' => (float) $b->advance_paid,
                    'balance_due' => (float) $b->balance_due,
                    'payment_status' => $b->payment_status,
                    'status' => $b->status,
                    'booking_channel' => $b->booking_channel,
                ])->values()->all();
        }

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'active_rentals' => $activeRentalsCount,
                'pending_handovers' => $pendingHandoversCount,
                'expected_returns' => $expectedReturnsCount,
                'fleet_total' => $fleetTotalCount,
                'fleet_available' => $fleetAvailableCount,
                'unverified_kyc' => $unverifiedKycCount,
                'month_revenue' => $monthRevenue,
            ],
            'service_metrics' => array_values($serviceMetrics),
            'recent_service_bookings' => $recentServiceBookings,
            'assigned_services' => $servicesScope,
            'recent_bookings' => BookingResource::collection($recentBookings)->resolve(),
            'current_store' => $assignedStore ? [
                'id' => $assignedStore->id,
                'name' => $assignedStore->name,
                'city' => $assignedStore->city,
            ] : null,
            'stores' => $stores->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'city' => $s->city,
            ])->values()->all(),
        ]);
    }
}

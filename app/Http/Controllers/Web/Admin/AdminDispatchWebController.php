<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDispatchWebController extends Controller
{
    /**
     * Display the Visual Dispatch & Resource Schedule Board
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->role === UserRole::SUPER_ADMIN;

        // Stores context
        $stores = Store::where('status', \App\Enums\StoreStatus::ACTIVE)->get();
        $assignedStore = null;

        if (! $isSuperAdmin) {
            $assignedStore = $user->stores()->first() ?? $stores->first();
        }

        $storeId = $request->query('store_id')
            ? (int) $request->query('store_id')
            : ($assignedStore?->id);

        // View mode: 'timeline' (7-day Gantt resource lanes) or 'month' (calendar grid)
        $viewMode = $request->query('view_mode', 'timeline');
        $selectedService = $request->query('service_type', 'all');

        // Date boundaries
        $today = Carbon::today();

        if ($viewMode === 'month') {
            $month = (string) $request->query('month', $today->format('Y-m'));
            $startWindow = Carbon::parse($month . '-01')->startOfMonth();
            $endWindow = (clone $startWindow)->endOfMonth();
        } else {
            $startDateParam = $request->query('start_date');
            $startWindow = $startDateParam ? Carbon::parse($startDateParam)->startOfDay() : (clone $today);
            $endWindow = (clone $startWindow)->addDays(6)->endOfDay();
        }

        $startDateStr = $startWindow->toDateString();
        $endDateStr = $endWindow->toDateString();

        // Multi-service scope for this user
        $assignedServices = $user->assignedServicesList();
        $allServices = ['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'];
        $userAllowedServices = $isSuperAdmin ? $allServices : $assignedServices;

        // Resource lanes query
        $resources = [];

        // 1. Two-Wheeler Bikes (if allowed)
        if (in_array('two_wheelers', $userAllowedServices, true) && ($selectedService === 'all' || $selectedService === 'two_wheelers')) {
            $bikeQuery = Bike::with('currentStore');
            if ($storeId && ! $isSuperAdmin) {
                $bikeQuery->where('current_store_id', $storeId);
            }
            $bikes = $bikeQuery->get();

            foreach ($bikes as $bike) {
                $resources[] = [
                    'id' => 'bike_' . $bike->id,
                    'type' => 'two_wheelers',
                    'service_type' => 'two_wheelers',
                    'category_label' => 'Bike Fleet',
                    'name' => "{$bike->brand} {$bike->model_name}",
                    'identifier' => $bike->registration_number,
                    'status' => $bike->status instanceof BikeStatus ? $bike->status->value : (string) $bike->status,
                    'store_name' => $bike->currentStore?->name ?? 'Gokarna Hub',
                ];
            }
        }

        // 2. Travel Service Items (if allowed)
        $serviceTypesToQuery = array_intersect($userAllowedServices, ['taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours']);
        if ($selectedService !== 'all' && $selectedService !== 'two_wheelers') {
            $serviceTypesToQuery = array_intersect($serviceTypesToQuery, [$selectedService]);
        }

        if (! empty($serviceTypesToQuery)) {
            $serviceItems = ServiceItem::whereIn('service_type', $serviceTypesToQuery)
                ->where('status', '!=', 'inactive')
                ->orderBy('service_type')
                ->orderBy('name')
                ->get();

            $serviceCategoryLabels = [
                'taxi' => 'Cabs & Taxi',
                'boating' => 'Boating & Cruise',
                'scuba' => 'Scuba & Watersports',
                'homestay' => 'Stays & Homestays',
                'guide' => 'Tour Guides',
                'tours' => 'Tour Packages',
            ];

            foreach ($serviceItems as $item) {
                $resources[] = [
                    'id' => 'service_' . $item->id,
                    'type' => 'service',
                    'service_type' => $item->service_type,
                    'category_label' => $serviceCategoryLabels[$item->service_type] ?? ucfirst($item->service_type),
                    'name' => $item->name,
                    'identifier' => $item->category ?? $item->capacity ?? ucfirst($item->service_type),
                    'status' => $item->status,
                    'store_name' => 'All Hubs',
                ];
            }
        }

        // Events / Bookings Query across window
        $events = [];

        // 1. Two-Wheeler Bookings
        if (in_array('two_wheelers', $userAllowedServices, true) && ($selectedService === 'all' || $selectedService === 'two_wheelers')) {
            $bookingQuery = Booking::with(['bike', 'user', 'pickupStore', 'returnStore'])
                ->where('start_date', '<=', $endDateStr)
                ->where('end_date', '>=', $startDateStr)
                ->whereNotIn('status', [BookingStatus::CANCELLED, BookingStatus::EXPIRED]);

            if ($storeId && ! $isSuperAdmin) {
                $bookingQuery->where(function ($q) use ($storeId): void {
                    $q->where('pickup_store_id', $storeId)
                        ->orWhere('return_store_id', $storeId);
                });
            }

            $bookings = $bookingQuery->get();

            foreach ($bookings as $b) {
                $events[] = [
                    'id' => 'b_' . $b->id,
                    'booking_id' => $b->id,
                    'resource_id' => 'bike_' . $b->bike_id,
                    'service_type' => 'two_wheelers',
                    'reference' => $b->booking_reference,
                    'customer_name' => $b->user?->name ?? 'Guest Customer',
                    'customer_phone' => $b->user?->phone ?? '',
                    'start' => $b->start_date?->toDateString(),
                    'end' => $b->end_date?->toDateString(),
                    'status' => $b->status instanceof BookingStatus ? $b->status->value : (string) $b->status,
                    'total_amount' => (float) $b->total_amount,
                    'balance_due' => 0.0,
                    'channel' => $b->channel ?? 'online',
                    'location' => $b->pickupStore?->name ?? 'Gokarna Hub',
                    'details_url' => "/admin/bookings/{$b->id}/edit",
                ];
            }
        }

        // 2. Multi-Service Bookings
        if (! empty($serviceTypesToQuery)) {
            $serviceBookingQuery = ServiceBooking::with('serviceItem')
                ->whereIn('service_type', $serviceTypesToQuery)
                ->whereDate('start_datetime', '<=', $endDateStr)
                ->whereDate('end_datetime', '>=', $startDateStr)
                ->whereNotIn('status', ['cancelled']);

            $serviceBookings = $serviceBookingQuery->get();

            foreach ($serviceBookings as $sb) {
                $events[] = [
                    'id' => 'sb_' . $sb->id,
                    'booking_id' => $sb->id,
                    'resource_id' => $sb->service_item_id ? ('service_' . $sb->service_item_id) : null,
                    'service_type' => $sb->service_type,
                    'reference' => $sb->booking_number,
                    'customer_name' => $sb->customer_name,
                    'customer_phone' => $sb->customer_phone,
                    'start' => $sb->start_datetime?->format('Y-m-d H:i:s'),
                    'start_date' => $sb->start_datetime?->toDateString(),
                    'end' => $sb->end_datetime?->format('Y-m-d H:i:s'),
                    'end_date' => $sb->end_datetime?->toDateString(),
                    'status' => $sb->status,
                    'total_amount' => (float) $sb->total_amount,
                    'balance_due' => (float) $sb->balance_due,
                    'channel' => $sb->booking_channel,
                    'location' => $sb->pickup_location ?? 'Palya Main Rd Hub',
                    'details_url' => "/admin/services/{$sb->service_type}/bookings/{$sb->id}",
                ];
            }
        }

        // Quick statistics for the visible schedule window
        $stats = [
            'total_resources' => count($resources),
            'active_dispatches' => count(array_filter($events, fn ($e) => in_array($e['status'], ['handed_over', 'in_progress', 'confirmed'], true))),
            'pending_pickups_today' => count(array_filter($events, fn ($e) => ($e['start_date'] ?? $e['start']) === $today->toDateString() && in_array($e['status'], ['confirmed'], true))),
            'returns_today' => count(array_filter($events, fn ($e) => ($e['end_date'] ?? $e['end']) === $today->toDateString() && in_array($e['status'], ['handed_over', 'in_progress'], true))),
        ];

        return Inertia::render('Admin/Dispatch/Index', [
            'resources' => $resources,
            'events' => $events,
            'stats' => $stats,
            'current_window' => [
                'view_mode' => $viewMode,
                'start_date' => $startDateStr,
                'end_date' => $endDateStr,
                'month' => $startWindow->format('Y-m'),
            ],
            'filters' => [
                'service_type' => $selectedService,
                'store_id' => $storeId,
            ],
            'allowed_services' => $userAllowedServices,
            'stores' => $stores->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'city' => $s->city,
            ])->values()->all(),
            'current_store' => $assignedStore ? [
                'id' => $assignedStore->id,
                'name' => $assignedStore->name,
                'city' => $assignedStore->city,
            ] : null,
        ]);
    }
}

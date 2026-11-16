<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStoreRequest;
use App\Http\Requests\Admin\UpdateStoreRequest;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\BranchBikeModelPrice;
use App\Models\PricingRule;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminStoreWebController extends Controller
{
    /**
     * Display a listing of store hubs.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Store::class);

        $user = $request->user();
        $isSuperAdmin = $user?->isSuperAdmin() ?? false;
        $accessible = $user?->accessibleStoreIds() ?? [];

        $query = Store::query()->withCount(['staff', 'homeBikes', 'currentBikes']);
        if (! $isSuperAdmin) {
            $query->whereIn('id', $accessible);
        }

        if ($search = $request->query('search')) {
            $term = '%'.trim($search).'%';
            $query->where(function ($q) use ($term): void {
                $q->where('name', 'like', $term)
                    ->orWhere('city', 'like', $term)
                    ->orWhere('address_line', 'like', $term)
                    ->orWhere('state', 'like', $term);
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $stores = $query->orderBy('name')->get();

        $allStores = Store::query();
        if (! $isSuperAdmin) {
            $allStores->whereIn('id', $accessible);
        }
        $stats = [
            'total' => (clone $allStores)->count(),
            'active' => (clone $allStores)->where('status', StoreStatus::ACTIVE)->count(),
            'inactive' => (clone $allStores)->where('status', StoreStatus::INACTIVE)->count(),
            'total_bikes' => $isSuperAdmin ? Bike::count() : Bike::whereIn('current_store_id', $accessible)->count(),
        ];

        return Inertia::render('Admin/Stores/Index', [
            'stores' => $stores->map(fn (Store $store): array => [
                'id' => $store->id,
                'name' => $store->name,
                'address_line' => $store->address_line,
                'city' => $store->city,
                'state' => $store->state,
                'pincode' => $store->pincode,
                'latitude' => (float) $store->latitude,
                'longitude' => (float) $store->longitude,
                'phone' => $store->phone,
                'google_maps_url' => $store->google_maps_url,
                'status' => $store->status instanceof StoreStatus ? $store->status->value : (string) $store->status,
                'staff_count' => (int) $store->staff_count,
                'home_bikes_count' => (int) $store->home_bikes_count,
                'current_bikes_count' => (int) $store->current_bikes_count,
                'operating_hours' => $store->operating_hours,
                'operating_hours_label' => $store->operating_hours_label ?? 'Open 24/7',
                'services' => $store->services ?? (str_contains(strtolower((string) ($store->city ?: $store->name)), 'honnavar')
                    ? ['two_wheelers', 'taxi', 'homestay', 'boating', 'guide']
                    : ['two_wheelers', 'taxi', 'rooms', 'scuba', 'guide']),
                'created_at' => $store->created_at?->toIso8601String(),
            ]),
            'stats' => $stats,
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', ''),
            ],
            'cities' => Store::query()->distinct()->pluck('city')->filter()->values(),
        ]);
    }

    /**
     * Show the form for creating a new store hub.
     */
    public function create(): Response
    {
        Gate::authorize('create', Store::class);

        return Inertia::render('Admin/Stores/Create', [
            'statuses' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => ucfirst($case->value),
            ], StoreStatus::cases()),
            'cities' => Store::query()->distinct()->pluck('city')->filter()->values(),
        ]);
    }

    /**
     * Store a newly created store hub.
     */
    public function store(StoreStoreRequest $request): RedirectResponse
    {
        Gate::authorize('create', Store::class);

        $store = Store::create($request->validated());

        return redirect()->route('admin.stores.index')
            ->with('success', "Store Hub '{$store->name}' created successfully.");
    }

    /**
     * Show the form for editing the specified store hub.
     */
    public function edit(int $id): Response
    {
        $store = Store::withCount('staff')->findOrFail($id);
        Gate::authorize('update', $store);

        return Inertia::render('Admin/Stores/Edit', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'address_line' => $store->address_line,
                'city' => $store->city,
                'state' => $store->state,
                'pincode' => $store->pincode,
                'latitude' => (float) $store->latitude,
                'longitude' => (float) $store->longitude,
                'phone' => $store->phone,
                'google_maps_url' => $store->google_maps_url,
                'status' => $store->status instanceof StoreStatus ? $store->status->value : (string) $store->status,
                'operating_hours' => $store->operating_hours,
            ],
            'statuses' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => ucfirst($case->value),
            ], StoreStatus::cases()),
        ]);
    }

    /**
     * Update the specified store hub.
     */
    public function update(int $id, UpdateStoreRequest $request): RedirectResponse
    {
        $store = Store::findOrFail($id);
        Gate::authorize('update', $store);

        $store->update($request->validated());

        return redirect()->route('admin.stores.index')
            ->with('success', "Store Hub '{$store->name}' updated successfully.");
    }

    /**
     * Toggle the active status of a store hub.
     */
    public function toggle(int $id): RedirectResponse
    {
        $store = Store::findOrFail($id);
        Gate::authorize('update', $store);

        $newStatus = $store->status === StoreStatus::ACTIVE ? StoreStatus::INACTIVE : StoreStatus::ACTIVE;
        $store->update(['status' => $newStatus]);

        $statusLabel = $newStatus === StoreStatus::ACTIVE ? 'activated' : 'deactivated';

        return redirect()->route('admin.stores.index')
            ->with('success', "Store Hub '{$store->name}' {$statusLabel} successfully.");
    }

    /**
     * Update active branch services for the Branch-Service Matrix.
     */
    public function updateServices(int $id, Request $request): RedirectResponse
    {
        $store = Store::findOrFail($id);
        Gate::authorize('updateServices', $store);

        $validated = $request->validate([
            'services' => ['required', 'array'],
            'services.*' => ['string'],
        ]);

        $store->update(['services' => $validated['services']]);

        return redirect()->back()
            ->with('success', "Service matrix updated for {$store->name}.");
    }

    /**
     * Delete the specified store hub.
     */
    public function destroy(int $id): RedirectResponse
    {
        $store = Store::findOrFail($id);
        Gate::authorize('delete', $store);

        // Protect primary hub and ensure at least one store remains
        if ($store->id === 1 || strtolower(trim((string) $store->name)) === 'honnavar hub' || Store::count() <= 1) {
            return redirect()->route('admin.stores.index')
                ->with('error', "Cannot delete the primary operational hub '{$store->name}'.");
        }

        // Prevent deletion if bikes or bookings exist
        $bikeCount = Bike::where('current_store_id', $store->id)
            ->orWhere('home_store_id', $store->id)
            ->count();

        $bookingCount = Booking::where('pickup_store_id', $store->id)
            ->orWhere('return_store_id', $store->id)
            ->count();

        if ($bikeCount > 0 || $bookingCount > 0) {
            return redirect()->route('admin.stores.index')
                ->with('error', "Cannot delete branch '{$store->name}': {$bikeCount} bike(s) and {$bookingCount} booking(s) are assigned to it. Reassign or remove them first.");
        }

        $cabCount = DB::table('cab_vehicles')->where('store_id', $store->id)->count();
        $dispatchCount = DB::table('cab_dispatches')->where('store_id', $store->id)->count();
        if ($cabCount > 0 || $dispatchCount > 0) {
            return redirect()->route('admin.stores.index')
                ->with('error', "Cannot delete branch '{$store->name}': {$cabCount} cab vehicle(s) and {$dispatchCount} dispatch(es) are associated with it.");
        }

        $storeName = $store->name;

        DB::transaction(function () use ($store): void {
            // Detach staff assignments
            $store->staff()->detach();

            // Clean up empty pickup points associated with this store
            $store->pickupPoints()->delete();

            // Clean up bike transfers if table exists
            if (Schema::hasTable('bike_transfers')) {
                DB::table('bike_transfers')
                    ->where('from_store_id', $store->id)
                    ->orWhere('to_store_id', $store->id)
                    ->delete();
            }

            // Clean up bike relocation tasks if table exists
            if (Schema::hasTable('bike_relocation_tasks')) {
                DB::table('bike_relocation_tasks')
                    ->where('from_store_id', $store->id)
                    ->orWhere('required_store_id', $store->id)
                    ->delete();
            }

            // Clean up branch pricing rules and model prices
            BranchBikeModelPrice::where('store_id', $store->id)->delete();
            PricingRule::where('store_id', $store->id)
                ->orWhere('from_store_id', $store->id)
                ->orWhere('to_store_id', $store->id)
                ->delete();

            // Detach or null foreign references if any
            DB::table('coupons')->where('store_id', $store->id)->update(['store_id' => null]);
            DB::table('service_items')->where('store_id', $store->id)->update(['store_id' => null]);
            DB::table('service_bookings')->where('store_id', $store->id)->update(['store_id' => null]);
            DB::table('activity_logs')->where('store_id', $store->id)->update(['store_id' => null]);

            $store->delete();
        });

        return redirect()->route('admin.stores.index')
            ->with('success', "Store Hub '{$storeName}' deleted successfully.");
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStoreRequest;
use App\Http\Requests\Admin\UpdateStoreRequest;
use App\Models\Bike;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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

        $query = Store::query()->withCount(['staff', 'homeBikes', 'currentBikes']);

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
        $stats = [
            'total' => (clone $allStores)->count(),
            'active' => (clone $allStores)->where('status', StoreStatus::ACTIVE)->count(),
            'inactive' => (clone $allStores)->where('status', StoreStatus::INACTIVE)->count(),
            'total_bikes' => Bike::count(),
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
                'status' => $store->status instanceof StoreStatus ? $store->status->value : (string) $store->status,
                'staff_count' => (int) $store->staff_count,
                'home_bikes_count' => (int) $store->home_bikes_count,
                'current_bikes_count' => (int) $store->current_bikes_count,
                'operating_hours' => $store->operating_hours,
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
}

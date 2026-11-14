<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\CabFareRule;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Services\CabFareQuoteEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class AdminCabFareController extends Controller
{
    private function authorizeItem(Request $request, int $itemId, int $storeId): ServiceItem
    {
        $user = $request->user();
        abort_unless($user?->canManageService('taxi'), 403);
        $ids = $user->getAuthorizedStoreIds();
        abort_unless($ids === null || in_array($storeId, $ids, true), 403);
        abort_unless(Store::whereKey($storeId)->where('status', StoreStatus::ACTIVE->value)->exists(), 422);
        $item = ServiceItem::whereKey($itemId)->firstOrFail();
        if ($item->service_type !== 'taxi' || (int) $item->store_id !== $storeId) {
            throw ValidationException::withMessages(['service_item_id' => 'Cab tariff must belong to the requested branch.']);
        }
        return $item;
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $query = CabFareRule::query()->orderBy('id');
        if (($ids = $request->user()->getAuthorizedStoreIds()) !== null) {
            $query->whereIn('store_id', $ids);
        }
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        abort_if($request->user()?->isManager(), 403, 'Managers cannot create cab fare rules.');
        abort_unless($request->user()?->isSuperAdmin() || $request->user()?->isAdmin(), 403);
        $validated = $request->validate([
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'trip_type' => ['required', 'in:one_way,round_trip,local,airport'],
            'route_class' => ['required', 'string', 'max:40', 'regex:/^[a-z0-9_-]+$/'],
            'fixed_route_amount' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'per_km_amount' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'minimum_amount' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'hourly_amount' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'minimum_hours' => ['nullable', 'integer', 'between:1,336'],
            'daily_minimum_amount' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'driver_allowance_per_day' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'extra_km_amount' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'extra_hour_amount' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'included_km' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'included_hours' => ['nullable', 'numeric', 'min:0', 'max:336'],
            'toll_policy' => ['required', 'in:included,excluded,exact'],
            'parking_policy' => ['required', 'in:included,excluded,exact'],
            'interstate_permit_amount' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
        ]);
        $this->authorizeItem($request, (int) $validated['service_item_id'], (int) $validated['store_id']);
        if (! isset($validated['fixed_route_amount']) && ! isset($validated['per_km_amount'])
            && ! isset($validated['hourly_amount'])) {
            throw ValidationException::withMessages(['fixed_route_amount' => 'An approved base pricing method is required.']);
        }
        $exists = CabFareRule::where('service_item_id', $validated['service_item_id'])
            ->where('trip_type', $validated['trip_type'])
            ->where('route_class', $validated['route_class'])->exists();
        if ($exists) {
            throw ValidationException::withMessages(['route_class' => 'This item/route/trip tariff already exists.']);
        }
        // Fail closed: rate authoring is NOT rate approval or publication.
        $rule = CabFareRule::create([...$validated,
            'is_approved' => false, 'is_active' => false,
        ]);
        return response()->json(['data' => ['id' => $rule->id, 'is_active' => false, 'is_approved' => false]], 201);
    }

    public function simulate(Request $request, CabFareQuoteEngine $engine): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $data = $request->validate([
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'trip_type' => ['required', 'in:one_way,round_trip,local,airport'],
            'route_class' => ['required', 'string', 'max:40'],
            'estimated_km' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:336'],
            'days' => ['nullable', 'integer', 'between:1,60'],
            'extra_km' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'extra_hours' => ['nullable', 'numeric', 'min:0', 'max:336'],
            'interstate' => ['nullable', 'boolean'],
        ]);
        $item = $this->authorizeItem($request, (int) $data['service_item_id'], (int) $data['store_id']);
        return response()->json(['quote' => $engine->quote($item, $data), 'preview_only' => true]);
    }
}

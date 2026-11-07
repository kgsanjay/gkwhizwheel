<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\CabDriver;
use App\Models\CabVehicle;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Permissioned cab inventory contracts; all new records remain non-dispatchable
 * drafts until a separate, reviewed verification/activation workflow exists.
 */
final class AdminCabInventoryController extends Controller
{
    private function authorizeBranch(Request $request, int $storeId): ServiceItem|null
    {
        $user = $request->user();
        abort_unless($user && $user->canManageService('taxi'), 403);
        $authorized = $user->getAuthorizedStoreIds();
        abort_unless($authorized === null || in_array($storeId, $authorized, true), 403);
        abort_unless(Store::whereKey($storeId)->where('status', StoreStatus::ACTIVE->value)->exists(), 422, 'The selected branch is inactive.');
        return null;
    }

    private function authorizedItem(Request $request, int $itemId, int $storeId): ServiceItem
    {
        $this->authorizeBranch($request, $storeId);
        $item = ServiceItem::whereKey($itemId)->firstOrFail();
        if ($item->service_type !== 'taxi' || (int) $item->store_id !== $storeId) {
            throw ValidationException::withMessages([
                'service_item_id' => 'Cab service item must belong to the selected branch.',
            ]);
        }
        return $item;
    }

    public function vehicles(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $query = CabVehicle::query()->orderBy('id');
        if (($stores = $request->user()->getAuthorizedStoreIds()) !== null) {
            $query->whereIn('store_id', $stores);
        }
        return response()->json(['data' => $query->get()->map(fn (CabVehicle $vehicle): array => [
            'id' => $vehicle->id,
            'store_id' => $vehicle->store_id,
            'service_item_id' => $vehicle->service_item_id,
            'vehicle_class' => $vehicle->vehicle_class,
            'registration_number' => $vehicle->registration_number,
            'make' => $vehicle->make,
            'model_name' => $vehicle->model_name,
            'ownership_type' => $vehicle->ownership_type,
            'seats' => $vehicle->seats,
            'luggage_capacity' => $vehicle->luggage_capacity,
            'is_ac' => $vehicle->is_ac,
            'is_accessible' => $vehicle->is_accessible,
            'status' => $vehicle->status,
        ])]);
    }

    public function storeVehicle(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $payload = $request->all();
        if (isset($payload['registration_number'])) {
            $payload['registration_number'] = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $payload['registration_number']));
        }
        $validated = validator($payload, [
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'registration_number' => ['required', 'string', 'between:6,16', 'regex:/^[A-Z0-9]+$/', Rule::unique('cab_vehicles', 'registration_number')],
            'vehicle_class' => ['required', 'in:hatchback,sedan,suv,mpv,van,tempo_traveller'],
            'make' => ['required', 'string', 'max:80'],
            'model_name' => ['required', 'string', 'max:100'],
            'ownership_type' => ['required', 'in:owned,partner'],
            'seats' => ['required', 'integer', 'between:1,30'],
            'luggage_capacity' => ['required', 'integer', 'between:0,30'],
            'is_ac' => ['required', 'boolean'],
            'is_accessible' => ['required', 'boolean'],
        ])->validate();
        $this->authorizedItem($request, (int) $validated['service_item_id'], (int) $validated['store_id']);

        $vehicle = CabVehicle::create([...$validated,
            'documents_verified' => false,
            'status' => 'draft',
        ]);
        return response()->json(['data' => ['id' => $vehicle->id, 'status' => 'draft']], 201);
    }

    public function drivers(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $query = CabDriver::query()->orderBy('id');
        if (($stores = $request->user()->getAuthorizedStoreIds()) !== null) {
            $query->whereIn('store_id', $stores);
        }
        return response()->json(['data' => $query->get()->map(fn (CabDriver $driver): array => [
            'id' => $driver->id, 'name' => $driver->name,
            'store_id' => $driver->store_id, 'service_item_id' => $driver->service_item_id,
            'license_last_four' => $driver->license_last_four, 'status' => $driver->status,
        ])]);
    }

    public function storeDriver(Request $request): JsonResponse
    {
        abort_unless($request->user()?->canManageService('taxi'), 403);
        $validated = $request->validate([
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'name' => ['required', 'string', 'max:120'],
            'license_number' => ['required', 'string', 'between:6,40'],
        ]);
        $this->authorizedItem($request, (int) $validated['service_item_id'], (int) $validated['store_id']);
        $normalized = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $validated['license_number']));
        if (strlen($normalized) < 6) {
            throw ValidationException::withMessages(['license_number' => 'A valid driver licence identifier is required.']);
        }
        // Persist a keyed fingerprint and masked suffix, not the private licence number.
        $fingerprint = hash_hmac('sha256', $normalized, (string) config('app.key'));
        if (CabDriver::where('license_fingerprint', $fingerprint)->exists()) {
            throw ValidationException::withMessages(['license_number' => 'Driver licence is already registered.']);
        }
        $driver = CabDriver::create([
            'store_id' => $validated['store_id'],
            'service_item_id' => $validated['service_item_id'],
            'name' => $validated['name'],
            'license_fingerprint' => $fingerprint,
            'license_last_four' => substr($normalized, -4),
            'documents_verified' => false,
            'status' => 'draft',
        ]);
        return response()->json(['data' => ['id' => $driver->id, 'status' => 'draft']], 201);
    }
}

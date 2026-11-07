<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\BikeModel;
use App\Models\Store;
use App\Services\AvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Read-only, date-specific availability grouped by shared bike model.
 *
 * Availability is determined by the same per-vehicle location and booking
 * projection as the individual bike listing; there is no cached quantity to
 * oversell. A future checkout must recheck under the vehicle row lock.
 */
class BikeModelAvailabilityController extends Controller
{
    public function index(Request $request, AvailabilityService $availabilityService): JsonResponse
    {
        $filters = $request->validate([
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'category_id' => ['sometimes', 'integer', 'exists:bike_categories,id'],
            'bike_model_id' => ['sometimes', 'integer', 'exists:bike_models,id'],
        ]);

        $pickup = Store::findOrFail($filters['pickup_store_id']);
        $return = Store::findOrFail($filters['return_store_id']);
        if ($pickup->status !== StoreStatus::ACTIVE || $return->status !== StoreStatus::ACTIVE) {
            throw ValidationException::withMessages([
                'pickup_store_id' => 'Pickup and return branches must both be active.',
            ]);
        }

        $models = BikeModel::query()
            ->where('is_active', true)
            ->with('category:id,name')
            ->when(isset($filters['category_id']), fn ($query) => $query->where('category_id', $filters['category_id']))
            ->when(isset($filters['bike_model_id']), fn ($query) => $query->whereKey($filters['bike_model_id']))
            ->orderBy('brand')->orderBy('name')->orderBy('id')->get();

        $eligible = \App\Models\Bike::query()
            ->whereIn('bike_model_id', $models->pluck('id'))
            ->where('status', BikeStatus::AVAILABLE)
            ->get(['id', 'bike_model_id', 'current_store_id', 'status']);

        $availableByModel = [];
        foreach ($eligible as $bike) {
            if ($availabilityService->checkAvailability(
                $bike,
                $filters['start_date'],
                $filters['end_date'],
                null,
                (int) $pickup->id,
                (int) $return->id
            )) {
                $availableByModel[$bike->bike_model_id] = ($availableByModel[$bike->bike_model_id] ?? 0) + 1;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $models->map(fn (BikeModel $model): array => [
                'bike_model_id' => $model->id,
                'brand' => $model->brand,
                'name' => $model->name,
                'category_id' => $model->category_id,
                'category_name' => $model->category?->name,
                'fuel_type' => $model->fuel_type->value,
                'transmission' => $model->transmission->value,
                'available_units' => $availableByModel[$model->id] ?? 0,
                'is_available' => ($availableByModel[$model->id] ?? 0) > 0,
            ])->values()->all(),
            'filters' => [
                'pickup_store_id' => (int) $pickup->id,
                'return_store_id' => (int) $return->id,
                'start_date' => $filters['start_date'],
                'end_date' => $filters['end_date'],
            ],
            'message' => 'Availability is a live estimate and is rechecked when creating a booking hold.',
        ]);
    }
    /**
     * Model-level storefront inventory. Without a complete route/date filter,
     * expose catalog records but do not misrepresent stock as bookable.
     */
    public function catalog(Request $request, AvailabilityService $availabilityService): JsonResponse
    {
        $filters = $request->validate([
            'pickup_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'return_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'start_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'category_id' => ['nullable', 'integer', 'exists:bike_categories,id'],
        ]);
        $ready = ! empty($filters['pickup_store_id'])
            && ! empty($filters['return_store_id'])
            && ! empty($filters['start_date'])
            && ! empty($filters['end_date']);

        if ($ready) {
            $pickup = Store::findOrFail($filters['pickup_store_id']);
            $return = Store::findOrFail($filters['return_store_id']);
            if ($pickup->status !== StoreStatus::ACTIVE || $return->status !== StoreStatus::ACTIVE) {
                throw ValidationException::withMessages([
                    'pickup_store_id' => 'Pickup and return branches must both be active.',
                ]);
            }
        }

        $models = BikeModel::query()->where('is_active', true)
            ->with(['category:id,name,base_daily_rate', 'branchPrices', 'bikes' => function ($query): void {
                $query->select([
                    'id', 'bike_model_id', 'current_store_id', 'status',
                    'primary_image_path', 'base_daily_rate_override',
                ])->orderBy('id');
            }])
            ->when(! empty($filters['category_id']),
                fn ($query) => $query->where('category_id', $filters['category_id']))
            ->orderBy('brand')->orderBy('name')->get();

        $data = $models->map(function (BikeModel $model) use ($filters, $ready, $availabilityService): array {
            $units = $model->bikes;
            $available = null;
            if ($ready) {
                $available = $units->filter(fn ($bike): bool =>
                    $bike->status === BikeStatus::AVAILABLE
                    && $availabilityService->checkAvailability(
                        $bike, $filters['start_date'], $filters['end_date'], null,
                        (int) $filters['pickup_store_id'], (int) $filters['return_store_id']
                    )
                )->count();
            }

            $displayUnit = $units->first(fn ($bike) => $bike->primary_image_path !== null);
            $imagePath = $model->primary_image_path ?? $displayUnit?->primary_image_path;

            return [
                'bike_model_id' => $model->id,
                'brand' => $model->brand,
                'name' => $model->name,
                'category_id' => $model->category_id,
                'category_name' => $model->category?->name,
                'fuel_type' => $model->fuel_type->value,
                'transmission' => $model->transmission->value,
                'description' => $model->description,
                'primary_image_url' => $imagePath
                    ? (str_starts_with($imagePath, 'http')
                        ? $imagePath
                        : \Illuminate\Support\Facades\Storage::disk('public')->url($imagePath))
                    : null,
                'indicative_daily_rate' => $this->indicativeRate($model, $filters['pickup_store_id'] ?? null),
                'indicative_weekend_rate' => $this->indicativeRate($model, $filters['pickup_store_id'] ?? null, true),
                'total_units' => $units->count(),
                'available_units' => $available,
                'is_available' => $ready ? $available > 0 : null,
                'availability_checked' => $ready,
            ];
        })->filter(fn (array $model): bool => $model['total_units'] > 0)->values();

        return response()->json([
            'success' => true,
            'data' => $data->all(),
            'filters' => [
                'pickup_store_id' => $filters['pickup_store_id'] ?? null,
                'return_store_id' => $filters['return_store_id'] ?? null,
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
            ],
            'message' => $ready
                ? 'Availability is rechecked atomically when placing a booking hold.'
                : 'Select pickup and return branches and dates to see bookable units.',
        ]);
    }

    private function indicativeRate(BikeModel $model, ?int $pickupStoreId, bool $weekend = false): ?float
    {
        // Without a pickup branch no single price is authoritative.
        if ($pickupStoreId === null) {
            return null;
        }

        $configured = $model->branchPrices->firstWhere('store_id', $pickupStoreId);
        if ($configured !== null) {
            return (float) ($weekend ? $configured->weekend_rate : $configured->weekday_rate);
        }

        $unit = $model->bikes->firstWhere('current_store_id', $pickupStoreId);
        if ($unit === null) {
            return null;
        }

        $rates = app(\App\Services\\BranchBikePricing::class)->rates($unit, $pickupStoreId);
        return $weekend
            ? ($rates['weekend_rate'] ?? $rates['weekday_rate'])
            : $rates['weekday_rate'];
    }


}

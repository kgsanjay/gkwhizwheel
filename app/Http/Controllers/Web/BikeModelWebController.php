<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BikeModelWebController extends Controller
{
    public function show(int $id, Request $request, ?string $slug = null): Response|RedirectResponse
    {
        $model = BikeModel::query()->where('is_active', true)
            ->with(['category:id,name,base_daily_rate', 'branchPrices'])
            ->withCount('bikes')
            ->withCount(['bikes as available_units_count' => fn ($q) => $q->where('status', BikeStatus::AVAILABLE)])
            ->findOrFail($id);

        // Do not index empty catalog entries or leak individual registrations.
        abort_if($model->bikes_count === 0, 404);

        $canonicalSlug = Str::slug($model->brand.' '.$model->name);
        if ($slug !== $canonicalSlug) {
            return redirect()->route('services.bikes.models.show', [
                'id' => $model->id, 'slug' => $canonicalSlug,
            ], 301);
        }

        $params = $request->validate([
            'pickup_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'return_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'pickup_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'return_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d'],
            'pickup_time' => ['nullable', 'date_format:H:i'],
            'return_time' => ['nullable', 'date_format:H:i'],
        ]);

        $representative = $model->bikes()
            ->whereNotNull('primary_image_path')
            ->orderBy('id')->first(['primary_image_path']);

        $imagePath = $model->primary_image_path ?: $representative?->primary_image_path;

        $stores = Store::query()
            ->where('status', StoreStatus::ACTIVE)
            ->with(['pickupPoints' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'city', 'address_line', 'phone']);

        $branchPrices = $model->branchPrices->mapWithKeys(fn ($bp): array => [
            (string) $bp->store_id => [
                'weekday_rate' => (float) $bp->weekday_rate,
                'weekend_rate' => (float) $bp->weekend_rate,
            ],
        ])->all();

        return Inertia::render('Bikes/ModelShow', [
            'model' => [
                'id' => $model->id,
                'brand' => $model->brand,
                'name' => $model->name,
                'description' => $model->description,
                'category_id' => $model->category_id,
                'category_name' => $model->category?->name,
                'fuel_type' => $model->fuel_type->value,
                'transmission' => $model->transmission->value,
                'total_units' => $model->bikes_count,
                'available_units_now' => $model->available_units_count,
                'indicative_daily_rate' => $model->category?->base_daily_rate === null
                    ? null : (float) $model->category->base_daily_rate,
                'branch_prices' => $branchPrices,
                'primary_image_url' => $imagePath
                    ? (str_starts_with($imagePath, 'http') || str_starts_with($imagePath, '/')
                        ? $imagePath
                        : Storage::disk('public')->url($imagePath))
                    : null,
                'canonical_path' => '/services/bikes/models/'.$model->id.'/'.$canonicalSlug,
            ],
            'stores' => $stores->map(fn (Store $store): array => [
                'id' => $store->id,
                'name' => $store->name,
                'city' => $store->city,
                'address_line' => $store->address_line,
                'phone' => $store->phone,
                'pickup_points' => $store->pickupPoints->map(fn ($point): array => [
                    'id' => $point->id,
                    'name' => $point->name,
                    'landmark' => $point->landmark,
                    'delivery_fee' => (float) ($point->delivery_fee ?? 0),
                    'pickup_fee' => (float) ($point->pickup_fee ?? $point->delivery_fee ?? 0),
                    'return_fee' => (float) ($point->return_fee ?? $point->delivery_fee ?? 0),
                    'supports_pickup' => (bool) $point->supports_pickup,
                    'supports_return' => (bool) $point->supports_return,
                ])->values()->all(),
            ])->values()->all(),
            'initialFilters' => $params,
        ]);
    }
}

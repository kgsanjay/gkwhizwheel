<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Location-specific landing pages. Inventory is physical stock at this branch;
 * bookability for future dates is calculated separately by the public API.
 */
class BranchBikeRentalController extends Controller
{
    public function show(int $id, ?string $slug = null): Response|RedirectResponse
    {
        $store = Store::query()->where('status', StoreStatus::ACTIVE)->findOrFail($id);
        $canonicalSlug = Str::slug($store->city ?: $store->name);
        if ($slug !== $canonicalSlug) {
            return redirect()->route('bike-rentals.branches.show', [
                'id' => $store->id,
                'slug' => $canonicalSlug,
            ], 301);
        }

        $models = BikeModel::query()->where('is_active', true)
            ->with(['category:id,name,base_daily_rate', 'branchPrices'])
            ->whereHas('bikes', fn ($query) => $query->where('current_store_id', $store->id))
            ->orderBy('brand')->orderBy('name')->get();

        $units = Bike::query()
            ->where('current_store_id', $store->id)
            ->whereIn('bike_model_id', $models->pluck('id'))
            ->get(['id', 'bike_model_id', 'status', 'primary_image_path']);

        $modelRows = $models->map(function (BikeModel $model) use ($units, $store): array {
            $atBranch = $units->where('bike_model_id', $model->id);
            $imagePath = $model->primary_image_path
                ?: $atBranch->first(fn (Bike $bike) => $bike->primary_image_path !== null)?->primary_image_path;

            $configuredPrice = $model->branchPrices->firstWhere('store_id', $store->id);
            return [
                'id' => $model->id,
                'brand' => $model->brand,
                'name' => $model->name,
                'slug' => Str::slug($model->brand.' '.$model->name),
                'category_name' => $model->category?->name,
                'fuel_type' => $model->fuel_type->value,
                'transmission' => $model->transmission->value,
                'physical_units' => $atBranch->count(),
                'physically_available_now' => $atBranch->where('status', BikeStatus::AVAILABLE)->count(),
                'indicative_daily_rate' => $configuredPrice !== null
                    ? (float) $configuredPrice->weekday_rate
                    : ($model->category?->base_daily_rate === null ? null : (float) $model->category->base_daily_rate),
                'image_url' => $imagePath
                    ? (str_starts_with($imagePath, 'http')
                        ? $imagePath
                        : \Illuminate\Support\Facades\Storage::disk('public')->url($imagePath))
                    : null,
            ];
        })->values()->all();

        $others = Store::query()->where('status', StoreStatus::ACTIVE)
            ->whereKeyNot($store->id)->orderBy('name')->get(['id', 'name', 'city']);

        return Inertia::render('Bikes/BranchLanding', [
            'branch' => [
                'id' => $store->id,
                'name' => $store->name,
                'city' => $store->city,
                'address_line' => $store->address_line,
                'state' => $store->state,
                'pincode' => $store->pincode,
                'phone' => $store->phone,
                'operating_hours' => $store->operating_hours,
                'canonical_path' => '/bike-rentals/branches/'.$store->id.'/'.$canonicalSlug,
            ],
            'models' => $modelRows,
            'unlinked_count' => Bike::query()->where('current_store_id', $store->id)
                ->whereNull('bike_model_id')->count(),
            'otherBranches' => $others->map(fn (Store $other): array => [
                'id' => $other->id,
                'name' => $other->name,
                'city' => $other->city,
                'path' => '/bike-rentals/branches/'.$other->id.'/'.Str::slug($other->city ?: $other->name),
            ])->values()->all(),
        ]);
    }
}

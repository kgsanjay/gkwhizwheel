<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BikeModelWebController extends Controller
{
    public function show(int $id, Request $request, ?string $slug = null): Response|RedirectResponse
    {
        $model = BikeModel::query()->where('is_active', true)
            ->with('category:id,name,base_daily_rate')
            ->withCount('bikes')
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
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $representative = $model->bikes()
            ->whereNotNull('primary_image_path')
            ->orderBy('id')->first(['primary_image_path']);

        $imagePath = $model->primary_image_path ?: $representative?->primary_image_path;

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
                'indicative_daily_rate' => $model->category?->base_daily_rate === null
                    ? null : (float) $model->category->base_daily_rate,
                'primary_image_url' => $imagePath
                    ? (str_starts_with($imagePath, 'http')
                        ? $imagePath
                        : \Illuminate\Support\Facades\Storage::disk('public')->url($imagePath))
                    : null,
                'canonical_path' => '/services/bikes/models/'.$model->id.'/'.$canonicalSlug,
            ],
            'stores' => Store::query()->where('status', StoreStatus::ACTIVE)
                ->orderBy('name')->get(['id', 'name', 'city']),
            'initialFilters' => $params,
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Http\Controllers\Controller;
use App\Models\BikeModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\ValidationException;

class BikeModelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $models = BikeModel::query()
            ->with(['category:id,name', 'bikes:id,bike_model_id,current_store_id,status'])
            ->withCount('bikes')
            ->orderBy('brand')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $models->map(fn (BikeModel $model): array => [
                'id' => $model->id,
                'category_id' => $model->category_id,
                'category_name' => $model->category?->name,
                'brand' => $model->brand,
                'name' => $model->name,
                'fuel_type' => $model->fuel_type->value,
                'transmission' => $model->transmission->value,
                'is_active' => $model->is_active,
                'total_units' => $model->bikes_count,
                // All counts refer to current physical location, not home
                // ownership or future date-based booking availability.
                'branches' => $model->bikes->groupBy('current_store_id')
                    ->map(fn ($bikes, $storeId): array => [
                        'store_id' => (int) $storeId,
                        'total_units' => $bikes->count(),
                        'available_now' => $bikes->where('status', BikeStatus::AVAILABLE)->count(),
                        'on_rent' => $bikes->where('status', BikeStatus::ON_RENT)->count(),
                        'maintenance' => $bikes->where('status', BikeStatus::MAINTENANCE)->count(),
                        'retired' => $bikes->where('status', BikeStatus::RETIRED)->count(),
                    ])->values()->all(),
            ])->values()->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer', 'exists:bike_categories,id'],
            'brand' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'fuel_type' => ['required', new Enum(FuelType::class)],
            'transmission' => ['required', new Enum(Transmission::class)],
            'description' => ['nullable', 'string', 'max:5000'],
        ]);
        $data['brand'] = trim($data['brand']);
        $data['name'] = trim($data['name']);
        if ($data['brand'] === '' || $data['name'] === '') {
            throw ValidationException::withMessages(['name' => 'Brand and model name must not be blank.']);
        }

        $exists = BikeModel::query()
            ->where('category_id', $data['category_id'])
            ->where('brand', $data['brand'])
            ->where('name', $data['name'])
            ->where('fuel_type', $data['fuel_type'])
            ->where('transmission', $data['transmission'])
            ->exists();
        if ($exists) {
            throw ValidationException::withMessages(['name' => 'This catalog model already exists.']);
        }

        $model = BikeModel::create($data);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $model->id,
                'category_id' => $model->category_id,
                'brand' => $model->brand,
                'name' => $model->name,
                'fuel_type' => $model->fuel_type->value,
                'transmission' => $model->transmission->value,
                'total_units' => 0,
            ],
        ], 201);
    }
}

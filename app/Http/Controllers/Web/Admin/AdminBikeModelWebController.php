<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminBikeModelWebController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

        $models = BikeModel::query()
            ->with('category:id,name')
            ->orderBy('brand')
            ->orderBy('name')
            ->get();

        $allBikes = Bike::query()
            ->whereNotNull('bike_model_id')
            ->get(['id', 'bike_model_id', 'registration_number', 'status', 'current_store_id', 'home_store_id']);
        $byModel = $allBikes->groupBy('bike_model_id');
        $stores = Store::query()->orderBy('name')->get(['id', 'name', 'city']);

        return Inertia::render('Admin/BikeModels/Index', [
            'models' => $models->map(function (BikeModel $model) use ($byModel, $stores): array {
                $units = $byModel->get($model->id, collect());

                return [
                    'id' => $model->id,
                    'brand' => $model->brand,
                    'name' => $model->name,
                    'category_id' => $model->category_id,
                    'category_name' => $model->category?->name,
                    'fuel_type' => $model->fuel_type->value,
                    'transmission' => $model->transmission->value,
                    'description' => $model->description,
                    'is_active' => (bool) $model->is_active,
                    'total_units' => $units->count(),
                    'branches' => $stores->map(function (Store $store) use ($units): array {
                        $atStore = $units->where('current_store_id', $store->id);

                        return [
                            'store_id' => $store->id,
                            'store_name' => $store->name,
                            'total_units' => $atStore->count(),
                            'available_now' => $atStore->where('status', BikeStatus::AVAILABLE)->count(),
                            'on_rent' => $atStore->where('status', BikeStatus::ON_RENT)->count(),
                            'maintenance' => $atStore->where('status', BikeStatus::MAINTENANCE)->count(),
                            'retired' => $atStore->where('status', BikeStatus::RETIRED)->count(),
                        ];
                    })->filter(fn (array $branch): bool => $branch['total_units'] > 0)->values()->all(),
                    'units' => $units->map(fn (Bike $bike): array => [
                        'id' => $bike->id,
                        'registration_number' => $bike->registration_number,
                        'current_store_id' => $bike->current_store_id,
                        'status' => $bike->status->value,
                    ])->values()->all(),
                ];
            })->values()->all(),
            'categories' => BikeCategory::query()->orderBy('name')->get(['id', 'name']),
            'stores' => $stores,
            'unlinked_units' => Bike::query()->whereNull('bike_model_id')->count(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

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
            throw ValidationException::withMessages(['name' => 'Brand and model name cannot be empty.']);
        }
        $duplicate = BikeModel::query()
            ->where('category_id', $data['category_id'])
            ->where('brand', $data['brand'])
            ->where('name', $data['name'])
            ->where('fuel_type', $data['fuel_type'])
            ->where('transmission', $data['transmission'])
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['name' => 'This bike model already exists.']);
        }

        DB::transaction(fn () => BikeModel::create($data));

        return redirect()->route('admin.bike-models.index')
            ->with('success', 'Bike model created. Add and associate individually registered vehicles next.');
    }
}

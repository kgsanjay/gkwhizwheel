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
use App\Models\BranchBikeModelPrice;
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
            ->with(['category:id,name', 'branchPrices'])
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
                    'branch_prices' => $model->branchPrices->map(fn (BranchBikeModelPrice $price): array => [
                        'store_id' => $price->store_id,
                        'weekday_rate' => (float) $price->weekday_rate,
                        'weekend_rate' => (float) $price->weekend_rate,
                    ])->values()->all(),
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

    /**
     * Set an explicit weekday/weekend rate for one model at one active branch.
     * Unconfigured combinations continue using existing physical-bike rates.
     */
    public function saveBranchPrice(int $id, Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

        $data = $request->validate([
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'weekday_rate' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'weekend_rate' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ]);

        $model = BikeModel::findOrFail($id);
        $store = Store::findOrFail($data['store_id']);
        if (! $model->is_active || $store->status !== \App\Enums\StoreStatus::ACTIVE) {
            throw ValidationException::withMessages([
                'store_id' => 'Both bike model and branch must be active.',
            ]);
        }

        BranchBikeModelPrice::updateOrCreate(
            ['bike_model_id' => $model->id, 'store_id' => $store->id],
            ['weekday_rate' => $data['weekday_rate'], 'weekend_rate' => $data['weekend_rate']]
        );

        return redirect()->route('admin.bike-models.index')
            ->with('success', 'Branch rental rates saved.');
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
    /**
     * Register multiple distinct physical vehicles under a single catalog
     * model and branch. The entire batch is rejected if any row is invalid.
     */
    public function bulkRegister(int $id, Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

        $validated = $request->validate([
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'bikes' => ['required', 'array', 'min:1', 'max:50'],
            'bikes.*.registration_number' => [
                'required', 'string', 'max:30', 'distinct:ignore_case',
                'unique:bikes,registration_number',
            ],
            'bikes.*.odometer_reading' => ['nullable', 'integer', 'min:0', 'max:99999999'],
        ]);

        $store = Store::findOrFail($validated['store_id']);
        if ($store->status !== \App\Enums\StoreStatus::ACTIVE) {
            throw ValidationException::withMessages([
                'store_id' => 'The receiving branch must be active.',
            ]);
        }

        $model = BikeModel::findOrFail($id);
        if (! $model->is_active) {
            throw ValidationException::withMessages([
                'bike_model_id' => 'This catalog model is inactive.',
            ]);
        }

        // This route has a superadmin guard; never expose it as a staff
        // workaround for their restricted branch permissions.
        DB::transaction(function () use ($validated, $id): void {
            $model = BikeModel::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! $model->is_active) {
                throw ValidationException::withMessages([
                    'bike_model_id' => 'This catalog model is inactive.',
                ]);
            }

            $rows = collect($validated['bikes']);
            $registrations = $rows->pluck('registration_number')
                ->map(fn (string $registration): string => mb_strtoupper(trim($registration)))
                ->values()->all();

            if (count($registrations) !== count(array_unique($registrations))) {
                throw ValidationException::withMessages([
                    'bikes' => 'Duplicate registration numbers are not allowed.',
                ]);
            }

            if (Bike::withTrashed()->whereIn('registration_number', $registrations)->exists()) {
                throw ValidationException::withMessages([
                    'bikes' => 'One or more registration numbers already exist, including retired or deleted vehicles.',
                ]);
            }

            foreach ($rows as $index => $row) {
                Bike::create([
                    'bike_model_id' => $model->id,
                    'category_id' => $model->category_id,
                    'brand' => $model->brand,
                    'model_name' => $model->name,
                    'fuel_type' => $model->fuel_type,
                    'transmission' => $model->transmission,
                    'registration_number' => $registrations[$index],
                    'home_store_id' => $validated['store_id'],
                    'current_store_id' => $validated['store_id'],
                    'odometer_reading' => $row['odometer_reading'] ?? 0,
                    'status' => BikeStatus::AVAILABLE,
                ]);
            }
        });

        return redirect()->route('admin.bike-models.index')
            ->with('success', count($validated['bikes']).' individual bikes registered under '.$model->brand.' '.$model->name.'.');
    }

}

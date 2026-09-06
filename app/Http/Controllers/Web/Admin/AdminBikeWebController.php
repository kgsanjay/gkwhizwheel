<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkImportBikesRequest;
use App\Http\Requests\Admin\StoreBikeRequest;
use App\Http\Requests\Admin\UpdateBikeRequest;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminBikeWebController extends Controller
{
    /**
     * Display a listing of bikes with filters, search, and list/grid view data.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Bike::class);

        $query = Bike::query()
            ->with(['category', 'currentStore', 'homeStore', 'images', 'documents']);

        // Search query
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search): void {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', (int) $categoryId);
        }

        // Store filter
        if ($storeId = $request->query('store_id')) {
            $query->where('current_store_id', (int) $storeId);
        }

        // Status filter
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Drifted fleet filter (where current store != home store)
        if ($request->boolean('drift')) {
            $query->whereColumn('current_store_id', '!=', 'home_store_id');
        }

        $bikes = $query->latest()->get();

        // Calculate fleet overview statistics
        $allBikes = Bike::query();
        $totalCount = (clone $allBikes)->count();
        $availableCount = (clone $allBikes)->where('status', BikeStatus::AVAILABLE)->count();
        $inServiceCount = (clone $allBikes)->where('status', BikeStatus::MAINTENANCE)->count();
        $rentedCount = (clone $allBikes)->where('status', BikeStatus::ON_RENT)->count();
        $driftedCount = (clone $allBikes)->whereColumn('current_store_id', '!=', 'home_store_id')->count();

        $categories = BikeCategory::orderBy('name')->get();
        $stores = Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get();

        // Format bikes for frontend with document compliance metadata
        $formattedBikes = $bikes->map(function ($bike): array {
            $docs = $bike->documents->keyBy(
                fn ($d) => $d->document_type instanceof BikeDocumentType
                ? $d->document_type->value
                : (string) $d->document_type
            );

            $rcDoc = $docs->get(BikeDocumentType::RC->value);
            $insuranceDoc = $docs->get(BikeDocumentType::INSURANCE->value);
            $emissionDoc = $docs->get(BikeDocumentType::EMISSION_CERTIFICATE->value);

            return [
                'id' => $bike->id,
                'brand' => $bike->brand,
                'model_name' => $bike->model_name,
                'registration_number' => $bike->registration_number,
                'fuel_type' => $bike->fuel_type?->value ?? (string) $bike->fuel_type,
                'transmission' => $bike->transmission?->value ?? (string) $bike->transmission,
                'status' => $bike->status?->value ?? (string) $bike->status,
                'odometer_reading' => $bike->odometer_reading,
                'base_daily_rate' => $bike->base_daily_rate_override !== null
                    ? (float) $bike->base_daily_rate_override
                    : (float) ($bike->category?->base_daily_rate ?? 0.0),
                'deposit_amount' => $bike->deposit_amount_override !== null
                    ? (float) $bike->deposit_amount_override
                    : (float) ($bike->category?->default_deposit_amount ?? 0.0),
                'primary_image_url' => $bike->primary_image_path
                    ? Storage::disk('public')->url($bike->primary_image_path)
                    : null,
                'is_drifted' => $bike->current_store_id !== $bike->home_store_id,
                'category' => $bike->category ? [
                    'id' => $bike->category->id,
                    'name' => $bike->category->name,
                ] : null,
                'current_store' => $bike->currentStore ? [
                    'id' => $bike->currentStore->id,
                    'name' => $bike->currentStore->name,
                    'code' => $bike->currentStore->code,
                ] : null,
                'home_store' => $bike->homeStore ? [
                    'id' => $bike->homeStore->id,
                    'name' => $bike->homeStore->name,
                    'code' => $bike->homeStore->code,
                ] : null,
                'documents' => [
                    'rc' => $rcDoc ? [
                        'id' => $rcDoc->id,
                        'expiry_date' => $rcDoc->expiry_date?->toDateString(),
                        'verified' => (bool) $rcDoc->verified,
                    ] : null,
                    'insurance' => $insuranceDoc ? [
                        'id' => $insuranceDoc->id,
                        'expiry_date' => $insuranceDoc->expiry_date?->toDateString(),
                        'verified' => (bool) $insuranceDoc->verified,
                    ] : null,
                    'emission' => $emissionDoc ? [
                        'id' => $emissionDoc->id,
                        'expiry_date' => $emissionDoc->expiry_date?->toDateString(),
                        'verified' => (bool) $emissionDoc->verified,
                    ] : null,
                ],
                'created_at' => $bike->created_at?->toDateString(),
            ];
        })->values()->all();

        return Inertia::render('Admin/Bikes/Index', [
            'bikes' => $formattedBikes,
            'categories' => $categories->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values()->all(),
            'stores' => $stores->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'code' => $s->code])->values()->all(),
            'filters' => [
                'search' => $request->query('search', ''),
                'category_id' => $request->query('category_id', ''),
                'store_id' => $request->query('store_id', ''),
                'status' => $request->query('status', ''),
                'drift' => $request->boolean('drift'),
            ],
            'stats' => [
                'total' => $totalCount,
                'available' => $availableCount,
                'in_service' => $inServiceCount,
                'rented' => $rentedCount,
                'drifted' => $driftedCount,
            ],
        ]);
    }

    /**
     * Show the form for creating a new bike.
     */
    public function create(): Response
    {
        Gate::authorize('create', Bike::class);

        return Inertia::render('Admin/Bikes/Create', [
            'categories' => BikeCategory::orderBy('name')->get(['id', 'name', 'base_daily_rate', 'default_deposit_amount']),
            'stores' => Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get(['id', 'name', 'code', 'city']),
            'fuel_types' => array_map(fn ($case) => ['value' => $case->value, 'label' => ucfirst($case->value)], FuelType::cases()),
            'transmissions' => array_map(fn ($case) => ['value' => $case->value, 'label' => ucfirst($case->value)], Transmission::cases()),
            'statuses' => array_map(fn ($case) => ['value' => $case->value, 'label' => ucfirst(str_replace('_', ' ', $case->value))], BikeStatus::cases()),
        ]);
    }

    /**
     * Store a newly created bike in storage.
     */
    public function store(StoreBikeRequest $request): RedirectResponse
    {
        Gate::authorize('create', Bike::class);

        $validated = $request->validated();
        $bikeData = collect($validated)->except(['primary_image', 'images', 'documents'])->all();

        if ($request->hasFile('primary_image')) {
            $bikeData['primary_image_path'] = $request->file('primary_image')->store('bikes/primary', 'public');
        }

        $bike = DB::transaction(function () use ($bikeData, $request, $validated) {
            $bike = Bike::create($bikeData);

            if (! empty($validated['documents']) && is_array($validated['documents'])) {
                foreach ($validated['documents'] as $docData) {
                    if (isset($docData['file']) && $docData['file'] instanceof UploadedFile) {
                        $path = $docData['file']->store('documents/bikes');
                        BikeDocument::updateOrCreate(
                            [
                                'bike_id' => $bike->id,
                                'document_type' => $docData['document_type'],
                            ],
                            [
                                'file_path' => $path,
                                'issue_date' => $docData['issue_date'] ?? null,
                                'expiry_date' => $docData['expiry_date'] ?? null,
                                'uploaded_by' => $request->user()->id,
                                'verified' => true,
                            ]
                        );
                    }
                }
            }

            return $bike;
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $bike->current_store_id,
            'action' => 'bike_created',
            'subject_type' => Bike::class,
            'subject_id' => $bike->id,
            'new_values' => [
                'registration_number' => $bike->registration_number,
                'model_name' => $bike->model_name,
                'current_store_id' => $bike->current_store_id,
            ],
        ]);

        return redirect()->route('admin.bikes.index')
            ->with('success', 'Bike added successfully to the fleet.');
    }

    /**
     * Show the form for editing an existing bike.
     */
    public function edit(int $id): Response
    {
        $bike = Bike::with(['category', 'currentStore', 'homeStore', 'documents'])->findOrFail($id);
        Gate::authorize('update', $bike);

        $docs = $bike->documents->keyBy(
            fn ($d) => $d->document_type instanceof BikeDocumentType
            ? $d->document_type->value
            : (string) $d->document_type
        );

        $rcDoc = $docs->get(BikeDocumentType::RC->value);
        $insuranceDoc = $docs->get(BikeDocumentType::INSURANCE->value);
        $emissionDoc = $docs->get(BikeDocumentType::EMISSION_CERTIFICATE->value);

        return Inertia::render('Admin/Bikes/Edit', [
            'bike' => [
                'id' => $bike->id,
                'category_id' => $bike->category_id,
                'current_store_id' => $bike->current_store_id,
                'home_store_id' => $bike->home_store_id,
                'brand' => $bike->brand,
                'model_name' => $bike->model_name,
                'registration_number' => $bike->registration_number,
                'fuel_type' => $bike->fuel_type?->value ?? (string) $bike->fuel_type,
                'transmission' => $bike->transmission?->value ?? (string) $bike->transmission,
                'base_daily_rate_override' => $bike->base_daily_rate_override,
                'deposit_amount_override' => $bike->deposit_amount_override,
                'odometer_reading' => $bike->odometer_reading,
                'status' => $bike->status?->value ?? (string) $bike->status,
                'next_service_due_date' => $bike->next_service_due_date?->toDateString(),
                'primary_image_url' => $bike->primary_image_path
                    ? Storage::disk('public')->url($bike->primary_image_path)
                    : null,
                'documents' => [
                    'rc' => $rcDoc ? [
                        'id' => $rcDoc->id,
                        'expiry_date' => $rcDoc->expiry_date?->toDateString(),
                        'verified' => (bool) $rcDoc->verified,
                    ] : null,
                    'insurance' => $insuranceDoc ? [
                        'id' => $insuranceDoc->id,
                        'expiry_date' => $insuranceDoc->expiry_date?->toDateString(),
                        'verified' => (bool) $insuranceDoc->verified,
                    ] : null,
                    'emission' => $emissionDoc ? [
                        'id' => $emissionDoc->id,
                        'expiry_date' => $emissionDoc->expiry_date?->toDateString(),
                        'verified' => (bool) $emissionDoc->verified,
                    ] : null,
                ],
            ],
            'categories' => BikeCategory::orderBy('name')->get(['id', 'name', 'base_daily_rate', 'default_deposit_amount']),
            'stores' => Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get(['id', 'name', 'code', 'city']),
            'fuel_types' => array_map(fn ($case) => ['value' => $case->value, 'label' => ucfirst($case->value)], FuelType::cases()),
            'transmissions' => array_map(fn ($case) => ['value' => $case->value, 'label' => ucfirst($case->value)], Transmission::cases()),
            'statuses' => array_map(fn ($case) => ['value' => $case->value, 'label' => ucfirst(str_replace('_', ' ', $case->value))], BikeStatus::cases()),
        ]);
    }

    /**
     * Update the specified bike in storage.
     */
    public function update(int $id, UpdateBikeRequest $request): RedirectResponse
    {
        $bike = Bike::findOrFail($id);
        Gate::authorize('update', $bike);

        $validated = $request->validated();
        $bikeData = collect($validated)->except(['primary_image', 'documents'])->all();

        if ($request->hasFile('primary_image')) {
            $bikeData['primary_image_path'] = $request->file('primary_image')->store('bikes/primary', 'public');
        }

        $oldValues = $bike->only(['registration_number', 'model_name', 'current_store_id', 'status', 'base_daily_rate']);

        DB::transaction(function () use ($bike, $bikeData, $request, $validated) {
            $bike->update($bikeData);

            if (! empty($validated['documents']) && is_array($validated['documents'])) {
                foreach ($validated['documents'] as $docData) {
                    $docType = $docData['document_type'];
                    $existingDoc = BikeDocument::where('bike_id', $bike->id)
                        ->where('document_type', $docType)
                        ->first();

                    $updatePayload = [
                        'expiry_date' => $docData['expiry_date'] ?? $existingDoc?->expiry_date,
                    ];

                    if (isset($docData['file']) && $docData['file'] instanceof UploadedFile) {
                        $path = $docData['file']->store('documents/bikes');
                        $updatePayload['file_path'] = $path;
                        $updatePayload['uploaded_by'] = $request->user()->id;
                        $updatePayload['verified'] = true;
                    }

                    if ($existingDoc) {
                        $existingDoc->update($updatePayload);
                    } elseif (isset($updatePayload['file_path'])) {
                        BikeDocument::create([
                            'bike_id' => $bike->id,
                            'document_type' => $docType,
                            'file_path' => $updatePayload['file_path'],
                            'expiry_date' => $updatePayload['expiry_date'] ?? null,
                            'uploaded_by' => $request->user()->id,
                            'verified' => true,
                        ]);
                    }
                }
            }
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $bike->current_store_id,
            'action' => 'bike_updated',
            'subject_type' => Bike::class,
            'subject_id' => $bike->id,
            'old_values' => $oldValues,
            'new_values' => $bike->fresh()->only(['registration_number', 'model_name', 'current_store_id', 'status', 'base_daily_rate']),
        ]);

        return redirect()->route('admin.bikes.index')
            ->with('success', 'Bike details updated successfully.');
    }

    /**
     * Remove the specified bike from storage.
     */
    public function destroy(int $id): RedirectResponse
    {
        $bike = Bike::findOrFail($id);
        Gate::authorize('delete', $bike);

        $oldValues = [
            'registration_number' => $bike->registration_number,
            'model_name' => $bike->model_name,
            'status' => $bike->status?->value ?? (string) $bike->status,
        ];
        $bike->delete();

        ActivityLog::create([
            'user_id' => request()->user()?->id,
            'store_id' => $bike->current_store_id,
            'action' => 'bike_deleted',
            'subject_type' => Bike::class,
            'subject_id' => $bike->id,
            'old_values' => $oldValues,
        ]);

        return redirect()->route('admin.bikes.index')
            ->with('success', 'Bike removed from fleet successfully.');
    }

    /**
     * Process bulk CSV import of bikes.
     */
    public function importCsv(BulkImportBikesRequest $request): RedirectResponse
    {
        Gate::authorize('bulkImport', Bike::class);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return back()->withErrors(['file' => 'Unable to read uploaded CSV file.']);
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return back()->withErrors(['file' => 'CSV file is empty.']);
        }

        // Clean and normalize header columns
        $headerMap = [];
        foreach ($header as $idx => $col) {
            $colName = strtolower(trim((string) $col));
            $headerMap[$idx] = match ($colName) {
                'reg_number', 'reg_no', 'registration' => 'registration_number',
                'category', 'category_name' => 'category_id',
                'current_store', 'current_store_code' => 'current_store_id',
                'home_store', 'home_store_code' => 'home_store_id',
                'model' => 'model_name',
                'rate', 'daily_rate', 'base_daily_rate' => 'base_daily_rate_override',
                'deposit', 'deposit_amount' => 'deposit_amount_override',
                default => $colName,
            };
        }

        // Cache category and store lookups for performance
        $categoryLookup = BikeCategory::pluck('id', 'name')->mapWithKeys(
            fn ($id, $name) => [strtolower((string) $name) => $id]
        );
        $storeNameLookup = Store::pluck('id', 'name')->mapWithKeys(
            fn ($id, $name) => [strtolower((string) $name) => $id]
        );

        $imported = 0;
        $errors = [];
        $rowNumber = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $rowNumber++;

            if (empty(array_filter($data, fn ($val) => trim((string) $val) !== ''))) {
                continue;
            }

            $row = [];
            foreach ($data as $idx => $val) {
                if (isset($headerMap[$idx])) {
                    $key = $headerMap[$idx];
                    $val = trim((string) $val);
                    $row[$key] = $val === '' ? null : $val;
                }
            }

            // Resolve category by ID or Name
            if (isset($row['category_id']) && ! is_numeric($row['category_id'])) {
                $catKey = strtolower((string) $row['category_id']);
                $row['category_id'] = $categoryLookup->get($catKey);
            }

            // Resolve home store by ID or Name
            if (isset($row['home_store_id']) && ! is_numeric($row['home_store_id'])) {
                $stKey = strtolower((string) $row['home_store_id']);
                $row['home_store_id'] = $storeNameLookup->get($stKey);
            }

            // Resolve current store by ID or Name
            if (isset($row['current_store_id']) && ! is_numeric($row['current_store_id'])) {
                $stKey = strtolower((string) $row['current_store_id']);
                $row['current_store_id'] = $storeNameLookup->get($stKey);
            }

            $validator = Validator::make($row, [
                'category_id' => ['required', 'integer', 'exists:bike_categories,id'],
                'current_store_id' => ['required', 'integer', 'exists:stores,id'],
                'home_store_id' => ['required', 'integer', 'exists:stores,id'],
                'brand' => ['required', 'string', 'max:100'],
                'model_name' => ['required', 'string', 'max:100'],
                'registration_number' => ['required', 'string', 'max:30', 'unique:bikes,registration_number'],
                'fuel_type' => ['required', new Enum(FuelType::class)],
                'transmission' => ['required', new Enum(Transmission::class)],
                'base_daily_rate_override' => ['nullable', 'numeric', 'min:0'],
                'deposit_amount_override' => ['nullable', 'numeric', 'min:0'],
                'odometer_reading' => ['nullable', 'integer', 'min:0'],
                'status' => ['nullable', new Enum(BikeStatus::class)],
            ]);

            if ($validator->fails()) {
                $errors[] = "Row {$rowNumber}: " . implode(', ', $validator->errors()->all());

                continue;
            }

            $bikeData = $validator->validated();
            if (! isset($bikeData['status'])) {
                $bikeData['status'] = BikeStatus::AVAILABLE;
            }
            if (! isset($bikeData['odometer_reading'])) {
                $bikeData['odometer_reading'] = 0;
            }

            Bike::create($bikeData);
            $imported++;
        }

        fclose($handle);

        if (count($errors) > 0 && $imported === 0) {
            return back()->withErrors(['file' => implode(' | ', array_slice($errors, 0, 3))]);
        }

        $message = "Imported {$imported} bikes successfully.";
        if (count($errors) > 0) {
            $message .= " (" . count($errors) . " rows skipped due to errors).";
        }

        return redirect()->route('admin.bikes.index')->with('success', $message);
    }

    /**
     * Download a sample CSV template for bulk import.
     */
    public function exportSampleCsv(): StreamedResponse
    {
        Gate::authorize('bulkImport', Bike::class);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="gkwhizwheel_bikes_sample.csv"',
        ];

        $callback = function (): void {
            $handle = fopen('php://output', 'w');

            // Header row
            fputcsv($handle, [
                'brand',
                'model_name',
                'registration_number',
                'category_id',
                'home_store_id',
                'current_store_id',
                'fuel_type',
                'transmission',
                'base_daily_rate_override',
                'deposit_amount_override',
                'odometer_reading',
                'status',
            ]);

            // Sample rows
            fputcsv($handle, [
                'Ather',
                '450X',
                'KA-01-EV-1001',
                '1',
                '1',
                '1',
                'electric',
                'automatic',
                '500.00',
                '1500.00',
                '2400',
                'available',
            ]);

            fputcsv($handle, [
                'Royal Enfield',
                'Hunter 350',
                'KA-05-MH-2002',
                '2',
                '1',
                '1',
                'petrol',
                'manual',
                '850.00',
                '2000.00',
                '5100',
                'available',
            ]);

            fclose($handle);
        };

        return response()->streamDownload($callback, 'gkwhizwheel_bikes_sample.csv', $headers);
    }
}

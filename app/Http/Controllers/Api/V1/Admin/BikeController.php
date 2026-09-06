<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkImportBikesRequest;
use App\Http\Requests\Admin\StoreBikeRequest;
use App\Http\Requests\Admin\UpdateBikeRequest;
use App\Http\Requests\Admin\UploadBikeDocumentRequest;
use App\Http\Resources\BikeResource;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeDocument;
use App\Models\BikeImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;

class BikeController extends Controller
{
    /**
     * Create a new bike with optional primary image, gallery images, and documents.
     */
    public function store(StoreBikeRequest $request): JsonResponse
    {
        Gate::authorize('create', Bike::class);

        $validated = $request->validated();

        $bikeData = collect($validated)->except(['primary_image', 'images', 'documents'])->all();

        if ($request->hasFile('primary_image')) {
            $bikeData['primary_image_path'] = $request->file('primary_image')->store('bikes/primary', 'public');
        }

        $bike = DB::transaction(function () use ($bikeData, $request, $validated) {
            $bike = Bike::create($bikeData);

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $imageFile) {
                    if ($imageFile instanceof UploadedFile) {
                        $path = $imageFile->store('bikes/gallery', 'public');
                        BikeImage::create([
                            'bike_id' => $bike->id,
                            'file_path' => $path,
                            'sort_order' => $index,
                        ]);
                    }
                }
            }

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
                                'verified' => (bool) ($docData['verified'] ?? false),
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

        $bike->load(['category', 'currentStore', 'homeStore', 'images']);

        return response()->json([
            'success' => true,
            'data' => new BikeResource($bike),
            'message' => 'Bike created successfully.',
        ], 201);
    }

    /**
     * Update an existing bike.
     */
    public function update(int $id, UpdateBikeRequest $request): JsonResponse
    {
        $bike = Bike::findOrFail($id);
        Gate::authorize('update', $bike);

        $oldValues = $bike->only(['registration_number', 'model_name', 'current_store_id', 'status', 'base_daily_rate']);
        $validated = $request->validated();
        $bikeData = collect($validated)->except(['primary_image'])->all();

        if ($request->hasFile('primary_image')) {
            $bikeData['primary_image_path'] = $request->file('primary_image')->store('bikes/primary', 'public');
        }

        $bike->update($bikeData);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $bike->current_store_id,
            'action' => 'bike_updated',
            'subject_type' => Bike::class,
            'subject_id' => $bike->id,
            'old_values' => $oldValues,
            'new_values' => $bike->fresh()->only(['registration_number', 'model_name', 'current_store_id', 'status', 'base_daily_rate']),
        ]);

        $bike->load(['category', 'currentStore', 'homeStore', 'images']);

        return response()->json([
            'success' => true,
            'data' => new BikeResource($bike),
            'message' => 'Bike updated successfully.',
        ]);
    }

    /**
     * Soft delete a bike.
     */
    public function destroy(int $id): JsonResponse
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

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Bike deleted successfully.',
        ]);
    }

    /**
     * Upload an RC, Insurance, or Emission Certificate for a bike.
     */
    public function uploadDocument(int $id, UploadBikeDocumentRequest $request): JsonResponse
    {
        $bike = Bike::findOrFail($id);
        Gate::authorize('uploadDocuments', $bike);

        $filePath = $request->file('file')->store('documents/bikes');

        $document = BikeDocument::updateOrCreate(
            [
                'bike_id' => $bike->id,
                'document_type' => $request->validated('document_type'),
            ],
            [
                'file_path' => $filePath,
                'issue_date' => $request->validated('issue_date'),
                'expiry_date' => $request->validated('expiry_date'),
                'uploaded_by' => $request->user()->id,
                'verified' => $request->boolean('verified', false),
            ]
        );

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $bike->current_store_id,
            'action' => 'bike_document_uploaded',
            'subject_type' => Bike::class,
            'subject_id' => $bike->id,
            'new_values' => [
                'document_id' => $document->id,
                'document_type' => $document->document_type instanceof BikeDocumentType ? $document->document_type->value : (string) $document->document_type,
                'verified' => (bool) $document->verified,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $document->id,
                'bike_id' => $document->bike_id,
                'document_type' => $document->document_type instanceof BikeDocumentType
                    ? $document->document_type->value
                    : (string) $document->document_type,
                'file_path' => $document->file_path,
                'issue_date' => $document->issue_date?->toDateString(),
                'expiry_date' => $document->expiry_date?->toDateString(),
                'verified' => (bool) $document->verified,
                'uploaded_by' => $document->uploaded_by,
                'created_at' => $document->created_at?->toIso8601String(),
                'updated_at' => $document->updated_at?->toIso8601String(),
            ],
            'message' => 'Bike document uploaded successfully.',
        ], 201);
    }

    /**
     * Bulk import bikes from CSV.
     */
    public function bulkImport(BulkImportBikesRequest $request): JsonResponse
    {
        Gate::authorize('bulkImport', Bike::class);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unable to read uploaded CSV file.',
                'errors' => null,
            ], 422);
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'CSV file is empty.',
                'errors' => null,
            ], 422);
        }

        // Clean and normalize header columns
        $headerMap = [];
        foreach ($header as $idx => $col) {
            $colName = strtolower(trim((string) $col));
            $headerMap[$idx] = match ($colName) {
                'reg_number', 'reg_no', 'registration' => 'registration_number',
                'category' => 'category_id',
                'current_store' => 'current_store_id',
                'home_store' => 'home_store_id',
                'model' => 'model_name',
                default => $colName,
            };
        }

        $imported = 0;
        $errors = [];
        $rowNumber = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Skip completely empty rows
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
                'next_service_due_date' => ['nullable', 'date'],
            ]);

            if ($validator->fails()) {
                $errors[] = [
                    'row' => $rowNumber,
                    'registration_number' => $row['registration_number'] ?? null,
                    'errors' => $validator->errors()->toArray(),
                ];

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

        return response()->json([
            'success' => true,
            'data' => [
                'imported_count' => $imported,
                'failed_count' => count($errors),
                'errors' => $errors,
            ],
            'message' => 'Bulk import completed.',
        ]);
    }
}

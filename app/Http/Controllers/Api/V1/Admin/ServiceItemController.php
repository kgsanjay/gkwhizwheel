<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ServiceItem;
use App\Models\ServiceItemImage;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ServiceItemController extends Controller
{
    /**
     * Ensure user is authorized for a specific store ID if provided.
     * Logs an audit record if an explicit cross-store permission was used.
     */
    protected function authorizeStoreAccess(Request $request, int $storeId, ?ServiceItem $item = null, string $operation = 'access'): void
    {
        $user = $request->user();
        $authorizedStoreIds = $user->getAuthorizedStoreIds();

        if ($authorizedStoreIds === null) {
            if ($user->role !== UserRole::SUPER_ADMIN) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'store_id' => $storeId,
                    'action' => 'cross_store_access',
                    'subject_type' => $item ? ServiceItem::class : Store::class,
                    'subject_id' => $item?->id ?? $storeId,
                    'new_values' => [
                        'operation' => $operation,
                        'target_store_id' => $storeId,
                    ],
                ]);
            }

            return;
        }

        if (! in_array($storeId, $authorizedStoreIds, true)) {
            abort(403, "Unauthorized. You are not assigned to store ID {$storeId}.");
        }
    }

    /**
     * Verify service permission for the authenticated user.
     */
    protected function authorizeServiceAccess(Request $request, string $serviceType): void
    {
        $user = $request->user();
        if ($user->role === UserRole::SUPER_ADMIN) {
            return;
        }

        if (! $user->canManageService($serviceType)) {
            abort(403, "Unauthorized. You are not assigned to manage the {$serviceType} service.");
        }
    }

    /**
     * Display a listing of service items with administrative filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->query('store_id'), null, 'list_service_items');
        }

        $query = ServiceItem::query()
            ->with([
                'images' => fn ($q) => $q->orderBy('sort_order'),
                'documents.uploader:id,name',
            ]);

        // Service Scoping: if not super admin, restrict to assigned services
        if ($user->role !== UserRole::SUPER_ADMIN) {
            $assigned = $user->assignedServicesList();
            $query->whereIn('service_type', $assigned);
        }

        if ($request->filled('service_type')) {
            $serviceType = (string) $request->query('service_type');
            $this->authorizeServiceAccess($request, $serviceType);
            $query->where('service_type', $serviceType);
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', (string) $request->query('category'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->integer('per_page', 20);
        $items = $query->orderBy('sort_order')->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
            'message' => 'Service items retrieved successfully.',
        ]);
    }

    /**
     * Display the specified service item.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->query('store_id'), null, 'show_service_item');
        }

        $item = ServiceItem::with([
            'images' => fn ($q) => $q->orderBy('sort_order'),
            'documents.uploader:id,name',
        ])->findOrFail($id);

        $this->authorizeServiceAccess($request, $item->service_type);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Service item retrieved successfully.',
        ]);
    }

    /**
     * Store a newly created service item in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_type' => ['required', 'string', 'in:two_wheelers,taxi,boating,scuba,homestay,guide,tours'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price_base' => ['required', 'numeric', 'min:0'],
            'price_unit' => ['nullable', 'string', 'max:50'],
            'capacity' => ['nullable', 'string', 'max:50'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'badge' => ['nullable', 'string', 'max:50'],
            'features' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'in:available,maintenance,booked,inactive'],
            'sort_order' => ['nullable', 'integer'],
            'store_id' => ['nullable', 'integer'],
            'primary_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:10240'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:10240'],
        ]);

        $this->authorizeServiceAccess($request, $validated['service_type']);

        if (! empty($validated['store_id'])) {
            $this->authorizeStoreAccess($request, (int) $validated['store_id'], null, 'create_service_item');
        }

        $item = DB::transaction(function () use ($validated, $request) {
            $itemData = collect($validated)->except(['primary_image', 'images', 'store_id'])->all();
            $itemData['status'] = $itemData['status'] ?? 'available';
            $itemData['price_unit'] = $itemData['price_unit'] ?? 'per_day';
            $itemData['sort_order'] = (int) ($itemData['sort_order'] ?? 0);

            $item = ServiceItem::create($itemData);

            if ($request->hasFile('primary_image')) {
                $path = $request->file('primary_image')->store('services/primary', 'public');
                ServiceItemImage::create([
                    'service_item_id' => $item->id,
                    'image_path' => $path,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
            }

            if ($request->hasFile('images')) {
                $sortIndex = $request->hasFile('primary_image') ? 1 : 0;
                foreach ($request->file('images') as $imgFile) {
                    if ($imgFile instanceof UploadedFile) {
                        $path = $imgFile->store('services/gallery', 'public');
                        ServiceItemImage::create([
                            'service_item_id' => $item->id,
                            'image_path' => $path,
                            'is_primary' => false,
                            'sort_order' => $sortIndex++,
                        ]);
                    }
                }
            }

            return $item;
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $validated['store_id'] ?? null,
            'action' => 'service_item_created',
            'subject_type' => ServiceItem::class,
            'subject_id' => $item->id,
            'new_values' => [
                'service_type' => $item->service_type,
                'name' => $item->name,
                'price_base' => (string) $item->price_base,
                'status' => $item->status,
            ],
        ]);

        $item->load(['images' => fn ($q) => $q->orderBy('sort_order'), 'documents.uploader:id,name']);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Service item created successfully.',
        ], 201);
    }

    /**
     * Update the specified service item.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $item = ServiceItem::findOrFail($id);

        $this->authorizeServiceAccess($request, $item->service_type);

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), $item, 'update_service_item');
        }

        $validated = $request->validate([
            'service_type' => ['sometimes', 'string', 'in:two_wheelers,taxi,boating,scuba,homestay,guide,tours'],
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price_base' => ['sometimes', 'numeric', 'min:0'],
            'price_unit' => ['nullable', 'string', 'max:50'],
            'capacity' => ['nullable', 'string', 'max:50'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'badge' => ['nullable', 'string', 'max:50'],
            'features' => ['nullable', 'array'],
            'status' => ['sometimes', 'string', 'in:available,maintenance,booked,inactive'],
            'sort_order' => ['nullable', 'integer'],
            'store_id' => ['nullable', 'integer'],
            'primary_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:10240'],
        ]);

        if (isset($validated['service_type']) && $validated['service_type'] !== $item->service_type) {
            $this->authorizeServiceAccess($request, $validated['service_type']);
        }

        $oldValues = $item->only(['service_type', 'name', 'price_base', 'status']);

        DB::transaction(function () use ($item, $validated, $request) {
            $itemData = collect($validated)->except(['primary_image', 'store_id'])->all();
            $item->update($itemData);

            if ($request->hasFile('primary_image')) {
                // Clear existing primary flag
                ServiceItemImage::where('service_item_id', $item->id)->update(['is_primary' => false]);

                $path = $request->file('primary_image')->store('services/primary', 'public');
                ServiceItemImage::create([
                    'service_item_id' => $item->id,
                    'image_path' => $path,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
            }
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $validated['store_id'] ?? null,
            'action' => 'service_item_updated',
            'subject_type' => ServiceItem::class,
            'subject_id' => $item->id,
            'old_values' => $oldValues,
            'new_values' => $item->fresh()->only(['service_type', 'name', 'price_base', 'status']),
        ]);

        $item->load(['images' => fn ($q) => $q->orderBy('sort_order'), 'documents.uploader:id,name']);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Service item updated successfully.',
        ]);
    }

    /**
     * Update the status of the specified service item.
     */
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $item = ServiceItem::findOrFail($id);

        $this->authorizeServiceAccess($request, $item->service_type);

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), $item, 'update_service_item_status');
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:available,maintenance,booked,inactive'],
            'store_id' => ['nullable', 'integer'],
        ]);

        $oldStatus = $item->status;
        $newStatus = $validated['status'];

        $item->update(['status' => $newStatus]);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $validated['store_id'] ?? null,
            'action' => 'service_item_status_updated',
            'subject_type' => ServiceItem::class,
            'subject_id' => $item->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
        ]);

        return response()->json([
            'success' => true,
            'data' => $item->fresh(['images' => fn ($q) => $q->orderBy('sort_order')]),
            'message' => "Service item status updated to {$newStatus}.",
        ]);
    }

    /**
     * Remove the specified service item from storage.
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $item = ServiceItem::with(['images', 'documents'])->findOrFail($id);

        $this->authorizeServiceAccess($request, $item->service_type);

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), $item, 'delete_service_item');
        }

        $oldValues = $item->only(['service_type', 'name', 'status']);

        DB::transaction(function () use ($item) {
            foreach ($item->images as $img) {
                Storage::disk('public')->delete($img->image_path);
            }
            foreach ($item->documents as $doc) {
                Storage::disk('public')->delete($doc->file_path);
            }
            $item->delete();
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $request->input('store_id'),
            'action' => 'service_item_deleted',
            'subject_type' => ServiceItem::class,
            'subject_id' => $item->id,
            'old_values' => $oldValues,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Service item deleted successfully.',
        ]);
    }
}

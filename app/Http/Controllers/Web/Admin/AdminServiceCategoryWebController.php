<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ServiceItem;
use App\Models\ServiceItemCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminServiceCategoryWebController extends Controller
{
    /**
     * Display a listing of service categories with service type switcher.
     */
    public function index(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $configs = AdminServiceWebController::getServiceConfigs();
        $allServiceKeys = array_keys($configs);

        // Determine accessible services based on user role and permissions
        $availableServices = ($user->role === UserRole::SUPER_ADMIN)
            ? $allServiceKeys
            : array_values(array_intersect($allServiceKeys, $user->assigned_services ?? ['two_wheelers']));

        if (empty($availableServices)) {
            $availableServices = ['two_wheelers'];
        }

        $serviceType = (string) $request->input('service_type', $availableServices[0]);

        if (! in_array($serviceType, $allServiceKeys, true)) {
            $serviceType = $availableServices[0];
        }

        if (! $user->canManageService($serviceType)) {
            abort(403, "Access denied. You do not have permission to manage {$serviceType} categories.");
        }

        $categories = ServiceItemCategory::where('service_type', $serviceType)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        // Calculate item counts for each category
        $itemCounts = ServiceItem::where('service_type', $serviceType)
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->groupBy('category')
            ->selectRaw('category, count(*) as count')
            ->pluck('count', 'category')
            ->all();

        $categories->each(function (ServiceItemCategory $cat) use ($itemCounts): void {
            $cat->setAttribute('items_count', $itemCounts[$cat->name] ?? 0);
        });

        // Get count of categories per service type for tab badges
        $serviceCategoryCounts = ServiceItemCategory::groupBy('service_type')
            ->selectRaw('service_type, count(*) as count')
            ->pluck('count', 'service_type')
            ->all();

        return Inertia::render('Admin/Services/Categories/Index', [
            'categories' => $categories,
            'activeServiceType' => $serviceType,
            'activeServiceConfig' => $configs[$serviceType] ?? null,
            'serviceConfigs' => $configs,
            'availableServices' => $availableServices,
            'serviceCategoryCounts' => $serviceCategoryCounts,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $allServiceKeys = array_keys(AdminServiceWebController::getServiceConfigs());

        $validated = $request->validate([
            'service_type' => ['required', 'string', 'in:'.implode(',', $allServiceKeys)],
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $serviceType = $validated['service_type'];

        if (! $user->canManageService($serviceType)) {
            abort(403, "Access denied. You do not have permission to manage {$serviceType} categories.");
        }

        $name = trim($validated['name']);

        // Check uniqueness per service type
        $exists = ServiceItemCategory::where('service_type', $serviceType)
            ->where('name', $name)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => "Category '{$name}' already exists for this service.",
            ]);
        }

        $category = ServiceItemCategory::create([
            'service_type' => $serviceType,
            'name' => $name,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'service_category.created',
            'description' => "Created category '{$category->name}' for {$serviceType}",
            'subject_type' => ServiceItemCategory::class,
            'subject_id' => (string) $category->id,
            'metadata' => [
                'service_type' => $serviceType,
                'name' => $category->name,
                'sort_order' => $category->sort_order,
            ],
        ]);

        return redirect()->route('admin.services.categories.index', ['service_type' => $serviceType])
            ->with('success', "Category '{$category->name}' created successfully.");
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $category = ServiceItemCategory::findOrFail($id);

        if (! $user->canManageService($category->service_type)) {
            abort(403, "Access denied. You do not have permission to manage {$category->service_type} categories.");
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $oldName = $category->name;
        $newName = trim($validated['name']);

        if ($newName !== $oldName) {
            $exists = ServiceItemCategory::where('service_type', $category->service_type)
                ->where('name', $newName)
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'name' => "Category '{$newName}' already exists for this service.",
                ]);
            }

            // Cascade name update to any existing items assigned to this category
            ServiceItem::where('service_type', $category->service_type)
                ->where('category', $oldName)
                ->update(['category' => $newName]);
        }

        $category->update([
            'name' => $newName,
            'sort_order' => (int) ($validated['sort_order'] ?? $category->sort_order),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'service_category.updated',
            'description' => "Updated category '{$oldName}' to '{$category->name}' for {$category->service_type}",
            'subject_type' => ServiceItemCategory::class,
            'subject_id' => (string) $category->id,
            'metadata' => [
                'service_type' => $category->service_type,
                'old_name' => $oldName,
                'new_name' => $category->name,
                'sort_order' => $category->sort_order,
            ],
        ]);

        return redirect()->route('admin.services.categories.index', ['service_type' => $category->service_type])
            ->with('success', "Category '{$category->name}' updated successfully.");
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $category = ServiceItemCategory::findOrFail($id);
        $serviceType = $category->service_type;
        $name = $category->name;

        if (! $user->canManageService($serviceType)) {
            abort(403, "Access denied. You do not have permission to manage {$serviceType} categories.");
        }

        $category->delete();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'service_category.deleted',
            'description' => "Deleted category '{$name}' for {$serviceType}",
            'subject_type' => ServiceItemCategory::class,
            'subject_id' => (string) $id,
            'metadata' => [
                'service_type' => $serviceType,
                'name' => $name,
            ],
        ]);

        return redirect()->route('admin.services.categories.index', ['service_type' => $serviceType])
            ->with('success', "Category '{$name}' deleted successfully.");
    }
}

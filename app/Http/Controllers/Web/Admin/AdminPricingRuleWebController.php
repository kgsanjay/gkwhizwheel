<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePricingRuleRequest;
use App\Http\Requests\Admin\UpdatePricingRuleRequest;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\PricingRule;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminPricingRuleWebController extends Controller
{
    /**
     * Display a listing of dynamic pricing rules with overview stats.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PricingRule::class);

        $query = PricingRule::query()->with(['bike', 'category', 'fromStore', 'toStore', 'serviceItem']);

        if ($type = $request->query('rule_type')) {
            $query->where('rule_type', $type);
        }

        if ($serviceType = $request->query('service_type')) {
            if ($serviceType === 'two_wheelers') {
                $query->where(function ($q) {
                    $q->whereNull('service_type')->orWhere('service_type', 'two_wheelers');
                });
            } else {
                $query->where('service_type', $serviceType);
            }
        }

        if ($request->has('is_active') && $request->query('is_active') !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($catId = $request->query('category_id')) {
            $query->where('category_id', (int) $catId);
        }

        $rules = $query->orderByDesc('priority')->orderByDesc('id')->get();

        // Calculate summary statistics
        $allRules = PricingRule::query();
        $stats = [
            'total' => (clone $allRules)->count(),
            'active' => (clone $allRules)->where('is_active', true)->count(),
            'weekend' => (clone $allRules)->where('rule_type', PricingRuleType::WEEKEND)->count(),
            'holiday' => (clone $allRules)->where('rule_type', PricingRuleType::HOLIDAY)->count(),
            'seasonal' => (clone $allRules)->where('rule_type', PricingRuleType::SEASONAL)->count(),
            'one_way' => (clone $allRules)->where('rule_type', PricingRuleType::ONE_WAY_FEE)->count(),
            'services_count' => (clone $allRules)->whereNotNull('service_type')->where('service_type', '!=', 'two_wheelers')->count(),
        ];

        $serviceItems = \App\Models\ServiceItem::orderBy('service_type')
            ->orderBy('name')
            ->get(['id', 'name', 'service_type', 'price_base']);

        return Inertia::render('Admin/Pricing/Index', [
            'rules' => $rules->map(fn (PricingRule $rule): array => [
                'id' => $rule->id,
                'name' => $rule->name,
                'service_type' => $rule->service_type,
                'service_item_id' => $rule->service_item_id,
                'service_item' => $rule->serviceItem ? [
                    'id' => $rule->serviceItem->id,
                    'name' => $rule->serviceItem->name,
                    'service_type' => $rule->serviceItem->service_type,
                    'price_base' => (float) $rule->serviceItem->price_base,
                ] : null,
                'rule_type' => $rule->rule_type instanceof PricingRuleType ? $rule->rule_type->value : (string) $rule->rule_type,
                'rate_type' => $rule->rate_type instanceof PricingRateType ? $rule->rate_type->value : (string) $rule->rate_type,
                'value' => (float) $rule->value,
                'day_of_week' => $rule->day_of_week,
                'date_start' => $rule->date_start?->toDateString(),
                'date_end' => $rule->date_end?->toDateString(),
                'priority' => $rule->priority ?? 0,
                'is_active' => (bool) $rule->is_active,
                'bike_id' => $rule->bike_id,
                'bike' => $rule->bike ? [
                    'id' => $rule->bike->id,
                    'brand' => $rule->bike->brand,
                    'model_name' => $rule->bike->model_name,
                    'registration_number' => $rule->bike->registration_number,
                ] : null,
                'category_id' => $rule->category_id,
                'category' => $rule->category ? [
                    'id' => $rule->category->id,
                    'name' => $rule->category->name,
                ] : null,
                'from_store_id' => $rule->from_store_id,
                'from_store' => $rule->fromStore ? [
                    'id' => $rule->fromStore->id,
                    'name' => $rule->fromStore->name,
                    'city' => $rule->fromStore->city,
                ] : null,
                'to_store_id' => $rule->to_store_id,
                'to_store' => $rule->toStore ? [
                    'id' => $rule->toStore->id,
                    'name' => $rule->toStore->name,
                    'city' => $rule->toStore->city,
                ] : null,
                'created_at' => $rule->created_at?->toIso8601String(),
            ]),
            'categories' => BikeCategory::orderBy('name')->get(['id', 'name', 'base_daily_rate']),
            'stores' => Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get(['id', 'name', 'city']),
            'bikes' => Bike::orderBy('brand')->orderBy('model_name')->get(['id', 'brand', 'model_name', 'registration_number']),
            'service_items' => $serviceItems,
            'rule_types' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => match ($case) {
                    PricingRuleType::WEEKEND => 'Weekend Surge',
                    PricingRuleType::HOLIDAY => 'Holiday Surge',
                    PricingRuleType::SEASONAL => 'Seasonal Surge',
                    PricingRuleType::ONE_WAY_FEE => 'One-Way Relocation Fee',
                },
            ], PricingRuleType::cases()),
            'rate_types' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => match ($case) {
                    PricingRateType::PERCENTAGE => 'Percentage (+%)',
                    PricingRateType::FIXED_OVERRIDE => 'Fixed Rate Override (₹)',
                    PricingRateType::FLAT_ADDON => 'Flat Add-on (₹)',
                },
            ], PricingRateType::cases()),
            'stats' => $stats,
            'filters' => [
                'rule_type' => $request->query('rule_type', ''),
                'service_type' => $request->query('service_type', ''),
                'is_active' => $request->query('is_active', ''),
                'category_id' => $request->query('category_id', ''),
            ],
        ]);
    }

    /**
     * Store a newly created pricing rule.
     */
    public function store(StorePricingRuleRequest $request): RedirectResponse
    {
        Gate::authorize('create', PricingRule::class);

        $validated = $request->validated();
        if (! isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $rule = PricingRule::create($validated);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $rule->from_store_id ?? $rule->to_store_id,
            'action' => 'pricing_rule_created',
            'subject_type' => PricingRule::class,
            'subject_id' => $rule->id,
            'new_values' => $rule->toArray(),
        ]);

        return redirect()->route('admin.pricing.index')
            ->with('success', 'Dynamic pricing rule created successfully.');
    }

    /**
     * Update the specified pricing rule.
     */
    public function update(int $id, UpdatePricingRuleRequest $request): RedirectResponse
    {
        $rule = PricingRule::findOrFail($id);
        Gate::authorize('update', $rule);

        $oldValues = $rule->toArray();
        $rule->update($request->validated());

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $rule->from_store_id ?? $rule->to_store_id,
            'action' => 'pricing_rule_updated',
            'subject_type' => PricingRule::class,
            'subject_id' => $rule->id,
            'old_values' => $oldValues,
            'new_values' => $rule->fresh()->toArray(),
        ]);

        return redirect()->route('admin.pricing.index')
            ->with('success', 'Pricing rule updated successfully.');
    }

    /**
     * Toggle the active state of a pricing rule.
     */
    public function toggle(int $id): RedirectResponse
    {
        $rule = PricingRule::findOrFail($id);
        Gate::authorize('update', $rule);

        $oldStatus = (bool) $rule->is_active;
        $rule->update(['is_active' => ! $rule->is_active]);

        ActivityLog::create([
            'user_id' => request()->user()?->id,
            'store_id' => $rule->from_store_id ?? $rule->to_store_id,
            'action' => 'pricing_rule_toggled',
            'subject_type' => PricingRule::class,
            'subject_id' => $rule->id,
            'old_values' => ['is_active' => $oldStatus],
            'new_values' => ['is_active' => (bool) $rule->is_active],
        ]);

        $statusMsg = $rule->is_active ? 'activated' : 'deactivated';

        return redirect()->route('admin.pricing.index')
            ->with('success', "Pricing rule {$statusMsg} successfully.");
    }

    /**
     * Remove the specified pricing rule.
     */
    public function destroy(int $id): RedirectResponse
    {
        $rule = PricingRule::findOrFail($id);
        Gate::authorize('delete', $rule);

        $oldValues = $rule->toArray();
        $rule->delete();

        ActivityLog::create([
            'user_id' => request()->user()?->id,
            'store_id' => $rule->from_store_id ?? $rule->to_store_id,
            'action' => 'pricing_rule_deleted',
            'subject_type' => PricingRule::class,
            'subject_id' => $rule->id,
            'old_values' => $oldValues,
        ]);

        return redirect()->route('admin.pricing.index')
            ->with('success', 'Pricing rule removed successfully.');
    }

    /**
     * Simulate quote calculation for bikes or travel services.
     */
    public function simulateQuote(Request $request, \App\Services\PricingService $pricingService): \Illuminate\Http\JsonResponse
    {
        Gate::authorize('viewAny', PricingRule::class);

        $domain = $request->input('domain');
        if (empty($domain)) {
            $domain = ($request->filled('service_type') || $request->filled('service_item_id')) ? 'service' : 'bike';
            $request->merge(['domain' => $domain]);
        }

        if (! $request->filled('start_date') && $request->filled('travel_date')) {
            $request->merge(['start_date' => $request->input('travel_date')]);
        }

        $validated = $request->validate([
            'domain' => ['required', 'string', 'in:bike,service'],
            'service_type' => ['nullable', 'string'],
            'service_item_id' => ['nullable', 'integer'],
            'bike_id' => ['nullable', 'integer'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        if ($validated['domain'] === 'service') {
            $item = null;
            if (! empty($validated['service_item_id'])) {
                $item = \App\Models\ServiceItem::find($validated['service_item_id']);
            }
            if (! $item && ! empty($validated['service_type'])) {
                $item = \App\Models\ServiceItem::where('service_type', $validated['service_type'])->first();
            }

            if (! $item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service item not found.',
                ], 404);
            }

            $quote = $pricingService->calculateServiceQuote(
                $item->service_type,
                $item,
                $validated['start_date'],
                (int) ($validated['quantity'] ?? 1)
            );

            return response()->json([
                'success' => true,
                'quote' => $quote,
            ]);
        }

        $bike = ! empty($validated['bike_id'])
            ? Bike::with(['category', 'currentStore'])->find($validated['bike_id'])
            : Bike::with(['category', 'currentStore'])->first();

        if (! $bike) {
            return response()->json([
                'success' => false,
                'message' => 'No fleet bike available.',
            ], 404);
        }

        $store = $bike->currentStore ?? Store::first();
        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'] ?? $validated['start_date'];

        $quote = $pricingService->calculateQuote(
            $bike,
            $startDate,
            $endDate,
            $store,
            $store
        );

        return response()->json([
            'success' => true,
            'quote' => $quote,
        ]);
    }
}

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

        $query = PricingRule::query()->with(['bike', 'category', 'fromStore', 'toStore']);

        if ($type = $request->query('rule_type')) {
            $query->where('rule_type', $type);
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
        ];

        return Inertia::render('Admin/Pricing/Index', [
            'rules' => $rules->map(fn (PricingRule $rule): array => [
                'id' => $rule->id,
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
                    PricingRateType::FIXED_OVERRIDE => 'Fixed Daily Override (₹)',
                    PricingRateType::FLAT_ADDON => 'Flat Add-on (₹)',
                },
            ], PricingRateType::cases()),
            'stats' => $stats,
            'filters' => [
                'rule_type' => $request->query('rule_type', ''),
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
}

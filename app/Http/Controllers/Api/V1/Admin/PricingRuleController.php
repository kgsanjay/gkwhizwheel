<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePricingRuleRequest;
use App\Http\Requests\Admin\UpdatePricingRuleRequest;
use App\Http\Resources\PricingRuleResource;
use App\Models\ActivityLog;
use App\Models\PricingRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PricingRuleController extends Controller
{
    /**
     * Display a listing of pricing rules, optionally filtered by bike, category, rule type, or active status.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', PricingRule::class);

        $query = PricingRule::query()->with(['bike', 'category', 'fromStore', 'toStore']);

        if ($request->filled('bike_id')) {
            $query->where('bike_id', $request->query('bike_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('rule_type')) {
            $query->where('rule_type', $request->query('rule_type'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $rules = $query->orderByDesc('priority')->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data' => PricingRuleResource::collection($rules),
            'message' => 'Pricing rules retrieved successfully.',
        ]);
    }

    /**
     * Store a newly created pricing rule.
     */
    public function store(StorePricingRuleRequest $request): JsonResponse
    {
        Gate::authorize('create', PricingRule::class);

        $rule = PricingRule::create($request->validated());
        $rule->load(['bike', 'category', 'fromStore', 'toStore']);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $rule->from_store_id ?? $rule->to_store_id,
            'action' => 'pricing_rule_created',
            'subject_type' => PricingRule::class,
            'subject_id' => $rule->id,
            'new_values' => $rule->toArray(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new PricingRuleResource($rule),
            'message' => 'Pricing rule created successfully.',
        ], 201);
    }

    /**
     * Display the specified pricing rule.
     */
    public function show(int $id): JsonResponse
    {
        $rule = PricingRule::with(['bike', 'category', 'fromStore', 'toStore'])->findOrFail($id);
        Gate::authorize('view', $rule);

        return response()->json([
            'success' => true,
            'data' => new PricingRuleResource($rule),
            'message' => 'Pricing rule retrieved successfully.',
        ]);
    }

    /**
     * Update the specified pricing rule.
     */
    public function update(int $id, UpdatePricingRuleRequest $request): JsonResponse
    {
        $rule = PricingRule::findOrFail($id);
        Gate::authorize('update', $rule);

        $oldValues = $rule->toArray();
        $rule->update($request->validated());
        $rule->load(['bike', 'category', 'fromStore', 'toStore']);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'store_id' => $rule->from_store_id ?? $rule->to_store_id,
            'action' => 'pricing_rule_updated',
            'subject_type' => PricingRule::class,
            'subject_id' => $rule->id,
            'old_values' => $oldValues,
            'new_values' => $rule->fresh()->toArray(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new PricingRuleResource($rule),
            'message' => 'Pricing rule updated successfully.',
        ]);
    }

    /**
     * Remove the specified pricing rule.
     */
    public function destroy(int $id): JsonResponse
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

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Pricing rule deleted successfully.',
        ]);
    }
}

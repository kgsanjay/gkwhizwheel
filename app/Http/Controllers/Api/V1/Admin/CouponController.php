<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Requests\Admin\UpdateCouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\ActivityLog;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CouponController extends Controller
{
    /**
     * Display a listing of coupons, optionally filtered by active status or code.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Coupon::class);

        $query = Coupon::query()->withCount('usages');

        if ($request->filled('code')) {
            $query->where('code', 'like', '%'.strtoupper(trim($request->query('code'))).'%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $coupons = $query->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data' => CouponResource::collection($coupons),
            'message' => 'Coupons retrieved successfully.',
        ]);
    }

    /**
     * Store a newly created coupon.
     */
    public function store(StoreCouponRequest $request): JsonResponse
    {
        Gate::authorize('create', Coupon::class);

        $coupon = Coupon::create($request->validated());
        $coupon->loadCount('usages');

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'coupon_created',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'new_values' => $coupon->toArray(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new CouponResource($coupon),
            'message' => 'Coupon created successfully.',
        ], 201);
    }

    /**
     * Display the specified coupon.
     */
    public function show(int $id): JsonResponse
    {
        $coupon = Coupon::withCount('usages')->findOrFail($id);
        Gate::authorize('view', $coupon);

        return response()->json([
            'success' => true,
            'data' => new CouponResource($coupon),
            'message' => 'Coupon retrieved successfully.',
        ]);
    }

    /**
     * Update the specified coupon.
     */
    public function update(int $id, UpdateCouponRequest $request): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        Gate::authorize('update', $coupon);

        $oldValues = $coupon->toArray();
        $coupon->update($request->validated());
        $coupon->loadCount('usages');

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'coupon_updated',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'old_values' => $oldValues,
            'new_values' => $coupon->fresh()->toArray(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new CouponResource($coupon),
            'message' => 'Coupon updated successfully.',
        ]);
    }

    /**
     * Remove the specified coupon.
     */
    public function destroy(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        Gate::authorize('delete', $coupon);

        $oldValues = $coupon->toArray();
        $coupon->delete();

        ActivityLog::create([
            'user_id' => request()->user()?->id,
            'action' => 'coupon_deleted',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'old_values' => $oldValues,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Coupon deleted successfully.',
        ]);
    }
}

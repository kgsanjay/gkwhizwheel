<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\DiscountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Requests\Admin\UpdateCouponRequest;
use App\Models\ActivityLog;
use App\Models\Coupon;
use App\Models\CouponUsage;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminCouponWebController extends Controller
{
    /**
     * Display a listing of discount coupons with usage metrics.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Coupon::class);

        $query = Coupon::query()->withCount('usages');

        if ($code = $request->query('code')) {
            $query->where('code', 'like', '%'.strtoupper(trim($code)).'%');
        }

        $today = Carbon::today()->toDateString();

        if ($status = $request->query('status')) {
            if ($status === 'active') {
                $query->where('is_active', true)->where('valid_until', '>=', $today);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'expired') {
                $query->where('valid_until', '<', $today);
            }
        }

        $coupons = $query->orderByDesc('id')->get();

        // Calculate coupon performance stats
        $allCoupons = Coupon::query();
        $stats = [
            'total' => (clone $allCoupons)->count(),
            'active' => (clone $allCoupons)->where('is_active', true)->where('valid_until', '>=', $today)->count(),
            'expired' => (clone $allCoupons)->where('valid_until', '<', $today)->count(),
            'total_redemptions' => CouponUsage::count(),
        ];

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons->map(function (Coupon $coupon) use ($today): array {
                $isExpired = $coupon->valid_until !== null && $coupon->valid_until->toDateString() < $today;
                $isUpcoming = $coupon->valid_from !== null && $coupon->valid_from->toDateString() > $today;

                return [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'discount_type' => $coupon->discount_type instanceof DiscountType ? $coupon->discount_type->value : (string) $coupon->discount_type,
                    'value' => (float) $coupon->value,
                    'max_uses_total' => $coupon->max_uses_total,
                    'max_uses_per_user' => $coupon->max_uses_per_user,
                    'valid_from' => $coupon->valid_from?->toDateString(),
                    'valid_until' => $coupon->valid_until?->toDateString(),
                    'is_active' => (bool) $coupon->is_active,
                    'usages_count' => (int) $coupon->usages_count,
                    'is_expired' => $isExpired,
                    'is_upcoming' => $isUpcoming,
                    'created_at' => $coupon->created_at?->toIso8601String(),
                ];
            }),
            'discount_types' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => match ($case) {
                    DiscountType::PERCENTAGE => 'Percentage Discount (%)',
                    DiscountType::FIXED => 'Fixed Amount Discount (₹)',
                },
            ], DiscountType::cases()),
            'stats' => $stats,
            'filters' => [
                'code' => $request->query('code', ''),
                'status' => $request->query('status', ''),
            ],
        ]);
    }

    /**
     * Store a newly created coupon.
     */
    public function store(StoreCouponRequest $request): RedirectResponse
    {
        Gate::authorize('create', Coupon::class);

        $validated = $request->validated();
        if (! isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $coupon = Coupon::create($validated);

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'coupon_created',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'new_values' => $coupon->toArray(),
        ]);

        return redirect()->route('admin.coupons.index')
            ->with('success', "Coupon {$coupon->code} created successfully.");
    }

    /**
     * Update the specified coupon.
     */
    public function update(int $id, UpdateCouponRequest $request): RedirectResponse
    {
        $coupon = Coupon::findOrFail($id);
        Gate::authorize('update', $coupon);

        $oldValues = $coupon->toArray();
        $coupon->update($request->validated());

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'coupon_updated',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'old_values' => $oldValues,
            'new_values' => $coupon->fresh()->toArray(),
        ]);

        return redirect()->route('admin.coupons.index')
            ->with('success', "Coupon {$coupon->code} updated successfully.");
    }

    /**
     * Toggle the active state of a coupon.
     */
    public function toggle(int $id): RedirectResponse
    {
        $coupon = Coupon::findOrFail($id);
        Gate::authorize('update', $coupon);

        $oldStatus = (bool) $coupon->is_active;
        $coupon->update(['is_active' => ! $coupon->is_active]);

        ActivityLog::create([
            'user_id' => request()->user()?->id,
            'action' => 'coupon_toggled',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'old_values' => ['is_active' => $oldStatus],
            'new_values' => ['is_active' => (bool) $coupon->is_active],
        ]);

        $statusMsg = $coupon->is_active ? 'activated' : 'deactivated';

        return redirect()->route('admin.coupons.index')
            ->with('success', "Coupon {$coupon->code} {$statusMsg} successfully.");
    }

    /**
     * Remove the specified coupon.
     */
    public function destroy(int $id): RedirectResponse
    {
        $coupon = Coupon::findOrFail($id);
        Gate::authorize('delete', $coupon);

        $code = $coupon->code;
        $oldValues = $coupon->toArray();
        $coupon->delete();

        ActivityLog::create([
            'user_id' => request()->user()?->id,
            'action' => 'coupon_deleted',
            'subject_type' => Coupon::class,
            'subject_id' => $coupon->id,
            'old_values' => $oldValues,
        ]);

        return redirect()->route('admin.coupons.index')
            ->with('success', "Coupon {$code} removed successfully.");
    }
}

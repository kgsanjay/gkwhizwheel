<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Coupon;
use App\Models\User;

class CouponPolicy
{
    /**
     * Determine whether the user can manage coupons in general.
     */
    public function manage(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, Coupon $coupon): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            if ($coupon->store_id === null) {
                return true; // Can view global coupons
            }

            return in_array((int) $coupon->store_id, $user->accessibleStoreIds(), true);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, Coupon $coupon): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            if ($coupon->store_id === null) {
                return false; // Cannot edit global coupons
            }

            return in_array((int) $coupon->store_id, $user->accessibleStoreIds(), true);
        }

        return false;
    }

    public function delete(User $user, Coupon $coupon): bool
    {
        return $this->update($user, $coupon);
    }
}

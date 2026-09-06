<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Coupon;
use App\Models\User;

class CouponPolicy
{
    /**
     * Determine whether the user can manage coupons (admin only).
     */
    public function manage(User $user): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        try {
            return $user->hasRole('super_admin') || $user->hasRole('admin');
        } catch (\Throwable) {
            return false;
        }
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, Coupon $coupon): bool
    {
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, Coupon $coupon): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, Coupon $coupon): bool
    {
        return $this->manage($user);
    }
}

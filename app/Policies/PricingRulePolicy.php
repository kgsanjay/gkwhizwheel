<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PricingRule;
use App\Models\User;

class PricingRulePolicy
{
    /**
     * Determine whether the user can manage pricing rules (admin only).
     */
    public function manage(User $user): bool
    {
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return true;
        }

        try {
            return $user->hasRole('super_admin') || $user->hasRole('admin') || $user->hasRole('store_manager');
        } catch (\Throwable) {
            return false;
        }
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, PricingRule $pricingRule): bool
    {
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, PricingRule $pricingRule): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, PricingRule $pricingRule): bool
    {
        return $this->manage($user);
    }
}

<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PricingRule;
use App\Models\User;

class PricingRulePolicy
{
    /**
     * Determine whether the user can manage pricing rules in general.
     */
    public function manage(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, PricingRule $pricingRule): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $storeId = $pricingRule->store_id ?? $pricingRule->from_store_id;
            if ($storeId === null) {
                return true; // Can view global rules
            }

            return in_array((int) $storeId, $user->accessibleStoreIds(), true);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, PricingRule $pricingRule): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $storeId = $pricingRule->store_id ?? $pricingRule->from_store_id;
            if ($storeId === null) {
                return false; // Cannot edit global rules
            }

            return in_array((int) $storeId, $user->accessibleStoreIds(), true);
        }

        return false;
    }

    public function delete(User $user, PricingRule $pricingRule): bool
    {
        return $this->update($user, $pricingRule);
    }
}

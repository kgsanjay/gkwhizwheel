<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Store;
use App\Models\User;

class StorePolicy
{
    /**
     * Determine whether the user can manage stores in general.
     */
    public function manage(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    /**
     * Store creation is strictly restricted to the SuperAdmin role.
     */
    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, Store $store): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return in_array($store->id, $user->accessibleStoreIds(), true);
        }

        return false;
    }

    public function update(User $user, Store $store): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return in_array($store->id, $user->accessibleStoreIds(), true);
        }

        return false;
    }

    /**
     * Toggling the Branch-Service Matrix is strictly restricted to SuperAdmin.
     */
    public function updateServices(User $user, Store $store): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Store deletion is strictly restricted to SuperAdmin.
     */
    public function delete(User $user, Store $store): bool
    {
        return $user->isSuperAdmin();
    }
}

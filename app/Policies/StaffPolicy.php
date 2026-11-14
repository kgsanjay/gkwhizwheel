<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class StaffPolicy
{
    /**
     * Determine whether the user can manage staff accounts and store assignments in general.
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

    public function view(User $user, User $staff): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            if ($staff->isSuperAdmin()) {
                return false;
            }
            if ($staff->isAdmin() && $staff->id !== $user->id) {
                return false;
            }

            return $staff->stores()->whereIn('stores.id', $user->accessibleStoreIds())->exists()
                || $staff->id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, User $staff): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            // Branch admin cannot modify superadmin or other admin accounts
            if ($staff->isSuperAdmin() || ($staff->isAdmin() && $staff->id !== $user->id)) {
                return false;
            }

            return $staff->stores()->whereIn('stores.id', $user->accessibleStoreIds())->exists();
        }

        return false;
    }

    public function delete(User $user, User $staff): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            // Branch admin cannot delete superadmin or admin accounts
            if ($staff->isSuperAdmin() || $staff->isAdmin()) {
                return false;
            }

            return $staff->stores()->whereIn('stores.id', $user->accessibleStoreIds())->exists();
        }

        return false;
    }

    public function assignStores(User $user, User $staff): bool
    {
        return $this->update($user, $staff);
    }

    public function unassignStores(User $user, User $staff): bool
    {
        return $this->update($user, $staff);
    }
}

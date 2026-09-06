<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;

class StorePolicy
{
    /**
     * Determine whether the user can manage stores in general.
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

    /**
     * Store creation is strictly restricted to the super_admin role.
     * Per 01-REQUIREMENTS-AND-FEATURES.md Section 6.
     */
    public function create(User $user): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        try {
            return $user->hasRole('super_admin');
        } catch (\Throwable) {
            return false;
        }
    }

    public function viewAny(User $user): bool
    {
        return $this->manage($user);
    }

    public function view(User $user, Store $store): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, Store $store): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, Store $store): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        try {
            return $user->hasRole('super_admin');
        } catch (\Throwable) {
            return false;
        }
    }
}

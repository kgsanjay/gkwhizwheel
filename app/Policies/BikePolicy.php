<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Bike;
use App\Models\User;

class BikePolicy
{
    /**
     * Determine whether the user can manage bikes (admin only).
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

    public function view(User $user, Bike $bike): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin() || $user->isManager()) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            // Physical branch ownership governs bike-level access. The nominal
            // home branch cannot edit a bike currently assigned elsewhere.
            return in_array($bike->current_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, ?Bike $bike = null): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            if ($bike === null) {
                return true;
            }
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            // Physical branch ownership governs bike-level access. The nominal
            // home branch cannot edit a bike currently assigned elsewhere.
            return in_array($bike->current_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function delete(User $user, ?Bike $bike = null): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            if ($bike === null) {
                return true;
            }
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            // Physical branch ownership governs bike-level access. The nominal
            // home branch cannot edit a bike currently assigned elsewhere.
            return in_array($bike->current_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function uploadDocuments(User $user, Bike $bike): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            // Physical branch ownership governs bike-level access. The nominal
            // home branch cannot edit a bike currently assigned elsewhere.
            return in_array($bike->current_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function bulkImport(User $user): bool
    {
        return $this->manage($user);
    }
}

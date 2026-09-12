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
        if (in_array($user->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER], true)) {
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
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if (in_array($user->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            return empty($userStoreIds)
                || in_array($bike->current_store_id, $userStoreIds, true)
                || in_array($bike->home_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, Bike $bike): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            return empty($userStoreIds)
                || in_array($bike->current_store_id, $userStoreIds, true)
                || in_array($bike->home_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function delete(User $user, Bike $bike): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            return empty($userStoreIds)
                || in_array($bike->current_store_id, $userStoreIds, true)
                || in_array($bike->home_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function uploadDocuments(User $user, Bike $bike): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            return empty($userStoreIds)
                || in_array($bike->current_store_id, $userStoreIds, true)
                || in_array($bike->home_store_id, $userStoreIds, true);
        }

        return false;
    }

    public function bulkImport(User $user): bool
    {
        return $this->manage($user);
    }
}

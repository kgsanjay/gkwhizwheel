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
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, Bike $bike): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, Bike $bike): bool
    {
        return $this->manage($user);
    }

    public function uploadDocuments(User $user, Bike $bike): bool
    {
        return $this->manage($user);
    }

    public function bulkImport(User $user): bool
    {
        return $this->manage($user);
    }
}

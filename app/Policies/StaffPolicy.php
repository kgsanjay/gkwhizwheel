<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class StaffPolicy
{
    /**
     * Determine whether the user can manage staff accounts and store assignments.
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

    public function view(User $user, User $staff): bool
    {
        return $this->manage($user);
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, User $staff): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, User $staff): bool
    {
        return $this->manage($user);
    }

    public function assignStores(User $user, User $staff): bool
    {
        return $this->manage($user);
    }

    public function unassignStores(User $user, User $staff): bool
    {
        return $this->manage($user);
    }
}

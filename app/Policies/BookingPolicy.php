<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    /**
     * Determine whether the user can view any bookings.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [
            UserRole::SUPER_ADMIN,
            UserRole::STORE_MANAGER,
            UserRole::STAFF,
        ], true);
    }

    /**
     * Determine whether the user can view the specific booking.
     */
    public function view(User $user, Booking $booking): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if (in_array($user->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            return empty($userStoreIds)
                || in_array($booking->pickup_store_id, $userStoreIds, true)
                || in_array($booking->return_store_id, $userStoreIds, true);
        }

        return $booking->user_id === $user->id;
    }

    /**
     * Determine whether the user can manually update the booking.
     */
    public function update(User $user, Booking $booking): bool
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();

            return empty($userStoreIds)
                || in_array($booking->pickup_store_id, $userStoreIds, true)
                || in_array($booking->return_store_id, $userStoreIds, true);
        }

        return false;
    }

    /**
     * Determine whether the user can process a refund for the booking.
     */
    public function processRefund(User $user, Booking $booking): bool
    {
        return in_array($user->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER], true);
    }
}

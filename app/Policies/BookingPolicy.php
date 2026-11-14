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
        return $user->isStaffOrAdmin();
    }

    /**
     * Determine whether the user can view the specific booking.
     */
    public function view(User $user, Booking $booking): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isStaffOrAdmin()) {
            $userStoreIds = $user->accessibleStoreIds();

            return in_array((int) $booking->pickup_store_id, $userStoreIds, true)
                || in_array((int) $booking->return_store_id, $userStoreIds, true);
        }

        return $booking->user_id === $user->id;
    }

    /**
     * Determine whether the user can manually update the booking.
     */
    public function update(User $user, Booking $booking): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $userStoreIds = $user->accessibleStoreIds();

            return in_array((int) $booking->pickup_store_id, $userStoreIds, true)
                || in_array((int) $booking->return_store_id, $userStoreIds, true);
        }

        return false;
    }

    /**
     * Determine whether the user can process a refund for the booking.
     */
    public function processRefund(User $user, Booking $booking): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $userStoreIds = $user->accessibleStoreIds();

            return in_array((int) $booking->pickup_store_id, $userStoreIds, true)
                || in_array((int) $booking->return_store_id, $userStoreIds, true);
        }

        return false;
    }

    /**
     * Determine whether the user can perform bike handover.
     */
    public function handover(User $user, Booking $booking): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isStaffOrAdmin()) {
            $userStoreIds = $user->accessibleStoreIds();

            // Handover is performed by staff assigned to the pickup branch,
            // not merely by someone assigned to the future return branch.
            return in_array((int) $booking->pickup_store_id, $userStoreIds, true);
        }

        return false;
    }

    /**
     * Determine whether the user can process bike return.
     */
    public function processReturn(User $user, Booking $booking): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isStaffOrAdmin()) {
            $userStoreIds = $user->accessibleStoreIds();

            return in_array((int) $booking->pickup_store_id, $userStoreIds, true)
                || in_array((int) $booking->return_store_id, $userStoreIds, true);
        }

        return false;
    }
}


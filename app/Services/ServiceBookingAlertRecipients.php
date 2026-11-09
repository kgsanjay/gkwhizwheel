<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * Route booking customer details only to managers assigned to the booking's
 * actual branch and service. Headquarters is the fallback if none are eligible.
 */
final class ServiceBookingAlertRecipients
{
    /** @return Collection<int, User> */
    public function forBooking(ServiceBooking $booking): Collection
    {
        $managers = User::query()
            ->where('role', UserRole::STORE_MANAGER)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('stores', function ($query) use ($booking): void {
                $query->where('stores.id', $booking->store_id);
            })
            ->whereHas('assignedServices', function ($query) use ($booking): void {
                $query->where('service_type', $booking->service_type);
            })
            ->get();

        if ($managers->isNotEmpty()) {
            return $managers;
        }

        return User::query()
            ->where('role', UserRole::SUPER_ADMIN)
            ->where('status', UserStatus::ACTIVE)
            ->get();
    }
}

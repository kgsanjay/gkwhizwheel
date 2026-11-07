<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PickupPoint;
use App\Enums\BookingChannel;
use Illuminate\Validation\ValidationException;

class BookingPickupPoints
{
    /**
     * Only active points belonging to the selected operational branch are allowed.
     * Existing API integrations may still omit points (nullable legacy fields).
     * Hotel/custom locations always require a customer-provided address.
     */
    public function resolve(array $params): array
    {
        $result = [
            'pickup_point_id' => null,
            'return_point_id' => null,
            'pickup_location_details' => null,
            'return_location_details' => null,
        ];
        $channel = $params['channel'] ?? null;
        $isOnline = $channel instanceof BookingChannel
            ? $channel === BookingChannel::ONLINE : $channel === BookingChannel::ONLINE->value;

        foreach (['pickup' => 'pickup_store_id', 'return' => 'return_store_id'] as $kind => $branchField) {
            $id = $params[$kind.'_point_id'] ?? null;
            // When a branch has selectable points, online checkout must not
            // omit them to evade pickup/return tariffs. Preserve legacy
            // integrations in branches not yet configured with any points.
            if ($isOnline && ($id === null || $id === '')
                && PickupPoint::query()
                    ->where('store_id', (int) $params[$branchField])
                    ->where('is_active', true)
                    ->where('supports_'.$kind, true)->exists()) {
                throw ValidationException::withMessages([
                    $kind.'_point_id' => 'Select your '.$kind.' location to calculate the verified fee.',
                ]);
            }
            $details = trim((string) ($params[$kind.'_location_details'] ?? ''));
            if ($id === null || $id === '') {
                if ($details !== '') {
                    throw ValidationException::withMessages([$kind.'_point_id' => 'Select a '.$kind.' point before adding location details.']);
                }
                continue;
            }
            $point = PickupPoint::query()->whereKey((int) $id)
                ->where('store_id', (int) $params[$branchField])
                ->where('is_active', true)->first();
            if (! $point || ! $point->{'supports_'.$kind}) {
                throw ValidationException::withMessages([$kind.'_point_id' => 'Select an active '.$kind.' point from the chosen branch.']);
            }
            if ($point->slug === 'hotel-delivery' && mb_strlen($details) < 5) {
                throw ValidationException::withMessages([$kind.'_location_details' => 'Provide the hotel name and meeting address.']);
            }
            if ($point->slug !== 'hotel-delivery' && $details !== '') {
                throw ValidationException::withMessages([$kind.'_location_details' => 'Additional location details are only accepted for hotel/custom pickup points.']);
            }
            $result[$kind.'_point_id'] = $point->id;
            $result[$kind.'_location_details'] = $details !== '' ? $details : null;
        }
        return $result;
    }

    public function sameAsBooking(\App\Models\Booking $booking, array $params): bool
    {
        foreach (['pickup', 'return'] as $kind) {
            if ((int) ($booking->{$kind.'_point_id'} ?? 0) !== (int) ($params[$kind.'_point_id'] ?? 0)
                || (string) ($booking->{$kind.'_location_details'} ?? '') !== trim((string) ($params[$kind.'_location_details'] ?? ''))) {
                return false;
            }
        }
        return true;
    }
}

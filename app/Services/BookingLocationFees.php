<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PickupPoint;
use Illuminate\Validation\ValidationException;

/**
 * Independent per-location fees for pickup and return, separate from the
 * existing directional one-way branch relocation fee.
 */
class BookingLocationFees
{
    /**
     * @return array{pickup_fee_amount:float,return_fee_amount:float,location_fee_amount:float}
     */
    public function forSelection(array $selection): array
    {
        $charges = ['pickup_fee_amount' => 0.0, 'return_fee_amount' => 0.0];
        foreach (['pickup', 'return'] as $direction) {
            $id = $selection[$direction.'_point_id'] ?? null;
            if ($id === null) {
                continue; // Preserve existing legacy bike bookings without a location.
            }
            $point = PickupPoint::findOrFail((int) $id);
            $column = $direction.'_fee';
            if ($point->{$column} === null) {
                throw ValidationException::withMessages([
                    $direction.'_point_id' => ucfirst($direction).' fee for '.$point->name
                        .' is not configured yet. Please contact the branch before paying.',
                ]);
            }
            $charges[$direction.'_fee_amount'] = round((float) $point->{$column}, 2);
        }
        return [
            ...$charges,
            'location_fee_amount' => round($charges['pickup_fee_amount'] + $charges['return_fee_amount'], 2),
        ];
    }
}

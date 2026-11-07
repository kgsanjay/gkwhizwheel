<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Bike;
use App\Models\BranchBikeModelPrice;

/**
 * Branch + model rates override the old unit/category tariff without changing
 * existing inventory or booking snapshots. No row means legacy rates apply.
 */
class BranchBikePricing
{
    public function rates(Bike $bike, int $pickupStoreId): array
    {
        $price = $bike->bike_model_id
            ? BranchBikeModelPrice::query()
                ->where('store_id', $pickupStoreId)
                ->where('bike_model_id', $bike->bike_model_id)
                ->first()
            : null;

        $weekday = $price !== null
            ? (float) $price->weekday_rate
            : (float) ($bike->base_daily_rate_override ?? $bike->category?->base_daily_rate ?? 0);

        $weekend = $price !== null
            ? (float) $price->weekend_rate
            : ($bike->weekend_daily_rate_override === null
                ? null : (float) $bike->weekend_daily_rate_override);

        return [
            'weekday_rate' => $weekday,
            'weekend_rate' => $weekend,
            'has_branch_price' => $price !== null,
        ];
    }
}

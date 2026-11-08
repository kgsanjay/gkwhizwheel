<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabFareRule extends Model
{
    protected $fillable = [
        'store_id', 'service_item_id', 'trip_type', 'route_class',
        'fixed_route_amount', 'per_km_amount', 'minimum_amount',
        'hourly_amount', 'minimum_hours', 'daily_minimum_amount',
        'driver_allowance_per_day', 'extra_km_amount', 'extra_hour_amount',
        'included_km', 'included_hours', 'toll_policy', 'parking_policy',
        'interstate_permit_amount', 'is_approved', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'fixed_route_amount' => 'decimal:2',
            'per_km_amount' => 'decimal:2',
            'minimum_amount' => 'decimal:2',
            'hourly_amount' => 'decimal:2',
            'daily_minimum_amount' => 'decimal:2',
            'driver_allowance_per_day' => 'decimal:2',
            'extra_km_amount' => 'decimal:2',
            'extra_hour_amount' => 'decimal:2',
            'included_km' => 'decimal:2',
            'included_hours' => 'decimal:2',
            'interstate_permit_amount' => 'decimal:2',
            'minimum_hours' => 'integer',
            'is_approved' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function store(): BelongsTo { return $this->belongsTo(Store::class); }
    public function serviceItem(): BelongsTo { return $this->belongsTo(ServiceItem::class); }
}

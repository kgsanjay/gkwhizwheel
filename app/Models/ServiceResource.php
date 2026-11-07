<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceResource extends Model
{
    public const TYPES = ['cab_vehicle', 'cab_driver', 'boat', 'scuba_slot', 'stay_room', 'tour_guide', 'tour_departure'];

    protected $fillable = [
        'service_item_id', 'store_id', 'resource_type', 'code',
        'name', 'capacity_units', 'status',
    ];

    protected function casts(): array
    {
        return ['capacity_units' => 'integer'];
    }

    public function serviceItem(): BelongsTo
    {
        return $this->belongsTo(ServiceItem::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(ServiceResourceAllocation::class);
    }
}

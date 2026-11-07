<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PickupPoint extends Model
{
    protected $fillable = [
        'store_id', 'name', 'slug', 'address_line', 'landmark',
        'latitude', 'longitude', 'delivery_fee', 'supports_pickup',
        'supports_return', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7', 'longitude' => 'decimal:7',
            'delivery_fee' => 'decimal:2', 'is_active' => 'boolean',
            'supports_pickup' => 'boolean', 'supports_return' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}

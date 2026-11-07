<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceResourceAllocation extends Model
{
    protected $fillable = [
        'service_resource_id', 'service_booking_id', 'starts_at',
        'ends_at', 'quantity', 'status', 'held_until',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'held_until' => 'datetime',
            'quantity' => 'integer',
        ];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(ServiceResource::class, 'service_resource_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class, 'service_booking_id');
    }
}

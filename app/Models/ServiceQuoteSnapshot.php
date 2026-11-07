<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServiceQuoteSnapshot extends Model
{
    protected $fillable = [
        'public_id', 'user_id', 'service_item_id', 'service_type',
        'start_datetime', 'quantity', 'base_amount', 'discount_amount',
        'total_amount', 'breakdown_json', 'expires_at', 'service_booking_id',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'expires_at' => 'datetime',
            'quantity' => 'integer',
            'base_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'breakdown_json' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function serviceItem(): BelongsTo
    {
        return $this->belongsTo(ServiceItem::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class, 'service_booking_id');
    }
}

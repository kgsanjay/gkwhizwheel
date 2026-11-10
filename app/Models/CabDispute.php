<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabDispute extends Model
{
    protected $fillable = [
        'service_booking_id', 'store_id', 'created_by',
        'category', 'status', 'description',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class, 'service_booking_id');
    }
}

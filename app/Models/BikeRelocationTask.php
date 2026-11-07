<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BikeRelocationTask extends Model
{
    protected $fillable = [
        'bike_id', 'triggering_booking_id', 'affected_booking_id',
        'from_store_id', 'required_store_id', 'status',
    ];

    public function bike(): BelongsTo
    {
        return $this->belongsTo(Bike::class);
    }

    public function affectedBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'affected_booking_id');
    }

    public function triggeringBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'triggering_booking_id');
    }
}

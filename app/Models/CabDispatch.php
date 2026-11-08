<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabDispatch extends Model
{
    protected $fillable = [
        'service_booking_id', 'cab_vehicle_id', 'cab_driver_id',
        'store_id', 'assigned_by', 'started_by', 'closed_by',
        'starts_at', 'ends_at', 'trip_started_at', 'trip_completed_at',
        'start_odometer', 'end_odometer', 'operations_notes', 'status',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime', 'ends_at' => 'datetime',
            'trip_started_at' => 'datetime', 'trip_completed_at' => 'datetime',
            'start_odometer' => 'integer', 'end_odometer' => 'integer',
        ];
    }

    public function booking(): BelongsTo { return $this->belongsTo(ServiceBooking::class, 'service_booking_id'); }
    public function vehicle(): BelongsTo { return $this->belongsTo(CabVehicle::class, 'cab_vehicle_id'); }
    public function driver(): BelongsTo { return $this->belongsTo(CabDriver::class, 'cab_driver_id'); }
}

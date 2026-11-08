<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceEnquiry extends Model
{
    protected $fillable = [
        'user_id', 'reference', 'service_type', 'customer_name',
        'customer_phone', 'customer_email', 'start_datetime',
        'end_datetime', 'pickup_location', 'drop_location', 'quantity',
        'customer_notes', 'status',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
            'quantity' => 'integer',
        ];
    }

    public function proposal(): HasOne
    {
        return $this->hasOne(ServiceBooking::class, 'service_enquiry_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

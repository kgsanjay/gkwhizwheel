<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabRefundReview extends Model
{
    protected $fillable = [
        'service_booking_id', 'requested_by', 'verified_receipts_paise',
        'recorded_advance_paise', 'status', 'reason',
    ];

    protected function casts(): array
    {
        return [
            'verified_receipts_paise' => 'integer',
            'recorded_advance_paise' => 'integer',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class, 'service_booking_id');
    }
}

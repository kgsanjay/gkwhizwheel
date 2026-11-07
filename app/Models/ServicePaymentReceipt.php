<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ServicePaymentReceipt extends Model
{
    protected $fillable = [
        'service_booking_id', 'provider', 'payment_id',
        'order_id', 'amount_paise',
    ];

    protected function casts(): array
    {
        return ['amount_paise' => 'integer'];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class, 'service_booking_id');
    }
}

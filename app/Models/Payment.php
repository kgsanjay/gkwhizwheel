<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'booking_id',
        'type',
        'amount',
        'method',
        'gateway_reference',
        'status',
        'collected_by',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => PaymentType::class,
            'method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Booking associated with this payment.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    /**
     * Staff member who collected this payment in-store.
     */
    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    /**
     * Refunds issued against this specific payment.
     */
    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'payment_id');
    }
}

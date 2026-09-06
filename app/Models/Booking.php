<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'booking_reference',
        'bike_id',
        'user_id',
        'pickup_store_id',
        'return_store_id',
        'channel',
        'status',
        'start_date',
        'end_date',
        'base_amount',
        'pricing_adjustments_amount',
        'one_way_fee_amount',
        'addon_amount',
        'discount_amount',
        'deposit_amount',
        'late_fee_amount',
        'damage_fee_amount',
        'total_amount',
        'price_breakdown_json',
        'held_until',
        'created_by',
        'completed_by',
        'agreement_signed_at',
        'agreement_signature_path',
        'idempotency_key',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'channel' => BookingChannel::class,
            'status' => BookingStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'base_amount' => 'decimal:2',
            'pricing_adjustments_amount' => 'decimal:2',
            'one_way_fee_amount' => 'decimal:2',
            'addon_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'late_fee_amount' => 'decimal:2',
            'damage_fee_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'price_breakdown_json' => 'array',
            'held_until' => 'datetime',
            'agreement_signed_at' => 'datetime',
        ];
    }

    /**
     * Bike reserved for this booking.
     */
    public function bike(): BelongsTo
    {
        return $this->belongsTo(Bike::class, 'bike_id');
    }

    /**
     * Customer who booked the bike.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Store where pickup occurs.
     */
    public function pickupStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'pickup_store_id');
    }

    /**
     * Store where return occurs.
     */
    public function returnStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'return_store_id');
    }

    /**
     * Staff user who initiated/created this booking (null if customer self-service).
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Staff user who processed return/completed this booking.
     */
    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Add-ons selected with this booking.
     */
    public function addons(): HasMany
    {
        return $this->hasMany(BookingAddon::class, 'booking_id');
    }

    /**
     * Payments collected for this booking.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'booking_id');
    }

    /**
     * Refunds issued for this booking.
     */
    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'booking_id');
    }

    /**
     * Review submitted for this booking.
     */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class, 'booking_id');
    }

    /**
     * Handover and return inspection logs.
     */
    public function conditionLogs(): HasMany
    {
        return $this->hasMany(BikeConditionLog::class, 'booking_id');
    }

    /**
     * Coupon redemptions applied to this booking.
     */
    public function couponUsages(): HasMany
    {
        return $this->hasMany(CouponUsage::class, 'booking_id');
    }

    /**
     * Notifications dispatched for this booking.
     */
    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class, 'booking_id');
    }
}

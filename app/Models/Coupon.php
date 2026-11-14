<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DiscountType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'store_id',
        'discount_type',
        'value',
        'max_uses_total',
        'max_uses_per_user',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_type' => DiscountType::class,
            'value' => 'decimal:2',
            'max_uses_total' => 'integer',
            'max_uses_per_user' => 'integer',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Store this coupon is scoped to (null = platform-wide).
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    /**
     * Usages recorded for this coupon.
     */
    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class, 'coupon_id');
    }
}

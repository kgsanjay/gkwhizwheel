<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PricingRule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'service_type',
        'service_item_id',
        'bike_id',
        'category_id',
        'rule_type',
        'day_of_week',
        'date_start',
        'date_end',
        'from_store_id',
        'to_store_id',
        'rate_type',
        'value',
        'priority',
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
            'rule_type' => PricingRuleType::class,
            'rate_type' => PricingRateType::class,
            'value' => 'decimal:2',
            'day_of_week' => 'integer',
            'priority' => 'integer',
            'date_start' => 'date',
            'date_end' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Specific bike this rule applies to, if any.
     */
    public function bike(): BelongsTo
    {
        return $this->belongsTo(Bike::class, 'bike_id');
    }

    /**
     * Category this rule applies to, if any.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(BikeCategory::class, 'category_id');
    }

    /**
     * Origin store for one-way fee rules.
     */
    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'from_store_id');
    }

    /**
     * Destination store for one-way fee rules.
     */
    public function toStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'to_store_id');
    }

    /**
     * Specific travel service item this rule applies to, if any.
     */
    public function serviceItem(): BelongsTo
    {
        return $this->belongsTo(ServiceItem::class, 'service_item_id');
    }
}

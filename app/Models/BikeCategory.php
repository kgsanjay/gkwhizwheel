<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BikeCategory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'base_daily_rate',
        'default_deposit_amount',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_daily_rate' => 'decimal:2',
            'default_deposit_amount' => 'decimal:2',
        ];
    }

    /**
     * Bikes belonging to this category.
     */
    public function bikes(): HasMany
    {
        return $this->hasMany(Bike::class, 'category_id');
    }

    /**
     * Pricing rules applying to this category.
     */
    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class, 'category_id');
    }
}

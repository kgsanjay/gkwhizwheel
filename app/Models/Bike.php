<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bike extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'current_store_id',
        'home_store_id',
        'brand',
        'model_name',
        'registration_number',
        'fuel_type',
        'transmission',
        'base_daily_rate_override',
        'deposit_amount_override',
        'odometer_reading',
        'status',
        'next_service_due_date',
        'primary_image_path',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fuel_type' => FuelType::class,
            'transmission' => Transmission::class,
            'status' => BikeStatus::class,
            'base_daily_rate_override' => 'decimal:2',
            'deposit_amount_override' => 'decimal:2',
            'odometer_reading' => 'integer',
            'next_service_due_date' => 'date',
        ];
    }

    /**
     * Category this bike belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(BikeCategory::class, 'category_id');
    }

    /**
     * Physical store where the bike currently sits.
     */
    public function currentStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'current_store_id');
    }

    /**
     * Store this bike is nominally assigned to.
     */
    public function homeStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'home_store_id');
    }

    /**
     * Additional photos/gallery images for this bike.
     */
    public function images(): HasMany
    {
        return $this->hasMany(BikeImage::class, 'bike_id');
    }

    /**
     * RC, insurance, and emission documents for this bike.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(BikeDocument::class, 'bike_id');
    }

    /**
     * Pricing rules specific to this bike.
     */
    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class, 'bike_id');
    }

    /**
     * Bookings made for this bike.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'bike_id');
    }

    /**
     * Reviews written for this bike.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'bike_id');
    }
}

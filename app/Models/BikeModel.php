<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FuelType;
use App\Enums\Transmission;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BikeModel extends Model
{
    protected $fillable = [
        'category_id', 'brand', 'name', 'fuel_type', 'transmission',
        'description', 'primary_image_path', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'fuel_type' => FuelType::class,
            'transmission' => Transmission::class,
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BikeCategory::class, 'category_id');
    }

    public function branchPrices(): HasMany
    {
        return $this->hasMany(BranchBikeModelPrice::class);
    }

    public function bikes(): HasMany
    {
        return $this->hasMany(Bike::class, 'bike_model_id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchBikeModelPrice extends Model
{
    protected $fillable = ['store_id', 'bike_model_id', 'weekday_rate', 'weekend_rate'];

    protected function casts(): array
    {
        return ['weekday_rate' => 'decimal:2', 'weekend_rate' => 'decimal:2'];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function bikeModel(): BelongsTo
    {
        return $this->belongsTo(BikeModel::class);
    }
}

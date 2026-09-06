<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BikeConditionPhoto extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'bike_condition_log_id',
        'file_path',
    ];

    /**
     * Bike condition log this photo belongs to.
     */
    public function log(): BelongsTo
    {
        return $this->belongsTo(BikeConditionLog::class, 'bike_condition_log_id');
    }
}

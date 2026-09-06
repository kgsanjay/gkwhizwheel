<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BikeConditionStage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BikeConditionLog extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'booking_id',
        'stage',
        'odometer_reading',
        'notes',
        'logged_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stage' => BikeConditionStage::class,
            'odometer_reading' => 'integer',
        ];
    }

    /**
     * Booking associated with this inspection log.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    /**
     * Staff member who conducted the inspection.
     */
    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    /**
     * Inspection photos captured during handover or return.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(BikeConditionPhoto::class, 'bike_condition_log_id');
    }
}

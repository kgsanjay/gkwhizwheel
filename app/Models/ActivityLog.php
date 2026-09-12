<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * Bootstrap the model and its traits.
     */
    protected static function booted(): void
    {
        static::saving(function (ActivityLog $log): void {
            if (is_array($log->old_values)) {
                $log->old_values = \App\Logging\MaskSensitiveDataProcessor::maskSensitiveArray($log->old_values);
            }

            if (is_array($log->new_values)) {
                $log->new_values = \App\Logging\MaskSensitiveDataProcessor::maskSensitiveArray($log->new_values);
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'store_id',
        'action',
        'subject_type',
        'subject_id',
        'old_values',
        'new_values',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    /**
     * User who performed the logged action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Store where the action took place.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    /**
     * Polymorphic subject of the activity.
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}

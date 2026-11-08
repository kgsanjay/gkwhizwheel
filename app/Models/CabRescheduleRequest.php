<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabRescheduleRequest extends Model
{
    protected $fillable = [
        'cab_dispatch_id', 'requested_by', 'original_starts_at',
        'original_ends_at', 'proposed_starts_at', 'proposed_ends_at',
        'status', 'reason', 'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'original_starts_at' => 'datetime',
            'original_ends_at' => 'datetime',
            'proposed_starts_at' => 'datetime',
            'proposed_ends_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(CabDispatch::class, 'cab_dispatch_id');
    }
}

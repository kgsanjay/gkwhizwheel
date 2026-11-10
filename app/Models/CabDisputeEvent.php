<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabDisputeEvent extends Model
{
    protected $fillable = [
        'cab_dispute_id', 'actor_user_id', 'from_status',
        'to_status', 'review_notes', 'occurred_at',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(CabDispute::class, 'cab_dispute_id');
    }
}

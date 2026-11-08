<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabDispatchEvent extends Model
{
    protected $fillable = [
        'cab_dispatch_id', 'actor_user_id', 'from_status',
        'to_status', 'reason', 'occurred_at',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }

    public function dispatch(): BelongsTo { return $this->belongsTo(CabDispatch::class, 'cab_dispatch_id'); }
}

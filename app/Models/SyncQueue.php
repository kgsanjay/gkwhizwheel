<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SyncStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncQueue extends Model
{
    use HasFactory;

    protected $table = 'sync_queue';

    public const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'device_id',
        'user_id',
        'action_type',
        'payload_json',
        'idempotency_key',
        'status',
        'synced_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'status' => SyncStatus::class,
            'synced_at' => 'datetime',
        ];
    }

    /**
     * User who queued this offline action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

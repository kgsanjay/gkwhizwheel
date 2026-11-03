<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BikeTransfer extends Model
{
    protected $fillable = [
        'bike_id', 'from_store_id', 'to_store_id', 'status',
        'reason', 'notes', 'requested_by', 'approved_by',
        'dispatched_by', 'received_by', 'closed_by',
        'approved_at', 'dispatched_at', 'received_at', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'dispatched_at' => 'datetime',
            'received_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function bike(): BelongsTo { return $this->belongsTo(Bike::class); }
    public function fromStore(): BelongsTo { return $this->belongsTo(Store::class, 'from_store_id'); }
    public function toStore(): BelongsTo { return $this->belongsTo(Store::class, 'to_store_id'); }
    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function dispatcher(): BelongsTo { return $this->belongsTo(User::class, 'dispatched_by'); }
    public function receiver(): BelongsTo { return $this->belongsTo(User::class, 'received_by'); }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabDriver extends Model
{
    protected $fillable = [
        'store_id', 'service_item_id', 'service_resource_id',
        'name', 'license_fingerprint', 'license_last_four', 'license_expires_on',
        'last_verified_on', 'documents_verified', 'status',
    ];

    protected $hidden = ['license_fingerprint'];

    protected function casts(): array
    {
        return [
            'license_expires_on' => 'date',
            'last_verified_on' => 'date',
            'documents_verified' => 'boolean',
        ];
    }

    public function store(): BelongsTo { return $this->belongsTo(Store::class); }
    public function serviceItem(): BelongsTo { return $this->belongsTo(ServiceItem::class); }
    public function resource(): BelongsTo { return $this->belongsTo(ServiceResource::class, 'service_resource_id'); }
}

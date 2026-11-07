<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabVehicle extends Model
{
    protected $fillable = [
        'store_id', 'service_item_id', 'service_resource_id',
        'registration_number', 'vehicle_class', 'make', 'model_name',
        'ownership_type', 'seats', 'luggage_capacity', 'is_ac',
        'is_accessible', 'insurance_expires_on', 'permit_expires_on',
        'fitness_expires_on', 'last_inspected_on', 'documents_verified', 'status',
    ];

    protected function casts(): array
    {
        return [
            'seats' => 'integer',
            'luggage_capacity' => 'integer',
            'is_ac' => 'boolean',
            'is_accessible' => 'boolean',
            'documents_verified' => 'boolean',
            'insurance_expires_on' => 'date',
            'permit_expires_on' => 'date',
            'fitness_expires_on' => 'date',
            'last_inspected_on' => 'date',
        ];
    }

    public function store(): BelongsTo { return $this->belongsTo(Store::class); }
    public function serviceItem(): BelongsTo { return $this->belongsTo(ServiceItem::class); }
    public function resource(): BelongsTo { return $this->belongsTo(ServiceResource::class, 'service_resource_id'); }
}

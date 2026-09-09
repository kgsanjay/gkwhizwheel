<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceItem extends Model
{
    use HasFactory;

    protected $table = 'service_items';

    protected $fillable = [
        'service_type',
        'name',
        'category',
        'description',
        'price_base',
        'price_unit',
        'capacity',
        'image_url',
        'badge',
        'features',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_base' => 'decimal:2',
            'features' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ServiceBooking::class, 'service_item_id');
    }
}

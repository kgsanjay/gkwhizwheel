<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AddonType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAddon extends Model
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
        'addon_type',
        'quantity',
        'unit_price',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'addon_type' => AddonType::class,
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
        ];
    }

    /**
     * Booking this add-on belongs to.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}

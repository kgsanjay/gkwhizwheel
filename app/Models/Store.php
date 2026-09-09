<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StoreStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'address_line',
        'city',
        'state',
        'pincode',
        'latitude',
        'longitude',
        'phone',
        'operating_hours',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'operating_hours' => 'array',
            'status' => StoreStatus::class,
        ];
    }

    /**
     * Optional accessor for code (fallback to initials/city or null).
     */
    public function getCodeAttribute(): ?string
    {
        return $this->attributes['code'] ?? null;
    }

    /**
     * Bikes physically located at this store.
     */
    public function currentBikes(): HasMany
    {
        return $this->hasMany(Bike::class, 'current_store_id');
    }

    /**
     * Bikes assigned to this home store.
     */
    public function homeBikes(): HasMany
    {
        return $this->hasMany(Bike::class, 'home_store_id');
    }

    /**
     * Alias for bikes currently at this store.
     */
    public function bikes(): HasMany
    {
        return $this->currentBikes();
    }

    /**
     * Bookings where pickup is at this store.
     */
    public function pickupBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'pickup_store_id');
    }

    /**
     * Bookings where return is at this store.
     */
    public function returnBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'return_store_id');
    }

    /**
     * Staff members assigned to this store.
     */
    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'staff_store', 'store_id', 'user_id')
            ->using(StaffStore::class)
            ->withTimestamps();
    }

    /**
     * Pricing rules originating from this store.
     */
    public function pricingRulesFrom(): HasMany
    {
        return $this->hasMany(PricingRule::class, 'from_store_id');
    }

    /**
     * Pricing rules terminating at this store.
     */
    public function pricingRulesTo(): HasMany
    {
        return $this->hasMany(PricingRule::class, 'to_store_id');
    }

    /**
     * Activity logs recorded at this store.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'store_id');
    }
}

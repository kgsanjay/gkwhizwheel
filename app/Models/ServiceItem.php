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

    protected $appends = [
        'primary_image_url',
        'gallery_image_urls',
    ];

    protected function casts(): array
    {
        return [
            'price_base' => 'decimal:2',
            'features' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        if ($this->relationLoaded('images') && $this->images->isNotEmpty()) {
            $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();
            if ($primary && ! empty($primary->image_path)) {
                return str_starts_with($primary->image_path, 'http')
                    ? $primary->image_path
                    : \Illuminate\Support\Facades\Storage::disk('public')->url($primary->image_path);
            }
        }

        return $this->image_url;
    }

    public function getGalleryImageUrlsAttribute(): array
    {
        if ($this->relationLoaded('images') && $this->images->isNotEmpty()) {
            return $this->images->map(function ($img) {
                if (empty($img->image_path)) {
                    return '';
                }
                return str_starts_with($img->image_path, 'http')
                    ? $img->image_path
                    : \Illuminate\Support\Facades\Storage::disk('public')->url($img->image_path);
            })->filter()->values()->all();
        }

        return ! empty($this->image_url) ? [$this->image_url] : [];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ServiceBooking::class, 'service_item_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ServiceItemImage::class, 'service_item_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ServiceItemDocument::class, 'service_item_id');
    }

    /**
     * Determine if item is in an available operational status.
     */
    public function isAvailable(): bool
    {
        return in_array($this->status, ['available', 'active'], true);
    }

    /**
     * Get the max concurrency / concurrent unit capacity for this item.
     * Discrete items (homestays, single rooms, 1-on-1 dive masters) return 1.
     */
    public function getCapacityUnits(): int
    {
        if (! empty($this->capacity) && preg_match('/(\d+)/', (string) $this->capacity, $matches)) {
            $parsed = (int) $matches[1];

            // If explicitly specified as a single room or single diver
            if (stripos($this->capacity, 'room') !== false || stripos($this->capacity, 'diver') !== false) {
                return max(1, $parsed);
            }

            return max(1, $parsed);
        }

        // Discrete single resources default to 1
        if ($this->service_type === 'homestay') {
            return 1;
        }

        // Default open capacity for services without explicit capacity limits
        return 20;
    }

    /**
     * Concurrency-safe check whether item can fulfill requested booking quantity.
     */
    public function checkAvailability(
        \Carbon\CarbonInterface|string $startDateTime,
        \Carbon\CarbonInterface|string|null $endDateTime = null,
        int $requestedQuantity = 1,
        ?int $excludeBookingId = null
    ): bool {
        if (! $this->isAvailable()) {
            return false;
        }

        $start = \Carbon\Carbon::parse($startDateTime);
        $end = $endDateTime ? \Carbon\Carbon::parse($endDateTime) : $start->copy()->endOfDay();

        $query = $this->bookings()
            ->where(function ($query): void {
                $query->whereIn('status', ['confirmed', 'in_progress'])
                    ->orWhere(function ($hq): void {
                        $hq->where('status', 'held')
                            ->where(function ($h): void {
                                $h->whereNull('held_until')
                                    ->orWhere('held_until', '>', now());
                            });
                    });
            })
            ->where(function ($q) use ($start, $end): void {
                $q->where(function ($sub) use ($start, $end): void {
                    $sub->whereNotNull('end_datetime')
                        ->where('start_datetime', '<=', $end)
                        ->where('end_datetime', '>=', $start);
                })->orWhere(function ($sub) use ($start, $end): void {
                    $sub->whereNull('end_datetime')
                        ->whereDate('start_datetime', $start->toDateString());
                });
            });

        if ($excludeBookingId !== null) {
            $query->where('id', '!=', $excludeBookingId);
        }

        $alreadyBooked = (int) $query->sum('quantity');
        $totalCapacity = $this->getCapacityUnits();

        return ($alreadyBooked + $requestedQuantity) <= $totalCapacity;
    }

    /**
     * Decrement availability / update status when fully booked.
     */
    public function decrementAvailability(int $quantity = 1): void
    {
        if ($this->getCapacityUnits() <= 1) {
            $this->update(['status' => 'booked']);
        }
    }

    /**
     * Release availability back to available.
     */
    public function releaseAvailability(): void
    {
        if ($this->status === 'booked') {
            $this->update(['status' => 'available']);
        }
    }
}

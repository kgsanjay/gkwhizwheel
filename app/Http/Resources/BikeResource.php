<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Bike;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Bike
 */
class BikeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dailyRate = $this->base_daily_rate_override !== null
            ? (float) $this->base_daily_rate_override
            : (float) ($this->category?->base_daily_rate ?? 0.0);

        $depositAmount = $this->deposit_amount_override !== null
            ? (float) $this->deposit_amount_override
            : (float) ($this->category?->default_deposit_amount ?? 0.0);

        return [
            'id' => $this->id,
            'brand' => $this->brand,
            'model_name' => $this->model_name,
            'registration_number' => $this->registration_number,
            'fuel_type' => $this->fuel_type?->value ?? (string) $this->fuel_type,
            'transmission' => $this->transmission?->value ?? (string) $this->transmission,
            'status' => $this->status?->value ?? (string) $this->status,
            'daily_rate' => $dailyRate,
            'deposit_amount' => $depositAmount,
            'primary_image_path' => $this->primary_image_path,
            'odometer_reading' => $this->odometer_reading,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'base_daily_rate' => (float) $this->category->base_daily_rate,
                'default_deposit_amount' => (float) $this->category->default_deposit_amount,
            ]),
            'current_store' => $this->whenLoaded('currentStore', fn () => [
                'id' => $this->currentStore->id,
                'name' => $this->currentStore->name,
                'city' => $this->currentStore->city,
                'address_line' => $this->currentStore->address_line,
            ]),
            'home_store' => $this->whenLoaded('homeStore', fn () => [
                'id' => $this->homeStore->id,
                'name' => $this->homeStore->name,
                'city' => $this->homeStore->city,
            ]),
            'images' => BikeImageResource::collection($this->whenLoaded('images')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

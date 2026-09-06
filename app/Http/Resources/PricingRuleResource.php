<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PricingRule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PricingRule
 */
class PricingRuleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bike_id' => $this->bike_id,
            'category_id' => $this->category_id,
            'rule_type' => $this->rule_type?->value ?? (string) $this->rule_type,
            'day_of_week' => $this->day_of_week,
            'date_start' => $this->date_start?->toDateString(),
            'date_end' => $this->date_end?->toDateString(),
            'from_store_id' => $this->from_store_id,
            'to_store_id' => $this->to_store_id,
            'rate_type' => $this->rate_type?->value ?? (string) $this->rate_type,
            'value' => (float) $this->value,
            'priority' => (int) $this->priority,
            'is_active' => (bool) $this->is_active,
            'bike' => $this->whenLoaded('bike', fn () => [
                'id' => $this->bike->id,
                'brand' => $this->bike->brand,
                'model_name' => $this->bike->model_name,
                'registration_number' => $this->bike->registration_number,
            ]),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'from_store' => $this->whenLoaded('fromStore', fn () => [
                'id' => $this->fromStore->id,
                'name' => $this->fromStore->name,
                'city' => $this->fromStore->city,
            ]),
            'to_store' => $this->whenLoaded('toStore', fn () => [
                'id' => $this->toStore->id,
                'name' => $this->toStore->name,
                'city' => $this->toStore->city,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

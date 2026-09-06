<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Coupon
 */
class CouponResource extends JsonResource
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
            'code' => $this->code,
            'discount_type' => $this->discount_type?->value ?? (string) $this->discount_type,
            'value' => (float) $this->value,
            'max_uses_total' => $this->max_uses_total,
            'max_uses_per_user' => (int) $this->max_uses_per_user,
            'valid_from' => $this->valid_from?->toDateString(),
            'valid_until' => $this->valid_until?->toDateString(),
            'is_active' => (bool) $this->is_active,
            'usages_count' => $this->whenCounted('usages'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

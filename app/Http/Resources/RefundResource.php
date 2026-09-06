<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Refund;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Refund
 */
class RefundResource extends JsonResource
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
            'booking_id' => $this->booking_id,
            'payment_id' => $this->payment_id,
            'amount' => (float) $this->amount,
            'reason' => $this->reason,
            'status' => $this->status?->value ?? (string) $this->status,
            'gateway_reference' => $this->gateway_reference,
            'processed_by' => $this->processed_by,
            'processor' => $this->whenLoaded('processor', fn () => [
                'id' => $this->processor->id,
                'name' => $this->processor->name,
                'email' => $this->processor->email,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

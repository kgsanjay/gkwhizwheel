<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\BikeConditionLog;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Models\Payment;
use App\Models\Refund;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Booking
 */
class BookingResource extends JsonResource
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
            'booking_reference' => $this->booking_reference,
            'user_id' => $this->user_id,
            'bike_id' => $this->bike_id,
            'channel' => $this->channel?->value ?? (string) $this->channel,
            'status' => $this->status?->value ?? (string) $this->status,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'base_amount' => (float) $this->base_amount,
            'pricing_adjustments_amount' => (float) ($this->pricing_adjustments_amount ?? 0.0),
            'one_way_fee_amount' => (float) ($this->one_way_fee_amount ?? 0.0),
            'addon_amount' => (float) ($this->addon_amount ?? 0.0),
            'discount_amount' => (float) ($this->discount_amount ?? 0.0),
            'deposit_amount' => (float) $this->deposit_amount,
            'total_amount' => (float) $this->total_amount,
            'late_fee_amount' => (float) $this->late_fee_amount,
            'damage_fee_amount' => (float) $this->damage_fee_amount,
            'held_until' => $this->held_until?->toIso8601String(),
            'agreement_signed_at' => $this->agreement_signed_at?->toIso8601String(),
            'price_breakdown_json' => $this->price_breakdown_json,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'bike' => $this->whenLoaded('bike', fn () => (new BikeResource($this->bike))->resolve()),
            'pickup_store' => $this->whenLoaded('pickupStore', fn () => [
                'id' => $this->pickupStore->id,
                'name' => $this->pickupStore->name,
                'city' => $this->pickupStore->city,
                'address_line' => $this->pickupStore->address_line,
            ]),
            'return_store' => $this->whenLoaded('returnStore', fn () => [
                'id' => $this->returnStore->id,
                'name' => $this->returnStore->name,
                'city' => $this->returnStore->city,
                'address_line' => $this->returnStore->address_line,
            ]),
            'addons' => $this->whenLoaded('addons', fn () => $this->addons->map(fn (BookingAddon $addon) => [
                'id' => $addon->id,
                'addon_type' => $addon->addon_type?->value ?? (string) $addon->addon_type,
                'quantity' => (int) $addon->quantity,
                'unit_price' => (float) $addon->unit_price,
                'total_price' => (float) $addon->total_price,
            ])),
            'payments' => $this->whenLoaded('payments', fn () => $this->payments->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'type' => $payment->type?->value ?? (string) $payment->type,
                'amount' => (float) $payment->amount,
                'method' => $payment->method?->value ?? (string) $payment->method,
                'status' => $payment->status?->value ?? (string) $payment->status,
                'gateway_reference' => $payment->gateway_reference,
                'created_at' => $payment->created_at?->toIso8601String(),
            ])),
            'refunds' => $this->whenLoaded('refunds', fn () => $this->refunds->map(fn (Refund $refund) => [
                'id' => $refund->id,
                'amount' => (float) $refund->amount,
                'reason' => $refund->reason,
                'status' => $refund->status?->value ?? (string) $refund->status,
                'gateway_reference' => $refund->gateway_reference,
                'created_at' => $refund->created_at?->toIso8601String(),
            ])),
            'condition_logs' => $this->whenLoaded('conditionLogs', fn () => $this->conditionLogs->map(fn (BikeConditionLog $log) => [
                'id' => $log->id,
                'stage' => $log->stage?->value ?? (string) $log->stage,
                'odometer_reading' => (int) $log->odometer_reading,
                'notes' => $log->notes,
                'photos' => $log->relationLoaded('photos') ? $log->photos->map(fn ($p) => [
                    'id' => $p->id,
                    'photo_url' => $p->photo_url,
                    'photo_path' => $p->photo_path,
                ]) : [],
                'created_at' => $log->created_at?->toIso8601String(),
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

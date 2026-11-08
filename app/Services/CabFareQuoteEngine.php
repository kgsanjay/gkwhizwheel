<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StoreStatus;
use App\Models\CabFareRule;
use App\Models\ServiceItem;
use Illuminate\Validation\ValidationException;

/**
 * Authoritative cab tariff calculation. Requests choose a published rule and
 * quantities; the browser cannot supply base prices or arbitrary adjustments.
 * No unapproved tariff is used for an actual payable quotation.
 */
final class CabFareQuoteEngine
{
    /**
     * @param array<string, mixed> $trip
     * @return array<string, mixed>
     */
    public function quote(ServiceItem $item, array $trip): array
    {
        $rule = CabFareRule::query()
            ->where('service_item_id', $item->id)
            ->where('trip_type', $trip['trip_type'] ?? null)
            ->where('route_class', $trip['route_class'] ?? null)
            ->where('is_active', true)
            ->where('is_approved', true)
            ->first();

        if ($item->service_type !== 'taxi' || ! $item->isAvailable() || $rule === null
            || (int) $rule->store_id !== (int) $item->store_id
            || $item->store?->status !== StoreStatus::ACTIVE) {
            throw ValidationException::withMessages([
                'trip_type' => 'An approved cab fare is not available for this branch and route.',
            ]);
        }

        $distance = $this->quantity($trip, 'estimated_km', 0, 10000);
        $hours = $this->quantity($trip, 'estimated_hours', 0, 336);
        $days = $this->integer($trip, 'days', 1, 60);
        $extraKm = $this->quantity($trip, 'extra_km', 0, 10000);
        $extraHours = $this->quantity($trip, 'extra_hours', 0, 336);
        $interstate = filter_var($trip['interstate'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $tolls = $this->quantity($trip, 'verified_toll_amount', 0, 100000);
        $parking = $this->quantity($trip, 'verified_parking_amount', 0, 100000);

        $fixed = $this->money($rule->fixed_route_amount);
        $perKm = $this->money($rule->per_km_amount);
        $hourly = $this->money($rule->hourly_amount);
        if ($fixed === null && $perKm === null && $hourly === null) {
            throw ValidationException::withMessages(['trip_type' => 'Tariff has no approved base rate.']);
        }
        if ($rule->minimum_hours !== null && $hours < $rule->minimum_hours
            && $hourly !== null) {
            $hours = (float) $rule->minimum_hours;
        }

        // Fixed-route pricing and metered pricing are mutually exclusive.
        $metered = round(($distance * ($perKm ?? 0)) + ($hours * ($hourly ?? 0)), 2);
        $base = $fixed !== null ? $fixed : $metered;
        $base = max($base, $this->money($rule->minimum_amount) ?? 0);
        $base = max($base, ($this->money($rule->daily_minimum_amount) ?? 0) * $days);

        $includedKm = (float) ($rule->included_km ?? 0);
        $includedHours = (float) ($rule->included_hours ?? 0);
        $additionalKm = max(0, $extraKm - $includedKm);
        $additionalHours = max(0, $extraHours - $includedHours);
        if ($additionalKm > 0 && $rule->extra_km_amount === null) {
            throw ValidationException::withMessages(['extra_km' => 'Extra-distance tariff is not approved.']);
        }
        if ($additionalHours > 0 && $rule->extra_hour_amount === null) {
            throw ValidationException::withMessages(['extra_hours' => 'Extra-hour tariff is not approved.']);
        }
        $extraKmAmount = round($additionalKm * ($this->money($rule->extra_km_amount) ?? 0), 2);
        $extraHourAmount = round($additionalHours * ($this->money($rule->extra_hour_amount) ?? 0), 2);
        $driver = round(($this->money($rule->driver_allowance_per_day) ?? 0) * $days, 2);

        if ($interstate && $rule->interstate_permit_amount === null) {
            throw ValidationException::withMessages(['interstate' => 'Interstate permit charge is not configured.']);
        }
        $permit = $interstate ? $this->money($rule->interstate_permit_amount) : 0.0;

        $tollAmount = $this->passThrough($rule->toll_policy, $tolls, 'toll');
        $parkingAmount = $this->passThrough($rule->parking_policy, $parking, 'parking');

        $breakdown = [
            'base_fare' => round($base, 2),
            'extra_km' => $extraKmAmount,
            'extra_hours' => $extraHourAmount,
            'driver_allowance' => $driver,
            'interstate_permit' => $permit,
            'tolls' => $tollAmount,
            'parking' => $parkingAmount,
        ];
        $total = round(array_sum($breakdown), 2);
        if ($total <= 0 || $total > 10000000) {
            throw ValidationException::withMessages(['trip_type' => 'Approved fare total is invalid.']);
        }
        return [
            'rule_id' => $rule->id,
            'service_item_id' => $item->id,
            'store_id' => $rule->store_id,
            'trip_type' => $rule->trip_type,
            'route_class' => $rule->route_class,
            'currency' => 'INR',
            'breakdown' => $breakdown,
            'total_amount' => $total,
            'quoted_at' => now()->toIso8601String(),
            'note' => 'Toll and parking amounts must be verified operationally; estimates are not final charges.',
        ];
    }

    private function quantity(array $input, string $key, float $min, float $max): float
    {
        $raw = $input[$key] ?? $min;
        if (! is_numeric($raw) || ! is_finite((float) $raw) || (float) $raw < $min || (float) $raw > $max) {
            throw ValidationException::withMessages([$key => 'Requested quantity is out of range.']);
        }
        return (float) $raw;
    }

    private function integer(array $input, string $key, int $min, int $max): int
    {
        $raw = $input[$key] ?? $min;
        if (filter_var($raw, FILTER_VALIDATE_INT) === false || (int) $raw < $min || (int) $raw > $max) {
            throw ValidationException::withMessages([$key => 'Requested days are invalid.']);
        }
        return (int) $raw;
    }

    private function money(mixed $value): ?float
    {
        return $value === null ? null : round((float) $value, 2);
    }

    private function passThrough(string $policy, float $amount, string $label): float
    {
        if ($policy === 'included') {
            return 0.0;
        }
        // Unverified browser-supplied toll/parking must never be charged.
        if ($policy === 'excluded') {
            return 0.0;
        }
        if ($policy !== 'exact') {
            throw ValidationException::withMessages([$label => 'Unknown charge policy.']);
        }
        if ($amount > 0) {
            throw ValidationException::withMessages([
                $label => 'Exact toll/parking charges require a verified staff settlement, not a browser estimate.',
            ]);
        }
        return 0.0;
    }
}

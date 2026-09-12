<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DiscountType;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Models\Bike;
use App\Models\Coupon;
use App\Models\PricingRule;
use App\Models\Store;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use InvalidArgumentException;

class PricingService
{
    /**
     * Canonical server-side addon pricing catalog.
     *
     * @var array<string, float>
     */
    public const ADDON_RATES = [
        'helmet' => 100.00,
        'extra_rider' => 150.00,
        'insurance' => 250.00,
        'gps' => 100.00,
    ];

    /**
     * Calculate an itemized price breakdown for a bike booking.
     *
     * @param  int|Bike  $bike
     * @param  CarbonInterface|string  $startDate
     * @param  CarbonInterface|string  $endDate
     * @param  int|Store  $pickupStore
     * @param  int|Store  $returnStore
     * @param  string|null  $couponCode
     * @param  array<int, array<string, mixed>>  $addons
     * @param  int|null  $userId
     * @return array{
     *     base_amount: float,
     *     pricing_adjustments_amount: float,
     *     one_way_fee_amount: float,
     *     addon_amount: float,
     *     discount_amount: float,
     *     deposit_amount: float,
     *     total_amount: float,
     *     price_breakdown_json: array<string, mixed>
     * }
     */
    public function calculateQuote(
        int|Bike $bike,
        CarbonInterface|string $startDate,
        CarbonInterface|string $endDate,
        int|Store $pickupStore,
        int|Store $returnStore,
        ?string $couponCode = null,
        array $addons = [],
        ?int $userId = null
    ): array {
        $bikeModel = $bike instanceof Bike ? $bike : Bike::with('category')->findOrFail($bike);
        $bikeModel->loadMissing('category');

        $pickupStoreModel = $pickupStore instanceof Store ? $pickupStore : Store::findOrFail($pickupStore);
        $returnStoreModel = $returnStore instanceof Store ? $returnStore : Store::findOrFail($returnStore);

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        if ($start->gt($end)) {
            throw new InvalidArgumentException('Start date must be before or equal to end date.');
        }

        // 1. Determine base rate and security deposit
        $baseDailyRate = (float) ($bikeModel->base_daily_rate_override ?? $bikeModel->category->base_daily_rate);
        $depositAmount = (float) ($bikeModel->deposit_amount_override ?? $bikeModel->category->default_deposit_amount);

        // 2. Fetch candidate pricing rules for this bike and its category
        $candidateRules = PricingRule::where('is_active', true)
            ->where(function ($query) use ($bikeModel) {
                $query->where('bike_id', $bikeModel->id)
                    ->orWhere(function ($q) use ($bikeModel) {
                        $q->whereNull('bike_id')
                            ->where(function ($cq) use ($bikeModel) {
                                $cq->where('category_id', $bikeModel->category_id)
                                    ->orWhereNull('category_id');
                            });
                    });
            })
            ->get();

        // 3. Iterate day-by-day across the booking range
        $current = $start->copy();
        $dailyBreakdown = [];
        $totalBaseAmount = 0.0;
        $totalAdjustments = 0.0;
        $daysCount = 0;

        while ($current->lte($end)) {
            $daysCount++;
            $totalBaseAmount += $baseDailyRate;
            $dayOfWeek = $current->dayOfWeek;
            $dateString = $current->toDateString();

            // Filter rules applicable to this specific calendar day
            $applicableRules = $candidateRules->filter(function (PricingRule $rule) use ($dayOfWeek, $dateString) {
                return match ($rule->rule_type) {
                    PricingRuleType::WEEKEND => $rule->day_of_week === $dayOfWeek,
                    PricingRuleType::HOLIDAY, PricingRuleType::SEASONAL =>
                        $rule->date_start !== null &&
                        $rule->date_end !== null &&
                        $dateString >= $rule->date_start->toDateString() &&
                        $dateString <= $rule->date_end->toDateString(),
                    default => false,
                };
            });

            // Select highest priority rule
            $selectedRule = $applicableRules->sort(function (PricingRule $a, PricingRule $b) {
                // 1. Higher priority value wins
                if ($a->priority !== $b->priority) {
                    return $b->priority <=> $a->priority;
                }

                // 2. Specificity: bike_id > category_id > global
                $specA = ($a->bike_id !== null ? 2 : ($a->category_id !== null ? 1 : 0));
                $specB = ($b->bike_id !== null ? 2 : ($b->category_id !== null ? 1 : 0));
                if ($specA !== $specB) {
                    return $specB <=> $specA;
                }

                // 3. Rule type precedence: Holiday > Weekend > Seasonal
                $typePrecedence = [
                    PricingRuleType::HOLIDAY->value => 3,
                    PricingRuleType::WEEKEND->value => 2,
                    PricingRuleType::SEASONAL->value => 1,
                ];

                $rankA = $typePrecedence[$a->rule_type->value] ?? 0;
                $rankB = $typePrecedence[$b->rule_type->value] ?? 0;

                return $rankB <=> $rankA;
            })->first();

            $adjustment = 0.0;
            $ruleName = null;

            if ($selectedRule !== null) {
                $ruleName = match ($selectedRule->rule_type) {
                    PricingRuleType::WEEKEND => "Weekend rule (+{$selectedRule->value}" . ($selectedRule->rate_type === PricingRateType::PERCENTAGE ? '%' : '') . ')',
                    PricingRuleType::HOLIDAY => "Holiday rule ({$selectedRule->value}" . ($selectedRule->rate_type === PricingRateType::PERCENTAGE ? '%' : '') . ')',
                    PricingRuleType::SEASONAL => "Seasonal rule ({$selectedRule->value}" . ($selectedRule->rate_type === PricingRateType::PERCENTAGE ? '%' : '') . ')',
                    default => "Rule #{$selectedRule->id}",
                };

                $adjustment = match ($selectedRule->rate_type) {
                    PricingRateType::PERCENTAGE => round($baseDailyRate * ((float) $selectedRule->value / 100), 2),
                    PricingRateType::FIXED_OVERRIDE => (float) $selectedRule->value - $baseDailyRate,
                    PricingRateType::FLAT_ADDON => (float) $selectedRule->value,
                };
            } elseif (in_array($dayOfWeek, [0, 5, 6], true) && $bikeModel->weekend_daily_rate_override !== null) {
                // Rate card weekend rate (Fri-Sun)
                $weekendRate = (float) $bikeModel->weekend_daily_rate_override;
                $adjustment = round($weekendRate - $baseDailyRate, 2);
                $ruleName = "Weekend Tariff (Fri-Sun: ₹{$weekendRate}/day)";
            }

            $finalDayRate = round($baseDailyRate + $adjustment, 2);
            $totalAdjustments += $adjustment;

            $dailyBreakdown[] = [
                'date' => $dateString,
                'day_of_week' => $current->format('l'),
                'base_rate' => round($baseDailyRate, 2),
                'rule_applied' => $ruleName,
                'rule_id' => $selectedRule?->id,
                'rate_type' => $selectedRule?->rate_type->value,
                'rule_value' => $selectedRule ? (float) $selectedRule->value : null,
                'adjustment' => round($adjustment, 2),
                'final_rate' => $finalDayRate,
            ];

            $current->addDay();
        }

        // 4. One-Way Fee Calculation
        $oneWayFee = 0.0;
        $oneWayRuleDetails = null;

        if ($pickupStoreModel->id !== $returnStoreModel->id) {
            $oneWayRule = PricingRule::where('is_active', true)
                ->where('rule_type', PricingRuleType::ONE_WAY_FEE)
                ->where(function ($q) use ($pickupStoreModel, $returnStoreModel) {
                    $q->where(function ($sub) use ($pickupStoreModel, $returnStoreModel) {
                        $sub->where('from_store_id', $pickupStoreModel->id)
                            ->where('to_store_id', $returnStoreModel->id);
                    })->orWhere(function ($sub) {
                        $sub->whereNull('from_store_id')
                            ->whereNull('to_store_id');
                    });
                })
                ->orderByDesc('priority')
                ->first();

            if ($oneWayRule !== null) {
                $oneWayFee = match ($oneWayRule->rate_type) {
                    PricingRateType::PERCENTAGE => round(($totalBaseAmount + $totalAdjustments) * ((float) $oneWayRule->value / 100), 2),
                    default => (float) $oneWayRule->value,
                };

                $oneWayRuleDetails = [
                    'rule_id' => $oneWayRule->id,
                    'pickup_store_id' => $pickupStoreModel->id,
                    'pickup_store_name' => $pickupStoreModel->name,
                    'return_store_id' => $returnStoreModel->id,
                    'return_store_name' => $returnStoreModel->name,
                    'fee' => round($oneWayFee, 2),
                ];
            }
        }

        // 5. Add-ons Calculation (Enforce server-side unit prices for known addons to prevent client manipulation)
        $addonsBreakdown = [];
        $totalAddonsAmount = 0.0;

        foreach ($addons as $addon) {
            $type = (string) ($addon['addon_type'] ?? 'addon');
            $qty = max(1, (int) ($addon['quantity'] ?? 1));
            // ponytail: Always resolve unit price server-side from standard catalog if known
            $unitPrice = self::ADDON_RATES[$type] ?? (float) ($addon['unit_price'] ?? 0.0);
            $addonTotal = round($qty * $unitPrice, 2);
            $totalAddonsAmount += $addonTotal;

            $addonsBreakdown[] = [
                'addon_type' => $type,
                'quantity' => $qty,
                'unit_price' => round($unitPrice, 2),
                'total' => $addonTotal,
            ];
        }

        // 6. Coupon Validation & Discount
        $discountAmount = 0.0;
        $couponDetails = null;

        if ($couponCode !== null && trim($couponCode) !== '') {
            $coupon = Coupon::where('code', strtoupper(trim($couponCode)))
                ->where('is_active', true)
                ->whereDate('valid_from', '<=', now()->toDateString())
                ->whereDate('valid_until', '>=', now()->toDateString())
                ->first();

            if ($coupon !== null) {
                $canApply = true;

                if ($coupon->max_uses_total !== null && $coupon->usages()->count() >= $coupon->max_uses_total) {
                    $canApply = false;
                }

                if ($canApply && $userId !== null && $coupon->max_uses_per_user !== null) {
                    $userUsageCount = $coupon->usages()->where('user_id', $userId)->count();
                    if ($userUsageCount >= $coupon->max_uses_per_user) {
                        $canApply = false;
                    }
                }

                if ($canApply) {
                    $rentalSubtotalBeforeDiscount = max(0.0, $totalBaseAmount + $totalAdjustments);

                    $discountAmount = match ($coupon->discount_type) {
                        DiscountType::PERCENTAGE => round($rentalSubtotalBeforeDiscount * ((float) $coupon->value / 100), 2),
                        DiscountType::FIXED => min($rentalSubtotalBeforeDiscount, (float) $coupon->value),
                    };

                    $couponDetails = [
                        'code' => $coupon->code,
                        'discount_type' => $coupon->discount_type->value,
                        'value' => (float) $coupon->value,
                        'discount_amount' => round($discountAmount, 2),
                    ];
                }
            }
        }

        // 7. Aggregate Totals
        $baseAmount = round($totalBaseAmount, 2);
        $adjustmentsAmount = round($totalAdjustments, 2);
        $oneWayFeeAmount = round($oneWayFee, 2);
        $addonAmount = round($totalAddonsAmount, 2);
        $discountFinalAmount = round($discountAmount, 2);
        $depositFinalAmount = round($depositAmount, 2);

        $rentalSubtotal = round(max(0.0, $baseAmount + $adjustmentsAmount - $discountFinalAmount) + $oneWayFeeAmount + $addonAmount, 2);
        $totalAmount = round($rentalSubtotal + $depositFinalAmount, 2);

        $priceBreakdownJson = [
            'days' => $daysCount,
            'base_daily_rate' => round($baseDailyRate, 2),
            'base_amount' => $baseAmount,
            'daily_breakdown' => $dailyBreakdown,
            'pricing_adjustments_amount' => $adjustmentsAmount,
            'one_way_fee_amount' => $oneWayFeeAmount,
            'one_way_details' => $oneWayRuleDetails,
            'addon_amount' => $addonAmount,
            'addons' => $addonsBreakdown,
            'coupon' => $couponDetails,
            'discount_amount' => $discountFinalAmount,
            'rental_subtotal' => $rentalSubtotal,
            'deposit_amount' => $depositFinalAmount,
            'total_amount' => $totalAmount,
        ];

        return [
            'base_amount' => $baseAmount,
            'pricing_adjustments_amount' => $adjustmentsAmount,
            'one_way_fee_amount' => $oneWayFeeAmount,
            'addon_amount' => $addonAmount,
            'discount_amount' => $discountFinalAmount,
            'deposit_amount' => $depositFinalAmount,
            'total_amount' => $totalAmount,
            'price_breakdown_json' => $priceBreakdownJson,
        ];
    }

    /**
     * Calculate an itemized dynamic quote for travel services (Cabs, Boating, Scuba, Homestays, Guides, Tours).
     *
     * @param string $serviceType
     * @param int|\App\Models\ServiceItem $item
     * @param CarbonInterface|string $travelDate
     * @param int $quantity
     * @param string|null $couponCode
     * @return array{
     *     service_type: string,
     *     service_item_id: int,
     *     service_item_name: string,
     *     travel_date: string,
     *     quantity: int,
     *     base_unit_rate: float,
     *     base_amount: float,
     *     surge_amount: float,
     *     surge_percentage: float,
     *     discount_amount: float,
     *     total_amount: float,
     *     applied_rules: array<int, array<string, mixed>>,
     *     breakdown: array<string, mixed>
     * }
     */
    public function calculateServiceQuote(
        string $serviceType,
        int|\App\Models\ServiceItem|null $item,
        CarbonInterface|string $travelDate,
        int $quantity = 1,
        ?string $couponCode = null,
        ?float $customBasePrice = null
    ): array {
        $serviceItem = null;
        if ($item !== null) {
            $serviceItem = $item instanceof \App\Models\ServiceItem
                ? $item
                : \App\Models\ServiceItem::find($item);
        }

        $date = Carbon::parse($travelDate);
        $baseUnitRate = (float) ($customBasePrice ?? $serviceItem?->price_base ?? 0);
        $qty = max(1, $quantity);
        $baseAmount = $baseUnitRate * $qty;

        // Fetch candidate rules matching this service_type or specific service_item_id
        $candidateRules = PricingRule::where('is_active', true)
            ->where(function ($query) use ($serviceType, $serviceItem) {
                if ($serviceItem !== null) {
                    $query->where('service_item_id', $serviceItem->id)
                        ->orWhere(function ($q) use ($serviceType) {
                            $q->whereNull('service_item_id')
                                ->where('service_type', $serviceType);
                        });
                } else {
                    $query->where('service_type', $serviceType);
                }
            })
            ->orderByDesc('priority')
            ->orderByDesc('id')
            ->get();

        $appliedRules = [];
        $surgeAmount = 0.0;
        $surgePercentage = 0.0;
        $adjustedUnitRate = $baseUnitRate;

        foreach ($candidateRules as $rule) {
            $applies = false;
            $ruleName = $rule->name ?: match ($rule->rule_type) {
                PricingRuleType::WEEKEND => 'Weekend Surcharge',
                PricingRuleType::HOLIDAY => 'Holiday Surge Rate',
                PricingRuleType::SEASONAL => 'Peak Season Rate',
                default => 'Special Surge Rate',
            };

            if ($rule->rule_type === PricingRuleType::WEEKEND) {
                $isoDay = (int) $date->dayOfWeekIso; // 1 (Mon) - 7 (Sun)
                $dayOfWeekMatches = $rule->day_of_week !== null
                    ? (int) $rule->day_of_week === $isoDay
                    : in_array($isoDay, [6, 7], true); // default Sat & Sun
                if ($dayOfWeekMatches) {
                    $applies = true;
                }
            } elseif (in_array($rule->rule_type, [PricingRuleType::HOLIDAY, PricingRuleType::SEASONAL], true)) {
                if ($rule->date_start && $rule->date_end) {
                    $start = Carbon::parse($rule->date_start)->startOfDay();
                    $end = Carbon::parse($rule->date_end)->endOfDay();
                    if ($date->betweenIncluded($start, $end)) {
                        $applies = true;
                    }
                }
            }

            if ($applies) {
                $adjustment = 0.0;
                if ($rule->rate_type === PricingRateType::PERCENTAGE) {
                    $pct = (float) $rule->value;
                    $adjustment = round(($baseUnitRate * ($pct / 100)), 2);
                    $adjustedUnitRate += $adjustment;
                    $surgePercentage += $pct;
                } elseif ($rule->rate_type === PricingRateType::FLAT_ADDON) {
                    $flat = (float) $rule->value;
                    $adjustment = $flat;
                    $adjustedUnitRate += $flat;
                } elseif ($rule->rate_type === PricingRateType::FIXED_OVERRIDE) {
                    $override = (float) $rule->value;
                    $adjustment = max(0, $override - $baseUnitRate);
                    $adjustedUnitRate = $override;
                }

                $appliedRules[] = [
                    'rule_id' => $rule->id,
                    'rule_name' => $ruleName,
                    'rule_type' => $rule->rule_type->value,
                    'rate_type' => $rule->rate_type->value,
                    'value' => (float) $rule->value,
                    'adjustment_per_unit' => $adjustment,
                    'total_adjustment' => $adjustment * $qty,
                ];

                $surgeAmount += ($adjustment * $qty);

                // Stop if fixed override or specific item rule takes exclusive priority
                if ($rule->rate_type === PricingRateType::FIXED_OVERRIDE || $rule->service_item_id !== null) {
                    break;
                }
            }
        }

        $subtotal = $baseAmount + $surgeAmount;
        $discountAmount = 0.0;

        // Coupon check if provided
        if (! empty($couponCode)) {
            $coupon = Coupon::where('code', strtoupper(trim($couponCode)))
                ->where('is_active', true)
                ->where('start_date', '<=', Carbon::now())
                ->where('end_date', '>=', Carbon::now())
                ->first();

            if ($coupon && ($coupon->min_booking_amount === null || $subtotal >= (float) $coupon->min_booking_amount)) {
                if ($coupon->discount_type === DiscountType::PERCENTAGE) {
                    $calc = round(($subtotal * ((float) $coupon->discount_value / 100)), 2);
                    $discountAmount = $coupon->max_discount_amount !== null
                        ? min($calc, (float) $coupon->max_discount_amount)
                        : $calc;
                } else {
                    $discountAmount = min($subtotal, (float) $coupon->discount_value);
                }
            }
        }

        $totalAmount = max(0.0, round($subtotal - $discountAmount, 2));

        return [
            'service_type' => $serviceType,
            'service_item_id' => $serviceItem?->id,
            'service_item_name' => $serviceItem?->name ?? 'Custom Package',
            'travel_date' => $date->toDateString(),
            'quantity' => $qty,
            'base_unit_rate' => $baseUnitRate,
            'base_price' => $baseUnitRate,
            'base_amount' => $baseAmount,
            'surge_amount' => $surgeAmount,
            'surge_percentage' => $surgePercentage,
            'discount_amount' => $discountAmount,
            'discount' => $discountAmount,
            'subtotal' => $subtotal,
            'total_amount' => $totalAmount,
            'total' => $totalAmount,
            'dynamic_unit_price' => $qty > 0 ? round($totalAmount / $qty, 2) : $totalAmount,
            'applied_rules' => $appliedRules,
            'breakdown' => [
                'unit_price_effective' => $qty > 0 ? round($totalAmount / $qty, 2) : $totalAmount,
                'has_surge' => $surgeAmount > 0,
                'surge_label' => ! empty($appliedRules) ? implode(', ', array_column($appliedRules, 'rule_name')) : null,
                'applied_rule_names' => array_column($appliedRules, 'rule_name'),
                'surges' => $appliedRules,
            ],
        ];
    }
}

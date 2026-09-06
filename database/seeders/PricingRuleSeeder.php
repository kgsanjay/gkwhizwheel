<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Models\BikeCategory;
use App\Models\PricingRule;
use App\Models\Store;
use Illuminate\Database\Seeder;

class PricingRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $koramangala = Store::where('name', 'Koramangala Hub')->first();
        $indiranagar = Store::where('name', 'Indiranagar Station')->first();
        $scooter = BikeCategory::where('name', 'Scooter')->first();

        // 1. Weekend Rule: Saturday 15% surcharge across all categories
        PricingRule::firstOrCreate(
            [
                'rule_type' => PricingRuleType::WEEKEND,
                'day_of_week' => 6, // Saturday
            ],
            [
                'rate_type' => PricingRateType::PERCENTAGE,
                'value' => 15.00,
                'priority' => 10,
                'is_active' => true,
            ]
        );

        // Sunday 15% surcharge across all categories
        PricingRule::firstOrCreate(
            [
                'rule_type' => PricingRuleType::WEEKEND,
                'day_of_week' => 0, // Sunday
            ],
            [
                'rate_type' => PricingRateType::PERCENTAGE,
                'value' => 15.00,
                'priority' => 10,
                'is_active' => true,
            ]
        );

        // 2. Holiday Rule: Dussehra / Festive Season (Oct 18-24, 2026) 20% surcharge
        PricingRule::firstOrCreate(
            [
                'rule_type' => PricingRuleType::HOLIDAY,
                'date_start' => '2026-10-18',
                'date_end' => '2026-10-24',
            ],
            [
                'rate_type' => PricingRateType::PERCENTAGE,
                'value' => 20.00,
                'priority' => 20,
                'is_active' => true,
            ]
        );

        // 3. One-Way Fee Rule: Inter-hub drop between Koramangala and Indiranagar
        if ($koramangala !== null && $indiranagar !== null) {
            PricingRule::firstOrCreate(
                [
                    'rule_type' => PricingRuleType::ONE_WAY_FEE,
                    'from_store_id' => $koramangala->id,
                    'to_store_id' => $indiranagar->id,
                ],
                [
                    'rate_type' => PricingRateType::FLAT_ADDON,
                    'value' => 250.00,
                    'priority' => 5,
                    'is_active' => true,
                ]
            );

            PricingRule::firstOrCreate(
                [
                    'rule_type' => PricingRuleType::ONE_WAY_FEE,
                    'from_store_id' => $indiranagar->id,
                    'to_store_id' => $koramangala->id,
                ],
                [
                    'rate_type' => PricingRateType::FLAT_ADDON,
                    'value' => 250.00,
                    'priority' => 5,
                    'is_active' => true,
                ]
            );
        }
    }
}

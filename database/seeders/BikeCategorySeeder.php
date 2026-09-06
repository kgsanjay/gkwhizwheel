<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\BikeCategory;
use Illuminate\Database\Seeder;

class BikeCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Scooter',
                'base_daily_rate' => 450.00,
                'default_deposit_amount' => 1500.00,
            ],
            [
                'name' => 'Cruiser',
                'base_daily_rate' => 1100.00,
                'default_deposit_amount' => 4000.00,
            ],
            [
                'name' => 'Electric',
                'base_daily_rate' => 500.00,
                'default_deposit_amount' => 1500.00,
            ],
            [
                'name' => 'Sports',
                'base_daily_rate' => 1500.00,
                'default_deposit_amount' => 5000.00,
            ],
        ];

        foreach ($categories as $categoryData) {
            BikeCategory::firstOrCreate(
                ['name' => $categoryData['name']],
                $categoryData
            );
        }
    }
}

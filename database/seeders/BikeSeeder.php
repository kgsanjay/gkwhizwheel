<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\BranchBikeModelPrice;
use App\Models\Store;
use Illuminate\Database\Seeder;

class BikeSeeder extends Seeder
{
    public function run(): void
    {
        // Never overwrite or append dummy inventory if real fleet bikes already exist
        if (Bike::count() > 0) {
            return;
        }
        $store = Store::first() ?: Store::create([
            'name' => 'Honnavar Hub',
            'city' => 'Honnavar',
            'address_line' => 'Palya Main Rd, Honnavar, Karnataka 581334',
            'phone' => '+91 86609 89586',
            'status' => 'active',
            'services' => ['two_wheelers', 'taxi', 'homestay', 'boating', 'guide'],
        ]);

        $scooterCat = BikeCategory::firstOrCreate(['name' => 'Scooter'], [
            'base_daily_rate' => 450.00,
            'default_deposit_amount' => 0.00,
        ]);
        $cruiserCat = BikeCategory::firstOrCreate(['name' => 'Cruiser'], [
            'base_daily_rate' => 1200.00,
            'default_deposit_amount' => 0.00,
        ]);
        $electricCat = BikeCategory::firstOrCreate(['name' => 'Electric'], [
            'base_daily_rate' => 600.00,
            'default_deposit_amount' => 0.00,
        ]);

        $modelsData = [
            [
                'brand' => 'Honda',
                'name' => 'Activa 6G',
                'category_id' => $scooterCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'description' => 'India’s #1 reliable gearless scooter. Perfect for Eco Beach, Sharavathi backwaters and Gokarna coastal road trips.',
                'primary_image_path' => '/images/bikes/honda-activa.webp',
                'weekday_rate' => 450.00,
                'weekend_rate' => 550.00,
                'units' => 4,
            ],
            [
                'brand' => 'Honda',
                'name' => 'Dio DLX',
                'category_id' => $scooterCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'description' => 'Sporty and agile 110cc automatic scooter with LED headlamp, sleek dual-tone styling, and combi-brake system. Perfect for coastal cruising in Honnavar, Gokarna, and Murudeshwar.',
                'primary_image_path' => '/images/bikes/honda-dio-dlx.webp',
                'weekday_rate' => 450.00,
                'weekend_rate' => 550.00,
                'units' => 2,
            ],
            [
                'brand' => 'Suzuki',
                'name' => 'Access 125',
                'category_id' => $scooterCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'description' => 'Punchy 125cc engine with great pick-up and generous under-seat storage. Ideal for couples exploring Uttara Kannada.',
                'primary_image_path' => '/images/bikes/suzuki-access-125.webp',
                'weekday_rate' => 500.00,
                'weekend_rate' => 600.00,
                'units' => 3,
            ],
            [
                'brand' => 'TVS',
                'name' => 'Ntorq 125',
                'category_id' => $scooterCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'description' => 'Sporty styling, Bluetooth digital console, and thrilling exhaust note. For riders who love sharp cornering on NH-66.',
                'primary_image_path' => '/images/bikes/tvs-ntorq-125.webp',
                'weekday_rate' => 550.00,
                'weekend_rate' => 650.00,
                'units' => 2,
            ],
            [
                'brand' => 'Royal Enfield',
                'name' => 'Classic 350',
                'category_id' => $cruiserCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'description' => 'Timeless British thumper with plush touring ergonomics. The undisputed king for Jog Falls ghats and Murudeshwar long rides.',
                'primary_image_path' => '/images/bikes/royal-enfield-classic.webp',
                'weekday_rate' => 1200.00,
                'weekend_rate' => 1400.00,
                'units' => 2,
            ],
            [
                'brand' => 'Honda',
                'name' => 'Hness CB350',
                'category_id' => $cruiserCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'description' => 'Ultra-refined 350cc retro cruiser with slip-and-assist clutch and crisp handling on scenic coastal curves.',
                'primary_image_path' => '/images/bikes/honda-hness.webp',
                'weekday_rate' => 1300.00,
                'weekend_rate' => 1500.00,
                'units' => 2,
            ],
            [
                'brand' => 'Ather',
                'name' => '450X Gen 3',
                'category_id' => $electricCat->id,
                'fuel_type' => FuelType::ELECTRIC,
                'transmission' => Transmission::AUTOMATIC,
                'description' => 'Smart electric scooter with touchscreen navigation, Warp mode acceleration, and 100km true coastal range with fast charger included.',
                'primary_image_path' => '/images/bikes/ather-450x-white.webp',
                'weekday_rate' => 600.00,
                'weekend_rate' => 700.00,
                'units' => 2,
            ],
            [
                'brand' => 'Yamaha',
                'name' => 'Fascino 125 Fi',
                'category_id' => $scooterCat->id,
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'description' => 'Super lightweight neo-retro European scooter with incredible 50+ km/l mileage. Very easy to handle for all riders.',
                'primary_image_path' => '/images/bikes/yamaha-fascino-125.webp',
                'weekday_rate' => 450.00,
                'weekend_rate' => 550.00,
                'units' => 2,
            ],
        ];

        foreach ($modelsData as $data) {
            $model = BikeModel::firstOrCreate(
                ['brand' => $data['brand'], 'name' => $data['name']],
                [
                    'category_id' => $data['category_id'],
                    'fuel_type' => $data['fuel_type'],
                    'transmission' => $data['transmission'],
                    'description' => $data['description'],
                    'primary_image_path' => $data['primary_image_path'],
                    'is_active' => true,
                ]
            );

            BranchBikeModelPrice::updateOrCreate(
                ['store_id' => $store->id, 'bike_model_id' => $model->id],
                [
                    'weekday_rate' => $data['weekday_rate'],
                    'weekend_rate' => $data['weekend_rate'],
                ]
            );

            // Create physical bikes for this model at the store
            for ($i = 1; $i <= $data['units']; $i++) {
                $reg = sprintf('KA-47-E-%04d', ($model->id * 100) + $i);
                Bike::firstOrCreate(
                    ['registration_number' => $reg],
                    [
                        'category_id' => $data['category_id'],
                        'bike_model_id' => $model->id,
                        'current_store_id' => $store->id,
                        'home_store_id' => $store->id,
                        'brand' => $data['brand'],
                        'model_name' => $data['name'],
                        'fuel_type' => $data['fuel_type'],
                        'transmission' => $data['transmission'],
                        'base_daily_rate_override' => $data['weekday_rate'],
                        'weekend_daily_rate_override' => $data['weekend_rate'],
                        'deposit_amount_override' => 0.00,
                        'odometer_reading' => rand(4000, 18000),
                        'status' => BikeStatus::AVAILABLE,
                        'primary_image_path' => $data['primary_image_path'],
                    ]
                );
            }
        }
    }
}

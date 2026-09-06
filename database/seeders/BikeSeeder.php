<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class BikeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mainOffice = Store::where('name', 'GK WhizWheels Main Office')->first() ?? Store::firstOrFail();
        $stationHub = Store::where('name', 'Honnavar Railway Station Hub')->first() ?? $mainOffice;

        $scooter = BikeCategory::firstOrCreate(['name' => 'Scooter'], ['base_daily_rate' => 450.00, 'default_deposit_amount' => 0.00]);
        $cruiser = BikeCategory::firstOrCreate(['name' => 'Cruiser'], ['base_daily_rate' => 1100.00, 'default_deposit_amount' => 0.00]);
        $electric = BikeCategory::firstOrCreate(['name' => 'Electric'], ['base_daily_rate' => 500.00, 'default_deposit_amount' => 0.00]);

        $uploader = User::where('email', 'admin@whizwheel.com')->first() ?? User::first();

        // The 9 official bikes matching the GK WhizWheel rate card
        $bikesData = [
            // 1. Honda Dio DLX: Mon-Thu 350, Fri-Sun 450
            [
                'category_id' => $scooter->id,
                'current_store_id' => $mainOffice->id,
                'home_store_id' => $mainOffice->id,
                'brand' => 'Honda',
                'model_name' => 'Dio DLX',
                'registration_number' => 'KA-47-E-1001',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 4200,
                'base_daily_rate_override' => 350.00,
                'weekend_daily_rate_override' => 450.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-15',
                'primary_image_path' => 'bikes/honda-dio-dlx.jpg',
            ],
            // 2. Honda H'ness CB350: Mon-Thu 1200, Fri-Sun 1500
            [
                'category_id' => $cruiser->id,
                'current_store_id' => $mainOffice->id,
                'home_store_id' => $mainOffice->id,
                'brand' => 'Honda',
                'model_name' => "H'ness CB350",
                'registration_number' => 'KA-47-E-1002',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 7400,
                'base_daily_rate_override' => 1200.00,
                'weekend_daily_rate_override' => 1500.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-10',
                'primary_image_path' => 'bikes/honda-hness.jpg',
            ],
            // 3. Royal Enfield Classic 350: Mon-Thu 1000, Fri-Sun 1200
            [
                'category_id' => $cruiser->id,
                'current_store_id' => $mainOffice->id,
                'home_store_id' => $mainOffice->id,
                'brand' => 'Royal Enfield',
                'model_name' => 'Classic 350',
                'registration_number' => 'KA-47-E-1003',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 11000,
                'base_daily_rate_override' => 1000.00,
                'weekend_daily_rate_override' => 1200.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-10-30',
                'primary_image_path' => 'bikes/royal-enfield-classic.jpg',
            ],
            // 4. TVS Ntorq 125: Mon-Thu 500, Fri-Sun 600
            [
                'category_id' => $scooter->id,
                'current_store_id' => $mainOffice->id,
                'home_store_id' => $mainOffice->id,
                'brand' => 'TVS',
                'model_name' => 'Ntorq 125',
                'registration_number' => 'KA-47-E-1004',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 5100,
                'base_daily_rate_override' => 500.00,
                'weekend_daily_rate_override' => 600.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-11-20',
                'primary_image_path' => 'bikes/tvs-ntorq-125.jpg',
            ],
            // 5. Yamaha Fascino 125: Mon-Thu 450, Fri-Sun 500
            [
                'category_id' => $scooter->id,
                'current_store_id' => $mainOffice->id,
                'home_store_id' => $mainOffice->id,
                'brand' => 'Yamaha',
                'model_name' => 'Fascino 125',
                'registration_number' => 'KA-47-E-1005',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 4800,
                'base_daily_rate_override' => 450.00,
                'weekend_daily_rate_override' => 500.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-11-05',
                'primary_image_path' => 'bikes/yamaha-fascino-125.jpg',
            ],
            // 6. Suzuki Access 125: Mon-Thu 450, Fri-Sun 500
            [
                'category_id' => $scooter->id,
                'current_store_id' => $stationHub->id,
                'home_store_id' => $stationHub->id,
                'brand' => 'Suzuki',
                'model_name' => 'Access 125',
                'registration_number' => 'KA-47-E-2001',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 5400,
                'base_daily_rate_override' => 450.00,
                'weekend_daily_rate_override' => 500.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-01',
                'primary_image_path' => 'bikes/suzuki-access-125.jpg',
            ],
            // 7. Honda Activa: Mon-Thu 400, Fri-Sun 500
            [
                'category_id' => $scooter->id,
                'current_store_id' => $stationHub->id,
                'home_store_id' => $stationHub->id,
                'brand' => 'Honda',
                'model_name' => 'Activa 6G',
                'registration_number' => 'KA-47-E-2002',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 6100,
                'base_daily_rate_override' => 400.00,
                'weekend_daily_rate_override' => 500.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-25',
                'primary_image_path' => 'bikes/honda-activa.jpg',
            ],
            // 8. Suzuki Burgman: Mon-Thu 500, Fri-Sun 600
            [
                'category_id' => $scooter->id,
                'current_store_id' => $stationHub->id,
                'home_store_id' => $stationHub->id,
                'brand' => 'Suzuki',
                'model_name' => 'Burgman Street 125',
                'registration_number' => 'KA-47-E-2003',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 4900,
                'base_daily_rate_override' => 500.00,
                'weekend_daily_rate_override' => 600.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-11-15',
                'primary_image_path' => 'bikes/suzuki-burgman.jpg',
            ],
            // 9. TVS Orbiter: Mon-Thu 500, Fri-Sun 600
            [
                'category_id' => $electric->id,
                'current_store_id' => $stationHub->id,
                'home_store_id' => $stationHub->id,
                'brand' => 'TVS',
                'model_name' => 'Orbiter EV',
                'registration_number' => 'KA-47-E-2004',
                'fuel_type' => FuelType::ELECTRIC,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 2800,
                'base_daily_rate_override' => 500.00,
                'weekend_daily_rate_override' => 600.00,
                'deposit_amount_override' => 0.00,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2027-01-10',
                'primary_image_path' => 'bikes/tvs-orbiter.jpg',
            ],
        ];

        // Clean out any old dummy bikes without bookings
        BikeDocument::truncate();
        Bike::query()->forceDelete();

        foreach ($bikesData as $data) {
            $bike = Bike::create($data);

            // Document placeholders
            $regClean = strtolower(str_replace('-', '_', $bike->registration_number));

            BikeDocument::create([
                'bike_id' => $bike->id,
                'document_type' => BikeDocumentType::RC,
                'file_path' => "documents/bikes/{$regClean}_rc.pdf",
                'issue_date' => '2024-01-15',
                'expiry_date' => '2039-01-14',
                'uploaded_by' => $uploader?->id,
                'verified' => true,
            ]);

            BikeDocument::create([
                'bike_id' => $bike->id,
                'document_type' => BikeDocumentType::INSURANCE,
                'file_path' => "documents/bikes/{$regClean}_insurance.pdf",
                'issue_date' => '2026-01-01',
                'expiry_date' => '2027-01-01',
                'uploaded_by' => $uploader?->id,
                'verified' => true,
            ]);

            BikeDocument::create([
                'bike_id' => $bike->id,
                'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
                'file_path' => "documents/bikes/{$regClean}_emission.pdf",
                'issue_date' => '2026-06-01',
                'expiry_date' => '2026-12-01',
                'uploaded_by' => $uploader?->id,
                'verified' => true,
            ]);
        }
    }
}

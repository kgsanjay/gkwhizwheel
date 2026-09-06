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
        $koramangala = Store::where('name', 'Koramangala Hub')->firstOrFail();
        $indiranagar = Store::where('name', 'Indiranagar Station')->firstOrFail();

        $scooter = BikeCategory::where('name', 'Scooter')->firstOrFail();
        $cruiser = BikeCategory::where('name', 'Cruiser')->firstOrFail();
        $sports = BikeCategory::where('name', 'Sports')->firstOrFail();

        $uploader = User::where('email', 'admin@whizwheel.com')->first()
            ?? User::first();

        $bikesData = [
            // Store 1: Koramangala Hub (5 bikes)
            [
                'category_id' => $scooter->id,
                'current_store_id' => $koramangala->id,
                'home_store_id' => $koramangala->id,
                'brand' => 'Honda',
                'model_name' => 'Activa 6G',
                'registration_number' => 'KA-01-AB-1001',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 4500,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-15',
                'primary_image_path' => 'bikes/activa-6g-yellow.jpg',
            ],
            [
                'category_id' => $scooter->id,
                'current_store_id' => $koramangala->id,
                'home_store_id' => $koramangala->id,
                'brand' => 'TVS',
                'model_name' => 'Jupiter 125',
                'registration_number' => 'KA-01-AB-1002',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 6200,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-11-20',
                'primary_image_path' => 'bikes/jupiter-125-blue.jpg',
            ],
            [
                'category_id' => $scooter->id,
                'current_store_id' => $koramangala->id,
                'home_store_id' => $koramangala->id,
                'brand' => 'Ather',
                'model_name' => '450X',
                'registration_number' => 'KA-01-AB-1003',
                'fuel_type' => FuelType::ELECTRIC,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 3100,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2027-01-10',
                'primary_image_path' => 'bikes/ather-450x-grey.jpg',
            ],
            [
                'category_id' => $cruiser->id,
                'current_store_id' => $koramangala->id,
                'home_store_id' => $koramangala->id,
                'brand' => 'Royal Enfield',
                'model_name' => 'Classic 350',
                'registration_number' => 'KA-01-AB-1004',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 12000,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-10-30',
                'primary_image_path' => 'bikes/classic-350-stealth.jpg',
            ],
            [
                'category_id' => $sports->id,
                'current_store_id' => $koramangala->id,
                'home_store_id' => $koramangala->id,
                'brand' => 'Yamaha',
                'model_name' => 'YZF-R15 V4',
                'registration_number' => 'KA-01-AB-1005',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 8500,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-11-05',
                'primary_image_path' => 'bikes/r15-racing-blue.jpg',
            ],

            // Store 2: Indiranagar Station (5 bikes)
            [
                'category_id' => $scooter->id,
                'current_store_id' => $indiranagar->id,
                'home_store_id' => $indiranagar->id,
                'brand' => 'Suzuki',
                'model_name' => 'Access 125',
                'registration_number' => 'KA-03-XY-2001',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 5400,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-01',
                'primary_image_path' => 'bikes/access-125-white.jpg',
            ],
            [
                'category_id' => $scooter->id,
                'current_store_id' => $indiranagar->id,
                'home_store_id' => $indiranagar->id,
                'brand' => 'Ola',
                'model_name' => 'S1 Pro',
                'registration_number' => 'KA-03-XY-2002',
                'fuel_type' => FuelType::ELECTRIC,
                'transmission' => Transmission::AUTOMATIC,
                'odometer_reading' => 2900,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2027-02-15',
                'primary_image_path' => 'bikes/ola-s1-black.jpg',
            ],
            [
                'category_id' => $cruiser->id,
                'current_store_id' => $indiranagar->id,
                'home_store_id' => $indiranagar->id,
                'brand' => 'Royal Enfield',
                'model_name' => 'Meteor 350',
                'registration_number' => 'KA-03-XY-2003',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 9800,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-11-25',
                'primary_image_path' => 'bikes/meteor-fireball-yellow.jpg',
            ],
            [
                'category_id' => $cruiser->id,
                'current_store_id' => $indiranagar->id,
                'home_store_id' => $indiranagar->id,
                'brand' => 'Honda',
                'model_name' => "H'ness CB350",
                'registration_number' => 'KA-03-XY-2004',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 7400,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-12-10',
                'primary_image_path' => 'bikes/cb350-red.jpg',
            ],
            [
                'category_id' => $sports->id,
                'current_store_id' => $indiranagar->id,
                'home_store_id' => $indiranagar->id,
                'brand' => 'KTM',
                'model_name' => 'Duke 250',
                'registration_number' => 'KA-03-XY-2005',
                'fuel_type' => FuelType::PETROL,
                'transmission' => Transmission::MANUAL,
                'odometer_reading' => 11200,
                'status' => BikeStatus::AVAILABLE,
                'next_service_due_date' => '2026-10-20',
                'primary_image_path' => 'bikes/duke-250-orange.jpg',
            ],
        ];

        foreach ($bikesData as $data) {
            $bike = Bike::firstOrCreate(
                ['registration_number' => $data['registration_number']],
                $data
            );

            // Document placeholders: RC, Insurance, Emission Certificate
            $regClean = strtolower(str_replace('-', '_', $bike->registration_number));

            BikeDocument::firstOrCreate(
                [
                    'bike_id' => $bike->id,
                    'document_type' => BikeDocumentType::RC,
                ],
                [
                    'file_path' => "documents/bikes/{$regClean}_rc.pdf",
                    'issue_date' => '2024-01-15',
                    'expiry_date' => '2039-01-14',
                    'uploaded_by' => $uploader?->id,
                    'verified' => true,
                ]
            );

            BikeDocument::firstOrCreate(
                [
                    'bike_id' => $bike->id,
                    'document_type' => BikeDocumentType::INSURANCE,
                ],
                [
                    'file_path' => "documents/bikes/{$regClean}_insurance.pdf",
                    'issue_date' => '2026-01-01',
                    'expiry_date' => '2027-01-01',
                    'uploaded_by' => $uploader?->id,
                    'verified' => true,
                ]
            );

            BikeDocument::firstOrCreate(
                [
                    'bike_id' => $bike->id,
                    'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
                ],
                [
                    'file_path' => "documents/bikes/{$regClean}_emission.pdf",
                    'issue_date' => '2026-06-01',
                    'expiry_date' => '2026-12-01',
                    'uploaded_by' => $uploader?->id,
                    'verified' => true,
                ]
            );
        }
    }
}

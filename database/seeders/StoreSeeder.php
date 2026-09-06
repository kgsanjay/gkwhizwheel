<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = [
            [
                'name' => 'GK WhizWheels Main Office',
                'address_line' => 'Palya Main Rd, Honnavar',
                'city' => 'Honnavar',
                'state' => 'Karnataka',
                'pincode' => '581334',
                'latitude' => 14.2800000,
                'longitude' => 74.4500000,
                'phone' => '+918660989586',
                'operating_hours' => [
                    'mon' => '07:30-21:30',
                    'tue' => '07:30-21:30',
                    'wed' => '07:30-21:30',
                    'thu' => '07:30-21:30',
                    'fri' => '07:30-21:30',
                    'sat' => '07:00-22:00',
                    'sun' => '07:00-22:00',
                ],
                'status' => StoreStatus::ACTIVE,
            ],
            [
                'name' => 'Honnavar Railway Station Hub',
                'address_line' => 'Railway Station Road, Honnavar',
                'city' => 'Honnavar',
                'state' => 'Karnataka',
                'pincode' => '581334',
                'latitude' => 14.2950000,
                'longitude' => 74.4600000,
                'phone' => '+918660989586',
                'operating_hours' => [
                    'mon' => '07:30-21:30',
                    'tue' => '07:30-21:30',
                    'wed' => '07:30-21:30',
                    'thu' => '07:30-21:30',
                    'fri' => '07:30-21:30',
                    'sat' => '07:00-22:00',
                    'sun' => '07:00-22:00',
                ],
                'status' => StoreStatus::ACTIVE,
            ],
        ];

        foreach ($stores as $storeData) {
            Store::firstOrCreate(
                ['name' => $storeData['name']],
                $storeData
            );
        }
    }
}

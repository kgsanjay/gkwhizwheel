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
                'name' => 'Koramangala Hub',
                'address_line' => '80 Feet Road, 4th Block, Koramangala',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560034',
                'latitude' => 12.9352000,
                'longitude' => 77.6245000,
                'phone' => '+919888800001',
                'operating_hours' => [
                    'mon' => '08:00-21:00',
                    'tue' => '08:00-21:00',
                    'wed' => '08:00-21:00',
                    'thu' => '08:00-21:00',
                    'fri' => '08:00-21:00',
                    'sat' => '07:00-22:00',
                    'sun' => '07:00-22:00',
                ],
                'status' => StoreStatus::ACTIVE,
            ],
            [
                'name' => 'Indiranagar Station',
                'address_line' => '100 Feet Road, HAL 2nd Stage, Indiranagar',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560038',
                'latitude' => 12.9784000,
                'longitude' => 77.6408000,
                'phone' => '+919888800002',
                'operating_hours' => [
                    'mon' => '08:00-21:00',
                    'tue' => '08:00-21:00',
                    'wed' => '08:00-21:00',
                    'thu' => '08:00-21:00',
                    'fri' => '08:00-21:00',
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

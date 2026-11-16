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
                'whatsapp' => '918660989586',
                'services' => ['two_wheelers', 'taxi', 'homestay', 'boating', 'guide'],
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
                'whatsapp' => '918660989586',
                'services' => ['two_wheelers', 'taxi', 'homestay', 'boating', 'guide'],
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
                'name' => 'GK WhizWheels Murudeshwar Hub',
                'address_line' => 'Temple Main Road, Murudeshwar',
                'city' => 'Murudeshwar',
                'state' => 'Karnataka',
                'pincode' => '581350',
                'latitude' => 14.0940000,
                'longitude' => 74.4899000,
                'phone' => '+917892094155',
                'whatsapp' => '917892094155',
                'services' => ['two_wheelers', 'taxi', 'rooms', 'scuba', 'guide'],
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

        // Ensure default pickup points have approved directional fees (0.00 for free hub, not null)
        $honnavarStore = Store::where('city', 'Honnavar')->first();
        if ($honnavarStore) {
            \App\Models\PickupPoint::updateOrCreate(
                ['store_id' => $honnavarStore->id, 'slug' => 'gk-whizwheel-store'],
                [
                    'name' => 'G.K. WhizWheel Store',
                    'address_line' => 'Palya Main Rd, Honnavar, Karnataka 581334',
                    'pickup_fee' => 0.00,
                    'return_fee' => 0.00,
                    'supports_pickup' => true,
                    'supports_return' => true,
                    'is_active' => true,
                ]
            );
            \App\Models\PickupPoint::updateOrCreate(
                ['store_id' => $honnavarStore->id, 'slug' => 'ksrtc-bus-stand-honnavar'],
                [
                    'name' => 'KSRTC Bus Stand Honnavar',
                    'address_line' => 'KSRTC Bus Stand, Honnavar, Karnataka 581334',
                    'pickup_fee' => 50.00,
                    'return_fee' => 50.00,
                    'supports_pickup' => true,
                    'supports_return' => true,
                    'is_active' => true,
                ]
            );
            \App\Models\PickupPoint::updateOrCreate(
                ['store_id' => $honnavarStore->id, 'slug' => 'railway-station-honnavar'],
                [
                    'name' => 'Railway Station Honnavar',
                    'address_line' => 'Railway Station Rd, Karki, Karnataka 581341',
                    'pickup_fee' => 50.00,
                    'return_fee' => 50.00,
                    'supports_pickup' => true,
                    'supports_return' => true,
                    'is_active' => true,
                ]
            );
            \App\Models\PickupPoint::updateOrCreate(
                ['store_id' => $honnavarStore->id, 'slug' => 'sharavati-circle'],
                [
                    'name' => 'Sharavati Circle',
                    'address_line' => 'Sharavati Circle, Honnavar, Karnataka 581334',
                    'pickup_fee' => 30.00,
                    'return_fee' => 30.00,
                    'supports_pickup' => true,
                    'supports_return' => true,
                    'is_active' => true,
                ]
            );
        }
    }
}

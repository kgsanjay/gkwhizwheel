<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MultiServiceDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Dedicated Service Managers
        $managers = [
            [
                'name' => 'Captain Manjunath',
                'email' => 'boating.manager@whizwheel.com',
                'phone' => '+919999900021',
                'password' => Hash::make('Password123!'),
                'role' => UserRole::STORE_MANAGER,
                'status' => UserStatus::ACTIVE,
                'services' => ['boating'],
            ],
            [
                'name' => 'Ganesh Naik',
                'email' => 'taxi.lead@whizwheel.com',
                'phone' => '+919999900022',
                'password' => Hash::make('Password123!'),
                'role' => UserRole::STORE_MANAGER,
                'status' => UserStatus::ACTIVE,
                'services' => ['taxi', 'tours'],
            ],
            [
                'name' => 'Deepa Bhat',
                'email' => 'scuba.stay@whizwheel.com',
                'phone' => '+919999900023',
                'password' => Hash::make('Password123!'),
                'role' => UserRole::STORE_MANAGER,
                'status' => UserStatus::ACTIVE,
                'services' => ['scuba', 'homestay'],
            ],
            [
                'name' => 'Raghavendra Hegde',
                'email' => 'guide.lead@whizwheel.com',
                'phone' => '+919999900024',
                'password' => Hash::make('Password123!'),
                'role' => UserRole::STORE_MANAGER,
                'status' => UserStatus::ACTIVE,
                'services' => ['guide'],
            ],
        ];

        $createdManagers = [];
        foreach ($managers as $m) {
            $user = User::firstOrCreate(
                ['email' => $m['email']],
                [
                    'name' => $m['name'],
                    'phone' => $m['phone'],
                    'password' => $m['password'],
                    'role' => $m['role'],
                    'status' => $m['status'],
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles([UserRole::STORE_MANAGER->value]);
            $user->syncAssignedServices($m['services']);
            $createdManagers[$m['email']] = $user;
        }

        // 2. Ensure essential ServiceItems exist
        $items = [
            'boating' => [
                'name' => 'Sharavathi Mangrove Safari Boat',
                'category' => 'Mangrove Exploration',
                'price_base' => 2000.00,
                'price_unit' => 'per_boat',
                'capacity' => '6 passengers',
                'features' => ['Life Jackets Provided', 'Certified Boat Pilot', 'Eco-friendly 4-stroke Engine', 'Birdwatching Guide'],
            ],
            'taxi' => [
                'name' => 'Innova Crysta AC (6+1)',
                'category' => 'SUV / MUV',
                'price_base' => 4500.00,
                'price_unit' => 'per_trip',
                'capacity' => '6 Passengers + Luggage',
                'features' => ['Chauffeur Included', 'AC Enabled', 'Toll & Fuel Included', 'Luggage Carrier'],
            ],
            'tours' => [
                'name' => 'Coastal Karnataka Day Trail (Gokarna + Murudeshwar)',
                'category' => 'Full Day Sightseeing',
                'price_base' => 4500.00,
                'price_unit' => 'per_group',
                'capacity' => 'Up to 6 guests',
                'features' => ['Private AC Vehicle', 'Pick & Drop at Hub', 'Temple & Beach Stops', 'Flexible Timing'],
            ],
            'scuba' => [
                'name' => 'Netrani Island Discover Scuba Dive',
                'category' => 'Island Scuba',
                'price_base' => 4500.00,
                'price_unit' => 'per_person',
                'capacity' => '1 diver with instructor',
                'features' => ['PADI Certified Master', 'Speedboat Transfer Included', 'Underwater 4K Video & Photos', 'All Scuba Gear'],
            ],
            'homestay' => [
                'name' => 'Aversa Riverfront Heritage Homestay',
                'category' => 'Riverview Villa',
                'price_base' => 3200.00,
                'price_unit' => 'per_night',
                'capacity' => '4 guests (2 bedrooms)',
                'features' => ['Complimentary Malnad Breakfast', 'High-speed WiFi', 'AC Rooms', 'Private Riverside Deck'],
            ],
            'guide' => [
                'name' => 'Honnavar Heritage & Estuary Storyteller Guide',
                'category' => 'Historical & Temple Guide',
                'price_base' => 1500.00,
                'price_unit' => 'per_day',
                'capacity' => 'Groups up to 10',
                'features' => ['Certified Historian', 'Kannada & English Fluency', 'Port & Fort Trail', 'Hidden Spots Access'],
            ],
        ];

        $serviceItemModels = [];
        foreach ($items as $type => $data) {
            $item = ServiceItem::firstOrCreate(
                ['service_type' => $type, 'name' => $data['name']],
                [
                    'category' => $data['category'],
                    'price_base' => $data['price_base'],
                    'price_unit' => $data['price_unit'],
                    'capacity' => $data['capacity'],
                    'features' => $data['features'],
                    'status' => 'available',
                ]
            );
            $serviceItemModels[$type] = $item;
        }

        // 3. Create Sample Bookings for Each Service
        $sampleBookings = [
            // Boating Walk-in
            [
                'booking_number' => 'GKW-BT-'.now()->format('ymd').'-W101',
                'service_type' => 'boating',
                'service_item_id' => $serviceItemModels['boating']->id,
                'customer_name' => 'Naveen Rao',
                'customer_phone' => '9876541101',
                'customer_email' => 'naveen.rao@example.com',
                'booking_channel' => 'offline_walkin',
                'start_datetime' => Carbon::today()->setTime(10, 30),
                'quantity' => 1,
                'base_amount' => 2000.00,
                'advance_paid' => 800.00,
                'balance_due' => 1200.00,
                'payment_status' => 'partial',
                'payment_method' => 'cash',
                'status' => 'confirmed',
                'pickup_location' => 'Sharavathi River Jetty, Honnavar',
                'created_by' => $createdManagers['boating.manager@whizwheel.com']->id,
            ],
            // Boating Completed
            [
                'booking_number' => 'GKW-BT-'.now()->subDay()->format('ymd').'-C102',
                'service_type' => 'boating',
                'service_item_id' => $serviceItemModels['boating']->id,
                'customer_name' => 'Sunita Patil',
                'customer_phone' => '9876541102',
                'customer_email' => 'sunita.patil@example.com',
                'booking_channel' => 'online',
                'start_datetime' => Carbon::yesterday()->setTime(16, 00),
                'quantity' => 1,
                'base_amount' => 2000.00,
                'advance_paid' => 2000.00,
                'balance_due' => 0.00,
                'payment_status' => 'paid',
                'payment_method' => 'online',
                'status' => 'completed',
                'pickup_location' => 'Sharavathi River Jetty, Honnavar',
            ],
            // Taxi In Progress
            [
                'booking_number' => 'GKW-TX-'.now()->format('ymd').'-T201',
                'service_type' => 'taxi',
                'service_item_id' => $serviceItemModels['taxi']->id,
                'customer_name' => 'Vikram Verma',
                'customer_phone' => '9876541201',
                'customer_email' => 'vikram.verma@example.com',
                'booking_channel' => 'offline_phone',
                'start_datetime' => Carbon::today()->setTime(8, 00),
                'end_datetime' => Carbon::today()->setTime(20, 00),
                'quantity' => 1,
                'base_amount' => 4500.00,
                'advance_paid' => 1500.00,
                'balance_due' => 3000.00,
                'payment_status' => 'partial',
                'payment_method' => 'upi',
                'status' => 'in_progress',
                'pickup_location' => 'Honnavar Railway Station',
                'drop_location' => 'Gokarna Beach Resort',
                'created_by' => $createdManagers['taxi.lead@whizwheel.com']->id,
            ],
            // Tours Confirmed
            [
                'booking_number' => 'GKW-TR-'.now()->addDay()->format('ymd').'-P301',
                'service_type' => 'tours',
                'service_item_id' => $serviceItemModels['tours']->id,
                'customer_name' => 'Anita Desai',
                'customer_phone' => '9876541301',
                'customer_email' => 'anita.desai@example.com',
                'booking_channel' => 'online',
                'start_datetime' => Carbon::tomorrow()->setTime(9, 00),
                'quantity' => 1,
                'base_amount' => 4500.00,
                'advance_paid' => 2000.00,
                'balance_due' => 2500.00,
                'payment_status' => 'partial',
                'payment_method' => 'online',
                'status' => 'confirmed',
                'pickup_location' => 'Palya Main Rd Hub, Honnavar',
            ],
            // Scuba Confirmed
            [
                'booking_number' => 'GKW-SC-'.now()->addDays(2)->format('ymd').'-S401',
                'service_type' => 'scuba',
                'service_item_id' => $serviceItemModels['scuba']->id,
                'customer_name' => 'Rohit Sharma',
                'customer_phone' => '9876541401',
                'customer_email' => 'rohit.diver@example.com',
                'booking_channel' => 'online',
                'start_datetime' => Carbon::today()->addDays(2)->setTime(7, 30),
                'quantity' => 2,
                'base_amount' => 9000.00,
                'advance_paid' => 9000.00,
                'balance_due' => 0.00,
                'payment_status' => 'paid',
                'payment_method' => 'online',
                'status' => 'confirmed',
                'pickup_location' => 'Murudeshwar Port Boarding Jetty',
            ],
            // Homestay Confirmed
            [
                'booking_number' => 'GKW-HS-'.now()->addDays(3)->format('ymd').'-H501',
                'service_type' => 'homestay',
                'service_item_id' => $serviceItemModels['homestay']->id,
                'customer_name' => 'Meera Nambiar',
                'customer_phone' => '9876541501',
                'customer_email' => 'meera.nambiar@example.com',
                'booking_channel' => 'offline_walkin',
                'start_datetime' => Carbon::today()->addDays(3)->setTime(12, 00),
                'end_datetime' => Carbon::today()->addDays(5)->setTime(11, 00),
                'quantity' => 1,
                'base_amount' => 6400.00,
                'advance_paid' => 3200.00,
                'balance_due' => 3200.00,
                'payment_status' => 'partial',
                'payment_method' => 'upi',
                'status' => 'confirmed',
                'pickup_location' => 'Aversa Riverfront, Honnavar',
                'created_by' => $createdManagers['scuba.stay@whizwheel.com']->id,
            ],
            // Guide Walk-in
            [
                'booking_number' => 'GKW-GD-'.now()->format('ymd').'-G601',
                'service_type' => 'guide',
                'service_item_id' => $serviceItemModels['guide']->id,
                'customer_name' => 'Arun Joseph',
                'customer_phone' => '9876541601',
                'customer_email' => 'arun.joseph@example.com',
                'booking_channel' => 'offline_walkin',
                'start_datetime' => Carbon::today()->setTime(14, 00),
                'quantity' => 1,
                'base_amount' => 1500.00,
                'advance_paid' => 1500.00,
                'balance_due' => 0.00,
                'payment_status' => 'paid',
                'payment_method' => 'cash',
                'status' => 'confirmed',
                'pickup_location' => 'Basavaraj Durga Fort Viewpoint, Honnavar',
                'created_by' => $createdManagers['guide.lead@whizwheel.com']->id,
            ],
        ];

        foreach ($sampleBookings as $b) {
            ServiceBooking::firstOrCreate(
                ['booking_number' => $b['booking_number']],
                $b
            );
        }
    }
}

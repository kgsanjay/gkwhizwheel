<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ServiceItem;
use Illuminate\Database\Seeder;

class ServiceItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // 1. Two-Wheelers
            [
                'service_type' => 'two_wheelers',
                'name' => 'Honda Activa 6G (110cc)',
                'category' => 'Automatic Scooter',
                'description' => 'Lightweight, effortless automatic scooter perfect for local Honnavar town, Eco Beach, and mangrove trails. 50+ kmpl mileage with sanitized helmet included.',
                'price_base' => 350.00,
                'price_unit' => 'per_day',
                'capacity' => '2 Persons',
                'image_url' => 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Zero Deposit',
                'features' => ['2 ISI Helmets', 'Zero Security Deposit', 'Phone Mount & Charger', 'Roadside Assistance'],
                'status' => 'available',
                'sort_order' => 1,
            ],
            [
                'service_type' => 'two_wheelers',
                'name' => 'Royal Enfield Classic 350',
                'category' => 'Cruiser Motorcycle',
                'description' => 'Iconic thumper cruiser engineered for the coastal highway, Gokarna headlands, and Western Ghats twisties. High torque and comfortable touring seats.',
                'price_base' => 800.00,
                'price_unit' => 'per_day',
                'capacity' => '2 Persons',
                'image_url' => 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Highway Legend',
                'features' => ['Dual Disc ABS', 'Pannier Stays Available', 'Touring Mirrors', 'Unlimited Local KM'],
                'status' => 'available',
                'sort_order' => 2,
            ],
            [
                'service_type' => 'two_wheelers',
                'name' => 'Honda Shine 125cc',
                'category' => 'Geared Commuter',
                'description' => 'Smooth 5-speed 125cc commuter bike known for outstanding 65 kmpl fuel efficiency and rock-solid reliability across Honnavar and Murudeshwar.',
                'price_base' => 450.00,
                'price_unit' => 'per_day',
                'capacity' => '2 Persons',
                'image_url' => 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Top Mileage',
                'features' => ['Tubeless Tyres', 'Electric Start', 'Luggage Carrier', '55+ kmpl Mileage'],
                'status' => 'available',
                'sort_order' => 3,
            ],

            // 2. Taxi & Cab Services
            [
                'service_type' => 'taxi',
                'name' => 'Toyota Innova Crysta AC (7-Seater)',
                'category' => 'Luxury MUV / SUV',
                'description' => 'Spacious 7-seater premium AC cab with captain seats and large luggage trunk. Ideal for family tours to Murudeshwar, Gokarna, Jog Falls, or airport drops.',
                'price_base' => 18.00,
                'price_unit' => 'per_km',
                'capacity' => '7 Passengers + Driver',
                'image_url' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Family Favorite',
                'features' => ['Chilled Dual AC', 'Professional Local Chauffeur', 'Large Boot Space', 'Carrier Available'],
                'status' => 'available',
                'sort_order' => 1,
            ],
            [
                'service_type' => 'taxi',
                'name' => 'Maruti Suzuki Dzire AC Sedan',
                'category' => 'Sedan',
                'description' => 'Comfortable, fuel-efficient 4-seater sedan for station pickups, couple getaways, and outstation trips across coastal Uttara Kannada.',
                'price_base' => 12.00,
                'price_unit' => 'per_km',
                'capacity' => '4 Passengers + Driver',
                'image_url' => 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Best Value',
                'features' => ['Clean AC Cabin', 'FastTag Enabled', 'On-Time Station Pickup', 'Doorstep Drop'],
                'status' => 'available',
                'sort_order' => 2,
            ],
            [
                'service_type' => 'taxi',
                'name' => 'Tempo Traveller AC (12-Seater)',
                'category' => 'Group Minibus',
                'description' => 'Luxury pushback seating for large tourist groups and college friends exploring Jog Falls, Dandeli rafting, and coastal beach circuits.',
                'price_base' => 24.00,
                'price_unit' => 'per_km',
                'capacity' => '12 Passengers',
                'image_url' => 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Large Groups',
                'features' => ['Pushback Recliners', 'Music System', 'Experienced Ghats Driver', 'Luggage Compartment'],
                'status' => 'available',
                'sort_order' => 3,
            ],

            // 3. Backwater Boating
            [
                'service_type' => 'boating',
                'name' => 'Honnavar Backwater Boating',
                'category' => 'Mangrove Forest & Estuary Ride',
                'description' => 'A scenic boat ride through the famous Sharavathi backwaters and mangrove forests. Lush green mangrove tunnels, calm relaxing ride, and breathtaking sunset views.',
                'price_base' => 1500.00,
                'price_unit' => 'per_ride',
                'capacity' => 'Family / Group (1 - 1.5 Hour Ride)',
                'image_url' => '/images/services/honnavar-backwater-boating.jpg',
                'badge' => 'Special Offer ₹1,500 (Was ₹1,600)',
                'features' => ['Lush Green Mangrove Tunnels', 'Perfect for Sunset Views 🌅', 'Calm & Relaxing Ride', 'Great for Photography 📸', 'Duration: 1 to 1.5 Hours', '100% Certified Lifejackets Provided'],
                'status' => 'available',
                'sort_order' => 1,
            ],

            // 4. Netrani Scuba Diving
            [
                'service_type' => 'scuba',
                'name' => 'Netrani Island PADI Discovery Scuba (Beginner)',
                'category' => 'Introductory Scuba',
                'description' => 'No swimming skills required. Includes 1-on-1 PADI dive master guide, boat transfer from Murudeshwar, 30-min underwater dive, and HD 4K GoPro video.',
                'price_base' => 2999.00,
                'price_unit' => 'per_dive',
                'capacity' => '1 Diver / 1 Master',
                'image_url' => 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Top Adventure',
                'features' => ['HD GoPro 4K Video Included', 'Boat Ferry from Murudeshwar', 'All Scuba Gear & Suit', 'PADI Master Guided'],
                'status' => 'available',
                'sort_order' => 1,
            ],
            [
                'service_type' => 'scuba',
                'name' => 'Netrani Snorkeling & Marine Safari',
                'category' => 'Snorkeling',
                'description' => 'Float on the crystal clear waters of Netrani island with mask, snorkel, and life vest. Witness coral reefs, parrotfish, and turtles.',
                'price_base' => 1499.00,
                'price_unit' => 'per_person',
                'capacity' => 'Up to 20 Guests',
                'image_url' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Water Thrill',
                'features' => ['Snorkel Mask & Fins', 'Flotation Vest', 'Boat Ride Included', 'Safe for Non-Swimmers'],
                'status' => 'available',
                'sort_order' => 2,
            ],

            // 5. Coastal Homestays
            [
                'service_type' => 'homestay',
                'name' => 'Sharavathi Riverfront Heritage Cottage',
                'category' => 'Riverfront Cottage',
                'description' => 'Traditional Konkan-style heritage villa facing the river with private veranda, hammocks, fresh seafood home dining, and backwater boat dock access.',
                'price_base' => 1500.00,
                'price_unit' => 'per_night',
                'capacity' => '3 Guests / Room',
                'image_url' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Riverfront Serenity',
                'features' => ['AC & Attached Washroom', 'Authentic Karavali Breakfast', 'Private Veranda', 'Free WiFi & Parking'],
                'status' => 'available',
                'sort_order' => 1,
            ],
            [
                'service_type' => 'homestay',
                'name' => 'Eco Beach Wooden Canopy Suite',
                'category' => 'Beachside Wooden Suite',
                'description' => 'Steps away from Kasarkod Eco Beach with sound of crashing waves, tall coconut grove garden, and outdoor sitting areas.',
                'price_base' => 2200.00,
                'price_unit' => 'per_night',
                'capacity' => '4 Guests',
                'image_url' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Beach Walk',
                'features' => ['2 Min Walk to Eco Beach', 'Air Conditioned', 'Hot Water 24/7', 'Family Friendly'],
                'status' => 'available',
                'sort_order' => 2,
            ],

            // 6. Local Travel Guide
            [
                'service_type' => 'guide',
                'name' => 'Hidden Waterfalls & Trail Exploration Guide',
                'category' => 'Nature & Trek Guide',
                'description' => 'Accompanied by a native certified guide to explore secret Apsarakonda streams, hidden forest pools, mangrove walkways, and scenic hilltop lookouts.',
                'price_base' => 800.00,
                'price_unit' => 'per_trip',
                'capacity' => 'Group of up to 6',
                'image_url' => 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Insider Access',
                'features' => ['Native Local Born Guide', 'Kannada, English & Hindi', 'Secret Untouched Spots', 'Photography Assistance'],
                'status' => 'available',
                'sort_order' => 1,
            ],
            [
                'service_type' => 'guide',
                'name' => 'Mirjan Fort & Coastal Heritage Historian',
                'category' => 'Heritage Guide',
                'description' => 'Uncover the fascinating 16th century history of Queen Chennabhairadevi (The Pepper Queen), Mirjan Fort battlements, and ancient coastal temples.',
                'price_base' => 1200.00,
                'price_unit' => 'per_trip',
                'capacity' => 'Up to 10 People',
                'image_url' => 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Heritage & Culture',
                'features' => ['Complete Fort Architecture Walk', 'Historical Storytelling', 'Great for Families & Students', 'Duration: 3 Hours'],
                'status' => 'available',
                'sort_order' => 2,
            ],

            // 7. Karnataka Tour Packages
            [
                'service_type' => 'tours',
                'name' => '2D/1N Coastal Karavali Explorer Circuit',
                'category' => 'All-Inclusive Package',
                'description' => 'Honnavar Backwaters + Kasarkod Eco Beach + Apsarakonda Waterfall + Mirjan Fort + Murudeshwar Temple & Beach sunset. Includes cab, stay & boating.',
                'price_base' => 4999.00,
                'price_unit' => 'per_person',
                'capacity' => 'Min 2 Persons',
                'image_url' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Most Popular',
                'features' => ['1 Night Riverfront Stay', 'Dedicated AC Cab / Two-Wheeler', 'Sharavathi Mangrove Boat Ticket', 'Breakfast Included'],
                'status' => 'available',
                'sort_order' => 1,
            ],
            [
                'service_type' => 'tours',
                'name' => '3D/2N Complete Karnataka Coastal Safari',
                'category' => 'Extended Circuit',
                'description' => 'Covers Honnavar, Gokarna (Om Beach, Kudle), Murudeshwar giant Shiva, Jog Falls grand canyon, and Yana monolithic limestone rocks.',
                'price_base' => 8999.00,
                'price_unit' => 'per_person',
                'capacity' => 'Min 2 Persons',
                'image_url' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
                'badge' => 'Ultimate Circuit',
                'features' => ['2 Nights Premium Stays', 'All Monument & Boat Entries', 'Private Chauffeur Driven AC Cab', 'Flexible Itinerary'],
                'status' => 'available',
                'sort_order' => 2,
            ],
        ];

        foreach ($items as $item) {
            ServiceItem::updateOrCreate(
                [
                    'service_type' => $item['service_type'],
                    'name' => $item['name'],
                ],
                $item
            );
        }
    }
}

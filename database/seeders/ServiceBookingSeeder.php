<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ServiceBookingSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'super_admin')->first() ?? User::first();
        $adminId = $admin?->id;

        $items = ServiceItem::all()->keyBy(fn ($i) => "{$i->service_type}_{$i->name}");

        $innova = ServiceItem::where('service_type', 'taxi')->where('name', 'like', '%Innova%')->first();
        $cruise = ServiceItem::where('service_type', 'boating')->where('name', 'like', '%Mangrove%')->first();
        $scuba = ServiceItem::where('service_type', 'scuba')->where('name', 'like', '%Discovery%')->first();
        $stay = ServiceItem::where('service_type', 'homestay')->where('name', 'like', '%Heritage%')->first();

        $sampleBookings = [
            [
                'booking_number' => 'GKW-TX-260908-1001',
                'service_type' => 'taxi',
                'service_item_id' => $innova?->id,
                'customer_name' => 'Rahul Sharma',
                'customer_phone' => '9845123456',
                'customer_email' => 'rahul.sharma@example.com',
                'booking_channel' => 'online',
                'start_datetime' => Carbon::now()->addDays(1)->setHour(9)->setMinute(0),
                'end_datetime' => Carbon::now()->addDays(1)->setHour(19)->setMinute(0),
                'pickup_location' => 'Honnavar Railway Station Hub',
                'drop_location' => 'Murudeshwar Temple & Back',
                'quantity' => 1,
                'base_amount' => 3600.00,
                'tax_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => 3600.00,
                'advance_paid' => 1000.00,
                'balance_due' => 2600.00,
                'payment_status' => 'partial',
                'payment_method' => 'online',
                'status' => 'confirmed',
                'customer_notes' => 'Train arrives at 8:45 AM. Need child seat if possible.',
                'admin_notes' => 'Assigned Chauffeur: Ramesh (+91 9731699125)',
                'created_by' => null,
            ],
            [
                'booking_number' => 'GKW-BT-260908-1002',
                'service_type' => 'boating',
                'service_item_id' => $cruise?->id,
                'customer_name' => 'Pooja Hegde',
                'customer_phone' => '8861987654',
                'customer_email' => 'pooja.h@gmail.com',
                'booking_channel' => 'offline_walkin',
                'start_datetime' => Carbon::now()->addHours(2),
                'end_datetime' => Carbon::now()->addHours(3),
                'pickup_location' => 'Sharavathi Boat Jetty, Honnavar',
                'drop_location' => 'Mangrove Trail Dock',
                'quantity' => 4,
                'base_amount' => 1600.00,
                'tax_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => 1600.00,
                'advance_paid' => 1600.00,
                'balance_due' => 0.00,
                'payment_status' => 'paid',
                'payment_method' => 'cash',
                'status' => 'in_progress',
                'customer_notes' => 'Walk-in booking at Palya Main Rd counter.',
                'admin_notes' => 'Life jackets issued. Boat #3 assigned.',
                'created_by' => $adminId,
            ],
            [
                'booking_number' => 'GKW-SC-260908-1003',
                'service_type' => 'scuba',
                'service_item_id' => $scuba?->id,
                'customer_name' => 'Ankit Verma',
                'customer_phone' => '9448011223',
                'customer_email' => 'ankit.v@yahoo.com',
                'booking_channel' => 'online',
                'start_datetime' => Carbon::now()->addDays(2)->setHour(6)->setMinute(30),
                'end_datetime' => Carbon::now()->addDays(2)->setHour(14)->setMinute(0),
                'pickup_location' => 'Murudeshwar Main Harbor Gate',
                'drop_location' => 'Netrani Island Reef',
                'quantity' => 2,
                'base_amount' => 5998.00,
                'tax_amount' => 0.00,
                'discount_amount' => 500.00,
                'total_amount' => 5498.00,
                'advance_paid' => 2000.00,
                'balance_due' => 3498.00,
                'payment_status' => 'partial',
                'payment_method' => 'upi',
                'status' => 'confirmed',
                'customer_notes' => 'First time diving. Celebrating birthday!',
                'admin_notes' => 'Confirmed with Netrani dive boat captain.',
                'created_by' => null,
            ],
            [
                'booking_number' => 'GKW-HS-260908-1004',
                'service_type' => 'homestay',
                'service_item_id' => $stay?->id,
                'customer_name' => 'Kiran Bhat',
                'customer_phone' => '9731699125',
                'customer_email' => 'kiranbhat@whizwheels.in',
                'booking_channel' => 'offline_phone',
                'start_datetime' => Carbon::now()->addDays(3)->setHour(12)->setMinute(0),
                'end_datetime' => Carbon::now()->addDays(5)->setHour(11)->setMinute(0),
                'pickup_location' => 'Palya Main Rd Hub',
                'drop_location' => 'Sharavathi Riverfront Heritage Cottage',
                'quantity' => 2, // 2 nights
                'base_amount' => 3000.00,
                'tax_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => 3000.00,
                'advance_paid' => 1500.00,
                'balance_due' => 1500.00,
                'payment_status' => 'partial',
                'payment_method' => 'upi',
                'status' => 'confirmed',
                'customer_notes' => 'Requested ground floor room with river view.',
                'admin_notes' => 'Advance received via GPay. Balance to be settled on check-in.',
                'created_by' => $adminId,
            ],
        ];

        foreach ($sampleBookings as $booking) {
            ServiceBooking::updateOrCreate(
                ['booking_number' => $booking['booking_number']],
                $booking
            );
        }
    }
}

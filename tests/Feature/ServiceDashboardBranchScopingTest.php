<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('manager dashboard reports only assigned branch service inventory and bookings', function (): void {
    $honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888876001', 'status' => StoreStatus::ACTIVE,
    ]);
    $murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888876002', 'status' => StoreStatus::ACTIVE,
    ]);
    $manager = User::create([
        'name' => 'Honnavar Manager', 'email' => 'dashboard.manager@example.test',
        'phone' => '9888876003', 'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $manager->stores()->attach($honnavar->id);
    $manager->syncAssignedServices(['taxi']);

    $own = ServiceItem::create([
        'store_id' => $honnavar->id, 'service_type' => 'taxi',
        'name' => 'Honnavar Cab', 'price_base' => 1800, 'status' => 'available',
    ]);
    $other = ServiceItem::create([
        'store_id' => $murudeshwar->id, 'service_type' => 'taxi',
        'name' => 'Murudeshwar Cab', 'price_base' => 2000, 'status' => 'available',
    ]);
    ServiceItem::create(['service_type' => 'taxi', 'name' => 'Unassigned Cab',
        'price_base' => 1400, 'status' => 'available']);
    foreach ([[$own,$honnavar,'GKW-TX-HON-01'],[$other,$murudeshwar,'GKW-TX-MUR-01']] as [$item,$store,$number]) {
        ServiceBooking::create([
            'store_id' => $store->id,
            'service_item_id' => $item->id,
            'service_type' => 'taxi',
            'booking_number' => $number,
            'customer_name' => 'Customer',
            'customer_phone' => '9888876004',
            'start_datetime' => now()->addDays(2),
            'total_amount' => 2000,
            'status' => 'confirmed',
        ]);
    }
    $this->actingAs($manager)->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('service_metrics', 1)
            ->where('service_metrics.0.items_count', 1)
            ->where('service_metrics.0.active_bookings', 1)
            ->has('recent_service_bookings', 1)
            ->where('recent_service_bookings.0.booking_number', 'GKW-TX-HON-01'));

    $this->actingAs($manager)->get('/admin/dashboard?store_id='.$murudeshwar->id)
        ->assertForbidden();
});

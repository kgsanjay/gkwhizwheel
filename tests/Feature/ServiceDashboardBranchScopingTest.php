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

test('relocation tasks appear only in dashboard data for their required branch', function (): void {
    $honnavar = Store::create([
        'name' => 'Honnavar Return Hub', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888876021', 'status' => StoreStatus::ACTIVE,
    ]);
    $murudeshwar = Store::create([
        'name' => 'Murudeshwar Return Hub', 'address_line' => 'Bus Stand Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888876022', 'status' => StoreStatus::ACTIVE,
    ]);
    $manager = User::create([
        'name' => 'Murudeshwar Manager', 'email' => 'relocation.manager@example.test',
        'phone' => '9888876023', 'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $manager->stores()->attach($murudeshwar->id);
    $manager->syncAssignedServices(['two_wheelers']);
    $customer = User::create([
        'name' => 'Rider', 'email' => 'relocation.rider@example.test',
        'phone' => '9888876024', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $category = \App\Models\BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 600, 'default_deposit_amount' => 0,
    ]);
    $bike = \App\Models\Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $honnavar->id, 'home_store_id' => $murudeshwar->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-XY-9090',
        'fuel_type' => \App\Enums\FuelType::PETROL,
        'transmission' => \App\Enums\Transmission::AUTOMATIC,
        'status' => \App\Enums\BikeStatus::AVAILABLE,
    ]);
    $details = [
        'bike_id' => $bike->id, 'user_id' => $customer->id,
        'channel' => \App\Enums\BookingChannel::ONLINE,
        'start_date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(4)->toDateString(),
        'base_amount' => 1200, 'total_amount' => 1200, 'deposit_amount' => 0,
        'price_breakdown_json' => [],
        'status' => \App\Enums\BookingStatus::CONFIRMED,
    ];
    $trigger = \App\Models\Booking::create($details + [
        'booking_reference' => 'RELOC-TRIGGER-01',
        'idempotency_key' => 'reloc-trigger',
        'pickup_store_id' => $honnavar->id,
        'return_store_id' => $honnavar->id,
    ]);
    $affected = \App\Models\Booking::create($details + [
        'booking_reference' => 'RELOC-AFFECTED-01',
        'idempotency_key' => 'reloc-affected',
        'pickup_store_id' => $murudeshwar->id,
        'return_store_id' => $murudeshwar->id,
    ]);
    \App\Models\BikeRelocationTask::create([
        'bike_id' => $bike->id,
        'triggering_booking_id' => $trigger->id,
        'affected_booking_id' => $affected->id,
        'from_store_id' => $honnavar->id,
        'required_store_id' => $murudeshwar->id,
        'status' => 'open',
    ]);

    $this->actingAs($manager)->get('/admin/dashboard')
        ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('pending_relocations', 1)
            ->where('pending_relocations.0.affected_booking_reference', 'RELOC-AFFECTED-01'));

    $manager->stores()->sync([$honnavar->id]);
    $manager->refresh();
    $this->actingAs($manager)->get('/admin/dashboard')
        ->assertOk()->assertInertia(fn (Assert $page) => $page->has('pending_relocations', 0));
});

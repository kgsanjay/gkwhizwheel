<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'superadmin_rbac@gkwhizwheel.com',
        'phone' => '9876540001',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->taxiManager = User::create([
        'name' => 'Taxi & Boat Manager',
        'email' => 'taximanager@gkwhizwheel.com',
        'phone' => '9876540002',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->taxiManager->syncAssignedServices(['taxi', 'boating']);

    $this->defaultStaff = User::create([
        'name' => 'Default Bike Staff',
        'email' => 'bikestaff@gkwhizwheel.com',
        'phone' => '9876540003',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store = Store::create([
        'name' => 'Honnavar Main Hub',
        'address_line' => 'NH 66, Honnavar',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2800,
        'longitude' => 74.4500,
        'phone' => '9876549999',
        'status' => StoreStatus::ACTIVE,
    ]);
});

test('super admin can access all service routes without restrictions', function (): void {
    $services = ['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'];

    foreach ($services as $service) {
        $response = $this->actingAs($this->superAdmin)->get("/admin/services/{$service}/items");
        $response->assertOk();
    }
});

test('manager with taxi and boating can access taxi and boating routes', function (): void {
    $this->actingAs($this->taxiManager)
        ->get('/admin/services/taxi/items')
        ->assertOk();

    $this->actingAs($this->taxiManager)
        ->get('/admin/services/boating/items')
        ->assertOk();
});

test('manager is forbidden from accessing unassigned service routes', function (): void {
    $this->actingAs($this->taxiManager)
        ->get('/admin/services/scuba/items')
        ->assertForbidden();

    $this->actingAs($this->taxiManager)
        ->get('/admin/services/homestay/items')
        ->assertForbidden();

    $this->actingAs($this->taxiManager)
        ->get('/admin/services/guide/items')
        ->assertForbidden();
});

test('staff without assigned services defaults to two_wheelers and is blocked from taxi', function (): void {
    $this->actingAs($this->defaultStaff)
        ->get('/admin/services/two_wheelers/items')
        ->assertOk();

    $this->actingAs($this->defaultStaff)
        ->get('/admin/services/taxi/items')
        ->assertForbidden();
});

test('super admin can create staff account with assigned services synced to service_user table', function (): void {
    $payload = [
        'name' => 'Scuba Lead Manager',
        'email' => 'scuba.lead@gkwhizwheel.com',
        'phone' => '9876540010',
        'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER->value,
        'store_ids' => [$this->store->id],
        'services' => ['scuba', 'boating'],
    ];

    $this->actingAs($this->superAdmin)
        ->post('/admin/staff', $payload)
        ->assertRedirect('/admin/staff')
        ->assertSessionHas('success');

    $newUser = User::where('email', 'scuba.lead@gkwhizwheel.com')->first();
    expect($newUser)->not->toBeNull();
    expect($newUser->assignedServicesList())->toEqualCanonicalizing(['scuba', 'boating']);

    $this->assertDatabaseHas('service_user', [
        'user_id' => $newUser->id,
        'service_type' => 'scuba',
    ]);
    $this->assertDatabaseHas('service_user', [
        'user_id' => $newUser->id,
        'service_type' => 'boating',
    ]);
});

test('super admin can update staff assigned services', function (): void {
    $updatePayload = [
        'name' => 'Taxi & Boat Manager Updated',
        'email' => 'taximanager@gkwhizwheel.com',
        'phone' => '9876540002',
        'role' => UserRole::STORE_MANAGER->value,
        'status' => UserStatus::ACTIVE->value,
        'services' => ['homestay', 'guide', 'tours'],
    ];

    $this->actingAs($this->superAdmin)
        ->put("/admin/staff/{$this->taxiManager->id}", $updatePayload)
        ->assertRedirect('/admin/staff')
        ->assertSessionHas('success');

    $this->taxiManager->refresh();
    expect($this->taxiManager->assignedServicesList())->toEqualCanonicalizing(['homestay', 'guide', 'tours']);

    // Should now be forbidden from old service (taxi) and permitted for new service (homestay)
    $this->actingAs($this->taxiManager)
        ->get('/admin/services/taxi/items')
        ->assertForbidden();

    $this->actingAs($this->taxiManager)
        ->get('/admin/services/homestay/items')
        ->assertOk();
});

test('inertia shared auth user includes assigned_services', function (): void {
    $this->actingAs($this->taxiManager)
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('auth.user.assigned_services', 2)
                ->where('auth.user.assigned_services', fn ($val) => $val->contains('taxi') && $val->contains('boating'))
        );
});

test('dashboard provides role-scoped service_metrics and recent_service_bookings', function (): void {
    $taxiItem = \App\Models\ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Innova Crysta AC',
        'category' => 'SUV / MUV',
        'price_base' => 3500.00,
        'price_unit' => 'per_trip',
        'capacity' => '6+1 Seater',
        'status' => 'active',
    ]);

    $scubaItem = \App\Models\ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Island Dive',
        'category' => 'Island Scuba',
        'price_base' => 4500.00,
        'price_unit' => 'per_person',
        'capacity' => '1 diver',
        'status' => 'active',
    ]);

    \App\Models\ServiceBooking::create([
        'booking_number' => 'GKW-TX-260909-TEST',
        'service_type' => 'taxi',
        'service_item_id' => $taxiItem->id,
        'customer_name' => 'John Doe',
        'customer_phone' => '9876543210',
        'start_datetime' => now()->addDays(1),
        'quantity' => 1,
        'total_amount' => 3500.00,
        'advance_paid' => 1000.00,
        'balance_due' => 2500.00,
        'payment_status' => 'partial',
        'status' => 'confirmed',
        'booking_channel' => 'walk_in',
        'pickup_location' => 'Honnavar Hub',
    ]);

    \App\Models\ServiceBooking::create([
        'booking_number' => 'GKW-SC-260909-TEST',
        'service_type' => 'scuba',
        'service_item_id' => $scubaItem->id,
        'customer_name' => 'Alice Diver',
        'customer_phone' => '9876543211',
        'start_datetime' => now()->addDays(2),
        'quantity' => 1,
        'total_amount' => 4500.00,
        'advance_paid' => 4500.00,
        'balance_due' => 0.00,
        'payment_status' => 'paid',
        'status' => 'confirmed',
        'booking_channel' => 'online',
        'pickup_location' => 'Murudeshwar Port',
    ]);

    // Taxi Manager only sees taxi and boating (not scuba)
    $this->actingAs($this->taxiManager)
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('service_metrics', 2)
                ->where('assigned_services', fn ($val) => collect($val)->sort()->values()->all() === ['boating', 'taxi'])
                ->has('recent_service_bookings', 1)
                ->where('recent_service_bookings.0.booking_number', 'GKW-TX-260909-TEST')
        );

    // Super admin sees all services
    $this->actingAs($this->superAdmin)
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('service_metrics', 7)
                ->has('recent_service_bookings', 2)
        );
});

test('manager can record offline counter booking with balance calculation', function (): void {
    $item = \App\Models\ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Ertiga Cab',
        'category' => 'SUV / MUV',
        'price_base' => 2800.00,
        'price_unit' => 'per_trip',
        'capacity' => '6 Seater',
        'status' => 'active',
    ]);

    $payload = [
        'service_item_id' => $item->id,
        'customer_name' => 'Ramesh Walkin',
        'customer_phone' => '9876512345',
        'customer_email' => 'ramesh@example.com',
        'start_datetime' => now()->addDay()->format('Y-m-d\TH:i'),
        'pickup_location' => 'Honnavar Railway Station',
        'drop_location' => 'Murudeshwar Temple',
        'quantity' => 1,
        'base_amount' => 2800.00,
        'discount_amount' => 0.00,
        'advance_paid' => 800.00,
        'payment_method' => 'cash',
        'booking_channel' => 'offline_walkin',
        'status' => 'confirmed',
        'customer_notes' => 'Airport pickup request',
    ];

    $response = $this->actingAs($this->taxiManager)
        ->post('/admin/services/taxi/bookings', $payload);

    $response->assertRedirect('/admin/services/taxi/bookings')
        ->assertSessionHas('success');

    $booking = \App\Models\ServiceBooking::where('customer_phone', '9876512345')->first();
    expect($booking)->not->toBeNull();
    expect($booking->service_type)->toBe('taxi');
    expect((float) $booking->total_amount)->toBe(2800.00);
    expect((float) $booking->advance_paid)->toBe(800.00);
    expect((float) $booking->balance_due)->toBe(2000.00);
    expect($booking->payment_status)->toBe('partial');
    expect($booking->booking_channel)->toBe('offline_walkin');
});

test('customer can initiate and verify online payment for service booking', function (): void {
    $customer = User::create([
        'name' => 'Priya Traveler',
        'email' => 'priya.traveler@example.com',
        'phone' => '9876599999',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $item = \App\Models\ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sunset Estuary Cruise',
        'category' => 'Sunset Cruise',
        'price_base' => 1500.00,
        'price_unit' => 'per_boat',
        'capacity' => '6 passengers',
        'status' => 'active',
    ]);

    $booking = \App\Models\ServiceBooking::create([
        'booking_number' => 'GKW-BT-260909-PAYT',
        'service_type' => 'boating',
        'service_item_id' => $item->id,
        'user_id' => $customer->id,
        'customer_name' => $customer->name,
        'customer_phone' => $customer->phone,
        'customer_email' => $customer->email,
        'start_datetime' => now()->addDays(3),
        'quantity' => 1,
        'total_amount' => 1500.00,
        'advance_paid' => 0.00,
        'balance_due' => 1500.00,
        'payment_status' => 'pending',
        'payment_method' => 'pay_on_arrival',
        'status' => 'confirmed',
        'booking_channel' => 'online',
        'pickup_location' => 'Sharavathi Jetty',
    ]);

    // 1. Initiate online payment
    $initResponse = $this->actingAs($customer)
        ->postJson("/services/bookings/{$booking->booking_number}/initiate-payment", [
            'amount' => 1500.00,
        ]);

    $initResponse->assertOk()
        ->assertJson([
            'success' => true,
            'amount' => 1500.00,
            'booking_number' => $booking->booking_number,
        ]);

    $orderData = $initResponse->json('order');
    expect($orderData['id'])->toStartWith('order_');

    // 2. Verify payment callback
    $verifyResponse = $this->actingAs($customer)
        ->postJson("/services/bookings/{$booking->booking_number}/verify-payment", [
            'razorpay_order_id' => $orderData['id'],
            'razorpay_payment_id' => 'pay_test_'.\Illuminate\Support\Str::random(10),
            'razorpay_signature' => 'test_sig',
            'amount' => 1500.00,
        ]);

    $verifyResponse->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $booking->refresh();
    expect((float) $booking->advance_paid)->toBe(1500.00);
    expect((float) $booking->balance_due)->toBe(0.00);
    expect($booking->payment_status)->toBe('paid');
    expect($booking->payment_method)->toBe('online');
});


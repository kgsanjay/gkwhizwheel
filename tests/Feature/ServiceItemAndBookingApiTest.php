<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin_api@gkwhizwheel.com',
        'phone' => '9876540001',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->storeA = Store::create([
        'name' => 'Honnavar Main Hub',
        'address_line' => 'NH 66, Honnavar',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2800,
        'longitude' => 74.4500,
        'phone' => '9876549991',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeB = Store::create([
        'name' => 'Murudeshwar Hub',
        'address_line' => 'Temple Rd, Murudeshwar',
        'city' => 'Murudeshwar',
        'state' => 'Karnataka',
        'pincode' => '581350',
        'latitude' => 14.0900,
        'longitude' => 74.4800,
        'phone' => '9876549992',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->boatManager = User::create([
        'name' => 'Boat & Taxi Manager',
        'email' => 'boatmanager_api@gkwhizwheel.com',
        'phone' => '9876540002',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->boatManager->stores()->attach($this->storeA->id);
    $this->boatManager->syncAssignedServices(['boating', 'taxi']);

    $this->staff = User::create([
        'name' => 'Store Staff',
        'email' => 'staff_api@gkwhizwheel.com',
        'phone' => '9876540003',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->storeA->id);
    $this->staff->syncAssignedServices(['two_wheelers', 'boating']);

    $this->customer = User::create([
        'name' => 'Normal Customer',
        'email' => 'customer_api@gkwhizwheel.com',
        'phone' => '9876540004',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->boatItem = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sharavathi Mangrove Cruise',
        'category' => 'Speedboat Safari',
        'description' => 'Scenic mangrove backwater cruise',
        'price_base' => 600.00,
        'price_unit' => 'per_person',
        'capacity' => '6 Guests',
        'status' => 'available',
        'sort_order' => 1,
    ]);

    $this->scubaItem = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Island Shore Dive',
        'category' => 'Introductory Shore Dive',
        'description' => 'Introductory dive session with certified instructor',
        'price_base' => 3500.00,
        'price_unit' => 'per_dive',
        'capacity' => '2 Divers',
        'status' => 'available',
        'sort_order' => 2,
    ]);
});

/*
|--------------------------------------------------------------------------
| Admin ServiceItemController Tests
|--------------------------------------------------------------------------
*/

test('unauthenticated users cannot access admin service-items', function (): void {
    $this->getJson('/api/v1/admin/service-items')->assertStatus(401);
    $this->postJson('/api/v1/admin/service-items', [])->assertStatus(401);
    $this->getJson("/api/v1/admin/service-items/{$this->boatItem->id}")->assertStatus(401);
    $this->putJson("/api/v1/admin/service-items/{$this->boatItem->id}", [])->assertStatus(401);
    $this->patchJson("/api/v1/admin/service-items/{$this->boatItem->id}/status", [])->assertStatus(401);
    $this->deleteJson("/api/v1/admin/service-items/{$this->boatItem->id}")->assertStatus(401);
});

test('customers and unprivileged staff cannot access admin service-items', function (): void {
    Sanctum::actingAs($this->customer);
    $this->getJson('/api/v1/admin/service-items')->assertStatus(403);
    $this->postJson('/api/v1/admin/service-items', ['name' => 'Test'])->assertStatus(403);

    Sanctum::actingAs($this->staff);
    $this->getJson('/api/v1/admin/service-items')->assertStatus(403);
});

test('super admin can list, show, create, update, and change status of service items', function (): void {
    Sanctum::actingAs($this->superAdmin);

    // List
    $listRes = $this->getJson('/api/v1/admin/service-items?service_type=boating');
    $listRes->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data');

    // Show
    $showRes = $this->getJson("/api/v1/admin/service-items/{$this->boatItem->id}");
    $showRes->assertOk()
        ->assertJsonPath('data.name', 'Sharavathi Mangrove Cruise');

    // Create
    $createRes = $this->postJson('/api/v1/admin/service-items', [
        'service_type' => 'taxi',
        'name' => 'Innova Crysta Coastal Transfer',
        'category' => 'Sedan / SUV Transfer',
        'price_base' => 2800.00,
        'price_unit' => 'per_trip',
        'capacity' => '6 Pax',
        'status' => 'available',
    ]);
    $createRes->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Innova Crysta Coastal Transfer');

    $newItemId = $createRes->json('data.id');

    // Update
    $updateRes = $this->putJson("/api/v1/admin/service-items/{$newItemId}", [
        'price_base' => 3000.00,
        'name' => 'Innova Crysta Premium Transfer',
    ]);
    $updateRes->assertOk()
        ->assertJsonPath('data.price_base', '3000.00')
        ->assertJsonPath('data.name', 'Innova Crysta Premium Transfer');

    // Update Status
    $statusRes = $this->patchJson("/api/v1/admin/service-items/{$newItemId}/status", [
        'status' => 'maintenance',
    ]);
    $statusRes->assertOk()
        ->assertJsonPath('data.status', 'maintenance');

    // Activity Log recorded
    expect(ActivityLog::where('action', 'service_item_status_updated')->where('subject_id', $newItemId)->exists())->toBeTrue();
});

test('manager can only manage assigned services and receives 403 on unassigned services', function (): void {
    Sanctum::actingAs($this->boatManager);

    // Allowed service: boating
    $this->getJson("/api/v1/admin/service-items/{$this->boatItem->id}")->assertOk();

    // Forbidden service: scuba
    $this->getJson("/api/v1/admin/service-items/{$this->scubaItem->id}")->assertStatus(403);

    // Creating unassigned service item is forbidden
    $this->postJson('/api/v1/admin/service-items', [
        'service_type' => 'scuba',
        'name' => 'Unauthorized Scuba Dive',
        'price_base' => 4000.00,
    ])->assertStatus(403);
});

test('store scoping pattern is enforced on service-items store_id parameter', function (): void {
    Sanctum::actingAs($this->boatManager);

    // Querying with authorized store A succeeds
    $this->getJson("/api/v1/admin/service-items?store_id={$this->storeA->id}")->assertOk();

    // Querying with unauthorized store B is rejected with 403
    $this->getJson("/api/v1/admin/service-items?store_id={$this->storeB->id}")->assertStatus(403);
});

/*
|--------------------------------------------------------------------------
| Staff ServiceBookingController Tests
|--------------------------------------------------------------------------
*/

test('unauthenticated users cannot access staff service-bookings', function (): void {
    $this->getJson('/api/v1/staff/service-bookings')->assertStatus(401);
    $this->postJson('/api/v1/staff/service-bookings', [])->assertStatus(401);
});

test('customers cannot access staff service-bookings', function (): void {
    Sanctum::actingAs($this->customer);
    $this->getJson('/api/v1/staff/service-bookings')->assertStatus(403);
    $this->postJson('/api/v1/staff/service-bookings', [])->assertStatus(403);
});

test('staff can list, show, create, and update service bookings for assigned services', function (): void {
    Sanctum::actingAs($this->staff);

    // Create walk-in boating booking
    $createRes = $this->postJson('/api/v1/staff/service-bookings', [
        'service_type' => 'boating',
        'service_item_id' => $this->boatItem->id,
        'customer_name' => 'Rahul Sharma',
        'customer_phone' => '9876500001',
        'customer_email' => 'rahul@example.com',
        'start_datetime' => now()->addDays(1)->format('Y-m-d H:i:s'),
        'quantity' => 2,
        'total_amount' => 1200.00,
        'advance_paid' => 400.00,
        'payment_method' => 'upi',
        'pickup_location' => 'Honnavar Estuary Jetty',
        'store_id' => $this->storeA->id,
    ]);

    $createRes->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.customer_name', 'Rahul Sharma')
        ->assertJsonPath('data.payment_status', 'partial')
        ->assertJsonPath('data.balance_due', '800.00');

    $bookingId = $createRes->json('data.id');
    expect($bookingId)->not->toBeNull();

    // List bookings
    $listRes = $this->getJson('/api/v1/staff/service-bookings?service_type=boating');
    $listRes->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data');

    // Show booking
    $showRes = $this->getJson("/api/v1/staff/service-bookings/{$bookingId}");
    $showRes->assertOk()
        ->assertJsonPath('data.id', $bookingId);

    // Update status to confirmed
    $statusRes = $this->putJson("/api/v1/staff/service-bookings/{$bookingId}/status", [
        'status' => 'confirmed',
        'admin_notes' => 'Customer confirmed arrival time via phone',
        'store_id' => $this->storeA->id,
    ]);
    $statusRes->assertOk()
        ->assertJsonPath('data.status', 'confirmed');

    // Mark in progress
    $progressRes = $this->postJson("/api/v1/staff/service-bookings/{$bookingId}/mark-in-progress", [
        'store_id' => $this->storeA->id,
    ]);
    $progressRes->assertOk()
        ->assertJsonPath('data.status', 'in_progress');

    // Mark completed
    $completeRes = $this->postJson("/api/v1/staff/service-bookings/{$bookingId}/mark-completed", [
        'store_id' => $this->storeA->id,
    ]);
    $completeRes->assertOk()
        ->assertJsonPath('data.status', 'completed');

    // Verify activity logs created
    expect(ActivityLog::where('action', 'service_booking_marked_completed')->where('subject_id', $bookingId)->exists())->toBeTrue();
});

test('staff store-scoping pattern blocks actions on unassigned store and permits explicit cross-store with audit log', function (): void {
    Sanctum::actingAs($this->staff);

    // Blocked on store B
    $this->getJson("/api/v1/staff/service-bookings?store_id={$this->storeB->id}")->assertStatus(403);

    $this->postJson('/api/v1/staff/service-bookings', [
        'service_type' => 'boating',
        'customer_name' => 'Disallowed Store Booking',
        'customer_phone' => '9876500009',
        'start_datetime' => now()->addDays(1)->format('Y-m-d H:i:s'),
        'total_amount' => 600.00,
        'store_id' => $this->storeB->id,
    ])->assertStatus(403);

    // Grant bookings.cross_store permission
    Permission::findOrCreate('bookings.cross_store', 'web');
    $this->staff->givePermissionTo('bookings.cross_store');

    // Now cross-store query is allowed and logged
    $res = $this->getJson("/api/v1/staff/service-bookings?store_id={$this->storeB->id}");
    $res->assertOk();

    expect(ActivityLog::where('action', 'cross_store_access')->where('user_id', $this->staff->id)->exists())->toBeTrue();
});

test('staff service scoping prevents staff from booking or managing unassigned services', function (): void {
    Sanctum::actingAs($this->staff);

    // Staff only assigned to two_wheelers and boating, not scuba
    $this->postJson('/api/v1/staff/service-bookings', [
        'service_type' => 'scuba',
        'customer_name' => 'Attempted Scuba Booking',
        'customer_phone' => '9876500008',
        'start_datetime' => now()->addDays(2)->format('Y-m-d H:i:s'),
        'total_amount' => 3500.00,
    ])->assertStatus(403);

    // Create a scuba booking directly in database
    $scubaBooking = ServiceBooking::create([
        'booking_number' => 'SC-TEST-0001',
        'service_type' => 'scuba',
        'service_item_id' => $this->scubaItem->id,
        'customer_name' => 'Scuba Diver',
        'customer_phone' => '9876500007',
        'start_datetime' => now()->addDays(1),
        'total_amount' => 3500.00,
        'status' => 'confirmed',
    ]);

    // Staff cannot show, update, mark-in-progress, or mark-completed this scuba booking
    $this->getJson("/api/v1/staff/service-bookings/{$scubaBooking->id}")->assertStatus(403);
    $this->postJson("/api/v1/staff/service-bookings/{$scubaBooking->id}/mark-in-progress")->assertStatus(403);
    $this->postJson("/api/v1/staff/service-bookings/{$scubaBooking->id}/mark-completed")->assertStatus(403);
});

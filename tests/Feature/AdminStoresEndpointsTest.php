<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Store;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function (): void {
    $this->superAdmin = User::create([
        'name' => 'Super Admin User',
        'email' => 'superadmin_store@gkwhizwheel.com',
        'phone' => '9999900100',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->regularAdmin = User::create([
        'name' => 'Regular Admin User',
        'email' => 'admin_store@gkwhizwheel.com',
        'phone' => '9999900101',
        'role' => UserRole::STAFF, // Base role staff
        'status' => UserStatus::ACTIVE,
    ]);
    try {
        Role::findOrCreate('admin');
        $this->regularAdmin->assignRole('admin');
    } catch (\Throwable) {
    }

    $this->customer = User::create([
        'name' => 'Customer User',
        'email' => 'customer_store@gkwhizwheel.com',
        'phone' => '9999900102',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin stores endpoints', function (): void {
    $this->getJson('/api/v1/admin/stores')->assertStatus(401);
    $this->postJson('/api/v1/admin/stores', [])->assertStatus(401);
    $this->getJson('/api/v1/admin/stores/1')->assertStatus(401);
    $this->putJson('/api/v1/admin/stores/1', [])->assertStatus(401);
});

test('customer receives 403 forbidden on admin stores endpoints', function (): void {
    $store = Store::create([
        'name' => 'Existing Store',
        'address_line' => '123 Main Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'status' => StoreStatus::ACTIVE,
    ]);

    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/admin/stores')->assertStatus(403);
    $this->postJson('/api/v1/admin/stores', [
        'name' => 'New Store',
        'address_line' => '456 MG Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9750,
        'longitude' => 77.6000,
    ])->assertStatus(403);
    $this->getJson('/api/v1/admin/stores/'.$store->id)->assertStatus(403);
    $this->putJson('/api/v1/admin/stores/'.$store->id, [])->assertStatus(403);
});

test('store creation is strictly restricted to super_admin role', function (): void {
    // Regular admin cannot create a store
    Sanctum::actingAs($this->regularAdmin);

    $this->postJson('/api/v1/admin/stores', [
        'name' => 'Whitefield Store',
        'address_line' => 'ITPB Main Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560066',
        'latitude' => 12.9860,
        'longitude' => 77.7330,
    ])->assertStatus(403);

    // Super admin can create a store
    Sanctum::actingAs($this->superAdmin);

    $response = $this->postJson('/api/v1/admin/stores', [
        'name' => 'Whitefield Store',
        'address_line' => 'ITPB Main Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560066',
        'latitude' => 12.9860000,
        'longitude' => 77.7330000,
        'phone' => '9888877777',
        'operating_hours' => [
            'mon' => '09:00-21:00',
            'tue' => '09:00-21:00',
        ],
        'status' => 'active',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Store created successfully.')
        ->assertJsonPath('data.name', 'Whitefield Store')
        ->assertJsonPath('data.city', 'Bengaluru')
        ->assertJsonPath('data.latitude', 12.986)
        ->assertJsonPath('data.longitude', 77.733)
        ->assertJsonPath('data.status', 'active');

    expect(Store::where('name', 'Whitefield Store')->exists())->toBeTrue();
});

test('super admin can update store address and geolocation', function (): void {
    Sanctum::actingAs($this->superAdmin);

    $store = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '1st Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9200,
        'longitude' => 77.6200,
        'status' => StoreStatus::ACTIVE,
    ]);

    $response = $this->putJson('/api/v1/admin/stores/'.$store->id, [
        'address_line' => '4th Block, 80ft Road',
        'latitude' => 12.9352000,
        'longitude' => 77.6245000,
        'status' => 'inactive',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.address_line', '4th Block, 80ft Road')
        ->assertJsonPath('data.latitude', 12.9352)
        ->assertJsonPath('data.longitude', 77.6245)
        ->assertJsonPath('data.status', 'inactive');

    $store->refresh();
    expect($store->address_line)->toBe('4th Block, 80ft Road')
        ->and($store->status)->toBe(StoreStatus::INACTIVE);
});

test('admin can list and show stores', function (): void {
    Sanctum::actingAs($this->superAdmin);

    Store::create([
        'name' => 'Store A',
        'address_line' => 'Address A',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9700,
        'longitude' => 77.5900,
        'status' => StoreStatus::ACTIVE,
    ]);

    Store::create([
        'name' => 'Store B',
        'address_line' => 'Address B',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560002',
        'latitude' => 12.9800,
        'longitude' => 77.6000,
        'status' => StoreStatus::INACTIVE,
    ]);

    // List all
    $resAll = $this->getJson('/api/v1/admin/stores');
    $resAll->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data');

    // Filter by status
    $resActive = $this->getJson('/api/v1/admin/stores?status=active');
    $resActive->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Store A');

    // Show single store
    $storeA = Store::where('name', 'Store A')->first();
    $resShow = $this->getJson('/api/v1/admin/stores/'.$storeA->id);
    $resShow->assertStatus(200)
        ->assertJsonPath('data.id', $storeA->id)
        ->assertJsonPath('data.name', 'Store A');
});

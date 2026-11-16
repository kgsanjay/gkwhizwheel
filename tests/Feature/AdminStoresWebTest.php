<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superAdmin = User::create([
        'name' => 'Store Super Admin',
        'email' => 'admin_stores@gkwhizwheel.com',
        'phone' => '9876500888',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Floor Staff',
        'email' => 'staff_stores@gkwhizwheel.com',
        'phone' => '9876500777',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352000,
        'longitude' => 77.6245000,
        'phone' => '9876500001',
        'operating_hours' => '08:00 AM - 09:00 PM',
        'status' => StoreStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access store management routes', function (): void {
    $this->get('/admin/stores')->assertRedirect('/admin/login');
    $this->get('/admin/stores/create')->assertRedirect('/admin/login');
    $this->post('/admin/stores', [])->assertRedirect('/admin/login');
    $this->get("/admin/stores/{$this->store1->id}/edit")->assertRedirect('/admin/login');
    $this->put("/admin/stores/{$this->store1->id}", [])->assertRedirect('/admin/login');
    $this->patch("/admin/stores/{$this->store1->id}/toggle")->assertRedirect('/admin/login');
    $this->delete("/admin/stores/{$this->store1->id}")->assertRedirect('/admin/login');
});

test('staff users cannot manage stores and receive 403 forbidden', function (): void {
    $this->actingAs($this->staff)
        ->get('/admin/stores')
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->get('/admin/stores/create')
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->post('/admin/stores', [
            'name' => 'Unauthorized Hub',
        ])
        ->assertForbidden();
});

test('super admin can view store index with metrics and city filter', function (): void {
    Store::create([
        'name' => 'Indiranagar Hub',
        'address_line' => '100 Feet Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784000,
        'longitude' => 77.6408000,
        'phone' => '9876500002',
        'status' => StoreStatus::INACTIVE,
    ]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/stores')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Stores/Index')
                ->has('stores', 2)
                ->has('stats')
                ->where('stats.total', 2)
                ->where('stats.active', 1)
                ->where('stats.inactive', 1)
                ->has('cities')
        );
});

test('super admin can load store create page with city presets', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/stores/create')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Stores/Create')
                ->has('cities')
        );
});

test('super admin can create new store with leaflet coordinates', function (): void {
    $payload = [
        'name' => 'Whitefield Tech Hub',
        'address_line' => 'ITPL Main Road, Prestige Shantiniketan',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560066',
        'latitude' => 12.9863000,
        'longitude' => 77.7337000,
        'phone' => '9876543210',
        'operating_hours' => '07:00 AM - 10:00 PM',
        'status' => 'active',
    ];

    $this->actingAs($this->superAdmin)
        ->post('/admin/stores', $payload)
        ->assertRedirect('/admin/stores')
        ->assertSessionHas('success');

    $this->assertDatabaseHas('stores', [
        'name' => 'Whitefield Tech Hub',
        'city' => 'Bengaluru',
        'pincode' => '560066',
        'status' => StoreStatus::ACTIVE->value,
    ]);
});

test('store creation validates coordinate bounds and required fields', function (): void {
    $this->actingAs($this->superAdmin)
        ->post('/admin/stores', [
            'name' => '', // required
            'address_line' => 'Test Line',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '123456789012345', // exceeds max:10
            'latitude' => 95.0, // exceeds 90
            'longitude' => 195.0, // exceeds 180
            'phone' => '9876543210',
        ])
        ->assertSessionHasErrors(['name', 'pincode', 'latitude', 'longitude']);
});

test('super admin can load store edit page with existing hub data', function (): void {
    $this->actingAs($this->superAdmin)
        ->get("/admin/stores/{$this->store1->id}/edit")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Stores/Edit')
                ->where('store.id', $this->store1->id)
                ->where('store.name', 'Koramangala Hub')
        );
});

test('super admin can update store details and reposition coordinates', function (): void {
    $updatedPayload = [
        'name' => 'Koramangala Flagship Hub',
        'address_line' => '80 Feet Road, Next to Sony Signal',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9360000,
        'longitude' => 77.6250000,
        'phone' => '9876500099',
        'operating_hours' => '24 Hours',
        'status' => 'active',
    ];

    $this->actingAs($this->superAdmin)
        ->put("/admin/stores/{$this->store1->id}", $updatedPayload)
        ->assertRedirect('/admin/stores')
        ->assertSessionHas('success');

    $this->store1->refresh();
    expect($this->store1->name)->toBe('Koramangala Flagship Hub');
    expect((float) $this->store1->latitude)->toBe(12.936);
    expect($this->store1->phone)->toBe('9876500099');
});

test('super admin can quick toggle store status between active and inactive', function (): void {
    expect($this->store1->status)->toBe(StoreStatus::ACTIVE);

    $this->actingAs($this->superAdmin)
        ->patch("/admin/stores/{$this->store1->id}/toggle")
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->store1->refresh();
    expect($this->store1->status)->toBe(StoreStatus::INACTIVE);

    $this->actingAs($this->superAdmin)
        ->patch("/admin/stores/{$this->store1->id}/toggle")
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->store1->refresh();
    expect($this->store1->status)->toBe(StoreStatus::ACTIVE);
});

test('super admin can delete an empty secondary store hub', function (): void {
    $store2 = Store::create([
        'name' => 'Secondary Test Hub',
        'address_line' => 'Test Road',
        'city' => 'Gokarna',
        'state' => 'Karnataka',
        'pincode' => '581326',
        'latitude' => 14.5479000,
        'longitude' => 74.3188000,
        'phone' => '9876500003',
        'status' => StoreStatus::ACTIVE,
    ]);

    expect(Store::count())->toBe(2);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/stores/{$store2->id}")
        ->assertRedirect('/admin/stores')
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('stores', [
        'id' => $store2->id,
    ]);
});

test('cannot delete the last remaining store hub', function (): void {
    expect(Store::count())->toBe(1);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/stores/{$this->store1->id}")
        ->assertRedirect('/admin/stores')
        ->assertSessionHas('error');

    $this->assertDatabaseHas('stores', [
        'id' => $this->store1->id,
    ]);
});

test('cannot delete the primary operational hub Honnavar Hub', function (): void {
    $honnavar = Store::create([
        'name' => 'Honnavar Hub',
        'address_line' => 'Main Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2800000,
        'longitude' => 74.4400000,
        'phone' => '9876500004',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/stores/{$honnavar->id}")
        ->assertRedirect('/admin/stores')
        ->assertSessionHas('error');

    $this->assertDatabaseHas('stores', [
        'id' => $honnavar->id,
    ]);
});

test('staff users cannot delete store hubs and receive 403 forbidden', function (): void {
    $store2 = Store::create([
        'name' => 'Secondary Hub For Staff Test',
        'address_line' => 'Test Road 2',
        'city' => 'Murudeshwar',
        'state' => 'Karnataka',
        'pincode' => '581350',
        'latitude' => 14.0940000,
        'longitude' => 74.4899000,
        'phone' => '9876500005',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->actingAs($this->staff)
        ->delete("/admin/stores/{$store2->id}")
        ->assertForbidden();

    $this->assertDatabaseHas('stores', [
        'id' => $store2->id,
    ]);
});

test('cannot delete store hub when bikes are assigned to it', function (): void {
    $store2 = Store::create([
        'name' => 'Branch With Fleet',
        'address_line' => 'Fleet Road',
        'city' => 'Kumta',
        'state' => 'Karnataka',
        'pincode' => '581343',
        'latitude' => 14.4200000,
        'longitude' => 74.4000000,
        'phone' => '9876500006',
        'status' => StoreStatus::ACTIVE,
    ]);

    $category = BikeCategory::create([
        'name' => 'Scooter Category',
        'slug' => 'scooter-test',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 1000,
    ]);

    Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $store2->id,
        'current_store_id' => $store2->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-XY-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 500,
    ]);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/stores/{$store2->id}")
        ->assertRedirect('/admin/stores')
        ->assertSessionHas('error');

    $this->assertDatabaseHas('stores', [
        'id' => $store2->id,
    ]);
});

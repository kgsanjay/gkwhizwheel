<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
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

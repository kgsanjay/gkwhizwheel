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
        'name' => 'Admin Boss',
        'email' => 'admin_staff_mgmt@gkwhizwheel.com',
        'phone' => '9876511000',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Indiranagar Hub',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500001',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500002',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->existingStaff = User::create([
        'name' => 'Aarav Patel',
        'email' => 'aarav.patel@gkwhizwheel.com',
        'phone' => '9876511001',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->existingStaff->stores()->attach([$this->store1->id]);

    $this->existingManager = User::create([
        'name' => 'Priya Sharma',
        'email' => 'priya.sharma@gkwhizwheel.com',
        'phone' => '9876511002',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->existingManager->stores()->attach([$this->store1->id, $this->store2->id]);
});

test('unauthenticated users cannot access staff management routes', function (): void {
    $this->get('/admin/staff')->assertRedirect('/admin/login');
    $this->post('/admin/staff', [])->assertRedirect('/admin/login');
    $this->put("/admin/staff/{$this->existingStaff->id}", [])->assertRedirect('/admin/login');
    $this->post("/admin/staff/{$this->existingStaff->id}/assign-stores", [])->assertRedirect('/admin/login');
    $this->delete("/admin/staff/{$this->existingStaff->id}")->assertRedirect('/admin/login');
});

test('regular staff cannot access or manage other staff members', function (): void {
    $this->actingAs($this->existingStaff)
        ->get('/admin/staff')
        ->assertForbidden();

    $this->actingAs($this->existingStaff)
        ->post('/admin/staff', [
            'name' => 'Rogue Staff',
            'email' => 'rogue@gkwhizwheel.com',
        ])
        ->assertForbidden();
});

test('super admin can view staff index with metrics and stores', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/staff')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Staff/Index')
                ->has('staff', 2)
                ->has('stores', 2)
                ->has('stats')
                ->where('stats.total', 2)
                ->where('stats.managers', 1)
                ->where('stats.staff', 1)
                ->where('stats.active', 2)
                ->has('roles', 2)
        );
});

test('super admin can filter staff by role or search term', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/staff?role=store_manager')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Staff/Index')
                ->has('staff', 1)
                ->where('staff.0.name', 'Priya Sharma')
        );

    $this->actingAs($this->superAdmin)
        ->get('/admin/staff?search=Aarav')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Staff/Index')
                ->has('staff', 1)
                ->where('staff.0.name', 'Aarav Patel')
        );
});

test('super admin can filter staff by assigned store', function (): void {
    $this->actingAs($this->superAdmin)
        ->get("/admin/staff?store_id={$this->store2->id}")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Staff/Index')
                ->has('staff', 1)
                ->where('staff.0.name', 'Priya Sharma')
        );
});

test('super admin can create new staff member assigned to multiple stores', function (): void {
    $payload = [
        'name' => 'Kavita Reddy',
        'email' => 'kavita.reddy@gkwhizwheel.com',
        'phone' => '9876522001',
        'password' => 'SecurePass123!',
        'role' => UserRole::STORE_MANAGER->value,
        'store_ids' => [$this->store1->id, $this->store2->id],
    ];

    $this->actingAs($this->superAdmin)
        ->post('/admin/staff', $payload)
        ->assertRedirect('/admin/staff')
        ->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'email' => 'kavita.reddy@gkwhizwheel.com',
        'role' => UserRole::STORE_MANAGER->value,
        'status' => UserStatus::ACTIVE->value,
    ]);

    $createdUser = User::where('email', 'kavita.reddy@gkwhizwheel.com')->first();
    expect($createdUser->stores)->toHaveCount(2);
    expect($createdUser->stores->pluck('id')->all())->toContain($this->store1->id, $this->store2->id);
});

test('staff creation validates required fields and unique credentials', function (): void {
    $this->actingAs($this->superAdmin)
        ->post('/admin/staff', [
            'name' => '',
            'email' => 'aarav.patel@gkwhizwheel.com', // duplicate email
            'phone' => '9876511001', // duplicate phone
            'password' => 'short', // min 8
            'role' => 'invalid_role',
        ])
        ->assertSessionHasErrors(['name', 'email', 'phone', 'password', 'role']);
});

test('super admin can update staff details and change store assignments', function (): void {
    $updatePayload = [
        'name' => 'Aarav K. Patel',
        'email' => 'aarav.patel@gkwhizwheel.com',
        'phone' => '9876511001',
        'role' => UserRole::STORE_MANAGER->value,
        'status' => UserStatus::ACTIVE->value,
        'store_ids' => [$this->store1->id, $this->store2->id], // promoted and assigned to both
    ];

    $this->actingAs($this->superAdmin)
        ->put("/admin/staff/{$this->existingStaff->id}", $updatePayload)
        ->assertRedirect('/admin/staff')
        ->assertSessionHas('success');

    $this->existingStaff->refresh();
    expect($this->existingStaff->name)->toBe('Aarav K. Patel');
    expect($this->existingStaff->role)->toBe(UserRole::STORE_MANAGER);
    expect($this->existingStaff->stores)->toHaveCount(2);
});

test('super admin can assign stores to staff using dedicated assign-stores endpoint', function (): void {
    $this->actingAs($this->superAdmin)
        ->post("/admin/staff/{$this->existingStaff->id}/assign-stores", [
            'store_ids' => [$this->store2->id],
        ])
        ->assertRedirect('/admin/staff')
        ->assertSessionHas('success');

    $this->existingStaff->refresh();
    expect($this->existingStaff->stores)->toHaveCount(1);
    expect($this->existingStaff->stores->first()->id)->toBe($this->store2->id);
});

test('super admin can delete or deactivate a staff member', function (): void {
    $this->actingAs($this->superAdmin)
        ->delete("/admin/staff/{$this->existingStaff->id}")
        ->assertRedirect('/admin/staff')
        ->assertSessionHas('success');

    $this->assertSoftDeleted($this->existingStaff);
});

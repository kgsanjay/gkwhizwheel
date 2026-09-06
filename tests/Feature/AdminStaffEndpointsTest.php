<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::create([
        'name' => 'Admin User',
        'email' => 'admin_staff@gkwhizwheel.com',
        'phone' => '9999900200',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Customer User',
        'email' => 'customer_staff@gkwhizwheel.com',
        'phone' => '9999900201',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Store North',
        'address_line' => '100 North Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 13.0000,
        'longitude' => 77.6000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Store South',
        'address_line' => '200 South Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560078',
        'latitude' => 12.9000,
        'longitude' => 77.5800,
        'status' => StoreStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin staff endpoints', function (): void {
    $this->getJson('/api/v1/admin/staff')->assertStatus(401);
    $this->postJson('/api/v1/admin/staff', [])->assertStatus(401);
    $this->getJson('/api/v1/admin/staff/1')->assertStatus(401);
    $this->postJson('/api/v1/admin/staff/1/stores', [])->assertStatus(401);
    $this->deleteJson('/api/v1/admin/staff/1/stores/1')->assertStatus(401);
});

test('non-admin users receive 403 forbidden on admin staff endpoints', function (): void {
    $staff = User::create([
        'name' => 'Existing Staff',
        'email' => 'existing_staff@gkwhizwheel.com',
        'phone' => '9999900300',
        'password' => Hash::make('password123'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/admin/staff')->assertStatus(403);
    $this->postJson('/api/v1/admin/staff', [
        'name' => 'New Staff',
        'email' => 'new_staff@gkwhizwheel.com',
        'phone' => '9999900301',
        'password' => 'password123',
        'role' => 'staff',
    ])->assertStatus(403);
    $this->getJson('/api/v1/admin/staff/'.$staff->id)->assertStatus(403);
    $this->postJson('/api/v1/admin/staff/'.$staff->id.'/stores', [
        'store_id' => $this->store1->id,
    ])->assertStatus(403);
    $this->deleteJson('/api/v1/admin/staff/'.$staff->id.'/stores/'.$this->store1->id)->assertStatus(403);
});

test('admin can create staff and store manager accounts', function (): void {
    Sanctum::actingAs($this->admin);

    // Create staff
    $staffRes = $this->postJson('/api/v1/admin/staff', [
        'name' => 'Ravi Kumar',
        'email' => 'ravi@gkwhizwheel.com',
        'phone' => '9888800001',
        'password' => 'secretPassword123',
        'role' => 'staff',
        'store_ids' => [$this->store1->id],
    ]);

    $staffRes->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Ravi Kumar')
        ->assertJsonPath('data.email', 'ravi@gkwhizwheel.com')
        ->assertJsonPath('data.role', 'staff')
        ->assertJsonCount(1, 'data.stores');

    $staffUser = User::where('email', 'ravi@gkwhizwheel.com')->first();
    expect(Hash::check('secretPassword123', $staffUser->password))->toBeTrue()
        ->and($staffUser->stores)->toHaveCount(1)
        ->and($staffUser->stores->first()->id)->toBe($this->store1->id);

    // Create store manager
    $managerRes = $this->postJson('/api/v1/admin/staff', [
        'name' => 'Priya Sharma',
        'email' => 'priya@gkwhizwheel.com',
        'phone' => '9888800002',
        'password' => 'managerPassword123',
        'role' => 'store_manager',
    ]);

    $managerRes->assertStatus(201)
        ->assertJsonPath('data.role', 'store_manager');

    // Rejects customer role
    $this->postJson('/api/v1/admin/staff', [
        'name' => 'Invalid User',
        'email' => 'invalid@gkwhizwheel.com',
        'phone' => '9888800003',
        'password' => 'secretPassword123',
        'role' => 'customer',
    ])->assertStatus(422)
        ->assertJsonValidationErrors('role');
});

test('admin can assign and unassign staff to stores via staff_store pivot', function (): void {
    Sanctum::actingAs($this->admin);

    $staff = User::create([
        'name' => 'Anil Kumar',
        'email' => 'anil@gkwhizwheel.com',
        'phone' => '9888800010',
        'password' => Hash::make('password123'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    // Assign store 1
    $assignRes1 = $this->postJson('/api/v1/admin/staff/'.$staff->id.'/stores', [
        'store_id' => $this->store1->id,
    ]);
    $assignRes1->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.stores');

    // Assign store 2 using store_ids array
    $assignRes2 = $this->postJson('/api/v1/admin/staff/'.$staff->id.'/stores', [
        'store_ids' => [$this->store2->id],
    ]);
    $assignRes2->assertStatus(200)
        ->assertJsonCount(2, 'data.stores');

    // Idempotent re-assignment doesn't duplicate
    $this->postJson('/api/v1/admin/staff/'.$staff->id.'/stores', [
        'store_id' => $this->store1->id,
    ])->assertStatus(200);

    expect($staff->fresh()->stores)->toHaveCount(2);

    // Unassign store 1
    $unassignRes = $this->deleteJson('/api/v1/admin/staff/'.$staff->id.'/stores/'.$this->store1->id);
    $unassignRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.stores')
        ->assertJsonPath('data.stores.0.id', $this->store2->id);

    expect($staff->fresh()->stores)->toHaveCount(1)
        ->and($staff->fresh()->stores->first()->id)->toBe($this->store2->id);
});

test('admin can list and show staff with assigned stores', function (): void {
    Sanctum::actingAs($this->admin);

    $staff1 = User::create([
        'name' => 'Staff Alpha',
        'email' => 'alpha@gkwhizwheel.com',
        'phone' => '9888800021',
        'password' => Hash::make('password123'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $staff1->stores()->attach($this->store1->id);

    $staff2 = User::create([
        'name' => 'Manager Beta',
        'email' => 'beta@gkwhizwheel.com',
        'phone' => '9888800022',
        'password' => Hash::make('password123'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $staff2->stores()->attach($this->store2->id);

    // List all
    $resAll = $this->getJson('/api/v1/admin/staff');
    $resAll->assertStatus(200)
        ->assertJsonCount(2, 'data');

    // Filter by role
    $resRole = $this->getJson('/api/v1/admin/staff?role=store_manager');
    $resRole->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Manager Beta');

    // Filter by store_id
    $resStore = $this->getJson('/api/v1/admin/staff?store_id='.$this->store1->id);
    $resStore->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Staff Alpha');

    // Show single staff
    $resShow = $this->getJson('/api/v1/admin/staff/'.$staff1->id);
    $resShow->assertStatus(200)
        ->assertJsonPath('data.id', $staff1->id)
        ->assertJsonCount(1, 'data.stores');
});

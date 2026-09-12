<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\ServiceItem;
use App\Models\ServiceItemCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin-cat-test@gkwhizwheels.com',
        'password' => bcrypt('password'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->taxiManager = User::create([
        'name' => 'Taxi Manager',
        'email' => 'taximanager-cat@gkwhizwheels.com',
        'password' => bcrypt('password'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->taxiManager->syncAssignedServices(['taxi', 'boating']);

    $this->store = Store::create([
        'name' => 'Honnavar Main Hub',
        'address_line' => 'Station Rd',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => 'active',
    ]);
});

test('service_item_categories table exists with expected schema and defaults', function (): void {
    expect(Schema::hasTable('service_item_categories'))->toBeTrue();
    expect(Schema::hasColumns('service_item_categories', [
        'id',
        'service_type',
        'name',
        'sort_order',
        'created_at',
        'updated_at',
    ]))->toBeTrue();

    // Default categories seeded during migration
    expect(ServiceItemCategory::where('service_type', 'taxi')->count())->toBeGreaterThanOrEqual(1);
    expect(ServiceItemCategory::where('service_type', 'boating')->count())->toBeGreaterThanOrEqual(1);
    expect(ServiceItemCategory::where('service_type', 'scuba')->count())->toBeGreaterThanOrEqual(1);
});

test('super admin can access service categories index and view categories', function (): void {
    $response = $this->actingAs($this->superAdmin)
        ->get(route('admin.services.categories.index', ['service_type' => 'taxi']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Services/Categories/Index')
            ->has('categories')
            ->where('activeServiceType', 'taxi')
            ->has('availableServices')
        );
});

test('manager with assigned services can access permitted service categories but is forbidden from others', function (): void {
    // Permitted service: taxi
    $this->actingAs($this->taxiManager)
        ->get(route('admin.services.categories.index', ['service_type' => 'taxi']))
        ->assertOk();

    // Permitted service: boating
    $this->actingAs($this->taxiManager)
        ->get(route('admin.services.categories.index', ['service_type' => 'boating']))
        ->assertOk();

    // Forbidden service: scuba
    $this->actingAs($this->taxiManager)
        ->get(route('admin.services.categories.index', ['service_type' => 'scuba']))
        ->assertForbidden();
});

test('super admin can store a new category and activity log is recorded', function (): void {
    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.services.categories.store'), [
            'service_type' => 'scuba',
            'name' => 'Shipwreck Technical Dive',
            'sort_order' => 10,
        ]);

    $response->assertRedirect(route('admin.services.categories.index', ['service_type' => 'scuba']));

    $this->assertDatabaseHas('service_item_categories', [
        'service_type' => 'scuba',
        'name' => 'Shipwreck Technical Dive',
        'sort_order' => 10,
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'service_category.created',
        'subject_type' => ServiceItemCategory::class,
    ]);
});

test('store rejects duplicate category names for the same service type', function (): void {
    ServiceItemCategory::create([
        'service_type' => 'taxi',
        'name' => 'Existing Sedan Category',
        'sort_order' => 1,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.services.categories.store'), [
            'service_type' => 'taxi',
            'name' => 'Existing Sedan Category',
            'sort_order' => 2,
        ]);

    $response->assertSessionHasErrors('name');
});

test('updating a category updates its name, sort order, and cascades to service items', function (): void {
    $category = ServiceItemCategory::create([
        'service_type' => 'homestay',
        'name' => 'Heritage Villa',
        'sort_order' => 3,
    ]);

    $item = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Kumta Beach House',
        'category' => 'Heritage Villa',
        'price_base' => 3000,
        'price_unit' => 'per_night',
        'capacity' => '4 Guests',
        'status' => 'available',
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->put(route('admin.services.categories.update', $category->id), [
            'name' => 'Luxury Heritage Villa',
            'sort_order' => 1,
        ]);

    $response->assertRedirect(route('admin.services.categories.index', ['service_type' => 'homestay']));

    expect($category->fresh()->name)->toBe('Luxury Heritage Villa');
    expect($category->fresh()->sort_order)->toBe(1);

    // Cascaded to service items
    expect($item->fresh()->category)->toBe('Luxury Heritage Villa');

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'service_category.updated',
        'subject_type' => ServiceItemCategory::class,
        'subject_id' => (string) $category->id,
    ]);
});

test('super admin can delete a category and activity log is recorded', function (): void {
    $category = ServiceItemCategory::create([
        'service_type' => 'guide',
        'name' => 'Botanical Trail Guide',
        'sort_order' => 5,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->delete(route('admin.services.categories.destroy', $category->id));

    $response->assertRedirect(route('admin.services.categories.index', ['service_type' => 'guide']));

    $this->assertDatabaseMissing('service_item_categories', [
        'id' => $category->id,
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'service_category.deleted',
        'subject_type' => ServiceItemCategory::class,
        'subject_id' => (string) $category->id,
    ]);
});

test('AdminServiceWebController create and edit pages dynamically reflect database categories', function (): void {
    ServiceItemCategory::create([
        'service_type' => 'tours',
        'name' => 'Special Custom Western Ghats Safari',
        'sort_order' => 99,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->get(route('admin.services.items.create', 'tours'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Services/Items/Create')
            ->has('serviceConfig.categories')
            ->where('serviceConfig.categories', function ($categories) {
                return collect($categories)->contains('Special Custom Western Ghats Safari');
            })
        );
});

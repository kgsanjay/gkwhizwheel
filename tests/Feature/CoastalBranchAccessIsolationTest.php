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

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->hq = User::create([
        'name' => 'HQ User', 'email' => 'hq87@example.test',
        'phone' => '9000008781', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Main Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->legacy = Store::create([
        'name' => 'Old Honnavar Station Hub', 'address_line' => 'Station Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::INACTIVE,
    ]);
    $this->staff = User::create([
        'name' => 'Honnavar Staff', 'email' => 'honnavar87@example.test',
        'phone' => '9000008782', 'password' => 'Password123!',
        'role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach([$this->honnavar->id, $this->legacy->id]);
    $this->staff->syncAssignedServices(['taxi']);
});

test('inactive branch memberships no longer grant operational access but remain in historical pivot', function (): void {
    expect($this->staff->getAuthorizedStoreIds())->toBe([$this->honnavar->id]);
    $this->assertDatabaseHas('staff_store', ['user_id' => $this->staff->id, 'store_id' => $this->legacy->id]);
});

test('staff cannot read or edit another branch or inactive legacy service record', function (): void {
    $foreign = ServiceItem::create([
        'service_type' => 'taxi', 'store_id' => $this->murudeshwar->id,
        'name' => 'Other Branch Car', 'price_base' => 1000, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $legacy = ServiceItem::create([
        'service_type' => 'taxi', 'store_id' => $this->legacy->id,
        'name' => 'Historical Cab', 'price_base' => 1000, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $this->actingAs($this->staff)
        ->get("/admin/services/taxi/items/{$foreign->id}/edit")->assertForbidden();
    $this->get("/admin/services/taxi/items/{$legacy->id}/edit")->assertForbidden();
    $this->get('/admin/services/taxi/items')->assertOk();

    $this->actingAs($this->hq)
        ->get("/admin/services/taxi/items/{$legacy->id}/edit")->assertOk();
});

test('new staff cannot be assigned to the legacy inactive branch', function (): void {
    $this->actingAs($this->hq)->post('/admin/staff', [
        'name' => 'Legacy Staff', 'email' => 'legacy87@example.test',
        'phone' => '9000008783', 'password' => 'Password123!',
        'role' => UserRole::STAFF->value,
        'store_ids' => [$this->legacy->id], 'services' => ['taxi'],
    ])->assertSessionHasErrors('store_ids.0');

    expect(User::where('email', 'legacy87@example.test')->exists())->toBeFalse();

    $this->post("/admin/staff/{$this->staff->id}/assign-stores", [
        'store_ids' => [$this->legacy->id],
    ])->assertSessionHasErrors('store_ids.0');
    expect($this->staff->fresh()->getAuthorizedStoreIds())->toBe([$this->honnavar->id]);
});

test('super admin cannot create new service bookings in inactive branch while history remains visible', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'taxi', 'store_id' => $this->legacy->id,
        'name' => 'Historic Cab Service', 'price_base' => 800, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $historical = ServiceBooking::create([
        'booking_number' => 'GKW-LEGACY-87', 'store_id' => $this->legacy->id,
        'service_type' => 'taxi', 'service_item_id' => $item->id,
        'customer_name' => 'Historical Guest', 'customer_phone' => '9000008784',
        'start_datetime' => now()->subYear(), 'quantity' => 1,
        'total_amount' => 800, 'status' => 'completed',
    ]);
    $this->actingAs($this->hq)
        ->get("/admin/services/taxi/bookings/{$historical->id}")->assertOk();

    $this->post('/admin/services/taxi/bookings', [
        'service_item_id' => $item->id,
        'store_id' => $this->legacy->id,
        'customer_name' => 'New Guest', 'customer_phone' => '9000008785',
        'start_datetime' => now()->addDays(2)->toDateTimeString(),
        'quantity' => 1, 'base_amount' => 800, 'advance_paid' => 0,
        'booking_channel' => 'offline_walkin', 'payment_method' => 'cash',
        'status' => 'confirmed',
    ])->assertStatus(422);
    expect(ServiceBooking::count())->toBe(1);
});

<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('service inventory API enforces branch ownership without trusting request store_id', function (): void {
    $honnavar = Store::create([
        'name' => 'Honnavar Hub', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9999999301', 'status' => StoreStatus::ACTIVE,
    ]);
    $murudeshwar = Store::create([
        'name' => 'Murudeshwar Hub', 'address_line' => 'Bus Stand Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9999999302', 'status' => StoreStatus::ACTIVE,
    ]);
    $manager = User::create([
        'name' => 'Honnavar Manager', 'email' => 'honavar.manager@example.test',
        'phone' => '9999999303', 'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $manager->stores()->attach($honnavar->id);
    $manager->syncAssignedServices(['taxi']);

    $own = ServiceItem::create([
        'store_id' => $honnavar->id, 'service_type' => 'taxi', 'name' => 'Honnavar Cab',
        'price_base' => 1000, 'status' => 'available',
    ]);
    $other = ServiceItem::create([
        'store_id' => $murudeshwar->id, 'service_type' => 'taxi', 'name' => 'Murudeshwar Cab',
        'price_base' => 1200, 'status' => 'available',
    ]);
    $legacy = ServiceItem::create([
        'service_type' => 'taxi', 'name' => 'Unassigned Cab',
        'price_base' => 1100, 'status' => 'available',
    ]);

    $this->actingAs($manager)->getJson('/api/v1/admin/service-items')
        ->assertOk()->assertJsonPath('meta.total', 1);
    $this->actingAs($manager)->getJson('/api/v1/admin/service-items/'.$own->id)->assertOk();
    $this->actingAs($manager)->getJson('/api/v1/admin/service-items/'.$other->id)->assertForbidden();
    $this->actingAs($manager)->getJson('/api/v1/admin/service-items/'.$legacy->id)->assertForbidden();
    $this->actingAs($manager)->getJson('/api/v1/admin/service-items?store_id='.$murudeshwar->id)
        ->assertForbidden();
});

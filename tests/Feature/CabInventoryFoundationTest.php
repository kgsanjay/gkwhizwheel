<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CabDriver;
use App\Models\CabVehicle;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Models\Store;
use App\Models\User;
use App\Services\CabDispatchEligibility;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Main', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Main', 'address_line' => 'Main Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->honnCab = ServiceItem::create([
        'store_id' => $this->honnavar->id,
        'service_type' => 'taxi', 'name' => 'Honnavar Sedans',
        'price_base' => 1000, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $this->muruCab = ServiceItem::create([
        'store_id' => $this->murudeshwar->id,
        'service_type' => 'taxi', 'name' => 'Murudeshwar Sedans',
        'price_base' => 1100, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $this->admin = User::create([
        'name' => 'Cab Super Admin', 'email' => 'cab-admin52@example.test',
        'phone' => '9000005251', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff = User::create([
        'name' => 'Cab Honnavar Staff', 'email' => 'cab-staff52@example.test',
        'phone' => '9000005252', 'password' => 'Password123!',
        'role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->honnavar->id);
    $this->staff->syncAssignedServices(['taxi']);
    $this->customer = User::create([
        'name' => 'Cab Customer', 'email' => 'cab-customer52@example.test',
        'phone' => '9000005253', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
});

function cabVehiclePayload($test, string $plate = 'KA47A5252', bool $murudeshwar = false): array
{
    $item = $murudeshwar ? $test->muruCab : $test->honnCab;
    return [
        'store_id' => $item->store_id, 'service_item_id' => $item->id,
        'registration_number' => $plate, 'vehicle_class' => 'sedan',
        'make' => 'Maruti', 'model_name' => 'Dzire',
        'ownership_type' => 'partner', 'seats' => 4, 'luggage_capacity' => 2,
        'is_ac' => true, 'is_accessible' => false,
        'status' => 'available', 'documents_verified' => true,
    ];
}

function cabDriverPayload($test, string $licence = 'KA4720265252', bool $murudeshwar = false): array
{
    $item = $murudeshwar ? $test->muruCab : $test->honnCab;
    return [
        'store_id' => $item->store_id, 'service_item_id' => $item->id,
        'name' => 'Approved Test Driver', 'license_number' => $licence,
        'status' => 'available', 'documents_verified' => true,
    ];
}

test('admin can register a vehicle but cannot bypass draft status or verification', function (): void {
    $this->actingAs($this->admin)
        ->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this, 'KA-47-A-5252'))
        ->assertCreated()->assertJsonPath('data.status', 'draft');
    expect(CabVehicle::count())->toBe(1)
        ->and(CabVehicle::first()->registration_number)->toBe('KA47A5252')
        ->and(CabVehicle::first()->documents_verified)->toBeFalse()
        ->and(app(CabDispatchEligibility::class)->vehicle(CabVehicle::first()))->toBeFalse();

    $this->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this, 'KA 47 A 5252'))
        ->assertUnprocessable();
    expect(CabVehicle::count())->toBe(1);
});

test('driver licence stays masked and duplicate normalized identifiers are rejected', function (): void {
    $this->actingAs($this->admin)
        ->postJson('/admin/cab-inventory/drivers', cabDriverPayload($this, 'KA-47-2026-5252'))
        ->assertCreated()->assertJsonPath('data.status', 'draft');

    $record = CabDriver::firstOrFail();
    expect($record->license_last_four)->toBe('5252')
        ->and(strlen($record->license_fingerprint))->toBe(64)
        ->and($record->documents_verified)->toBeFalse()
        ->and(app(CabDispatchEligibility::class)->driver($record))->toBeFalse();

    $this->getJson('/admin/cab-inventory/drivers')
        ->assertOk()->assertJsonMissing(['license_number' => 'KA-47-2026-5252'])
        ->assertJsonMissing(['license_fingerprint' => $record->license_fingerprint]);
    $this->postJson('/admin/cab-inventory/drivers', cabDriverPayload($this, 'KA4720265252'))
        ->assertUnprocessable();
    expect(CabDriver::count())->toBe(1);
});

test('staff with taxi access sees and writes only their active branch', function (): void {
    $this->actingAs($this->admin)
        ->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this, 'KA47A5253', true))->assertCreated();
    $this->postJson('/admin/cab-inventory/drivers', cabDriverPayload($this, 'KA4720265253', true))->assertCreated();

    $this->actingAs($this->staff)
        ->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this, 'KA47A5254', true))
        ->assertForbidden();
    $this->postJson('/admin/cab-inventory/drivers', cabDriverPayload($this, 'KA4720265254', true))
        ->assertForbidden();

    $this->getJson('/admin/cab-inventory/vehicles')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/admin/cab-inventory/drivers')->assertOk()->assertJsonCount(0, 'data');

    $this->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this, 'KA47A5255'))->assertCreated();
    $this->getJson('/admin/cab-inventory/vehicles')->assertJsonCount(1, 'data');
});

test('customers and staff without taxi assignment cannot read or create cab inventory', function (): void {
    $this->actingAs($this->customer)->getJson('/admin/cab-inventory/vehicles')->assertForbidden();
    $this->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this))->assertForbidden();

    $this->staff->syncAssignedServices(['two_wheelers']);
    $this->actingAs($this->staff)
        ->getJson('/admin/cab-inventory/drivers')->assertForbidden();
});

test('inactive branch and mismatched service item cannot register a cab', function (): void {
    $this->actingAs($this->admin);
    $payload = cabVehiclePayload($this);
    $payload['service_item_id'] = $this->muruCab->id;
    $this->postJson('/admin/cab-inventory/vehicles', $payload)->assertUnprocessable();

    $this->honnavar->update(['status' => StoreStatus::INACTIVE]);
    $this->postJson('/admin/cab-inventory/vehicles', cabVehiclePayload($this))->assertStatus(422);
    expect(CabVehicle::count())->toBe(0);
});

test('even verified status refuses dispatch with expired docs or absent linked resource', function (): void {
    $vehicle = CabVehicle::create([
        'store_id' => $this->honnavar->id,
        'service_item_id' => $this->honnCab->id,
        'registration_number' => 'KA47A5256',
        'vehicle_class' => 'sedan', 'make' => 'Maruti',
        'model_name' => 'Dzire', 'ownership_type' => 'owned',
        'seats' => 4, 'status' => 'available',
        'documents_verified' => true,
        'insurance_expires_on' => now()->addMonth(),
        'permit_expires_on' => now()->addMonth(),
        'fitness_expires_on' => now()->addMonth(),
        'last_inspected_on' => now(),
    ]);
    expect(app(CabDispatchEligibility::class)->vehicle($vehicle))->toBeFalse();

    $resource = ServiceResource::create([
        'store_id' => $this->honnavar->id, 'service_item_id' => $this->honnCab->id,
        'resource_type' => 'cab_vehicle', 'code' => 'CAB52-RESOURCE-01',
        'name' => 'Test Sedan', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $vehicle->update(['service_resource_id' => $resource->id]);
    expect(app(CabDispatchEligibility::class)->vehicle($vehicle->fresh()))->toBeTrue();

    $vehicle->update(['insurance_expires_on' => now()->subDay()]);
    expect(app(CabDispatchEligibility::class)->vehicle($vehicle->fresh()))->toBeFalse();
});

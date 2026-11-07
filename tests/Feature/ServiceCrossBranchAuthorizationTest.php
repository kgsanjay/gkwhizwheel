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
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Hub', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888810011', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Hub', 'address_line' => 'Bus Stand Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49,
        'phone' => '9888810012', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->manager = User::create([
        'name' => 'Honnavar Manager', 'email' => 'honavar.access@example.test',
        'phone' => '9888810013', 'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->manager->stores()->attach($this->honnavar->id);
    $this->manager->syncAssignedServices(['taxi']);

    $this->ownItem = ServiceItem::create([
        'store_id' => $this->honnavar->id, 'service_type' => 'taxi',
        'name' => 'Honnavar Taxi', 'price_base' => 1800, 'status' => 'available',
    ]);
    $this->foreignItem = ServiceItem::create([
        'store_id' => $this->murudeshwar->id, 'service_type' => 'taxi',
        'name' => 'Murudeshwar Taxi', 'price_base' => 1800, 'status' => 'available',
    ]);
    $this->ownBooking = ServiceBooking::create([
        'store_id' => $this->honnavar->id, 'service_item_id' => $this->ownItem->id,
        'service_type' => 'taxi', 'booking_number' => 'GKW-AUTH-HON-01',
        'customer_name' => 'Own Guest', 'customer_phone' => '9888810014',
        'start_datetime' => now()->addDays(2), 'status' => 'confirmed',
        'total_amount' => 1800,
    ]);
    $this->foreignBooking = ServiceBooking::create([
        'store_id' => $this->murudeshwar->id, 'service_item_id' => $this->foreignItem->id,
        'service_type' => 'taxi', 'booking_number' => 'GKW-AUTH-MUR-01',
        'customer_name' => 'Other Guest', 'customer_phone' => '9888810015',
        'start_datetime' => now()->addDays(2), 'status' => 'confirmed',
        'total_amount' => 1800,
    ]);
});

test('manager web routes prevent foreign branch booking details, changes and vouchers', function (): void {
    $foreign = $this->foreignBooking->id;
    $this->actingAs($this->manager)
        ->get("/admin/services/taxi/bookings/{$foreign}")->assertForbidden();
    $this->actingAs($this->manager)
        ->put("/admin/services/taxi/bookings/{$foreign}/status", [
            'status' => 'completed',
        ])->assertForbidden();
    $this->actingAs($this->manager)
        ->post("/admin/services/taxi/bookings/{$foreign}/payment", [
            'amount' => 100, 'payment_method' => 'cash',
        ])->assertForbidden();
    $this->actingAs($this->manager)
        ->get("/admin/services/taxi/bookings/{$foreign}/voucher")->assertForbidden();
    expect($this->foreignBooking->fresh()->status)->toBe('confirmed');
});

test('staff API booking list and record mutations are branch-scoped without trusting store_id', function (): void {
    Sanctum::actingAs($this->manager);
    $this->getJson('/api/v1/staff/service-bookings?service_type=taxi')
        ->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson("/api/v1/staff/service-bookings/{$this->ownBooking->id}")
        ->assertOk();
    $this->getJson("/api/v1/staff/service-bookings/{$this->foreignBooking->id}")
        ->assertForbidden();
    $this->getJson("/api/v1/staff/service-bookings/{$this->foreignBooking->id}?store_id={$this->honnavar->id}")
        ->assertForbidden();

    $this->putJson("/api/v1/staff/service-bookings/{$this->foreignBooking->id}/status", [
        'status' => 'completed', 'store_id' => $this->honnavar->id,
    ])->assertForbidden();
    $this->postJson("/api/v1/staff/service-bookings/{$this->foreignBooking->id}/mark-completed", [
        'store_id' => $this->honnavar->id,
    ])->assertForbidden();
    expect($this->foreignBooking->fresh()->status)->toBe('confirmed');
});

test('branch manager cannot create a walk-in booking against another branch item', function (): void {
    Sanctum::actingAs($this->manager);
    $this->postJson('/api/v1/staff/service-bookings', [
        'service_type' => 'taxi', 'service_item_id' => $this->foreignItem->id,
        'customer_name' => 'Wrong Branch Guest', 'customer_phone' => '9888810016',
        'start_datetime' => now()->addDays(4)->format('Y-m-d H:i:s'),
        'quantity' => 1, 'total_amount' => 1800,
        'store_id' => $this->honnavar->id,
    ])->assertForbidden();

    expect(ServiceBooking::where('customer_name', 'Wrong Branch Guest')->exists())->toBeFalse();
});

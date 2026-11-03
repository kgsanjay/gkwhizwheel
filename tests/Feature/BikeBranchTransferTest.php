<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeTransfer;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use App\Services\AvailabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Branch', 'address_line' => 'Main Rd', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.44, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Branch', 'address_line' => 'KSRTC Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->bike = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $this->murudeshwar->id,
        'current_store_id' => $this->murudeshwar->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-BC-1001',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    foreach ([
        'admin' => [UserRole::SUPER_ADMIN, '9000000701', 'superadmin.transfer@example.com'],
        'sender' => [UserRole::STORE_MANAGER, '9000000702', 'sender.transfer@example.com'],
        'receiver' => [UserRole::STORE_MANAGER, '9000000703', 'receiver.transfer@example.com'],
        'outsider' => [UserRole::STORE_MANAGER, '9000000704', 'outsider.transfer@example.com'],
    ] as $key => [$role, $phone, $email]) {
        $this->{$key} = User::create([
            'name' => ucfirst($key), 'email' => $email,
            'phone' => $phone, 'password' => bcrypt('Password123!'),
            'role' => $role, 'status' => UserStatus::ACTIVE,
        ]);
    }
    $this->sender->stores()->attach($this->murudeshwar->id);
    $this->receiver->stores()->attach($this->honnavar->id);
    $this->outsider->stores()->attach($this->murudeshwar->id);
});

test('approved transfer blocks booking but physical branch moves only after destination receipt', function (): void {
    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id,
        'to_store_id' => $this->honnavar->id,
        'reason' => 'Rebalance bikes for upcoming weekend.',
    ])->assertRedirect('/admin/bike-transfers');

    $transfer = BikeTransfer::firstOrFail();
    expect($transfer->status)->toBe('requested')
        ->and((int) $this->bike->fresh()->current_store_id)->toBe($this->murudeshwar->id);

    $this->actingAs($this->admin)->post("/admin/bike-transfers/{$transfer->id}/approve")
        ->assertRedirect('/admin/bike-transfers');
    expect($transfer->fresh()->status)->toBe('approved')
        ->and((int) $this->bike->fresh()->current_store_id)->toBe($this->murudeshwar->id);

    $start = today()->addDays(4)->toDateString();
    $end = today()->addDays(5)->toDateString();
    expect(app(AvailabilityService::class)->checkAvailability(
        $this->bike->fresh(), $start, $end, null, $this->murudeshwar->id, $this->murudeshwar->id
    ))->toBeFalse();

    $this->actingAs($this->sender)->post("/admin/bike-transfers/{$transfer->id}/dispatch")
        ->assertRedirect('/admin/bike-transfers');
    expect($transfer->fresh()->status)->toBe('in_transit')
        ->and((int) $this->bike->fresh()->current_store_id)->toBe($this->murudeshwar->id);

    $this->actingAs($this->receiver)->post("/admin/bike-transfers/{$transfer->id}/receive")
        ->assertRedirect('/admin/bike-transfers');

    expect($transfer->fresh()->status)->toBe('received')
        ->and((int) $this->bike->fresh()->current_store_id)->toBe($this->honnavar->id)
        ->and($transfer->fresh()->received_by)->toBe($this->receiver->id)
        ->and(ActivityLog::where('subject_type', BikeTransfer::class)->where('subject_id', $transfer->id)->count())->toBe(4);

    expect(app(AvailabilityService::class)->checkAvailability(
        $this->bike->fresh(), $start, $end, null, $this->honnavar->id, $this->honnavar->id
    ))->toBeTrue();
});

test('destination managers cannot approve or dispatch source bikes, and origin managers cannot receive', function (): void {
    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id, 'to_store_id' => $this->honnavar->id, 'reason' => 'Test move',
    ])->assertRedirect('/admin/bike-transfers');

    $id = BikeTransfer::firstOrFail()->id;
    $this->actingAs($this->sender)->post("/admin/bike-transfers/{$id}/approve")->assertForbidden();

    $this->actingAs($this->admin)->post("/admin/bike-transfers/{$id}/approve")->assertRedirect();
    $this->actingAs($this->receiver)->post("/admin/bike-transfers/{$id}/dispatch")->assertForbidden();

    $this->actingAs($this->sender)->post("/admin/bike-transfers/{$id}/dispatch")->assertRedirect();
    $this->actingAs($this->sender)->post("/admin/bike-transfers/{$id}/receive")->assertForbidden();
    $this->actingAs($this->receiver)->post("/admin/bike-transfers/{$id}/receive")->assertRedirect();
});

test('transfer prevents duplicates, invalid status transitions and different branch without an active destination', function (): void {
    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id, 'to_store_id' => $this->honnavar->id, 'reason' => 'Request 1',
    ])->assertRedirect();
    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id, 'to_store_id' => $this->honnavar->id, 'reason' => 'Duplicate',
    ])->assertSessionHasErrors('bike_id');

    $transfer = BikeTransfer::firstOrFail();
    $this->actingAs($this->receiver)->post("/admin/bike-transfers/{$transfer->id}/receive")->assertSessionHasErrors('status');

    $this->actingAs($this->sender)->post("/admin/bike-transfers/{$transfer->id}/cancel")->assertRedirect();
    expect($transfer->fresh()->status)->toBe('cancelled');

    $this->honnavar->update(['status' => StoreStatus::INACTIVE]);
    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id, 'to_store_id' => $this->honnavar->id, 'reason' => 'Inactive destination',
    ])->assertSessionHasErrors('to_store_id');
});

test('transfer cannot be requested while a future confirmed customer booking exists', function (): void {
    $customer = User::create([
        'name' => 'Customer', 'email' => 'customer.transfer@example.com',
        'phone' => '9000000705', 'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    Booking::create([
        'booking_reference' => 'BK-TRANSFER-CONFLICT',
        'bike_id' => $this->bike->id, 'user_id' => $customer->id,
        'pickup_store_id' => $this->murudeshwar->id, 'return_store_id' => $this->murudeshwar->id,
        'channel' => BookingChannel::ONLINE, 'status' => BookingStatus::CONFIRMED,
        'start_date' => today()->addDays(4)->toDateString(),
        'end_date' => today()->addDays(5)->toDateString(),
        'base_amount' => 1000, 'total_amount' => 1000, 'deposit_amount' => 0,
        'price_breakdown_json' => [],
        'idempotency_key' => 'transfer-future-confirmed',
    ]);

    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id, 'to_store_id' => $this->honnavar->id,
        'reason' => 'Would strand customer',
    ])->assertSessionHasErrors('bike_id');

    expect(BikeTransfer::count())->toBe(0);
});

test('managers see only transfers involving their assigned branches and customers cannot view the board', function (): void {
    $this->actingAs($this->sender)->post('/admin/bike-transfers', [
        'bike_id' => $this->bike->id, 'to_store_id' => $this->honnavar->id,
        'reason' => 'Scope test',
    ])->assertRedirect();

    $this->actingAs($this->receiver)->get('/admin/bike-transfers')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/BikeTransfers/Index')->has('transfers', 1));

    $customer = User::create([
        'name' => 'Customer', 'email' => 'customer2.transfer@example.com',
        'phone' => '9000000706', 'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->actingAs($customer)->get('/admin/bike-transfers')->assertForbidden();
});

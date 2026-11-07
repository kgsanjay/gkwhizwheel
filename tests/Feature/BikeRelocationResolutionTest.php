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
use App\Models\BikeRelocationTask;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->source = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888821001', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->destination = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888821002', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->superadmin = User::create([
        'name' => 'Admin', 'email' => 'relocation.admin@example.test', 'phone' => '9888821003',
        'password' => 'Password123!', 'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->manager = User::create([
        'name' => 'Branch Manager', 'email' => 'relocation.staff@example.test', 'phone' => '9888821004',
        'password' => 'Password123!', 'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->manager->stores()->attach($this->destination->id);
    $customer = User::create([
        'name' => 'Guest', 'email' => 'relocation.guest@example.test', 'phone' => '9888821005',
        'password' => 'Password123!', 'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $category = BikeCategory::create(['name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0]);
    $this->bike = Bike::create([
        'category_id' => $category->id, 'current_store_id' => $this->source->id,
        'home_store_id' => $this->destination->id,
        'brand' => 'Honda', 'model_name' => 'Activa', 'registration_number' => 'KA-47-RL-0001',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $base = [
        'bike_id' => $this->bike->id, 'user_id' => $customer->id,
        'channel' => BookingChannel::ONLINE,
        'base_amount' => 1000, 'deposit_amount' => 0, 'total_amount' => 1000,
        'price_breakdown_json' => [], 'status' => BookingStatus::CONFIRMED,
    ];
    $trigger = Booking::create($base + [
        'booking_reference' => 'RELOC-RECEIPT-01', 'idempotency_key' => 'reloc-receipt-trigger',
        'pickup_store_id' => $this->source->id, 'return_store_id' => $this->source->id,
        'start_date' => now()->subDays(4)->toDateString(),
        'end_date' => now()->subDays(2)->toDateString(),
    ]);
    $this->future = Booking::create($base + [
        'booking_reference' => 'RELOC-RECEIPT-02', 'idempotency_key' => 'reloc-receipt-future',
        'pickup_store_id' => $this->destination->id, 'return_store_id' => $this->destination->id,
        'start_date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(4)->toDateString(),
    ]);
    $this->task = BikeRelocationTask::create([
        'bike_id' => $this->bike->id, 'triggering_booking_id' => $trigger->id,
        'affected_booking_id' => $this->future->id, 'from_store_id' => $this->source->id,
        'required_store_id' => $this->destination->id, 'status' => 'open',
    ]);
});

test('branch manager can list assigned relocation tasks but cannot confirm physical receipt', function (): void {
    $this->actingAs($this->manager)->getJson('/admin/relocations')->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.required_store_id', $this->destination->id);
    $this->actingAs($this->manager)->postJson('/admin/relocations/'.$this->task->id.'/confirm-receipt', [
        'physical_receipt_confirmed' => true,
        'destination_store_id' => $this->destination->id,
    ])->assertForbidden();
    expect($this->bike->fresh()->current_store_id)->toBe($this->source->id);
    $this->manager->stores()->sync([$this->source->id]);
    $this->actingAs($this->manager)->getJson('/admin/relocations')->assertOk()
        ->assertJsonPath('meta.total', 0);
});

test('superadmin can confirm physical bike receipt once with an audit trail', function (): void {
    $payload = [
        'physical_receipt_confirmed' => true,
        'destination_store_id' => $this->destination->id,
    ];
    $url = '/admin/relocations/'.$this->task->id.'/confirm-receipt';
    $this->actingAs($this->superadmin)->postJson($url, $payload)->assertOk()
        ->assertJsonPath('data.status', 'resolved')
        ->assertJsonPath('data.current_store_id', $this->destination->id);

    expect($this->bike->fresh()->current_store_id)->toBe($this->destination->id)
        ->and($this->task->fresh()->status)->toBe('resolved')
        ->and($this->future->fresh()->status)->toBe(BookingStatus::CONFIRMED);
    expect(ActivityLog::where('action', 'bike_relocation_receipt_confirmed')->count())->toBe(1);
    $this->actingAs($this->superadmin)->postJson($url, $payload)->assertUnprocessable();
});

test('receipt confirmation refuses invalid destination and preserves location', function (): void {
    $this->actingAs($this->superadmin)->postJson('/admin/relocations/'.$this->task->id.'/confirm-receipt', [
        'physical_receipt_confirmed' => true,
        'destination_store_id' => $this->source->id,
    ])->assertUnprocessable();
    expect($this->task->fresh()->status)->toBe('open')
        ->and($this->bike->fresh()->current_store_id)->toBe($this->source->id);
});

test('receipt confirmation rejects claimed receipt without actual confirmation', function (): void {
    $this->actingAs($this->superadmin)->postJson('/admin/relocations/'.$this->task->id.'/confirm-receipt', [
        'physical_receipt_confirmed' => false,
        'destination_store_id' => $this->destination->id,
    ])->assertUnprocessable();
    expect($this->bike->fresh()->current_store_id)->toBe($this->source->id);
});

test('relocation admin page renders its branch-scoped task table via Inertia', function (): void {
    $this->actingAs($this->manager)->get('/admin/relocations')->assertOk()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Admin/Relocations/Index')
            ->has('tasks.data', 1)
            ->where('can_confirm', false));

    $this->actingAs($this->superadmin)->get('/admin/relocations')->assertOk()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Admin/Relocations/Index')
            ->has('tasks.data', 1)
            ->where('can_confirm', true));
});

test('browser receipt confirmation redirects back to the relocation list', function (): void {
    $this->actingAs($this->superadmin)->post(
        '/admin/relocations/'.$this->task->id.'/confirm-receipt',
        [
            'physical_receipt_confirmed' => true,
            'destination_store_id' => $this->destination->id,
        ]
    )->assertRedirect(route('admin.relocations.index'));
    expect($this->task->fresh()->status)->toBe('resolved');
});

test('superadmin may dismiss obsolete relocation without moving bike and records the reason', function (): void {
    $this->future->update(['status' => BookingStatus::CANCELLED]);
    $initialStore = $this->bike->current_store_id;

    $this->actingAs($this->superadmin)->postJson(
        '/admin/relocations/'.$this->task->id.'/dismiss',
        ['reason' => 'Customer cancelled their upcoming pickup.']
    )->assertOk()->assertJsonPath('data.status', 'dismissed');

    expect($this->task->fresh()->status)->toBe('dismissed')
        ->and($this->bike->fresh()->current_store_id)->toBe($initialStore);
    $audit = ActivityLog::where('action', 'bike_relocation_dismissed')->sole();
    expect($audit->new_values['reason'])->toBe('Customer cancelled their upcoming pickup.');
});

test('superadmin cannot dismiss a relocation while confirmed pickup remains active', function (): void {
    $this->actingAs($this->superadmin)->postJson(
        '/admin/relocations/'.$this->task->id.'/dismiss',
        ['reason' => 'The vehicle is not yet at the pickup branch.']
    )->assertUnprocessable();

    expect($this->task->fresh()->status)->toBe('open');
});

test('branch managers cannot dismiss relocation tasks even after cancellation', function (): void {
    $this->future->update(['status' => BookingStatus::CANCELLED]);
    $this->actingAs($this->manager)->postJson(
        '/admin/relocations/'.$this->task->id.'/dismiss',
        ['reason' => 'Customer cancelled this reservation.']
    )->assertForbidden();
    expect($this->task->fresh()->status)->toBe('open');
});

test('dismissal requires an audit reason and cannot be repeated', function (): void {
    $this->future->update(['status' => BookingStatus::EXPIRED]);
    $url = '/admin/relocations/'.$this->task->id.'/dismiss';
    $this->actingAs($this->superadmin)->postJson($url, [
        'reason' => 'Too short',
    ])->assertUnprocessable();
    $this->actingAs($this->superadmin)->postJson($url, [
        'reason' => 'The reservation expired before pickup.',
    ])->assertOk();
    $this->actingAs($this->superadmin)->postJson($url, [
        'reason' => 'Try to dismiss the same task twice.',
    ])->assertUnprocessable();
});

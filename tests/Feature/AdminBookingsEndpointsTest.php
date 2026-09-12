<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::create([
        'name' => 'Admin Manager',
        'email' => 'admin_bookings@gkwhizwheel.com',
        'phone' => '9999900301',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Customer User',
        'email' => 'customer_bookings@gkwhizwheel.com',
        'phone' => '9999900302',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Store Downtown',
        'address_line' => '10 Downtown Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9700,
        'longitude' => 77.5900,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Store Airport',
        'address_line' => '50 Airport Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560050',
        'latitude' => 13.1900,
        'longitude' => 77.7000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Standard Commuter',
        'base_daily_rate' => 600.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-BK-1111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->booking = Booking::create([
        'booking_reference' => 'BK-2026-TEST01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_admin_test_01',
        'start_date' => '2026-09-10',
        'end_date' => '2026-09-12',
        'base_amount' => 1200.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3200.00,
        'price_breakdown_json' => [],
    ]);

    Payment::create([
        'booking_id' => $this->booking->id,
        'type' => PaymentType::ADVANCE,
        'amount' => 3200.00,
        'method' => PaymentMethod::RAZORPAY,
        'status' => PaymentStatus::SUCCESS,
        'gateway_reference' => 'pay_test_initial_01',
    ]);
});

test('unauthenticated users cannot access admin bookings endpoints', function (): void {
    $this->getJson('/api/v1/admin/bookings')->assertStatus(401);
    $this->getJson('/api/v1/admin/bookings/'.$this->booking->id)->assertStatus(401);
    $this->putJson('/api/v1/admin/bookings/'.$this->booking->id, [])->assertStatus(401);
    $this->postJson('/api/v1/admin/bookings/'.$this->booking->id.'/refund', [])->assertStatus(401);
});

test('customer receives 403 forbidden on admin bookings endpoints', function (): void {
    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/admin/bookings')->assertStatus(403);
    $this->getJson('/api/v1/admin/bookings/'.$this->booking->id)->assertStatus(403);
    $this->putJson('/api/v1/admin/bookings/'.$this->booking->id, [
        'status' => 'completed',
    ])->assertStatus(403);
    $this->postJson('/api/v1/admin/bookings/'.$this->booking->id.'/refund', [
        'reason' => 'Customer request',
    ])->assertStatus(403);
});

test('admin can list bookings with filters and pagination', function (): void {
    Sanctum::actingAs($this->admin);

    // Create a second offline booking
    Booking::create([
        'booking_reference' => 'BK-2026-TEST02',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store2->id,
        'return_store_id' => $this->store2->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::COMPLETED,
        'idempotency_key' => 'idem_admin_test_02',
        'start_date' => '2026-09-15',
        'end_date' => '2026-09-16',
        'base_amount' => 600.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 2600.00,
        'price_breakdown_json' => [],
    ]);

    // List all
    $resAll = $this->getJson('/api/v1/admin/bookings');
    $resAll->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);

    // Filter by channel
    $resChannel = $this->getJson('/api/v1/admin/bookings?channel=offline');
    $resChannel->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.booking_reference', 'BK-2026-TEST02');

    // Filter by store_id
    $resStore = $this->getJson('/api/v1/admin/bookings?store_id='.$this->store2->id);
    $resStore->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.booking_reference', 'BK-2026-TEST02');

    // Filter by status
    $resStatus = $this->getJson('/api/v1/admin/bookings?status=confirmed');
    $resStatus->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.booking_reference', 'BK-2026-TEST01');
});

test('admin can manually override booking fields and an activity log is created', function (): void {
    Sanctum::actingAs($this->admin);

    $response = $this->putJson('/api/v1/admin/bookings/'.$this->booking->id, [
        'status' => 'handed_over',
        'damage_fee_amount' => 250.00,
        'late_fee_amount' => 100.00,
        'reason' => 'Customer reported minor scratch at pickup inspection',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'handed_over')
        ->assertJsonPath('data.damage_fee_amount', 250)
        ->assertJsonPath('data.late_fee_amount', 100);

    $this->booking->refresh();
    expect($this->booking->status)->toBe(BookingStatus::HANDED_OVER)
        ->and((float) $this->booking->damage_fee_amount)->toBe(250.0)
        ->and((float) $this->booking->late_fee_amount)->toBe(100.0);

    // Assert activity log was written
    $log = ActivityLog::where('action', 'admin_booking_override')
        ->where('subject_id', $this->booking->id)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($this->admin->id)
        ->and($log->new_values['reason'])->toBe('Customer reported minor scratch at pickup inspection');
});

test('admin can process manual refund and an activity log is created', function (): void {
    Sanctum::actingAs($this->admin);

    // Partial refund
    $response = $this->postJson('/api/v1/admin/bookings/'.$this->booking->id.'/refund', [
        'amount' => 1000.00,
        'reason' => 'Customer cancelled early and requested partial refund',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Refund processed successfully.')
        ->assertJsonPath('data.booking_id', $this->booking->id)
        ->assertJsonPath('data.amount', 1000)
        ->assertJsonPath('data.reason', 'Customer cancelled early and requested partial refund')
        ->assertJsonPath('data.status', 'pending');

    expect(Refund::where('booking_id', $this->booking->id)->count())->toBe(1);

    // Assert activity log was written
    $log = ActivityLog::where('action', 'admin_booking_refund')
        ->where('subject_id', $this->booking->id)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($this->admin->id)
        ->and((float) $log->new_values['amount'])->toBe(1000.0);
});

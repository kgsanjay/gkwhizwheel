<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\SyncStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\SyncQueue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('local');
    Storage::fake('public');

    $this->storeManager = User::create([
        'name' => 'Store Manager',
        'email' => 'manager@example.com',
        'phone' => '+919999000002',
        'password' => 'secret123',
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Store Staff',
        'email' => 'staff@example.com',
        'phone' => '+919999000003',
        'password' => 'secret123',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Arun Verma',
        'email' => 'arun@example.com',
        'phone' => '+919876511111',
        'password' => null,
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Whitefield Hub',
        'address_line' => 'ITPL Main Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560066',
        'latitude' => 12.9850,
        'longitude' => 77.7300,
        'phone' => '+919876500003',
    ]);

    $this->store2 = Store::create([
        'name' => 'HSR Layout Hub',
        'address_line' => '27th Main Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560102',
        'latitude' => 12.9116,
        'longitude' => 77.6389,
        'phone' => '+919876500004',
    ]);

    $this->category = BikeCategory::create([
        'name' => 'City Scooter',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike1 = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Honda',
        'model_name' => 'Dio 125',
        'registration_number' => 'KA-04-DIO-111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 8000,
    ]);

    $this->bike2 = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Suzuki',
        'model_name' => 'Access 125',
        'registration_number' => 'KA-04-ACC-222',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::MAINTENANCE,
        'odometer_reading' => 12000,
    ]);
});

test('unauthenticated users cannot access staff bikes or sync endpoints', function (): void {
    $this->getJson('/api/v1/staff/bikes')->assertStatus(401);
    $this->postJson('/api/v1/staff/bikes/'.$this->bike1->id.'/maintenance', [])->assertStatus(401);
    $this->postJson('/api/v1/staff/sync', [])->assertStatus(401);
});

test('customers receive 403 forbidden on staff bikes and sync endpoints', function (): void {
    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/staff/bikes')->assertStatus(403);
    $this->postJson('/api/v1/staff/bikes/'.$this->bike1->id.'/maintenance', [])->assertStatus(403);
    $this->postJson('/api/v1/staff/sync', [
        'actions' => [
            [
                'idempotency_key' => 'idem_cust_test',
                'action_type' => 'maintenance',
                'payload' => ['bike_id' => $this->bike1->id],
            ],
        ],
    ])->assertStatus(403);
});

test('staff can list bikes at a specific store with live status', function (): void {
    Sanctum::actingAs($this->staff);

    // List all bikes at store 1
    $response = $this->getJson('/api/v1/staff/bikes?store_id='.$this->store1->id);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data');

    // Filter by status available
    $availRes = $this->getJson('/api/v1/staff/bikes?store_id='.$this->store1->id.'&status=available');
    $availRes->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.registration_number', 'KA-04-DIO-111');

    // Filter by status maintenance
    $maintRes = $this->getJson('/api/v1/staff/bikes?store_id='.$this->store1->id.'&status=maintenance');
    $maintRes->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.registration_number', 'KA-04-ACC-222');
});

test('staff can toggle bike maintenance status and audit log is recorded', function (): void {
    Sanctum::actingAs($this->staff);

    // 1. Toggle bike1 from available to maintenance
    $response = $this->postJson('/api/v1/staff/bikes/'.$this->bike1->id.'/maintenance', [
        'reason' => 'Scheduled oil and brake pad inspection',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'maintenance');

    $this->bike1->refresh();
    expect($this->bike1->status)->toBe(BikeStatus::MAINTENANCE);

    $log = ActivityLog::where('subject_type', Bike::class)
        ->where('subject_id', $this->bike1->id)
        ->where('action', 'bike_maintenance_toggled')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values['status'])->toBe('available')
        ->and($log->new_values['status'])->toBe('maintenance')
        ->and($log->user_id)->toBe($this->staff->id);

    // 2. Toggle bike1 back from maintenance to available
    $toggleBack = $this->postJson('/api/v1/staff/bikes/'.$this->bike1->id.'/maintenance', [
        'notes' => 'Inspection completed successfully',
    ]);

    $toggleBack->assertStatus(200)
        ->assertJsonPath('data.status', 'available');

    $this->bike1->refresh();
    expect($this->bike1->status)->toBe(BikeStatus::AVAILABLE);
});

test('staff can sync batch offline actions with per-item status and idempotency', function (): void {
    Sanctum::actingAs($this->staff);

    // Seed an existing booking to collect payment for in batch
    $existingBooking = Booking::create([
        'booking_reference' => 'BK-SYNC-TEST-01',
        'bike_id' => $this->bike2->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HELD,
        'idempotency_key' => 'idem_sync_preseeded',
        'start_date' => now()->addDays(1)->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'base_amount' => 900.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2400.00,
        'price_breakdown_json' => [],
    ]);

    $batchPayload = [
        'device_id' => 'tab_store_whitefield_01',
        'actions' => [
            // Action 1: Create offline booking hold
            [
                'idempotency_key' => 'sync_act_hold_01',
                'action_type' => 'hold_booking',
                'payload' => [
                    'customer_id' => $this->customer->id,
                    'bike_id' => $this->bike1->id,
                    'pickup_store_id' => $this->store1->id,
                    'return_store_id' => $this->store1->id,
                    'start_date' => now()->addDays(5)->toDateString(),
                    'end_date' => now()->addDays(7)->toDateString(),
                ],
            ],
            // Action 2: Collect payment for existing booking
            [
                'idempotency_key' => 'sync_act_pay_02',
                'action_type' => 'collect_payment',
                'payload' => [
                    'booking_id' => $existingBooking->id,
                    'payment_method' => 'cash',
                    'amount' => 2400.00,
                ],
            ],
            // Action 3: Put bike into maintenance
            [
                'idempotency_key' => 'sync_act_maint_03',
                'action_type' => 'maintenance',
                'payload' => [
                    'bike_id' => $this->bike1->id,
                    'status' => 'maintenance',
                ],
            ],
            // Action 4: Intentional failure test (invalid booking id)
            [
                'idempotency_key' => 'sync_act_fail_04',
                'action_type' => 'collect_payment',
                'payload' => [
                    'booking_id' => 9999999,
                    'payment_method' => 'cash',
                ],
            ],
        ],
    ];

    $response = $this->postJson('/api/v1/staff/sync', $batchPayload);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total', 4)
        ->assertJsonPath('data.synced_count', 3)
        ->assertJsonPath('data.failed_count', 1);

    // Verify sync_queue DB rows
    expect(SyncQueue::count())->toBe(4);

    $successQueue = SyncQueue::where('idempotency_key', 'sync_act_hold_01')->first();
    expect($successQueue)->not->toBeNull()
        ->and($successQueue->status)->toBe(SyncStatus::SYNCED)
        ->and($successQueue->device_id)->toBe('tab_store_whitefield_01');

    $failedQueue = SyncQueue::where('idempotency_key', 'sync_act_fail_04')->first();
    expect($failedQueue)->not->toBeNull()
        ->and($failedQueue->status)->toBe(SyncStatus::FAILED);

    // Verify existingBooking was marked confirmed
    $existingBooking->refresh();
    expect($existingBooking->status)->toBe(BookingStatus::CONFIRMED);

    // Idempotency: resubmit identical batch
    $resubmitResponse = $this->postJson('/api/v1/staff/sync', $batchPayload);
    $resubmitResponse->assertStatus(200)
        ->assertJsonPath('success', true);
});

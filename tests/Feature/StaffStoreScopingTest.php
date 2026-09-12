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
use App\Models\Payment;
use App\Models\Store;
use App\Models\SyncQueue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');

    $this->storeA = Store::create([
        'name' => 'Store Alpha',
        'address_line' => '100 Feet Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'phone' => '+919876500010',
    ]);

    $this->storeB = Store::create([
        'name' => 'Store Beta',
        'address_line' => 'Outer Ring Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560103',
        'latitude' => 12.9279,
        'longitude' => 77.6271,
        'phone' => '+919876500020',
    ]);

    $this->staffA = User::create([
        'name' => 'Staff Alpha',
        'email' => 'staff.a@example.com',
        'phone' => '+919999000011',
        'password' => 'secret123',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    // Staff A is assigned ONLY to Store Alpha
    $this->staffA->stores()->attach($this->storeA->id);

    $this->customer = User::create([
        'name' => 'Test Customer',
        'email' => 'cust@example.com',
        'phone' => '+919999000099',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Standard',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $this->bikeA = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-AA-1111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
    ]);

    $this->bikeB = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeB->id,
        'home_store_id' => $this->storeB->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter',
        'registration_number' => 'KA-01-BB-2222',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 8000,
    ]);
});

test('staff cannot create a booking at an unassigned store', function (): void {
    Sanctum::actingAs($this->staffA);

    // Try to book at Store Beta (not assigned to staffA)
    $response = $this->postJson('/api/v1/staff/bookings', [
        'customer_id' => $this->customer->id,
        'bike_id' => $this->bikeB->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
    ], ['Idempotency-Key' => 'test-scope-create-01']);

    $response->assertStatus(403);
});

test('staff cannot collect payment for a booking at an unassigned store', function (): void {
    Sanctum::actingAs($this->staffA);

    $bookingB = Booking::create([
        'booking_reference' => 'BK-BETA-01',
        'bike_id' => $this->bikeB->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HELD,
        'idempotency_key' => 'idem_beta_pay',
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 2000.00,
        'price_breakdown_json' => [],
    ]);

    $response = $this->postJson('/api/v1/staff/bookings/'.$bookingB->id.'/collect-payment', [
        'payment_method' => 'cash',
        'amount' => 2000.00,
    ]);

    $response->assertStatus(403);
});

test('collect payment rejects amount <= 0 or amount exceeding outstanding balance', function (): void {
    Sanctum::actingAs($this->staffA);

    $bookingA = Booking::create([
        'booking_reference' => 'BK-ALPHA-PAY',
        'bike_id' => $this->bikeA->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HELD,
        'idempotency_key' => 'idem_alpha_pay',
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 500.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1500.00,
        'price_breakdown_json' => [],
    ]);

    // Test 1: Zero amount
    $resZero = $this->postJson('/api/v1/staff/bookings/'.$bookingA->id.'/collect-payment', [
        'payment_method' => 'cash',
        'amount' => 0,
    ]);
    $resZero->assertStatus(422);

    // Test 2: Amount exceeds outstanding balance (1500 total, trying to collect 2000)
    $resExcess = $this->postJson('/api/v1/staff/bookings/'.$bookingA->id.'/collect-payment', [
        'payment_method' => 'cash',
        'amount' => 2000.00,
    ]);
    $resExcess->assertStatus(422)
        ->assertJsonPath('success', false);

    // Test 3: Valid exact collection
    $resValid = $this->postJson('/api/v1/staff/bookings/'.$bookingA->id.'/collect-payment', [
        'payment_method' => 'cash',
        'amount' => 1500.00,
    ]);
    $resValid->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'confirmed');

    // Test 4: Cannot collect again once fully paid
    $resOverpaid = $this->postJson('/api/v1/staff/bookings/'.$bookingA->id.'/collect-payment', [
        'payment_method' => 'cash',
        'amount' => 100.00,
    ]);
    $resOverpaid->assertStatus(422)
        ->assertJsonPath('success', false);
});

test('staff cannot handover booking at an unassigned pickup store', function (): void {
    Sanctum::actingAs($this->staffA);

    $bookingB = Booking::create([
        'booking_reference' => 'BK-BETA-HO',
        'bike_id' => $this->bikeB->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_beta_ho',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 2000.00,
        'price_breakdown_json' => [],
    ]);

    $photo = UploadedFile::fake()->image('handover.jpg');
    $sig = UploadedFile::fake()->image('signature.png');

    $response = $this->postJson('/api/v1/staff/bookings/'.$bookingB->id.'/handover', [
        'odometer_reading' => 8050,
        'condition_photos' => [$photo],
        'signature' => $sig,
    ]);

    $response->assertStatus(403);
});

test('staff cannot return bike to an unassigned return store', function (): void {
    Sanctum::actingAs($this->staffA);

    $this->bikeA->update(['status' => BikeStatus::ON_RENT]);

    $booking = Booking::create([
        'booking_reference' => 'BK-ALPHA-RET',
        'bike_id' => $this->bikeA->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HANDED_OVER,
        'idempotency_key' => 'idem_alpha_ret',
        'start_date' => now()->subDay()->toDateString(),
        'end_date' => now()->toDateString(),
        'base_amount' => 500.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1500.00,
        'price_breakdown_json' => [],
    ]);

    $photo = UploadedFile::fake()->image('return.jpg');

    // Attempt to process return into Store Beta (staffA is not assigned to Beta)
    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/return', [
        'odometer_reading' => 5100,
        'condition_photos' => [$photo],
        'return_store_id' => $this->storeB->id,
    ]);

    $response->assertStatus(403);
});

test('active bookings query scopes to assigned stores and rejects querying unassigned store', function (): void {
    Sanctum::actingAs($this->staffA);

    // Filter for unassigned storeB returns 403
    $resForbidden = $this->getJson('/api/v1/staff/bookings/active?store_id='.$this->storeB->id);
    $resForbidden->assertStatus(403);

    // Filter for assigned storeA succeeds
    $resAssigned = $this->getJson('/api/v1/staff/bookings/active?store_id='.$this->storeA->id);
    $resAssigned->assertStatus(200);
});

test('sync endpoint enforces store scoping and rejects out-of-store actions', function (): void {
    Sanctum::actingAs($this->staffA);

    $bookingB = Booking::create([
        'booking_reference' => 'BK-SYNC-BETA',
        'bike_id' => $this->bikeB->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HELD,
        'idempotency_key' => 'idem_sync_beta_held',
        'start_date' => now()->addDays(1)->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 500.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1500.00,
        'price_breakdown_json' => [],
    ]);

    $batchPayload = [
        'device_id' => 'device_store_a',
        'actions' => [
            // Action 1: Create booking at Store Beta (should fail)
            [
                'idempotency_key' => 'sync_unauth_hold',
                'action_type' => 'hold_booking',
                'payload' => [
                    'customer_id' => $this->customer->id,
                    'bike_id' => $this->bikeB->id,
                    'pickup_store_id' => $this->storeB->id,
                    'return_store_id' => $this->storeB->id,
                    'start_date' => now()->addDays(3)->toDateString(),
                    'end_date' => now()->addDays(5)->toDateString(),
                ],
            ],
            // Action 2: Collect payment for Store Beta booking (should fail)
            [
                'idempotency_key' => 'sync_unauth_pay',
                'action_type' => 'collect_payment',
                'payload' => [
                    'booking_id' => $bookingB->id,
                    'payment_method' => 'cash',
                    'amount' => 1500.00,
                ],
            ],
            // Action 3: Collect payment exceeding outstanding balance on Store Alpha booking (should fail)
            [
                'idempotency_key' => 'sync_overpay',
                'action_type' => 'collect_payment',
                'payload' => [
                    'booking_id' => $bookingB->id,
                    'payment_method' => 'cash',
                    'amount' => 99999.00,
                ],
            ],
            // Action 4: Put bike B into maintenance (should fail because bike B belongs to Store Beta)
            [
                'idempotency_key' => 'sync_unauth_maint',
                'action_type' => 'maintenance',
                'payload' => [
                    'bike_id' => $this->bikeB->id,
                    'status' => 'maintenance',
                ],
            ],
        ],
    ];

    $response = $this->postJson('/api/v1/staff/sync', $batchPayload);

    $response->assertStatus(200)
        ->assertJsonPath('data.total', 4)
        ->assertJsonPath('data.synced_count', 0)
        ->assertJsonPath('data.failed_count', 4);

    expect(SyncQueue::where('status', SyncStatus::FAILED)->count())->toBe(4);
});

test('user with bookings.cross_store permission or super_admin can perform cross-store actions and activity is audited', function (): void {
    // Grant explicit bookings.cross_store permission
    Permission::findOrCreate('bookings.cross_store', 'web');
    $this->staffA->givePermissionTo('bookings.cross_store');

    Sanctum::actingAs($this->staffA);

    // Try booking at Store Beta
    $response = $this->postJson('/api/v1/staff/bookings', [
        'customer_id' => $this->customer->id,
        'bike_id' => $this->bikeB->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(3)->toDateString(),
    ], ['Idempotency-Key' => 'test-cross-store-audited-01']);

    $response->assertStatus(201)
        ->assertJsonPath('success', true);

    // Verify activity log was recorded with action cross_store_access
    $log = ActivityLog::where('action', 'cross_store_access')->latest('id')->first();
    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($this->staffA->id)
        ->and($log->new_values['target_store_id'])->toBe($this->storeB->id);
});

<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeConditionLog;
use App\Models\Booking;
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
        'name' => 'Kiran Rao',
        'email' => 'kiran@example.com',
        'phone' => '+919876599999',
        'password' => null,
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store1 = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '100 Feet Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '+919876500001',
    ]);

    $this->store2 = Store::create([
        'name' => 'Indiranagar Hub',
        'address_line' => '12th Main Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9719,
        'longitude' => 77.6412,
        'phone' => '+919876500002',
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store1->id,
        'home_store_id' => $this->store1->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-AB-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::ON_RENT,
        'odometer_reading' => 10000,
    ]);
});

test('unauthenticated users cannot access active bookings or return endpoints', function (): void {
    $this->getJson('/api/v1/staff/bookings/active')->assertStatus(401);
    $this->postJson('/api/v1/staff/bookings/1/return', [])->assertStatus(401);
});

test('customers receive 403 forbidden on staff active bookings or return endpoints', function (): void {
    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/staff/bookings/active')->assertStatus(403);
    $this->postJson('/api/v1/staff/bookings/1/return', [])->assertStatus(403);
});

test('staff can list active bookings and search by store or customer details', function (): void {
    Sanctum::actingAs($this->staff);

    // Seed active booking
    $activeBooking = Booking::create([
        'booking_reference' => 'BK-ACTIVE-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store2->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HANDED_OVER,
        'idempotency_key' => 'idem_active_01',
        'start_date' => now()->subDays(2)->toDateString(),
        'end_date' => now()->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
    ]);

    // Query active bookings for store1
    $response = $this->getJson('/api/v1/staff/bookings/active?store_id='.$this->store1->id);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.booking_reference', 'BK-ACTIVE-01')
        ->assertJsonPath('data.0.status', 'handed_over');

    // Query search by customer phone
    $searchResponse = $this->getJson('/api/v1/staff/bookings/active?search=9876599999');
    $searchResponse->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $activeBooking->id);

    // Query search by bike registration
    $bikeSearch = $this->getJson('/api/v1/staff/bookings/active?search=KA-01-AB-1234');
    $bikeSearch->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

test('return endpoint rejects bookings not in handed_over status', function (): void {
    Sanctum::actingAs($this->staff);

    $booking = Booking::create([
        'booking_reference' => 'BK-RETURN-REJ',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_return_rej',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
    ]);

    $photo = UploadedFile::fake()->image('return_photo.jpg');

    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/return', [
        'odometer_reading' => 10100,
        'condition_photos' => [$photo],
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false);
});

test('staff can return bike supporting one-way rentals, late fee override, and deposit refund', function (): void {
    Sanctum::actingAs($this->staff);

    // Booking picked up at store1, scheduled for return at store1
    $booking = Booking::create([
        'booking_reference' => 'BK-ONEWAY-RETURN',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HANDED_OVER,
        'idempotency_key' => 'idem_oneway_01',
        'start_date' => now()->subDays(2)->toDateString(),
        'end_date' => now()->toDateString(),
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
    ]);

    $photo1 = UploadedFile::fake()->image('return_front.jpg');
    $photo2 = UploadedFile::fake()->image('return_back.jpg');

    // Customer actually returns at store2 (One-Way Return)
    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/return', [
        'odometer_reading' => 10250,
        'condition_photos' => [$photo1, $photo2],
        'return_store_id' => $this->store2->id,
        'late_fee_override' => 200.00,
        'damage_fee' => 300.00,
        'notes' => 'Returned at Indiranagar store with minor tail-light scratch',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'returned')
        ->assertJsonPath('data.late_fee_amount', 200)
        ->assertJsonPath('data.damage_fee_amount', 300);

    // 1. Verify Booking was updated with new return store, fees, and status
    $booking->refresh();
    expect($booking->status)->toBe(BookingStatus::RETURNED)
        ->and($booking->return_store_id)->toBe($this->store2->id)
        ->and((float) $booking->late_fee_amount)->toBe(200.00)
        ->and((float) $booking->damage_fee_amount)->toBe(300.00)
        ->and((float) $booking->total_amount)->toBe(3000.00)
        ->and($booking->completed_by)->toBe($this->staff->id);

    // 2. Verify Bike relocated to store2 and flipped to AVAILABLE
    $this->bike->refresh();
    expect($this->bike->status)->toBe(BikeStatus::AVAILABLE)
        ->and($this->bike->current_store_id)->toBe($this->store2->id)
        ->and($this->bike->odometer_reading)->toBe(10250);

    // 3. Verify BikeConditionLog & photos created
    $log = BikeConditionLog::where('booking_id', $booking->id)
        ->where('stage', 'return')
        ->first();
    expect($log)->not->toBeNull()
        ->and($log->odometer_reading)->toBe(10250)
        ->and($log->logged_by)->toBe($this->staff->id)
        ->and($log->photos)->toHaveCount(2);

    // 4. Verify Deposit Refund created (1500 deposit - 300 damage - 200 late = 1000 refund)
    $refund = Refund::where('booking_id', $booking->id)->first();
    expect($refund)->not->toBeNull()
        ->and((float) $refund->amount)->toBe(1000.00)
        ->and($refund->processed_by)->toBe($this->staff->id);

    // 5. Verify ActivityLog
    $activity = ActivityLog::where('subject_type', Booking::class)
        ->where('subject_id', $booking->id)
        ->where('action', 'booking_returned')
        ->first();
    expect($activity)->not->toBeNull()
        ->and($activity->store_id)->toBe($this->store2->id)
        ->and($activity->user_id)->toBe($this->staff->id)
        ->and($activity->new_values['returning_store_id'])->toBe($this->store2->id);
});

test('automatic late fee calculation applies when bike is returned past scheduled end date without override', function (): void {
    Sanctum::actingAs($this->staff);

    // Booking ended 2 days ago
    $booking = Booking::create([
        'booking_reference' => 'BK-OVERDUE-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store1->id,
        'return_store_id' => $this->store1->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HANDED_OVER,
        'idempotency_key' => 'idem_overdue_01',
        'start_date' => Carbon::now()->subDays(5)->toDateString(),
        'end_date' => Carbon::now()->subDays(2)->toDateString(),
        'base_amount' => 1500.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 3000.00,
        'price_breakdown_json' => [],
    ]);

    $photo = UploadedFile::fake()->image('return_late.jpg');

    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/return', [
        'odometer_reading' => 10300,
        'condition_photos' => [$photo],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true);

    $booking->refresh();
    // Daily rate is 500. Overdue is at least 2 days -> at least 1000 late fee
    expect((float) $booking->late_fee_amount)->toBeGreaterThanOrEqual(1000.00);
});

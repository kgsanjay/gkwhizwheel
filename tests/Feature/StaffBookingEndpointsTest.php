<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeConditionLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
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
        'name' => 'Walkin Customer',
        'email' => 'walkin@example.com',
        'phone' => '+919999000004',
        'password' => null,
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store = Store::create([
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
        'name' => 'Commuter',
        'base_daily_rate' => 600.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter 125',
        'registration_number' => 'KA-03-JJ-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5200,
    ]);

    $this->staff->stores()->attach($this->store->id);
    $this->storeManager->stores()->attach($this->store->id);
});

test('unauthenticated users cannot access staff booking endpoints', function (): void {
    $this->postJson('/api/v1/staff/bookings', [])->assertStatus(401);
    $this->postJson('/api/v1/staff/bookings/1/collect-payment', [])->assertStatus(401);
    $this->postJson('/api/v1/staff/bookings/1/handover', [])->assertStatus(401);
});

test('customers receive 403 forbidden on staff booking endpoints', function (): void {
    Sanctum::actingAs($this->customer);

    $this->postJson('/api/v1/staff/bookings', [])->assertStatus(403);
    $this->postJson('/api/v1/staff/bookings/1/collect-payment', [])->assertStatus(403);
    $this->postJson('/api/v1/staff/bookings/1/handover', [])->assertStatus(403);
});

test('staff booking requires Idempotency-Key and valid fields', function (): void {
    Sanctum::actingAs($this->staff);

    // Missing Idempotency-Key
    $response = $this->postJson('/api/v1/staff/bookings', [
        'customer_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => '2026-09-10',
        'end_date' => '2026-09-12',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['idempotency_key']]);
});

test('staff can create offline booking hold and resubmission is idempotent', function (): void {
    Sanctum::actingAs($this->staff);

    $idemKey = 'offline_idem_test_1001';

    $payload = [
        'customer_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => '2026-09-15',
        'end_date' => '2026-09-17',
    ];

    $response = $this->postJson('/api/v1/staff/bookings', $payload, [
        'Idempotency-Key' => $idemKey,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'held')
        ->assertJsonPath('data.channel', 'offline')
        ->assertJsonPath('data.user_id', $this->customer->id);

    $bookingId = $response->json('data.id');

    // Verify DB record has offline channel and created_by staff
    $booking = Booking::find($bookingId);
    expect($booking)->not->toBeNull()
        ->and($booking->channel)->toBe(BookingChannel::OFFLINE)
        ->and($booking->created_by)->toBe($this->staff->id)
        ->and($booking->status)->toBe(BookingStatus::HELD);

    // Verify ActivityLog
    $log = ActivityLog::where('subject_type', Booking::class)
        ->where('subject_id', $bookingId)
        ->where('action', 'booking_held_offline')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($this->staff->id);

    // Resubmit with same Idempotency-Key
    $secondResponse = $this->postJson('/api/v1/staff/bookings', $payload, [
        'Idempotency-Key' => $idemKey,
    ]);

    $secondResponse->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $bookingId);

    expect(Booking::where('idempotency_key', $idemKey)->count())->toBe(1);
});

test('staff can collect cash or card payment and mark booking confirmed', function (): void {
    Sanctum::actingAs($this->staff);

    $booking = Booking::create([
        'booking_reference' => 'BK-STAFF-PAY-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HELD,
        'idempotency_key' => 'idem_pay_staff_01',
        'start_date' => '2026-09-15',
        'end_date' => '2026-09-17',
        'base_amount' => 1200.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2700.00,
        'price_breakdown_json' => [],
        'created_by' => $this->staff->id,
    ]);

    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/collect-payment', [
        'payment_method' => 'cash',
        'amount' => 2700.00,
        'notes' => 'Collected in-store cash payment',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'confirmed');

    $booking->refresh();
    expect($booking->status)->toBe(BookingStatus::CONFIRMED);

    $payment = Payment::where('booking_id', $booking->id)->first();
    expect($payment)->not->toBeNull()
        ->and($payment->method)->toBe(PaymentMethod::CASH)
        ->and((float) $payment->amount)->toBe(2700.00)
        ->and($payment->status)->toBe(PaymentStatus::SUCCESS)
        ->and($payment->collected_by)->toBe($this->staff->id);

    $log = ActivityLog::where('subject_type', Booking::class)
        ->where('subject_id', $booking->id)
        ->where('action', 'payment_collected_offline')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($this->staff->id);
});

test('handover rejects booking not in confirmed status', function (): void {
    Sanctum::actingAs($this->staff);

    $booking = Booking::create([
        'booking_reference' => 'BK-HANDOVER-REJECT',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::HELD,
        'idempotency_key' => 'idem_handover_rej',
        'start_date' => '2026-09-15',
        'end_date' => '2026-09-17',
        'base_amount' => 1200.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2700.00,
        'price_breakdown_json' => [],
    ]);

    $photo = UploadedFile::fake()->image('front.jpg');
    $sig = UploadedFile::fake()->image('sig.png');

    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/handover', [
        'odometer_reading' => 5210,
        'condition_photos' => [$photo],
        'signature' => $sig,
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false);
});

test('staff can complete handover with odometer, condition photos, and signature', function (): void {
    Sanctum::actingAs($this->staff);

    $booking = Booking::create([
        'booking_reference' => 'BK-HANDOVER-OK',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_handover_ok',
        'start_date' => '2026-09-15',
        'end_date' => '2026-09-17',
        'base_amount' => 1200.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2700.00,
        'price_breakdown_json' => [],
    ]);

    $photo1 = UploadedFile::fake()->image('bike_front.jpg');
    $photo2 = UploadedFile::fake()->image('bike_rear.jpg');
    $signature = UploadedFile::fake()->image('customer_sign.png');

    $response = $this->postJson('/api/v1/staff/bookings/'.$booking->id.'/handover', [
        'odometer_reading' => 5250,
        'condition_photos' => [$photo1, $photo2],
        'signature' => $signature,
        'notes' => 'Minor scratch on left mirror noted before departure',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'handed_over');

    $booking->refresh();
    expect($booking->status)->toBe(BookingStatus::HANDED_OVER)
        ->and($booking->agreement_signed_at)->not->toBeNull()
        ->and($booking->agreement_signature_path)->not->toBeNull();

    // Verify Bike flipped to ON_RENT and odometer updated
    $this->bike->refresh();
    expect($this->bike->status)->toBe(BikeStatus::ON_RENT)
        ->and($this->bike->odometer_reading)->toBe(5250);

    // Verify BikeConditionLog & photos created
    $conditionLog = BikeConditionLog::where('booking_id', $booking->id)->first();
    expect($conditionLog)->not->toBeNull()
        ->and($conditionLog->stage->value)->toBe('handover')
        ->and($conditionLog->odometer_reading)->toBe(5250)
        ->and($conditionLog->logged_by)->toBe($this->staff->id)
        ->and($conditionLog->photos)->toHaveCount(2);

    // Verify ActivityLog
    $log = ActivityLog::where('subject_type', Booking::class)
        ->where('subject_id', $booking->id)
        ->where('action', 'booking_handed_over')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($this->staff->id);
});

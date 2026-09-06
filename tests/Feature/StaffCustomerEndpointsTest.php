<?php

declare(strict_types=1);

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\KycDocument;
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

    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'superadmin@example.com',
        'phone' => '+919999000001',
        'password' => 'secret123',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

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
        'name' => 'Regular Customer',
        'email' => 'customer@example.com',
        'phone' => '+919999000004',
        'password' => 'secret123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '100 Feet Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '+919876500001',
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-EQ-1111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => \App\Enums\BikeStatus::AVAILABLE,
    ]);
});

test('unauthenticated users cannot access staff customer endpoints', function (): void {
    $this->getJson('/api/v1/staff/customers/lookup?phone=9999000004')->assertStatus(401);
    $this->postJson('/api/v1/staff/customers', [])->assertStatus(401);
});

test('customer receives 403 forbidden on staff customer endpoints', function (): void {
    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/staff/customers/lookup?phone=9999000004')->assertStatus(403);
    $this->postJson('/api/v1/staff/customers', [
        'name' => 'Test Walkin',
        'phone' => '+919888877777',
    ])->assertStatus(403);
});

test('lookup requires phone parameter and returns 422 if missing', function (): void {
    Sanctum::actingAs($this->staff);

    $response = $this->getJson('/api/v1/staff/customers/lookup');
    $response->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['phone']]);
});

test('lookup returns found false when customer does not exist', function (): void {
    Sanctum::actingAs($this->staff);

    $response = $this->getJson('/api/v1/staff/customers/lookup?phone=+910000000000');
    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.found', false)
        ->assertJsonPath('data.customer', null);
});

test('lookup returns existing customer profile with KYC documents and risk flags', function (): void {
    Sanctum::actingAs($this->staff);

    // Existing customer with KYC document
    $existing = User::create([
        'name' => 'Ravi Kumar',
        'email' => 'ravi@example.com',
        'phone' => '+919876543210',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    KycDocument::create([
        'user_id' => $existing->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/ravi_license.jpg',
        'verified' => true,
        'verified_by' => $this->staff->id,
        'verified_at' => now(),
    ]);

    // Booking with damage fee
    Booking::create([
        'booking_reference' => 'BK-LOOKUP-01',
        'bike_id' => $this->bike->id,
        'user_id' => $existing->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::OFFLINE,
        'status' => BookingStatus::COMPLETED,
        'idempotency_key' => 'idem_lookup_01',
        'start_date' => '2026-08-01',
        'end_date' => '2026-08-03',
        'base_amount' => 1000.00,
        'deposit_amount' => 1500.00,
        'damage_fee_amount' => 500.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => [],
    ]);

    $response = $this->getJson('/api/v1/staff/customers/lookup?phone=+919876543210');

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.found', true)
        ->assertJsonPath('data.customer.name', 'Ravi Kumar')
        ->assertJsonPath('data.customer.phone', '+919876543210')
        ->assertJsonPath('data.customer.is_blacklisted', false)
        ->assertJsonPath('data.customer.has_past_damage', true)
        ->assertJsonPath('data.customer.has_past_no_show', false)
        ->assertJsonCount(1, 'data.customer.kyc_documents')
        ->assertJsonPath('data.customer.kyc_documents.0.document_type', 'driving_license')
        ->assertJsonPath('data.customer.booking_summary.total_bookings', 1);
});

test('store customer requires at least one KYC document and unique phone', function (): void {
    Sanctum::actingAs($this->storeManager);

    // Missing document
    $response = $this->postJson('/api/v1/staff/customers', [
        'name' => 'Walkin John',
        'phone' => '+919111222333',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['documents']]);

    // Duplicate phone with existing user
    $doc = UploadedFile::fake()->image('dl.jpg');
    $dupResponse = $this->postJson('/api/v1/staff/customers', [
        'name' => 'Duplicate Phone Customer',
        'phone' => $this->customer->phone,
        'driving_license' => $doc,
    ]);

    $dupResponse->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['phone']]);
});

test('staff can create new walk-in customer with KYC documents in one call', function (): void {
    Sanctum::actingAs($this->staff);

    $dlFile = UploadedFile::fake()->image('license.jpg');
    $idFile = UploadedFile::fake()->create('aadhaar.pdf', 500, 'application/pdf');

    $response = $this->postJson('/api/v1/staff/customers', [
        'name' => 'Anil Sharma',
        'phone' => '+919845012345',
        'email' => 'anil.walkin@example.com',
        'whatsapp_opt_in' => true,
        'driving_license' => $dlFile,
        'national_id' => $idFile,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Anil Sharma')
        ->assertJsonPath('data.phone', '+919845012345')
        ->assertJsonPath('data.role', 'customer')
        ->assertJsonPath('data.status', 'active')
        ->assertJsonCount(2, 'data.kyc_documents');

    $createdCustomerId = $response->json('data.id');

    // Confirm DB record
    $user = User::find($createdCustomerId);
    expect($user)->not->toBeNull()
        ->and($user->password)->toBeNull()
        ->and($user->role)->toBe(UserRole::CUSTOMER)
        ->and($user->kycDocuments)->toHaveCount(2);

    $dlDoc = $user->kycDocuments->firstWhere('document_type', KycDocumentType::DRIVING_LICENSE);
    expect($dlDoc->verified)->toBeTrue()
        ->and($dlDoc->verified_by)->toBe($this->staff->id)
        ->and($dlDoc->verified_at)->not->toBeNull();

    // Confirm ActivityLog was created
    $log = ActivityLog::where('subject_type', User::class)
        ->where('subject_id', $createdCustomerId)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->action)->toBe('customer_created')
        ->and($log->user_id)->toBe($this->staff->id)
        ->and($log->new_values['channel'])->toBe('walk_in');
});

test('staff can create walk-in customer using structured documents array', function (): void {
    Sanctum::actingAs($this->staff);

    $passportFile = UploadedFile::fake()->image('passport.png');

    $response = $this->postJson('/api/v1/staff/customers', [
        'name' => 'Elena Rostova',
        'phone' => '+919777888999',
        'documents' => [
            [
                'document_type' => 'passport',
                'file' => $passportFile,
            ],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Elena Rostova')
        ->assertJsonCount(1, 'data.kyc_documents')
        ->assertJsonPath('data.kyc_documents.0.document_type', 'passport');
});

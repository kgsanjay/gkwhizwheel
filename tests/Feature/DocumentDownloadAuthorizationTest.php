<?php

declare(strict_types=1);

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\KycDocument;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    Storage::fake('local');

    $this->storeA = Store::create([
        'name' => 'Store Alpha',
        'address_line' => '123 Alpha St',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeB = Store::create([
        'name' => 'Store Beta',
        'address_line' => '456 Beta St',
        'city' => 'Mysuru',
        'state' => 'Karnataka',
        'pincode' => '570001',
        'latitude' => 12.2958,
        'longitude' => 76.6394,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $this->bikeA = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-AC-1001',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->bikeB = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeB->id,
        'home_store_id' => $this->storeB->id,
        'brand' => 'Honda',
        'model_name' => 'Dio',
        'registration_number' => 'KA-09-DI-2002',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customerA = User::create([
        'name' => 'Customer Alice',
        'email' => 'alice@example.com',
        'phone' => '9888800001',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customerB = User::create([
        'name' => 'Customer Bob',
        'email' => 'bob@example.com',
        'phone' => '9888800002',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'superadmin@example.com',
        'phone' => '9888800003',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->managerStoreA = User::create([
        'name' => 'Manager Alpha',
        'email' => 'manager.alpha@example.com',
        'phone' => '9888800004',
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->managerStoreA->stores()->attach($this->storeA->id);

    $this->staffStoreA = User::create([
        'name' => 'Staff Alpha',
        'email' => 'staff.alpha@example.com',
        'phone' => '9888800005',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staffStoreA->stores()->attach($this->storeA->id);

    // Create a bike document for Bike A
    $this->bikeDocA = BikeDocument::create([
        'bike_id' => $this->bikeA->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/bikes/insurance_bike_a.pdf',
        'issue_date' => '2026-01-01',
        'expiry_date' => '2027-01-01',
        'verified' => true,
    ]);
    Storage::disk('local')->put('documents/bikes/insurance_bike_a.pdf', 'dummy bike insurance pdf');

    // Create a KYC document for Customer A
    $this->kycDocA = KycDocument::create([
        'user_id' => $this->customerA->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/alice_dl.pdf',
        'verified' => true,
    ]);
    Storage::disk('local')->put('documents/kyc/alice_dl.pdf', 'dummy alice kyc pdf');
});

test('kyc document download allows owner customer and admin/staff but rejects non-owner customer', function (): void {
    $signedUrl = URL::temporarySignedRoute(
        'kyc-documents.download',
        now()->addMinutes(15),
        ['id' => $this->kycDocA->id]
    );

    // 1. Owner customer Alice downloads her own document
    Sanctum::actingAs($this->customerA);
    $responseAlice = $this->get($signedUrl);
    $responseAlice->assertOk();

    // 2. Super Admin downloads Customer A's document
    Sanctum::actingAs($this->superAdmin);
    $responseAdmin = $this->get($signedUrl);
    $responseAdmin->assertOk();

    // 3. Staff downloads Customer A's document
    Sanctum::actingAs($this->staffStoreA);
    $responseStaff = $this->get($signedUrl);
    $responseStaff->assertOk();

    // 4. Non-owner customer Bob attempts to download Alice's document (IDOR attempt)
    Sanctum::actingAs($this->customerB);
    $responseBob = $this->get($signedUrl);
    $responseBob->assertStatus(403);
});

test('bike document download allows booked customer, super admin, and assigned store manager but rejects unrelated customer and unassigned store manager', function (): void {
    $signedUrl = URL::temporarySignedRoute(
        'bike-documents.download',
        now()->addMinutes(15),
        ['id' => $this->bikeDocA->id]
    );

    // Customer Alice has a booking for Bike A
    Booking::create([
        'booking_reference' => 'BK-ALICE-BIKE-A',
        'bike_id' => $this->bikeA->id,
        'user_id' => $this->customerA->id,
        'pickup_store_id' => $this->storeA->id,
        'return_store_id' => $this->storeA->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-11',
        'base_amount' => 1000.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 2000.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-doc-alice-01',
    ]);

    // 1. Customer Alice who booked Bike A can access the document
    Sanctum::actingAs($this->customerA);
    $responseAlice = $this->get($signedUrl);
    $responseAlice->assertOk();

    // 2. Super Admin can access the document
    Sanctum::actingAs($this->superAdmin);
    $responseAdmin = $this->get($signedUrl);
    $responseAdmin->assertOk();

    // 3. Store Manager assigned to Store A can access the document
    Sanctum::actingAs($this->managerStoreA);
    $responseManagerA = $this->get($signedUrl);
    $responseManagerA->assertOk();

    // 4. Customer Bob who has NEVER booked Bike A is rejected
    Sanctum::actingAs($this->customerB);
    $responseBob = $this->get($signedUrl);
    $responseBob->assertStatus(403);

    // 5. Store Manager assigned to Store B (unassigned store for Bike A) is rejected
    $managerStoreB = User::create([
        'name' => 'Manager Beta',
        'email' => 'manager.beta@example.com',
        'phone' => '9888800009',
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $managerStoreB->stores()->attach($this->storeB->id);

    Sanctum::actingAs($managerStoreB);
    $responseManagerB = $this->get($signedUrl);
    $responseManagerB->assertStatus(403);
});

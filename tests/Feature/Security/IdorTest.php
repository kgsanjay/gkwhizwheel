<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\PaymentStatus;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\KycDocument;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('local');

    // 1. Stores
    $this->storeA = Store::create([
        'name' => 'Store Alpha (Honnavar)',
        'address_line' => '100 Beach Rd',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2800,
        'longitude' => 74.4500,
        'phone' => '+919876500010',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeB = Store::create([
        'name' => 'Store Beta (Gokarna)',
        'address_line' => '200 Temple Rd',
        'city' => 'Gokarna',
        'state' => 'Karnataka',
        'pincode' => '581326',
        'latitude' => 14.5436,
        'longitude' => 74.3188,
        'phone' => '+919876500020',
        'status' => StoreStatus::ACTIVE,
    ]);

    // 2. Users
    $this->customerA = User::create([
        'name' => 'Customer Alice',
        'email' => 'alice_idor@example.com',
        'phone' => '+919999000001',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customerB = User::create([
        'name' => 'Customer Bob',
        'email' => 'bob_idor@example.com',
        'phone' => '+919999000002',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staffStoreA = User::create([
        'name' => 'Staff Alpha (Store A only)',
        'email' => 'staff.alpha_idor@example.com',
        'phone' => '+919999000003',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staffStoreA->stores()->attach($this->storeA->id);

    $this->managerStoreA = User::create([
        'name' => 'Manager Alpha (Store A only)',
        'email' => 'manager.alpha_idor@example.com',
        'phone' => '+919999000004',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->managerStoreA->stores()->attach($this->storeA->id);

    $this->managerStoreB = User::create([
        'name' => 'Manager Beta (Store B only)',
        'email' => 'manager.beta_idor@example.com',
        'phone' => '+919999000005',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->managerStoreB->stores()->attach($this->storeB->id);

    // 3. Inventory & Bookings
    $this->category = BikeCategory::create([
        'name' => 'Standard Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $this->bikeA = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-AA-1001',
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
        'registration_number' => 'KA-47-BB-2002',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 8000,
    ]);

    $this->bookingB = Booking::create([
        'booking_reference' => 'BK-BOB-9001',
        'user_id' => $this->customerB->id,
        'bike_id' => $this->bikeB->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idemp_bob_idor_01',
        'start_date' => Carbon::now()->addDay()->toDateString(),
        'end_date' => Carbon::now()->addDays(2)->toDateString(),
        'base_amount' => 500.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1500.00,
        'advance_paid' => 500.00,
        'deposit_paid' => 1000.00,
        'payment_status' => PaymentStatus::SUCCESS,
        'price_breakdown_json' => [],
    ]);

    // Service booking belonging to Customer B
    $this->serviceItem = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sharavathi River Cruise',
        'category' => 'Sunset Cruise',
        'price_base' => 600.00,
        'price_unit' => 'per_person',
        'status' => 'available',
    ]);

    $this->serviceBookingB = ServiceBooking::create([
        'booking_number' => 'SB-BOB-8001',
        'service_type' => 'boating',
        'service_item_id' => $this->serviceItem->id,
        'user_id' => $this->customerB->id,
        'customer_name' => 'Customer Bob',
        'customer_email' => 'bob_idor@example.com',
        'customer_phone' => '9999000002',
        'booking_channel' => 'online',
        'start_datetime' => '2026-09-15 16:30:00',
        'pickup_location' => 'Honnavar Jetty',
        'quantity' => 2,
        'base_amount' => 1200.00,
        'tax_amount' => 0.00,
        'discount_amount' => 0.00,
        'total_amount' => 1200.00,
        'advance_paid' => 1200.00,
        'balance_due' => 0.00,
        'payment_status' => 'paid',
        'payment_method' => 'online',
        'status' => 'confirmed',
    ]);

    // 4. Documents
    $this->kycDocA = KycDocument::create([
        'user_id' => $this->customerA->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/alice_dl.pdf',
        'verified' => true,
    ]);
    Storage::disk('local')->put('documents/kyc/alice_dl.pdf', 'dummy alice dl binary');

    $this->bikeDocB = BikeDocument::create([
        'bike_id' => $this->bikeB->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/bikes/insurance_bike_b.pdf',
        'issue_date' => '2026-01-01',
        'expiry_date' => '2027-01-01',
        'verified' => true,
    ]);
    Storage::disk('local')->put('documents/bikes/insurance_bike_b.pdf', 'dummy bike b insurance binary');
});

/*
|--------------------------------------------------------------------------
| Section 1: Customer Booking IDOR Access Control (E6, B2)
|--------------------------------------------------------------------------
*/

test('customer cannot view another customer booking details via API guessing IDs', function (): void {
    Sanctum::actingAs($this->customerA);

    // 1. Attempt to access Customer B's booking by exact ID -> 404 (Not Found / ModelNotFound)
    $response = $this->getJson("/api/v1/bookings/{$this->bookingB->id}");
    expect($response->status())->toBeIn([403, 404]);
    expect($response->json('data'))->toBeNull();

    // 2. Attempt to guess sequential/incremented IDs
    foreach ([$this->bookingB->id + 1, $this->bookingB->id + 10, 99999] as $guessedId) {
        $guessResp = $this->getJson("/api/v1/bookings/{$guessedId}");
        expect($guessResp->status())->toBeIn([403, 404]);
        expect($guessResp->json('data'))->toBeNull();
    }
});

test('customer cannot checkout, confirm payment, or cancel another customer booking', function (): void {
    Sanctum::actingAs($this->customerA);

    // Checkout attempt
    $checkoutResp = $this->postJson("/api/v1/bookings/{$this->bookingB->id}/checkout", [
        'gateway' => 'razorpay',
    ]);
    expect($checkoutResp->status())->toBeIn([403, 404]);

    // PhonePe Checkout attempt
    $phonepeResp = $this->postJson("/api/v1/bookings/{$this->bookingB->id}/checkout/phonepe");
    expect($phonepeResp->status())->toBeIn([403, 404]);

    // Cancel attempt
    $cancelResp = $this->postJson("/api/v1/bookings/{$this->bookingB->id}/cancel", [
        'cancellation_reason' => 'Unauthorized IDOR cancellation attempt',
    ]);
    expect($cancelResp->status())->toBeIn([403, 404]);
});

test('customer cannot download or print another customer bike booking voucher via web', function (): void {
    $this->actingAs($this->customerA);

    // Direct voucher download for Bob's booking
    $downloadResp = $this->get("/bookings/{$this->bookingB->id}/voucher");
    $downloadResp->assertStatus(403);

    // Print voucher view for Bob's booking
    $printResp = $this->get("/bookings/{$this->bookingB->id}/print");
    $printResp->assertStatus(403);

    // Guessing non-existent booking ID
    $nonExistentResp = $this->get('/bookings/99999/voucher');
    $nonExistentResp->assertStatus(404);
});

test('customer cannot download or print another customer multi-service booking voucher via web', function (): void {
    $this->actingAs($this->customerA);

    // Direct voucher download for Bob's service booking
    $downloadResp = $this->get("/services/bookings/{$this->serviceBookingB->booking_number}/voucher");
    $downloadResp->assertStatus(403);

    // Print view for Bob's service booking
    $printResp = $this->get("/services/bookings/{$this->serviceBookingB->booking_number}/print");
    $printResp->assertStatus(403);

    // Guessing invalid booking number
    $guessResp = $this->get('/services/bookings/SB-NONEXISTENT-9999/voucher');
    $guessResp->assertStatus(404);
});

/*
|--------------------------------------------------------------------------
| Section 2: Scoped Staff & Store Manager Store-Scoping IDOR (E7, B2)
|--------------------------------------------------------------------------
*/

test('scoped staff user cannot collect payment on booking at an unassigned store', function (): void {
    Sanctum::actingAs($this->staffStoreA);

    // Staff A tries to collect payment on Booking B (located at Store B)
    $response = $this->postJson("/api/v1/staff/bookings/{$this->bookingB->id}/collect-payment", [
        'amount' => 1000.00,
        'payment_method' => 'cash',
    ]);

    $response->assertStatus(403);
});

test('scoped staff user cannot handover or return booking at an unassigned store', function (): void {
    Sanctum::actingAs($this->staffStoreA);

    $photo = \Illuminate\Http\UploadedFile::fake()->image('handover.jpg');
    $sig = \Illuminate\Http\UploadedFile::fake()->image('signature.png');

    // Handover attempt
    $handoverResp = $this->postJson("/api/v1/staff/bookings/{$this->bookingB->id}/handover", [
        'odometer_reading' => 8050,
        'condition_photos' => [$photo],
        'signature' => $sig,
    ]);
    $handoverResp->assertStatus(403);

    // Return attempt
    $returnPhoto = \Illuminate\Http\UploadedFile::fake()->image('return.jpg');
    $returnResp = $this->postJson("/api/v1/staff/bookings/{$this->bookingB->id}/return", [
        'odometer_reading' => 8200,
        'condition_photos' => [$returnPhoto],
        'return_store_id' => $this->storeB->id,
    ]);
    $returnResp->assertStatus(403);
});

test('scoped staff user cannot toggle maintenance on bike at an unassigned store', function (): void {
    Sanctum::actingAs($this->staffStoreA);

    // Staff A attempts maintenance toggle on Bike B (assigned to Store B)
    $response = $this->postJson("/api/v1/staff/bikes/{$this->bikeB->id}/maintenance", [
        'notes' => 'Unauthorized maintenance toggle attempt',
    ]);

    $response->assertStatus(403);
});

test('scoped store manager cannot download voucher or check-in booking at an unassigned store', function (): void {
    $this->actingAs($this->managerStoreA);

    // Manager A tries to download voucher for booking at Store B
    $voucherResp = $this->get("/admin/bookings/{$this->bookingB->id}/voucher");
    $voucherResp->assertStatus(403);

    // Manager A tries to check-in booking at Store B
    $checkInResp = $this->postJson("/admin/check-in/bike/{$this->bookingB->id}/process", [
        'action' => 'check_in',
    ]);
    $checkInResp->assertStatus(403);
});

test('scoped staff user hitting incremented or guessed booking IDs receives 403 or 404', function (): void {
    Sanctum::actingAs($this->staffStoreA);

    // Guessing non-existent booking IDs
    foreach ([99991, 99992, 99993] as $guessedId) {
        $response = $this->postJson("/api/v1/staff/bookings/{$guessedId}/collect-payment", [
            'amount' => 500.00,
            'payment_method' => 'cash',
        ]);
        expect($response->status())->toBeIn([403, 404]);
    }
});

/*
|--------------------------------------------------------------------------
| Section 3: Document IDOR (KYC & Bike Documents) (E19, E6, E7)
|--------------------------------------------------------------------------
*/

test('unrelated customer cannot access another user KYC document by guessing IDs', function (): void {
    // 1. Bob attempts to access Alice's KYC doc via signed route
    $signedUrl = URL::temporarySignedRoute(
        'kyc-documents.download',
        now()->addMinutes(15),
        ['id' => $this->kycDocA->id]
    );

    Sanctum::actingAs($this->customerB);
    $response = $this->get($signedUrl);
    $response->assertStatus(403);

    // 2. Bob attempts to access Alice's KYC doc via customer download endpoint
    $apiResp = $this->getJson("/api/v1/customer/kyc-documents/{$this->kycDocA->id}/download");
    $apiResp->assertStatus(403);

    // 3. Bob attempts to access guessed/incremented KYC IDs
    foreach ([$this->kycDocA->id + 1, $this->kycDocA->id + 10, 99999] as $guessedId) {
        $guessResp = $this->getJson("/api/v1/customer/kyc-documents/{$guessedId}/download");
        expect($guessResp->status())->toBeIn([403, 404]);
    }
});

test('unrelated customer cannot access bike documents for unbooked bikes by guessing IDs', function (): void {
    // Bob attempts to download Bike B's insurance document without having an active booking on Bike B
    $signedUrl = URL::temporarySignedRoute(
        'bike-documents.download',
        now()->addMinutes(15),
        ['id' => $this->bikeDocB->id]
    );

    // Customer Alice has never booked Bike B
    Sanctum::actingAs($this->customerA);
    $response = $this->get($signedUrl);
    $response->assertStatus(403);

    // Guessing incremented bike document ID
    $guessedSignedUrl = URL::temporarySignedRoute(
        'bike-documents.download',
        now()->addMinutes(15),
        ['id' => 99999]
    );
    $guessResp = $this->get($guessedSignedUrl);
    $guessResp->assertStatus(404);
});

test('unassigned store manager cannot access bike documents for bikes at other stores', function (): void {
    // Manager A is assigned only to Store A, but tries to access Bike B's document (Store B)
    $signedUrl = URL::temporarySignedRoute(
        'bike-documents.download',
        now()->addMinutes(15),
        ['id' => $this->bikeDocB->id]
    );

    Sanctum::actingAs($this->managerStoreA);
    $response = $this->get($signedUrl);
    $response->assertStatus(403);

    // Manager B (assigned to Store B) can access Bike B's document
    Sanctum::actingAs($this->managerStoreB);
    $responseB = $this->get($signedUrl);
    $responseB->assertOk();
});

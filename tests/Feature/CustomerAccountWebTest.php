<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\KycDocument;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function createTestBooking(array $attributes): Booking
{
    return Booking::create(array_merge([
        'booking_reference' => 'BK-' . Str::upper(Str::random(6)),
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'base_amount' => 1700.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3700.00,
        'price_breakdown_json' => ['base' => 1700, 'deposit' => 2000],
        'idempotency_key' => (string) Str::uuid(),
    ], $attributes));
}

beforeEach(function (): void {
    Storage::fake('local');

    $this->store = Store::create([
        'name' => 'Indiranagar Hub',
        'code' => 'IND-01',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500001',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 800.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-05-AB-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 4200,
        'base_daily_rate_override' => 850.00,
        'deposit_amount_override' => 2000.00,
    ]);

    // Create bike legal documents
    $this->rcDoc = BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::RC,
        'file_path' => 'documents/bikes/rc_hunter.pdf',
        'expiry_date' => Carbon::now()->addYear()->toDateString(),
        'verified' => true,
    ]);

    $this->insuranceDoc = BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/bikes/insurance_hunter.pdf',
        'expiry_date' => Carbon::now()->addMonths(6)->toDateString(),
        'verified' => true,
    ]);

    $this->customer = User::create([
        'name' => 'Aditya Verma',
        'email' => 'aditya@example.com',
        'phone' => '9876543210',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->otherCustomer = User::create([
        'name' => 'Neha Gupta',
        'email' => 'neha@example.com',
        'phone' => '9876543211',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('customer can view booking history list on /account with stats', function (): void {
    createTestBooking([
        'booking_reference' => 'BK-1001',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    createTestBooking([
        'booking_reference' => 'BK-1002',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::now()->subDays(10)->toDateString(),
        'end_date' => Carbon::now()->subDays(8)->toDateString(),
        'status' => BookingStatus::RETURNED,
    ]);

    $response = $this->actingAs($this->customer)->get('/account');

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Account/Bookings')
        ->has('bookings', 2)
        ->where('stats.active_count', 1)
        ->where('stats.completed_count', 1)
        ->where('stats.cancelled_count', 0)
    );
});

test('customer can view their own booking detail page', function (): void {
    $booking = createTestBooking([
        'booking_reference' => 'BK-1003',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    $response = $this->actingAs($this->customer)->get("/account/bookings/{$booking->id}");

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Account/BookingDetail')
        ->where('booking.booking_reference', 'BK-1003')
        ->where('booking.status', 'confirmed')
        ->where('booking.bike.model_name', 'Hunter 350')
    );
});

test('customer cannot view another customer booking detail page', function (): void {
    $booking = createTestBooking([
        'booking_reference' => 'BK-1004',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    $response = $this->actingAs($this->otherCustomer)->get("/account/bookings/{$booking->id}");

    $response->assertStatus(403);
});

test('customer can retrieve short-lived signed URLs for bike documents on active booking', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = createTestBooking([
        'booking_reference' => 'BK-1005',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    $response = $this->getJson("/api/v1/bookings/{$booking->id}/documents");

    $response->assertOk();
    $response->assertJsonStructure([
        'success',
        'data' => [
            'booking_id',
            'bike_id',
            'documents' => [
                '*' => ['id', 'document_type', 'file_name', 'expiry_date', 'verified', 'temporary_url'],
            ],
        ],
    ]);

    $docs = $response->json('data.documents');
    expect($docs)->toHaveCount(2);

    // Verify download link is a valid signed URL
    $firstDocUrl = $docs[0]['temporary_url'];
    $downloadResponse = $this->get($firstDocUrl);
    $downloadResponse->assertOk();
});

test('customer cannot retrieve bike documents for another customer booking', function (): void {
    Sanctum::actingAs($this->otherCustomer, ['*']);

    $booking = createTestBooking([
        'booking_reference' => 'BK-1006',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    $response = $this->getJson("/api/v1/bookings/{$booking->id}/documents");

    $response->assertStatus(403);
});

test('customer can cancel booking and system triggers refund if paid', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = createTestBooking([
        'booking_reference' => 'BK-1007',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::now()->addDays(3)->toDateString(),
        'end_date' => Carbon::now()->addDays(5)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    Payment::create([
        'booking_id' => $booking->id,
        'method' => \App\Enums\PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_cancel_test_123',
        'amount' => 3700.00,
        'type' => PaymentType::ADVANCE,
        'status' => PaymentStatus::SUCCESS,
    ]);

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/cancel", [
        'reason' => 'Change of personal travel plans',
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'message' => 'Booking cancelled successfully.',
    ]);

    $freshBooking = $booking->fresh();
    expect($freshBooking->status)->toBe(BookingStatus::CANCELLED);
    expect($freshBooking->refunds()->count())->toBe(1);
});

test('customer can extend booking dates if bike is available', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $booking = createTestBooking([
        'booking_reference' => 'BK-1008',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_date' => Carbon::tomorrow()->toDateString(),
        'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
        'status' => BookingStatus::CONFIRMED,
    ]);

    $newEndDate = Carbon::tomorrow()->addDays(4)->toDateString();

    $response = $this->postJson("/api/v1/bookings/{$booking->id}/extend", [
        'new_end_date' => $newEndDate,
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'message' => 'Booking extended successfully.',
    ]);

    $freshBooking = $booking->fresh();
    expect($freshBooking->end_date->toDateString())->toBe($newEndDate);
});

test('customer can view KYC page on /account/kyc and retrieve KYC documents via API', function (): void {
    KycDocument::create([
        'user_id' => $this->customer->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/dl_aditya.jpg',
        'verified' => true,
        'verified_at' => Carbon::now(),
    ]);

    $webResponse = $this->actingAs($this->customer)->get('/account/kyc');
    $webResponse->assertOk();
    $webResponse->assertInertia(
        fn (Assert $page) => $page
        ->component('Account/Kyc')
        ->has('documents', 1)
        ->where('documents.0.document_type', 'driving_license')
        ->where('documents.0.verified', true)
    );

    Sanctum::actingAs($this->customer, ['*']);
    $apiResponse = $this->getJson('/api/v1/customer/kyc-documents');
    $apiResponse->assertOk();
    $apiResponse->assertJsonStructure([
        'success',
        'data' => [
            '*' => ['id', 'user_id', 'document_type', 'file_path', 'verified'],
        ],
    ]);
});

test('customer can upload KYC document and re-upload replaces previous one', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    $file1 = UploadedFile::fake()->create('driving_license.jpg', 800, 'image/jpeg');

    $response1 = $this->postJson('/api/v1/customer/kyc-documents', [
        'document_type' => 'driving_license',
        'file' => $file1,
    ]);

    $response1->assertStatus(201);
    $response1->assertJson([
        'success' => true,
        'message' => 'KYC document uploaded successfully.',
    ]);

    expect(KycDocument::where('user_id', $this->customer->id)->count())->toBe(1);
    $initialDoc = KycDocument::where('user_id', $this->customer->id)->first();
    expect($initialDoc->document_type)->toBe(KycDocumentType::DRIVING_LICENSE);
    expect($initialDoc->verified)->toBeFalse();

    // Re-uploading replaces the previous document for the same type
    $file2 = UploadedFile::fake()->create('driving_license_v2.pdf', 1200, 'application/pdf');

    $response2 = $this->postJson('/api/v1/customer/kyc-documents', [
        'document_type' => 'driving_license',
        'file' => $file2,
    ]);

    $response2->assertStatus(201);
    expect(KycDocument::where('user_id', $this->customer->id)->count())->toBe(1);
    $updatedDoc = KycDocument::where('user_id', $this->customer->id)->first();
    expect($updatedDoc->file_path)->not->toBe($initialDoc->file_path);
});

test('KYC upload rejects invalid file formats or oversized files', function (): void {
    Sanctum::actingAs($this->customer, ['*']);

    // Invalid mime type (e.g. text/plain)
    $badFile = UploadedFile::fake()->create('notes.txt', 100, 'text/plain');

    $response = $this->postJson('/api/v1/customer/kyc-documents', [
        'document_type' => 'driving_license',
        'file' => $badFile,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);

    // Exceeding 5MB limit (5121 KB)
    $hugeFile = UploadedFile::fake()->create('huge.jpg', 6000, 'image/jpeg');

    $responseHuge = $this->postJson('/api/v1/customer/kyc-documents', [
        'document_type' => 'driving_license',
        'file' => $hugeFile,
    ]);

    $responseHuge->assertStatus(422);
    $responseHuge->assertJsonValidationErrors(['file']);
});

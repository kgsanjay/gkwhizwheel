<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Documents Test Store',
        'address_line' => '50 Tech Park',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560100',
        'latitude' => 12.9800,
        'longitude' => 77.6000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Standard Bike',
        'base_daily_rate' => 700.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Yamaha',
        'model_name' => 'FZ-S',
        'registration_number' => 'KA-02-YM-7777',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->staff = User::create([
        'name' => 'Staff Uploader',
        'email' => 'uploader@example.com',
        'phone' => '9888833333',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->docRc = BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::RC,
        'file_path' => 'documents/bikes/fz_rc.pdf',
        'expiry_date' => '2030-01-01',
        'uploaded_by' => $this->staff->id,
        'verified' => true,
    ]);

    $this->docInsurance = BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/bikes/fz_insurance.pdf',
        'expiry_date' => '2027-06-30',
        'uploaded_by' => $this->staff->id,
        'verified' => true,
    ]);

    $this->docEmission = BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
        'file_path' => 'documents/bikes/fz_emission.pdf',
        'expiry_date' => '2026-12-31',
        'uploaded_by' => $this->staff->id,
        'verified' => true,
    ]);

    $this->owner = User::create([
        'name' => 'Booking Owner',
        'email' => 'owner@example.com',
        'phone' => '9888844444',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->nonOwner = User::create([
        'name' => 'Non Owner',
        'email' => 'nonowner@example.com',
        'phone' => '9888855555',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->booking = Booking::create([
        'booking_reference' => 'BK-DOCS-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->owner->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-12',
        'base_amount' => 1400.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3400.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-docs-01',
    ]);
});

test('user who does not own the booking gets a 403 forbidden when requesting documents', function (): void {
    Sanctum::actingAs($this->nonOwner, ['*']);

    $response = $this->getJson("/api/v1/bookings/{$this->booking->id}/documents");

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Forbidden. You do not own this booking.',
        ]);
});

test('booking owner receives 200 with short-lived signed URLs for RC, Insurance, and Emission Certificate', function (): void {
    Sanctum::actingAs($this->owner, ['*']);

    $response = $this->getJson("/api/v1/bookings/{$this->booking->id}/documents");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'booking_id' => $this->booking->id,
                'bike_id' => $this->bike->id,
            ],
            'message' => '',
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'booking_id',
                'bike_id',
                'documents' => [
                    '*' => [
                        'id',
                        'document_type',
                        'file_name',
                        'expiry_date',
                        'verified',
                        'temporary_url',
                    ],
                ],
            ],
            'message',
        ]);

    $documents = $response->json('data.documents');
    expect(count($documents))->toBe(3);

    $docTypes = collect($documents)->pluck('document_type')->all();
    expect($docTypes)->toContain('rc', 'insurance', 'emission_certificate');

    // Verify all returned URLs are signed routes with signature and expires query parameters
    foreach ($documents as $doc) {
        expect($doc['temporary_url'])
            ->toContain('/api/v1/bike-documents/')
            ->toContain('expires=')
            ->toContain('signature=');
    }
});

test('signed document URL can be accessed successfully and rejects tampered signature', function (): void {
    Sanctum::actingAs($this->owner, ['*']);

    $response = $this->getJson("/api/v1/bookings/{$this->booking->id}/documents");
    $rcDoc = collect($response->json('data.documents'))->firstWhere('document_type', 'rc');

    $validSignedUrl = $rcDoc['temporary_url'];

    // 1. Calling the valid signed URL succeeds
    $downloadResponse = $this->get($validSignedUrl);
    $downloadResponse->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $this->docRc->id,
                'document_type' => 'rc',
            ],
        ]);

    // 2. Tampering with the signed URL signature results in 403
    $tamperedUrl = $validSignedUrl.'&tampered=1';
    $tamperedResponse = $this->get($tamperedUrl);
    $tamperedResponse->assertStatus(403);
});

test('cancelled booking rejects document access with 422 error envelope', function (): void {
    Sanctum::actingAs($this->owner, ['*']);

    $this->booking->update(['status' => BookingStatus::CANCELLED]);

    $response = $this->getJson("/api/v1/bookings/{$this->booking->id}/documents");

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Documents are only accessible for active or upcoming bookings.',
        ]);
});

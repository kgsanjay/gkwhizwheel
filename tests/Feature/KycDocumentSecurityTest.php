<?php

declare(strict_types=1);

use App\Enums\KycDocumentType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Resources\KycDocumentResource;
use App\Models\KycDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('local');
    Storage::fake('public');

    $this->customerA = User::create([
        'name' => 'Kyc Customer Alpha',
        'email' => 'kyc.alpha@example.com',
        'phone' => '+919999111111',
        'password' => 'secret123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customerB = User::create([
        'name' => 'Kyc Customer Beta',
        'email' => 'kyc.beta@example.com',
        'phone' => '+919999222222',
        'password' => 'secret123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Staff Reviewer',
        'email' => 'staff.reviewer@example.com',
        'phone' => '+919999333333',
        'password' => 'secret123',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('kyc documents are stored on local private disk and never on public disk', function (): void {
    Sanctum::actingAs($this->customerA);

    $file = UploadedFile::fake()->create('driver_license.pdf', 2048, 'application/pdf');

    $response = $this->postJson('/api/v1/customer/kyc-documents', [
        'document_type' => 'driving_license',
        'file' => $file,
    ]);

    $response->assertStatus(201);
    $docId = $response->json('data.id');
    $filePath = $response->json('data.file_path');

    expect($filePath)->not->toBeNull();
    // Verify file exists on local private disk
    expect(Storage::disk('local')->exists($filePath))->toBeTrue();
    // Verify file DOES NOT exist on public web-accessible disk
    expect(Storage::disk('public')->exists($filePath))->toBeFalse();
});

test('kyc documents cannot be accessed via download route without valid signature', function (): void {
    $doc = KycDocument::create([
        'user_id' => $this->customerA->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/test_dl.pdf',
        'verified' => false,
    ]);
    Storage::disk('local')->put('documents/kyc/test_dl.pdf', 'dummy pdf content');

    // Attempt direct access without signature
    $unsignedResponse = $this->getJson("/api/v1/kyc-documents/{$doc->id}");
    $unsignedResponse->assertStatus(403);

    // Attempt access with valid signed URL
    $signedUrl = URL::temporarySignedRoute('kyc-documents.download', now()->addMinutes(15), ['id' => $doc->id]);
    $signedResponse = $this->get($signedUrl);
    $signedResponse->assertStatus(200);

    // Tampering with the ID in the signed URL should fail with 403
    $tamperedUrl = str_replace("kyc-documents/{$doc->id}", "kyc-documents/9999", $signedUrl);
    $tamperedResponse = $this->get($tamperedUrl);
    $tamperedResponse->assertStatus(403);
});

test('authenticated download endpoint prevents IDOR and verifies ownership', function (): void {
    $docA = KycDocument::create([
        'user_id' => $this->customerA->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/customer_a_dl.pdf',
        'verified' => false,
    ]);
    Storage::disk('local')->put('documents/kyc/customer_a_dl.pdf', 'dummy kyc pdf');

    // Customer B attempts to download Customer A's KYC document (IDOR attempt)
    Sanctum::actingAs($this->customerB);
    $unauthorizedResponse = $this->getJson("/api/v1/customer/kyc-documents/{$docA->id}/download");
    $unauthorizedResponse->assertStatus(403);

    // Customer A downloads their own KYC document
    Sanctum::actingAs($this->customerA);
    $ownerResponse = $this->get("/api/v1/customer/kyc-documents/{$docA->id}/download");
    $ownerResponse->assertStatus(200);

    // Staff member reviews Customer A's KYC document
    Sanctum::actingAs($this->staff);
    $staffResponse = $this->get("/api/v1/customer/kyc-documents/{$docA->id}/download");
    $staffResponse->assertStatus(200);
});

test('kyc document resource provides a signed temporary url with expiration', function (): void {
    $doc = KycDocument::create([
        'user_id' => $this->customerA->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/test_dl.pdf',
        'verified' => false,
    ]);

    $resource = (new KycDocumentResource($doc))->resolve();

    expect($resource['file_url'])->toContain('signature=');
    expect($resource['file_url'])->toContain('expires=');
    expect($resource['temporary_url'])->toContain('signature=');
});

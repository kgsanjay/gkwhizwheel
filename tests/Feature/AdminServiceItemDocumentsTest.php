<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\ServiceItem;
use App\Models\ServiceItemDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');

    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin-doc-test@gkwhizwheels.com',
        'password' => bcrypt('password'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->scubaManager = User::create([
        'name' => 'Scuba Manager',
        'email' => 'scubamanager-doc@gkwhizwheels.com',
        'password' => bcrypt('password'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->scubaManager->syncAssignedServices(['scuba']);

    $this->taxiManager = User::create([
        'name' => 'Taxi Manager',
        'email' => 'taximanager-doc@gkwhizwheels.com',
        'password' => bcrypt('password'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->taxiManager->syncAssignedServices(['taxi']);
});

test('service_item_documents table exists with required columns and constraints', function (): void {
    expect(Schema::hasTable('service_item_documents'))->toBeTrue();
    expect(Schema::hasColumns('service_item_documents', [
        'id',
        'service_item_id',
        'document_type',
        'file_path',
        'verified',
        'expiry_date',
        'uploaded_by',
        'created_at',
        'updated_at',
    ]))->toBeTrue();
});

test('admin can create scuba service item with instructor certification and insurance documents', function (): void {
    $certFile = UploadedFile::fake()->create('padi_cert.pdf', 200, 'application/pdf');
    $insuranceFile = UploadedFile::fake()->create('insurance.pdf', 300, 'application/pdf');

    $response = $this->actingAs($this->scubaManager)->post('/admin/services/scuba/items', [
        'name' => 'Netrani Deep Dive Expedition',
        'category' => 'Deep Dive',
        'price_base' => 4500,
        'price_unit' => 'per_dive',
        'capacity' => '4 divers',
        'description' => 'Certified instructor guided scuba dive package at Netrani Island.',
        'status' => 'available',
        'documents' => [
            [
                'document_type' => 'instructor_certification',
                'file' => $certFile,
                'expiry_date' => '2028-12-31',
                'verified' => '1',
            ],
            [
                'document_type' => 'insurance_docs',
                'file' => $insuranceFile,
                'expiry_date' => '2027-06-30',
                'verified' => '1',
            ],
        ],
    ]);

    $response->assertRedirect('/admin/services/scuba/items');
    $response->assertSessionHas('success');

    $item = ServiceItem::where('name', 'Netrani Deep Dive Expedition')->firstOrFail();
    expect($item->documents)->toHaveCount(2);

    $certDoc = $item->documents()->where('document_type', 'instructor_certification')->first();
    expect($certDoc)->not->toBeNull();
    expect($certDoc->verified)->toBeTrue();
    expect($certDoc->expiry_date?->format('Y-m-d'))->toBe('2028-12-31');
    expect($certDoc->uploaded_by)->toBe($this->scubaManager->id);
    expect($certDoc->file_url)->toContain('/storage/' . $certDoc->file_path);

    Storage::disk('public')->assertExists($certDoc->file_path);

    $insuranceDoc = $item->documents()->where('document_type', 'insurance_docs')->first();
    expect($insuranceDoc)->not->toBeNull();
    Storage::disk('public')->assertExists($insuranceDoc->file_path);
});

test('admin can update document expiry date and verified status on existing service item', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Coastal Breeze Heritage Villa',
        'price_base' => 3500,
        'price_unit' => 'per_night',
        'status' => 'available',
    ]);

    $doc = ServiceItemDocument::create([
        'service_item_id' => $item->id,
        'document_type' => 'fire_safety',
        'file_path' => 'services/documents/fake_fire.pdf',
        'expiry_date' => '2026-10-01',
        'verified' => false,
        'uploaded_by' => $this->superAdmin->id,
    ]);

    $response = $this->actingAs($this->superAdmin)->put("/admin/services/homestay/items/{$item->id}", [
        'name' => $item->name,
        'price_base' => 3500,
        'price_unit' => 'per_night',
        'status' => 'available',
        'documents' => [
            [
                'document_type' => 'fire_safety',
                'expiry_date' => '2029-01-15',
                'verified' => '1',
            ],
        ],
    ]);

    $response->assertRedirect('/admin/services/homestay/items');

    $doc->refresh();
    expect($doc->verified)->toBeTrue();
    expect($doc->expiry_date?->format('Y-m-d'))->toBe('2029-01-15');
    expect($doc->file_path)->toBe('services/documents/fake_fire.pdf');
});

test('uploading replacement document removes old file from disk and updates record', function (): void {
    $oldFilePath = 'services/documents/old_license.pdf';
    Storage::disk('public')->put($oldFilePath, 'old content');

    $item = ServiceItem::create([
        'service_type' => 'guide',
        'name' => 'Licensed Coastal Guide Raghu',
        'price_base' => 1200,
        'price_unit' => 'per_day',
        'status' => 'available',
    ]);

    $doc = ServiceItemDocument::create([
        'service_item_id' => $item->id,
        'document_type' => 'govt_guide_license',
        'file_path' => $oldFilePath,
        'expiry_date' => '2025-12-31',
        'verified' => false,
        'uploaded_by' => $this->superAdmin->id,
    ]);

    $newFile = UploadedFile::fake()->create('renewed_license.pdf', 150, 'application/pdf');

    $response = $this->actingAs($this->superAdmin)->put("/admin/services/guide/items/{$item->id}", [
        'name' => $item->name,
        'price_base' => 1200,
        'price_unit' => 'per_day',
        'status' => 'available',
        'documents' => [
            [
                'document_type' => 'govt_guide_license',
                'file' => $newFile,
                'expiry_date' => '2030-12-31',
                'verified' => '1',
            ],
        ],
    ]);

    $response->assertRedirect('/admin/services/guide/items');

    $doc->refresh();
    expect($doc->file_path)->not->toBe($oldFilePath);
    expect($doc->expiry_date?->format('Y-m-d'))->toBe('2030-12-31');
    expect($doc->verified)->toBeTrue();

    Storage::disk('public')->assertMissing($oldFilePath);
    Storage::disk('public')->assertExists($doc->file_path);
});

test('admin can delete a document via destroyDocument route', function (): void {
    $filePath = 'services/documents/temp_license.pdf';
    Storage::disk('public')->put($filePath, 'sample data');

    $item = ServiceItem::create([
        'service_type' => 'homestay',
        'name' => 'Palm Grove Eco Resort',
        'price_base' => 4000,
        'price_unit' => 'per_night',
        'status' => 'available',
    ]);

    $doc = ServiceItemDocument::create([
        'service_item_id' => $item->id,
        'document_type' => 'trade_license',
        'file_path' => $filePath,
        'expiry_date' => '2027-01-01',
        'verified' => true,
        'uploaded_by' => $this->superAdmin->id,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->delete("/admin/services/homestay/items/{$item->id}/documents/{$doc->id}");

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(ServiceItemDocument::find($doc->id))->toBeNull();
    Storage::disk('public')->assertMissing($filePath);

    expect(ActivityLog::where('action', 'service_item_document.deleted')->exists())->toBeTrue();
});

test('deleting a service item cleans up its documents and files', function (): void {
    $filePath = 'services/documents/scuba_cert_to_delete.pdf';
    Storage::disk('public')->put($filePath, 'scuba cert');

    $item = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Dive Center North',
        'price_base' => 5000,
        'price_unit' => 'per_dive',
        'status' => 'available',
    ]);

    $doc = ServiceItemDocument::create([
        'service_item_id' => $item->id,
        'document_type' => 'instructor_certification',
        'file_path' => $filePath,
        'verified' => true,
        'uploaded_by' => $this->scubaManager->id,
    ]);

    $response = $this->actingAs($this->scubaManager)->delete("/admin/services/scuba/items/{$item->id}");
    $response->assertRedirect('/admin/services/scuba/items');

    expect(ServiceItem::find($item->id))->toBeNull();
    expect(ServiceItemDocument::find($doc->id))->toBeNull();
    Storage::disk('public')->assertMissing($filePath);
});

test('unauthorized manager cannot upload or manage documents for unassigned service type', function (): void {
    $certFile = UploadedFile::fake()->create('padi_cert.pdf', 200, 'application/pdf');

    // Taxi manager cannot create scuba items or upload scuba documents
    $response = $this->actingAs($this->taxiManager)->post('/admin/services/scuba/items', [
        'name' => 'Unauthorized Scuba Try',
        'price_base' => 4500,
        'price_unit' => 'per_dive',
        'status' => 'available',
        'documents' => [
            [
                'document_type' => 'instructor_certification',
                'file' => $certFile,
            ],
        ],
    ]);

    $response->assertForbidden();
});

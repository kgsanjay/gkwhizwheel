<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\KycDocumentType;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FileUploadSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $customerUser;
    protected Store $store;
    protected BikeCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('local');

        $this->store = Store::create([
            'name' => 'Main Hub',
            'address_line' => 'Opp. Sharavathi Bridge, Palya',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2810,
            'longitude' => 74.4442,
            'phone' => '9481512340',
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->category = BikeCategory::create([
            'name' => 'Scooter',
            'base_daily_rate' => 500,
            'default_deposit_amount' => 1000,
            'excess_km_charge' => 5,
            'free_km_per_day' => 100,
        ]);

        $this->adminUser = User::factory()->create([
            'role' => UserRole::SUPER_ADMIN,
        ]);

        $this->customerUser = User::factory()->create([
            'role' => UserRole::CUSTOMER,
        ]);
    }

    public function test_upload_rejects_unallowed_mime_types_like_svg(): void
    {
        $this->actingAs($this->adminUser);

        // Try to upload an SVG file (which can contain embedded XSS JavaScript)
        $svgFile = UploadedFile::fake()->create('malicious.svg', 100, 'image/svg+xml');

        $response = $this->post(route('admin.bikes.store'), [
            'category_id' => $this->category->id,
            'current_store_id' => $this->store->id,
            'home_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-1234',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'primary_image' => $svgFile,
        ]);

        $response->assertSessionHasErrors('primary_image');
    }

    public function test_upload_rejects_files_exceeding_max_file_size(): void
    {
        $this->actingAs($this->adminUser);

        // Max size for primary_image is 5120 KB (5MB); upload 6MB file
        $oversizedImage = UploadedFile::fake()->create('large.jpg', 6144, 'image/jpeg');

        $response = $this->post(route('admin.bikes.store'), [
            'category_id' => $this->category->id,
            'current_store_id' => $this->store->id,
            'home_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-5678',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'primary_image' => $oversizedImage,
        ]);

        $response->assertSessionHasErrors('primary_image');
    }

    public function test_uploaded_files_are_stored_with_randomized_filenames_and_not_original_names(): void
    {
        $this->actingAs($this->adminUser);

        $originalFilename = 'my_super_secret_orig_file_name.jpg';
        $validImage = UploadedFile::fake()->image($originalFilename, 200, 200);

        $response = $this->post(route('admin.bikes.store'), [
            'category_id' => $this->category->id,
            'current_store_id' => $this->store->id,
            'home_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-9999',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'primary_image' => $validImage,
        ]);

        $response->assertSessionHasNoErrors();

        $bike = Bike::where('registration_number', 'KA-47-E-9999')->firstOrFail();
        $this->assertNotNull($bike->primary_image_path);

        // Path must NOT end with the original filename
        $this->assertStringNotContainsString($originalFilename, $bike->primary_image_path);

        // File must exist on the public disk
        Storage::disk('public')->assertExists($bike->primary_image_path);
    }

    public function test_sensitive_documents_are_stored_on_local_disk_outside_public_webroot(): void
    {
        Sanctum::actingAs($this->customerUser);

        $docFile = UploadedFile::fake()->create('original_passport.pdf', 300, 'application/pdf');

        $response = $this->postJson('/api/v1/customer/kyc-documents', [
            'document_type' => KycDocumentType::PASSPORT->value,
            'file' => $docFile,
        ]);

        $response->assertCreated();

        $filePath = $response->json('data.file_path') ?? $response->json('file_path');
        if (! $filePath) {
            $kycDoc = \App\Models\KycDocument::where('user_id', $this->customerUser->id)->firstOrFail();
            $filePath = $kycDoc->file_path;
        }

        $this->assertNotNull($filePath);
        // Sensitive file should NOT be in public disk
        Storage::disk('public')->assertMissing($filePath);
        // Sensitive file MUST be stored in the non-public local disk
        Storage::disk('local')->assertExists($filePath);
        // Must NOT use original user-supplied filename
        $this->assertStringNotContainsString('original_passport.pdf', $filePath);
    }
}

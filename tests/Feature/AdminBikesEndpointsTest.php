<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    Storage::fake('public');
    Storage::fake('local');

    $this->store = Store::create([
        'name' => 'Admin Central Store',
        'address_line' => '100 Main Street',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Sports Cruiser',
        'base_daily_rate' => 1200.00,
        'default_deposit_amount' => 4000.00,
    ]);

    $this->admin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin@gkwhizwheel.com',
        'phone' => '9999900000',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Store Staff',
        'email' => 'staff@gkwhizwheel.com',
        'phone' => '9999911111',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Regular Customer',
        'email' => 'customer@gkwhizwheel.com',
        'phone' => '9999922222',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin bike endpoints', function (): void {
    $this->postJson('/api/v1/admin/bikes', [])->assertStatus(401);
    $this->putJson('/api/v1/admin/bikes/1', [])->assertStatus(401);
    $this->deleteJson('/api/v1/admin/bikes/1')->assertStatus(401);
    $this->postJson('/api/v1/admin/bikes/1/documents', [])->assertStatus(401);
    $this->postJson('/api/v1/admin/bikes/bulk-import', [])->assertStatus(401);
});

test('non-admin users (customer and staff) receive 403 forbidden on admin bike endpoints', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'CBR 250R',
        'registration_number' => 'KA-01-AB-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    // Customer test
    Sanctum::actingAs($this->customer);

    $this->postJson('/api/v1/admin/bikes', [
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Yamaha',
        'model_name' => 'R15',
        'registration_number' => 'KA-01-CD-5678',
        'fuel_type' => 'petrol',
        'transmission' => 'manual',
    ])->assertStatus(403)
        ->assertJson([
            'success' => false,
            'data' => null,
        ]);

    $this->putJson('/api/v1/admin/bikes/'.$bike->id, [
        'brand' => 'Updated Brand',
    ])->assertStatus(403);

    $this->deleteJson('/api/v1/admin/bikes/'.$bike->id)->assertStatus(403);

    $this->postJson('/api/v1/admin/bikes/'.$bike->id.'/documents', [
        'document_type' => 'rc',
        'file' => UploadedFile::fake()->create('rc.pdf', 100, 'application/pdf'),
    ])->assertStatus(403);

    $this->postJson('/api/v1/admin/bikes/bulk-import', [
        'file' => UploadedFile::fake()->create('bikes.csv', 100, 'text/csv'),
    ])->assertStatus(403);

    // Staff test
    Sanctum::actingAs($this->staff);

    $this->postJson('/api/v1/admin/bikes', [
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Yamaha',
        'model_name' => 'R15',
        'registration_number' => 'KA-01-CD-9999',
        'fuel_type' => 'petrol',
        'transmission' => 'manual',
    ])->assertStatus(403);
});

test('admin can create bike with images and documents via multipart form', function (): void {
    Sanctum::actingAs($this->admin);

    $primaryImage = UploadedFile::fake()->image('primary.jpg');
    $galleryImage1 = UploadedFile::fake()->image('gallery1.jpg');
    $galleryImage2 = UploadedFile::fake()->image('gallery2.jpg');
    $rcDocument = UploadedFile::fake()->create('rc.pdf', 200, 'application/pdf');

    $payload = [
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-05-RE-3500',
        'fuel_type' => 'petrol',
        'transmission' => 'manual',
        'base_daily_rate_override' => 1100.00,
        'deposit_amount_override' => 3500.00,
        'odometer_reading' => 1500,
        'status' => 'available',
        'primary_image' => $primaryImage,
        'images' => [$galleryImage1, $galleryImage2],
        'documents' => [
            [
                'document_type' => 'rc',
                'file' => $rcDocument,
                'issue_date' => '2025-01-10',
                'expiry_date' => '2040-01-10',
                'verified' => true,
            ],
        ],
    ];

    $response = $this->postJson('/api/v1/admin/bikes', $payload);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Bike created successfully.')
        ->assertJsonPath('data.brand', 'Royal Enfield')
        ->assertJsonPath('data.model_name', 'Hunter 350')
        ->assertJsonPath('data.registration_number', 'KA-05-RE-3500')
        ->assertJsonPath('data.daily_rate', 1100)
        ->assertJsonPath('data.deposit_amount', 3500)
        ->assertJsonPath('data.odometer_reading', 1500);

    $bikeId = $response->json('data.id');
    $bike = Bike::with(['images', 'documents'])->findOrFail($bikeId);

    expect($bike->images)->toHaveCount(2)
        ->and($bike->documents)->toHaveCount(1)
        ->and($bike->documents->first()->document_type)->toBe(BikeDocumentType::RC)
        ->and($bike->documents->first()->uploaded_by)->toBe($this->admin->id)
        ->and($bike->primary_image_path)->not->toBeNull();
});

test('admin can update an existing bike', function (): void {
    Sanctum::actingAs($this->admin);

    $bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'KTM',
        'model_name' => 'Duke 200',
        'registration_number' => 'KA-03-KM-2000',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
    ]);

    $newPrimaryImage = UploadedFile::fake()->image('duke_new.jpg');

    $response = $this->putJson('/api/v1/admin/bikes/'.$bike->id, [
        'model_name' => 'Duke 250',
        'odometer_reading' => 5500,
        'status' => 'maintenance',
        'primary_image' => $newPrimaryImage,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.model_name', 'Duke 250')
        ->assertJsonPath('data.odometer_reading', 5500)
        ->assertJsonPath('data.status', 'maintenance');

    $bike->refresh();
    expect($bike->model_name)->toBe('Duke 250')
        ->and($bike->odometer_reading)->toBe(5500)
        ->and($bike->status)->toBe(BikeStatus::MAINTENANCE)
        ->and($bike->primary_image_path)->not->toBeNull();
});

test('admin can soft delete a bike', function (): void {
    Sanctum::actingAs($this->admin);

    $bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Suzuki',
        'model_name' => 'Gixxer',
        'registration_number' => 'KA-04-SZ-1000',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $response = $this->deleteJson('/api/v1/admin/bikes/'.$bike->id);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Bike deleted successfully.');

    expect(Bike::find($bike->id))->toBeNull()
        ->and(Bike::withTrashed()->find($bike->id))->not->toBeNull()
        ->and(Bike::withTrashed()->find($bike->id)->deleted_at)->not->toBeNull();
});

test('admin can upload document for an existing bike and overwrite existing document type', function (): void {
    Sanctum::actingAs($this->admin);

    $bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'TVS',
        'model_name' => 'Apache RTR 160',
        'registration_number' => 'KA-05-TV-1600',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $insuranceFile1 = UploadedFile::fake()->create('insurance_v1.pdf', 150, 'application/pdf');

    $response1 = $this->postJson('/api/v1/admin/bikes/'.$bike->id.'/documents', [
        'document_type' => 'insurance',
        'file' => $insuranceFile1,
        'issue_date' => '2025-06-01',
        'expiry_date' => '2026-05-31',
        'verified' => true,
    ]);

    $response1->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.document_type', 'insurance')
        ->assertJsonPath('data.verified', true);

    expect(BikeDocument::where('bike_id', $bike->id)->count())->toBe(1);

    // Uploading updated insurance document updates the existing type for this bike
    $insuranceFile2 = UploadedFile::fake()->create('insurance_v2.pdf', 200, 'application/pdf');

    $response2 = $this->postJson('/api/v1/admin/bikes/'.$bike->id.'/documents', [
        'document_type' => 'insurance',
        'file' => $insuranceFile2,
        'issue_date' => '2026-06-01',
        'expiry_date' => '2027-05-31',
        'verified' => true,
    ]);

    $response2->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.document_type', 'insurance')
        ->assertJsonPath('data.expiry_date', '2027-05-31');

    expect(BikeDocument::where('bike_id', $bike->id)->count())->toBe(1);
});

test('admin can bulk import bikes from valid CSV file', function (): void {
    Sanctum::actingAs($this->admin);

    $csvContent = implode("\n", [
        'brand,model_name,registration_number,category_id,current_store_id,home_store_id,fuel_type,transmission,base_daily_rate_override,deposit_amount_override,odometer_reading,status',
        "Yamaha,Aerox 155,KA-01-AX-1111,{$this->category->id},{$this->store->id},{$this->store->id},petrol,automatic,950.00,3000.00,200,available",
        "Ather,450X,KA-01-AT-2222,{$this->category->id},{$this->store->id},{$this->store->id},electric,automatic,800.00,2500.00,500,available",
    ]);

    $file = UploadedFile::fake()->createWithContent('bikes_import.csv', $csvContent);

    $response = $this->postJson('/api/v1/admin/bikes/bulk-import', [
        'file' => $file,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.imported_count', 2)
        ->assertJsonPath('data.failed_count', 0)
        ->assertJsonPath('data.errors', []);

    expect(Bike::where('registration_number', 'KA-01-AX-1111')->exists())->toBeTrue()
        ->and(Bike::where('registration_number', 'KA-01-AT-2222')->exists())->toBeTrue();
});

test('bulk import handles rows with validation errors and imports only valid rows', function (): void {
    Sanctum::actingAs($this->admin);

    $csvContent = implode("\n", [
        'brand,model_name,registration_number,category_id,current_store_id,home_store_id,fuel_type,transmission',
        "Yamaha,R3,KA-01-R3-3333,{$this->category->id},{$this->store->id},{$this->store->id},petrol,manual",
        "Kawasaki,Ninja 300,,{$this->category->id},{$this->store->id},{$this->store->id},petrol,manual", // Missing registration number
        "BMW,G310R,KA-01-BM-4444,999999,{$this->store->id},{$this->store->id},petrol,manual", // Invalid category_id
    ]);

    $file = UploadedFile::fake()->createWithContent('bikes_mixed.csv', $csvContent);

    $response = $this->postJson('/api/v1/admin/bikes/bulk-import', [
        'file' => $file,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.imported_count', 1)
        ->assertJsonPath('data.failed_count', 2);

    expect(Bike::where('registration_number', 'KA-01-R3-3333')->exists())->toBeTrue()
        ->and(Bike::where('brand', 'Kawasaki')->exists())->toBeFalse();
});

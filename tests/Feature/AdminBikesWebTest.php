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
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');
    Storage::fake('local');

    $this->store1 = Store::create([
        'name' => 'Indiranagar Hub',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500001',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500002',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Electric Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->superAdmin = User::create([
        'name' => 'Chief Administrator',
        'email' => 'admin@gkwhizwheel.com',
        'phone' => '9876500099',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->storeManager = User::create([
        'name' => 'Indiranagar Manager',
        'email' => 'manager@gkwhizwheel.com',
        'phone' => '9876500088',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Hub Staff',
        'email' => 'staff@gkwhizwheel.com',
        'phone' => '9876500077',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store1->id,
        'brand' => 'Ather',
        'model_name' => '450X',
        'registration_number' => 'KA-01-EV-1001',
        'fuel_type' => FuelType::ELECTRIC,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 1500,
    ]);
});

test('unauthenticated users cannot view admin bike screens and are redirected to login', function (): void {
    $this->get('/admin/bikes')->assertRedirect('/admin/login');
    $this->get('/admin/bikes/create')->assertRedirect('/admin/login');
    $this->get("/admin/bikes/{$this->bike->id}/edit")->assertRedirect('/admin/login');
});

test('staff users cannot access admin bike management screens', function (): void {
    $this->actingAs($this->staff)
        ->get('/admin/bikes')
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->get('/admin/bikes/create')
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->get("/admin/bikes/{$this->bike->id}/edit")
        ->assertForbidden();
});

test('super admin can view admin bikes list with stats and filters', function (): void {
    Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store2->id,
        'brand' => 'Ola',
        'model_name' => 'S1 Pro',
        'registration_number' => 'KA-01-EV-2002',
        'fuel_type' => FuelType::ELECTRIC,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::ON_RENT,
        'odometer_reading' => 3200,
    ]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/bikes')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Bikes/Index')
            ->has('bikes', 2)
            ->has('categories', 1)
            ->has('stores', 2)
            ->has('stats')
            ->where('stats.total', 2)
            ->where('stats.available', 1)
            ->where('stats.rented', 1)
            ->where('stats.drifted', 1)
        );
});

test('admin bikes listing can be filtered by search, category, store, status, and drift', function (): void {
    $driftedBike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store2->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-05-AB-5555',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::MAINTENANCE,
        'odometer_reading' => 8500,
    ]);

    // Filter by search keyword
    $this->actingAs($this->superAdmin)
        ->get('/admin/bikes?search=Activa')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Bikes/Index')
            ->has('bikes', 1)
            ->where('bikes.0.brand', 'Honda')
        );

    // Filter by status
    $this->actingAs($this->superAdmin)
        ->get('/admin/bikes?status=maintenance')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Bikes/Index')
            ->has('bikes', 1)
            ->where('bikes.0.registration_number', 'KA-05-AB-5555')
        );

    // Filter by drift
    $this->actingAs($this->superAdmin)
        ->get('/admin/bikes?drift=true')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Bikes/Index')
            ->has('bikes', 1)
            ->where('bikes.0.id', $driftedBike->id)
        );
});

test('store manager can view create bike form', function (): void {
    $this->actingAs($this->storeManager)
        ->get('/admin/bikes/create')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Bikes/Create')
            ->has('categories', 1)
            ->has('stores', 2)
            ->has('fuel_types')
            ->has('transmissions')
            ->has('statuses')
        );
});

test('super admin can store a new bike with primary image and RC, Insurance, and Emission documents', function (): void {
    $primaryImage = UploadedFile::fake()->image('ather-450x.jpg');
    $rcFile = UploadedFile::fake()->create('rc-doc.pdf', 200, 'application/pdf');
    $insuranceFile = UploadedFile::fake()->create('insurance-doc.pdf', 250, 'application/pdf');
    $emissionFile = UploadedFile::fake()->create('emission-doc.pdf', 150, 'application/pdf');

    $payload = [
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-03-JK-9090',
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store1->id,
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::MANUAL->value,
        'odometer_reading' => 500,
        'base_daily_rate_override' => '950.00',
        'deposit_amount_override' => '3000.00',
        'status' => BikeStatus::AVAILABLE->value,
        'next_service_due_date' => Carbon::now()->addMonths(3)->toDateString(),
        'primary_image' => $primaryImage,
        'documents' => [
            [
                'document_type' => BikeDocumentType::RC->value,
                'file' => $rcFile,
                'expiry_date' => Carbon::now()->addYears(5)->toDateString(),
            ],
            [
                'document_type' => BikeDocumentType::INSURANCE->value,
                'file' => $insuranceFile,
                'expiry_date' => Carbon::now()->addYear()->toDateString(),
            ],
            [
                'document_type' => BikeDocumentType::EMISSION_CERTIFICATE->value,
                'file' => $emissionFile,
                'expiry_date' => Carbon::now()->addMonths(6)->toDateString(),
            ],
        ],
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/bikes', $payload);

    $response->assertRedirect('/admin/bikes')
        ->assertSessionHas('success', 'Bike added successfully to the fleet.');

    $bike = Bike::where('registration_number', 'KA-03-JK-9090')->first();
    expect($bike->primary_image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($bike->primary_image_path);
    expect($bike->documents()->count())->toBe(3);

    $rcDoc = $bike->documents()->where('document_type', BikeDocumentType::RC)->first();
    expect($rcDoc)->not->toBeNull();
    expect($rcDoc->expiry_date->toDateString())->toBe(Carbon::now()->addYears(5)->toDateString());
    Storage::disk('local')->assertExists($rcDoc->file_path);
});

test('super admin can view edit bike form with loaded relations and existing documents', function (): void {
    $insuranceDoc = BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'bike_documents/insurance_test.pdf',
        'expiry_date' => Carbon::now()->addMonths(4),
        'is_verified' => true,
    ]);

    $this->actingAs($this->superAdmin)
        ->get("/admin/bikes/{$this->bike->id}/edit")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Bikes/Edit')
            ->where('bike.id', $this->bike->id)
            ->where('bike.brand', 'Ather')
            ->where('bike.documents.insurance.id', $insuranceDoc->id)
            ->has('categories')
            ->has('stores')
        );
});

test('super admin can update a bike and replace/update document expiry dates', function (): void {
    BikeDocument::create([
        'bike_id' => $this->bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'bike_documents/old_insurance.pdf',
        'expiry_date' => Carbon::now()->addMonth(),
        'is_verified' => true,
    ]);

    $newInsuranceFile = UploadedFile::fake()->create('new_insurance.pdf', 300, 'application/pdf');
    $newExpiry = Carbon::now()->addYears(2)->toDateString();

    $payload = [
        '_method' => 'put',
        'brand' => 'Ather Energy',
        'model_name' => '450X Gen 3',
        'registration_number' => $this->bike->registration_number,
        'category_id' => $this->category->id,
        'home_store_id' => $this->store1->id,
        'current_store_id' => $this->store2->id,
        'fuel_type' => FuelType::ELECTRIC->value,
        'transmission' => Transmission::AUTOMATIC->value,
        'odometer_reading' => 2400,
        'status' => BikeStatus::MAINTENANCE->value,
        'documents' => [
            [
                'document_type' => BikeDocumentType::INSURANCE->value,
                'file' => $newInsuranceFile,
                'expiry_date' => $newExpiry,
            ],
        ],
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post("/admin/bikes/{$this->bike->id}", $payload);

    $response->assertRedirect('/admin/bikes')
        ->assertSessionHas('success', 'Bike details updated successfully.');

    $this->bike->refresh();
    expect($this->bike->brand)->toBe('Ather Energy');
    expect($this->bike->current_store_id)->toBe($this->store2->id);
    expect($this->bike->status)->toBe(BikeStatus::MAINTENANCE);
    expect($this->bike->odometer_reading)->toBe(2400);

    $updatedDoc = $this->bike->documents()->where('document_type', BikeDocumentType::INSURANCE)->first();
    expect($updatedDoc->expiry_date->toDateString())->toBe($newExpiry);
    Storage::disk('local')->assertExists($updatedDoc->file_path);
});

test('super admin can soft delete a bike', function (): void {
    $response = $this->actingAs($this->superAdmin)
        ->delete("/admin/bikes/{$this->bike->id}");

    $response->assertRedirect('/admin/bikes')
        ->assertSessionHas('success', 'Bike removed from fleet successfully.');

    expect(Bike::find($this->bike->id))->toBeNull();
    expect(Bike::withTrashed()->find($this->bike->id))->not->toBeNull();
});

test('super admin can import bikes via bulk CSV upload', function (): void {
    $csvContent = "registration_number,brand,model_name,category,fuel_type,transmission,home_store,current_store,odometer_reading,base_daily_rate,deposit_amount,status\n"
        . "KA-04-AB-1234,TVS,Apache RTR 160,Electric Scooter,petrol,manual,Indiranagar Hub,Indiranagar Hub,150,800,2500,available\n"
        . "KA-04-CD-5678,Yamaha,Aerox 155,Electric Scooter,petrol,automatic,Indiranagar Hub,Koramangala Hub,200,900,3000,available\n";

    $csvFile = UploadedFile::fake()->createWithContent('bikes_import.csv', $csvContent);

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/bikes/import-csv', [
            'file' => $csvFile,
        ]);

    $response->assertRedirect('/admin/bikes')
        ->assertSessionHas('success', 'Imported 2 bikes successfully.');

    expect(Bike::where('registration_number', 'KA-04-AB-1234')->exists())->toBeTrue();
    expect(Bike::where('registration_number', 'KA-04-CD-5678')->exists())->toBeTrue();

    $importedBike2 = Bike::where('registration_number', 'KA-04-CD-5678')->first();
    expect($importedBike2->current_store_id)->toBe($this->store2->id);
});

test('bulk CSV import fails gracefully if required headers or fields are invalid', function (): void {
    $csvContent = "registration_number,brand,model_name\n"
        . "KA-99-ZZ-0001,Bajaj,Pulsar\n";

    $csvFile = UploadedFile::fake()->createWithContent('invalid_import.csv', $csvContent);

    $response = $this->actingAs($this->superAdmin)
        ->from('/admin/bikes')
        ->post('/admin/bikes/import-csv', [
            'file' => $csvFile,
        ]);

    $response->assertRedirect('/admin/bikes')
        ->assertSessionHasErrors('file');

    expect(Bike::where('registration_number', 'KA-99-ZZ-0001')->exists())->toBeFalse();
});

test('super admin can download sample CSV template', function (): void {
    $response = $this->actingAs($this->superAdmin)
        ->get('/admin/bikes/export-sample-csv');

    $response->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename=gkwhizwheel_bikes_sample.csv');
});

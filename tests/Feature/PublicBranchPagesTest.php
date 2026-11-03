<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Main Hub', 'city' => 'Honnavar',
        'address_line' => 'Main Road', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.44,
        'slug' => 'honnavar', 'publication_status' => 'published',
        'public_description' => 'Visit our Honnavar location to collect your scooter.',
        'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Branch', 'city' => 'Murudeshwar',
        'address_line' => 'Near KSRTC', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.48,
        'slug' => 'murudeshwar', 'publication_status' => 'published',
        'public_description' => 'Collect a rental bike from our Murudeshwar branch.',
        'status' => StoreStatus::ACTIVE,
    ]);
    $this->draft = Store::create([
        'name' => 'Unpublished Branch', 'city' => 'Bhatkal',
        'address_line' => 'Market Road', 'state' => 'Karnataka', 'pincode' => '581320',
        'latitude' => 13.98, 'longitude' => 74.55,
        'slug' => 'bhatkal', 'publication_status' => 'draft',
        'status' => StoreStatus::ACTIVE,
    ]);
});

test('public branch index only contains published active branches', function (): void {
    $this->get('/locations')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Locations/Index')
            ->has('branches', 2));
    $this->get('/locations/bhatkal')->assertNotFound();
});

test('unpublished or inactive branches never appear in public branch routes or sitemap', function (): void {
    $this->murudeshwar->update(['status' => StoreStatus::INACTIVE]);
    $this->get('/locations/murudeshwar')->assertNotFound();
    $this->get('/sitemap.xml')->assertDontSee('/locations/murudeshwar');
    $this->get('/sitemap.xml')->assertDontSee('/locations/bhatkal');
    $this->get('/sitemap.xml')->assertSee('/locations/honnavar');
});

test('each branch page only presents its own physically assigned available bikes', function (): void {
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    foreach ([
        [$this->murudeshwar, 'Activa', BikeStatus::AVAILABLE, 'KA-47-AB-1011'],
        [$this->honnavar, 'Dio', BikeStatus::AVAILABLE, 'KA-47-AB-1012'],
        [$this->murudeshwar, 'Old Bike', BikeStatus::MAINTENANCE, 'KA-47-AB-1013'],
    ] as [$store, $model, $status, $registration]) {
        Bike::create([
            'category_id' => $category->id,
            'home_store_id' => $store->id,
            'current_store_id' => $store->id,
            'brand' => 'Honda',
            'model_name' => $model,
            'registration_number' => $registration,
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'status' => $status,
        ]);
    }

    $this->get('/locations/murudeshwar')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Locations/Show')
            ->where('branch.slug', 'murudeshwar')
            ->has('bikes', 1)
            ->where('bikes.0.model_name', 'Activa')
            ->where('bikes.0.daily_rate', 500)
        );
});

test('admin can create draft branch and publish only after adding original content', function (): void {
    $admin = User::create([
        'name' => 'Branch Admin', 'email' => 'branchadmin@example.com',
        'phone' => '9000000041', 'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $payload = [
        'name' => 'Kumta Branch', 'city' => 'Kumta',
        'address_line' => 'Main Bazaar', 'state' => 'Karnataka', 'pincode' => '581343',
        'latitude' => 14.426, 'longitude' => 74.415, 'status' => 'active',
        'publication_status' => 'draft',
    ];
    $this->actingAs($admin)->post('/admin/stores', $payload)->assertRedirect('/admin/stores');
    $branch = Store::where('name', 'Kumta Branch')->firstOrFail();
    expect($branch->slug)->toBe('kumta')->and($branch->publication_status)->toBe('draft');

    $this->get('/locations/kumta')->assertNotFound();

    $this->actingAs($admin)->put("/admin/stores/{$branch->id}", [
        'publication_status' => 'published',
    ])->assertSessionHasErrors(['public_description']);

    $this->actingAs($admin)->put("/admin/stores/{$branch->id}", [
        'publication_status' => 'published',
        'public_description' => 'Visit the Kumta branch for rental pickup near Main Bazaar.',
    ])->assertRedirect('/admin/stores');

    $this->get('/locations/kumta')->assertOk();
});


test('slug generation avoids duplicate city URLs for multiple hubs', function (): void {
    $admin = User::create([
        'name' => 'Super Admin', 'email' => 'branchadmin2@example.com',
        'phone' => '9000000042', 'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);

    $this->actingAs($admin)->post('/admin/stores', [
        'name' => 'Honnavar Railway Hub', 'city' => 'Honnavar',
        'address_line' => 'Railway Road', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.27, 'longitude' => 74.45,
    ])->assertRedirect('/admin/stores');

    expect(Store::where('name', 'Honnavar Railway Hub')->firstOrFail()->slug)->toBe('honnavar-2');
});

test('staging pages return noindex header while normal production requests do not', function (): void {
    $this->withServerVariables(['HTTP_HOST' => 'staging.whizwheels.in'])
        ->get('/locations/honnavar')
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    $this->withServerVariables(['HTTP_HOST' => 'whizwheels.in'])
        ->get('/locations/honnavar')
        ->assertOk()
        ->assertHeaderMissing('X-Robots-Tag');
});

test('branch landing pages do not expose customer-irrelevant bike registration numbers', function (): void {
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $this->murudeshwar->id,
        'current_store_id' => $this->murudeshwar->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-AB-9876',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->get('/locations/murudeshwar')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Locations/Show')
            ->has('bikes', 1)
            ->missing('bikes.0.registration_number')
            ->missing('bikes.0.odometer_reading'));
});


test('published branch slug is immutable without an explicit redirect plan', function (): void {
    $admin = User::create([
        'name' => 'Super Admin', 'email' => 'branchadmin3@example.com',
        'phone' => '9000000043', 'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->actingAs($admin)->put("/admin/stores/{$this->honnavar->id}", [
        'slug' => 'new-honnavar-address',
    ])->assertSessionHasErrors(['slug']);

    expect($this->honnavar->fresh()->slug)->toBe('honnavar');
});

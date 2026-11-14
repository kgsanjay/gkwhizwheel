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
use App\Models\BikeModel;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888809201', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888809202', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->admin = User::create([
        'name' => 'Admin', 'email' => 'model.web.admin@example.test',
        'phone' => '9888809203', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->manager = User::create([
        'name' => 'Manager', 'email' => 'model.web.manager@example.test',
        'phone' => '9888809204', 'password' => 'Password123!',
        'role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE,
    ]);
    $this->manager->stores()->attach($this->honnavar->id);
    $this->model = BikeModel::create([
        'category_id' => $this->category->id, 'brand' => 'Honda',
        'name' => 'Activa 6G', 'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
    ]);
});

test('superadmin sees model inventory by physical branch and individual bikes', function (): void {
    foreach ([
        [$this->honnavar, BikeStatus::AVAILABLE, 'KA-47-MWEB-01'],
        [$this->honnavar, BikeStatus::ON_RENT, 'KA-47-MWEB-02'],
        [$this->murudeshwar, BikeStatus::MAINTENANCE, 'KA-47-MWEB-03'],
    ] as [$store, $status, $registration]) {
        Bike::create([
            'category_id' => $this->category->id, 'bike_model_id' => $this->model->id,
            'current_store_id' => $store->id, 'home_store_id' => $this->honnavar->id,
            'brand' => 'Honda', 'model_name' => 'Activa 6G',
            'registration_number' => $registration,
            'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
            'status' => $status,
        ]);
    }
    $this->actingAs($this->admin)->get('/admin/bike-models')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/BikeModels/Index')
            ->has('models', 1)
            ->where('models.0.total_units', 3)
            ->where('models.0.branches.0.store_id', $this->honnavar->id)
            ->where('models.0.branches.0.available_now', 1)
            ->where('models.0.branches.0.on_rent', 1)
            ->where('models.0.branches.1.store_id', $this->murudeshwar->id)
            ->where('models.0.branches.1.maintenance', 1)
            ->has('models.0.units', 3)
            ->where('unlinked_units', 0));
});

test('bike model creation through admin UI validates duplicates and redirects', function (): void {
    $payload = [
        'category_id' => $this->category->id, 'brand' => 'TVS', 'name' => 'Jupiter',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
    ];
    $this->actingAs($this->admin)->post('/admin/bike-models', $payload)
        ->assertRedirect(route('admin.bike-models.index'));
    expect(BikeModel::where('brand', 'TVS')->where('name', 'Jupiter')->count())->toBe(1);
    $this->actingAs($this->admin)->post('/admin/bike-models', $payload)
        ->assertSessionHasErrors('name');
});

test('managers cannot view or create global bike models', function (): void {
    $this->actingAs($this->manager)->get('/admin/bike-models')->assertForbidden();
    $this->actingAs($this->manager)->post('/admin/bike-models', [
        'category_id' => $this->category->id, 'brand' => 'TVS', 'name' => 'Jupiter',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
    ])->assertForbidden();
    expect(BikeModel::count())->toBe(1);
});

test('model screen counts previously registered but unlinked bikes separately', function (): void {
    Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->honnavar->id,
        'home_store_id' => $this->honnavar->id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-MWEB-04',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->actingAs($this->admin)->get('/admin/bike-models')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('unlinked_units', 1)
            ->where('models.0.total_units', 0));
});

test('superadmin bulk registers three Activas as separate bikes at one branch', function (): void {
    $this->actingAs($this->admin)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', [
        'store_id' => $this->honnavar->id,
        'bikes' => [
            ['registration_number' => 'KA-47-BULK-01', 'odometer_reading' => 0],
            ['registration_number' => 'KA-47-BULK-02', 'odometer_reading' => 124],
            ['registration_number' => 'KA-47-BULK-03', 'odometer_reading' => 250],
        ],
    ])->assertRedirect(route('admin.bike-models.index'));

    $units = $this->model->bikes()->orderBy('registration_number')->get();
    expect($units)->toHaveCount(3)
        ->and($units->pluck('registration_number')->all())->toBe([
            'KA-47-BULK-01', 'KA-47-BULK-02', 'KA-47-BULK-03',
        ])
        ->and($units->every(fn (Bike $bike) => $bike->home_store_id === $this->honnavar->id
            && $bike->current_store_id === $this->honnavar->id
            && $bike->category_id === $this->model->category_id
            && $bike->brand === 'Honda' && $bike->model_name === 'Activa 6G'))->toBeTrue();
});

test('duplicate or invalid bike in bulk batch rejects all rows', function (): void {
    $this->actingAs($this->admin)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', [
        'store_id' => $this->honnavar->id,
        'bikes' => [
            ['registration_number' => 'KA-47-BULK-DUP'],
            ['registration_number' => 'KA-47-BULK-DUP'],
        ],
    ])->assertSessionHasErrors();
    expect($this->model->bikes()->count())->toBe(0);

    Bike::create([
        'bike_model_id' => $this->model->id, 'category_id' => $this->category->id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-BULK-OLD',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'home_store_id' => $this->honnavar->id, 'current_store_id' => $this->honnavar->id,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->actingAs($this->admin)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', [
        'store_id' => $this->honnavar->id,
        'bikes' => [
            ['registration_number' => 'KA-47-BULK-NEW'],
            ['registration_number' => 'KA-47-BULK-OLD'],
        ],
    ])->assertSessionHasErrors();
    expect($this->model->bikes()->count())->toBe(1)
        ->and(Bike::where('registration_number', 'KA-47-BULK-NEW')->exists())->toBeFalse();
});

test('bulk registration refuses inactive branches and models', function (): void {
    $this->murudeshwar->update(['status' => StoreStatus::INACTIVE]);
    $payload = [
        'store_id' => $this->murudeshwar->id,
        'bikes' => [['registration_number' => 'KA-47-BULK-10']],
    ];
    $this->actingAs($this->admin)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', $payload)
        ->assertSessionHasErrors('store_id');
    $this->model->update(['is_active' => false]);
    $payload['store_id'] = $this->honnavar->id;
    $this->actingAs($this->admin)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', $payload)
        ->assertSessionHasErrors('bike_model_id');
    expect(Bike::count())->toBe(0);
});

test('branch manager and staff cannot bulk create catalog vehicles', function (): void {
    $payload = [
        'store_id' => $this->honnavar->id,
        'bikes' => [['registration_number' => 'KA-47-BULK-20']],
    ];
    $this->actingAs($this->manager)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', $payload)
        ->assertForbidden();
    expect(Bike::count())->toBe(0);
});

test('bulk registration limits the batch to fifty bikes', function (): void {
    $rows = array_map(fn ($i) => ['registration_number' => sprintf('KA-47-BULK-%03d', $i)], range(1, 51));
    $this->actingAs($this->admin)->post('/admin/bike-models/'.$this->model->id.'/bikes/bulk', [
        'store_id' => $this->honnavar->id,
        'bikes' => $rows,
    ])->assertSessionHasErrors('bikes');
    expect(Bike::count())->toBe(0);
});

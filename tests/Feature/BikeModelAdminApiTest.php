<?php

declare(strict_types=1);

use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->admin = User::create([
        'name' => 'Admin', 'email' => 'model.admin@example.test',
        'phone' => '9000009911', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->manager = User::create([
        'name' => 'Manager', 'email' => 'model.manager@example.test',
        'phone' => '9000009912', 'password' => 'Password123!',
        'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
});

test('superadmin creates and lists shared bike models', function (): void {
    Sanctum::actingAs($this->admin);
    $payload = [
        'category_id' => $this->category->id,
        'brand' => 'Honda',
        'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
    ];
    $this->postJson('/api/v1/admin/bike-models', $payload)
        ->assertCreated()->assertJsonPath('data.total_units', 0);
    $this->getJson('/api/v1/admin/bike-models')
        ->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Activa 6G')
        ->assertJsonPath('data.0.total_units', 0);
});

test('duplicate catalog model is rejected', function (): void {
    Sanctum::actingAs($this->admin);
    $payload = [
        'category_id' => $this->category->id,
        'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
    ];
    $this->postJson('/api/v1/admin/bike-models', $payload)->assertCreated();
    $this->postJson('/api/v1/admin/bike-models', $payload)->assertUnprocessable();
    expect(BikeModel::count())->toBe(1);
});

test('catalog modifications are superadmin only', function (): void {
    Sanctum::actingAs($this->manager);
    $this->getJson('/api/v1/admin/bike-models')->assertForbidden();
    $this->postJson('/api/v1/admin/bike-models', [
        'category_id' => $this->category->id,
        'brand' => 'Honda', 'name' => 'Activa',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
    ])->assertForbidden();
});

test('model inventory totals distinguish physical branches and vehicle statuses', function (): void {
    $a = \App\Models\Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9000009931',
        'status' => \App\Enums\StoreStatus::ACTIVE,
    ]);
    $b = \App\Models\Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9000009932',
        'status' => \App\Enums\StoreStatus::ACTIVE,
    ]);
    $model = BikeModel::create([
        'category_id' => $this->category->id,
        'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
    ]);
    foreach ([
        [$a, \App\Enums\BikeStatus::AVAILABLE, 'KA-47-MDL-001'],
        [$a, \App\Enums\BikeStatus::ON_RENT, 'KA-47-MDL-002'],
        [$b, \App\Enums\BikeStatus::AVAILABLE, 'KA-47-MDL-003'],
        [$b, \App\Enums\BikeStatus::MAINTENANCE, 'KA-47-MDL-004'],
    ] as [$store, $status, $registration]) {
        \App\Models\Bike::create([
            'bike_model_id' => $model->id,
            'category_id' => $this->category->id,
            'brand' => 'Honda', 'model_name' => 'Activa 6G',
            'registration_number' => $registration,
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'home_store_id' => $a->id,
            'current_store_id' => $store->id,
            'status' => $status,
        ]);
    }

    Sanctum::actingAs($this->admin);
    $this->getJson('/api/v1/admin/bike-models')
        ->assertOk()
        ->assertJsonPath('data.0.total_units', 4)
        ->assertJsonPath('data.0.branches.0.store_id', $a->id)
        ->assertJsonPath('data.0.branches.0.total_units', 2)
        ->assertJsonPath('data.0.branches.0.available_now', 1)
        ->assertJsonPath('data.0.branches.0.on_rent', 1)
        ->assertJsonPath('data.0.branches.1.store_id', $b->id)
        ->assertJsonPath('data.0.branches.1.total_units', 2)
        ->assertJsonPath('data.0.branches.1.available_now', 1)
        ->assertJsonPath('data.0.branches.1.maintenance', 1);
});

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

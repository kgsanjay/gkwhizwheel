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
use App\Models\BranchBikeModelPrice;
use App\Models\Store;
use App\Models\User;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('branch model prices are independent and apply to every registered bike in that model', function (): void {
    $honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 400, 'default_deposit_amount' => 0,
    ]);
    $model = BikeModel::create([
        'category_id' => $category->id, 'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
    ]);
    $bikes = [];
    foreach (range(1, 10) as $i) {
        $bikes[] = Bike::create([
            'category_id' => $category->id, 'bike_model_id' => $model->id,
            'current_store_id' => $honnavar->id, 'home_store_id' => $honnavar->id,
            'brand' => 'Honda', 'model_name' => 'Activa 6G',
            'registration_number' => sprintf('KA-47-ACT-%04d', $i),
            'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
            'status' => BikeStatus::AVAILABLE, 'base_daily_rate_override' => 400,
            'weekend_daily_rate_override' => 500,
        ]);
    }

    $admin = User::create([
        'name' => 'Admin', 'email' => 'branchrates@example.test', 'phone' => '9888809277',
        'password' => 'Password123!', 'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->actingAs($admin)->post("/admin/bike-models/{$model->id}/branch-prices", [
        'store_id' => $honnavar->id, 'weekday_rate' => 400, 'weekend_rate' => 500,
    ])->assertRedirect(route('admin.bike-models.index'));
    $this->actingAs($admin)->post("/admin/bike-models/{$model->id}/branch-prices", [
        'store_id' => $murudeshwar->id, 'weekday_rate' => 550, 'weekend_rate' => 650,
    ])->assertRedirect(route('admin.bike-models.index'));

    expect($model->bikes()->count())->toBe(10)
        ->and(BranchBikeModelPrice::where('bike_model_id', $model->id)->count())->toBe(2);

    $pricing = app(PricingService::class);
    foreach ($bikes as $bike) {
        $hon = $pricing->calculateQuote($bike, '2026-11-09', '2026-11-09', $honnavar, $honnavar);
        $mur = $pricing->calculateQuote($bike, '2026-11-09', '2026-11-09', $murudeshwar, $murudeshwar);
        expect($hon['base_amount'])->toBe(400.00)
            ->and($mur['base_amount'])->toBe(550.00);
    }
    $weekend = $pricing->calculateQuote($bikes[0], '2026-11-14', '2026-11-14', $murudeshwar, $murudeshwar);
    expect($weekend['base_amount'])->toBe(550.00)
        ->and($weekend['pricing_adjustments_amount'])->toBe(100.00);
});

test('branch rate editing is restricted to superadmin and validates prices', function (): void {
    $store = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create(['name' => 'Scooter', 'base_daily_rate' => 400, 'default_deposit_amount' => 0]);
    $model = BikeModel::create([
        'category_id' => $category->id, 'brand' => 'Honda', 'name' => 'Dio DLX',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
    ]);
    $manager = User::create([
        'name' => 'Manager', 'email' => 'branchratesmanager@example.test', 'phone' => '9888809278',
        'password' => 'Password123!', 'role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE,
    ]);
    $endpoint = "/admin/bike-models/{$model->id}/branch-prices";
    $this->actingAs($manager)->post($endpoint, [
        'store_id' => $store->id, 'weekday_rate' => 350, 'weekend_rate' => 450,
    ])->assertForbidden();
    expect(BranchBikeModelPrice::count())->toBe(0);
});

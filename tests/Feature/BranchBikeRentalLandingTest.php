<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar Hub', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9000009751', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar Hub', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9000009752', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->activa = BikeModel::create([
        'category_id' => $this->category->id, 'brand' => 'Honda',
        'name' => 'Activa 6G', 'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
    ]);
    $this->jupiter = BikeModel::create([
        'category_id' => $this->category->id, 'brand' => 'TVS',
        'name' => 'Jupiter', 'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
    ]);
});

function branchLandingVehicle($test, Store $store, BikeModel $model, string $registration, BikeStatus $status = BikeStatus::AVAILABLE): Bike
{
    return Bike::create([
        'category_id' => $model->category_id, 'bike_model_id' => $model->id,
        'brand' => $model->brand, 'model_name' => $model->name,
        'registration_number' => $registration,
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'current_store_id' => $store->id, 'home_store_id' => $test->honnavar->id,
        'status' => $status,
    ]);
}

test('Honnavar landing shows only physically located models and relevant stock counts', function (): void {
    branchLandingVehicle($this, $this->honnavar, $this->activa, 'KA-47-LAND-01');
    branchLandingVehicle($this, $this->honnavar, $this->activa, 'KA-47-LAND-02', BikeStatus::MAINTENANCE);
    branchLandingVehicle($this, $this->murudeshwar, $this->jupiter, 'KA-47-LAND-03');
    $this->get('/bike-rentals/branches/'.$this->honnavar->id.'/honnavar')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Bikes/BranchLanding')
            ->where('branch.city', 'Honnavar')
            ->where('branch.canonical_path', '/bike-rentals/branches/'.$this->honnavar->id.'/honnavar')
            ->has('models', 1)
            ->where('models.0.id', $this->activa->id)
            ->where('models.0.physical_units', 2)
            ->where('models.0.physically_available_now', 1)
            ->where('models.0.slug', 'honda-activa-6g')
            ->has('otherBranches', 1)
            ->where('otherBranches.0.id', $this->murudeshwar->id)
        );
});

test('Murudeshwar landing shows its local inventory independently of the home store', function (): void {
    branchLandingVehicle($this, $this->murudeshwar, $this->activa, 'KA-47-LAND-04');
    $this->get('/bike-rentals/branches/'.$this->murudeshwar->id.'/murudeshwar')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('branch.city', 'Murudeshwar')
            ->has('models', 1)
            ->where('models.0.physical_units', 1));
});

test('missing and incorrect branch slugs redirect permanently to canonical URL', function (): void {
    $canonical = route('bike-rentals.branches.show', [
        'id' => $this->honnavar->id, 'slug' => 'honnavar',
    ]);
    $this->get('/bike-rentals/branches/'.$this->honnavar->id)
        ->assertStatus(301)->assertRedirect($canonical);
    $this->get('/bike-rentals/branches/'.$this->honnavar->id.'/other-place')
        ->assertStatus(301)->assertRedirect($canonical);
});

test('inactive branches are not indexed and cannot appear among other branches', function (): void {
    $this->murudeshwar->update(['status' => StoreStatus::INACTIVE]);
    $this->get('/bike-rentals/branches/'.$this->murudeshwar->id.'/murudeshwar')
        ->assertNotFound();
    $this->get('/bike-rentals/branches/'.$this->honnavar->id.'/honnavar')
        ->assertOk()->assertInertia(fn (Assert $page) => $page->has('otherBranches', 0));
});

test('unlinked legacy stock remains visible as a count without exposing registration numbers', function (): void {
    Bike::create([
        'category_id' => $this->category->id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-LAND-OLD',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'current_store_id' => $this->honnavar->id, 'home_store_id' => $this->honnavar->id,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->get('/bike-rentals/branches/'.$this->honnavar->id.'/honnavar')
        ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('unlinked_count', 1)
            ->has('models', 0));
});

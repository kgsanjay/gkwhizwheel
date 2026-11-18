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
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9000009731', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9000009732', 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->model = BikeModel::create([
        'category_id' => $category->id, 'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'description' => 'A comfortable automatic scooter for coastal travel.',
    ]);
    $this->bike = Bike::create([
        'bike_model_id' => $this->model->id, 'category_id' => $category->id,
        'brand' => 'Honda', 'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-PUBLIC-01',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'current_store_id' => $this->honnavar->id,
        'home_store_id' => $this->honnavar->id,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('public model page returns canonical metadata inputs and active branches', function (): void {
    $url = '/services/bikes/models/'.$this->model->id.'/honda-activa-6g';
    $this->get($url)->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Bikes/ModelShow')
            ->where('model.id', $this->model->id)
            ->where('model.brand', 'Honda')
            ->where('model.name', 'Activa 6G')
            ->where('model.total_units', 1)
            ->where('model.canonical_path', $url)
            ->has('stores', 2));
});

test('wrong model slug and missing slug permanently redirect to canonical URL', function (): void {
    $canonical = route('services.bikes.models.show', [
        'id' => $this->model->id, 'slug' => 'honda-activa-6g',
    ]);
    $this->get('/services/bikes/models/'.$this->model->id.'/wrong-name')
        ->assertStatus(301)->assertRedirect($canonical);
    $this->get('/services/bikes/models/'.$this->model->id)
        ->assertStatus(301)->assertRedirect($canonical);
});

test('inactive and empty catalog models are not publicly indexable', function (): void {
    $url = '/services/bikes/models/'.$this->model->id.'/honda-activa-6g';
    $this->model->update(['is_active' => false]);
    $this->get($url)->assertNotFound();
    $this->model->update(['is_active' => true]);
    $this->bike->forceDelete();
    $this->get($url)->assertNotFound();
});

test('model page uses only active pickup locations', function (): void {
    $this->murudeshwar->update(['status' => StoreStatus::INACTIVE]);
    $this->get('/services/bikes/models/'.$this->model->id.'/honda-activa-6g')
        ->assertOk()->assertInertia(fn (Assert $page) => $page->has('stores', 1)
            ->where('stores.0.id', $this->honnavar->id));
});

test('model page preserves pickup and return times and pickup points from query string', function (): void {
    $point = \App\Models\PickupPoint::create([
        'store_id' => $this->honnavar->id,
        'name' => 'Honnavar Bus Stand',
        'slug' => 'honnavar-bus-stand',
        'delivery_fee' => 50,
        'pickup_fee' => 50,
        'return_fee' => 50,
        'supports_pickup' => true,
        'supports_return' => true,
        'is_active' => true,
    ]);

    $query = http_build_query([
        'pickup_store_id' => $this->honnavar->id,
        'return_store_id' => $this->honnavar->id,
        'pickup_point_id' => $point->id,
        'return_point_id' => $point->id,
        'start_date' => '2026-11-18',
        'end_date' => '2026-11-19',
        'pickup_time' => '09:00',
        'return_time' => '08:00',
    ]);

    $this->get('/services/bikes/models/'.$this->model->id.'/honda-activa-6g?'.$query)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Bikes/ModelShow')
            ->where('initialFilters.pickup_time', '09:00')
            ->where('initialFilters.return_time', '08:00')
            ->where('initialFilters.pickup_point_id', (string) $point->id)
            ->where('initialFilters.return_point_id', (string) $point->id)
            ->where('stores.0.pickup_points.0.id', $point->id));
});

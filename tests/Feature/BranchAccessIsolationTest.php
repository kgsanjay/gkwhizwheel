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

function branchForIsolation(string $name, string $phone): Store {
    return Store::create(['name'=>$name,'address_line'=>'Main Road','city'=>$name,'state'=>'Karnataka','pincode'=>'581334','latitude'=>14.28,'longitude'=>74.45,'phone'=>$phone,'status'=>StoreStatus::ACTIVE]);
}
function managerForIsolation(string $email, string $phone): User {
    return User::create(['name'=>'Manager','email'=>$email,'phone'=>$phone,'password'=>'Password123!','role'=>UserRole::STORE_MANAGER,'status'=>UserStatus::ACTIVE]);
}

test('unassigned manager cannot access inventory or another branch dashboard', function (): void {
    $store = branchForIsolation('Honnavar','9999999901');
    $category = BikeCategory::create(['name'=>'Scooters','base_daily_rate'=>500,'default_deposit_amount'=>1000]);
    $bike = Bike::create(['category_id'=>$category->id,'home_store_id'=>$store->id,'current_store_id'=>$store->id,'brand'=>'Honda','model_name'=>'Activa','registration_number'=>'KA-47-AB-1234','fuel_type'=>FuelType::PETROL,'transmission'=>Transmission::AUTOMATIC,'status'=>BikeStatus::AVAILABLE,'odometer_reading'=>100]);
    $manager = managerForIsolation('unassigned@example.test','9999999902');
    expect($manager->can('view', $bike))->toBeFalse();
    expect($manager->can('update', $bike))->toBeFalse();
    expect($manager->can('delete', $bike))->toBeFalse();
    $this->actingAs($manager)->get('/admin/dashboard?store_id='.$store->id)->assertForbidden();
    $this->actingAs($manager)->get('/admin/bikes')->assertOk();
});

test('manager cannot select a dashboard store outside their assignment', function (): void {
    $assigned = branchForIsolation('Honnavar','9999999911');
    $other = branchForIsolation('Murudeshwar','9999999912');
    $manager = managerForIsolation('assigned@example.test','9999999913');
    $manager->stores()->attach($assigned->id);
    $this->actingAs($manager)->get('/admin/dashboard?store_id='.$other->id)->assertForbidden();
    $this->actingAs($manager)->get('/admin/dashboard')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')->has('stores',1));
});

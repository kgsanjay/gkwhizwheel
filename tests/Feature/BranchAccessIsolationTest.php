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

test('manager cannot register a new bike in an unassigned branch', function (): void {
    $assigned = branchForIsolation('Assigned Bike Hub', '9999999921');
    $foreign = branchForIsolation('Foreign Bike Hub', '9999999922');
    $category = BikeCategory::create(['name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 500]);
    $manager = managerForIsolation('bike.scope@example.test', '9999999923');
    $manager->stores()->attach($assigned->id);
    $details = [
        'category_id' => $category->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-SCOPE-001',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
        'home_store_id' => $assigned->id,
        'current_store_id' => $foreign->id,
    ];

    $this->actingAs($manager)->post('/admin/bikes', $details)
        ->assertSessionHasErrors('current_store_id');
    expect(Bike::where('registration_number', $details['registration_number'])->exists())->toBeFalse();

    $this->actingAs($manager)->post('/admin/bikes', [
        ...$details, 'home_store_id' => $foreign->id, 'current_store_id' => $assigned->id,
    ])->assertSessionHasErrors('home_store_id');

    $this->actingAs($manager)->post('/admin/bikes', [
        ...$details, 'current_store_id' => $assigned->id,
    ])->assertRedirect();
    expect(Bike::where('registration_number', $details['registration_number'])->exists())->toBeTrue();
});

test('manager cannot reassign an owned bike to an unauthorized branch', function (): void {
    $assigned = branchForIsolation('Owned Bike Hub', '9999999931');
    $foreign = branchForIsolation('Foreign Reassignment Hub', '9999999932');
    $category = BikeCategory::create(['name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 500]);
    $manager = managerForIsolation('bike.update@example.test', '9999999933');
    $manager->stores()->attach($assigned->id);
    $bike = Bike::create([
        'category_id' => $category->id, 'home_store_id' => $assigned->id,
        'current_store_id' => $assigned->id, 'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-SCOPE-002',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $this->actingAs($manager)->post("/admin/bikes/{$bike->id}", [
        'current_store_id' => $foreign->id,
    ])->assertSessionHasErrors('current_store_id');
    expect($bike->fresh()->current_store_id)->toBe($assigned->id);
});

test('staff inventory endpoint excludes foreign bikes and rejects forged branch filter', function (): void {
    $assigned = branchForIsolation('Staff Bike Hub', '9999999941');
    $foreign = branchForIsolation('Other Bike Hub', '9999999942');
    $category = BikeCategory::create(['name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 500]);
    $staff = User::create([
        'name' => 'Branch Staff', 'email' => 'bike.staff.scope@example.test',
        'phone' => '9999999943', 'password' => 'Password123!',
        'role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE,
    ]);
    $staff->stores()->attach($assigned->id);
    foreach ([$assigned, $foreign] as $store) {
        Bike::create([
            'category_id' => $category->id, 'home_store_id' => $store->id,
            'current_store_id' => $store->id, 'brand' => 'Honda', 'model_name' => 'Activa',
            'registration_number' => 'KA-47-SCOPE-'.$store->id,
            'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
            'status' => BikeStatus::AVAILABLE,
        ]);
    }

    \Laravel\Sanctum\Sanctum::actingAs($staff);
    $this->getJson('/api/v1/staff/bikes')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/staff/bikes?store_id='.$foreign->id)->assertForbidden();
});

test('home branch manager cannot edit or view bike physically assigned to another branch', function (): void {
    $home = branchForIsolation('Home Assignment Hub', '9999999951');
    $current = branchForIsolation('Current Assignment Hub', '9999999952');
    $category = BikeCategory::create(['name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 500]);
    $manager = managerForIsolation('home.only@example.test', '9999999953');
    $manager->stores()->attach($home->id);
    $bike = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $home->id, 'current_store_id' => $current->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA-47-SCOPE-003',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    expect($manager->can('view', $bike))->toBeFalse()
        ->and($manager->can('update', $bike))->toBeFalse()
        ->and($manager->can('delete', $bike))->toBeFalse();
    $this->actingAs($manager)->get("/admin/bikes/{$bike->id}/edit")->assertForbidden();
    $this->actingAs($manager)->get('/admin/bikes')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('bikes', 0));
});

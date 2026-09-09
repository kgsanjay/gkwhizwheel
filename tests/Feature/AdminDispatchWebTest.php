<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDispatchWebTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private User $manager;

    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Gokarna Main Hub',
            'address_line' => 'Beach Rd, Gokarna',
            'city' => 'Gokarna',
            'state' => 'Karnataka',
            'pincode' => '581326',
            'latitude' => 14.5479,
            'longitude' => 74.3188,
            'phone' => '+919876543210',
            'operating_hours' => ['monday' => ['09:00', '21:00']],
            'status' => \App\Enums\StoreStatus::ACTIVE,
        ]);

        $this->superAdmin = User::factory()->create([
            'role' => UserRole::SUPER_ADMIN,
        ]);

        $this->manager = User::factory()->create([
            'role' => UserRole::STORE_MANAGER,
        ]);
        $this->manager->stores()->attach($this->store->id);
    }

    public function test_guest_is_redirected_to_admin_login(): void
    {
        $response = $this->get(route('admin.dispatch.index'));
        $response->assertRedirect('/admin/login');
    }

    public function test_super_admin_can_view_dispatch_board_with_resources_and_events(): void
    {
        // Create bike
        $category = BikeCategory::create([
            'name' => 'Scooter 110cc',
            'base_daily_rate' => 500.00,
            'default_deposit_amount' => 1000.00,
        ]);

        $bike = Bike::create([
            'category_id' => $category->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-5555',
            'chassis_number' => 'CHAS1234555',
            'engine_number' => 'ENG1234555',
            'color' => 'White',
            'fuel_type' => \App\Enums\FuelType::PETROL,
            'transmission' => \App\Enums\Transmission::AUTOMATIC,
            'odometer_reading' => 1500,
            'current_store_id' => $this->store->id,
            'home_store_id' => $this->store->id,
            'status' => BikeStatus::AVAILABLE,
        ]);

        // Create booking
        $customer = User::factory()->create(['role' => UserRole::CUSTOMER]);
        $booking = Booking::create([
            'booking_reference' => 'WW-GOK-TEST',
            'user_id' => $customer->id,
            'bike_id' => $bike->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(2)->toDateString(),
            'base_amount' => 1500,
            'total_amount' => 1500,
            'deposit_amount' => 1000,
            'price_breakdown_json' => ['base_rate' => 500, 'total' => 1500],
            'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
            'channel' => 'online',
            'status' => BookingStatus::CONFIRMED,
        ]);

        // Create a service item and service booking
        $taxiItem = ServiceItem::create([
            'service_type' => 'taxi',
            'name' => 'Innova Crysta AC',
            'price_base' => 3500,
            'price_unit' => 'per_trip',
            'status' => 'available',
        ]);

        $serviceBooking = ServiceBooking::create([
            'booking_number' => 'GKW-TX-TEST-001',
            'service_type' => 'taxi',
            'service_item_id' => $taxiItem->id,
            'customer_name' => 'Anil Kumar',
            'customer_phone' => '9876543210',
            'start_datetime' => Carbon::today()->setTime(10, 0),
            'end_datetime' => Carbon::today()->setTime(18, 0),
            'total_amount' => 3500,
            'advance_paid' => 1000,
            'balance_due' => 2500,
            'payment_status' => 'partial',
            'status' => 'confirmed',
            'booking_channel' => 'walk_in',
        ]);

        $response = $this->actingAs($this->superAdmin)->get(route('admin.dispatch.index'));

        $response->assertOk();
        $response->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Dispatch/Index')
                ->has('resources')
                ->has('events')
                ->has('stats')
                ->has('current_window')
                ->where('current_window.view_mode', 'timeline')
                ->has('allowed_services', 7) // All 7 services visible to super admin
        );
    }

    public function test_manager_receives_scoped_services(): void
    {
        // Manager with only taxi and boating assigned via service_user table
        \Illuminate\Support\Facades\DB::table('service_user')->insert([
            ['user_id' => $this->manager->id, 'service_type' => 'taxi'],
            ['user_id' => $this->manager->id, 'service_type' => 'boating'],
        ]);

        $response = $this->actingAs($this->manager)->get(route('admin.dispatch.index'));

        $response->assertOk();
        $response->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Dispatch/Index')
                ->where('allowed_services', fn ($val) => $val->contains('taxi') && $val->contains('boating') && $val->count() === 2)
        );
    }

    public function test_month_view_mode_and_service_filtering(): void
    {
        $response = $this->actingAs($this->superAdmin)->get(route('admin.dispatch.index', [
            'view_mode' => 'month',
            'service_type' => 'taxi',
            'month' => Carbon::today()->format('Y-m'),
        ]));

        $response->assertOk();
        $response->assertInertia(
            fn (Assert $page) => $page
                ->component('Admin/Dispatch/Index')
                ->where('current_window.view_mode', 'month')
                ->where('filters.service_type', 'taxi')
        );
    }
}

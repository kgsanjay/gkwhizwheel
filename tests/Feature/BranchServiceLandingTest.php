<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\BranchBikeModelPrice;
use App\Models\PickupPoint;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BranchServiceLandingTest extends TestCase
{
    use RefreshDatabase;

    protected Store $honnavarStore;
    protected Store $murudeshwarStore;
    protected BikeModel $activaModel;
    protected PickupPoint $honnavarStationPoint;

    protected function setUp(): void
    {
        parent::setUp();

        $this->honnavarStore = Store::create([
            'name' => 'Honnavar Coastal Hub',
            'code' => 'HON-01',
            'slug' => 'honnavar',
            'address_line' => 'Palya Main Road, Honnavar',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2810,
            'longitude' => 74.4530,
            'phone' => '8660989586',
            'whatsapp' => '8660989586',
            'email' => 'honnavar@whizwheel.in',
            'operating_hours_label' => '7:30 AM - 9:30 PM',
            'status' => StoreStatus::ACTIVE,
            'services' => [
                'two_wheelers' => true,
                'taxi' => true,
                'homestay' => true,
                'boating' => true,
                'scuba' => false,
                'guide' => true,
            ],
        ]);

        $this->murudeshwarStore = Store::create([
            'name' => 'Murudeshwar Coastal Hub',
            'code' => 'MUR-01',
            'slug' => 'murudeshwar',
            'address_line' => 'Temple Road, Murudeshwar',
            'city' => 'Murudeshwar',
            'state' => 'Karnataka',
            'pincode' => '581350',
            'latitude' => 14.0940,
            'longitude' => 74.4899,
            'phone' => '8660989587',
            'whatsapp' => '8660989587',
            'email' => 'murudeshwar@whizwheel.in',
            'operating_hours_label' => '8:00 AM - 9:00 PM',
            'status' => StoreStatus::ACTIVE,
            'services' => [
                'two_wheelers' => true,
                'taxi' => true,
                'homestay' => true,
                'boating' => false,
                'scuba' => true,
                'guide' => true,
            ],
        ]);

        $this->honnavarStationPoint = PickupPoint::create([
            'store_id' => $this->honnavarStore->id,
            'name' => 'Honnavar Railway Station (HNA)',
            'slug' => 'honnavar-railway-station',
            'address_line' => 'Station Platform Road, Honnavar',
            'landmark' => 'Platform 1 Exit',
            'latitude' => 14.2850,
            'longitude' => 74.4550,
            'delivery_fee' => 150.00,
            'pickup_fee' => 0.00,
            'return_fee' => 150.00,
            'supports_pickup' => true,
            'supports_return' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $category = BikeCategory::create([
            'name' => 'Scooter',
            'slug' => 'scooter',
            'description' => 'Automatic city & coastal scooters',
            'base_hourly_rate' => 50.00,
            'base_daily_rate' => 450.00,
            'default_deposit_amount' => 1000.00,
            'is_active' => true,
        ]);

        $this->activaModel = BikeModel::create([
            'category_id' => $category->id,
            'brand' => 'Honda',
            'name' => 'Activa 6G',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'is_active' => true,
        ]);

        BranchBikeModelPrice::create([
            'store_id' => $this->honnavarStore->id,
            'bike_model_id' => $this->activaModel->id,
            'weekday_rate' => 450.00,
            'weekend_rate' => 550.00,
            'peak_rate' => 650.00,
            'hourly_rate' => 55.00,
            'excess_hourly_rate' => 60.00,
            'deposit_amount' => 0.00,
        ]);

        Bike::create([
            'home_store_id' => $this->honnavarStore->id,
            'current_store_id' => $this->honnavarStore->id,
            'category_id' => $category->id,
            'bike_model_id' => $this->activaModel->id,
            'registration_number' => 'KA-47-EA-1001',
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'status' => BikeStatus::AVAILABLE,
            'hourly_rate' => 55.00,
            'daily_rate' => 450.00,
        ]);

        ServiceItem::create([
            'store_id' => $this->murudeshwarStore->id,
            'name' => 'Netrani Island Guided Coral Reef Scuba Diving',
            'category' => 'Scuba Diving',
            'service_type' => 'scuba',
            'price_base' => 3800.00,
            'price_unit' => 'per person',
            'description' => 'PADI certified dive master, full scuba kit, underwater 4K video, boat ride.',
            'status' => 'available',
            'sort_order' => 1,
        ]);
    }

    public function test_home_page_renders_with_dynamic_brand_directory_and_fleet_props(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Welcome')
            ->has('stores', 2)
            ->where('stores.0.services.boating', true)
            ->where('stores.0.services.scuba', false)
            ->where('stores.1.services.boating', false)
            ->where('stores.1.services.scuba', true)
            ->has('pickupPoints')
            ->has('featuredBikeModels')
            ->has('serviceCategories')
            ->has('liveStats')
            ->has('reviews')
        );
    }

    public function test_branch_service_landing_renders_bikes_for_honnavar(): void
    {
        $response = $this->get('/honnavar/services/bikes');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Services/BranchServiceLanding')
            ->where('branch.slug', 'honnavar')
            ->where('service.slug', 'bikes')
            ->has('inventory', 1)
            ->where('inventory.0.name', 'Activa 6G')
            ->where('inventory.0.weekday_rate', 450)
            ->where('inventory.0.weekend_rate', 550)
            ->has('pickupPoints', 1)
            ->where('pickupPoints.0.name', 'Honnavar Railway Station (HNA)')
            ->where('pickupPoints.0.delivery_fee', 150)
            ->has('seo')
        );
    }

    public function test_branch_service_landing_renders_scuba_for_murudeshwar(): void
    {
        $response = $this->get('/murudeshwar/services/scuba');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Services/BranchServiceLanding')
            ->where('branch.slug', 'murudeshwar')
            ->where('service.slug', 'scuba')
            ->has('inventory', 1)
            ->where('inventory.0.name', 'Netrani Island Guided Coral Reef Scuba Diving')
            ->where('inventory.0.price_base', 3800)
        );
    }

    public function test_branch_alias_redirects_to_canonical(): void
    {
        $responseHonnavara = $this->get('/honnavara/services/bikes');
        $responseHonnavara->assertRedirect('/honnavar/services/bikes');
        $responseHonnavara->assertStatus(301);

        $responseMurudeshwara = $this->get('/murudeshwara/services/bikes');
        $responseMurudeshwara->assertRedirect('/murudeshwar/services/bikes');
        $responseMurudeshwara->assertStatus(301);
    }

    public function test_invalid_branch_or_service_returns_404(): void
    {
        $this->get('/unknown-city/services/bikes')->assertNotFound();
        $this->get('/honnavar/services/nonexistent-service')->assertNotFound();
    }

    public function test_confirmed_bike_booking_locks_bike_and_decrements_remaining_inventory_until_admin_marks_available(): void
    {
        $secondBike = Bike::create([
            'home_store_id' => $this->honnavarStore->id,
            'current_store_id' => $this->honnavarStore->id,
            'category_id' => $this->activaModel->category_id,
            'bike_model_id' => $this->activaModel->id,
            'registration_number' => 'KA-47-EA-1002',
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'status' => BikeStatus::AVAILABLE,
        ]);

        // Initially 2 of 2 units available
        $this->get('/honnavar/services/bikes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('inventory.0.physical_units', 2)
                ->where('inventory.0.available_now', 2)
                ->where('inventory.0.booked_units', 0)
            );

        $customer = \App\Models\User::factory()->create([
            'role' => \App\Enums\UserRole::CUSTOMER,
            'status' => \App\Enums\UserStatus::ACTIVE,
        ]);

        $bookedBike = Bike::where('registration_number', 'KA-47-EA-1001')->firstOrFail();

        $booking = \App\Models\Booking::create([
            'booking_reference' => 'BK-INV-LOCK-01',
            'bike_id' => $bookedBike->id,
            'bike_model_id' => $this->activaModel->id,
            'user_id' => $customer->id,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'channel' => \App\Enums\BookingChannel::ONLINE,
            'status' => \App\Enums\BookingStatus::PENDING_PAYMENT,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'base_amount' => 450.00,
            'deposit_amount' => 0.00,
            'total_amount' => 531.00,
            'price_breakdown_json' => ['checkout_payment_option' => 'advance'],
            'idempotency_key' => 'inv-lock-001',
        ]);

        // Confirming payment locks the physical bike out of rentable inventory
        app(\App\Services\BookingService::class)->confirmPayment($booking, 'pay_inv_001');

        $this->assertSame(BikeStatus::ON_RENT, $bookedBike->fresh()->status);

        // Landing page now shows 1 of 2 remaining available
        $this->get('/honnavar/services/bikes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('inventory.0.physical_units', 2)
                ->where('inventory.0.available_now', 1)
                ->where('inventory.0.booked_units', 1)
            );

        // That locked bike cannot be booked for future dates until admin updates its status
        $this->expectException(\App\Exceptions\BikeNotAvailableException::class);
        try {
            app(\App\Services\AvailabilityService::class)->holdBooking([
                'bike_id' => $bookedBike->id,
                'bike_model_id' => $this->activaModel->id,
                'user_id' => $customer->id,
                'pickup_store_id' => $this->honnavarStore->id,
                'return_store_id' => $this->honnavarStore->id,
                'start_date' => now()->addDays(10)->toDateString(),
                'end_date' => now()->addDays(11)->toDateString(),
                'channel' => \App\Enums\BookingChannel::ONLINE,
                'idempotency_key' => 'inv-lock-future-attempt',
            ]);
        } finally {
            // Once admin explicitly marks the bike available again, inventory count restores
            $admin = \App\Models\User::factory()->create([
                'role' => \App\Enums\UserRole::SUPER_ADMIN,
                'status' => \App\Enums\UserStatus::ACTIVE,
            ]);

            $this->actingAs($admin, 'admin')
                ->put("/admin/bikes/{$bookedBike->id}", ['status' => BikeStatus::AVAILABLE->value])
                ->assertRedirect(route('admin.bikes.index'));

            $this->assertSame(BikeStatus::AVAILABLE, $bookedBike->fresh()->status);

            $this->get('/honnavar/services/bikes')
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('inventory.0.physical_units', 2)
                    ->where('inventory.0.available_now', 2)
                    ->where('inventory.0.booked_units', 0)
                );

            $this->assertNotNull($secondBike->id);
        }
    }
}

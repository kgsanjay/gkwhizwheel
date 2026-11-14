<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\DiscountType;
use App\Enums\FuelType;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\NotificationLog;
use App\Models\PickupPoint;
use App\Models\PricingRule;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BranchAdminOperationalTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $honnavarAdmin;
    protected User $murudeshwarAdmin;
    protected User $honnavarManager;
    protected User $customer;
    protected Store $honnavarStore;
    protected Store $murudeshwarStore;
    protected BikeCategory $category;
    protected Bike $honnavarBike;
    protected Bike $murudeshwarBike;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->superAdmin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@gkwhizwheel.com',
            'phone' => '+919999900010',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => 'SECRET',
            'two_factor_confirmed_at' => now(),
        ]);

        $this->honnavarStore = Store::create([
            'name' => 'Honnavar Coastal Hub',
            'code' => 'HON-01',
            'address_line' => 'Port Road, Honnavar',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2810,
            'longitude' => 74.4530,
            'phone' => '+918660989586',
            'status' => StoreStatus::ACTIVE,
            'services' => ['two_wheelers', 'taxi', 'boating'],
        ]);

        $this->murudeshwarStore = Store::create([
            'name' => 'Murudeshwar Temple Hub',
            'code' => 'MUR-01',
            'address_line' => 'Temple Road, Murudeshwar',
            'city' => 'Murudeshwar',
            'state' => 'Karnataka',
            'pincode' => '581350',
            'latitude' => 14.0940,
            'longitude' => 74.4890,
            'phone' => '+918660989587',
            'status' => StoreStatus::ACTIVE,
            'services' => ['two_wheelers', 'scuba'],
        ]);

        $this->honnavarAdmin = User::create([
            'name' => 'Honnavar Branch Admin',
            'email' => 'honnavar.admin@gkwhizwheel.com',
            'phone' => '+919999900011',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::STORE_MANAGER,
            'status' => UserStatus::ACTIVE,
        ]);
        $this->honnavarAdmin->stores()->attach($this->honnavarStore->id);

        $this->murudeshwarAdmin = User::create([
            'name' => 'Murudeshwar Branch Admin',
            'email' => 'muru.admin@gkwhizwheel.com',
            'phone' => '+919999900012',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::STORE_MANAGER,
            'status' => UserStatus::ACTIVE,
        ]);
        $this->murudeshwarAdmin->stores()->attach($this->murudeshwarStore->id);

        $this->honnavarManager = User::create([
            'name' => 'Honnavar Ground Manager',
            'email' => 'honnavar.mgr@gkwhizwheel.com',
            'phone' => '+919999900013',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::STAFF,
            'status' => UserStatus::ACTIVE,
        ]);
        $this->honnavarManager->stores()->attach($this->honnavarStore->id);

        $this->customer = User::create([
            'name' => 'Customer Traveller',
            'email' => 'traveller@example.com',
            'phone' => '+919999900014',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->category = BikeCategory::create([
            'name' => 'Cruiser Fleet',
            'base_daily_rate' => 500,
            'default_deposit_amount' => 1000,
        ]);

        $this->honnavarBike = Bike::create([
            'category_id' => $this->category->id,
            'brand' => 'Royal Enfield',
            'model_name' => 'Hunter 350',
            'registration_number' => 'KA-47-HN-1001',
            'home_store_id' => $this->honnavarStore->id,
            'current_store_id' => $this->honnavarStore->id,
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::MANUAL,
            'status' => BikeStatus::AVAILABLE,
            'odometer_reading' => 1200,
            'base_daily_rate_override' => 500,
            'weekend_daily_rate_override' => 600,
        ]);

        $this->murudeshwarBike = Bike::create([
            'category_id' => $this->category->id,
            'brand' => 'Royal Enfield',
            'model_name' => 'Classic 350',
            'registration_number' => 'KA-47-MR-2002',
            'home_store_id' => $this->murudeshwarStore->id,
            'current_store_id' => $this->murudeshwarStore->id,
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::MANUAL,
            'status' => BikeStatus::AVAILABLE,
            'odometer_reading' => 2400,
            'base_daily_rate_override' => 600,
            'weekend_daily_rate_override' => 700,
        ]);
    }

    public function test_branch_admin_can_create_and_edit_manager_for_assigned_branch(): void
    {
        $response = $this->actingAs($this->honnavarAdmin)->post('/admin/staff', [
            'name' => 'New Honnavar Manager',
            'email' => 'new.honnavar.mgr@whizwheels.in',
            'phone' => '+919876543299',
            'password' => 'Password123!',
            'role' => UserRole::STAFF->value,
            'store_ids' => [$this->honnavarStore->id],
        ]);

        $response->assertRedirect(route('admin.staff.index'));
        $this->assertDatabaseHas('users', [
            'email' => 'new.honnavar.mgr@whizwheels.in',
            'role' => UserRole::STAFF->value,
        ]);

        $newManager = User::where('email', 'new.honnavar.mgr@whizwheels.in')->firstOrFail();

        $editResponse = $this->actingAs($this->honnavarAdmin)->put("/admin/staff/{$newManager->id}", [
            'name' => 'Lead Honnavar Manager',
            'email' => 'new.honnavar.mgr@whizwheels.in',
            'phone' => '+919876543299',
            'role' => UserRole::STAFF->value,
            'store_ids' => [$this->honnavarStore->id],
        ]);

        $editResponse->assertRedirect(route('admin.staff.index'));
        $this->assertDatabaseHas('users', [
            'id' => $newManager->id,
            'name' => 'Lead Honnavar Manager',
        ]);
    }

    public function test_branch_admin_cannot_create_superadmin_admin_or_assign_manager_to_unowned_branch(): void
    {
        // Try creating superadmin
        $this->actingAs($this->honnavarAdmin)->post('/admin/staff', [
            'name' => 'Malicious SuperAdmin',
            'email' => 'malicious.sa@whizwheels.in',
            'phone' => '+919876543201',
            'password' => 'Password123!',
            'role' => UserRole::SUPER_ADMIN->value,
            'store_ids' => [$this->honnavarStore->id],
        ])->assertForbidden();

        // Try creating admin
        $this->actingAs($this->honnavarAdmin)->post('/admin/staff', [
            'name' => 'Malicious Admin',
            'email' => 'malicious.adm@whizwheels.in',
            'phone' => '+919876543202',
            'password' => 'Password123!',
            'role' => UserRole::STORE_MANAGER->value,
            'store_ids' => [$this->honnavarStore->id],
        ])->assertForbidden();

        // Try assigning manager to Murudeshwar store
        $this->actingAs($this->honnavarAdmin)->post('/admin/staff', [
            'name' => 'Cross Branch Staff',
            'email' => 'cross.staff@whizwheels.in',
            'phone' => '+919876543203',
            'password' => 'Password123!',
            'role' => UserRole::STAFF->value,
            'store_ids' => [$this->murudeshwarStore->id],
        ])->assertForbidden();

        // Try editing SuperAdmin
        $this->actingAs($this->honnavarAdmin)->put("/admin/staff/{$this->superAdmin->id}", [
            'name' => 'Hacked SA',
            'email' => $this->superAdmin->email,
            'phone' => $this->superAdmin->phone,
            'role' => UserRole::STAFF->value,
            'store_ids' => [$this->honnavarStore->id],
        ])->assertForbidden();

        // Try editing Murudeshwar Admin
        $this->actingAs($this->honnavarAdmin)->put("/admin/staff/{$this->murudeshwarAdmin->id}", [
            'name' => 'Hacked Muru Admin',
            'email' => $this->murudeshwarAdmin->email,
            'phone' => $this->murudeshwarAdmin->phone,
            'role' => UserRole::STAFF->value,
            'store_ids' => [$this->honnavarStore->id],
        ])->assertForbidden();
    }

    public function test_branch_admin_can_update_own_branch_details_and_manage_pickup_points(): void
    {
        $updateResponse = $this->actingAs($this->honnavarAdmin)->put("/admin/stores/{$this->honnavarStore->id}", [
            'name' => 'Honnavar Coastal Hub',
            'address_line' => 'Updated Port Road 500',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2815,
            'longitude' => 74.4535,
            'phone' => '+918660989586',
            'whatsapp' => '+918660989586',
            'email' => 'honnavar@whizwheels.in',
            'operating_hours_label' => '7:00 AM - 10:00 PM',
        ]);

        $updateResponse->assertRedirect(route('admin.stores.index'));
        $this->assertDatabaseHas('stores', [
            'id' => $this->honnavarStore->id,
            'email' => 'honnavar@whizwheels.in',
            'operating_hours_label' => '7:00 AM - 10:00 PM',
        ]);

        // Create Pickup Point in Honnavar
        $ppResponse = $this->actingAs($this->honnavarAdmin)->post('/admin/pickup-points', [
            'store_id' => $this->honnavarStore->id,
            'name' => 'Honnavar Railway Junction',
            'address_line' => 'Railway Station Road',
            'delivery_fee' => 50,
            'pickup_fee' => 30,
            'return_fee' => 30,
            'supports_pickup' => true,
            'supports_return' => true,
        ]);

        $ppResponse->assertRedirect(route('admin.pickup-points.index'));
        $this->assertDatabaseHas('pickup_points', [
            'store_id' => $this->honnavarStore->id,
            'name' => 'Honnavar Railway Junction',
        ]);
    }

    public function test_branch_admin_forbidden_from_matrix_toggle_store_creation_and_cross_branch_modifications(): void
    {
        // Branch Admin cannot toggle branch-service matrix
        $this->actingAs($this->honnavarAdmin)->post("/admin/stores/{$this->honnavarStore->id}/services", [
            'services' => ['two_wheelers', 'taxi', 'boating', 'scuba'],
        ])->assertForbidden();

        // Branch Admin cannot create a new store hub
        $this->actingAs($this->honnavarAdmin)->post('/admin/stores', [
            'name' => 'Gokarna Hub',
            'address_line' => 'Om Beach Road',
            'city' => 'Gokarna',
            'state' => 'Karnataka',
            'pincode' => '581326',
            'latitude' => 14.54,
            'longitude' => 74.31,
            'phone' => '+918660989599',
            'status' => StoreStatus::ACTIVE->value,
        ])->assertForbidden();

        // Branch Admin cannot update another branch (Murudeshwar)
        $this->actingAs($this->honnavarAdmin)->put("/admin/stores/{$this->murudeshwarStore->id}", [
            'name' => 'Murudeshwar Hub Altered',
            'address_line' => 'Temple Road',
            'city' => 'Murudeshwar',
            'state' => 'Karnataka',
            'pincode' => '581350',
            'latitude' => 14.09,
            'longitude' => 74.48,
            'phone' => '+918660989587',
        ])->assertForbidden();

        // Branch Admin cannot create pickup point in Murudeshwar
        $this->actingAs($this->honnavarAdmin)->post('/admin/pickup-points', [
            'store_id' => $this->murudeshwarStore->id,
            'name' => 'Murudeshwar Temple Gate',
            'supports_pickup' => true,
            'supports_return' => true,
        ])->assertForbidden();
    }

    public function test_branch_admin_can_bulk_price_own_bikes_but_forbidden_on_cross_branch_bikes(): void
    {
        // Valid bulk pricing on Honnavar bike
        $response = $this->actingAs($this->honnavarAdmin)->post('/admin/bikes/bulk-pricing', [
            'bike_ids' => [$this->honnavarBike->id],
            'type' => 'percent_hike',
            'apply_to' => 'both',
            'weekday_amount' => 10,
            'weekend_amount' => 10,
        ]);

        $response->assertRedirect();
        $this->honnavarBike->refresh();
        $this->assertEquals(550.00, (float) $this->honnavarBike->base_daily_rate_override);

        // Forbidden bulk pricing on Murudeshwar bike
        $this->actingAs($this->honnavarAdmin)->post('/admin/bikes/bulk-pricing', [
            'bike_ids' => [$this->murudeshwarBike->id],
            'type' => 'percent_hike',
            'apply_to' => 'both',
            'weekday_amount' => 10,
            'weekend_amount' => 10,
        ])->assertForbidden();
    }

    public function test_branch_admin_can_manage_branch_pricing_rules_and_coupons_but_forbidden_on_global_or_cross_branch(): void
    {
        // Branch Admin creates Honnavar Pricing Rule
        $prResponse = $this->actingAs($this->honnavarAdmin)->post('/admin/pricing', [
            'name' => 'Honnavar Weekend Surge',
            'store_id' => $this->honnavarStore->id,
            'rule_type' => PricingRuleType::WEEKEND->value,
            'day_of_week' => 6,
            'rate_type' => PricingRateType::PERCENTAGE->value,
            'value' => 20,
            'is_active' => true,
        ]);

        $prResponse->assertRedirect(route('admin.pricing.index'));
        $this->assertDatabaseHas('pricing_rules', [
            'name' => 'Honnavar Weekend Surge',
            'store_id' => $this->honnavarStore->id,
        ]);

        // Branch Admin forbidden on global pricing rule (store_id = null)
        $this->actingAs($this->honnavarAdmin)->post('/admin/pricing', [
            'name' => 'Global Surge Rule',
            'store_id' => null,
            'rule_type' => PricingRuleType::WEEKEND->value,
            'day_of_week' => 6,
            'rate_type' => PricingRateType::PERCENTAGE->value,
            'value' => 20,
        ])->assertForbidden();

        // Branch Admin forbidden on Murudeshwar pricing rule
        $this->actingAs($this->honnavarAdmin)->post('/admin/pricing', [
            'name' => 'Cross Branch Rule',
            'store_id' => $this->murudeshwarStore->id,
            'rule_type' => PricingRuleType::WEEKEND->value,
            'day_of_week' => 6,
            'rate_type' => PricingRateType::PERCENTAGE->value,
            'value' => 20,
        ])->assertForbidden();

        // Branch Admin creates Honnavar Coupon
        $cpResponse = $this->actingAs($this->honnavarAdmin)->post('/admin/coupons', [
            'code' => 'HONNAVAR15',
            'store_id' => $this->honnavarStore->id,
            'discount_type' => DiscountType::PERCENTAGE->value,
            'value' => 15,
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
            'is_active' => true,
        ]);

        $cpResponse->assertRedirect(route('admin.coupons.index'));
        $this->assertDatabaseHas('coupons', [
            'code' => 'HONNAVAR15',
            'store_id' => $this->honnavarStore->id,
        ]);

        // Branch Admin forbidden on global coupon (store_id = null)
        $this->actingAs($this->honnavarAdmin)->post('/admin/coupons', [
            'code' => 'GLOBAL15',
            'store_id' => null,
            'discount_type' => DiscountType::PERCENTAGE->value,
            'value' => 15,
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
        ])->assertForbidden();

        // Branch Admin forbidden on Murudeshwar coupon
        $this->actingAs($this->honnavarAdmin)->post('/admin/coupons', [
            'code' => 'MURU15',
            'store_id' => $this->murudeshwarStore->id,
            'discount_type' => DiscountType::PERCENTAGE->value,
            'value' => 15,
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addDays(30)->toDateString(),
        ])->assertForbidden();
    }

    public function test_branch_admin_can_view_logs_and_resend_alerts_for_own_branch_only(): void
    {
        $honnavarBooking = Booking::create([
            'user_id' => $this->customer->id,
            'bike_id' => $this->honnavarBike->id,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'booking_reference' => 'BK-HON-001',
            'channel' => BookingChannel::ONLINE,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(2),
            'total_days' => 1,
            'daily_rate' => 500,
            'base_amount' => 500,
            'subtotal' => 500,
            'deposit_amount' => 1000,
            'total_amount' => 1500,
            'price_breakdown_json' => [],
            'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
            'status' => BookingStatus::CONFIRMED,
        ]);

        $murudeshwarBooking = Booking::create([
            'user_id' => $this->customer->id,
            'bike_id' => $this->murudeshwarBike->id,
            'pickup_store_id' => $this->murudeshwarStore->id,
            'return_store_id' => $this->murudeshwarStore->id,
            'booking_reference' => 'BK-MUR-002',
            'channel' => BookingChannel::ONLINE,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(2),
            'total_days' => 1,
            'daily_rate' => 600,
            'base_amount' => 600,
            'subtotal' => 600,
            'deposit_amount' => 1000,
            'total_amount' => 1600,
            'price_breakdown_json' => [],
            'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
            'status' => BookingStatus::CONFIRMED,
        ]);

        $honnavarLog = NotificationLog::create([
            'user_id' => $this->customer->id,
            'booking_id' => $honnavarBooking->id,
            'channel' => NotificationChannel::WHATSAPP,
            'recipient' => '+919999900014',
            'template' => 'booking_confirmation',
            'status' => NotificationStatus::DELIVERED,
            'sent_at' => now(),
        ]);

        $murudeshwarLog = NotificationLog::create([
            'user_id' => $this->customer->id,
            'booking_id' => $murudeshwarBooking->id,
            'channel' => NotificationChannel::WHATSAPP,
            'recipient' => '+919999900014',
            'template' => 'booking_confirmation',
            'status' => NotificationStatus::DELIVERED,
            'sent_at' => now(),
        ]);

        // Branch admin can access /admin/logs
        $this->actingAs($this->honnavarAdmin)->get('/admin/logs')->assertOk();

        // Branch admin can resend notification for Honnavar booking
        $this->actingAs($this->honnavarAdmin)
            ->post("/admin/logs/notifications/{$honnavarLog->id}/resend")
            ->assertRedirect();

        // Branch admin receives 403 trying to resend notification for Murudeshwar booking
        $this->actingAs($this->honnavarAdmin)
            ->post("/admin/logs/notifications/{$murudeshwarLog->id}/resend")
            ->assertForbidden();
    }

    public function test_superadmin_receives_branch_comparison_matrix_on_dashboard(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/admin/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->has('branch_comparison', 2)
            ->where('branch_comparison.0.store_name', $this->honnavarStore->name)
            ->where('branch_comparison.1.store_name', $this->murudeshwarStore->name)
        );
    }
}

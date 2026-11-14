<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\NotificationLog;
use App\Models\SiteSetting;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SuperAdminOperationalPerfectionTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $manager;
    protected User $customer;
    protected Store $store;
    protected BikeCategory $category;
    protected Bike $bike;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'phone' => '+919999900001',
            'password' => bcrypt('password12345'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => 'SECRET',
            'two_factor_confirmed_at' => now(),
        ]);

        $this->manager = User::create([
            'name' => 'Store Manager',
            'email' => 'manager@example.com',
            'phone' => '+919999900002',
            'password' => bcrypt('password12345'),
            'role' => UserRole::STORE_MANAGER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer@example.com',
            'phone' => '+919999900003',
            'password' => bcrypt('password12345'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->store = Store::create([
            'name' => 'Honnavar Coastal Hub',
            'code' => 'HON-01',
            'address_line' => 'Main Road, Port',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2811,
            'longitude' => 74.4534,
            'phone' => '8660989586',
            'is_active' => true,
        ]);

        $this->manager->stores()->attach($this->store->id);

        $this->category = BikeCategory::create([
            'name' => 'Standard Scooter',
            'base_daily_rate' => 500.00,
            'default_deposit_amount' => 0.00,
        ]);

        $this->bike = Bike::create([
            'category_id' => $this->category->id,
            'home_store_id' => $this->store->id,
            'current_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-1234',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'status' => BikeStatus::AVAILABLE,
            'odometer_reading' => 5000,
        ]);
    }

    public function test_superadmin_can_update_global_brand_settings(): void
    {
        $payload = [
            'brand_name' => 'G.K. WhizWheel Premium',
            'primary_phone' => '+918660989586',
            'whatsapp_number' => '918660989586',
            'support_email' => 'contact@whizwheels.in',
            'operating_hours_label' => 'Open 24/7 Coastline',
            'tagline' => 'Premier Coastal Rides & Tours',
            'explore_label' => 'Explore Stays & Rides',
            'locations_summary' => 'Honnavar & Murudeshwar',
            'google_rating_score' => '5.0',
            'google_reviews_count' => '350+',
            'google_rating_label' => '5.0 Google Rated (350+)',
            'google_maps_reviews_url' => 'https://maps.app.goo.gl/y94Ap38BbZGWGSDdA',
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post('/admin/settings', $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        expect(SiteSetting::get('brand_name'))->toBe('G.K. WhizWheel Premium')
            ->and(SiteSetting::get('tagline'))->toBe('Premier Coastal Rides & Tours')
            ->and(SiteSetting::get('google_reviews_count'))->toBe('350+');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'site_settings.updated',
            'user_id' => $this->superAdmin->id,
        ]);
    }

    public function test_superadmin_can_trigger_system_maintenance_actions(): void
    {
        foreach (['release_holds', 'audit_compliance', 'flush_cache'] as $action) {
            $response = $this->actingAs($this->superAdmin)
                ->post('/admin/settings/maintenance', ['action' => $action]);

            $response->assertRedirect();
            $response->assertSessionHas('success');

            $this->assertDatabaseHas('activity_logs', [
                'action' => 'system_maintenance.'.$action,
                'user_id' => $this->superAdmin->id,
            ]);
        }
    }

    public function test_manager_cannot_trigger_maintenance_actions(): void
    {
        $response = $this->actingAs($this->manager)
            ->post('/admin/settings/maintenance', ['action' => 'flush_cache']);

        $response->assertForbidden();
    }

    public function test_superadmin_can_view_system_logs_page_and_resend_alerts(): void
    {
        $booking = Booking::create([
            'booking_reference' => 'BK-ALERT-TEST-01',
            'bike_id' => $this->bike->id,
            'user_id' => $this->customer->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'channel' => BookingChannel::ONLINE,
            'status' => BookingStatus::CONFIRMED,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'base_amount' => 1000.00,
            'deposit_amount' => 0.00,
            'total_amount' => 1000.00,
            'price_breakdown_json' => [],
            'idempotency_key' => (string) Str::uuid(),
        ]);

        $log = NotificationLog::create([
            'user_id' => $this->customer->id,
            'booking_id' => $booking->id,
            'channel' => NotificationChannel::WHATSAPP,
            'template' => 'booking_confirmation',
            'status' => NotificationStatus::DELIVERED,
            'sent_at' => now(),
        ]);

        $viewResponse = $this->actingAs($this->superAdmin)
            ->get('/admin/logs?tab=notifications');

        $viewResponse->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Logs/Index')
                ->has('notifications.data')
                ->where('activeTab', 'notifications')
            );

        $activityResponse = $this->actingAs($this->superAdmin)
            ->get('/admin/logs?tab=activity');

        $activityResponse->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Logs/Index')
                ->has('activities.data')
                ->where('activeTab', 'activity')
            );

        $resendResponse = $this->actingAs($this->superAdmin)
            ->post("/admin/logs/notifications/{$log->id}/resend");

        $resendResponse->assertRedirect();
        $resendResponse->assertSessionHas('success');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'notification.resend',
            'user_id' => $this->superAdmin->id,
        ]);
    }

    public function test_superadmin_can_override_bike_compliance_handover_with_mandatory_reason(): void
    {
        // Add expired insurance document to bike to trigger compliance block
        BikeDocument::create([
            'bike_id' => $this->bike->id,
            'document_type' => BikeDocumentType::INSURANCE,
            'document_number' => 'INS-EXPIRED-999',
            'issue_date' => now()->subYears(2),
            'expiry_date' => now()->subDays(10), // Expired!
            'file_path' => 'documents/bikes/insurance.pdf',
            'verified' => true,
        ]);

        $booking = Booking::create([
            'booking_reference' => 'BK-HANDOVER-OVERRIDE',
            'bike_id' => $this->bike->id,
            'user_id' => $this->customer->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'channel' => BookingChannel::ONLINE,
            'status' => BookingStatus::CONFIRMED,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'base_amount' => 1000.00,
            'deposit_amount' => 0.00,
            'total_amount' => 1000.00,
            'price_breakdown_json' => [],
            'idempotency_key' => (string) Str::uuid(),
        ]);

        // 1. Manager attempts handover without override -> must fail with compliance issue
        $this->actingAs($this->manager)
            ->post("/admin/bookings/{$booking->id}/handover", [
                'odometer_reading' => 5050,
            ])
            ->assertSessionHasErrors(['bike']);

        // 2. Manager attempts handover WITH override -> must receive 403 Forbidden
        $this->actingAs($this->manager)
            ->post("/admin/bookings/{$booking->id}/handover", [
                'odometer_reading' => 5050,
                'compliance_override' => true,
                'override_reason' => 'Emergency release',
            ])
            ->assertForbidden();

        // 3. SuperAdmin attempts override without reason -> must fail validation
        $this->actingAs($this->superAdmin)
            ->post("/admin/bookings/{$booking->id}/handover", [
                'odometer_reading' => 5050,
                'compliance_override' => true,
                'override_reason' => '',
            ])
            ->assertSessionHasErrors(['override_reason']);

        // 4. SuperAdmin passes explicit compliance_override and reason -> succeeds
        $successResponse = $this->actingAs($this->superAdmin)
            ->post("/admin/bookings/{$booking->id}/handover", [
                'odometer_reading' => 5050,
                'compliance_override' => true,
                'override_reason' => 'Emergency customer roadside assistance authorization',
            ]);

        $successResponse->assertRedirect();
        $this->assertEquals(BookingStatus::HANDED_OVER, $booking->fresh()->status);
        $this->assertEquals(BikeStatus::ON_RENT, $this->bike->fresh()->status);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'handover.compliance_override',
            'user_id' => $this->superAdmin->id,
            'subject_id' => $booking->id,
        ]);
    }
}


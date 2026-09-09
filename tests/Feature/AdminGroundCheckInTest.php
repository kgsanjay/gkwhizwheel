<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminGroundCheckInTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $staff;
    protected User $customer;
    protected Store $store;
    protected BikeCategory $category;
    protected Bike $bike;
    protected ServiceItem $serviceItem;
    protected ServiceBooking $serviceBooking;
    protected Booking $bikeBooking;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => UserRole::SUPER_ADMIN,
            'name' => 'Kiran Admin',
            'phone' => '9845100001',
        ]);

        $this->staff = User::factory()->create([
            'role' => UserRole::STAFF,
            'name' => 'Ramesh Jetty Coordinator',
            'phone' => '9845100002',
        ]);

        $this->customer = User::factory()->create([
            'role' => UserRole::CUSTOMER,
            'name' => 'Sumanth Tourist',
            'phone' => '9845100003',
        ]);

        $this->store = Store::create([
            'name' => 'Palya Main Rd Hub',
            'address_line' => 'Opp. Sharavathi Bridge, Palya',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2810,
            'longitude' => 74.4442,
            'phone' => '9481512340',
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->category = BikeCategory::create([
            'name' => 'Scooter',
            'base_daily_rate' => 450.00,
            'default_deposit_amount' => 1000.00,
        ]);

        $this->bike = Bike::create([
            'category_id' => $this->category->id,
            'home_store_id' => $this->store->id,
            'current_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-9999',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'status' => 'available',
            'odometer_reading' => 3200,
        ]);

        $this->serviceItem = ServiceItem::create([
            'service_type' => 'boating',
            'name' => 'Sharavathi Riverfront Shikara Cruise',
            'category' => 'Mangrove Safari',
            'price_base' => 2000.00,
            'price_unit' => 'per_ride',
            'status' => 'available',
        ]);

        $this->serviceBooking = ServiceBooking::create([
            'booking_number' => 'GKW-BT-260910-JETTY',
            'service_type' => 'boating',
            'service_item_id' => $this->serviceItem->id,
            'customer_name' => 'Sumanth Tourist',
            'customer_phone' => '9845100003',
            'customer_email' => 'sumanth@example.com',
            'booking_channel' => 'online',
            'start_datetime' => '2026-09-12 10:00:00',
            'pickup_location' => 'Sharavathi Boating Jetty, Mavinkurve',
            'quantity' => 4,
            'base_amount' => 2000.00,
            'tax_amount' => 0.00,
            'discount_amount' => 0.00,
            'total_amount' => 2000.00,
            'advance_paid' => 500.00,
            'balance_due' => 1500.00,
            'payment_status' => 'partial',
            'payment_method' => 'pay_on_arrival',
            'status' => 'confirmed',
            'admin_notes' => 'Advance paid online; balance due at boarding.',
        ]);

        $this->bikeBooking = Booking::create([
            'booking_number' => 'GKW-BK-260910-HUB',
            'booking_reference' => 'REF-BK-260910-HUB',
            'user_id' => $this->customer->id,
            'bike_id' => $this->bike->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_datetime' => '2026-09-12 09:00:00',
            'end_datetime' => '2026-09-14 18:00:00',
            'start_date' => '2026-09-12',
            'end_date' => '2026-09-14',
            'rental_days' => 2,
            'base_amount' => 900.00,
            'deposit_amount' => 1000.00,
            'total_amount' => 1900.00,
            'status' => BookingStatus::CONFIRMED,
            'channel' => 'online',
            'payment_status' => 'paid',
            'customer_name' => 'Sumanth Tourist',
            'customer_phone' => '9845100003',
            'price_breakdown_json' => ['daily_rate' => 450, 'days' => 2],
            'idempotency_key' => 'idem-checkin-test-01',
        ]);
    }

    public function test_guest_is_redirected_from_ground_check_in(): void
    {
        $response = $this->get('/admin/check-in');
        $response->assertRedirect(route('admin.login'));
    }

    public function test_customer_is_forbidden_from_ground_check_in(): void
    {
        $response = $this->actingAs($this->customer)->get('/admin/check-in');
        $response->assertStatus(403);
    }

    public function test_staff_and_super_admin_can_access_ground_check_in(): void
    {
        $response = $this->actingAs($this->staff)->get('/admin/check-in');
        $response->assertOk();

        $responseAdmin = $this->actingAs($this->superAdmin)->get('/admin/check-in');
        $responseAdmin->assertOk();
    }

    public function test_staff_can_lookup_service_booking_by_number(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/admin/check-in/lookup', [
            'code' => 'GKW-BT-260910-JETTY',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'booking_number' => 'GKW-BT-260910-JETTY',
                    'service_type' => 'boating',
                    'customer_name' => 'Sumanth Tourist',
                    'balance_due' => 1500,
                    'status' => 'confirmed',
                ],
            ]);
    }

    public function test_staff_can_lookup_service_booking_by_scanned_url(): void
    {
        $scannedUrl = 'http://127.0.0.1:8000/services/bookings/GKW-BT-260910-JETTY/confirmation';

        $response = $this->actingAs($this->staff)->postJson('/admin/check-in/lookup', [
            'code' => $scannedUrl,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'booking_number' => 'GKW-BT-260910-JETTY',
                    'customer_phone' => '9845100003',
                ],
            ]);
    }

    public function test_staff_can_lookup_booking_by_customer_phone(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/admin/check-in/lookup', [
            'code' => '9845100003',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);
        expect($response->json('data.customer_phone'))->toBe('9845100003');
    }

    public function test_staff_can_lookup_bike_rental_by_reference(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/admin/check-in/lookup', [
            'code' => 'REF-BK-260910-HUB',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'bike',
                    'booking_number' => 'REF-BK-260910-HUB',
                    'registration_number' => 'KA-47-E-9999',
                ],
            ]);
    }

    public function test_lookup_returns_404_for_invalid_code(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/admin/check-in/lookup', [
            'code' => 'INVALID-CODE-999',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_staff_can_collect_pending_balance_and_board_passenger(): void
    {
        $response = $this->actingAs($this->staff)->postJson("/admin/check-in/service/{$this->serviceBooking->id}/process", [
            'action' => 'collect_balance',
            'amount_collected' => 1500.00,
            'payment_method' => 'upi',
            'ground_notes' => 'Collected via PhonePe QR; 4 lifejackets issued.',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'balance_due' => 0,
                    'advance_paid' => 2000,
                    'payment_status' => 'paid',
                    'status' => 'in_progress',
                ],
            ]);

        $this->serviceBooking->refresh();
        expect((float) $this->serviceBooking->balance_due)->toBe(0.0);
        expect((float) $this->serviceBooking->advance_paid)->toBe(2000.0);
        expect($this->serviceBooking->payment_status)->toBe('paid');
        expect($this->serviceBooking->status)->toBe('in_progress');
        expect($this->serviceBooking->admin_notes)->toContain('Collected balance ₹1500 via UPI');
        expect($this->serviceBooking->admin_notes)->toContain('4 lifejackets issued');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'ground_checkin.processed',
            'subject_type' => ServiceBooking::class,
            'subject_id' => (string) $this->serviceBooking->id,
        ]);
    }

    public function test_staff_can_board_zero_balance_passenger(): void
    {
        $this->serviceBooking->update([
            'advance_paid' => 2000.00,
            'balance_due' => 0.00,
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->staff)->postJson("/admin/check-in/service/{$this->serviceBooking->id}/process", [
            'action' => 'board',
            'ground_notes' => 'Boarded at Mavinkurve Shikara Boat #1',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'in_progress',
                ],
            ]);

        $this->serviceBooking->refresh();
        expect($this->serviceBooking->status)->toBe('in_progress');
        expect($this->serviceBooking->admin_notes)->toContain('Mavinkurve Shikara Boat #1');
    }

    public function test_staff_can_complete_ground_handover_for_bike(): void
    {
        $response = $this->actingAs($this->staff)->postJson("/admin/check-in/bike/{$this->bikeBooking->id}/process", [
            'action' => 'check_in',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'bike',
                    'status' => 'handed_over',
                ],
            ]);

        $this->bikeBooking->refresh();
        expect($this->bikeBooking->status)->toBe(BookingStatus::HANDED_OVER);
    }

    public function test_staff_can_batch_sync_offline_queued_checkins(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/admin/check-in/sync', [
            'items' => [
                [
                    'client_id' => 'offline-service-123',
                    'type' => 'service',
                    'id' => $this->serviceBooking->id,
                    'action' => 'board',
                    'payment_method' => 'cash',
                    'amount_collected' => 1500,
                    'ground_notes' => 'Queued at Mavinkurve jetty offline',
                    'queued_at' => '10 Sep 02:30',
                ],
                [
                    'client_id' => 'offline-bike-456',
                    'type' => 'bike',
                    'id' => $this->bikeBooking->id,
                    'action' => 'check_in',
                    'queued_at' => '10 Sep 02:35',
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'synced_count' => 2,
                'synced_ids' => ['offline-service-123', 'offline-bike-456'],
            ]);

        $this->serviceBooking->refresh();
        expect($this->serviceBooking->status)->toBe('in_progress');
        expect((float) $this->serviceBooking->balance_due)->toBe(0.0);
        expect($this->serviceBooking->payment_status)->toBe('paid');
        expect($this->serviceBooking->admin_notes)->toContain('Offline Check-in queued at 10 Sep 02:30');

        $this->bikeBooking->refresh();
        expect($this->bikeBooking->status)->toBe(BookingStatus::HANDED_OVER);

        // Verify offline sync activity log entries
        $serviceLog = ActivityLog::where('action', 'ground_checkin.offline_synced')
            ->where('subject_id', (string) $this->serviceBooking->id)
            ->first();
        expect($serviceLog)->not->toBeNull();
        expect($serviceLog->new_values['is_offline_sync'])->toBeTrue();
        expect($serviceLog->new_values['queued_at'])->toBe('10 Sep 02:30');
    }
}

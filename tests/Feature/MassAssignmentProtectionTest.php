<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\KycDocument;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class MassAssignmentProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected Store $store;
    protected BikeCategory $category;
    protected Bike $bike;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Honnavar Main Hub',
            'address_line' => 'Palya Main Road',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2798,
            'longitude' => 74.4439,
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->category = BikeCategory::create([
            'name' => 'Premium Scooter',
            'slug' => 'premium-scooter',
            'engine_capacity_cc' => 125,
            'base_daily_rate' => 600.00,
            'default_deposit_amount' => 1000.00,
            'hourly_rate' => 60.00,
            'weekend_surge_percentage' => 10,
        ]);

        $this->bike = Bike::create([
            'category_id' => $this->category->id,
            'home_store_id' => $this->store->id,
            'current_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 125',
            'registration_number' => 'KA-47-E-1234',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'odometer_reading' => 5000,
            'status' => BikeStatus::AVAILABLE,
        ]);

        $this->customer = User::create([
            'name' => 'Honest Rider',
            'email' => 'rider@example.com',
            'phone' => '9876543210',
            'password' => Hash::make('StrongRiderPass2026!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);
    }

    public function test_two_factor_columns_cannot_be_mass_assigned_on_user(): void
    {
        $user = new User([
            'name' => 'Jane Doe',
            'email' => 'janedoe@example.com',
            'phone' => '9876500001',
            'password' => 'secret',
            'two_factor_secret' => 'TAMPERED_SECRET',
            'two_factor_recovery_codes' => ['TAMPERED'],
            'two_factor_confirmed_at' => now(),
        ]);

        $this->assertNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_recovery_codes);
        $this->assertNull($user->two_factor_confirmed_at);
    }

    public function test_customer_web_registration_ignores_role_and_status_injection(): void
    {
        $response = $this->post('/register', [
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'phone' => '9876500002',
            'password' => 'StrongAdminPass2026!',
            'role' => 'super_admin',
            'status' => 'inactive',
            'blacklist_reason' => 'Bypassed block',
            'is_admin' => true,
        ]);

        $response->assertRedirect('/account');

        $createdUser = User::where('email', 'attacker@example.com')->firstOrFail();
        $this->assertSame(UserRole::CUSTOMER, $createdUser->role);
        $this->assertSame(UserStatus::ACTIVE, $createdUser->status);
        $this->assertNull($createdUser->blacklist_reason);
    }

    public function test_customer_api_registration_ignores_role_and_status_injection(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'API Attacker',
            'email' => 'api_attacker@example.com',
            'phone' => '9876500003',
            'password' => 'StrongPass123!@#',
            'role' => 'super_admin',
            'status' => 'blacklisted',
            'is_admin' => 1,
        ]);

        $response->assertStatus(201);

        $createdUser = User::where('email', 'api_attacker@example.com')->firstOrFail();
        $this->assertSame(UserRole::CUSTOMER, $createdUser->role);
        $this->assertSame(UserStatus::ACTIVE, $createdUser->status);
    }

    public function test_customer_cannot_tamper_booking_hold_amounts_or_owner(): void
    {
        $victim = User::create([
            'name' => 'Victim User',
            'email' => 'victim@example.com',
            'phone' => '9876500004',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/bookings/hold', [
            'bike_id' => $this->bike->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => Carbon::tomorrow()->toDateString(),
            'end_date' => Carbon::tomorrow()->addDay()->toDateString(),
            'idempotency_key' => (string) Str::uuid(),
            // Malicious payload attempts:
            'user_id' => $victim->id,
            'total_amount' => 1.00,
            'base_amount' => 1.00,
            'deposit_amount' => 0.00,
            'status' => 'confirmed',
        ]);

        $response->assertStatus(201);
        $bookingId = $response->json('data.id');

        $booking = Booking::findOrFail($bookingId);

        // Confirmed: Booking owner is the authenticated user, NOT the victim
        $this->assertSame($this->customer->id, $booking->user_id);
        // Confirmed: Status is HELD, NOT confirmed
        $this->assertSame(BookingStatus::HELD, $booking->status);
        // Confirmed: Calculated total amount matches system pricing, NOT the injected 1.00
        $this->assertGreaterThan(500.00, (float) $booking->total_amount);
    }

    public function test_customer_kyc_upload_cannot_self_verify(): void
    {
        Storage::fake('local');
        $file = UploadedFile::fake()->create('license.pdf', 300, 'application/pdf');

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/customer/kyc-documents', [
            'document_type' => 'driving_license',
            'file' => $file,
            // Tampered fields:
            'verified' => true,
            'verified_by' => 1,
            'verified_at' => now()->toDateTimeString(),
        ]);

        $response->assertStatus(201);

        $doc = KycDocument::where('user_id', $this->customer->id)->firstOrFail();
        $this->assertFalse((bool) $doc->verified);
        $this->assertNull($doc->verified_by);
        $this->assertNull($doc->verified_at);
    }

    public function test_service_booking_creation_cannot_override_price_or_status(): void
    {
        $item = ServiceItem::create([
            'service_type' => 'boating',
            'name' => 'Sunset Cruise',
            'category' => 'Cruises',
            'description' => 'Honnavar Backwaters Sunset Boat Tour',
            'price_base' => 1200.00,
            'price_unit' => 'per_person',
            'capacity' => 10,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->customer)->post('/services/book', [
            'service_type' => 'boating',
            'service_item_id' => $item->id,
            'customer_name' => 'Test Traveler',
            'customer_phone' => '9876543210',
            'customer_email' => 'traveler@example.com',
            'pickup_location' => 'Sharavathi River Boardwalk',
            'start_datetime' => Carbon::tomorrow()->setHour(16)->format('Y-m-d H:i:s'),
            'quantity' => 2,
            'payment_method' => 'pay_on_arrival',
            // Injected overrides:
            'total_amount' => 10.00,
            'base_amount' => 5.00,
            'advance_paid' => 2400.00,
            'balance_due' => 0.00,
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $response->assertRedirect();

        $booking = \App\Models\ServiceBooking::where('service_item_id', $item->id)->firstOrFail();

        // Total amount is server-calculated: 2 * 1200 = 2400, not 10.00
        $this->assertEquals(2400.00, (float) $booking->total_amount);
        $this->assertEquals(2400.00, (float) $booking->balance_due);
        $this->assertSame('pending', $booking->payment_status);
        $this->assertSame('confirmed', $booking->status);
        $this->assertSame($this->customer->id, $booking->user_id);
    }
}

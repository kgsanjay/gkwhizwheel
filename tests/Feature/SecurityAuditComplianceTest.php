<?php

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\PaymentStatus;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\KycDocument;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityAuditComplianceTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $staffUser;
    protected User $customerUser;
    protected Store $store;
    protected BikeCategory $category;
    protected Bike $bike;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clearResolvedInstances();

        $this->store = Store::create([
            'name' => 'Indiranagar Hub',
            'address_line' => '100 Feet Road',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '560038',
            'latitude' => 12.9784,
            'longitude' => 77.6408,
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->category = BikeCategory::create([
            'name' => 'Commuter',
            'slug' => 'commuter',
            'engine_capacity_cc' => 125,
            'base_daily_rate' => 500.00,
            'default_deposit_amount' => 1500.00,
            'hourly_rate' => 50.00,
            'weekend_surge_percentage' => 15,
        ]);

        $this->bike = Bike::create([
            'category_id' => $this->category->id,
            'home_store_id' => $this->store->id,
            'current_store_id' => $this->store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-01-SEC-9999',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'odometer_reading' => 12000,
            'status' => BikeStatus::AVAILABLE,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@gkwhizwheel.com',
            'phone' => '9999911111',
            'password' => bcrypt('Secret123!'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->staffUser = User::create([
            'name' => 'Store Staff',
            'email' => 'staff@gkwhizwheel.com',
            'phone' => '9999922222',
            'password' => bcrypt('Secret123!'),
            'role' => UserRole::STORE_MANAGER,
            'status' => UserStatus::ACTIVE,
        ]);
        $this->staffUser->stores()->attach($this->store->id, ['is_primary' => true]);

        $this->customerUser = User::create([
            'name' => 'Customer User',
            'email' => 'customer@gkwhizwheel.com',
            'phone' => '9988776655',
            'password' => bcrypt('Secret123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);
    }

    public function test_rate_limiting_is_enforced_on_auth_endpoints(): void
    {
        // /api/v1/auth/otp/request is limited to 10 requests per minute
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/v1/auth/otp/request', [
                'phone' => '9988776655',
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        $rateLimitedResponse = $this->postJson('/api/v1/auth/otp/request', [
            'phone' => '9988776655',
        ]);

        $rateLimitedResponse->assertStatus(429);
    }

    public function test_signed_urls_on_kyc_document_access_validates_and_rejects_tampered_or_unsigned_requests(): void
    {
        Storage::fake('local');
        $fakeFile = UploadedFile::fake()->create('license.jpg', 500, 'image/jpeg');
        $filePath = $fakeFile->store('kyc/test', 'local');

        $kycDoc = KycDocument::create([
            'user_id' => $this->customerUser->id,
            'document_type' => KycDocumentType::DRIVING_LICENSE,
            'file_path' => $filePath,
            'verified' => false,
        ]);

        // Unsigned request must be rejected with 401 or 403
        $unsignedResponse = $this->get('/api/v1/kyc-documents/' . $kycDoc->id);
        $this->assertTrue(in_array($unsignedResponse->status(), [401, 403]));

        // Valid signed URL within 15 minutes allows access
        $validSignedUrl = URL::temporarySignedRoute(
            'kyc-documents.download',
            now()->addMinutes(15),
            ['id' => $kycDoc->id]
        );

        $signedResponse = $this->get($validSignedUrl);
        $signedResponse->assertOk();

        // Tampered signature must be rejected
        $tamperedUrl = $validSignedUrl . 'extra_tamper';
        $tamperedResponse = $this->get($tamperedUrl);
        $this->assertTrue(in_array($tamperedResponse->status(), [401, 403]));

        // Expired signature must be rejected
        $expiredSignedUrl = URL::temporarySignedRoute(
            'kyc-documents.download',
            now()->subMinutes(1),
            ['id' => $kycDoc->id]
        );
        $expiredResponse = $this->get($expiredSignedUrl);
        $this->assertTrue(in_array($expiredResponse->status(), [401, 403]));
    }

    public function test_booking_actions_execute_under_db_transaction_and_locks(): void
    {
        $start = Carbon::now()->addDay()->setHour(10)->setMinute(0);
        $end = Carbon::now()->addDays(2)->setHour(10)->setMinute(0);

        $booking = Booking::create([
            'booking_reference' => 'BK-SEC-001',
            'user_id' => $this->customerUser->id,
            'bike_id' => $this->bike->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'channel' => BookingChannel::ONLINE,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'status' => BookingStatus::CONFIRMED,
            'base_amount' => 500,
            'deposit_amount' => 1500,
            'total_amount' => 2000,
            'price_breakdown_json' => ['total' => 2000],
            'idempotency_key' => (string) Str::uuid(),
        ]);

        $newEnd = Carbon::now()->addDays(3)->toDateString();

        $response = $this->actingAs($this->customerUser)
            ->postJson("/api/v1/bookings/{$booking->id}/extend", [
                'new_end_date' => $newEnd,
            ]);

        $response->assertOk();
        $this->assertEquals($newEnd, $booking->fresh()->end_date->toDateString());
    }

    public function test_pricing_rule_and_coupon_admin_mutations_record_activity_logs(): void
    {
        $admin = $this->superAdmin;

        // 1. Create pricing rule via API
        $pricingRulePayload = [
            'category_id' => $this->category->id,
            'rule_type' => 'weekend',
            'rate_type' => 'percentage',
            'value' => 20.00,
            'day_of_week' => 0,
            'priority' => 1,
            'is_active' => true,
        ];

        $respRule = $this->actingAs($admin)->postJson('/api/v1/admin/pricing-rules', $pricingRulePayload);
        $respRule->assertStatus(201);
        $ruleId = $respRule->json('data.id');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'pricing_rule_created',
            'subject_type' => PricingRule::class,
            'subject_id' => $ruleId,
            'user_id' => $admin->id,
        ]);

        // 2. Create coupon via API
        $couponPayload = [
            'code' => 'SECURE20',
            'discount_type' => 'percentage',
            'value' => 20.00,
            'valid_from' => Carbon::now()->toDateString(),
            'valid_until' => Carbon::now()->addDays(30)->toDateString(),
            'is_active' => true,
        ];

        $respCoupon = $this->actingAs($admin)->postJson('/api/v1/admin/coupons', $couponPayload);
        $respCoupon->assertStatus(201);
        $couponId = $respCoupon->json('data.id');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'coupon_created',
            'subject_type' => Coupon::class,
            'subject_id' => $couponId,
            'user_id' => $admin->id,
        ]);

        // 3. Delete coupon records audit log
        $delCoupon = $this->actingAs($admin)->deleteJson("/api/v1/admin/coupons/{$couponId}");
        $delCoupon->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'coupon_deleted',
            'subject_type' => Coupon::class,
            'subject_id' => $couponId,
            'user_id' => $admin->id,
        ]);
    }

    public function test_admin_booking_override_and_refund_record_activity_logs(): void
    {
        $start = Carbon::tomorrow()->addDays(1)->toDateString();
        $end = Carbon::tomorrow()->addDays(3)->toDateString();

        $booking = Booking::create([
            'booking_reference' => 'BK-OVR-001',
            'user_id' => $this->customerUser->id,
            'bike_id' => $this->bike->id,
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'channel' => BookingChannel::ONLINE,
            'start_date' => $start,
            'end_date' => $end,
            'status' => BookingStatus::CONFIRMED,
            'base_amount' => 500,
            'deposit_amount' => 1500,
            'total_amount' => 2000,
            'price_breakdown_json' => ['total' => 2000],
            'idempotency_key' => (string) Str::uuid(),
        ]);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'amount' => 2000,
            'type' => 'advance',
            'status' => PaymentStatus::SUCCESS,
            'method' => 'cash',
            'gateway_reference' => 'TXN-CASH-001',
        ]);

        // Admin override booking dates
        $newEnd = Carbon::tomorrow()->addDays(5)->toDateString();
        $response = $this->actingAs($this->superAdmin)->put("/admin/bookings/{$booking->id}", [
            'status' => 'confirmed',
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'start_date' => $start,
            'end_date' => $newEnd,
            'late_fee_amount' => 0,
            'damage_fee_amount' => 0,
        ]);

        $response->assertRedirect('/admin/bookings');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'admin_booking_override',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'user_id' => $this->superAdmin->id,
        ]);

        // Process refund
        $refundResponse = $this->actingAs($this->superAdmin)->post("/admin/bookings/{$booking->id}/refund", [
            'amount' => 1500,
            'payment_id' => $payment->id,
            'reason' => 'Customer deposit refund on return',
        ]);

        $refundResponse->assertRedirect('/admin/bookings');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'admin_booking_refund',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'user_id' => $this->superAdmin->id,
        ]);
    }
}

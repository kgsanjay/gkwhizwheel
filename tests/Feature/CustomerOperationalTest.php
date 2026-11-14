<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\DiscountType;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\KycDocument;
use App\Models\Payment;
use App\Models\Review;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustomerOperationalTest extends TestCase
{
    use RefreshDatabase;

    protected Store $honnavarStore;
    protected Store $murudeshwarStore;
    protected BikeCategory $category;
    protected Bike $honnavarBike;
    protected User $customer1;
    protected User $customer2;
    protected Coupon $globalCoupon;
    protected Coupon $honnavarCoupon;
    protected Coupon $murudeshwarCoupon;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');

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

        $this->category = BikeCategory::create([
            'name' => 'Scooter 125cc',
            'base_daily_rate' => 500.00,
            'default_deposit_amount' => 1000.00,
        ]);

        $this->honnavarBike = Bike::create([
            'category_id' => $this->category->id,
            'home_store_id' => $this->honnavarStore->id,
            'current_store_id' => $this->honnavarStore->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-1001',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::AUTOMATIC,
            'status' => BikeStatus::AVAILABLE,
            'odometer_reading' => 5000,
            'base_daily_rate_override' => 500.00,
            'weekend_daily_rate_override' => 600.00,
        ]);

        $this->customer1 = User::create([
            'name' => 'Aditi Rao',
            'email' => 'aditi@example.test',
            'phone' => '+919888800001',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->customer2 = User::create([
            'name' => 'Vikram Seth',
            'email' => 'vikram@example.test',
            'phone' => '+919888800002',
            'password' => bcrypt('Password123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->globalCoupon = Coupon::create([
            'code' => 'GLOBAL10',
            'discount_type' => DiscountType::PERCENTAGE,
            'value' => 10.00,
            'is_active' => true,
            'store_id' => null,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
        ]);

        $this->honnavarCoupon = Coupon::create([
            'code' => 'HONNAVAR50',
            'discount_type' => DiscountType::FIXED,
            'value' => 50.00,
            'is_active' => true,
            'store_id' => $this->honnavarStore->id,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
        ]);

        $this->murudeshwarCoupon = Coupon::create([
            'code' => 'MURU100',
            'discount_type' => DiscountType::FIXED,
            'value' => 100.00,
            'is_active' => true,
            'store_id' => $this->murudeshwarStore->id,
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
        ]);
    }

    public function test_customer_quote_applies_branch_or_global_coupon_and_rejects_cross_branch_coupon(): void
    {
        $startDate = now()->addDays(2)->toDateString();
        $endDate = now()->addDays(4)->toDateString();

        // 1. Valid quote with global coupon on Honnavar
        $resGlobal = $this->actingAs($this->customer1)->postJson("/api/v1/bikes/{$this->honnavarBike->id}/price-quote", [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'coupon_code' => 'GLOBAL10',
        ]);
        $resGlobal->assertOk();
        $this->assertNotNull($resGlobal->json('data.price_breakdown_json.coupon'));
        $this->assertEquals('GLOBAL10', $resGlobal->json('data.price_breakdown_json.coupon.code'));

        // 2. Valid quote with matching branch coupon (Honnavar)
        $resBranch = $this->actingAs($this->customer1)->postJson("/api/v1/bikes/{$this->honnavarBike->id}/price-quote", [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'coupon_code' => 'HONNAVAR50',
        ]);
        $resBranch->assertOk();
        $this->assertEquals('HONNAVAR50', $resBranch->json('data.price_breakdown_json.coupon.code'));

        // 3. Rejected cross-branch coupon (Murudeshwar coupon applied to Honnavar pickup)
        $resCross = $this->actingAs($this->customer1)->postJson("/api/v1/bikes/{$this->honnavarBike->id}/price-quote", [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'coupon_code' => 'MURU100',
        ]);
        $resCross->assertUnprocessable();
        $resCross->assertJsonValidationErrors(['coupon_code']);
    }

    public function test_customer_can_view_account_bookings_extend_trip_and_cancel_confirmed_booking(): void
    {
        $startDate = now()->addDays(1)->toDateString();
        $endDate = now()->addDays(3)->toDateString();

        $booking = Booking::create([
            'booking_reference' => 'BK-CUST-001',
            'user_id' => $this->customer1->id,
            'bike_id' => $this->honnavarBike->id,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'base_amount' => 1500.00,
            'deposit_amount' => 1000.00,
            'total_amount' => 2500.00,
            'status' => BookingStatus::CONFIRMED,
            'channel' => BookingChannel::ONLINE,
            'price_breakdown_json' => [],
            'idempotency_key' => 'idemp-cust-001',
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $this->customer1->id,
            'type' => PaymentType::ADVANCE,
            'amount' => 2500.00,
            'status' => PaymentStatus::SUCCESS,
            'method' => 'phonepe',
            'gateway_reference' => 'pay_phonepe_cust_001',
        ]);

        // 1. Customer can view their account bookings dashboard
        $response = $this->actingAs($this->customer1)->get('/account');
        $response->assertOk();

        // 2. Customer can view their detailed booking overview
        $detailRes = $this->actingAs($this->customer1)->get("/account/bookings/{$booking->id}");
        $detailRes->assertOk();

        // 3. Customer can extend their booking with available new end date
        $newEndDate = now()->addDays(5)->toDateString();
        $extendRes = $this->actingAs($this->customer1)->postJson("/account/bookings/{$booking->id}/extend", [
            'new_end_date' => $newEndDate,
        ]);
        $extendRes->assertOk();
        $this->assertEquals($newEndDate, Carbon::parse($booking->fresh()->end_date)->toDateString());

        // 4. Customer can cancel their confirmed booking before handover
        $cancelRes = $this->actingAs($this->customer1)->postJson("/account/bookings/{$booking->id}/cancel", [
            'reason' => 'Family emergency, cannot travel',
        ]);
        $cancelRes->assertOk();
        $this->assertEquals(BookingStatus::CANCELLED, $booking->fresh()->status);
        $this->assertDatabaseHas('refunds', [
            'booking_id' => $booking->id,
        ]);
    }

    public function test_customer_can_submit_review_for_completed_booking_but_forbidden_or_rejected_on_uncompleted_or_others(): void
    {
        $booking = Booking::create([
            'booking_reference' => 'BK-CUST-REV',
            'user_id' => $this->customer1->id,
            'bike_id' => $this->honnavarBike->id,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'start_date' => now()->subDays(3)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
            'base_amount' => 1000.00,
            'deposit_amount' => 1000.00,
            'total_amount' => 2000.00,
            'status' => BookingStatus::CONFIRMED, // Not completed yet
            'channel' => BookingChannel::ONLINE,
            'price_breakdown_json' => [],
            'idempotency_key' => 'idemp-cust-rev',
        ]);

        // 1. Attempting review on confirmed (not completed/returned) booking fails with 422
        $this->actingAs($this->customer1)->postJson("/account/bookings/{$booking->id}/review", [
            'rating' => 5,
            'comment' => 'Great experience!',
        ])->assertStatus(422);

        // Mark booking returned/completed
        $booking->update(['status' => BookingStatus::RETURNED]);

        // 2. Another customer (Customer 2) cannot review Customer 1's booking (403)
        $this->actingAs($this->customer2)->postJson("/account/bookings/{$booking->id}/review", [
            'rating' => 1,
            'comment' => 'Malicious review attempt',
        ])->assertForbidden();

        // 3. Customer 1 submits review successfully
        $res = $this->actingAs($this->customer1)->postJson("/account/bookings/{$booking->id}/review", [
            'rating' => 5,
            'comment' => 'Pristine Activa and scenic ride to Eco Beach!',
        ]);
        $res->assertOk();
        $this->assertDatabaseHas('reviews', [
            'booking_id' => $booking->id,
            'user_id' => $this->customer1->id,
            'rating' => 5,
        ]);

        // 4. Duplicate review attempt fails with 422
        $this->actingAs($this->customer1)->postJson("/account/bookings/{$booking->id}/review", [
            'rating' => 4,
            'comment' => 'Second review should be rejected',
        ])->assertStatus(422);
    }

    public function test_customer_can_manage_kyc_and_download_own_kyc_but_forbidden_on_others(): void
    {
        $file = UploadedFile::fake()->create('driving_license.pdf', 300, 'application/pdf');

        // 1. Customer 1 uploads KYC Driving License
        $uploadRes = $this->actingAs($this->customer1)->postJson('/account/kyc/upload', [
            'document_type' => 'driving_license',
            'file' => $file,
        ]);
        $uploadRes->assertCreated();
        $docId = $uploadRes->json('data.id');

        // 2. Customer 1 can download their own KYC file
        $dlRes = $this->actingAs($this->customer1)->get("/account/kyc/{$docId}/download");
        $dlRes->assertOk();

        // 3. Customer 2 cannot download Customer 1's KYC document (403)
        $this->actingAs($this->customer2)->get("/account/kyc/{$docId}/download")->assertForbidden();

        // 4. Customer 2 cannot view Customer 1's detailed booking (403)
        $booking = Booking::create([
            'booking_reference' => 'BK-CUST-ISOLATE',
            'user_id' => $this->customer1->id,
            'bike_id' => $this->honnavarBike->id,
            'pickup_store_id' => $this->honnavarStore->id,
            'return_store_id' => $this->honnavarStore->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'base_amount' => 1000.00,
            'deposit_amount' => 1000.00,
            'total_amount' => 2000.00,
            'status' => BookingStatus::CONFIRMED,
            'channel' => BookingChannel::ONLINE,
            'price_breakdown_json' => [],
            'idempotency_key' => 'idemp-cust-isolate',
        ]);
        $this->actingAs($this->customer2)->get("/account/bookings/{$booking->id}")->assertForbidden();

        // 5. Customer 2 cannot download voucher or print pass for Customer 1's ServiceBooking (403)
        $serviceItem = ServiceItem::create([
            'service_type' => 'boating',
            'store_id' => $this->honnavarStore->id,
            'name' => 'Mangrove Safari',
            'price_base' => 1200.00,
            'price_unit' => 'per_trip',
            'status' => 'available',
        ]);
        $serviceBooking = ServiceBooking::create([
            'booking_number' => 'SB-CUST-001',
            'idempotency_key' => 'sb-cust-001',
            'store_id' => $this->honnavarStore->id,
            'service_item_id' => $serviceItem->id,
            'service_type' => 'boating',
            'user_id' => $this->customer1->id,
            'customer_name' => 'Aditi Rao',
            'customer_phone' => '+919888800001',
            'status' => 'confirmed',
            'start_datetime' => now()->addDays(2),
            'base_amount' => 1200,
            'total_amount' => 1200,
            'advance_paid' => 1200,
            'balance_due' => 0,
            'booking_channel' => 'online',
            'payment_status' => 'paid',
        ]);

        $this->actingAs($this->customer2)->get("/services/bookings/{$serviceBooking->booking_number}/voucher")->assertForbidden();
        $this->actingAs($this->customer2)->get("/services/bookings/{$serviceBooking->booking_number}/print")->assertForbidden();

        // 6. Customer 1 can update their profile details
        $profileRes = $this->actingAs($this->customer1)->postJson('/account/profile', [
            'name' => 'Aditi Rao Upgraded',
            'email' => 'aditi.upgraded@example.test',
            'phone' => '+919888800099',
        ]);
        $profileRes->assertOk();
        $this->assertEquals('Aditi Rao Upgraded', $this->customer1->fresh()->name);
        $this->assertEquals('aditi.upgraded@example.test', $this->customer1->fresh()->email);
    }

    public function test_customer_is_strictly_blocked_from_back_office_admin_and_staff_endpoints(): void
    {
        // Web Admin Routes
        $this->actingAs($this->customer1)->get('/admin/dashboard')->assertForbidden();
        $this->actingAs($this->customer1)->get('/admin/bikes')->assertForbidden();
        $this->actingAs($this->customer1)->get('/admin/bookings')->assertForbidden();

        // API Staff / Admin Endpoints with sanctum auth
        $this->actingAs($this->customer1, 'sanctum')->getJson('/api/v1/admin/coupons')->assertForbidden();
        $this->actingAs($this->customer1, 'sanctum')->getJson('/api/v1/staff/bookings/active')->assertForbidden();
    }
}

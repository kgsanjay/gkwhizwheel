<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BikeNotAvailableException;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeConditionLog;
use App\Models\BikeDocument;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Throwable;

class FullUserJourneysTest extends TestCase
{
    use RefreshDatabase;

    protected Store $storeA;
    protected Store $storeB;
    protected BikeCategory $category;
    protected Bike $bike;
    protected User $customer;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');

        config()->set('services.razorpay.key_id', 'rzp_test_testkey123');
        config()->set('services.razorpay.key_secret', 'test_secret_abc123');
        config()->set('services.razorpay.webhook_secret', 'test_webhook_secret_xyz');

        $this->storeA = Store::create([
            'name' => 'Koramangala Hub',
            'address_line' => '80 Feet Road',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '560034',
            'latitude' => 12.9352,
            'longitude' => 77.6245,
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->storeB = Store::create([
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
            'name' => 'Premium Commuter',
            'slug' => 'premium-commuter',
            'engine_capacity_cc' => 150,
            'base_daily_rate' => 700.00,
            'default_deposit_amount' => 2000.00,
            'hourly_rate' => 60.00,
            'weekend_surge_percentage' => 15,
        ]);

        $this->bike = Bike::create([
            'category_id' => $this->category->id,
            'home_store_id' => $this->storeA->id,
            'current_store_id' => $this->storeA->id,
            'brand' => 'Yamaha',
            'model_name' => 'FZ-X',
            'registration_number' => 'KA-01-UJ-1001',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::MANUAL,
            'odometer_reading' => 10000,
            'status' => BikeStatus::AVAILABLE,
        ]);

        $this->customer = User::create([
            'name' => 'Journey Customer',
            'email' => 'journey.customer@example.com',
            'phone' => '9888811111',
            'password' => bcrypt('Secret123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->staff = User::create([
            'name' => 'Store Staffer',
            'email' => 'journey.staff@example.com',
            'phone' => '9888822222',
            'password' => bcrypt('Secret123!'),
            'role' => UserRole::STORE_MANAGER,
            'status' => UserStatus::ACTIVE,
        ]);
        $this->staff->stores()->attach($this->storeA->id, ['is_primary' => true]);
        $this->staff->stores()->attach($this->storeB->id, ['is_primary' => false]);
    }

    /**
     * Journey 1: Customer browses, books, pays online, and views their bike documents.
     */
    public function test_journey_1_customer_browses_books_pays_online_and_views_bike_documents(): void
    {
        // 1. Browse public bikes
        $browseResponse = $this->getJson("/api/v1/bikes?store_id={$this->storeA->id}");
        $browseResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.id', $this->bike->id)
            ->assertJsonPath('data.0.model_name', 'FZ-X');

        // 2. Request price quote
        $startDate = Carbon::tomorrow()->addDays(2)->toDateString();
        $endDate = Carbon::tomorrow()->addDays(5)->toDateString();

        $quoteResponse = $this->postJson("/api/v1/bikes/{$this->bike->id}/price-quote", [
            'pickup_store_id' => $this->storeA->id,
            'return_store_id' => $this->storeA->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
        $quoteResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'base_amount',
                    'deposit_amount',
                    'total_amount',
                    'price_breakdown_json',
                ],
            ]);

        // 3. Customer authenticates and places a booking hold with Idempotency-Key
        Sanctum::actingAs($this->customer, ['*']);

        $holdResponse = $this->withHeader('Idempotency-Key', 'journey-hold-key-001')
            ->postJson('/api/v1/bookings/hold', [
                'bike_id' => $this->bike->id,
                'pickup_store_id' => $this->storeA->id,
                'return_store_id' => $this->storeA->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

        $holdResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'held')
            ->assertJsonPath('data.channel', 'online');

        $bookingId = $holdResponse->json('data.id');
        $this->assertNotNull($bookingId);

        // 4. Customer initiates checkout (Razorpay)
        $checkoutResponse = $this->postJson("/api/v1/bookings/{$bookingId}/checkout", [
            'gateway' => 'razorpay',
        ]);
        $checkoutResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gateway', 'razorpay')
            ->assertJsonStructure(['data' => ['order_id', 'amount', 'key_id']]);

        // Booking status is now pending_payment
        $booking = Booking::findOrFail($bookingId);
        $this->assertEquals(BookingStatus::PENDING_PAYMENT, $booking->status);

        // 5. Razorpay webhook confirms payment
        $booking = Booking::findOrFail($bookingId);
        $orderId = $checkoutResponse->json('data.order_id');
        $razorpayPaymentId = 'pay_journey_test_9988';
        $webhookPayload = [
            'event' => 'payment.captured',
            'payload' => [
                'payment' => [
                    'entity' => [
                        'id' => $razorpayPaymentId,
                        'order_id' => $orderId,
                        'amount' => (int) ($booking->total_amount * 100),
                        'currency' => 'INR',
                        'notes' => [
                            'booking_id' => (string) $booking->id,
                            'booking_reference' => $booking->booking_reference,
                        ],
                    ],
                ],
            ],
        ];

        $payloadJson = json_encode($webhookPayload, JSON_THROW_ON_ERROR);
        $signature = hash_hmac('sha256', $payloadJson, 'test_webhook_secret_xyz');

        $webhookResponse = $this->call(
            'POST',
            '/webhooks/razorpay',
            [],
            [],
            [],
            [
                'HTTP_X-Razorpay-Signature' => $signature,
                'CONTENT_TYPE' => 'application/json',
            ],
            $payloadJson
        );

        $webhookResponse->assertOk()
            ->assertJsonPath('success', true);

        $booking->refresh();
        $this->assertEquals(BookingStatus::CONFIRMED, $booking->status);

        // 6. Attach RC and Insurance documents to the bike
        $rcDoc = BikeDocument::create([
            'bike_id' => $this->bike->id,
            'document_type' => BikeDocumentType::RC,
            'file_path' => 'documents/bikes/journey_rc.pdf',
            'expiry_date' => Carbon::now()->addYears(3)->toDateString(),
            'uploaded_by' => $this->staff->id,
            'verified' => true,
        ]);
        Storage::disk('local')->put('documents/bikes/journey_rc.pdf', 'dummy-rc-content');

        $insuranceDoc = BikeDocument::create([
            'bike_id' => $this->bike->id,
            'document_type' => BikeDocumentType::INSURANCE,
            'file_path' => 'documents/bikes/journey_insurance.pdf',
            'expiry_date' => Carbon::now()->addYear()->toDateString(),
            'uploaded_by' => $this->staff->id,
            'verified' => true,
        ]);
        Storage::disk('local')->put('documents/bikes/journey_insurance.pdf', 'dummy-insurance-content');

        // 7. Customer views their bike documents for this confirmed booking
        $docsResponse = $this->getJson("/api/v1/bookings/{$bookingId}/documents");
        $docsResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'booking_id',
                    'bike_id',
                    'documents' => [
                        '*' => [
                            'id',
                            'document_type',
                            'file_name',
                            'expiry_date',
                            'verified',
                            'temporary_url',
                        ],
                    ],
                ],
            ]);

        $documents = $docsResponse->json('data.documents');
        $this->assertCount(2, $documents);

        // 8. Follow the signed URL to download RC document
        $rcDocData = collect($documents)->firstWhere('document_type', 'rc');
        $this->assertNotNull($rcDocData);
        $rcSignedUrl = $rcDocData['temporary_url'];
        $this->assertNotEmpty($rcSignedUrl);

        $downloadResponse = $this->get($rcSignedUrl);
        $downloadResponse->assertOk();
    }

    /**
     * Journey 2: Staff member processes a full walk-in booking from phone lookup through handover.
     */
    public function test_journey_2_staff_processes_full_walkin_booking_from_lookup_through_handover(): void
    {
        Sanctum::actingAs($this->staff, ['*']);

        // 1. Phone lookup: Customer does not exist yet
        $lookupPhone = '9777755555';
        $lookupResponse = $this->getJson("/api/v1/staff/customers/lookup?phone={$lookupPhone}");
        $lookupResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.found', false);

        // 2. Staff creates walk-in customer with KYC documents
        $idCardFile = UploadedFile::fake()->image('aadhaar_card.jpg', 600, 400);
        $createCustomerResponse = $this->postJson('/api/v1/staff/customers', [
            'name' => 'Walkin Guest',
            'phone' => $lookupPhone,
            'email' => 'walkin.guest@example.com',
            'whatsapp_opt_in' => true,
            'national_id' => $idCardFile,
        ]);
        $createCustomerResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Walkin Guest');

        $walkinCustomerId = $createCustomerResponse->json('data.id');
        $this->assertNotNull($walkinCustomerId);

        // 3. Staff selects available bike at store
        $bikesResponse = $this->getJson("/api/v1/staff/bikes?store_id={$this->storeA->id}");
        $bikesResponse->assertOk()
            ->assertJsonPath('success', true);

        // 4. Staff holds booking for customer with Idempotency-Key
        $startDate = Carbon::today()->toDateString();
        $endDate = Carbon::today()->addDays(2)->toDateString();

        $holdResponse = $this->withHeader('Idempotency-Key', 'staff-walkin-hold-001')
            ->postJson('/api/v1/staff/bookings', [
                'customer_id' => $walkinCustomerId,
                'bike_id' => $this->bike->id,
                'pickup_store_id' => $this->storeA->id,
                'return_store_id' => $this->storeA->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

        $holdResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'held')
            ->assertJsonPath('data.channel', 'offline');

        $bookingId = $holdResponse->json('data.id');
        $totalAmount = (float) $holdResponse->json('data.total_amount');

        // 5. Staff collects payment in-store (e.g. Cash)
        $paymentResponse = $this->withHeader('Idempotency-Key', 'staff-payment-key-001')
            ->postJson("/api/v1/staff/bookings/{$bookingId}/collect-payment", [
                'payment_method' => 'cash',
                'amount' => $totalAmount,
                'notes' => 'Received cash at Koramangala counter',
            ]);

        $paymentResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'confirmed');

        // Verify payment record in database
        $this->assertDatabaseHas('payments', [
            'booking_id' => $bookingId,
            'method' => PaymentMethod::CASH->value,
            'status' => PaymentStatus::SUCCESS->value,
            'collected_by' => $this->staff->id,
        ]);

        // 6. Staff executes physical handover (odometer, condition inspection photos, digital signature)
        $photo1 = UploadedFile::fake()->image('handover_meter.jpg');
        $photo2 = UploadedFile::fake()->image('handover_scratch.jpg');
        $signature = UploadedFile::fake()->image('digital_signature.png');

        $handoverResponse = $this->postJson("/api/v1/staff/bookings/{$bookingId}/handover", [
            'odometer_reading' => 10120,
            'condition_photos' => [$photo1, $photo2],
            'signature' => $signature,
            'notes' => 'Helmet provided, small paint chip on rear fender noted.',
        ]);

        $handoverResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'handed_over');

        // 7. Verify all state updates in database
        $booking = Booking::findOrFail($bookingId);
        $this->assertEquals(BookingStatus::HANDED_OVER, $booking->status);
        $this->assertNotNull($booking->agreement_signed_at);
        $this->assertNotNull($booking->agreement_signature_path);

        $this->bike->refresh();
        $this->assertEquals(BikeStatus::ON_RENT, $this->bike->status);
        $this->assertEquals(10120, $this->bike->odometer_reading);

        $this->assertDatabaseHas('bike_condition_logs', [
            'booking_id' => $bookingId,
            'stage' => 'handover',
            'odometer_reading' => 10120,
            'logged_by' => $this->staff->id,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'subject_type' => Booking::class,
            'subject_id' => $bookingId,
            'action' => 'booking_handed_over',
            'user_id' => $this->staff->id,
        ]);
    }

    /**
     * Journey 3: One-way rental where pickup and return stores differ, confirming current_store_id updates correctly on return.
     */
    public function test_journey_3_one_way_rental_updates_bike_current_store_id_on_return(): void
    {
        Sanctum::actingAs($this->staff, ['*']);

        // Bike starts at storeA
        $this->assertEquals($this->storeA->id, $this->bike->current_store_id);

        // Booking scheduled from storeA to storeB (One-way rental)
        $booking = Booking::create([
            'booking_reference' => 'BK-ONEWAY-JOURNEY',
            'bike_id' => $this->bike->id,
            'user_id' => $this->customer->id,
            'pickup_store_id' => $this->storeA->id,
            'return_store_id' => $this->storeB->id,
            'channel' => BookingChannel::ONLINE,
            'status' => BookingStatus::HANDED_OVER,
            'start_date' => Carbon::yesterday()->toDateString(),
            'end_date' => Carbon::today()->toDateString(),
            'base_amount' => 1400.00,
            'deposit_amount' => 2000.00,
            'total_amount' => 3400.00,
            'price_breakdown_json' => ['base' => 1400, 'deposit' => 2000],
            'idempotency_key' => 'oneway-journey-key-01',
        ]);

        $this->bike->update(['status' => BikeStatus::ON_RENT]);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => PaymentType::ADVANCE,
            'amount' => 3400.00,
            'method' => PaymentMethod::RAZORPAY,
            'status' => PaymentStatus::SUCCESS,
            'gateway_reference' => 'pay_oneway_adv_123',
        ]);

        // Customer returns bike at Store B
        $photoReturn = UploadedFile::fake()->image('return_bike.jpg');

        $returnResponse = $this->postJson("/api/v1/staff/bookings/{$booking->id}/return", [
            'odometer_reading' => 10350,
            'condition_photos' => [$photoReturn],
            'return_store_id' => $this->storeB->id,
            'late_fee_override' => 0.00,
            'damage_fee' => 250.00,
            'notes' => 'Customer dropped off at Indiranagar store as agreed.',
        ]);

        $returnResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'returned');

        // 1. Confirm Booking status and return store
        $booking->refresh();
        $this->assertEquals(BookingStatus::RETURNED, $booking->status);
        $this->assertEquals($this->storeB->id, $booking->return_store_id);
        $this->assertEquals(250.00, (float) $booking->damage_fee_amount);

        // 2. Crucial: Confirm Bike's current_store_id was updated to Store B and status to AVAILABLE
        $this->bike->refresh();
        $this->assertEquals($this->storeB->id, $this->bike->current_store_id, 'Bike current_store_id must update to the return store!');
        $this->assertEquals(BikeStatus::AVAILABLE, $this->bike->status);
        $this->assertEquals(10350, $this->bike->odometer_reading);

        // 3. Confirm deposit refund was recorded (2000 deposit - 250 damage = 1750 refund)
        $refund = Refund::where('booking_id', $booking->id)->first();
        $this->assertNotNull($refund);
        $this->assertEquals(1750.00, (float) $refund->amount);
    }

    /**
     * Journey 4: Two simultaneous booking attempts for the same bike/dates, confirming only one succeeds.
     */
    public function test_journey_4_two_simultaneous_booking_attempts_for_same_bike_dates_only_one_succeeds(): void
    {
        $startDate = Carbon::tomorrow()->addDays(10)->toDateString();
        $endDate = Carbon::tomorrow()->addDays(12)->toDateString();

        $customer1 = $this->customer;
        $customer2 = User::create([
            'name' => 'Concurrent Customer',
            'email' => 'concurrent.customer@example.com',
            'phone' => '9888833333',
            'password' => bcrypt('Secret123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        // Attempt 1: Customer 1 books the bike
        Sanctum::actingAs($customer1, ['*']);
        $response1 = $this->withHeader('Idempotency-Key', 'simultaneous-attempt-001')
            ->postJson('/api/v1/bookings/hold', [
                'bike_id' => $this->bike->id,
                'pickup_store_id' => $this->storeA->id,
                'return_store_id' => $this->storeA->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

        $response1->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'held')
            ->assertJsonPath('data.user_id', $customer1->id);

        $booking1Id = $response1->json('data.id');

        // Attempt 2: Customer 2 attempts to book the same bike for overlapping dates
        Sanctum::actingAs($customer2, ['*']);
        $response2 = $this->withHeader('Idempotency-Key', 'simultaneous-attempt-002')
            ->postJson('/api/v1/bookings/hold', [
                'bike_id' => $this->bike->id,
                'pickup_store_id' => $this->storeA->id,
                'return_store_id' => $this->storeA->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

        // Must fail with 422 and unavailable message
        $response2->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Bike is not available for the requested dates.');

        // Verify only 1 booking exists in the database for this bike
        $bookingsCount = Booking::where('bike_id', $this->bike->id)->count();
        $this->assertEquals(1, $bookingsCount);

        // Verify the existing booking belongs to customer 1
        $existingBooking = Booking::where('bike_id', $this->bike->id)->first();
        $this->assertEquals($booking1Id, $existingBooking->id);
        $this->assertEquals($customer1->id, $existingBooking->user_id);

        // Concurrency level test with row locking inside DB transaction:
        // Simulate two threads running AvailabilityService::holdBooking simultaneously
        $availabilityService = app(AvailabilityService::class);
        $nextStartDate = Carbon::tomorrow()->addDays(20)->toDateString();
        $nextEndDate = Carbon::tomorrow()->addDays(22)->toDateString();

        $bookingA = null;
        $bookingB = null;
        $exceptionB = null;

        // Transaction 1 locks the bike and creates hold
        DB::transaction(function () use ($availabilityService, $customer1, $nextStartDate, $nextEndDate, &$bookingA): void {
            $bookingA = $availabilityService->holdBooking([
                'bike_id' => $this->bike->id,
                'user_id' => $customer1->id,
                'pickup_store_id' => $this->storeA->id,
                'return_store_id' => $this->storeA->id,
                'start_date' => $nextStartDate,
                'end_date' => $nextEndDate,
                'channel' => BookingChannel::ONLINE,
                'idempotency_key' => 'concurrent-tx-001',
            ]);
        });

        // Transaction 2 tries to book the overlapping dates and is blocked / throws BikeNotAvailableException
        try {
            DB::transaction(function () use ($availabilityService, $customer2, $nextStartDate, $nextEndDate, &$bookingB): void {
                $bookingB = $availabilityService->holdBooking([
                    'bike_id' => $this->bike->id,
                    'user_id' => $customer2->id,
                    'pickup_store_id' => $this->storeA->id,
                    'return_store_id' => $this->storeA->id,
                    'start_date' => $nextStartDate,
                    'end_date' => $nextEndDate,
                    'channel' => BookingChannel::ONLINE,
                    'idempotency_key' => 'concurrent-tx-002',
                ]);
            });
        } catch (Throwable $e) {
            $exceptionB = $e;
        }

        $this->assertNotNull($bookingA);
        $this->assertEquals(BookingStatus::HELD, $bookingA->status);
        $this->assertNull($bookingB);
        $this->assertInstanceOf(BikeNotAvailableException::class, $exceptionB);
    }
}

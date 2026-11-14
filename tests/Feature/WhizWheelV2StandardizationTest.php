<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\SiteSetting;
use App\Models\Store;
use App\Models\User;
use App\Notifications\BikeManagerBookingAlertNotification;
use App\Notifications\BookingConfirmationNotification;
use App\Notifications\ServiceBookingConfirmedNotification;
use App\Notifications\ServiceManagerBookingAlertNotification;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Honnavar Coastal Hub',
        'address_line' => 'Main Road, Station Approach',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2802,
        'longitude' => 74.4437,
        'phone' => '+918660989586',
        'whatsapp' => '918660989586',
        'email' => 'honnavar@whizwheels.in',
        'operating_hours_label' => 'Open 24/7',
        'services' => ['two_wheelers', 'taxi', 'homestay', 'boating', 'guide'],
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter 125cc',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $this->superAdmin = User::create([
        'name' => 'HQ Super Admin',
        'email' => 'superadmin_std@gkwhizwheel.com',
        'phone' => '9999900010',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->bike1 = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-EA-1001',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'base_daily_rate_override' => 500.00,
        'weekend_daily_rate_override' => 600.00,
        'deposit_amount_override' => 1000.00,
        'odometer_reading' => 1500,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->bike2 = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter 125',
        'registration_number' => 'KA-47-EA-1002',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'base_daily_rate_override' => 500.00,
        'weekend_daily_rate_override' => 600.00,
        'deposit_amount_override' => 1000.00,
        'odometer_reading' => 2200,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

test('public bootstrap API returns site settings and branches with active services', function (): void {
    SiteSetting::set('tagline', 'Coastal Travel Hub • Rides, Stays & Experiences');
    SiteSetting::set('operating_hours_label', 'Open 24/7');

    $response = $this->getJson('/api/v1/public/bootstrap');

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'settings',
                'branches',
            ],
        ]);

    $data = $response->json('data');
    expect($data['settings']['tagline'])->toBe('Coastal Travel Hub • Rides, Stays & Experiences')
        ->and($data['branches'])->not->toBeEmpty()
        ->and($data['branches'][0]['services'])->toContain('two_wheelers', 'taxi', 'boating');
});

test('admin can execute bulk pricing update with flat, amount hike, and percent hike', function (): void {
    // 1. Flat override
    $this->actingAs($this->superAdmin)
        ->post('/admin/bikes/bulk-pricing', [
            'bike_ids' => [$this->bike1->id, $this->bike2->id],
            'type' => 'flat',
            'apply_to' => 'both',
            'weekday_amount' => 700,
            'weekend_amount' => 850,
        ])
        ->assertRedirect();

    expect((float) $this->bike1->fresh()->base_daily_rate_override)->toBe(700.0)
        ->and((float) $this->bike1->fresh()->weekend_daily_rate_override)->toBe(850.0)
        ->and((float) $this->bike2->fresh()->base_daily_rate_override)->toBe(700.0)
        ->and((float) $this->bike2->fresh()->weekend_daily_rate_override)->toBe(850.0);

    // 2. Amount hike
    $this->actingAs($this->superAdmin)
        ->post('/admin/bikes/bulk-pricing', [
            'bike_ids' => [$this->bike1->id],
            'type' => 'amount_hike',
            'apply_to' => 'both',
            'weekday_amount' => 50,
            'weekend_amount' => 100,
        ])
        ->assertRedirect();

    expect((float) $this->bike1->fresh()->base_daily_rate_override)->toBe(750.0)
        ->and((float) $this->bike1->fresh()->weekend_daily_rate_override)->toBe(950.0);
});

test('admin can execute quick inline price update on single bike', function (): void {
    $response = $this->actingAs($this->superAdmin)
        ->postJson("/admin/bikes/{$this->bike1->id}/quick-price", [
            'weekday_rate' => 550,
            'weekend_rate' => 650,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'bike' => [
                'id' => $this->bike1->id,
                'base_daily_rate' => 550.0,
                'weekend_rate' => 650.0,
            ],
        ]);

    expect((float) $this->bike1->fresh()->base_daily_rate_override)->toBe(550.0)
        ->and((float) $this->bike1->fresh()->weekend_daily_rate_override)->toBe(650.0);
});

test('admin can toggle branch services matrix', function (): void {
    $newServices = ['two_wheelers', 'taxi', 'guide'];

    $this->actingAs($this->superAdmin)
        ->post("/admin/stores/{$this->store->id}/services", [
            'services' => $newServices,
        ])
        ->assertRedirect();

    expect($this->store->fresh()->services)->toBe($newServices);
});

test('superadmin can access and update global site settings', function (): void {
    $this->actingAs($this->superAdmin)
        ->get('/admin/settings')
        ->assertOk();

    $this->actingAs($this->superAdmin)
        ->post('/admin/settings', [
            'primary_phone' => '+918660999999',
            'whatsapp_number' => '918660999999',
            'support_email' => 'customercare@whizwheels.in',
            'operating_hours_label' => 'Open 24/7 (All Days)',
            'tagline' => 'Karavali Hub • Bikes, Stays & Coastal Adventures',
            'explore_label' => 'Explore',
            'locations_summary' => 'Honnavar & Murudeshwar Hubs',
            'google_rating_label' => '5.0 Google Rated (450+)',
            'google_rating_value' => '5.0',
            'google_reviews_count' => '450+',
            'google_maps_reviews_url' => 'https://maps.app.goo.gl/example',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SiteSetting::get('primary_phone'))->toBe('+918660999999')
        ->and(SiteSetting::get('support_email'))->toBe('customercare@whizwheels.in')
        ->and(SiteSetting::get('tagline'))->toBe('Karavali Hub • Bikes, Stays & Coastal Adventures');
});

test('phonepe webhook dispatches dual whatsapp and email alerts for bike bookings', function (): void {
    config()->set('services.phonepe.merchant_id', 'PGTESTPAYUAT');
    config()->set('services.phonepe.salt_key', 'test_phonepe_salt_key_123');
    config()->set('services.phonepe.salt_index', '1');

    Notification::fake();

    $customer = User::create([
        'name' => 'Bike Renter',
        'email' => 'renter_v2@example.com',
        'phone' => '918888000011',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $booking = Booking::create([
        'user_id' => $customer->id,
        'bike_id' => $this->bike1->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'booking_reference' => 'BK-V2-NOTIF-01',
        'channel' => \App\Enums\BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => '2026-12-01',
        'end_date' => '2026-12-03',
        'base_amount' => 1500.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 2500.00,
        'price_breakdown_json' => ['phonepe_transaction_id' => "TXN_BK_{$this->bike1->id}_dualalert"],
        'idempotency_key' => 'idemp-v2-bike-notif-01',
    ]);
    $booking->update(['price_breakdown_json' => ['phonepe_transaction_id' => "TXN_BK_{$booking->id}_dualalert"]]);

    $payload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'message' => 'Payment successful',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => "TXN_BK_{$booking->id}_dualalert",
            'transactionId' => 'TXN_GATEWAY_V2_01',
            'amount' => 250000,
            'state' => 'COMPLETED',
        ],
    ];

    $encoded = base64_encode(json_encode($payload, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $encoded.'test_phonepe_salt_key_123').'###1';

    $response = $this->postJson('/webhooks/phonepe', [
        'response' => $encoded,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'PhonePe payment webhook processed and booking confirmed.',
        ]);

    expect($booking->fresh()->status)->toBe(BookingStatus::CONFIRMED);

    Notification::assertSentTo($customer, BookingConfirmationNotification::class);
    Notification::assertSentTo($this->superAdmin, BikeManagerBookingAlertNotification::class);
    Notification::assertSentOnDemand(BikeManagerBookingAlertNotification::class, function ($notification, $channels, $notifiable): bool {
        return ($notifiable->routes['mail'] ?? null) === $this->store->email;
    });
});

test('phonepe webhook dispatches dual whatsapp and email alerts for service bookings', function (): void {
    config()->set('services.phonepe.merchant_id', 'PGTESTPAYUAT');
    config()->set('services.phonepe.salt_key', 'test_phonepe_salt_key_123');
    config()->set('services.phonepe.salt_index', '1');

    Notification::fake();

    $customer = User::create([
        'name' => 'Boating Guest',
        'email' => 'boating_guest@example.com',
        'phone' => '918888000022',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $serviceBooking = ServiceBooking::create([
        'store_id' => $this->store->id,
        'booking_number' => 'SB-V2-NOTIF-01',
        'service_type' => 'boating',
        'user_id' => $customer->id,
        'customer_name' => 'Boating Guest',
        'customer_phone' => '918888000022',
        'customer_email' => 'boating_guest@example.com',
        'total_amount' => 1200.00,
        'advance_paid' => 0.00,
        'balance_due' => 1200.00,
        'payment_status' => 'pending',
        'status' => 'pending',
        'start_datetime' => '2026-12-05 10:00:00',
    ]);

    $payload = [
        'success' => true,
        'code' => 'PAYMENT_SUCCESS',
        'message' => 'Payment successful',
        'data' => [
            'merchantId' => 'PGTESTPAYUAT',
            'merchantTransactionId' => "TXN_SRV_{$serviceBooking->id}_dualalert",
            'transactionId' => 'TXN_GATEWAY_V2_SRV_01',
            'amount' => 120000,
            'state' => 'COMPLETED',
        ],
    ];

    $encoded = base64_encode(json_encode($payload, JSON_THROW_ON_ERROR));
    $checksum = hash('sha256', $encoded.'test_phonepe_salt_key_123').'###1';

    $response = $this->postJson('/webhooks/phonepe', [
        'response' => $encoded,
    ], [
        'X-VERIFY' => $checksum,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'PhonePe payment for service booking verified successfully.',
        ]);

    expect($serviceBooking->fresh()->status)->toBe('confirmed')
        ->and((float) $serviceBooking->fresh()->advance_paid)->toBe(1200.00)
        ->and($serviceBooking->fresh()->payment_status)->toBe('paid');

    Notification::assertSentTo($customer, ServiceBookingConfirmedNotification::class);
    Notification::assertSentTo($this->superAdmin, ServiceManagerBookingAlertNotification::class);
    Notification::assertSentOnDemand(ServiceManagerBookingAlertNotification::class, function ($notification, $channels, $notifiable): bool {
        return ($notifiable->routes['mail'] ?? null) === $this->store->email;
    });
});

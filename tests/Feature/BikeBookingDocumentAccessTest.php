<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;

test('bike confirmation, voucher and printable agreement require booking ownership', function (): void {
    $store = Store::create([
        'name' => 'Document Access Branch',
        'address_line' => 'Station Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Document Access Scooter',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa',
        'registration_number' => 'KA-47-TEST-771',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $owner = User::create([
        'name' => 'Rental Owner',
        'email' => 'rental-owner@example.test',
        'phone' => '9876543210',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $other = User::create([
        'name' => 'Other Customer',
        'email' => 'other-customer@example.test',
        'phone' => '9876543211',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $booking = Booking::create([
        'booking_reference' => 'DOC-TEST-771',
        'bike_id' => $bike->id,
        'user_id' => $owner->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 500,
        'deposit_amount' => 0,
        'total_amount' => 500,
        'price_breakdown_json' => [],
        'idempotency_key' => 'document-access-test-771',
    ]);
    foreach ([
        "/bookings/{$booking->id}/confirmation",
        "/bookings/{$booking->id}/voucher",
        "/bookings/{$booking->id}/print",
    ] as $url) {
        $this->get($url)->assertStatus(401);
        $this->actingAs($other)->get($url)->assertForbidden();
        auth()->logout();
    }
    $this->get("/bookings/{$booking->id}/billing-statement")->assertRedirect('/login');
    $this->actingAs($other)
        ->get("/bookings/{$booking->id}/billing-statement")
        ->assertForbidden();

    $this->actingAs($owner)
        ->get("/bookings/{$booking->id}/confirmation")
        ->assertOk();
    $this->get("/bookings/{$booking->id}/print")->assertOk();
    $this->get("/bookings/{$booking->id}/voucher")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
    $this->get("/bookings/{$booking->id}/billing-statement")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    // An authenticated customer must not receive pickup credentials while
    // the payment webhook has not yet confirmed the rental.
    $booking->update(['status' => BookingStatus::PENDING_PAYMENT]);
    $this->get("/bookings/{$booking->id}/voucher")->assertStatus(409);
    $this->get("/bookings/{$booking->id}/print")->assertStatus(409);
});

test('billing details cannot be replaced after bike payment initiation', function (): void {
    // Validation occurs before a gateway request, so an invalid request is safe to
    // test without actual PhonePe/Razorpay credentials.
    $customer = User::create([
        'name' => 'Billing Customer',
        'email' => 'billing-customer@example.test',
        'phone' => '9876543222',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $store = Store::create([
        'name' => 'Billing Test Branch',
        'address_line' => 'Market Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Billing Test Scooter',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Dio',
        'registration_number' => 'KA-47-TEST-772',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $originalBilling = [
        'type' => 'personal',
        'name' => 'Billing Customer',
        'address' => 'Market Road, Honnavar',
        'state_code' => '29',
    ];
    $booking = Booking::create([
        'booking_reference' => 'DOC-TEST-772',
        'bike_id' => $bike->id,
        'user_id' => $customer->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::PENDING_PAYMENT,
        'start_date' => now()->addDay()->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'base_amount' => 500,
        'deposit_amount' => 0,
        'total_amount' => 500,
        'held_until' => now()->addMinutes(10),
        'price_breakdown_json' => [
            'checkout_payment_option' => 'full',
            'checkout_gateway' => 'phonepe',
            'checkout_billing' => $originalBilling,
        ],
        'idempotency_key' => 'document-access-test-772',
    ]);

    // Billing-enabled checkouts must explicitly accept rental terms.
    $this->actingAs($customer)->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'phonepe',
        'payment_option' => 'full',
        'billing' => $originalBilling,
    ])->assertUnprocessable()->assertJsonValidationErrors(['accept_rental_terms']);

    $this->actingAs($customer)->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'phonepe',
        'payment_option' => 'full',
        'accept_rental_terms' => true,
        'billing' => [
            ...$originalBilling,
            'name' => 'Changed Identity',
        ],
    ])->assertUnprocessable()->assertJsonValidationErrors(['billing']);

    $this->postJson("/api/v1/bookings/{$booking->id}/checkout", [
        'gateway' => 'phonepe',
        'payment_option' => 'full',
        'accept_rental_terms' => true,
        'billing' => [
            'type' => 'business',
            'name' => 'Sample Company',
            'address' => 'Station Road, Honnavar',
            'state_code' => '29',
            'gstin' => '27ABCDE1234F1Z5',
        ],
    ])->assertUnprocessable()->assertJsonValidationErrors(['billing.gstin']);

    expect($booking->fresh()->price_breakdown_json['checkout_billing'])->toBe($originalBilling);
});

test('bike voucher pdf generates strictly a single page document', function (): void {
    $store = Store::create([
        'name' => 'Voucher Page Test Branch',
        'address_line' => 'Palya Main Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.281,
        'longitude' => 74.444,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter 110cc',
        'base_daily_rate' => 450,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-E-0104',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'odometer_reading' => 10186,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $user = User::create([
        'name' => 'Super Admin',
        'email' => 'voucher-admin@example.test',
        'phone' => '9876543233',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $booking = Booking::create([
        'booking_reference' => 'BK-2026-TESTPAGE',
        'bike_id' => $bike->id,
        'user_id' => $user->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'base_amount' => 900,
        'pricing_adjustments_amount' => 100,
        'deposit_amount' => 0,
        'total_amount' => 1180,
        'price_breakdown_json' => [
            'days' => 2,
            'hours' => 32,
            'pickup_time' => '09:00',
            'return_time' => '17:00',
            'base_daily_rate' => 450,
            'bike_gst' => [
                'status' => 'configured',
                'gst_amount' => 180,
                'price_mode' => 'exclusive',
                'taxable_amount' => 1000,
                'total_after_gst' => 1180,
                'gst_rate_percent' => 18,
            ],
            'checkout_billing' => [
                'name' => 'Super Admin',
                'address' => 'Kumta, Karnataka',
            ],
            'checkout_amount' => 100,
            'balance_due_on_pickup' => 1080,
        ],
        'idempotency_key' => 'voucher-single-page-test-1',
    ]);

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('vouchers.bike_voucher', [
        'booking' => $booking->loadMissing(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user', 'payments']),
        'qrDataUri' => app(\App\Services\QrCodeService::class)->generateDataUri(route('bookings.confirmation', $booking->id)),
        'isPdf' => true,
    ])->setPaper('a4', 'portrait');

    $dompdf = $pdf->getDomPDF();
    $dompdf->render();
    expect($dompdf->getCanvas()->get_page_count())->toBe(1);
});

test('bike billing statement pdf generates strictly a single page document', function (): void {
    $store = Store::create([
        'name' => 'Honnavar Station Hub',
        'address_line' => 'Palya Main Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.28,
        'longitude' => 74.44,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter 110cc',
        'base_daily_rate' => 450,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-E-0104',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $user = User::create([
        'name' => 'Billing Verification Customer',
        'email' => 'billing-singlepage@example.test',
        'phone' => '9876543299',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $booking = Booking::create([
        'booking_reference' => 'BK-2026-BILLPAGE',
        'bike_id' => $bike->id,
        'user_id' => $user->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'base_amount' => 900,
        'pricing_adjustments_amount' => 100,
        'deposit_amount' => 0,
        'total_amount' => 1180,
        'price_breakdown_json' => [
            'days' => 2,
            'hours' => 32,
            'pickup_time' => '09:00',
            'return_time' => '17:00',
            'base_daily_rate' => 450,
            'bike_gst' => [
                'status' => 'configured',
                'gst_amount' => 180,
                'price_mode' => 'exclusive',
                'taxable_amount' => 1000,
                'total_after_gst' => 1180,
                'gst_rate_percent' => 18,
            ],
            'checkout_billing' => [
                'name' => 'Billing Customer',
                'address' => 'Kumta, Karnataka',
            ],
            'checkout_amount' => 100,
            'balance_due_on_pickup' => 1080,
        ],
        'idempotency_key' => 'billing-single-page-test-1',
    ]);

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('vouchers.bike_billing_statement', [
        'booking' => $booking->loadMissing(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user', 'payments']),
        'billing' => ($booking->price_breakdown_json ?? [])['checkout_billing'] ?? null,
        'tax' => ($booking->price_breakdown_json ?? [])['bike_gst'] ?? null,
        'payments' => collect(),
        'paid' => 100.0,
        'balance' => 1080.0,
        'qrDataUri' => app(\App\Services\QrCodeService::class)->generateDataUri(route('bookings.confirmation', $booking->id)),
    ])->setPaper('a4', 'portrait');

    $dompdf = $pdf->getDomPDF();
    $dompdf->render();
    expect($dompdf->getCanvas()->get_page_count())->toBe(1);
});

test('booking checkin qr endpoint returns png binary and notification attaches it', function (): void {
    $store = Store::create([
        'name' => 'QR Checkin Branch',
        'address_line' => 'Palya Road',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.28,
        'longitude' => 74.44,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Standard Scooter',
        'base_daily_rate' => 450,
        'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-E-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $user = User::create([
        'name' => 'QR Customer',
        'email' => 'qr-customer@example.test',
        'phone' => '9876543288',
        'password' => bcrypt('testing-password'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $booking = Booking::create([
        'booking_reference' => 'BK-2026-QRTEST',
        'bike_id' => $bike->id,
        'user_id' => $user->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'base_amount' => 450,
        'deposit_amount' => 0,
        'total_amount' => 531,
        'price_breakdown_json' => [],
        'idempotency_key' => 'qr-endpoint-test-1',
    ]);

    // Test QR endpoint
    $response = $this->actingAs($user)->get("/bookings/{$booking->id}/qr");
    $response->assertOk();
    $response->assertHeader('content-type', 'image/png');
    expect(str_starts_with($response->getContent(), "\x89PNG"))->toBeTrue();

    // Test notification representation
    $notification = new \App\Notifications\BookingConfirmationNotification($booking);
    $mail = $notification->toMail($user);
    expect($mail->rawAttachments)->not->toBeEmpty();
    expect($mail->rawAttachments[0]['options']['mime'])->toBe('image/png');

    $waMessage = $notification->toWhatsApp($user);
    expect($waMessage->documentUrl)->toBe(route('bookings.qr', $booking->id));
    expect($waMessage->buttonUrl)->toBe(route('bookings.confirmation', $booking->id));
});

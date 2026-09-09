<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Channels\WhatsAppChannel;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\NotificationLog;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use App\Notifications\ServiceBookingConfirmedNotification;
use App\Notifications\ServiceManagerBookingAlertNotification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Mail::fake();

    config()->set('services.whatsapp.token', 'test_meta_wa_token');
    config()->set('services.whatsapp.phone_number_id', '109876543210');
    config()->set('services.whatsapp.webhook_verify_token', 'whizwheel_verify_secret_123');

    $this->customer = User::create([
        'name' => 'Aditi Sharma',
        'email' => 'aditi.traveler@example.com',
        'phone' => '9876543299',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->boatingManager = User::create([
        'name' => 'Ramesh Captain',
        'email' => 'boating.manager@whizwheel.com',
        'phone' => '9481512342',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->boatingManager->syncAssignedServices(['boating']);

    $this->serviceItem = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sharavathi Sunset Shikara',
        'category' => 'Sunset Cruise Yacht',
        'description' => 'Tranquil sunset boating through the backwaters of Sharavathi river.',
        'price_base' => 1500.00,
        'price_unit' => 'per_trip',
        'status' => 'available',
        'features' => ['Life Jackets Included', 'Certified Boat Master'],
    ]);

    $this->serviceBooking = ServiceBooking::create([
        'booking_number' => 'GKW-BT-260909-TEST',
        'service_type' => 'boating',
        'service_item_id' => $this->serviceItem->id,
        'user_id' => $this->customer->id,
        'customer_name' => $this->customer->name,
        'customer_phone' => $this->customer->phone,
        'customer_email' => $this->customer->email,
        'booking_channel' => 'online',
        'start_datetime' => Carbon::now()->addDays(2)->setTime(16, 0),
        'end_datetime' => Carbon::now()->addDays(2)->setTime(18, 0),
        'pickup_location' => 'Sharavathi Boating Jetty, Mavinkurve, Honnavar (14.2755° N, 74.4312° E)',
        'quantity' => 1,
        'base_amount' => 1500.00,
        'tax_amount' => 0.00,
        'discount_amount' => 0.00,
        'total_amount' => 1500.00,
        'advance_paid' => 450.00,
        'balance_due' => 1050.00,
        'payment_status' => 'partial',
        'payment_method' => 'online',
        'status' => 'confirmed',
    ]);
});

test('ServiceBookingConfirmedNotification formats WhatsApp payload with coordinator details and voucher deep-link', function (): void {
    $notification = new ServiceBookingConfirmedNotification($this->serviceBooking);
    $waMessage = $notification->toWhatsApp($this->customer);

    expect($waMessage->template)->toBe('service_booking_confirmed');
    expect($waMessage->parameters)->toContain('Aditi Sharma');
    expect($waMessage->parameters)->toContain('GKW-BT-260909-TEST');
    expect($waMessage->parameters)->toContain('Sharavathi Sunset Shikara');
    expect($waMessage->buttonUrl)->toBe(url('/services/booking/confirmation/GKW-BT-260909-TEST'));
});

test('ServiceBookingConfirmedNotification formats Mail message with coordinator and balance breakdown', function (): void {
    $notification = new ServiceBookingConfirmedNotification($this->serviceBooking);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toBe('Service Booking Confirmed - GKW-BT-260909-TEST');
    expect($mail->actionUrl)->toBe(url('/services/booking/confirmation/GKW-BT-260909-TEST'));
});

test('ServiceBookingConfirmedNotification via channels fallback correctly', function (): void {
    $notification = new ServiceBookingConfirmedNotification($this->serviceBooking);
    $channels = $notification->via($this->customer);

    expect($channels)->toContain(WhatsAppChannel::class);
    expect($channels)->toContain('mail');

    // Test fallback when WhatsApp failed previously
    NotificationLog::create([
        'user_id' => $this->customer->id,
        'service_booking_id' => $this->serviceBooking->id,
        'channel' => NotificationChannel::WHATSAPP,
        'template' => 'service_booking_confirmed',
        'status' => NotificationStatus::FAILED,
        'error_message' => 'Meta API Timeout',
        'sent_at' => now()->subHour(),
    ]);

    expect($notification->via($this->customer))->toBe(['mail']);
});

test('ServiceManagerBookingAlertNotification formats WhatsApp and Mail payloads for manager console', function (): void {
    $notification = new ServiceManagerBookingAlertNotification($this->serviceBooking);
    $waMessage = $notification->toWhatsApp($this->boatingManager);

    expect($waMessage->template)->toBe('service_manager_booking_alert');
    expect($waMessage->parameters)->toContain('Ramesh Captain');
    expect($waMessage->parameters)->toContain('GKW-BT-260909-TEST');
    expect($waMessage->buttonUrl)->toBe(url("/admin/services/boating/bookings/{$this->serviceBooking->id}"));

    $mail = $notification->toMail($this->boatingManager);
    expect($mail->subject)->toContain('New Service Booking Alert - GKW-BT-260909-TEST');
    expect($mail->actionUrl)->toBe(url("/admin/services/boating/bookings/{$this->serviceBooking->id}"));
});

test('online service booking creation dispatches customer confirmation and manager alert with notification_logs', function (): void {
    Http::fake([
        'https://graph.facebook.com/*' => Http::response([
            'messaging_product' => 'whatsapp',
            'contacts' => [['input' => '919876543299', 'wa_id' => '919876543299']],
            'messages' => [['id' => 'wamid.HBgMOTExMjM0NTY3OAA=']],
        ], 200),
    ]);

    $response = $this->actingAs($this->customer)->post(route('services.book'), [
        'service_type' => 'boating',
        'service_item_id' => $this->serviceItem->id,
        'customer_name' => 'Aditi Sharma',
        'customer_phone' => '9876543299',
        'customer_email' => 'aditi.traveler@example.com',
        'start_datetime' => Carbon::tomorrow()->setTime(10, 0)->toDateTimeString(),
        'pickup_location' => 'Sharavathi Jetty, Honnavar',
        'quantity' => 1,
        'payment_method' => 'online',
        'pay_option' => 'advance',
    ]);

    $response->assertRedirect();

    $newBooking = ServiceBooking::where('customer_email', 'aditi.traveler@example.com')
        ->where('id', '!=', $this->serviceBooking->id)
        ->latest('id')
        ->first();

    expect($newBooking)->not->toBeNull();

    // Verify customer notification log with service_booking_id
    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'service_booking_id' => $newBooking->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'service_booking_confirmed',
        'status' => NotificationStatus::SENT->value,
    ]);

    // Verify manager alert notification log with service_booking_id
    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->boatingManager->id,
        'service_booking_id' => $newBooking->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'service_manager_booking_alert',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('admin offline counter booking dispatches customer confirmation notification', function (): void {
    Http::fake([
        'https://graph.facebook.com/*' => Http::response([
            'messaging_product' => 'whatsapp',
            'contacts' => [['input' => '919876543299', 'wa_id' => '919876543299']],
            'messages' => [['id' => 'wamid.HBgMOTExMjM0NTY3OAA=']],
        ], 200),
    ]);

    $response = $this->actingAs($this->boatingManager)->post(route('admin.services.bookings.store', 'boating'), [
        'customer_name' => 'Walkin Guest',
        'customer_phone' => '9876543299',
        'customer_email' => 'walkin@example.com',
        'service_item_id' => $this->serviceItem->id,
        'start_datetime' => Carbon::tomorrow()->setTime(11, 0)->toDateTimeString(),
        'pickup_location' => 'Sharavathi Jetty, Mavinkurve',
        'quantity' => 2,
        'base_amount' => 3000.00,
        'advance_paid' => 1000.00,
        'booking_channel' => 'offline_walkin',
        'payment_method' => 'cash',
        'status' => 'confirmed',
    ]);

    $response->assertRedirect(route('admin.services.bookings.index', 'boating'));

    $offlineBooking = ServiceBooking::where('customer_name', 'Walkin Guest')->first();
    expect($offlineBooking)->not->toBeNull();

    // Verify notification log created with service_booking_id
    $this->assertDatabaseHas('notification_logs', [
        'service_booking_id' => $offlineBooking->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'service_booking_confirmed',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('customer payment verification sends updated notification to customer', function (): void {
    Http::fake([
        'https://graph.facebook.com/*' => Http::response([
            'messaging_product' => 'whatsapp',
            'contacts' => [['input' => '919876543299', 'wa_id' => '919876543299']],
            'messages' => [['id' => 'wamid.HBgMOTExMjM0NTY3OAA=']],
        ], 200),
    ]);

    $response = $this->actingAs($this->customer)->postJson(
        route('services.booking.verify-payment', $this->serviceBooking->booking_number),
        [
            'razorpay_payment_id' => 'pay_test_service_full_settle',
            'amount' => 1050.00,
        ]
    );

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Payment verified successfully.',
        ]);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'service_booking_id' => $this->serviceBooking->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'service_booking_confirmed',
        'status' => NotificationStatus::SENT->value,
    ]);
});

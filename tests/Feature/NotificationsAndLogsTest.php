<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use App\Notifications\BookingConfirmationNotification;
use App\Notifications\LateFeeAlertNotification;
use App\Notifications\PaymentReceiptNotification;
use App\Notifications\PickupReminderNotification;
use App\Notifications\RefundStatusNotification;
use App\Notifications\ReturnReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Mail::fake();

    $this->store = Store::create([
        'name' => 'Whitefield Hub',
        'code' => 'WTF-01',
        'address_line' => 'ITPL Main Road, Whitefield',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560066',
        'latitude' => 12.9856,
        'longitude' => 77.7374,
        'phone' => '9876500003',
        'is_active' => true,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Electric Scooter',
        'base_daily_rate' => 600.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Ather',
        'model_name' => '450X',
        'registration_number' => 'KA-03-EV-1001',
        'fuel_type' => FuelType::ELECTRIC,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 2500,
    ]);

    $this->customer = User::create([
        'name' => 'Ravi Kumar',
        'email' => 'ravi.kumar@example.com',
        'phone' => '9876511111',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->booking = Booking::create([
        'booking_reference' => 'BK-NOTIF-TEST-01',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-11-10',
        'end_date' => '2026-11-12',
        'base_amount' => 1200.00,
        'deposit_amount' => 1500.00,
        'total_amount' => 2700.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-notif-01',
    ]);
});

test('BookingConfirmationNotification sends email and logs attempt to notification_logs table', function (): void {
    $notification = new BookingConfirmationNotification($this->booking);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toContain('BK-NOTIF-TEST-01');
    expect($notification->template())->toBe('booking_confirmation');
    expect($notification->bookingId())->toBe($this->booking->id);

    $this->customer->notify($notification);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('PaymentReceiptNotification sends email and logs attempt to notification_logs table', function (): void {
    $payment = Payment::create([
        'booking_id' => $this->booking->id,
        'type' => PaymentType::ADVANCE,
        'amount' => 2700.00,
        'method' => PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_receipt_test_7788',
        'status' => PaymentStatus::SUCCESS,
        'notes' => 'Advance + deposit',
    ]);

    $notification = new PaymentReceiptNotification($payment, $this->booking);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toContain('2,700.00');
    expect($mail->subject)->toContain('pay_receipt_test_7788');
    expect($notification->template())->toBe('payment_receipt');

    $this->customer->notify($notification);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'payment_receipt',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('PickupReminderNotification sends email and logs attempt to notification_logs table', function (): void {
    $notification = new PickupReminderNotification($this->booking);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toContain('BK-NOTIF-TEST-01');
    expect($notification->template())->toBe('pickup_reminder');

    $this->customer->notify($notification);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'pickup_reminder',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('ReturnReminderNotification sends email and logs attempt to notification_logs table', function (): void {
    $notification = new ReturnReminderNotification($this->booking);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toContain('BK-NOTIF-TEST-01');
    expect($notification->template())->toBe('return_reminder');

    $this->customer->notify($notification);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'return_reminder',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('LateFeeAlertNotification sends email and logs attempt to notification_logs table', function (): void {
    $notification = new LateFeeAlertNotification($this->booking, 450.00, 3);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toContain('BK-NOTIF-TEST-01');
    expect($notification->template())->toBe('late_fee_alert');

    $this->customer->notify($notification);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'late_fee_alert',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('RefundStatusNotification sends email and logs attempt to notification_logs table', function (): void {
    $refund = Refund::create([
        'booking_id' => $this->booking->id,
        'amount' => 1500.00,
        'reason' => 'Security deposit refund after bike inspection',
        'processed_by' => $this->customer->id,
        'gateway_reference' => 'rfnd_test_998811',
        'status' => RefundStatus::COMPLETED,
    ]);

    $notification = new RefundStatusNotification($refund, $this->booking);
    $mail = $notification->toMail($this->customer);

    expect($mail->subject)->toContain('1,500.00');
    expect($notification->template())->toBe('refund_status');

    $this->customer->notify($notification);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'refund_status',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('failed notification send attempts are logged with failed status and error message', function (): void {
    $notification = new BookingConfirmationNotification($this->booking);

    // Simulate NotificationFailed event
    event(new NotificationFailed(
        $this->customer,
        $notification,
        'mail',
        ['exception' => new \RuntimeException('SMTP Connection Timeout')]
    ));

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::FAILED->value,
        'error_message' => 'SMTP Connection Timeout',
    ]);
});

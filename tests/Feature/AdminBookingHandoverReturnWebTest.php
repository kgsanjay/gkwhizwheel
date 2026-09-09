<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeConditionStage;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeConditionLog;
use App\Models\Booking;
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');

    $this->storeHonnavar = Store::create([
        'name' => 'Honnavar Town Hub',
        'address_line' => 'Sharavathi Circle',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2800,
        'longitude' => 74.4500,
        'phone' => '9876543210',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->storeMavinkurve = Store::create([
        'name' => 'Mavinkurve Jetty Hub',
        'address_line' => 'Jetty Road',
        'city' => 'Mavinkurve',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2900,
        'longitude' => 74.4600,
        'phone' => '9876543211',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser & Scooter',
        'base_daily_rate' => 600.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeHonnavar->id,
        'home_store_id' => $this->storeHonnavar->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-EA-1001',
        'odometer_reading' => 1250,
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer = User::create([
        'name' => 'Anand Hegde',
        'email' => 'anand@example.com',
        'phone' => '9988776655',
        'password' => bcrypt('secret123'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->admin = User::create([
        'name' => 'Operations Manager',
        'email' => 'admin@gkwhizwheel.com',
        'phone' => '9900112233',
        'password' => bcrypt('admin123'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('admin booking index returns bike odometer, rate, and condition log payload for wizards', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'WHIZ-TEST-101',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->storeHonnavar->id,
        'return_store_id' => $this->storeHonnavar->id,
        'start_date' => Carbon::today()->toDateString(),
        'end_date' => Carbon::tomorrow()->toDateString(),
        'base_amount' => 1200.00,
        'total_amount' => 1200.00,
        'price_breakdown_json' => ['base_rate' => 600, 'total' => 1200],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        'deposit_amount' => 1500.00,
        'status' => BookingStatus::CONFIRMED,
        'channel' => BookingChannel::ONLINE,
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.bookings.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Bookings/Index')
        ->has('bookings.data', 1)
        ->where('bookings.data.0.booking_reference', 'WHIZ-TEST-101')
        ->where('bookings.data.0.bike.odometer_reading', 1250)
        ->has('bookings.data.0.condition_logs')
    );
});

test('staff can successfully complete bike handover with photos and signature', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'WHIZ-HANDOVER-201',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->storeHonnavar->id,
        'return_store_id' => $this->storeHonnavar->id,
        'start_date' => Carbon::today()->toDateString(),
        'end_date' => Carbon::tomorrow()->toDateString(),
        'base_amount' => 1200.00,
        'total_amount' => 1200.00,
        'price_breakdown_json' => ['base_rate' => 600, 'total' => 1200],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        'deposit_amount' => 1500.00,
        'status' => BookingStatus::CONFIRMED,
        'channel' => BookingChannel::ONLINE,
    ]);

    $photo1 = UploadedFile::fake()->image('front_inspection.jpg');
    $photo2 = UploadedFile::fake()->image('odometer_cluster.jpg');

    $response = $this->actingAs($this->admin)->post(route('admin.bookings.handover', $booking->id), [
        'odometer_reading' => 1260,
        'helmets_issued' => 2,
        'fuel_level' => 'Full (100%)',
        'notes' => 'Tires inspected, clean condition.',
        'signature' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'condition_photos' => [$photo1, $photo2],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $booking->refresh();
    expect($booking->status)->toBe(BookingStatus::HANDED_OVER);
    expect($booking->agreement_signed_at)->not->toBeNull();

    $this->bike->refresh();
    expect($this->bike->status)->toBe(BikeStatus::ON_RENT);
    expect($this->bike->odometer_reading)->toBe(1260);

    $this->assertDatabaseHas('bike_condition_logs', [
        'booking_id' => $booking->id,
        'stage' => BikeConditionStage::HANDOVER->value,
        'odometer_reading' => 1260,
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'subject_type' => Booking::class,
        'subject_id' => $booking->id,
        'action' => 'booking_handed_over',
    ]);
});

test('handover rejects bookings that are not in confirmed status', function (): void {
    $booking = Booking::create([
        'booking_reference' => 'WHIZ-CANCELLED-301',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->storeHonnavar->id,
        'return_store_id' => $this->storeHonnavar->id,
        'start_date' => Carbon::today()->toDateString(),
        'end_date' => Carbon::tomorrow()->toDateString(),
        'base_amount' => 1200.00,
        'total_amount' => 1200.00,
        'price_breakdown_json' => ['base_rate' => 600, 'total' => 1200],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        'deposit_amount' => 1500.00,
        'status' => BookingStatus::CANCELLED,
        'channel' => BookingChannel::ONLINE,
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.bookings.handover', $booking->id), [
        'odometer_reading' => 1270,
        'helmets_issued' => 1,
    ]);

    $response->assertSessionHasErrors('booking');
});

test('staff can process return with multi-store relocation and automatic deposit settlement', function (): void {
    $this->bike->update([
        'status' => BikeStatus::ON_RENT,
        'odometer_reading' => 1260,
    ]);

    $booking = Booking::create([
        'booking_reference' => 'WHIZ-RETURN-401',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->storeHonnavar->id,
        'return_store_id' => $this->storeHonnavar->id,
        'start_date' => Carbon::yesterday()->toDateString(),
        'end_date' => Carbon::today()->toDateString(),
        'base_amount' => 1200.00,
        'total_amount' => 1200.00,
        'price_breakdown_json' => ['base_rate' => 600, 'total' => 1200],
        'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
        'deposit_amount' => 2000.00,
        'status' => BookingStatus::HANDED_OVER,
        'channel' => BookingChannel::ONLINE,
    ]);

    // Initial handover log
    BikeConditionLog::create([
        'booking_id' => $booking->id,
        'stage' => BikeConditionStage::HANDOVER,
        'odometer_reading' => 1260,
        'logged_by' => $this->admin->id,
    ]);

    $returnPhoto = UploadedFile::fake()->image('return_photo.jpg');

    // Customer returns bike at Mavinkurve Jetty Hub instead of Honnavar
    // with 200 km driven, 300 damage fee, and 0 late fee
    $response = $this->actingAs($this->admin)->post(route('admin.bookings.return', $booking->id), [
        'odometer_reading' => 1460,
        'return_store_id' => $this->storeMavinkurve->id,
        'damage_fee' => 300.00,
        'late_fee_override' => 0.00,
        'deposit_refund_amount' => 1700.00,
        'notes' => 'Returned at jetty point in good order, minor scrape settled.',
        'condition_photos' => [$returnPhoto],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $booking->refresh();
    expect($booking->status)->toBe(BookingStatus::RETURNED);
    expect($booking->return_store_id)->toBe($this->storeMavinkurve->id);
    expect((float) $booking->damage_fee_amount)->toBe(300.00);

    // Bike relocated and AVAILABLE at Mavinkurve store
    $this->bike->refresh();
    expect($this->bike->status)->toBe(BikeStatus::AVAILABLE);
    expect($this->bike->current_store_id)->toBe($this->storeMavinkurve->id);
    expect($this->bike->odometer_reading)->toBe(1460);

    // Return condition logged
    $this->assertDatabaseHas('bike_condition_logs', [
        'booking_id' => $booking->id,
        'stage' => BikeConditionStage::RETURN->value,
        'odometer_reading' => 1460,
    ]);

    // Security deposit refund settled (2000 deposit - 300 damage = 1700)
    $this->assertDatabaseHas('refunds', [
        'booking_id' => $booking->id,
        'amount' => 1700.00,
        'status' => RefundStatus::COMPLETED->value,
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'subject_type' => Booking::class,
        'subject_id' => $booking->id,
        'action' => 'booking_returned',
        'store_id' => $this->storeMavinkurve->id,
    ]);
});

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Mail::fake();

    config()->set('compliance.document_expiry.alert_threshold_days', 15);
    config()->set('compliance.document_expiry.grace_period_days', 7);
    config()->set('compliance.document_expiry.hard_block_expired', true);
    config()->set('services.whatsapp.token', 'test_wa_token');
    config()->set('services.whatsapp.phone_number_id', '109876543210');

    $this->store = Store::create([
        'name' => 'Indiranagar Hub',
        'code' => 'IND-01',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500002',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 900.00,
        'default_deposit_amount' => 2500.00,
    ]);

    $this->admin = User::create([
        'name' => 'HQ Super Admin',
        'email' => 'admin@gkwhizwheel.com',
        'phone' => '9876543210',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('detects certificates nearing expiry and leaves bike available without blocking', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Meteor 350',
        'registration_number' => 'KA-01-AB-1111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
    ]);

    // Document expires in 5 days (within 15-day alert window)
    BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
        'file_path' => 'documents/emission_1111.pdf',
        'issue_date' => Carbon::today()->subMonths(6),
        'expiry_date' => Carbon::today()->addDays(5),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry')
        ->assertSuccessful();

    $bike->refresh();
    expect($bike->status)->toBe(BikeStatus::AVAILABLE);
});

test('expired document within grace period is flagged with warning and not hard blocked', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'Hness CB350',
        'registration_number' => 'KA-01-AB-2222',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 3000,
    ]);

    // Expired 3 days ago (within 7-day grace period)
    BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/insurance_2222.pdf',
        'issue_date' => Carbon::today()->subYear(),
        'expiry_date' => Carbon::today()->subDays(3),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry')
        ->assertSuccessful();

    $bike->refresh();
    // Still available because grace period is active
    expect($bike->status)->toBe(BikeStatus::AVAILABLE);

    // No hard block activity log created
    expect(ActivityLog::where('action', 'bike_auto_blocked_document_expired')->count())->toBe(0);
});

test('expired document past grace period hard-blocks available bike to maintenance and logs activity', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Bajaj',
        'model_name' => 'Dominar 400',
        'registration_number' => 'KA-01-AB-3333',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 12000,
    ]);

    // Expired 10 days ago (past 7-day grace period)
    $doc = BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/insurance_3333.pdf',
        'issue_date' => Carbon::today()->subYear(),
        'expiry_date' => Carbon::today()->subDays(10),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry')
        ->assertSuccessful();

    $bike->refresh();
    // Auto-blocked to maintenance
    expect($bike->status)->toBe(BikeStatus::MAINTENANCE);

    // Activity log recorded
    $log = ActivityLog::where('action', 'bike_auto_blocked_document_expired')->first();
    expect($log)->not->toBeNull();
    expect($log->subject_id)->toBe($bike->id);
    expect($log->subject_type)->toBe(Bike::class);
    expect($log->old_values['status'])->toBe(BikeStatus::AVAILABLE->value);
    expect($log->new_values['status'])->toBe(BikeStatus::MAINTENANCE->value);
    expect($log->new_values['document_id'])->toBe($doc->id);
});

test('bike currently on_rent is not disrupted when document is expired', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Yamaha',
        'model_name' => 'Aerox 155',
        'registration_number' => 'KA-01-AB-4444',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::ON_RENT,
        'odometer_reading' => 8000,
    ]);

    // Expired 12 days ago
    BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
        'file_path' => 'documents/emission_4444.pdf',
        'issue_date' => Carbon::today()->subMonths(6),
        'expiry_date' => Carbon::today()->subDays(12),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry')
        ->assertSuccessful();

    $bike->refresh();
    // Active rental status remains untouched
    expect($bike->status)->toBe(BikeStatus::ON_RENT);
});

test('configurable --no-block option prevents auto-blocking of expired bikes', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'TVS',
        'model_name' => 'Ronin',
        'registration_number' => 'KA-01-AB-5555',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 4500,
    ]);

    // Expired 15 days ago
    BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/insurance_5555.pdf',
        'issue_date' => Carbon::today()->subYear(),
        'expiry_date' => Carbon::today()->subDays(15),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry --no-block')
        ->assertSuccessful();

    $bike->refresh();
    expect($bike->status)->toBe(BikeStatus::AVAILABLE);
});

test('configurable --grace-days option dynamically extends grace period', function (): void {
    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'KTM',
        'model_name' => 'Duke 250',
        'registration_number' => 'KA-01-AB-6666',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 7000,
    ]);

    // Expired 10 days ago (past default 7-day grace period, but within custom 14-day grace period)
    BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/insurance_6666.pdf',
        'issue_date' => Carbon::today()->subYear(),
        'expiry_date' => Carbon::today()->subDays(10),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry --grace-days=14')
        ->assertSuccessful();

    $bike->refresh();
    // Remains available because 10 <= 14
    expect($bike->status)->toBe(BikeStatus::AVAILABLE);
});

test('dry-run option does not mutate bike statuses or dispatch notifications', function (): void {
    Notification::fake();

    $bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Hero',
        'model_name' => 'Xpulse 200',
        'registration_number' => 'KA-01-AB-7777',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 9000,
    ]);

    BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/insurance_7777.pdf',
        'issue_date' => Carbon::today()->subYear(),
        'expiry_date' => Carbon::today()->subDays(20),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry --dry-run')
        ->assertSuccessful();

    $bike->refresh();
    expect($bike->status)->toBe(BikeStatus::AVAILABLE);
    Notification::assertNothingSent();
});

test('command dispatches BikeDocumentExpiryAlertNotification via Email and WhatsApp to admins', function (): void {
    Http::fake([
        'https://graph.facebook.com/*' => Http::response([
            'messaging_product' => 'whatsapp',
            'contacts' => [['input' => '919876543210', 'wa_id' => '919876543210']],
            'messages' => [['id' => 'wamid.ADMIN_ALERT_999']],
        ], 200),
    ]);

    $bike1 = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Classic 350',
        'registration_number' => 'KA-01-AB-8888',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 2000,
    ]);

    // 1 expired
    BikeDocument::create([
        'bike_id' => $bike1->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'documents/insurance_8888.pdf',
        'issue_date' => Carbon::today()->subYear(),
        'expiry_date' => Carbon::today()->subDays(10),
        'verified' => true,
    ]);

    $bike2 = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Yamaha',
        'model_name' => 'FZ-X',
        'registration_number' => 'KA-01-AB-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 1500,
    ]);

    // 1 nearing expiry
    BikeDocument::create([
        'bike_id' => $bike2->id,
        'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
        'file_path' => 'documents/emission_9999.pdf',
        'issue_date' => Carbon::today()->subMonths(6),
        'expiry_date' => Carbon::today()->addDays(3),
        'verified' => true,
    ]);

    $this->artisan('bikes:check-document-expiry')
        ->assertSuccessful();

    // Verify WhatsApp channel and Email channel logged in notification_logs table for admin
    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->admin->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'bike_document_expiry',
        'status' => NotificationStatus::SENT->value,
    ]);

    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->admin->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'bike_document_expiry',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('command is registered in the console scheduler to run daily at 06:00', function (): void {
    $schedule = app(Schedule::class);

    $scheduledEvents = collect($schedule->events())->filter(function ($event) {
        return str_contains($event->command ?? '', 'bikes:check-document-expiry');
    });

    expect($scheduledEvents)->not->toBeEmpty();

    $event = $scheduledEvents->first();
    // Daily at 06:00 expression is '0 6 * * *'
    expect($event->expression)->toBe('0 6 * * *');
});

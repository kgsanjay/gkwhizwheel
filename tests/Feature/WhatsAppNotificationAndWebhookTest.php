<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Channels\WhatsAppChannel;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\NotificationLog;
use App\Models\Store;
use App\Models\User;
use App\Notifications\BookingConfirmationNotification;
use App\Notifications\PickupReminderNotification;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Mail::fake();

    config()->set('services.whatsapp.token', 'test_meta_wa_token');
    config()->set('services.whatsapp.phone_number_id', '109876543210');
    config()->set('services.whatsapp.webhook_verify_token', 'whizwheel_verify_secret_123');

    $this->store = Store::create([
        'name' => 'Koramangala Hub',
        'code' => 'KOR-01',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500001',
        'is_active' => true,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Premium Commuter',
        'base_daily_rate' => 750.00,
        'default_deposit_amount' => 2000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Hunter 350',
        'registration_number' => 'KA-05-AB-9988',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 3100,
    ]);

    $this->customer = User::create([
        'name' => 'Arjun Reddy',
        'email' => 'arjun.reddy@example.com',
        'phone' => '9876543210',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->booking = Booking::create([
        'booking_reference' => 'BK-WA-TEST-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-03',
        'base_amount' => 1500.00,
        'deposit_amount' => 2000.00,
        'total_amount' => 3500.00,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-wa-001',
    ]);
});

test('notifications use both WhatsApp and mail channels by default when phone is present', function (): void {
    $notification = new BookingConfirmationNotification($this->booking);
    $channels = $notification->via($this->customer);

    expect($channels)->toContain(WhatsAppChannel::class);
    expect($channels)->toContain('mail');
});

test('PickupReminderNotification WhatsApp payload contains bike documents deep-link', function (): void {
    $notification = new PickupReminderNotification($this->booking);
    $waMessage = $notification->toWhatsApp($this->customer);

    $expectedDocUrl = url("/api/v1/bookings/{$this->booking->id}/documents");

    expect($waMessage->template)->toBe('pickup_reminder');
    expect($waMessage->documentUrl)->toBe($expectedDocUrl);
    expect($waMessage->parameters)->toContain('Arjun Reddy');
    expect($waMessage->parameters)->toContain('BK-WA-TEST-001');
});

test('automatic fallback to email-only when WhatsApp has previously failed in notification_logs', function (): void {
    // Record a failed WhatsApp send in notification_logs for this user and template
    NotificationLog::create([
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::WHATSAPP,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::FAILED,
        'error_message' => 'Meta API HTTP 500 error',
        'sent_at' => now()->subHour(),
    ]);

    $notification = new BookingConfirmationNotification($this->booking);
    $channels = $notification->via($this->customer);

    // Fallback: only mail should be returned
    expect($channels)->toBe(['mail']);
    expect($channels)->not->toContain(WhatsAppChannel::class);
});

test('automatic fallback to email-only when recipient has no phone number', function (): void {
    $customerWithoutPhone = new class () {
        public int $id = 999;

        public string $name = 'No Phone User';

        public string $email = 'nophone@example.com';

        public ?string $phone = null;
    };

    $notification = new BookingConfirmationNotification($this->booking);
    $channels = $notification->via($customerWithoutPhone);

    expect($channels)->toBe(['mail']);
});

test('sending notification dispatches WhatsApp message and creates notification_logs record', function (): void {
    Http::fake([
        'https://graph.facebook.com/*' => Http::response([
            'messaging_product' => 'whatsapp',
            'contacts' => [['input' => '919876543210', 'wa_id' => '919876543210']],
            'messages' => [['id' => 'wamid.HBgMOTExMjM0NTY3OAA=']],
        ], 200),
    ]);

    $notification = new BookingConfirmationNotification($this->booking);
    $this->customer->notify($notification);

    // Assert notification_logs has whatsapp entry
    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::SENT->value,
    ]);

    // Assert notification_logs also has email entry
    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::EMAIL->value,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::SENT->value,
    ]);
});

test('WhatsApp send failure records failed status in notification_logs and allows next send to fallback', function (): void {
    // Force WhatsAppService to throw an exception
    $mockService = \Mockery::mock(WhatsAppService::class);
    $mockService->shouldReceive('sendMessage')
        ->once()
        ->andThrow(new \RuntimeException('Connection to Meta Cloud API refused'));

    $channel = new WhatsAppChannel($mockService);
    $notification = new BookingConfirmationNotification($this->booking);

    // Call send directly
    $result = $channel->send($this->customer, $notification);

    expect($result)->toBeNull();

    // Verify notification_logs has failed record
    $this->assertDatabaseHas('notification_logs', [
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::FAILED->value,
        'error_message' => 'Connection to Meta Cloud API refused',
    ]);

    // Now test fallback: next time via() is checked for this template, it falls back to email-only
    $channels = $notification->via($this->customer);
    expect($channels)->toBe(['mail']);
});

test('GET /webhooks/whatsapp verifies challenge successfully with valid verify token', function (): void {
    $response = $this->get('/webhooks/whatsapp?hub_mode=subscribe&hub_challenge=CHALLENGE_STRING_9988&hub_verify_token=whizwheel_verify_secret_123');

    $response->assertStatus(200);
    expect($response->getContent())->toBe('CHALLENGE_STRING_9988');
});

test('GET /webhooks/whatsapp returns 403 Forbidden with invalid verify token', function (): void {
    $response = $this->get('/webhooks/whatsapp?hub_mode=subscribe&hub_challenge=CHALLENGE_STRING_9988&hub_verify_token=wrong_token');

    $response->assertStatus(403);
});

test('POST /webhooks/whatsapp updates notification_log delivery status to delivered', function (): void {
    $log = NotificationLog::create([
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::WHATSAPP,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::SENT,
        'error_message' => null,
        'sent_at' => now(),
    ]);

    $payload = [
        'object' => 'whatsapp_business_account',
        'entry' => [
            [
                'id' => '1000000001',
                'changes' => [
                    [
                        'value' => [
                            'messaging_product' => 'whatsapp',
                            'metadata' => [
                                'display_phone_number' => '919876543210',
                                'phone_number_id' => '109876543210',
                            ],
                            'statuses' => [
                                [
                                    'id' => 'wamid.HBgMOTExMjM0NTY3OAA=',
                                    'status' => 'delivered',
                                    'timestamp' => '1725555555',
                                    'recipient_id' => '919876543210',
                                ],
                            ],
                        ],
                        'field' => 'messages',
                    ],
                ],
            ],
        ],
    ];

    $response = $this->postJson('/webhooks/whatsapp', $payload);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'processed_statuses_count' => 1,
            ],
        ]);

    $log->refresh();
    expect($log->status)->toBe(NotificationStatus::DELIVERED);
});

test('POST /webhooks/whatsapp updates notification_log status to failed with error message', function (): void {
    $log = NotificationLog::create([
        'user_id' => $this->customer->id,
        'booking_id' => $this->booking->id,
        'channel' => NotificationChannel::WHATSAPP,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::SENT,
        'error_message' => null,
        'sent_at' => now(),
    ]);

    $payload = [
        'object' => 'whatsapp_business_account',
        'entry' => [
            [
                'id' => '1000000001',
                'changes' => [
                    [
                        'value' => [
                            'messaging_product' => 'whatsapp',
                            'statuses' => [
                                [
                                    'id' => 'wamid.HBgMOTExMjM0NTY3OAA=',
                                    'status' => 'failed',
                                    'recipient_id' => '919876543210',
                                    'errors' => [
                                        [
                                            'code' => 131026,
                                            'title' => 'Message undeliverable',
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->postJson('/webhooks/whatsapp', $payload);

    $response->assertStatus(200);

    $log->refresh();
    expect($log->status)->toBe(NotificationStatus::FAILED);
    expect($log->error_message)->toContain('131026');
});

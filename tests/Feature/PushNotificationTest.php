<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Channels\ExpoPushChannel;
use App\Channels\WhatsAppChannel;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use App\Notifications\BookingConfirmationNotification;
use App\Notifications\PickupReminderNotification;
use App\Notifications\ReturnReminderNotification;
use App\Services\ExpoPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_expo_push_token(): void
    {
        $user = User::factory()->create([
            'expo_push_token' => null,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/customer/push-token', [
            'expo_push_token' => 'ExponentPushToken[AbCdEf123456_testToken]',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Expo push token registered successfully.',
                'data' => [
                    'expo_push_token' => 'ExponentPushToken[AbCdEf123456_testToken]',
                ],
            ]);

        $this->assertEquals(
            'ExponentPushToken[AbCdEf123456_testToken]',
            $user->fresh()->expo_push_token
        );
    }

    public function test_customer_can_deregister_push_token(): void
    {
        $user = User::factory()->create([
            'expo_push_token' => 'ExponentPushToken[OldToken_123]',
        ]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/customer/push-token');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Expo push token removed successfully.',
            ]);

        $this->assertNull($user->fresh()->expo_push_token);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/customer/push-token', [
            'expo_push_token' => 'ExponentPushToken[SomeToken]',
        ]);

        $response->assertUnauthorized();
    }

    public function test_expo_push_service_dispatches_http_request(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    'status' => 'ok',
                    'id' => 'xxxx-xxxx-xxxx',
                ],
            ], 200),
        ]);

        $service = new ExpoPushService();
        $result = $service->sendNotification(
            'ExponentPushToken[Test_12345]',
            'Booking Confirmed! 🛵',
            'Your Honda Activa 6G is ready.',
            ['booking_id' => 101]
        );

        $this->assertEquals('ok', $result['status']);
        Http::assertSent(function ($request) {
            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $request['to'] === 'ExponentPushToken[Test_12345]'
                && $request['title'] === 'Booking Confirmed! 🛵';
        });
    }

    public function test_notifications_include_expo_push_channel_when_user_has_token(): void
    {
        $store = Store::create([
            'name' => 'Honnavar Station Hub',
            'code' => 'HVR-01',
            'address_line' => 'Exit Platform 1, Station Road',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2831,
            'longitude' => 74.4534,
            'phone' => '9480123456',
            'is_active' => true,
        ]);

        $category = BikeCategory::create([
            'name' => 'Scooter',
            'base_daily_rate' => 500.00,
            'default_deposit_amount' => 1000.00,
        ]);

        $bike = Bike::create([
            'category_id' => $category->id,
            'current_store_id' => $store->id,
            'home_store_id' => $store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-9999',
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'daily_rate' => 500,
            'status' => 'available',
        ]);

        $userWithPush = User::factory()->create([
            'phone' => '9480123456',
            'expo_push_token' => 'ExponentPushToken[CustomerDevice123]',
        ]);

        $booking = Booking::create([
            'booking_reference' => 'GKW-TEST-PUSH',
            'user_id' => $userWithPush->id,
            'bike_id' => $bike->id,
            'pickup_store_id' => $store->id,
            'return_store_id' => $store->id,
            'channel' => \App\Enums\BookingChannel::ONLINE,
            'status' => \App\Enums\BookingStatus::CONFIRMED,
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-12',
            'base_amount' => 1200.00,
            'deposit_amount' => 1000.00,
            'total_amount' => 2200.00,
            'price_breakdown_json' => [],
            'idempotency_key' => 'idemp-push-test',
        ]);

        $confirmNotif = new BookingConfirmationNotification($booking);
        $pickupNotif = new PickupReminderNotification($booking);
        $returnNotif = new ReturnReminderNotification($booking);

        // Verify all 3 channels (mail, WhatsAppChannel, ExpoPushChannel) are in via()
        $channels = $confirmNotif->via($userWithPush);
        $this->assertContains('mail', $channels);
        $this->assertContains(WhatsAppChannel::class, $channels);
        $this->assertContains(ExpoPushChannel::class, $channels);

        $pickupChannels = $pickupNotif->via($userWithPush);
        $this->assertContains(ExpoPushChannel::class, $pickupChannels);

        $returnChannels = $returnNotif->via($userWithPush);
        $this->assertContains(ExpoPushChannel::class, $returnChannels);

        // Verify toExpoPush payload structure
        $expoPayload = $confirmNotif->toExpoPush($userWithPush);
        $this->assertArrayHasKey('title', $expoPayload);
        $this->assertArrayHasKey('body', $expoPayload);
        $this->assertArrayHasKey('data', $expoPayload);
        $this->assertEquals('booking_confirmation', $expoPayload['data']['type']);
    }
}

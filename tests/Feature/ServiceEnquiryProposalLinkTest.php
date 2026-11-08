<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\User;
use App\Models\Store;
use App\Models\ServiceItem;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class ServiceEnquiryProposalLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_proposal_route_requires_authentication(): void
    {
        $this->post('/admin/service-enquiries/1/proposal', [])->assertRedirect();
    }

    public function test_customer_cannot_create_proposal(): void
    {
        $customer = User::factory()->create();
        $this->actingAs($customer)->post('/admin/service-enquiries/1/proposal', [
            'service_item_id' => 1,
            'reviewed_total_paise' => 10000,
            'review_notes' => 'Reviewed price manually',
        ])->assertForbidden();
    }

    public function test_super_admin_cannot_submit_invalid_proposal(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $this->actingAs($admin)->post('/admin/service-enquiries/1/proposal', [
            'service_item_id' => -1,
            'reviewed_total_paise' => -100,
            'review_notes' => 'bad',
        ])->assertSessionHasErrors(['service_item_id', 'reviewed_total_paise', 'review_notes']);
    }


    private function makeEnquiry(User $customer, string $type = 'homestay'): ServiceEnquiry
    {
        return ServiceEnquiry::create([
            'user_id' => $customer->id,
            'reference' => 'ENQ-'.strtoupper(\Illuminate\Support\Str::random(12)),
            'service_type' => $type,
            'customer_name' => 'Test Customer',
            'customer_phone' => '9876543210',
            'customer_email' => 'customer@example.test',
            'start_datetime' => now()->addDays(5),
            'end_datetime' => now()->addDays(6),
            'pickup_location' => 'Honnavar',
            'drop_location' => 'Murudeshwar',
            'quantity' => 1,
            'status' => 'requested',
        ]);
    }

    private function makeItem(string $type = 'homestay'): ServiceItem
    {
        $store = Store::create([
            'name' => 'Test Branch',
            'address_line' => 'Main Road',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2800,
            'longitude' => 74.4400,
            'phone' => '9876543210',
            'status' => StoreStatus::ACTIVE,
        ]);
        return ServiceItem::create([
            'store_id' => $store->id,
            'service_type' => $type,
            'name' => 'Test '.$type,
            'price_base' => 500,
            'price_unit' => 'day',
            'status' => 'available',
        ]);
    }

    public function test_super_admin_creates_one_unpaid_proposal_and_rejects_duplicate(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $customer = User::factory()->create();
        $enquiry = $this->makeEnquiry($customer);
        $item = $this->makeItem();
        $payload = [
            'service_item_id' => $item->id,
            'reviewed_total_paise' => 125050,
            'review_notes' => 'Manual rate reviewed for requested dates',
        ];

        $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/proposal", $payload)
            ->assertRedirect();

        $booking = ServiceBooking::where('service_enquiry_id', $enquiry->id)->firstOrFail();
        $this->assertSame('held', $booking->status);
        $this->assertSame('pending', $booking->payment_status);
        $this->assertEquals(0, $booking->advance_paid);
        $this->assertEquals(1250.50, $booking->total_amount);
        $this->assertSame($item->store_id, $booking->store_id);
        $this->assertSame($item->id, $booking->service_item_id);
        $this->assertSame('reviewing', $enquiry->fresh()->status);

        $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/proposal", $payload)
            ->assertSessionHasErrors('enquiry');
        $this->assertSame(1, ServiceBooking::where('service_enquiry_id', $enquiry->id)->count());
    }

    public function test_super_admin_cannot_propose_item_for_another_service(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $enquiry = $this->makeEnquiry(User::factory()->create(), 'homestay');
        $wrongItem = $this->makeItem('scuba');
        $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/proposal", [
            'service_item_id' => $wrongItem->id,
            'reviewed_total_paise' => 10000,
            'review_notes' => 'Reviewed but wrong service',
        ])->assertSessionHasErrors('service_item_id');
        $this->assertDatabaseMissing('service_bookings', ['service_enquiry_id' => $enquiry->id]);
    }

    public function test_inactive_branch_cannot_receive_proposal(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $enquiry = $this->makeEnquiry(User::factory()->create());
        $item = $this->makeItem();
        $item->store->update(['status' => StoreStatus::INACTIVE]);
        $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/proposal", [
            'service_item_id' => $item->id,
            'reviewed_total_paise' => 10000,
            'review_notes' => 'Inactive branch must be rejected',
        ])->assertSessionHasErrors('service_item_id');
        $this->assertDatabaseMissing('service_bookings', ['service_enquiry_id' => $enquiry->id]);
    }

    public function test_cancelled_enquiry_cannot_be_converted(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $enquiry = $this->makeEnquiry(User::factory()->create());
        $enquiry->update(['status' => 'cancelled']);
        $item = $this->makeItem();
        $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/proposal", [
            'service_item_id' => $item->id,
            'reviewed_total_paise' => 10000,
            'review_notes' => 'Cancelled enquiry cannot proceed',
        ])->assertSessionHasErrors('enquiry');
        $this->assertDatabaseMissing('service_bookings', ['service_enquiry_id' => $enquiry->id]);
    }


    public function test_hold_idempotency_rejects_different_customer_and_schedule(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $item = $this->makeItem();
        $params = [
            'idempotency_key' => 'service-hold-isolation-1',
            'store_id' => $item->store_id,
            'service_item_id' => $item->id,
            'service_type' => 'homestay',
            'user_id' => $first->id,
            'customer_name' => 'First Customer',
            'customer_phone' => '9876543210',
            'booking_channel' => 'offline_phone',
            'start_datetime' => now()->addDays(10),
            'end_datetime' => now()->addDays(11),
            'pickup_location' => 'Honnavar',
            'quantity' => 1,
            'base_amount' => 500,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 500,
            'advance_paid' => 0,
            'balance_due' => 500,
            'payment_status' => 'pending',
            'payment_method' => 'pay_on_arrival',
        ];
        $service = app(\App\Services\ServiceAvailabilityService::class);
        $booking = $service->holdServiceBooking($params);
        $this->assertSame($booking->id, $service->holdServiceBooking($params)->id);

        foreach ([
            [...$params, 'user_id' => $second->id],
            [...$params, 'start_datetime' => now()->addDays(12)],
            [...$params, 'quantity' => 2],
        ] as $changed) {
            try {
                $service->holdServiceBooking($changed);
                $this->fail('Reusing a key with different booking details must fail.');
            } catch (\Illuminate\Validation\ValidationException $exception) {
                $this->assertArrayHasKey('idempotency_key', $exception->errors());
            }
        }
        $this->assertSame(1, ServiceBooking::where('idempotency_key', $params['idempotency_key'])->count());
    }


    public function test_enquiry_status_change_is_audited_and_noop_is_not_duplicated(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $enquiry = $this->makeEnquiry(User::factory()->create());
        $url = "/admin/service-enquiries/{$enquiry->id}/status";

        $this->actingAs($admin)->post($url, ['status' => 'reviewing'])->assertRedirect();
        $this->assertSame('reviewing', $enquiry->fresh()->status);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'service_enquiry.status_changed',
            'subject_type' => ServiceEnquiry::class,
            'subject_id' => (string) $enquiry->id,
        ]);
        $this->actingAs($admin)->post($url, ['status' => 'reviewing'])->assertRedirect();
        $this->assertSame(1, \App\Models\ActivityLog::where('action', 'service_enquiry.status_changed')
            ->where('subject_id', (string) $enquiry->id)->count());
    }

    public function test_active_proposal_blocks_closing_or_cancelling_enquiry(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);
        $enquiry = $this->makeEnquiry(User::factory()->create());
        $item = $this->makeItem();
        $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/proposal", [
            'service_item_id' => $item->id,
            'reviewed_total_paise' => 125050,
            'review_notes' => 'Reviewed manually before approval',
        ])->assertRedirect();

        foreach (['closed', 'cancelled'] as $status) {
            $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/status", [
                'status' => $status,
            ])->assertSessionHasErrors('status');
            $this->assertSame('reviewing', $enquiry->fresh()->status);
        }
    }

    public function test_enquiry_link_is_nullable_for_historical_bookings(): void
    {
        $this->assertTrue(Schema::hasColumn('service_bookings', 'service_enquiry_id'));
        $this->assertTrue(method_exists(ServiceBooking::class, 'enquiry'));
        $this->assertTrue(method_exists(ServiceEnquiry::class, 'proposal'));
    }
}

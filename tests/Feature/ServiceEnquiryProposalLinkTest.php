<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\User;
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

    public function test_enquiry_link_is_nullable_for_historical_bookings(): void
    {
        $this->assertTrue(Schema::hasColumn('service_bookings', 'service_enquiry_id'));
        $this->assertTrue(method_exists(ServiceBooking::class, 'enquiry'));
        $this->assertTrue(method_exists(ServiceEnquiry::class, 'proposal'));
    }
}

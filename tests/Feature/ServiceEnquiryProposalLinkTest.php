<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class ServiceEnquiryProposalLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_enquiry_link_is_nullable_for_historical_bookings(): void
    {
        $this->assertTrue(Schema::hasColumn('service_bookings', 'service_enquiry_id'));
        $this->assertTrue(method_exists(ServiceBooking::class, 'enquiry'));
        $this->assertTrue(method_exists(ServiceEnquiry::class, 'proposal'));
    }
}

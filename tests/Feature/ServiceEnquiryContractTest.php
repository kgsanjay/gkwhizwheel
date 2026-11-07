<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->customer = User::create([
        'name' => 'Enquiry Customer',
        'email' => 'enquiry-customer@example.test',
        'phone' => '9000009721',
        'password' => 'Password123!',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

function enquiryPayload(string $serviceType): array
{
    return [
        'service_type' => $serviceType,
        'customer_name' => 'Enquiry Customer',
        'customer_phone' => '9000009721',
        'customer_email' => 'enquiry-customer@example.test',
        'start_datetime' => now()->addDays(4)->format('Y-m-d H:i:s'),
        'pickup_location' => 'Honnavar Railway Station',
        'drop_location' => 'Murudeshwar',
        'quantity' => 2,
        'customer_notes' => 'Please confirm capacity and price.',
        // Attempted client-side price or confirmation manipulation is ignored.
        'custom_amount' => 1,
        'total_amount' => 1,
        'advance_paid' => 1,
        'status' => 'confirmed',
        'service_item_id' => 999999,
    ];
}

test('all six non-bike forms create an unconfirmed enquiry, never a confirmed booking', function (): void {
    $this->actingAs($this->customer);

    foreach (['taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'] as $type) {
        $this->from('/services/'.$type)->post('/services/enquire', enquiryPayload($type))
            ->assertRedirect('/services/'.$type);
    }

    expect(ServiceEnquiry::count())->toBe(6)
        ->and(ServiceBooking::count())->toBe(0)
        ->and(ServiceEnquiry::where('status', 'requested')->count())->toBe(6)
        ->and(ServiceEnquiry::where('user_id', $this->customer->id)->count())->toBe(6);

    $enquiry = ServiceEnquiry::firstOrFail();
    expect($enquiry->reference)->toStartWith('ENQ-')
        ->and($enquiry->quantity)->toBe(2)
        ->and($enquiry->getAttributes())->not->toHaveKeys(['custom_amount', 'total_amount', 'advance_paid', 'service_item_id']);
});

test('guest cannot submit an enquiry', function (): void {
    $this->post('/services/enquire', enquiryPayload('taxi'))->assertRedirect(route('login'));
    expect(ServiceEnquiry::count())->toBe(0);
});

test('invalid service type, quantity, phone or past date never creates an enquiry', function (): void {
    $this->actingAs($this->customer);
    foreach ([
        ['service_type' => 'two_wheelers'],
        ['quantity' => 0],
        ['customer_phone' => '123'],
        ['start_datetime' => now()->subDay()->format('Y-m-d H:i:s')],
        ['pickup_location' => ''],
    ] as $invalid) {
        $this->from('/services/taxi')->post('/services/enquire', [
            ...enquiryPayload('taxi'),
            ...$invalid,
        ])->assertSessionHasErrors();
    }
    expect(ServiceEnquiry::count())->toBe(0);
});

test('enquiries are not public or visible through standard booking list', function (): void {
    $this->actingAs($this->customer);
    $this->post('/services/enquire', enquiryPayload('taxi'))->assertRedirect();
    expect(ServiceBooking::count())->toBe(0);
    $this->get('/admin/service-enquiries')->assertForbidden();
});

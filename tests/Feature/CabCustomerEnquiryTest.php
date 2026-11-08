<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CabEnquiryDetail;
use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\ServiceItem;
use App\Models\ServicePaymentReceipt;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honn = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->muru = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Main Road',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->item = ServiceItem::create([
        'store_id' => $this->honn->id,
        'service_type' => 'taxi', 'name' => 'Honnavar Sedan',
        'price_base' => 1000, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $this->other = ServiceItem::create([
        'store_id' => $this->muru->id,
        'service_type' => 'taxi', 'name' => 'Murudeshwar Sedan',
        'price_base' => 1100, 'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    $this->customer = User::create([
        'name' => 'Cab Test Customer', 'email' => 'cab54@example.test',
        'phone' => '9000005454', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
});

function cab54Request($test, array $overrides = []): array
{
    return array_replace([
        'service_item_id' => $test->item->id,
        'store_id' => $test->honn->id,
        'trip_type' => 'airport',
        'vehicle_class' => 'sedan',
        'customer_name' => 'Cab Test Customer',
        'customer_phone' => '9000005454',
        'customer_email' => 'cab54@example.test',
        'pickup_location' => 'Honnavar station',
        'drop_location' => 'Goa airport',
        'start_datetime' => now()->addWeek()->toDateTimeString(),
        'passengers' => 3, 'bags' => 2,
        'travel_reference' => '6E1234',
        'stops' => ['Karwar'],
        'special_requests' => 'Child seat if available',
        'terms_acknowledged' => true,
        'total_amount' => 1,
        'status' => 'confirmed',
        'payment_status' => 'paid',
        'driver_id' => 1234,
    ], $overrides);
}

test('customer submits a structured cab trip request without booking, price or payment', function (): void {
    $this->actingAs($this->customer)
        ->post('/services/cabs/enquire', cab54Request($this))
        ->assertRedirect()->assertSessionHas('success');

    $this->assertDatabaseCount('service_enquiries', 1);
    $this->assertDatabaseCount('cab_enquiry_details', 1);
    $this->assertDatabaseCount('service_bookings', 0);
    $this->assertDatabaseCount('service_payment_receipts', 0);

    $enquiry = ServiceEnquiry::firstOrFail();
    $detail = CabEnquiryDetail::firstOrFail();
    expect($enquiry->user_id)->toBe($this->customer->id)
        ->and($enquiry->service_type)->toBe('taxi')
        ->and($enquiry->status)->toBe('requested')
        ->and($detail->service_enquiry_id)->toBe($enquiry->id)
        ->and($detail->fare_state)->toBe('awaiting_verification')
        ->and($detail->passengers)->toBe(3)
        ->and($detail->bags)->toBe(2)
        ->and($detail->travel_reference)->toBe('6E1234')
        ->and(json_decode($detail->stops_json, true))->toBe(['Karwar'])
        ->and($enquiry->quantity)->toBe(1);
});

test('unauthenticated users cannot create a cab request', function (): void {
    $this->post('/services/cabs/enquire', cab54Request($this))->assertRedirect();
    expect(ServiceEnquiry::count())->toBe(0);
});

test('wrong branch, inactive cab, and foreign service type cannot be selected', function (): void {
    $this->actingAs($this->customer);
    $this->post('/services/cabs/enquire', cab54Request($this, [
        'service_item_id' => $this->other->id,
    ]))->assertSessionHasErrors('service_item_id');
    $this->item->update(['status' => 'inactive']);
    $this->post('/services/cabs/enquire', cab54Request($this))
        ->assertSessionHasErrors('service_item_id');
    $this->item->update(['status' => 'available', 'service_type' => 'boating']);
    $this->post('/services/cabs/enquire', cab54Request($this))
        ->assertSessionHasErrors('service_item_id');
    expect(CabEnquiryDetail::count())->toBe(0);
});

test('required travel details and acknowledgement are validated', function (): void {
    $this->actingAs($this->customer)->post('/services/cabs/enquire', cab54Request($this, [
        'pickup_location' => '',
        'start_datetime' => now()->subDay()->toDateTimeString(),
        'passengers' => 0,
        'bags' => -1,
        'stops' => ['A','B','C','D','E','F','G'],
        'terms_acknowledged' => false,
    ]))->assertSessionHasErrors([
        'pickup_location', 'start_datetime', 'passengers', 'bags', 'stops', 'terms_acknowledged',
    ]);
    $this->assertDatabaseCount('service_enquiries', 0);
});

test('client cannot obtain a payable fare or guaranteed driver through an enquiry', function (): void {
    $this->actingAs($this->customer)
        ->post('/services/cabs/enquire', cab54Request($this, [
            'service_item_id' => null, 'store_id' => null,
            'total_amount' => 0.01, 'booking_status' => 'confirmed',
            'payment_status' => 'paid', 'assigned_driver_id' => 23,
        ]))->assertRedirect()->assertSessionHas('success');
    expect(CabEnquiryDetail::count())->toBe(1)
        ->and(CabEnquiryDetail::first()->service_item_id)->toBeNull()
        ->and(ServiceBooking::count())->toBe(0);
});

test('an inactive branch cannot receive an itemless cab request', function (): void {
    $this->honn->update(['status' => StoreStatus::INACTIVE]);
    $this->actingAs($this->customer)->post('/services/cabs/enquire', cab54Request($this, [
        'service_item_id' => null,
    ]))->assertSessionHasErrors('store_id');
    expect(ServiceEnquiry::count())->toBe(0);
});

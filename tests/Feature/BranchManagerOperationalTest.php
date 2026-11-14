<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\BikeRelocationTask;
use App\Models\Booking;
use App\Models\CabDispatch;
use App\Models\CabDriver;
use App\Models\CabVehicle;
use App\Models\KycDocument;
use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');
    Storage::fake('local');

    $this->honnavarStore = Store::create([
        'name' => 'Honnavar Branch',
        'address_line' => 'Port Road, Honnavar',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2800,
        'longitude' => 74.4500,
        'phone' => '8660989586',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->murudeshwarStore = Store::create([
        'name' => 'Murudeshwar Branch',
        'address_line' => 'Temple Road, Murudeshwar',
        'city' => 'Murudeshwar',
        'state' => 'Karnataka',
        'pincode' => '581350',
        'latitude' => 14.0940,
        'longitude' => 74.4899,
        'phone' => '8660989587',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Scooter 125cc',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1000.00,
    ]);

    // Floor Manager assigned to Honnavar
    $this->honnavarManager = User::create([
        'name' => 'Honnavar Floor Manager',
        'email' => 'manager.honnavar@example.test',
        'phone' => '9888800001',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF, // MANAGER role alias
        'status' => UserStatus::ACTIVE,
    ]);
    $this->honnavarManager->stores()->attach($this->honnavarStore->id);
    $this->honnavarManager->syncAssignedServices(['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours']);

    // Customer
    $this->customer = User::create([
        'name' => 'Ramesh Kumar',
        'email' => 'ramesh@example.test',
        'phone' => '9888800002',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    // Honnavar Bike
    $this->honnavarBike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->honnavarStore->id,
        'current_store_id' => $this->honnavarStore->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-E-1001',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
        'base_daily_rate_override' => 500.00,
        'weekend_daily_rate_override' => 600.00,
    ]);

    // Murudeshwar Bike
    $this->murudeshwarBike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->murudeshwarStore->id,
        'current_store_id' => $this->murudeshwarStore->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter 125',
        'registration_number' => 'KA-47-E-2002',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 3000,
        'base_daily_rate_override' => 500.00,
        'weekend_daily_rate_override' => 600.00,
    ]);
});

test('branch manager can view fleet bikes for their branch and toggle maintenance', function (): void {
    // Can view fleet listing
    $this->actingAs($this->honnavarManager)
        ->get('/admin/bikes')
        ->assertOk();

    // Toggle maintenance for assigned branch bike (available -> maintenance)
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bikes/{$this->honnavarBike->id}/toggle-maintenance")
        ->assertSessionHasNoErrors();

    expect($this->honnavarBike->fresh()->status)->toBe(BikeStatus::MAINTENANCE);

    // Toggle maintenance back (maintenance -> available)
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bikes/{$this->honnavarBike->id}/toggle-maintenance")
        ->assertSessionHasNoErrors();

    expect($this->honnavarBike->fresh()->status)->toBe(BikeStatus::AVAILABLE);

    // Forbid toggling maintenance for other branch's bike (403)
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bikes/{$this->murudeshwarBike->id}/toggle-maintenance")
        ->assertForbidden();

    expect($this->murudeshwarBike->fresh()->status)->toBe(BikeStatus::AVAILABLE);
});

test('branch manager can upload compliance documents for their branch bike but not for another branch', function (): void {
    $file = UploadedFile::fake()->create('rc_doc.pdf', 500, 'application/pdf');

    // Upload RC for own branch bike
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bikes/{$this->honnavarBike->id}/upload-document", [
            'document_type' => 'rc',
            'file' => $file,
            'expiry_date' => now()->addYears(5)->toDateString(),
        ])
        ->assertSessionHasNoErrors();

    expect(BikeDocument::where('bike_id', $this->honnavarBike->id)->where('document_type', BikeDocumentType::RC)->exists())->toBeTrue();

    // Attempt upload for other branch bike (403)
    $file2 = UploadedFile::fake()->create('insurance.pdf', 500, 'application/pdf');
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bikes/{$this->murudeshwarBike->id}/upload-document", [
            'document_type' => 'insurance',
            'file' => $file2,
            'expiry_date' => now()->addYear()->toDateString(),
        ])
        ->assertForbidden();
});

test('branch manager is strictly forbidden from pricing changes and bike deletion or creation', function (): void {
    // Forbidden from bulk pricing
    $this->actingAs($this->honnavarManager)
        ->post('/admin/bikes/bulk-pricing', [
            'bike_ids' => [$this->honnavarBike->id],
            'type' => 'flat',
            'apply_to' => 'both',
            'weekday_amount' => 800,
        ])
        ->assertForbidden();

    // Forbidden from quick price inline edit
    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/bikes/{$this->honnavarBike->id}/quick-price", [
            'weekday_rate' => 750,
        ])
        ->assertForbidden();

    // Forbidden from creating bikes
    $this->actingAs($this->honnavarManager)
        ->get('/admin/bikes/create')
        ->assertForbidden();

    $this->actingAs($this->honnavarManager)
        ->post('/admin/bikes', [
            'brand' => 'Hero',
            'model_name' => 'Splendor',
            'registration_number' => 'KA-47-E-9999',
            'category_id' => $this->category->id,
            'current_store_id' => $this->honnavarStore->id,
            'home_store_id' => $this->honnavarStore->id,
            'fuel_type' => 'petrol',
            'transmission' => 'manual',
            'status' => 'available',
        ])
        ->assertForbidden();

    // Forbidden from editing full bike specs
    $this->actingAs($this->honnavarManager)
        ->get("/admin/bikes/{$this->honnavarBike->id}/edit")
        ->assertForbidden();

    // Forbidden from deleting bikes
    $this->actingAs($this->honnavarManager)
        ->delete("/admin/bikes/{$this->honnavarBike->id}")
        ->assertForbidden();
});

test('branch manager can verify and reject customer KYC documents', function (): void {
    $kycDoc = KycDocument::create([
        'user_id' => $this->customer->id,
        'document_type' => \App\Enums\KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'documents/kyc/test.jpg',
        'verified' => false,
    ]);

    // Verify KYC
    $this->actingAs($this->honnavarManager)
        ->post("/admin/kyc-documents/{$kycDoc->id}/verify")
        ->assertSessionHasNoErrors();

    expect($kycDoc->fresh()->verified)->toBeTrue()
        ->and($kycDoc->fresh()->verified_by)->toBe($this->honnavarManager->id);

    // Reject KYC
    $this->actingAs($this->honnavarManager)
        ->post("/admin/kyc-documents/{$kycDoc->id}/reject")
        ->assertSessionHasNoErrors();

    expect($kycDoc->fresh()->verified)->toBeFalse();
});

test('branch manager can access QR scanner and execute handover with compliance gate enforcement', function (): void {
    // Can access ground check-in pass scanner
    $this->actingAs($this->honnavarManager)
        ->get('/admin/check-in')
        ->assertOk();

    // Create a confirmed booking
    $booking = Booking::create([
        'booking_reference' => 'BK-MGR-001',
        'user_id' => $this->customer->id,
        'bike_id' => $this->honnavarBike->id,
        'pickup_store_id' => $this->honnavarStore->id,
        'return_store_id' => $this->honnavarStore->id,
        'start_date' => Carbon::now()->addHour(),
        'end_date' => Carbon::now()->addDays(2),
        'base_amount' => 1000.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 2000.00,
        'status' => BookingStatus::CONFIRMED,
        'channel' => BookingChannel::ONLINE,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-mgr-001',
    ]);

    // Handover should fail because compliance documents are not yet uploaded
    $photo = UploadedFile::fake()->image('handover.jpg');
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bookings/{$booking->id}/handover", [
            'odometer_reading' => 5050,
            'condition_photos' => [$photo],
            'helmets_issued' => 2,
            'fuel_level' => 'full',
        ])
        ->assertSessionHasErrors(['bike']);

    // Attempting compliance override as manager must return 403 Forbidden!
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bookings/{$booking->id}/handover", [
            'odometer_reading' => 5050,
            'compliance_override' => true,
            'override_reason' => 'Manager trying to override compliance',
        ])
        ->assertForbidden();

    // Now upload compliant documents (RC, Insurance, Emission)
    BikeDocument::create([
        'bike_id' => $this->honnavarBike->id,
        'document_type' => BikeDocumentType::RC,
        'file_path' => 'rc.pdf',
        'expiry_date' => now()->addYears(5),
        'verified' => true,
        'uploaded_by' => $this->honnavarManager->id,
    ]);
    BikeDocument::create([
        'bike_id' => $this->honnavarBike->id,
        'document_type' => BikeDocumentType::INSURANCE,
        'file_path' => 'ins.pdf',
        'expiry_date' => now()->addYear(),
        'verified' => true,
        'uploaded_by' => $this->honnavarManager->id,
    ]);
    BikeDocument::create([
        'bike_id' => $this->honnavarBike->id,
        'document_type' => BikeDocumentType::EMISSION_CERTIFICATE,
        'file_path' => 'puc.pdf',
        'expiry_date' => now()->addMonths(6),
        'verified' => true,
        'uploaded_by' => $this->honnavarManager->id,
    ]);

    // Handover now succeeds
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bookings/{$booking->id}/handover", [
            'odometer_reading' => 5050,
            'condition_photos' => [$photo],
            'helmets_issued' => 2,
            'fuel_level' => 'full',
        ])
        ->assertSessionHasNoErrors();

    expect($booking->fresh()->status)->toBe(BookingStatus::HANDED_OVER)
        ->and($this->honnavarBike->fresh()->status)->toBe(BikeStatus::ON_RENT)
        ->and($this->honnavarBike->fresh()->odometer_reading)->toBe(5050);

    // Return the bike
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bookings/{$booking->id}/return", [
            'odometer_reading' => 5120,
            'fuel_level' => 'full',
            'return_store_id' => $this->honnavarStore->id,
        ])
        ->assertSessionHasNoErrors();

    expect($booking->fresh()->status)->toBe(BookingStatus::RETURNED)
        ->and($this->honnavarBike->fresh()->status)->toBe(BikeStatus::AVAILABLE)
        ->and($this->honnavarBike->fresh()->odometer_reading)->toBe(5120);

    // Manager is strictly forbidden from processing refunds
    $this->actingAs($this->honnavarManager)
        ->post("/admin/bookings/{$booking->id}/refund", [
            'amount' => 500,
            'reason' => 'Customer complaint',
        ])
        ->assertForbidden();
});

test('branch manager can manage bike relocations involving their store but not unrelated stores', function (): void {
    // Create an affected future booking
    $affected = Booking::create([
        'booking_reference' => 'BK-RELOC-001',
        'user_id' => $this->customer->id,
        'bike_id' => $this->honnavarBike->id,
        'pickup_store_id' => $this->murudeshwarStore->id,
        'return_store_id' => $this->murudeshwarStore->id,
        'start_date' => Carbon::now()->addDays(3),
        'end_date' => Carbon::now()->addDays(5),
        'base_amount' => 1000.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 2000.00,
        'status' => BookingStatus::CONFIRMED,
        'channel' => BookingChannel::ONLINE,
        'price_breakdown_json' => [],
        'idempotency_key' => 'idemp-reloc-001',
    ]);

    // Relocation task: from Honnavar to Murudeshwar
    $task = BikeRelocationTask::create([
        'bike_id' => $this->honnavarBike->id,
        'triggering_booking_id' => $affected->id,
        'affected_booking_id' => $affected->id,
        'from_store_id' => $this->honnavarStore->id,
        'required_store_id' => $this->murudeshwarStore->id,
        'status' => 'open',
    ]);

    // Manager can view the task because Honnavar is the origin
    $this->actingAs($this->honnavarManager)
        ->getJson('/admin/relocations')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    // Manager can start transit
    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/relocations/{$task->id}/status", [
            'status' => 'in_transit',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'in_transit');

    expect($task->fresh()->status)->toBe('in_transit');

    // Manager can complete transit (which moves bike to destination store)
    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/relocations/{$task->id}/status", [
            'status' => 'completed',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'resolved');

    expect($task->fresh()->status)->toBe('resolved')
        ->and($this->honnavarBike->fresh()->current_store_id)->toBe($this->murudeshwarStore->id);

    // Manager cannot confirm receipt or dismiss (superadmin only)
    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/relocations/{$task->id}/confirm-receipt", [
            'physical_receipt_confirmed' => true,
            'destination_store_id' => $this->murudeshwarStore->id,
        ])
        ->assertForbidden();

    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/relocations/{$task->id}/dismiss", [
            'reason' => 'No longer needed by manager',
        ])
        ->assertForbidden();
});

test('branch manager can manage cab dispatches and service enquiries but cannot edit tariffs or base prices', function (): void {
    // Cab service item, resources, vehicle and driver in Honnavar
    $cabItem = ServiceItem::create([
        'service_type' => 'taxi',
        'store_id' => $this->honnavarStore->id,
        'name' => 'Sedan Taxi',
        'price_base' => 2000.00,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);

    $vehicleResource = \App\Models\ServiceResource::create([
        'store_id' => $this->honnavarStore->id,
        'service_item_id' => $cabItem->id,
        'resource_type' => 'cab_vehicle',
        'code' => 'CAB-MGR-VEHICLE',
        'name' => 'Toyota Innova',
        'capacity_units' => 1,
        'status' => 'available',
    ]);

    $driverResource = \App\Models\ServiceResource::create([
        'store_id' => $this->honnavarStore->id,
        'service_item_id' => $cabItem->id,
        'resource_type' => 'cab_driver',
        'code' => 'CAB-MGR-DRIVER',
        'name' => 'Suresh Naik',
        'capacity_units' => 1,
        'status' => 'available',
    ]);

    $vehicle = CabVehicle::create([
        'store_id' => $this->honnavarStore->id,
        'service_item_id' => $cabItem->id,
        'service_resource_id' => $vehicleResource->id,
        'registration_number' => 'KA-47-T-5555',
        'vehicle_class' => 'sedan',
        'make' => 'Toyota',
        'model_name' => 'Innova',
        'ownership_type' => 'owned',
        'seats' => 7,
        'luggage_capacity' => 4,
        'documents_verified' => true,
        'status' => 'available',
        'insurance_expires_on' => now()->addYear(),
        'permit_expires_on' => now()->addYear(),
        'fitness_expires_on' => now()->addYear(),
        'last_inspected_on' => now(),
    ]);

    $driver = CabDriver::create([
        'store_id' => $this->honnavarStore->id,
        'service_item_id' => $cabItem->id,
        'service_resource_id' => $driverResource->id,
        'name' => 'Suresh Naik',
        'license_fingerprint' => hash('sha256', 'mgr-driver-license'),
        'license_last_four' => '0010',
        'license_expires_on' => now()->addYear(),
        'last_verified_on' => now(),
        'documents_verified' => true,
        'status' => 'available',
    ]);

    // Service booking for cab in Honnavar
    $cabBooking = ServiceBooking::create([
        'booking_number' => 'CAB-MGR-001',
        'idempotency_key' => 'cab-idemp-001',
        'store_id' => $this->honnavarStore->id,
        'service_item_id' => $cabItem->id,
        'service_type' => 'taxi',
        'user_id' => $this->customer->id,
        'customer_name' => 'Ramesh Kumar',
        'customer_phone' => '9888800002',
        'status' => 'confirmed',
        'start_datetime' => now()->addDay(),
        'end_datetime' => now()->addDays(2),
        'base_amount' => 3000,
        'total_amount' => 3000,
        'advance_paid' => 1000,
        'balance_due' => 2000,
        'booking_channel' => 'offline_walkin',
        'payment_status' => 'partial',
    ]);

    // Manager can view dispatches
    $this->actingAs($this->honnavarManager)
        ->getJson('/admin/cab-dispatches')
        ->assertOk();

    // Manager can assign dispatch
    $res = $this->actingAs($this->honnavarManager)
        ->postJson('/admin/cab-dispatches', [
            'service_booking_id' => $cabBooking->id,
            'cab_vehicle_id' => $vehicle->id,
            'cab_driver_id' => $driver->id,
            'operations_notes' => 'Assigned by Honnavar manager',
        ]);
    $res->assertCreated();
    $dispatchId = $res->json('data.id');

    // Manager can start dispatch
    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/cab-dispatches/{$dispatchId}/start", [
            'start_odometer' => 12000,
        ])
        ->assertOk();

    // Manager gets 403 on cab fare rules
    $this->actingAs($this->honnavarManager)
        ->postJson('/admin/cab-fares', [
            'store_id' => $this->honnavarStore->id,
            'service_item_id' => 1,
            'trip_type' => 'one_way',
            'route_class' => 'standard',
            'fixed_route_amount' => 2500,
            'toll_policy' => 'included',
            'parking_policy' => 'included',
        ])
        ->assertForbidden();

    // Manager gets 403 on cab refund review
    $this->actingAs($this->honnavarManager)
        ->postJson("/admin/cab-bookings/{$cabBooking->id}/refund-reviews", [
            'reason' => 'Customer requested refund',
        ])
        ->assertForbidden();

    // Service item: Boating package in Honnavar
    $boatItem = ServiceItem::create([
        'service_type' => 'boating',
        'store_id' => $this->honnavarStore->id,
        'name' => 'Sharavathi Sunset Cruise',
        'price_base' => 1500.00,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);

    // Manager gets 403 when trying to alter service base price
    $this->actingAs($this->honnavarManager)
        ->post("/admin/services/boating/items/{$boatItem->id}", [
            'name' => 'Sharavathi Sunset Cruise Modified',
            'price_base' => 2000.00, // Altering base price!
            'price_unit' => 'per_trip',
            'status' => 'available',
        ])
        ->assertForbidden();

    // Manager can update status without altering price
    $this->actingAs($this->honnavarManager)
        ->post("/admin/services/boating/items/{$boatItem->id}", [
            'name' => 'Sharavathi Sunset Cruise',
            'price_base' => 1500.00, // Same base price
            'price_unit' => 'per_trip',
            'status' => 'maintenance',
        ])
        ->assertSessionHasNoErrors();

    expect($boatItem->fresh()->status)->toBe('maintenance');

    // Service enquiry
    $enquiry = ServiceEnquiry::create([
        'user_id' => $this->customer->id,
        'reference' => 'ENQ-MGR-001',
        'service_type' => 'boating',
        'customer_name' => 'Anil Gowda',
        'customer_phone' => '9888800099',
        'start_datetime' => now()->addDays(2),
        'pickup_location' => 'Honnavar Boat Jetty',
        'quantity' => 4,
        'status' => 'requested',
    ]);

    // Manager can view enquiries
    $this->actingAs($this->honnavarManager)
        ->get('/admin/service-enquiries')
        ->assertOk();

    // Manager can update enquiry status
    $this->actingAs($this->honnavarManager)
        ->post("/admin/service-enquiries/{$enquiry->id}/status", [
            'status' => 'reviewing',
        ])
        ->assertSessionHasNoErrors();

    expect($enquiry->fresh()->status)->toBe('reviewing');
});

test('branch manager is strictly forbidden from financial, executive and administrative panels', function (): void {
    // 1. Stores management
    $this->actingAs($this->honnavarManager)->get('/admin/stores')->assertForbidden();
    $this->actingAs($this->honnavarManager)->get('/admin/stores/create')->assertForbidden();

    // 2. Staff management
    $this->actingAs($this->honnavarManager)->get('/admin/staff')->assertForbidden();

    // 3. Pricing rules & coupons
    $this->actingAs($this->honnavarManager)->get('/admin/pricing')->assertForbidden();
    $this->actingAs($this->honnavarManager)->get('/admin/coupons')->assertForbidden();

    // 4. Reports & Analytics
    $this->actingAs($this->honnavarManager)->get('/admin/reports')->assertForbidden();

    // 5. Global Settings & maintenance tools
    $this->actingAs($this->honnavarManager)->get('/admin/settings')->assertForbidden();

    // 6. System Logs & compliance audits
    $this->actingAs($this->honnavarManager)->get('/admin/logs')->assertForbidden();
    $this->actingAs($this->honnavarManager)->get('/admin/compliance-audit')->assertForbidden();
});

<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\PricingRule;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Notification::fake();
    Mail::fake();

    $this->admin = User::create([
        'name' => 'Admin Pricing Manager',
        'email' => 'pricing_admin@whizwheel.com',
        'phone' => '9845199999',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->cabItem = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Innova Crysta AC Coastal Cab',
        'category' => 'Cab',
        'price_base' => 2500.00,
        'unit' => 'per_day',
        'is_active' => true,
    ]);

    $this->scubaItem = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Island Discovery Scuba',
        'category' => 'Scuba',
        'price_base' => 3500.00,
        'unit' => 'per_person',
        'is_active' => true,
    ]);
});

test('calculateServiceQuote applies weekend surge when travel date is Saturday', function (): void {
    PricingRule::create([
        'name' => 'Weekend Cab Surge',
        'service_type' => 'taxi',
        'rule_type' => PricingRuleType::WEEKEND,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00, // 20% surge
        'priority' => 10,
        'is_active' => true,
    ]);

    $pricingService = app(PricingService::class);

    // 2026-09-12 is a Saturday
    $saturday = '2026-09-12 10:00:00';
    $quote = $pricingService->calculateServiceQuote('taxi', $this->cabItem, $saturday, 1);

    expect($quote['base_price'])->toBe(2500.00)
        ->and($quote['dynamic_unit_price'])->toBe(3000.00) // 2500 + 20% (500)
        ->and($quote['total'])->toBe(3000.00)
        ->and($quote['breakdown']['has_surge'])->toBeTrue()
        ->and($quote['breakdown']['applied_rule_names'])->toContain('Weekend Cab Surge');
});

test('calculateServiceQuote does not apply weekend surge on a weekday', function (): void {
    PricingRule::create([
        'name' => 'Weekend Cab Surge',
        'service_type' => 'taxi',
        'rule_type' => PricingRuleType::WEEKEND,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    $pricingService = app(PricingService::class);

    // 2026-09-16 is a Wednesday
    $wednesday = '2026-09-16 10:00:00';
    $quote = $pricingService->calculateServiceQuote('taxi', $this->cabItem, $wednesday, 1);

    expect($quote['base_price'])->toBe(2500.00)
        ->and($quote['dynamic_unit_price'])->toBe(2500.00)
        ->and($quote['total'])->toBe(2500.00)
        ->and($quote['breakdown']['has_surge'])->toBeFalse();
});

test('calculateServiceQuote applies seasonal peak date range surge', function (): void {
    PricingRule::create([
        'name' => 'Diwali Scuba Peak Season',
        'service_type' => 'scuba',
        'rule_type' => PricingRuleType::SEASONAL,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'value' => 500.00, // +₹500 flat per dive
        'date_start' => '2026-11-01',
        'date_end' => '2026-11-15',
        'priority' => 15,
        'is_active' => true,
    ]);

    $pricingService = app(PricingService::class);

    // In-season date
    $inSeason = '2026-11-08 07:00:00';
    $quote = $pricingService->calculateServiceQuote('scuba', $this->scubaItem, $inSeason, 2);

    expect($quote['base_price'])->toBe(3500.00)
        ->and($quote['dynamic_unit_price'])->toBe(4000.00)
        ->and($quote['total'])->toBe(8000.00) // 4000 * 2 pax
        ->and($quote['breakdown']['has_surge'])->toBeTrue();

    // Out-of-season date
    $outOfSeason = '2026-12-01 07:00:00';
    $quoteOut = $pricingService->calculateServiceQuote('scuba', $this->scubaItem, $outOfSeason, 2);

    expect($quoteOut['dynamic_unit_price'])->toBe(3500.00)
        ->and($quoteOut['total'])->toBe(7000.00)
        ->and($quoteOut['breakdown']['has_surge'])->toBeFalse();
});

test('item-specific surge rule takes priority over service-wide rule', function (): void {
    // General taxi rule: +10%
    PricingRule::create([
        'name' => 'General Taxi Surge',
        'service_type' => 'taxi',
        'rule_type' => PricingRuleType::WEEKEND,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 10.00,
        'priority' => 5,
        'is_active' => true,
    ]);

    // Item-specific rule for Innova: +30%
    PricingRule::create([
        'name' => 'Innova Premium Weekend Surge',
        'service_type' => 'taxi',
        'service_item_id' => $this->cabItem->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 30.00,
        'priority' => 20,
        'is_active' => true,
    ]);

    $pricingService = app(PricingService::class);

    // Saturday date
    $saturday = '2026-09-12 12:00:00';
    $quote = $pricingService->calculateServiceQuote('taxi', $this->cabItem, $saturday, 1);

    // Innova specific rule applies (+30% of 2500 = 750 => 3250)
    expect($quote['dynamic_unit_price'])->toBe(3250.00)
        ->and($quote['breakdown']['applied_rule_names'])->toContain('Innova Premium Weekend Surge');
});

test('customer quote API endpoint POST /services/quote returns calculated dynamic surge', function (): void {
    PricingRule::create([
        'name' => 'Weekend Cab Surge',
        'service_type' => 'taxi',
        'rule_type' => PricingRuleType::WEEKEND,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    $response = $this->postJson('/services/quote', [
        'service_type' => 'taxi',
        'service_item_id' => $this->cabItem->id,
        'start_datetime' => '2026-09-12 10:00:00', // Saturday
        'quantity' => 2,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'quote' => [
                'base_price' => 2500.00,
                'dynamic_unit_price' => 2875.00,
                'total' => 5750.00,
                'breakdown' => [
                    'has_surge' => true,
                ],
            ],
        ]);
});

test('customer booking creation stores dynamic surge quote in customer_notes', function (): void {
    PricingRule::create([
        'name' => 'Weekend Scuba Surge',
        'service_type' => 'scuba',
        'rule_type' => PricingRuleType::WEEKEND,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'value' => 400.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    $bookingData = [
        'service_type' => 'scuba',
        'service_item_id' => $this->scubaItem->id,
        'customer_name' => 'Vikram Shenoy',
        'customer_phone' => '9845112233',
        'customer_email' => 'vikram@example.com',
        'start_datetime' => '2026-09-12 06:30:00', // Saturday
        'quantity' => 2,
        'pickup_location' => 'Murudeshwar Port',
        'payment_method' => 'pay_on_arrival',
        'customer_notes' => 'Non-swimmer couple',
    ];

    $customer = User::create([
        'name' => 'Vikram Shenoy',
        'email' => 'vikram@example.com',
        'phone' => '9845112233',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->actingAs($customer)->post('/services/book', $bookingData);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('service_bookings', [
        'customer_name' => 'Vikram Shenoy',
        'service_type' => 'scuba',
        'total_amount' => 7800.00, // (3500 + 400) * 2 pax
    ]);

    $booking = ServiceBooking::where('customer_phone', '9845112233')->first();
    expect($booking->customer_notes)->toContain('Weekend Scuba Surge');
});

test('admin pricing quote simulation POST /admin/pricing/simulate-quote works for travel services', function (): void {
    PricingRule::create([
        'name' => 'Peak Season Coastal Cab',
        'service_type' => 'taxi',
        'rule_type' => PricingRuleType::SEASONAL,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 25.00,
        'date_start' => '2026-10-01',
        'date_end' => '2026-10-31',
        'priority' => 10,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)->postJson('/admin/pricing/simulate-quote', [
        'service_type' => 'taxi',
        'service_item_id' => $this->cabItem->id,
        'travel_date' => '2026-10-15',
        'quantity' => 1,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'quote' => [
                'base_price' => 2500.00,
                'dynamic_unit_price' => 3125.00,
                'total' => 3125.00,
                'breakdown' => [
                    'has_surge' => true,
                ],
            ],
        ]);
});

test('admin can create travel service surge rule via web endpoint', function (): void {
    $response = $this->actingAs($this->admin)->post('/admin/pricing', [
        'name' => 'Sharavathi Riverfront Holiday Multiplier',
        'service_type' => 'homestay',
        'rule_type' => 'holiday',
        'rate_type' => 'percentage',
        'value' => 35.00,
        'date_start' => '2026-12-24',
        'date_end' => '2027-01-02',
        'priority' => 25,
        'is_active' => true,
    ]);

    $response->assertRedirect('/admin/pricing');

    $this->assertDatabaseHas('pricing_rules', [
        'name' => 'Sharavathi Riverfront Holiday Multiplier',
        'service_type' => 'homestay',
        'rule_type' => 'holiday',
        'value' => 35.00,
    ]);
});

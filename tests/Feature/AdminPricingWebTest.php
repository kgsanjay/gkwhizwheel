<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\BikeCategory;
use App\Models\PricingRule;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->store1 = Store::create([
        'name' => 'Indiranagar Hub',
        'address_line' => '100 Feet Road, Indiranagar',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'phone' => '9876500001',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Koramangala Hub',
        'address_line' => '80 Feet Road, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'phone' => '9876500002',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Electric Scooter',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $this->superAdmin = User::create([
        'name' => 'Chief Administrator',
        'email' => 'admin_pricing@gkwhizwheel.com',
        'phone' => '9876500111',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Store Staff',
        'email' => 'staff_pricing@gkwhizwheel.com',
        'phone' => '9876500222',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin pricing screen', function (): void {
    $this->get('/admin/pricing')->assertRedirect('/admin/login');
    $this->post('/admin/pricing', [])->assertRedirect('/admin/login');
});

test('staff users receive 403 forbidden on admin pricing screen', function (): void {
    $this->actingAs($this->staff)
        ->get('/admin/pricing')
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->post('/admin/pricing', [
            'rule_type' => 'weekend',
            'day_of_week' => 0,
            'rate_type' => 'percentage',
            'value' => 15,
        ])
        ->assertForbidden();
});

test('super admin can view pricing rules list with metrics and filters', function (): void {
    PricingRule::create([
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0, // Sunday
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    PricingRule::create([
        'rule_type' => PricingRuleType::ONE_WAY_FEE,
        'from_store_id' => $this->store1->id,
        'to_store_id' => $this->store2->id,
        'rate_type' => PricingRateType::FLAT_ADDON,
        'value' => 300.00,
        'priority' => 5,
        'is_active' => true,
    ]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/pricing')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Pricing/Index')
            ->has('rules', 2)
            ->has('stats')
            ->where('stats.total', 2)
            ->where('stats.active', 2)
            ->where('stats.weekend', 1)
            ->where('stats.one_way', 1)
            ->has('categories', 1)
            ->has('stores', 2)
        );
});

test('super admin can filter pricing rules by rule_type', function (): void {
    PricingRule::create([
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 6,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00,
        'is_active' => true,
    ]);

    PricingRule::create([
        'rule_type' => PricingRuleType::HOLIDAY,
        'date_start' => '2026-10-02',
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 25.00,
        'is_active' => true,
    ]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/pricing?rule_type=holiday')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Pricing/Index')
            ->has('rules', 1)
            ->where('rules.0.rule_type', 'holiday')
        );
});

test('super admin can create weekend pricing rule', function (): void {
    $payload = [
        'rule_type' => 'weekend',
        'day_of_week' => 6, // Saturday
        'rate_type' => 'percentage',
        'value' => 20,
        'priority' => 15,
        'is_active' => true,
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/pricing', $payload);

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success', 'Dynamic pricing rule created successfully.');

    $rule = PricingRule::where('rule_type', PricingRuleType::WEEKEND)->first();
    expect($rule)->not->toBeNull();
    expect($rule->day_of_week)->toBe(6);
    expect((float) $rule->value)->toBe(20.00);
});

test('super admin can create holiday pricing rule', function (): void {
    $payload = [
        'rule_type' => 'holiday',
        'date_start' => '2026-10-02',
        'rate_type' => 'percentage',
        'value' => 25,
        'priority' => 20,
        'is_active' => true,
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/pricing', $payload);

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success');

    $rule = PricingRule::where('rule_type', PricingRuleType::HOLIDAY)->first();
    expect($rule)->not->toBeNull();
    expect($rule->date_start->toDateString())->toBe('2026-10-02');
});

test('super admin can create seasonal pricing rule', function (): void {
    $payload = [
        'rule_type' => 'seasonal',
        'date_start' => '2026-10-15',
        'date_end' => '2026-11-15',
        'rate_type' => 'fixed_override',
        'value' => 850,
        'category_id' => $this->category->id,
        'priority' => 30,
        'is_active' => true,
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/pricing', $payload);

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success');

    $rule = PricingRule::where('rule_type', PricingRuleType::SEASONAL)->first();
    expect($rule)->not->toBeNull();
    expect($rule->date_start->toDateString())->toBe('2026-10-15');
    expect($rule->date_end->toDateString())->toBe('2026-11-15');
    expect((float) $rule->value)->toBe(850.00);
});

test('super admin can create one-way fee pricing rule', function (): void {
    $payload = [
        'rule_type' => 'one_way_fee',
        'from_store_id' => $this->store1->id,
        'to_store_id' => $this->store2->id,
        'rate_type' => 'flat_addon',
        'value' => 350,
        'priority' => 10,
        'is_active' => true,
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/pricing', $payload);

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success');

    $rule = PricingRule::where('rule_type', PricingRuleType::ONE_WAY_FEE)->first();
    expect($rule)->not->toBeNull();
    expect($rule->from_store_id)->toBe($this->store1->id);
    expect($rule->to_store_id)->toBe($this->store2->id);
    expect((float) $rule->value)->toBe(350.00);
});

test('super admin can update a pricing rule', function (): void {
    $rule = PricingRule::create([
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->put("/admin/pricing/{$rule->id}", [
            'value' => 30.00,
            'priority' => 50,
        ]);

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success', 'Pricing rule updated successfully.');

    $rule->refresh();
    expect((float) $rule->value)->toBe(30.00);
    expect($rule->priority)->toBe(50);
});

test('super admin can quick toggle pricing rule active state', function (): void {
    $rule = PricingRule::create([
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->post("/admin/pricing/{$rule->id}/toggle");

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success', 'Pricing rule deactivated successfully.');

    $rule->refresh();
    expect($rule->is_active)->toBeFalse();
});

test('super admin can delete pricing rule', function (): void {
    $rule = PricingRule::create([
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->delete("/admin/pricing/{$rule->id}");

    $response->assertRedirect('/admin/pricing')
        ->assertSessionHas('success', 'Pricing rule removed successfully.');

    expect(PricingRule::find($rule->id))->toBeNull();
});

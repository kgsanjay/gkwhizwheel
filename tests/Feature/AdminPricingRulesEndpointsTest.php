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
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->store1 = Store::create([
        'name' => 'Koramangala Store',
        'address_line' => '100 80ft Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352,
        'longitude' => 77.6245,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->store2 = Store::create([
        'name' => 'Indiranagar Store',
        'address_line' => '200 100ft Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9784,
        'longitude' => 77.6408,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 1000.00,
        'default_deposit_amount' => 3000.00,
    ]);

    $this->admin = User::create([
        'name' => 'Admin User',
        'email' => 'admin_pricing@gkwhizwheel.com',
        'phone' => '9999900001',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Customer User',
        'email' => 'customer_pricing@gkwhizwheel.com',
        'phone' => '9999900002',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin pricing rules endpoints', function (): void {
    $this->getJson('/api/v1/admin/pricing-rules')->assertStatus(401);
    $this->postJson('/api/v1/admin/pricing-rules', [])->assertStatus(401);
    $this->getJson('/api/v1/admin/pricing-rules/1')->assertStatus(401);
    $this->putJson('/api/v1/admin/pricing-rules/1', [])->assertStatus(401);
    $this->deleteJson('/api/v1/admin/pricing-rules/1')->assertStatus(401);
});

test('non-admin users receive 403 forbidden on admin pricing rules endpoints', function (): void {
    $rule = PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 20.00,
        'priority' => 1,
    ]);

    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/admin/pricing-rules')->assertStatus(403);
    $this->postJson('/api/v1/admin/pricing-rules', [
        'rule_type' => 'weekend',
        'rate_type' => 'percentage',
        'value' => 20,
    ])->assertStatus(403);
    $this->getJson('/api/v1/admin/pricing-rules/'.$rule->id)->assertStatus(403);
    $this->putJson('/api/v1/admin/pricing-rules/'.$rule->id, [])->assertStatus(403);
    $this->deleteJson('/api/v1/admin/pricing-rules/'.$rule->id)->assertStatus(403);
});

test('admin can create weekend pricing rule', function (): void {
    Sanctum::actingAs($this->admin);

    $response = $this->postJson('/api/v1/admin/pricing-rules', [
        'category_id' => $this->category->id,
        'rule_type' => 'weekend',
        'day_of_week' => 0, // Sunday
        'rate_type' => 'percentage',
        'value' => 20.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pricing rule created successfully.')
        ->assertJsonPath('data.rule_type', 'weekend')
        ->assertJsonPath('data.rate_type', 'percentage')
        ->assertJsonPath('data.value', 20)
        ->assertJsonPath('data.day_of_week', 0)
        ->assertJsonPath('data.priority', 10);

    expect(PricingRule::count())->toBe(1);
});

test('admin can create holiday and seasonal pricing rules', function (): void {
    Sanctum::actingAs($this->admin);

    // Holiday rule
    $holidayResponse = $this->postJson('/api/v1/admin/pricing-rules', [
        'category_id' => $this->category->id,
        'rule_type' => 'holiday',
        'date_start' => '2026-10-02',
        'rate_type' => 'fixed_override',
        'value' => 1500.00,
        'priority' => 50,
    ]);

    $holidayResponse->assertStatus(201)
        ->assertJsonPath('data.rule_type', 'holiday')
        ->assertJsonPath('data.date_start', '2026-10-02');

    // Seasonal rule
    $seasonalResponse = $this->postJson('/api/v1/admin/pricing-rules', [
        'category_id' => $this->category->id,
        'rule_type' => 'seasonal',
        'date_start' => '2026-12-20',
        'date_end' => '2026-12-31',
        'rate_type' => 'percentage',
        'value' => 25.00,
        'priority' => 30,
    ]);

    $seasonalResponse->assertStatus(201)
        ->assertJsonPath('data.rule_type', 'seasonal')
        ->assertJsonPath('data.date_start', '2026-12-20')
        ->assertJsonPath('data.date_end', '2026-12-31');

    expect(PricingRule::count())->toBe(2);
});

test('admin can create one_way_fee pricing rule', function (): void {
    Sanctum::actingAs($this->admin);

    $response = $this->postJson('/api/v1/admin/pricing-rules', [
        'rule_type' => 'one_way_fee',
        'from_store_id' => $this->store1->id,
        'to_store_id' => $this->store2->id,
        'rate_type' => 'flat_addon',
        'value' => 350.00,
        'priority' => 5,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.rule_type', 'one_way_fee')
        ->assertJsonPath('data.from_store_id', $this->store1->id)
        ->assertJsonPath('data.to_store_id', $this->store2->id)
        ->assertJsonPath('data.value', 350);
});

test('admin can list pricing rules with filters', function (): void {
    Sanctum::actingAs($this->admin);

    PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 6,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'priority' => 10,
        'is_active' => true,
    ]);

    PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::HOLIDAY,
        'date_start' => '2026-08-15',
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 30.00,
        'priority' => 50,
        'is_active' => false,
    ]);

    // All rules
    $resAll = $this->getJson('/api/v1/admin/pricing-rules');
    $resAll->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data');

    // Filter by rule_type
    $resType = $this->getJson('/api/v1/admin/pricing-rules?rule_type=weekend');
    $resType->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.rule_type', 'weekend');

    // Filter by is_active
    $resActive = $this->getJson('/api/v1/admin/pricing-rules?is_active=1');
    $resActive->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.is_active', true);
});

test('admin can show, update, and delete pricing rule', function (): void {
    Sanctum::actingAs($this->admin);

    $rule = PricingRule::create([
        'category_id' => $this->category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 0,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'priority' => 5,
        'is_active' => true,
    ]);

    // Show
    $showRes = $this->getJson('/api/v1/admin/pricing-rules/'.$rule->id);
    $showRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $rule->id)
        ->assertJsonPath('data.value', 15);

    // Update
    $updateRes = $this->putJson('/api/v1/admin/pricing-rules/'.$rule->id, [
        'value' => 25.00,
        'priority' => 15,
        'is_active' => false,
    ]);
    $updateRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.value', 25)
        ->assertJsonPath('data.priority', 15)
        ->assertJsonPath('data.is_active', false);

    $rule->refresh();
    expect((float) $rule->value)->toBe(25.0)
        ->and($rule->priority)->toBe(15)
        ->and($rule->is_active)->toBeFalse();

    // Delete
    $deleteRes = $this->deleteJson('/api/v1/admin/pricing-rules/'.$rule->id);
    $deleteRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Pricing rule deleted successfully.');

    expect(PricingRule::find($rule->id))->toBeNull();
});

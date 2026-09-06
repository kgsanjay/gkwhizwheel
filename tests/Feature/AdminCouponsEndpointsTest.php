<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\DiscountType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Coupon;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::create([
        'name' => 'Admin User',
        'email' => 'admin_coupon@gkwhizwheel.com',
        'phone' => '9999900010',
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Customer User',
        'email' => 'customer_coupon@gkwhizwheel.com',
        'phone' => '9999900020',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin coupons endpoints', function (): void {
    $this->getJson('/api/v1/admin/coupons')->assertStatus(401);
    $this->postJson('/api/v1/admin/coupons', [])->assertStatus(401);
    $this->getJson('/api/v1/admin/coupons/1')->assertStatus(401);
    $this->putJson('/api/v1/admin/coupons/1', [])->assertStatus(401);
    $this->deleteJson('/api/v1/admin/coupons/1')->assertStatus(401);
});

test('non-admin users receive 403 forbidden on admin coupons endpoints', function (): void {
    $coupon = Coupon::create([
        'code' => 'EXISTING',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
    ]);

    Sanctum::actingAs($this->customer);

    $this->getJson('/api/v1/admin/coupons')->assertStatus(403);
    $this->postJson('/api/v1/admin/coupons', [
        'code' => 'TEST50',
        'discount_type' => 'percentage',
        'value' => 50,
        'valid_from' => '2026-09-01',
        'valid_until' => '2026-09-30',
    ])->assertStatus(403);
    $this->getJson('/api/v1/admin/coupons/'.$coupon->id)->assertStatus(403);
    $this->putJson('/api/v1/admin/coupons/'.$coupon->id, [])->assertStatus(403);
    $this->deleteJson('/api/v1/admin/coupons/'.$coupon->id)->assertStatus(403);
});

test('admin can create percentage and fixed discount coupons', function (): void {
    Sanctum::actingAs($this->admin);

    // Percentage discount coupon
    $resPercent = $this->postJson('/api/v1/admin/coupons', [
        'code' => 'summer20',
        'discount_type' => 'percentage',
        'value' => 20.00,
        'max_uses_total' => 100,
        'max_uses_per_user' => 1,
        'valid_from' => '2026-06-01',
        'valid_until' => '2026-08-31',
        'is_active' => true,
    ]);

    $resPercent->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Coupon created successfully.')
        ->assertJsonPath('data.code', 'SUMMER20')
        ->assertJsonPath('data.discount_type', 'percentage')
        ->assertJsonPath('data.value', 20)
        ->assertJsonPath('data.max_uses_total', 100)
        ->assertJsonPath('data.max_uses_per_user', 1)
        ->assertJsonPath('data.valid_from', '2026-06-01')
        ->assertJsonPath('data.valid_until', '2026-08-31');

    // Fixed discount coupon
    $resFixed = $this->postJson('/api/v1/admin/coupons', [
        'code' => 'FLAT500',
        'discount_type' => 'fixed',
        'value' => 500.00,
        'valid_from' => '2026-09-01',
        'valid_until' => '2026-09-30',
    ]);

    $resFixed->assertStatus(201)
        ->assertJsonPath('data.code', 'FLAT500')
        ->assertJsonPath('data.discount_type', 'fixed')
        ->assertJsonPath('data.value', 500);

    expect(Coupon::count())->toBe(2);
});

test('coupon code must be unique and dates must be valid', function (): void {
    Sanctum::actingAs($this->admin);

    Coupon::create([
        'code' => 'WELCOME10',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
    ]);

    // Duplicate code
    $this->postJson('/api/v1/admin/coupons', [
        'code' => 'welcome10',
        'discount_type' => 'percentage',
        'value' => 15.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
    ])->assertStatus(422)
        ->assertJsonValidationErrors('code');

    // Invalid date order
    $this->postJson('/api/v1/admin/coupons', [
        'code' => 'BACKWARDDATES',
        'discount_type' => 'fixed',
        'value' => 100.00,
        'valid_from' => '2026-09-10',
        'valid_until' => '2026-09-01',
    ])->assertStatus(422)
        ->assertJsonValidationErrors('valid_until');
});

test('admin can list coupons with filters', function (): void {
    Sanctum::actingAs($this->admin);

    Coupon::create([
        'code' => 'ACTIVE1',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
        'is_active' => true,
    ]);

    Coupon::create([
        'code' => 'INACTIVE1',
        'discount_type' => DiscountType::FIXED,
        'value' => 100.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
        'is_active' => false,
    ]);

    // List all
    $resAll = $this->getJson('/api/v1/admin/coupons');
    $resAll->assertStatus(200)
        ->assertJsonCount(2, 'data');

    // Filter by is_active
    $resActive = $this->getJson('/api/v1/admin/coupons?is_active=1');
    $resActive->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.code', 'ACTIVE1');

    // Filter by code
    $resCode = $this->getJson('/api/v1/admin/coupons?code=inactive');
    $resCode->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.code', 'INACTIVE1');
});

test('admin can show, update, and delete coupon', function (): void {
    Sanctum::actingAs($this->admin);

    $coupon = Coupon::create([
        'code' => 'ORIGINAL50',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 50.00,
        'valid_from' => '2026-05-01',
        'valid_until' => '2026-05-31',
        'is_active' => true,
    ]);

    // Show
    $showRes = $this->getJson('/api/v1/admin/coupons/'.$coupon->id);
    $showRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $coupon->id)
        ->assertJsonPath('data.code', 'ORIGINAL50');

    // Update
    $updateRes = $this->putJson('/api/v1/admin/coupons/'.$coupon->id, [
        'code' => 'MODIFIED50',
        'value' => 45.00,
        'is_active' => false,
    ]);
    $updateRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.code', 'MODIFIED50')
        ->assertJsonPath('data.value', 45)
        ->assertJsonPath('data.is_active', false);

    $coupon->refresh();
    expect($coupon->code)->toBe('MODIFIED50')
        ->and((float) $coupon->value)->toBe(45.0)
        ->and($coupon->is_active)->toBeFalse();

    // Delete
    $deleteRes = $this->deleteJson('/api/v1/admin/coupons/'.$coupon->id);
    $deleteRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Coupon deleted successfully.');

    expect(Coupon::find($coupon->id))->toBeNull();
});

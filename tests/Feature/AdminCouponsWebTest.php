<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\DiscountType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Coupon;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superAdmin = User::create([
        'name' => 'Chief Administrator',
        'email' => 'admin_coupons@gkwhizwheel.com',
        'phone' => '9876500333',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Store Staff',
        'email' => 'staff_coupons@gkwhizwheel.com',
        'phone' => '9876500444',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('unauthenticated users cannot access admin coupons screen', function (): void {
    $this->get('/admin/coupons')->assertRedirect('/admin/login');
    $this->post('/admin/coupons', [])->assertRedirect('/admin/login');
});

test('staff users receive 403 forbidden on admin coupons screen', function (): void {
    $this->actingAs($this->staff)
        ->get('/admin/coupons')
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->post('/admin/coupons', [
            'code' => 'STAFF10',
            'discount_type' => 'percentage',
            'value' => 10,
            'valid_from' => '2026-09-01',
            'valid_until' => '2026-09-30',
        ])
        ->assertForbidden();
});

test('super admin can view coupons list with metrics and search filters', function (): void {
    $coupon1 = Coupon::create([
        'code' => 'WELCOME10',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => Carbon::today()->subDays(5)->toDateString(),
        'valid_until' => Carbon::today()->addDays(25)->toDateString(),
        'is_active' => true,
    ]);

    $coupon2 = Coupon::create([
        'code' => 'MONSOON500',
        'discount_type' => DiscountType::FIXED,
        'value' => 500.00,
        'valid_from' => Carbon::today()->subMonths(2)->toDateString(),
        'valid_until' => Carbon::today()->subMonth()->toDateString(),
        'is_active' => true,
    ]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/coupons')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Coupons/Index')
            ->has('coupons', 2)
            ->has('stats')
            ->where('stats.total', 2)
            ->where('stats.active', 1)
            ->where('stats.expired', 1)
            ->has('discount_types', 2)
        );
});

test('super admin can search coupons by code', function (): void {
    Coupon::create([
        'code' => 'DIWALI2026',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 20.00,
        'valid_from' => '2026-10-01',
        'valid_until' => '2026-11-15',
        'is_active' => true,
    ]);

    Coupon::create([
        'code' => 'SUMMER50',
        'discount_type' => DiscountType::FIXED,
        'value' => 50.00,
        'valid_from' => '2026-04-01',
        'valid_until' => '2026-05-31',
        'is_active' => true,
    ]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/coupons?code=DIWALI')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
            ->component('Admin/Coupons/Index')
            ->has('coupons', 1)
            ->where('coupons.0.code', 'DIWALI2026')
        );
});

test('super admin can create a new discount coupon with automatic uppercase code', function (): void {
    $payload = [
        'code' => 'festive30',
        'discount_type' => 'percentage',
        'value' => 30,
        'max_uses_total' => 100,
        'max_uses_per_user' => 2,
        'valid_from' => Carbon::today()->toDateString(),
        'valid_until' => Carbon::today()->addMonths(2)->toDateString(),
        'is_active' => true,
    ];

    $response = $this->actingAs($this->superAdmin)
        ->post('/admin/coupons', $payload);

    $response->assertRedirect('/admin/coupons')
        ->assertSessionHas('success', 'Coupon FESTIVE30 created successfully.');

    $coupon = Coupon::where('code', 'FESTIVE30')->first();
    expect($coupon)->not->toBeNull();
    expect((float) $coupon->value)->toBe(30.00);
    expect($coupon->max_uses_total)->toBe(100);
    expect($coupon->max_uses_per_user)->toBe(2);
});

test('super admin can update an existing coupon', function (): void {
    $coupon = Coupon::create([
        'code' => 'LAUNCH20',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 20.00,
        'valid_from' => '2026-09-01',
        'valid_until' => '2026-09-30',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->put("/admin/coupons/{$coupon->id}", [
            'value' => 25.00,
            'valid_until' => '2026-10-31',
            'max_uses_total' => 500,
        ]);

    $response->assertRedirect('/admin/coupons')
        ->assertSessionHas('success', 'Coupon LAUNCH20 updated successfully.');

    $coupon->refresh();
    expect((float) $coupon->value)->toBe(25.00);
    expect($coupon->valid_until->toDateString())->toBe('2026-10-31');
    expect($coupon->max_uses_total)->toBe(500);
});

test('super admin can quick toggle coupon active status', function (): void {
    $coupon = Coupon::create([
        'code' => 'TOGGLEME',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 15.00,
        'valid_from' => '2026-09-01',
        'valid_until' => '2026-09-30',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->post("/admin/coupons/{$coupon->id}/toggle");

    $response->assertRedirect('/admin/coupons')
        ->assertSessionHas('success', 'Coupon TOGGLEME deactivated successfully.');

    $coupon->refresh();
    expect($coupon->is_active)->toBeFalse();
});

test('super admin can delete a coupon', function (): void {
    $coupon = Coupon::create([
        'code' => 'DELETEME',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => '2026-09-01',
        'valid_until' => '2026-09-30',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->superAdmin)
        ->delete("/admin/coupons/{$coupon->id}");

    $response->assertRedirect('/admin/coupons')
        ->assertSessionHas('success', 'Coupon DELETEME removed successfully.');

    expect(Coupon::find($coupon->id))->toBeNull();
});

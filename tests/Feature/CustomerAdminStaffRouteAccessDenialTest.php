<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Middleware\EnsureAdminOrStaff;
use App\Http\Middleware\EnsureServiceAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->customer = User::create([
        'name' => 'Regular Customer',
        'email' => 'customer_rbac@gkwhizwheel.com',
        'phone' => '9876543210',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('customer role receives 403 on all web admin portal routes', function (string $method, string $uri): void {
    $this->actingAs($this->customer);

    $response = $this->call($method, $uri);

    $response->assertForbidden();
})->with([
    ['GET', '/admin'],
    ['GET', '/admin/dashboard'],
    ['GET', '/admin/dispatch'],
    ['GET', '/admin/check-in'],
    ['POST', '/admin/check-in/lookup'],
    ['POST', '/admin/check-in/sync'],
    ['GET', '/admin/bikes'],
    ['GET', '/admin/bikes/create'],
    ['POST', '/admin/bikes'],
    ['GET', '/admin/bikes/export-sample-csv'],
    ['POST', '/admin/bikes/import-csv'],
    ['GET', '/admin/pricing'],
    ['POST', '/admin/pricing'],
    ['POST', '/admin/pricing/simulate-quote'],
    ['GET', '/admin/coupons'],
    ['POST', '/admin/coupons'],
    ['GET', '/admin/stores'],
    ['GET', '/admin/stores/create'],
    ['POST', '/admin/stores'],
    ['GET', '/admin/staff'],
    ['POST', '/admin/staff'],
    ['GET', '/admin/bookings'],
    ['GET', '/admin/services/categories'],
    ['POST', '/admin/services/categories'],
    ['GET', '/admin/services/taxi/categories'],
    ['GET', '/admin/services/taxi/items'],
    ['GET', '/admin/services/taxi/items/create'],
    ['POST', '/admin/services/taxi/items'],
    ['GET', '/admin/services/taxi/bookings'],
    ['GET', '/admin/services/taxi/bookings/create'],
    ['POST', '/admin/services/taxi/bookings'],
    ['GET', '/admin/reports'],
]);

test('customer role receives 403 on all api v1 admin endpoints', function (string $method, string $uri): void {
    Sanctum::actingAs($this->customer);

    $response = $this->json($method, $uri);

    $response->assertForbidden();
})->with([
    ['POST', '/api/v1/admin/bikes'],
    ['POST', '/api/v1/admin/bikes/bulk-import'],
    ['PUT', '/api/v1/admin/bikes/999'],
    ['DELETE', '/api/v1/admin/bikes/999'],
    ['GET', '/api/v1/admin/pricing-rules'],
    ['POST', '/api/v1/admin/pricing-rules'],
    ['GET', '/api/v1/admin/pricing-rules/999'],
    ['PUT', '/api/v1/admin/pricing-rules/999'],
    ['DELETE', '/api/v1/admin/pricing-rules/999'],
    ['GET', '/api/v1/admin/coupons'],
    ['POST', '/api/v1/admin/coupons'],
    ['GET', '/api/v1/admin/coupons/999'],
    ['PUT', '/api/v1/admin/coupons/999'],
    ['DELETE', '/api/v1/admin/coupons/999'],
    ['GET', '/api/v1/admin/stores'],
    ['POST', '/api/v1/admin/stores'],
    ['GET', '/api/v1/admin/stores/999'],
    ['PUT', '/api/v1/admin/stores/999'],
    ['GET', '/api/v1/admin/staff'],
    ['POST', '/api/v1/admin/staff'],
    ['GET', '/api/v1/admin/staff/999'],
    ['GET', '/api/v1/admin/bookings'],
    ['GET', '/api/v1/admin/bookings/999'],
    ['GET', '/api/v1/admin/reports/revenue'],
    ['GET', '/api/v1/admin/reports/utilization'],
    ['GET', '/api/v1/admin/activity-logs'],
    ['GET', '/api/v1/admin/service-items'],
    ['POST', '/api/v1/admin/service-items'],
    ['GET', '/api/v1/admin/service-items/999'],
    ['PUT', '/api/v1/admin/service-items/999'],
    ['DELETE', '/api/v1/admin/service-items/999'],
]);

test('customer role receives 403 on all api v1 staff operational endpoints', function (string $method, string $uri): void {
    Sanctum::actingAs($this->customer);

    $response = $this->json($method, $uri);

    $response->assertForbidden();
})->with([
    ['GET', '/api/v1/staff/customers/lookup?phone=9876543210'],
    ['POST', '/api/v1/staff/customers'],
    ['GET', '/api/v1/staff/bookings/active'],
    ['POST', '/api/v1/staff/bookings'],
    ['POST', '/api/v1/staff/bookings/999/collect-payment'],
    ['POST', '/api/v1/staff/bookings/999/handover'],
    ['POST', '/api/v1/staff/bookings/999/return'],
    ['GET', '/api/v1/staff/service-bookings'],
    ['POST', '/api/v1/staff/service-bookings'],
    ['GET', '/api/v1/staff/service-bookings/999'],
    ['PUT', '/api/v1/staff/service-bookings/999/status'],
    ['PATCH', '/api/v1/staff/service-bookings/999/status'],
    ['POST', '/api/v1/staff/service-bookings/999/mark-in-progress'],
    ['POST', '/api/v1/staff/service-bookings/999/mark-completed'],
    ['GET', '/api/v1/staff/bikes'],
    ['POST', '/api/v1/staff/bikes/999/maintenance'],
    ['POST', '/api/v1/staff/sync'],
]);

test('EnsureAdminOrStaff explicitly denies by default and allow-lists specific roles', function (): void {
    $middleware = new EnsureAdminOrStaff();

    // 1. Unauthenticated request -> 401 on API
    $apiReq = Request::create('/api/v1/admin/test', 'GET');
    $apiResp = $middleware->handle($apiReq, fn () => new Response('OK'));
    expect($apiResp->getStatusCode())->toBe(401);

    // 2. Customer user -> 403 Forbidden on API
    $customerReq = Request::create('/api/v1/admin/test', 'GET');
    $customerReq->setUserResolver(fn () => $this->customer);
    $customerResp = $middleware->handle($customerReq, fn () => new Response('OK'));
    expect($customerResp->getStatusCode())->toBe(403);

    // 3. Customer user -> 403 abort on Web
    $webReq = Request::create('/admin/dashboard', 'GET');
    $webReq->setUserResolver(fn () => $this->customer);
    try {
        $middleware->handle($webReq, fn () => new Response('OK'));
        test()->fail('Expected 403 HttpException was not thrown for web customer request.');
    } catch (HttpException $e) {
        expect($e->getStatusCode())->toBe(403);
    }

    // 4. Allowed roles succeed: Super Admin, Store Manager, Staff
    foreach ([UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF] as $allowedRole) {
        $staffUser = User::factory()->make(['role' => $allowedRole]);
        $req = Request::create('/api/v1/admin/test', 'GET');
        $req->setUserResolver(fn () => $staffUser);
        $resp = $middleware->handle($req, fn () => new Response('OK'));
        expect($resp->getContent())->toBe('OK');
    }
});

test('EnsureServiceAccess explicitly denies by default and allow-lists specific roles', function (): void {
    $middleware = new EnsureServiceAccess();

    // 1. Unauthenticated request -> 401 on API
    $apiReq = Request::create('/api/v1/services/taxi/items', 'GET');
    $apiResp = $middleware->handle($apiReq, fn () => new Response('OK'), 'taxi');
    expect($apiResp->getStatusCode())->toBe(401);

    // 2. Customer user -> 403 Forbidden on API even with or without serviceType
    $customerReq = Request::create('/api/v1/services/taxi/items', 'GET');
    $customerReq->setUserResolver(fn () => $this->customer);
    $customerResp = $middleware->handle($customerReq, fn () => new Response('OK'), 'taxi');
    expect($customerResp->getStatusCode())->toBe(403);

    // Customer without service parameter also denied by default
    $customerReqNoParam = Request::create('/api/v1/services', 'GET');
    $customerReqNoParam->setUserResolver(fn () => $this->customer);
    $customerRespNoParam = $middleware->handle($customerReqNoParam, fn () => new Response('OK'));
    expect($customerRespNoParam->getStatusCode())->toBe(403);

    // 3. Customer user -> 403 abort on Web
    $webReq = Request::create('/admin/services/taxi/items', 'GET');
    $webReq->setUserResolver(fn () => $this->customer);
    try {
        $middleware->handle($webReq, fn () => new Response('OK'), 'taxi');
        test()->fail('Expected 403 HttpException was not thrown for web customer request.');
    } catch (HttpException $e) {
        expect($e->getStatusCode())->toBe(403);
    }

    // 4. Allowed role: Super Admin bypasses
    $superAdmin = User::factory()->make(['role' => UserRole::SUPER_ADMIN]);
    $adminReq = Request::create('/admin/services/taxi/items', 'GET');
    $adminReq->setUserResolver(fn () => $superAdmin);
    $adminResp = $middleware->handle($adminReq, fn () => new Response('OK'), 'taxi');
    expect($adminResp->getContent())->toBe('OK');
});

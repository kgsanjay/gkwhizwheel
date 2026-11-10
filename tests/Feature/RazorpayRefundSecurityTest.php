<?php

declare(strict_types=1);

use App\Services\RazorpayService;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    config()->set('services.razorpay.key_id', 'rzp_test_fixture');
    config()->set('services.razorpay.key_secret', 'fixture_secret');
    Http::preventStrayRequests();
});

test('refund rejects zero amount without a gateway request', function (): void {
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 0)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund rejects negative amount without a gateway request', function (): void {
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', -1)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund rejects non-finite amount without a gateway request', function (): void {
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', INF)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund rejects excessive amount without a gateway request', function (): void {
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 10000001)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund rejects malformed gateway payment identifier', function (): void {
    expect(app(RazorpayService::class)->createRefund('../invalid', 100)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund refuses missing gateway credentials', function (): void {
    config()->set('services.razorpay.key_secret', '');
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund refuses placeholder gateway credentials', function (): void {
    config()->set('services.razorpay.key_id', 'rzp_test_placeholder');
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
    Http::assertNothingSent();
});

test('refund rejects gateway response with a mismatched payment reference', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 10000, 'payment_id' => 'pay_other', 'status' => 'pending',
    ], 200)]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects gateway response with an incorrect amount', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 1, 'payment_id' => 'pay_valid_1', 'status' => 'pending',
    ], 200)]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund accepts a validated pending gateway response', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 10000, 'payment_id' => 'pay_valid_1', 'status' => 'pending',
    ], 200)]);
    $result = app(RazorpayService::class)->createRefund('pay_valid_1', 100);
    expect($result['success'])->toBeTrue()
        ->and($result['status'])->toBe('pending')
        ->and($result['refund_id'])->toBe('rfnd_123');
});


test('refund rejects an HTTP 401 gateway response', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response(['error' => ['description' => 'Unauthorized']], 401)]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects an HTTP 429 gateway response', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response(['error' => ['description' => 'Rate limited']], 429)]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects an HTTP 500 gateway response', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response(['error' => ['description' => 'Unavailable']], 500)]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects missing gateway refund identifier', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'amount' => 10000, 'payment_id' => 'pay_valid_1', 'status' => 'pending',
    ])]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects malformed gateway refund identifier', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'payment_123', 'amount' => 10000, 'payment_id' => 'pay_valid_1', 'status' => 'pending',
    ])]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects missing gateway payment reference', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 10000, 'status' => 'pending',
    ])]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects missing gateway amount', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'payment_id' => 'pay_valid_1', 'status' => 'pending',
    ])]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund rejects unsupported gateway status', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 10000, 'payment_id' => 'pay_valid_1', 'status' => 'failed',
    ])]);
    expect(app(RazorpayService::class)->createRefund('pay_valid_1', 100)['success'])->toBeFalse();
});

test('refund treats created gateway status as pending settlement', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 10000, 'payment_id' => 'pay_valid_1', 'status' => 'created',
    ])]);
    $result = app(RazorpayService::class)->createRefund('pay_valid_1', 100);
    expect($result['success'])->toBeTrue()->and($result['status'])->toBe('pending');
});

test('refund treats processed gateway status as completed settlement', function (): void {
    Http::fake(['api.razorpay.com/*' => Http::response([
        'id' => 'rfnd_123', 'amount' => 10000, 'payment_id' => 'pay_valid_1', 'status' => 'processed',
    ])]);
    $result = app(RazorpayService::class)->createRefund('pay_valid_1', 100);
    expect($result['success'])->toBeTrue()->and($result['status'])->toBe('completed');
});

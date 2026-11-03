<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

test('logout routes only accept POST requests', function (): void {
    expect(collect(Route::getRoutes()->getRoutes())
        ->first(fn ($route) => $route->uri() === 'logout')
        ->methods())->toContain('POST')->not->toContain('GET');

    expect(collect(Route::getRoutes()->getRoutes())
        ->first(fn ($route) => $route->uri() === 'admin/logout')
        ->methods())->toContain('POST')->not->toContain('GET');

    $this->get('/logout')->assertStatus(405);
    $this->get('/admin/logout')->assertStatus(405);
});

test('credentialed cors disallows wildcard origin patterns and unauthorized subdomains', function (): void {
    expect(config('cors.supports_credentials'))->toBeTrue()
        ->and(config('cors.allowed_origins_patterns'))->toBe([])
        ->and(config('cors.allowed_origins'))->not->toContain('*');

    $this->withHeader('Origin', 'https://untrusted.whizwheels.in')
        ->getJson('/api/v1/bikes')
        ->assertHeaderMissing('Access-Control-Allow-Origin');
});

test('payment webhook signature verification fails when secret is unconfigured', function (): void {
    config()->set('services.razorpay.webhook_secret', null);
    config()->set('services.phonepe.salt_key', null);

    expect(app(\App\Services\RazorpayService::class)
        ->verifyWebhookSignature('{"event":"payment.captured"}', 'any-signature'))->toBeFalse();

    expect(app(\App\Services\PhonePeService::class)
        ->verifyWebhookSignature('encoded', 'any-signature'))->toBeFalse();
});

test('production readiness check refuses nonproduction or incomplete deployment configuration', function (): void {
    $this->artisan('app:production-check')
        ->assertExitCode(1);
});

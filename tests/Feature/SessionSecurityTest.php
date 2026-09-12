<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Config;

test('session cookie configuration has secure defaults for production', function (): void {
    // http_only must be true to prevent XSS session hijacking
    expect(config('session.http_only'))->toBeTrue();

    // same_site must be 'lax' for secure cross-site navigation with OAuth/payment gateway callbacks
    expect(config('session.same_site'))->toBe('lax');

    // session lifetime must be reasonable (e.g. 120 minutes) and not indefinite
    expect(config('session.lifetime'))->toBe(120);
    expect(config('session.lifetime'))->toBeGreaterThan(0);
});

test('session cookie secure flag is true in production environment', function (): void {
    $sessionConfig = require config_path('session.php');

    // Simulate APP_ENV=production without SESSION_SECURE_COOKIE set
    putenv('SESSION_SECURE_COOKIE');
    unset($_ENV['SESSION_SECURE_COOKIE'], $_SERVER['SESSION_SECURE_COOKIE']);

    putenv('APP_ENV=production');
    $_ENV['APP_ENV'] = 'production';
    $_SERVER['APP_ENV'] = 'production';

    $prodConfig = require config_path('session.php');
    expect($prodConfig['secure'])->toBeTrue();

    // Restore test environment
    putenv('APP_ENV=testing');
    $_ENV['APP_ENV'] = 'testing';
    $_SERVER['APP_ENV'] = 'testing';
});

test('web requests issue cookies with HttpOnly and SameSite attributes', function (): void {
    $response = $this->get('/');
    $response->assertOk();

    $cookies = $response->headers->getCookies();
    $sessionCookie = null;
    $cookieName = config('session.cookie');

    foreach ($cookies as $cookie) {
        if ($cookie->getName() === $cookieName) {
            $sessionCookie = $cookie;
            break;
        }
    }

    if ($sessionCookie !== null) {
        expect($sessionCookie->isHttpOnly())->toBeTrue();
        expect(strtolower((string) $sessionCookie->getSameSite()))->toBe('lax');
    }
});

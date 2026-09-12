<?php

declare(strict_types=1);

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    // Define dummy test routes for triggering various exception types
    Route::get('/api/test-server-error', function () {
        throw new RuntimeException('Secret database password leaked in exception: super_secret_123');
    });

    Route::get('/api/test-query-exception', function () {
        $previous = new PDOException('SQLSTATE[42S02]: Base table or view not found: 1146 Table secret_users does not exist');
        throw new QueryException(
            'sqlite',
            'SELECT * FROM secret_users WHERE password_hash = ?',
            ['super_secret_hash_value'],
            $previous
        );
    });
});

test('config app.debug defaults to false in default production config', function (): void {
    $appConfig = require config_path('app.php');
    expect($appConfig['env'])->toBe(env('APP_ENV', 'production'))
        ->and($appConfig['debug'])->toBeBool();
});

test('unhandled runtime exception on API in production does not leak stack trace or message and logs server side', function (): void {
    config()->set('app.debug', false);
    Log::spy();

    $response = $this->getJson('/api/test-server-error');

    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'An unexpected error occurred. Please try again later.',
            'errors' => null,
        ]);

    $content = $response->getContent();
    expect($content)->not->toContain('super_secret_123')
        ->and($content)->not->toContain('RuntimeException')
        ->and($content)->not->toContain('trace')
        ->and($content)->not->toContain('.php');

    Log::shouldHaveReceived('error')
        ->atLeast()->once()
        ->withArgs(function ($message, $context = []) {
            return str_contains((string) $message, 'Secret database password leaked')
                || (isset($context['exception']) && str_contains($context['exception'], 'RuntimeException'));
        });
});

test('raw sql query exception on API in production does not leak raw sql query or table names and logs sql server side', function (): void {
    config()->set('app.debug', false);
    Log::spy();

    $response = $this->getJson('/api/test-query-exception');

    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'An unexpected error occurred. Please try again later.',
            'errors' => null,
        ]);

    $content = $response->getContent();
    expect($content)->not->toContain('secret_users')
        ->and($content)->not->toContain('super_secret_hash_value')
        ->and($content)->not->toContain('SELECT * FROM')
        ->and($content)->not->toContain('SQLSTATE');

    Log::shouldHaveReceived('error')
        ->atLeast()->once()
        ->withArgs(function ($message, $context = []) {
            return (isset($context['sql']) && str_contains($context['sql'], 'SELECT * FROM secret_users'))
                || str_contains((string) $message, 'secret_users');
        });
});

test('unhandled 404 and 405 on API return sanitized envelopes', function (): void {
    $notFoundResponse = $this->getJson('/api/v1/non-existent-endpoint-abc-xyz');
    $notFoundResponse->assertStatus(404)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Resource not found.',
            'errors' => null,
        ]);

    $methodNotAllowedResponse = $this->deleteJson('/api/v1/auth/login');
    $methodNotAllowedResponse->assertStatus(405)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Method not allowed.',
            'errors' => null,
        ]);
});

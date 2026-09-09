<?php

declare(strict_types=1);

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'logout',
            'admin/logout',
        ]);
        $middleware->statefulApi();
        $middleware->alias([
            'admin.auth' => \App\Http\Middleware\EnsureAdminOrStaff::class,
            'service.access' => \App\Http\Middleware\EnsureServiceAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthenticated.',
                    'errors' => null,
                ], 401);
            }
        });

        $exceptions->render(function (\App\Exceptions\BikeNotAvailableException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage(),
                    'errors' => null,
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException|\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage() ?: 'This action is unauthorized.',
                    'errors' => null,
                ], 403);
            }
        });

        $exceptions->render(function (\App\Exceptions\InvalidBookingTransitionException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage(),
                    'errors' => null,
                ], 422);
            }
        });
    })->create();

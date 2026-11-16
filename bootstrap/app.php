<?php

declare(strict_types=1);

use App\Exceptions\BikeNotAvailableException;
use App\Exceptions\InvalidBookingTransitionException;
use App\Exceptions\ServiceItemNotAvailableException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Exceptions\MissingAbilityException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Cloudflare & Reverse Proxy Trust:
        // Configures trusted proxy CIDRs so $request->ip() and isSecure() correctly identify
        // the client's real IP and HTTPS protocol behind Cloudflare WAF/CDN.
        $trustedProxies = env('TRUSTED_PROXIES', 'cloudflare');
        if ($trustedProxies === '*' || $trustedProxies === '**') {
            $middleware->trustProxies(at: '*');
        } elseif ($trustedProxies === 'cloudflare') {
            $middleware->trustProxies(at: [
                '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
                '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
                '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
                '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
                '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
                '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
                '127.0.0.1', '::1',
            ]);
        } elseif (! empty($trustedProxies)) {
            $middleware->trustProxies(at: array_map('trim', explode(',', $trustedProxies)));
        }

        $middleware->append(\Spatie\Csp\AddCspHeaders::class);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('admin') || $request->is('admin/*') ? route('admin.login') : route('login'));
        $middleware->priority([
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\AdminSessionTimeout::class,
            \App\Http\Middleware\EnsureAdminOrStaff::class,
            \Illuminate\Auth\Middleware\Authenticate::class,
        ]);
        $middleware->alias([
            'admin.timeout' => \App\Http\Middleware\AdminSessionTimeout::class,
            'admin.auth' => \App\Http\Middleware\EnsureAdminOrStaff::class,
            'service.access' => \App\Http\Middleware\EnsureServiceAccess::class,
            'role' => \App\Http\Middleware\EnsureRole::class,
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
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

            $isAdmin = $request->is('admin') || $request->is('admin/*') || in_array('admin', $e->guards(), true);
            $loginRoute = $isAdmin ? route('admin.login') : route('login');

            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::location($loginRoute);
            }

            return redirect()->guest($loginRoute);
        });

        $exceptions->render(function (BikeNotAvailableException|ServiceItemNotAvailableException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage(),
                    'errors' => null,
                ], 422);
            }
        });

        $exceptions->render(function (AuthorizationException|AccessDeniedHttpException|MissingAbilityException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage() ?: 'This action is unauthorized.',
                    'errors' => null,
                ], 403);
            }
        });

        $exceptions->render(function (InvalidBookingTransitionException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage(),
                    'errors' => null,
                ], 422);
            }
        });

        $exceptions->render(function (NotFoundHttpException|ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Resource not found.',
                    'errors' => null,
                ], 404);
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Method not allowed.',
                    'errors' => null,
                ], 405);
            }
        });

        $exceptions->render(function (HttpResponseException $e) {
            return $e->getResponse();
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Too many requests. Please try again later.',
                    'errors' => null,
                ], 429);
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                $statusCode = $e instanceof HttpExceptionInterface
                    ? $e->getStatusCode()
                    : 500;

                // Never log request URLs, SQL bindings, or raw exception messages
                // in production: these can contain passwords, tokens or KYC data.
                $diagnostics = [
                    'exception' => get_class($e),
                    'path' => $request->path(),
                    'method' => $request->method(),
                    'status' => $statusCode,
                ];

                if (config('app.debug', false) && ! app()->isProduction()) {
                    $diagnostics['message'] = $e->getMessage();
                    $diagnostics['file'] = $e->getFile();
                    $diagnostics['line'] = $e->getLine();
                    $diagnostics['trace'] = $e->getTraceAsString();
                }

                Log::error('Unhandled API exception', $diagnostics);

                $isProductionOrNoDebug = app()->isProduction() || ! config('app.debug', false);

                $message = $isProductionOrNoDebug
                    ? 'An unexpected error occurred. Please try again later.'
                    : $e->getMessage();

                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $message,
                    'errors' => null,
                ], $statusCode);
            }
        });
    })->create();

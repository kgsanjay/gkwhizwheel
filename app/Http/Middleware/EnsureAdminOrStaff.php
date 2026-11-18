<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrStaff
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('admin')->user() ?? $request->user('admin');

        if ($user === null) {
            // If user is authenticated on web guard as customer, reject admin access with 403 Forbidden
            $customerUser = Auth::guard('web')->user() ?? $request->user();
            if ($customerUser !== null && ! $customerUser->isStaffOrAdmin()) {
                if ($request->is('api/*') || $request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'data' => null,
                        'message' => 'Unauthorized. Staff or Admin privileges required.',
                        'errors' => null,
                    ], 403);
                }

                abort(403, 'Unauthorized. Staff or Admin privileges required.');
            }

            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthenticated.',
                    'errors' => null,
                ], 401);
            }

            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::location(route('admin.login'));
            }

            return redirect()->guest(route('admin.login'));
        }

        if ($user->status === \App\Enums\UserStatus::BLACKLISTED) {
            Auth::guard('admin')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'This account has been suspended or deactivated.',
                    'errors' => null,
                ], 403);
            }

            abort(403, 'This account has been suspended or deactivated.');
        }

        if (! $user->isStaffOrAdmin()) {
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthorized. Staff or Admin privileges required.',
                    'errors' => null,
                ], 403);
            }

            abort(403, 'Unauthorized. Staff or Admin privileges required.');
        }

        Auth::shouldUse('admin');

        return $next($request);
    }
}

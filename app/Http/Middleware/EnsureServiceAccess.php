<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureServiceAccess
{
    /**
     * Handle an incoming request for multi-service management.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $requiredService = null): Response
    {
        $user = $request->user();

        if ($user === null) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect()->guest(route('admin.login'));
        }

        $allowedRoles = [
            UserRole::SUPER_ADMIN,
            UserRole::STORE_MANAGER,
            UserRole::STAFF,
        ];

        if (! in_array($user->role, $allowedRoles, true)) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Staff or Admin privileges required.',
                ], 403);
            }

            abort(403, 'Unauthorized. Staff or Admin privileges required.');
        }

        // Super Admin has unrestricted access to all services
        if ($user->role === UserRole::SUPER_ADMIN) {
            return $next($request);
        }

        // Determine service type from route parameter or explicit middleware argument
        $serviceType = $requiredService ?? (string) $request->route('serviceType');

        if ($serviceType !== '' && ! $user->canManageService($serviceType)) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => "Access denied. You do not have permissions to manage the {$serviceType} service.",
                ], 403);
            }

            abort(403, "Access denied. You do not have permissions to manage the {$serviceType} service.");
        }

        return $next($request);
    }
}

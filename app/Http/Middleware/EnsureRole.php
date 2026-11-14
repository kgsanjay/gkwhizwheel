<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthenticated.',
                    'errors' => null,
                ], 401);
            }

            return redirect()->guest(route('admin.login'));
        }

        $normalizedRoles = [];
        foreach ($roles as $r) {
            $normalizedRoles[] = $r;
            if ($r === 'super_admin' || $r === 'superadmin') {
                $normalizedRoles[] = 'super_admin';
                $normalizedRoles[] = 'superadmin';
            } elseif ($r === 'store_manager' || $r === 'admin') {
                $normalizedRoles[] = 'store_manager';
                $normalizedRoles[] = 'admin';
            } elseif ($r === 'staff' || $r === 'manager') {
                $normalizedRoles[] = 'staff';
                $normalizedRoles[] = 'manager';
            }
        }
        $normalizedRoles = array_unique($normalizedRoles);

        $userRoleValue = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
        $authorized = in_array($userRoleValue, $normalizedRoles, true);

        if (! $authorized) {
            try {
                $authorized = $user->hasAnyRole($normalizedRoles);
            } catch (\Throwable) {
                // Ignore if Spatie permission tables are not populated
            }
        }

        if (! $authorized) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthorized. Required role: '.implode(', ', $roles).'.',
                    'errors' => null,
                ], 403);
            }

            abort(403, 'Unauthorized. Required role: '.implode(', ', $roles).'.');
        }

        return $next($request);
    }
}

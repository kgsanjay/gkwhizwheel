<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
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
        $user = $request->user();

        if ($user === null) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthenticated.',
                    'errors' => null,
                ], 401);
            }

            return redirect()->guest(route('admin.login'));
        }

        $allowedRoles = [
            UserRole::SUPER_ADMIN,
            UserRole::STORE_MANAGER,
            UserRole::STAFF,
        ];

        if (! in_array($user->role, $allowedRoles, true)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Unauthorized. Staff or Admin privileges required.',
                    'errors' => null,
                ], 403);
            }

            abort(403, 'Unauthorized. Staff or Admin privileges required.');
        }

        return $next($request);
    }
}

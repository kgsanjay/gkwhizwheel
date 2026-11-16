<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionTimeout
{
    /**
     * Strict admin inactivity timeout in seconds (30 minutes).
     */
    public const TIMEOUT_SECONDS = 1800;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('admin')->check()) {
            $lastActivity = $request->session()->get('admin.last_activity_time');
            $currentTime = time();

            if ($lastActivity !== null && ($currentTime - (int) $lastActivity) > self::TIMEOUT_SECONDS) {
                Auth::guard('admin')->logout();
                $request->session()->forget(['admin.last_activity_time', 'admin.active_store_id']);

                $timeoutMessage = 'Your admin session has expired due to 30 minutes of inactivity. Please sign in again.';

                if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                    return response()->json([
                        'success' => false,
                        'data' => null,
                        'message' => $timeoutMessage,
                        'errors' => null,
                    ], 401);
                }

                $request->session()->flash('error', $timeoutMessage);

                if ($request->header('X-Inertia')) {
                    return Inertia::location(route('admin.login'));
                }

                return redirect()->route('admin.login')->with('error', $timeoutMessage);
            }

            $request->session()->put('admin.last_activity_time', $currentTime);
        }

        return $next($request);
    }
}

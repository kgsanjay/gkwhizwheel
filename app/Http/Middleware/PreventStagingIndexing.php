<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventStagingIndexing
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // The staging hostname must never compete with the canonical website.
        // Exact comparison avoids accidentally marking production as noindex.
        if (strtolower($request->getHost()) === 'staging.whizwheels.in') {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        }

        return $response;
    }
}

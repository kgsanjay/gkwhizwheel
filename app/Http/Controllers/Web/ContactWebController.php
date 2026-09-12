<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactWebController extends Controller
{
    /**
     * Handle public contact inquiries with rate limiting.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'dates' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        Log::info('Contact inquiry received', [
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'ip' => $request->ip(),
        ]);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Thank you! Your inquiry has been received. Our team will contact you shortly.',
            ]);
        }

        return back()->with('success', 'Thank you! Your inquiry has been received. Our team will contact you shortly.');
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    /**
     * Store or update device Expo push token for the authenticated customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expo_push_token' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->update([
            'expo_push_token' => $validated['expo_push_token'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expo push token registered successfully.',
            'data' => [
                'expo_push_token' => $user->expo_push_token,
            ],
        ]);
    }

    /**
     * Remove device Expo push token for the authenticated customer (e.g. on logout).
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'expo_push_token' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expo push token removed successfully.',
        ]);
    }
}

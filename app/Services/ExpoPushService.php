<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    protected const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send a push notification to an Expo Push Token.
     *
     * @param  string  $pushToken  e.g. ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
     * @param  string  $title
     * @param  string  $body
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function sendNotification(
        string $pushToken,
        string $title,
        string $body,
        array $data = [],
        array $options = []
    ): array {
        if (! $this->isValidExpoPushToken($pushToken)) {
            Log::warning("Invalid Expo push token provided: {$pushToken}");
            return [
                'status' => 'error',
                'message' => 'Invalid Expo push token format.',
            ];
        }

        $payload = array_merge([
            'to' => $pushToken,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'sound' => 'default',
            'priority' => 'high',
            'channelId' => 'default',
        ], $options);

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post(self::EXPO_PUSH_URL, $payload);

            $body = $response->json();

            if (! $response->successful()) {
                $errorMsg = $body['errors'][0]['message'] ?? 'Expo push API request failed.';
                Log::error("Expo push notification failed: {$errorMsg}", [
                    'token' => $pushToken,
                    'status_code' => $response->status(),
                ]);

                return [
                    'status' => 'error',
                    'message' => $errorMsg,
                ];
            }

            $ticket = $body['data'] ?? null;
            $ticketStatus = is_array($ticket) && isset($ticket['status']) ? $ticket['status'] : 'ok';

            return [
                'status' => $ticketStatus,
                'data' => $body,
            ];
        } catch (\Throwable $e) {
            Log::error("Expo push notification network exception: {$e->getMessage()}", [
                'token' => $pushToken,
            ]);

            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Validate whether a token looks like an Expo Push Token.
     */
    public function isValidExpoPushToken(string $token): bool
    {
        return str_starts_with($token, 'ExponentPushToken[')
            || str_starts_with($token, 'ExpoPushToken[')
            || preg_match('/^[a-zA-Z0-9_\-]{20,}$/', $token) === 1;
    }
}

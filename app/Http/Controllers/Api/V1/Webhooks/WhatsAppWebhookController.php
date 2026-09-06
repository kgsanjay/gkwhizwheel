<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WhatsAppWebhookController extends Controller
{
    /**
     * Verify webhook challenge from Meta App Dashboard.
     */
    public function verify(Request $request): Response
    {
        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $token = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $challenge = (string) $request->query('hub_challenge', $request->query('hub.challenge'));

        $configuredToken = (string) config('services.whatsapp.webhook_verify_token', 'test_wa_verify_token');

        if ($mode === 'subscribe' && $token === $configuredToken) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response('Forbidden', 403);
    }

    /**
     * Handle incoming delivery status updates from Meta WhatsApp Cloud API.
     */
    public function handle(Request $request, WhatsAppService $whatsAppService): JsonResponse
    {
        $entries = $request->input('entry', []);
        $processedCount = 0;

        foreach ($entries as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $statuses = $change['value']['statuses'] ?? [];
                foreach ($statuses as $status) {
                    $whatsAppService->updateDeliveryStatus($status);
                    $processedCount++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'processed_statuses_count' => $processedCount,
            ],
            'message' => 'WhatsApp webhook processed successfully.',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PhonePeService
{
    /**
     * Create a PhonePe standard pay request for advance + deposit combined (Option A).
     *
     * @return array<string, mixed>
     */
    public function createPayment(Booking $booking, ?string $redirectUrl = null): array
    {
        $merchantId = (string) config('services.phonepe.merchant_id', 'PGTESTPAYUAT');
        $saltKey = (string) config('services.phonepe.salt_key', 'test_phonepe_salt_key');
        $saltIndex = (string) config('services.phonepe.salt_index', '1');
        $baseUrl = (string) config('services.phonepe.base_url', 'https://api-preprod.phonepe.com/apis/pg-sandbox');
        $callbackUrl = (string) config('services.phonepe.callback_url', url('/webhooks/phonepe'));
        $finalRedirectUrl = $redirectUrl ?? (string) config('services.phonepe.redirect_url', url('/payment/phonepe/callback'));

        $amountPaise = (int) round((float) $booking->total_amount * 100);
        $merchantTransactionId = 'TXN_BK_'.$booking->id.'_'.Str::random(8);

        $requestData = [
            'merchantId' => $merchantId,
            'merchantTransactionId' => $merchantTransactionId,
            'merchantUserId' => 'USER_'.$booking->user_id,
            'amount' => $amountPaise,
            'redirectUrl' => $finalRedirectUrl,
            'redirectMode' => 'POST',
            'callbackUrl' => $callbackUrl,
            'mobileNumber' => (string) ($booking->user?->phone ?? '9999999999'),
            'paymentInstrument' => [
                'type' => 'PAY_PAGE',
            ],
        ];

        $base64Payload = base64_encode((string) json_encode($requestData, JSON_THROW_ON_ERROR));
        $endpoint = '/pg/v1/pay';
        $checksum = hash('sha256', $base64Payload.$endpoint.$saltKey).'###'.$saltIndex;

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'accept' => 'application/json',
            ])->timeout(5)->post($baseUrl.$endpoint, [
                'request' => $base64Payload,
            ]);

            if ($response->successful() && ($response->json('success') === true)) {
                $json = $response->json();

                return [
                    'merchant_transaction_id' => $merchantTransactionId,
                    'amount' => (float) $booking->total_amount,
                    'amount_paise' => $amountPaise,
                    'redirect_url' => $json['data']['instrumentResponse']['redirectInfo']['url'] ?? null,
                    'status' => 'pending_payment',
                    'raw' => $json,
                ];
            }
        } catch (\Throwable) {
            // fall through to synthetic order for testing / local environment
        }

        if (app()->environment('local', 'testing')) {
            // ponytail: synthetic order generation for PhonePe sandbox/local dev testing
            return [
                'merchant_transaction_id' => $merchantTransactionId,
                'amount' => (float) $booking->total_amount,
                'amount_paise' => $amountPaise,
                'redirect_url' => 'https://mercury-uat.phonepe.com/transact/simulator?token='.Str::random(32),
                'status' => 'pending_payment',
                'raw' => [
                    'success' => true,
                    'code' => 'PAYMENT_INITIATED',
                    'message' => 'Payment initiated successfully',
                ],
            ];
        }

        throw new \RuntimeException('PhonePe payment initiation failed: '.($response->body() ?? 'unknown error'));
    }

    /**
     * Verify the HMAC SHA-256 / X-VERIFY signature of an incoming PhonePe webhook.
     */
    public function verifyWebhookSignature(
        string $base64Response,
        ?string $signatureHeader,
        ?string $saltKey = null,
        ?string $saltIndex = null
    ): bool {
        if ($signatureHeader === null || $signatureHeader === '') {
            return false;
        }

        $key = $saltKey ?? (string) config('services.phonepe.salt_key', '');
        $index = $saltIndex ?? (string) config('services.phonepe.salt_index', '1');

        if ($key === '') {
            return false;
        }

        $expectedChecksum = hash('sha256', $base64Response.$key).'###'.$index;

        return hash_equals($expectedChecksum, $signatureHeader);
    }

    /**
     * Decode and parse base64 webhook response payload from PhonePe.
     *
     * @return array<string, mixed>|null
     */
    public function decodeWebhookResponse(string $base64Response): ?array
    {
        $decoded = base64_decode($base64Response, true);
        if ($decoded === false) {
            return null;
        }

        $json = json_decode($decoded, true);

        return is_array($json) ? $json : null;
    }
}

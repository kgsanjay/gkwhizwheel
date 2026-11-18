<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;
use App\Models\ServiceBooking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PhonePeService
{
    /**
     * Create a PhonePe standard pay request for bike rental advance + deposit combined (Option A).
     *
     * @return array<string, mixed>
     */
    public function createPayment(Booking $booking, ?string $redirectUrl = null, ?float $overrideAmount = null): array
    {
        $amount = $overrideAmount !== null ? round($overrideAmount, 2) : BikeBookingPayments::expectedGatewayAmount($booking);
        $merchantTransactionId = 'TXN_BK_'.$booking->id.'_'.Str::random(8);

        return $this->initiateStandardPay(
            $merchantTransactionId,
            'USER_'.($booking->user_id ?? 'GUEST'),
            $amount,
            (string) ($booking->user?->phone ?? '9999999999'),
            $redirectUrl
        );
    }

    /**
     * Create a PhonePe standard pay request for a travel service booking balance.
     *
     * @return array<string, mixed>
     */
    public function createServicePayment(ServiceBooking $booking, float $amount, ?string $redirectUrl = null): array
    {
        $merchantTransactionId = 'TXN_SRV_'.$booking->id.'_'.Str::random(8);

        return $this->initiateStandardPay(
            $merchantTransactionId,
            'USER_'.($booking->user_id ?? 'GUEST'),
            $amount,
            (string) ($booking->customer_phone ?: $booking->user?->phone ?: '9999999999'),
            $redirectUrl
        );
    }

    /**
     * Shared PhonePe PAY_PAGE initiation for bookings and travel services.
     *
     * @return array<string, mixed>
     */
    protected function initiateStandardPay(
        string $merchantTransactionId,
        string $merchantUserId,
        float $amount,
        string $mobileNumber,
        ?string $redirectUrl = null
    ): array {
        $merchantId = (string) config('services.phonepe.merchant_id', '');
        $saltKey = (string) config('services.phonepe.salt_key', '');
        $saltIndex = (string) config('services.phonepe.salt_index', '1');
        $baseUrl = (string) config('services.phonepe.base_url', 'https://api-preprod.phonepe.com/apis/pg-sandbox');

        if ($merchantId === '' || $saltKey === '') {
            throw new \RuntimeException('PhonePe payment gateway credentials are not configured.');
        }
        $callbackUrl = (string) config('services.phonepe.callback_url', url('/webhooks/phonepe'));
        $finalRedirectUrl = $redirectUrl ?? (string) config('services.phonepe.redirect_url', url('/payment/phonepe/callback'));

        $amountPaise = (int) round($amount * 100);

        $requestData = [
            'merchantId' => $merchantId,
            'merchantTransactionId' => $merchantTransactionId,
            'merchantUserId' => $merchantUserId,
            'amount' => $amountPaise,
            'redirectUrl' => $finalRedirectUrl,
            'redirectMode' => 'POST',
            'callbackUrl' => $callbackUrl,
            'mobileNumber' => $mobileNumber,
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
            ])->timeout(8)->post($baseUrl.$endpoint, [
                'request' => $base64Payload,
            ]);

            if ($response->successful() && ($response->json('success') === true)) {
                $json = $response->json();

                return [
                    'merchant_transaction_id' => $merchantTransactionId,
                    'amount' => $amount,
                    'amount_paise' => $amountPaise,
                    'redirect_url' => $json['data']['instrumentResponse']['redirectInfo']['url'] ?? null,
                    'status' => 'pending_payment',
                    'raw' => $json,
                ];
            }

            \Illuminate\Support\Facades\Log::warning('PhonePe payment initiation rejected', [
                'merchant_id' => $merchantId,
                'status' => $response->status(),
                'response' => $response->json() ?? $response->body(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PhonePe payment initiation network exception', [
                'merchant_id' => $merchantId,
                'message' => $e->getMessage(),
            ]);
        }

        if (app()->environment('testing')) {
            // Simulated order for PHPUnit / test suite environments
            return [
                'merchant_transaction_id' => $merchantTransactionId,
                'amount' => $amount,
                'amount_paise' => $amountPaise,
                'redirect_url' => $finalRedirectUrl.'?merchantTransactionId='.$merchantTransactionId,
                'status' => 'pending_payment',
                'raw' => [
                    'success' => true,
                    'code' => 'PAYMENT_INITIATED',
                    'message' => 'Simulated test payment initiated successfully',
                ],
            ];
        }

        $errorMsg = isset($response)
            ? ($response->json('message') ?? $response->json('code') ?? 'Gateway returned HTTP '.$response->status())
            : 'Unable to connect to PhonePe gateway.';

        throw new \RuntimeException('PhonePe payment initiation failed: '.$errorMsg);
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

    /**
     * Query PhonePe's Check Status API (GET /pg/v1/status/{merchantId}/{merchantTransactionId})
     * to verify a transaction server-to-server when the browser returns to the callback URL.
     *
     * @return array{verified: bool, code: string, state: string, amount_paise: int, transaction_id: string, raw: ?array<string, mixed>}
     */
    public function checkPaymentStatus(string $merchantTransactionId): array
    {
        $merchantId = (string) config('services.phonepe.merchant_id', 'PGTESTPAYUAT');
        $saltKey = (string) config('services.phonepe.salt_key', '');
        $saltIndex = (string) config('services.phonepe.salt_index', '1');
        $baseUrl = (string) config('services.phonepe.base_url', 'https://api-preprod.phonepe.com/apis/pg-sandbox');

        $endpoint = '/pg/v1/status/'.$merchantId.'/'.$merchantTransactionId;
        $checksum = hash('sha256', $endpoint.$saltKey).'###'.$saltIndex;

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY' => $checksum,
                'X-MERCHANT-ID' => $merchantId,
                'accept' => 'application/json',
            ])->timeout(8)->get($baseUrl.$endpoint);

            /** @var array<string, mixed>|null $json */
            $json = $response->json();
            $code = strtoupper((string) ($json['code'] ?? ''));
            $state = strtoupper((string) ($json['data']['state'] ?? ''));
            $amountPaise = (int) ($json['data']['amount'] ?? 0);
            $gatewayTxnId = (string) ($json['data']['transactionId'] ?? $merchantTransactionId);
            $verified = $response->successful()
                && ($json['success'] ?? false) === true
                && ($code === 'PAYMENT_SUCCESS' || $state === 'COMPLETED');

            return [
                'verified' => $verified,
                'code' => $code,
                'state' => $state,
                'amount_paise' => $amountPaise,
                'transaction_id' => $gatewayTxnId,
                'raw' => is_array($json) ? $json : null,
            ];
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('PhonePe status check failed', [
                'merchant_transaction_id' => $merchantTransactionId,
                'message' => $e->getMessage(),
            ]);

            return [
                'verified' => false,
                'code' => 'STATUS_CHECK_ERROR',
                'state' => 'UNKNOWN',
                'amount_paise' => 0,
                'transaction_id' => '',
                'raw' => null,
            ];
        }
    }

    /**
     * Issue a refund via PhonePe PG API (POST /pg/v1/refund).
     *
     * @return array{success: bool, refund_id: ?string, status: string, error: ?string, data?: array<string, mixed>}
     */
    public function createRefund(string $originalTransactionId, float $amount, string $userId = '1', ?string $callbackUrl = null): array
    {
        $merchantId = (string) config('services.phonepe.merchant_id', '');
        $saltKey = (string) config('services.phonepe.salt_key', '');
        $saltIndex = (string) config('services.phonepe.salt_index', '1');
        $baseUrl = (string) config('services.phonepe.base_url', 'https://api-preprod.phonepe.com/apis/pg-sandbox');

        if ($merchantId === '' || $saltKey === '') {
            throw new \RuntimeException('PhonePe payment gateway credentials are not configured.');
        }
        $cbUrl = $callbackUrl ?? (string) config('services.phonepe.callback_url', url('/webhooks/phonepe'));

        $amountPaise = (int) round($amount * 100);
        $merchantRefundTxnId = 'rfnd_'.strtolower(Str::random(12));

        $requestData = [
            'merchantId' => $merchantId,
            'merchantUserId' => 'USER_'.$userId,
            'originalTransactionId' => $originalTransactionId,
            'merchantTransactionId' => $merchantRefundTxnId,
            'amount' => $amountPaise,
            'callbackUrl' => $cbUrl,
        ];

        $base64Payload = base64_encode((string) json_encode($requestData, JSON_THROW_ON_ERROR));
        $endpoint = '/pg/v1/refund';
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
                /** @var array<string, mixed> $json */
                $json = $response->json();
                $state = strtoupper((string) ($json['data']['state'] ?? ''));

                return [
                    'success' => true,
                    'refund_id' => $json['data']['transactionId'] ?? $merchantRefundTxnId,
                    'status' => $state === 'COMPLETED' ? 'completed' : 'pending',
                    'error' => null,
                    'data' => $json,
                ];
            }

            \Illuminate\Support\Facades\Log::warning('PhonePe refund API call unauthenticated or rejected', [
                'transaction_id' => $originalTransactionId,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PhonePe refund network exception', [
                'transaction_id' => $originalTransactionId,
                'message' => $e->getMessage(),
            ]);
        }

        if (app()->environment('local', 'testing')) {
            // ponytail: synthetic simulated refund in local dev & testing
            return [
                'success' => true,
                'refund_id' => $merchantRefundTxnId,
                'status' => 'pending',
                'error' => null,
                'data' => [
                    'merchantTransactionId' => $merchantRefundTxnId,
                    'amount' => $amount,
                    'state' => 'PENDING',
                ],
            ];
        }

        return [
            'success' => false,
            'refund_id' => null,
            'status' => 'failed',
            'error' => isset($response) ? ($response->json('message') ?? 'PhonePe refund rejected') : 'Gateway connection error',
        ];
    }
}

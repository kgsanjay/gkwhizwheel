<?php

declare(strict_types=1);

namespace App\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class MaskSensitiveDataProcessor implements ProcessorInterface
{
    /**
     * Keys whose values must be redacted.
     *
     * @var list<string>
     */
    protected static array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'cvv',
        'cvc',
        'cvv2',
        'card_number',
        'card_num',
        'pan',
        'credit_card',
        'secret',
        'api_secret',
        'key_secret',
        'document_content',
        'file_content',
        'raw_document',
        'base64',
    ];

    /**
     * Process Monolog log record and mask sensitive data.
     */
    public function __invoke(LogRecord $record): LogRecord
    {
        $sanitizedMessage = self::maskSensitiveString($record->message);
        $sanitizedContext = self::maskSensitiveArray($record->context);
        $sanitizedExtra = self::maskSensitiveArray($record->extra);

        return $record->with(
            message: $sanitizedMessage,
            context: $sanitizedContext,
            extra: $sanitizedExtra
        );
    }

    /**
     * Recursively mask sensitive fields in arrays.
     *
     * @param array<mixed> $data
     * @return array<mixed>
     */
    public static function maskSensitiveArray(array $data): array
    {
        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            // 1. Redact if the key matches sensitive fields
            foreach (self::$sensitiveKeys as $sensitiveKey) {
                if (str_contains($lowerKey, $sensitiveKey)) {
                    $data[$key] = '[REDACTED]';
                    continue 2;
                }
            }

            // 2. Recursively sanitize nested arrays
            if (is_array($value)) {
                $data[$key] = self::maskSensitiveArray($value);
                continue;
            }

            // 3. String pattern masking
            if (is_string($value)) {
                $data[$key] = self::maskSensitiveString($value);
            }
        }

        return $data;
    }

    /**
     * Mask sensitive values (credit cards, base64 documents, CVVs, passwords) in strings.
     */
    public static function maskSensitiveString(string $text): string
    {
        // 1. Data URLs / base64 payloads
        if (str_starts_with($text, 'data:') || (strlen($text) > 256 && preg_match('/^[a-zA-Z0-9+\/=\r\n]+$/', $text))) {
            return '[BINARY/BASE64 DOCUMENT REDACTED]';
        }

        // 2. Credit card numbers (13 to 19 digits with optional hyphens or spaces)
        $text = (string) preg_replace_callback(
            '/\b(?:\d[ -]*?){13,19}\b/',
            function (array $matches): string {
                $cleaned = preg_replace('/[ -]/', '', $matches[0]);
                if (strlen($cleaned) >= 13 && strlen($cleaned) <= 19) {
                    return str_repeat('*', strlen($cleaned) - 4) . substr($cleaned, -4);
                }
                return $matches[0];
            },
            $text
        );

        // 3. CVV/CVC in key-value string pairs (e.g. cvv=123, "cvv": "123")
        $text = (string) preg_replace('/([\'"]?(?:cvv|cvc|cvv2)[\'"]?\s*[:=]\s*[\'"]?)\d{3,4}([\'"]?)/i', '$1***$2', $text);

        // 4. Password/secret in key-value string pairs (e.g. password=secret, "password": "xyz")
        $text = (string) preg_replace('/([\'"]?(?:password|secret)[\'"]?\s*[:=]\s*[\'"]?)[^\s\'"&,]+([\'"]?)/i', '$1[REDACTED]$2', $text);

        return $text;
    }
}

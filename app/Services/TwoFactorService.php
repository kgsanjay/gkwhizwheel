<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use chillerlan\QRCode\QRCode;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    protected Google2FA $google2fa;

    public function __construct(?Google2FA $google2fa = null)
    {
        $this->google2fa = $google2fa ?? new Google2FA();
    }

    /**
     * Generate a new 16-character / 32-character base32 secret key.
     */
    public function generateSecretKey(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Generate an otpauth:// provisioning URI for authenticator apps.
     */
    public function getQrCodeUrl(string $email, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            'GK WhizWheels',
            $email,
            $secret
        );
    }

    /**
     * Render the QR Code as a data URI (SVG) for direct image rendering.
     */
    public function getQrCodeDataUri(string $email, string $secret): string
    {
        $url = $this->getQrCodeUrl($email, $secret);

        return (new QRCode())->render($url);
    }

    /**
     * Verify a 6-digit TOTP code against a secret key with a 1-step (±30s) drift window.
     */
    public function verify(string $secret, string $code): bool
    {
        $cleanCode = preg_replace('/\s+/', '', $code);

        if (empty($cleanCode)) {
            return false;
        }

        try {
            return (bool) $this->google2fa->verifyKey($secret, $cleanCode, 1);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Generate a list of emergency recovery codes.
     *
     * @return list<string>
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];

        for ($i = 0; $i < $count; $i++) {
            $codes[] = sprintf('%s-%s', Str::lower(Str::random(5)), Str::lower(Str::random(5)));
        }

        return $codes;
    }

    /**
     * Check if a given code matches an emergency recovery code, and consume it if valid.
     */
    public function verifyAndConsumeRecoveryCode(User $user, string $code): bool
    {
        $cleanCode = Str::lower(trim($code));
        $codes = $user->two_factor_recovery_codes ?? [];

        if (! is_array($codes) || empty($codes)) {
            return false;
        }

        foreach ($codes as $index => $recoveryCode) {
            if (hash_equals(Str::lower(trim((string) $recoveryCode)), $cleanCode)) {
                unset($codes[$index]);
                $user->two_factor_recovery_codes = array_values($codes);
                $user->save();

                return true;
            }
        }

        return false;
    }
}

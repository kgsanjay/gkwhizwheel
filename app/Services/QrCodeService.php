<?php

declare(strict_types=1);

namespace App\Services;

use chillerlan\QRCode\QRCode;

class QrCodeService
{
    /**
     * Generate a crisp Base64 SVG or image data URI for the given string/URL.
     */
    public function generateDataUri(string $content): string
    {
        return (new QRCode())->render($content);
    }
}

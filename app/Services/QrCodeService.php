<?php

declare(strict_types=1);

namespace App\Services;

use chillerlan\QRCode\Output\QRGdImagePNG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

class QrCodeService
{
    /**
     * Generate a crisp Base64 PNG data URI for the given string/URL.
     */
    public function generateDataUri(string $content): string
    {
        $options = new QROptions([
            'outputInterface' => QRGdImagePNG::class,
            'outputBase64' => true,
            'scale' => 6,
        ]);

        return (new QRCode($options))->render($content);
    }

    /**
     * Generate crisp PNG image binary bytes for the given content.
     */
    public function generatePng(string $content, int $scale = 10): string
    {
        $options = new QROptions([
            'outputInterface' => QRGdImagePNG::class,
            'outputBase64' => false,
            'scale' => $scale,
        ]);

        return (new QRCode($options))->render($content);
    }
}

<?php

declare(strict_types=1);

namespace App\Support\Csp;

use Spatie\Csp\Directive;
use Spatie\Csp\Keyword;
use Spatie\Csp\Policy;
use Spatie\Csp\Preset;

class WhizWheelCspPreset implements Preset
{
    public function configure(Policy $policy): void
    {
        $policy
            // Baseline restrictions
            ->add(Directive::DEFAULT, Keyword::SELF)
            ->add(Directive::BASE, Keyword::SELF)
            ->add(Directive::OBJECT, Keyword::NONE)
            ->add(Directive::MEDIA, Keyword::SELF)
            ->add(Directive::FRAME_ANCESTORS, Keyword::SELF)

            // Scripts: self and strict nonce-based inline execution
            ->add(Directive::SCRIPT, [
                Keyword::SELF,
                'https://*.googleapis.com',
                'https://*.gstatic.com',
            ])
            ->addNonce(Directive::SCRIPT)

            // Styles: self, Google Fonts, and unsafe-inline for MUI / Emotion dynamic runtime CSS
            ->add(Directive::STYLE, [
                Keyword::SELF,
                Keyword::UNSAFE_INLINE,
                'https://fonts.googleapis.com',
            ])

            // Fonts: self, Google Fonts woff2 binaries, and data: URIs
            ->add(Directive::FONT, [
                Keyword::SELF,
                'https://fonts.gstatic.com',
                'data:',
            ])

            // Images: self, data:, blob:, Unsplash CDN, and OpenStreetMap tiles
            ->add(Directive::IMG, [
                Keyword::SELF,
                'data:',
                'blob:',
                'https://images.unsplash.com',
                'https://*.tile.openstreetmap.org',
                'https://tile.openstreetmap.org',
                'https://*.googleapis.com',
                'https://*.gstatic.com',
                '*.google.com',
            ])

            // Network connections: self, PhonePe APIs, and map tiles
            ->add(Directive::CONNECT, [
                Keyword::SELF,
                'https://api.phonepe.com',
                'https://mercury.phonepe.com',
                'https://mercury-tst.phonepe.com',
                'https://*.tile.openstreetmap.org',
                'https://*.googleapis.com',
            ])

            // Frames & iframes: self, PhonePe checkout, Google
            ->add(Directive::FRAME, [
                Keyword::SELF,
                'https://mercury.phonepe.com',
                'https://mercury-tst.phonepe.com',
                '*.google.com',
            ])

            // Form actions: self, PhonePe gateway
            ->add(Directive::FORM_ACTION, [
                Keyword::SELF,
                'https://mercury.phonepe.com',
                'https://mercury-tst.phonepe.com',
            ]);
    }
}

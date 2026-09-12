<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentSecurityPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_csp_header_is_present_on_web_requests(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertHeader('Content-Security-Policy');

        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertNotEmpty($csp);
    }

    public function test_csp_header_enforces_default_base_and_object_restrictions(): void
    {
        $response = $this->get('/');
        $csp = $response->headers->get('Content-Security-Policy');

        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("base-uri 'self'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("media-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
    }

    public function test_csp_header_allows_self_and_checkout_scripts_with_strict_nonce_and_no_unsafe_inline(): void
    {
        $response = $this->get('/');
        $csp = $response->headers->get('Content-Security-Policy');

        // Extract script-src directive
        preg_match('/script-src\s+([^;]+)/', $csp, $matches);
        $this->assertNotEmpty($matches, 'script-src directive must exist in CSP header');

        $scriptSrc = $matches[1];

        // Must allow self and Razorpay checkout SDK
        $this->assertStringContainsString("'self'", $scriptSrc);
        $this->assertStringContainsString('https://checkout.razorpay.com', $scriptSrc);

        // Must include a cryptographic nonce for inline scripts
        $this->assertMatchesRegularExpression("/'nonce-[a-zA-Z0-9+\/=]+'/", $scriptSrc);

        // Must strictly disallow unsafe-inline for scripts
        $this->assertStringNotContainsString("'unsafe-inline'", $scriptSrc);
    }

    public function test_csp_header_allows_google_fonts_and_inline_styles(): void
    {
        $response = $this->get('/');
        $csp = $response->headers->get('Content-Security-Policy');

        // style-src must allow self, unsafe-inline (for MUI Emotion runtime styles), and fonts.googleapis.com
        preg_match('/style-src\s+([^;]+)/', $csp, $styleMatches);
        $this->assertNotEmpty($styleMatches);
        $styleSrc = $styleMatches[1];

        $this->assertStringContainsString("'self'", $styleSrc);
        $this->assertStringContainsString("'unsafe-inline'", $styleSrc);
        $this->assertStringContainsString('https://fonts.googleapis.com', $styleSrc);

        // font-src must allow self, fonts.gstatic.com, and data:
        preg_match('/font-src\s+([^;]+)/', $csp, $fontMatches);
        $this->assertNotEmpty($fontMatches);
        $fontSrc = $fontMatches[1];

        $this->assertStringContainsString("'self'", $fontSrc);
        $this->assertStringContainsString('https://fonts.gstatic.com', $fontSrc);
        $this->assertStringContainsString('data:', $fontSrc);
    }

    public function test_csp_header_allows_images_from_self_data_blob_unsplash_and_openstreetmap(): void
    {
        $response = $this->get('/');
        $csp = $response->headers->get('Content-Security-Policy');

        preg_match('/img-src\s+([^;]+)/', $csp, $imgMatches);
        $this->assertNotEmpty($imgMatches);
        $imgSrc = $imgMatches[1];

        $this->assertStringContainsString("'self'", $imgSrc);
        $this->assertStringContainsString('data:', $imgSrc);
        $this->assertStringContainsString('blob:', $imgSrc);
        $this->assertStringContainsString('https://images.unsplash.com', $imgSrc);
        $this->assertStringContainsString('tile.openstreetmap.org', $imgSrc);
    }

    public function test_csp_header_allows_payment_gateways_connect_frames_and_form_actions(): void
    {
        $response = $this->get('/');
        $csp = $response->headers->get('Content-Security-Policy');

        // connect-src
        preg_match('/connect-src\s+([^;]+)/', $csp, $connectMatches);
        $this->assertNotEmpty($connectMatches);
        $connectSrc = $connectMatches[1];
        $this->assertStringContainsString("'self'", $connectSrc);
        $this->assertStringContainsString('https://lumberjack.razorpay.com', $connectSrc);
        $this->assertStringContainsString('https://api.razorpay.com', $connectSrc);
        $this->assertStringContainsString('https://api.phonepe.com', $connectSrc);
        $this->assertStringContainsString('https://mercury.phonepe.com', $connectSrc);

        // frame-src
        preg_match('/frame-src\s+([^;]+)/', $csp, $frameMatches);
        $this->assertNotEmpty($frameMatches);
        $frameSrc = $frameMatches[1];
        $this->assertStringContainsString("'self'", $frameSrc);
        $this->assertStringContainsString('https://api.razorpay.com', $frameSrc);
        $this->assertStringContainsString('https://checkout.razorpay.com', $frameSrc);
        $this->assertStringContainsString('https://mercury.phonepe.com', $frameSrc);

        // form-action
        preg_match('/form-action\s+([^;]+)/', $csp, $formMatches);
        $this->assertNotEmpty($formMatches);
        $formSrc = $formMatches[1];
        $this->assertStringContainsString("'self'", $formSrc);
        $this->assertStringContainsString('https://api.razorpay.com', $formSrc);
        $this->assertStringContainsString('https://mercury.phonepe.com', $formSrc);
    }
}

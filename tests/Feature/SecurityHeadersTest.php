<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_are_applied_to_web_responses(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
    }

    public function test_security_headers_are_applied_to_api_responses(): void
    {
        $response = $this->getJson('/api/v1/bikes');

        $response->assertStatus(200);
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
    }

    public function test_strict_transport_security_is_enforced_when_served_over_https(): void
    {
        // Request served over HTTPS
        $response = $this->get('https://localhost/');

        $response->assertStatus(200);
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_strict_transport_security_is_enforced_via_forwarded_proto_header(): void
    {
        // Behind an HTTPS load balancer / reverse proxy
        $response = $this->get('/', ['X-Forwarded-Proto' => 'https']);

        $response->assertStatus(200);
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_strict_transport_security_is_not_sent_over_insecure_http(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }
}

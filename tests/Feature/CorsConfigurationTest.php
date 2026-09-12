<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cors_configuration_does_not_contain_wildcard_origins(): void
    {
        $corsConfig = config('cors');

        $this->assertIsArray($corsConfig);
        $this->assertNotContains('*', $corsConfig['allowed_origins'], 'CORS allowed_origins must not contain wildcard "*"');
        $this->assertTrue($corsConfig['supports_credentials'], 'CORS supports_credentials must be enabled for authenticated sessions/tokens');
    }

    public function test_production_domain_receives_cors_headers_with_credentials_on_api_requests(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'https://whizwheels.in',
            'Access-Control-Request-Method' => 'GET',
        ])->json('GET', '/api/v1/bikes');

        $response->assertStatus(200);
        $response->assertHeader('Access-Control-Allow-Origin', 'https://whizwheels.in');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_mobile_app_origins_receive_cors_headers(): void
    {
        $mobileOrigins = [
            'whizwheel-staff://',
            'capacitor://localhost',
            'http://localhost',
        ];

        foreach ($mobileOrigins as $origin) {
            $response = $this->withHeaders([
                'Origin' => $origin,
                'Access-Control-Request-Method' => 'GET',
            ])->json('GET', '/api/v1/bikes');

            $response->assertStatus(200);
            $response->assertHeader('Access-Control-Allow-Origin', $origin);
            $response->assertHeader('Access-Control-Allow-Credentials', 'true');
        }
    }

    public function test_unauthorized_origin_is_rejected_without_access_control_allow_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'https://malicious-attacker.com',
            'Access-Control-Request-Method' => 'GET',
        ])->json('GET', '/api/v1/bikes');

        $this->assertNull(
            $response->headers->get('Access-Control-Allow-Origin'),
            'Unauthorized origins must not receive Access-Control-Allow-Origin header'
        );
    }

    public function test_preflight_options_request_from_authorized_origin_returns_allowed_methods_and_headers(): void
    {
        $response = $this->call('OPTIONS', '/api/v1/bikes', [], [], [], [
            'HTTP_ORIGIN' => 'https://whizwheels.in',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'Content-Type, Authorization, Idempotency-Key',
        ]);

        $response->assertStatus(204);
        $response->assertHeader('Access-Control-Allow-Origin', 'https://whizwheels.in');
        $response->assertHeader('Access-Control-Allow-Credentials', 'true');
        $this->assertStringContainsString('POST', (string) $response->headers->get('Access-Control-Allow-Methods'));
    }

    public function test_preflight_options_request_from_unauthorized_origin_is_blocked(): void
    {
        $response = $this->call('OPTIONS', '/api/v1/bikes', [], [], [], [
            'HTTP_ORIGIN' => 'https://evil-phishing.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        $this->assertNull($response->headers->get('Access-Control-Allow-Origin'));
    }
}

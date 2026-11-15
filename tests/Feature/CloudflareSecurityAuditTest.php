<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class CloudflareSecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_cloudflare_trusted_proxy_correctly_resolves_real_client_ip(): void
    {
        // Simulate an incoming request proxied by a Cloudflare Edge IP (e.g., 173.245.48.50)
        // with the real user IP in X-Forwarded-For (e.g., 203.0.113.195)
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '173.245.48.50',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.195',
        ])->get('/');

        $response->assertStatus(200);

        // Verify request IP resolution via test closure
        $testIp = null;
        Route::get('/_test-cf-ip', function (\Illuminate\Http\Request $request) use (&$testIp) {
            $testIp = $request->ip();
            return response()->json(['ip' => $testIp]);
        });

        $this->withServerVariables([
            'REMOTE_ADDR' => '173.245.48.50',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.195',
        ])->getJson('/_test-cf-ip')->assertJson(['ip' => '203.0.113.195']);

        $this->assertSame('203.0.113.195', $testIp, 'Laravel must resolve the visitor IP, not the Cloudflare edge IP.');
    }

    public function test_cloudflare_cf_visitor_header_triggers_hsts(): void
    {
        // Cloudflare flexible/full proxy sends CF-Visitor: {"scheme":"https"}
        $response = $this->withHeaders([
            'CF-Visitor' => '{"scheme":"https"}',
        ])->get('/');

        $response->assertStatus(200);
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_sensitive_admin_and_api_routes_prevent_cdn_caching_via_no_store(): void
    {
        // Admin login route
        $loginRes = $this->get('/admin/login');
        $loginRes->assertHeader('Cache-Control');
        $this->assertStringContainsString('no-store', (string) $loginRes->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', (string) $loginRes->headers->get('Cache-Control'));

        // API routes
        $apiRes = $this->getJson('/api/v1/bikes');
        $apiRes->assertHeader('Cache-Control');
        $this->assertStringContainsString('no-store', (string) $apiRes->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', (string) $apiRes->headers->get('Cache-Control'));
    }

    public function test_csp_header_allows_cloudflare_turnstile_and_insights(): void
    {
        config()->set('csp.enabled_while_hot_reloading', true);

        $response = $this->get('/');
        $csp = (string) $response->headers->get('Content-Security-Policy');

        // Turnstile script & insights script
        $this->assertStringContainsString('https://challenges.cloudflare.com', $csp);
        $this->assertStringContainsString('https://static.cloudflareinsights.com', $csp);

        // Frame directive for Turnstile interactive challenges
        preg_match('/frame-src\s+([^;]+)/', $csp, $frameMatches);
        $this->assertNotEmpty($frameMatches);
        $this->assertStringContainsString('https://challenges.cloudflare.com', $frameMatches[1]);
    }
}

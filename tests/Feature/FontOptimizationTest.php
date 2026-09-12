<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FontOptimizationTest extends TestCase
{
    use RefreshDatabase;
    public function test_app_blade_preloads_primary_web_font_file(): void
    {
        $appBladePath = resource_path('views/app.blade.php');
        $this->assertFileExists($appBladePath);

        $content = file_get_contents($appBladePath);

        // Assert rel="preload" exists with proper font attributes
        $this->assertStringContainsString('rel="preload"', $content);
        $this->assertStringContainsString('as="font"', $content);
        $this->assertStringContainsString('type="font/woff2"', $content);
        $this->assertStringContainsString('crossorigin', $content);

        // Assert it preloads the Inter woff2 font file
        $this->assertMatchesRegularExpression(
            '/<link\s+rel="preload"\s+href="https:\/\/fonts\.gstatic\.com\/[^"]+inter[^"]+\.woff2"\s+as="font"\s+type="font\/woff2"\s+crossorigin>/i',
            $content
        );
    }

    public function test_google_fonts_link_excludes_unused_font_weights(): void
    {
        $appBladePath = resource_path('views/app.blade.php');
        $content = file_get_contents($appBladePath);

        // Extract Google Fonts stylesheet link
        preg_match('/<link\s+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"\s+rel="stylesheet">/i', $content, $matches);
        $this->assertNotEmpty($matches, 'Google Fonts stylesheet link must exist in app.blade.php');

        $fontUrl = $matches[1];

        // Assert unused weight 300 is removed from the URL
        $this->assertStringNotContainsString('300', $fontUrl, 'Unused weight 300 must be removed from Google Fonts URL');

        // Assert used weights for Inter are present (400, 500, 600, 700, 800)
        $this->assertStringContainsString('Inter:wght@400;500;600;700;800', $fontUrl);

        // Assert used weights for Roboto are present without 300
        $this->assertStringContainsString('Roboto:wght@400;500;700', $fontUrl);
    }

    public function test_root_page_serves_preloaded_fonts_and_optimized_stylesheet(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('rel="preload"', false);
        $response->assertSee('as="font"', false);
        $response->assertSee('type="font/woff2"', false);
        $response->assertSee('fonts.gstatic.com', false);
        $response->assertSee('Inter:wght@400;500;600;700;800', false);
        $response->assertDontSee('wght@300', false);
    }
}

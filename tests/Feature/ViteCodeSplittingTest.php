<?php

use Tests\TestCase;

class ViteCodeSplittingTest extends TestCase
{
    public function test_vite_config_has_manual_chunks_configured(): void
    {
        $viteConfigPath = base_path('vite.config.js');
        $this->assertFileExists($viteConfigPath);

        $content = file_get_contents($viteConfigPath);

        // Check manualChunks configuration
        $this->assertStringContainsString('manualChunks', $content);
        $this->assertStringContainsString('vendor-react', $content);
        $this->assertStringContainsString('vendor-mui', $content);
        $this->assertStringContainsString('vendor-charts', $content);
    }

    public function test_build_manifest_contains_isolated_vendor_chunks(): void
    {
        $manifestPath = public_path('build/manifest.json');
        $this->assertFileExists($manifestPath, 'Build manifest must exist. Run npm run build first.');

        $manifest = json_decode(file_get_contents($manifestPath), true);
        $this->assertIsArray($manifest);

        // Verify vendor chunk entries exist in manifest
        $manifestKeys = array_keys($manifest);
        $vendorReactEntry = array_filter($manifestKeys, fn ($k) => str_contains($k, 'vendor-react'));
        $vendorMuiEntry = array_filter($manifestKeys, fn ($k) => str_contains($k, 'vendor-mui'));
        $vendorChartsEntry = array_filter($manifestKeys, fn ($k) => str_contains($k, 'vendor-charts'));

        $this->assertNotEmpty($vendorReactEntry, 'vendor-react chunk should exist in manifest');
        $this->assertNotEmpty($vendorMuiEntry, 'vendor-mui chunk should exist in manifest');
        $this->assertNotEmpty($vendorChartsEntry, 'vendor-charts chunk should exist in manifest');
    }

    public function test_home_page_does_not_load_charts_chunk(): void
    {
        $manifestPath = public_path('build/manifest.json');
        $manifest = json_decode(file_get_contents($manifestPath), true);

        $welcomeEntry = $manifest['resources/js/Pages/Welcome.jsx'] ?? null;
        $this->assertNotNull($welcomeEntry, 'Welcome page entry should exist in manifest');

        $imports = $welcomeEntry['imports'] ?? [];
        $hasCharts = false;
        foreach ($imports as $import) {
            if (str_contains($import, 'vendor-charts')) {
                $hasCharts = true;
                break;
            }
        }

        $this->assertFalse(
            $hasCharts,
            'First-load JS on the home page (Welcome.jsx) must not import vendor-charts chunk'
        );
    }

    public function test_reports_page_loads_charts_chunk(): void
    {
        $manifestPath = public_path('build/manifest.json');
        $manifest = json_decode(file_get_contents($manifestPath), true);

        $reportsEntry = $manifest['resources/js/Pages/Admin/Reports/Index.jsx'] ?? null;
        $this->assertNotNull($reportsEntry, 'Admin reports page entry should exist in manifest');

        $imports = $reportsEntry['imports'] ?? [];
        $hasCharts = false;
        foreach ($imports as $import) {
            if (str_contains($import, 'vendor-charts')) {
                $hasCharts = true;
                break;
            }
        }

        $this->assertTrue(
            $hasCharts,
            'Admin reports page (Admin/Reports/Index.jsx) must import vendor-charts chunk'
        );
    }
}

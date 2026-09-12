<?php

use Tests\TestCase;

class ImageOptimizationTest extends TestCase
{
    public function test_vite_config_has_image_optimizer_configured(): void
    {
        $viteConfigPath = base_path('vite.config.js');
        $this->assertFileExists($viteConfigPath);

        $content = file_get_contents($viteConfigPath);

        // Check vite-plugin-image-optimizer import and usage
        $this->assertStringContainsString('vite-plugin-image-optimizer', $content);
        $this->assertStringContainsString('ViteImageOptimizer', $content);

        // Check quality is set to 80%
        $this->assertStringContainsString('quality: 80', $content);

        // Check WebP conversion is configured for resources/images and public/images
        $this->assertStringContainsString('webp', strtolower($content));
        $this->assertStringContainsString('resources/images', $content);
    }

    public function test_package_json_includes_image_optimizer_dependencies(): void
    {
        $packageJsonPath = base_path('package.json');
        $this->assertFileExists($packageJsonPath);

        $packageJson = json_decode(file_get_contents($packageJsonPath), true);

        $devDependencies = $packageJson['devDependencies'] ?? [];
        $dependencies = $packageJson['dependencies'] ?? [];
        $allDeps = array_merge($devDependencies, $dependencies);

        $this->assertArrayHasKey('vite-plugin-image-optimizer', $allDeps);
        $this->assertArrayHasKey('sharp', $allDeps);
    }

    public function test_webp_assets_are_generated_for_static_marketing_images(): void
    {
        $publicImagesDir = public_path('images');
        $this->assertDirectoryExists($publicImagesDir);

        // Find all jpg and png files
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($publicImagesDir, FilesystemIterator::SKIP_DOTS)
        );

        $originalCount = 0;
        $webpCount = 0;

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, ['jpg', 'jpeg', 'png'])) {
                    $originalCount++;
                    $webpPath = preg_replace('/\.(jpe?g|png)$/i', '.webp', $file->getPathname());
                    $this->assertFileExists(
                        $webpPath,
                        "Expected WebP counterpart for {$file->getPathname()} to exist"
                    );
                } elseif ($ext === 'webp') {
                    $webpCount++;
                }
            }
        }

        $this->assertGreaterThan(0, $originalCount, 'Expected to find original marketing images');
        $this->assertGreaterThanOrEqual($originalCount, $webpCount, 'Expected at least as many WebP images as original image formats');
    }
}

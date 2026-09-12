<?php

namespace Tests\Feature;

use Tests\TestCase;

class ImageLazyLoadingTest extends TestCase
{
    /**
     * Verify that below-the-fold images across public pages use loading="lazy".
     */
    public function test_pages_have_lazy_loaded_below_fold_images(): void
    {
        $pagesWithBelowFoldImages = [
            'resources/js/Pages/Welcome.jsx',
            'resources/js/Pages/Services.jsx',
            'resources/js/Pages/ServiceDetail.jsx',
            'resources/js/Pages/BoatingPage.jsx',
            'resources/js/Pages/GuidePage.jsx',
            'resources/js/Pages/ToursPage.jsx',
            'resources/js/Pages/HomestaysPage.jsx',
            'resources/js/Pages/CabsPage.jsx',
            'resources/js/Pages/ScubaPage.jsx',
            'resources/js/Pages/Bikes/Index.jsx',
            'resources/js/Pages/ExplorePage.jsx',
            'resources/js/Pages/About.jsx',
            'resources/js/Components/ServiceGalleryModal.jsx',
        ];

        foreach ($pagesWithBelowFoldImages as $relativePath) {
            $fullPath = base_path($relativePath);
            $this->assertFileExists($fullPath);
            $content = file_get_contents($fullPath);

            $this->assertStringContainsString(
                'loading="lazy"',
                $content,
                "Expected {$relativePath} to contain loading=\"lazy\" for below-the-fold images"
            );
        }
    }

    /**
     * Verify that hero / above-the-fold images do not have loading="lazy".
     */
    public function test_hero_and_above_fold_images_are_loaded_eagerly(): void
    {
        $heroImageChecks = [
            'resources/js/Pages/Welcome.jsx' => 'src="/images/logo.png"',
            'resources/js/Pages/Services.jsx' => 'src={active.media?.primary || active.image}',
            'resources/js/Pages/ServiceDetail.jsx' => 'src={service.image}',
            'resources/js/Pages/BoatingPage.jsx' => 'src="/images/services/honnavar-backwater-boating.jpg"',
            'resources/js/Pages/GuidePage.jsx' => 'src={primaryGuideMedia.primary}',
            'resources/js/Pages/ToursPage.jsx' => 'src={primaryTourMedia.primary}',
            'resources/js/Pages/HomestaysPage.jsx' => 'src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80"',
            'resources/js/Pages/CabsPage.jsx' => 'src="/images/services/taxi.jpg"',
            'resources/js/Pages/ScubaPage.jsx' => 'src={primaryScubaMedia.primary}',
            'resources/js/Pages/Bikes/Index.jsx' => 'src="/images/services/two_wheelers.jpg"',
            'resources/js/Pages/Bikes/Show.jsx' => 'src={bike.primary_image_url',
        ];

        foreach ($heroImageChecks as $relativePath => $heroIndicator) {
            $fullPath = base_path($relativePath);
            $this->assertFileExists($fullPath);
            $content = file_get_contents($fullPath);

            $pos = strpos($content, $heroIndicator);
            $this->assertNotFalse($pos, "Hero image indicator '{$heroIndicator}' not found in {$relativePath}");

            // Extract surrounding block for the hero image tag (200 chars before and 300 chars after)
            $start = max(0, $pos - 200);
            $tagSnippet = substr($content, $start, 500);

            $this->assertStringNotContainsString(
                'loading="lazy"',
                $tagSnippet,
                "Hero image in {$relativePath} should NOT have loading=\"lazy\""
            );
        }
    }
}

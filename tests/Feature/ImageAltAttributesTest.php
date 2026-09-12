<?php

namespace Tests\Feature;

use Tests\TestCase;

class ImageAltAttributesTest extends TestCase
{
    /**
     * Test that all images across the 11 targeted files have descriptive alt attributes.
     */
    public function test_target_files_have_descriptive_alt_attributes(): void
    {
        $targetFiles = [
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
            'resources/js/Pages/Bikes/Show.jsx',
        ];

        foreach ($targetFiles as $file) {
            $filePath = base_path($file);
            $this->assertFileExists($filePath, "File {$file} does not exist");

            $content = file_get_contents($filePath);

            // Pattern to match JSX tags with component="img" or standard <img
            // Check that every component="img" or <img has an alt attribute
            preg_match_all('/<Box[^>]*component=["\']img["\'][^>]*>/s', $content, $boxMatches);
            preg_match_all('/<img[^>]*>/s', $content, $imgMatches);

            $allTags = array_merge($boxMatches[0], $imgMatches[0]);

            $this->assertNotEmpty($allTags, "Expected images in {$file}");

            foreach ($allTags as $tag) {
                // Assert it has alt attribute
                $this->assertMatchesRegularExpression('/alt=\{?[^>\}]*\}?/s', $tag, "Missing alt attribute in tag: {$tag} within {$file}");

                // Assert alt is not empty
                $this->assertDoesNotMatchRegularExpression('/alt=["\']\s*["\']/', $tag, "Empty alt string in tag: {$tag} within {$file}");

                // Assert alt does not contain generic words like "boat image"
                $this->assertDoesNotMatchRegularExpression('/alt=["\'][^"\']*boat image[^"\']*["\']/i', $tag, "Generic alt text found in {$file}");
            }
        }
    }
}

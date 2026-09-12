<?php

use Tests\TestCase;

class HeadingHierarchyTest extends TestCase
{
    private array $pages = [
        'resources/js/Pages/Welcome.jsx',
        'resources/js/Pages/Services.jsx',
        'resources/js/Pages/Bikes/Index.jsx',
        'resources/js/Pages/Bikes/Show.jsx',
        'resources/js/Pages/BoatingPage.jsx',
        'resources/js/Pages/CabsPage.jsx',
        'resources/js/Pages/GuidePage.jsx',
        'resources/js/Pages/HomestaysPage.jsx',
        'resources/js/Pages/ScubaPage.jsx',
        'resources/js/Pages/ToursPage.jsx',
        'resources/js/Pages/ServiceDetail.jsx',
    ];

    public function test_each_page_has_exactly_one_h1(): void
    {
        foreach ($this->pages as $pagePath) {
            $fullPath = base_path($pagePath);
            $this->assertFileExists($fullPath, "Page file {$pagePath} does not exist");

            $content = file_get_contents($fullPath);

            // Match component="h1" or <h1
            $h1ComponentMatches = [];
            preg_match_all('/component=["\']h1["\']/', $content, $h1ComponentMatches);
            
            $h1TagMatches = [];
            preg_match_all('/<h1(\s|>)/', $content, $h1TagMatches);

            $totalH1s = count($h1ComponentMatches[0]) + count($h1TagMatches[0]);

            // If variant="h1" is used without component=, MUI renders an h1
            // Check if variant="h1" is present without component="h1" (already counted if component="h1")
            $variantH1Matches = [];
            preg_match_all('/<Typography[^>]*variant=["\']h1["\'][^>]*>/s', $content, $variantH1Matches);
            
            // For variant="h1" tags that do not have component="h1", they still render h1
            $extraH1s = 0;
            foreach ($variantH1Matches[0] as $match) {
                if (!str_contains($match, 'component=')) {
                    $extraH1s++;
                }
            }

            $effectiveH1Count = $totalH1s + $extraH1s;

            $this->assertEquals(
                1,
                $effectiveH1Count,
                "Page {$pagePath} must have exactly one <h1> element, found {$effectiveH1Count}"
            );
        }
    }

    public function test_no_prices_rendered_as_raw_headings(): void
    {
        foreach ($this->pages as $pagePath) {
            $fullPath = base_path($pagePath);
            $content = file_get_contents($fullPath);

            // Check if any Typography with variant="h1".."h6" and no component="span"/"p" wraps currency symbol ₹
            // Look for blocks like <Typography variant="h[1-6]" ...>...₹... without component="span" or component="p"
            preg_match_all('/<Typography\s+([^>]*variant=["\']h[1-6]["\'][^>]*)>(.*?)<\/Typography>/s', $content, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                $attributes = $match[1];
                $innerContent = $match[2];

                // If it contains currency ₹ or Rs
                if (str_contains($innerContent, '₹') || str_contains($innerContent, 'Rs.')) {
                    $hasSpanOrP = str_contains($attributes, 'component="span"') ||
                                  str_contains($attributes, 'component="p"') ||
                                  str_contains($attributes, "component='span'") ||
                                  str_contains($attributes, "component='p'");

                    $this->assertTrue(
                        $hasSpanOrP,
                        "Page {$pagePath} has price rendered as raw heading without component='span' or 'p': " . substr(strip_tags($innerContent), 0, 40)
                    );
                }
            }
        }
    }
}

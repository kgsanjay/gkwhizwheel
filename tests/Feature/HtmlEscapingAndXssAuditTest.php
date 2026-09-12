<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class HtmlEscapingAndXssAuditTest extends TestCase
{
    public function test_no_unescaped_blade_tags_in_views(): void
    {
        $viewsPath = resource_path('views');
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($viewsPath));

        $unescapedOccurrences = [];

        foreach ($files as $file) {
            if ($file->isFile() && str_ends_with($file->getFilename(), '.blade.php')) {
                $content = file_get_contents($file->getPathname());
                // Look for {!! ... !!}
                if (preg_match_all('/\{\!\![\s\S]*?\!\!\}/', $content, $matches)) {
                    $unescapedOccurrences[$file->getFilename()] = $matches[0];
                }
            }
        }

        $this->assertEmpty(
            $unescapedOccurrences,
            'Found raw unescaped {!! !!} blade tags in views: ' . json_encode($unescapedOccurrences)
        );
    }

    public function test_dangerously_set_inner_html_only_used_for_sanitized_structured_data(): void
    {
        $jsPath = resource_path('js');
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($jsPath));

        $dangerouslySetFiles = [];

        foreach ($files as $file) {
            if ($file->isFile() && in_array($file->getExtension(), ['js', 'jsx', 'ts', 'tsx'], true)) {
                $content = file_get_contents($file->getPathname());
                if (str_contains($content, 'dangerouslySetInnerHTML')) {
                    $dangerouslySetFiles[] = str_replace(base_path() . '/', '', $file->getPathname());
                }
            }
        }

        // Exactly one usage exists across resources/js: PageHead.jsx for JSON-LD schema
        $this->assertCount(1, $dangerouslySetFiles);
        $this->assertSame('resources/js/Components/SEO/PageHead.jsx', $dangerouslySetFiles[0]);

        // Verify that PageHead.jsx escapes '<' to '\u003c' to prevent <script> breakout
        $pageHeadContent = file_get_contents(resource_path('js/Components/SEO/PageHead.jsx'));
        $this->assertStringContainsString("replace(/</g, '\\\\u003c')", $pageHeadContent);
    }

    public function test_user_model_has_no_raw_html_producing_accessors(): void
    {
        $userReflection = new \ReflectionClass(User::class);
        $methods = $userReflection->getMethods(\ReflectionMethod::IS_PUBLIC);

        foreach ($methods as $method) {
            if (str_starts_with($method->getName(), 'get') && str_ends_with($method->getName(), 'Attribute')) {
                $name = $method->getName();
                $this->assertStringNotContainsStringIgnoringCase('html', $name);
                $this->assertStringNotContainsStringIgnoringCase('raw', $name);
            }
        }

        $this->assertTrue(true);
    }
}

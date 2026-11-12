<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Load all curated travel guide articles from the shared JSON catalog.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function articles(): array
    {
        $path = resource_path('js/data/blogArticles.json');
        if (! is_file($path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : [];
    }

    public function index(Request $request): Response
    {
        $articles = self::articles();
        $initialService = $request->query('service', 'all');

        return Inertia::render('Blog/Index', [
            'articles' => $articles,
            'initialService' => is_string($initialService) ? $initialService : 'all',
        ]);
    }

    public function show(string $slug): Response
    {
        $articles = self::articles();
        $article = collect($articles)->firstWhere('slug', $slug);

        abort_if(! $article, 404);

        return Inertia::render('Blog/Show', [
            'article' => $article,
            'articles' => $articles,
        ]);
    }
}


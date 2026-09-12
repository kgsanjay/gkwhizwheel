<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BikeStatus;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\ServiceItem;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Generate a dynamic XML sitemap.
     */
    public function index(): Response
    {
        $urls = [];
        $now = now()->toAtomString();

        // 1. Static marketing pages
        $staticPages = [
            ['loc' => url('/'), 'priority' => '1.0', 'changefreq' => 'daily'],
            ['loc' => url('/services'), 'priority' => '0.9', 'changefreq' => 'daily'],
            ['loc' => url('/services/bikes'), 'priority' => '0.9', 'changefreq' => 'daily'],
            ['loc' => url('/services/cabs'), 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => url('/services/homestays'), 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => url('/services/boating'), 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => url('/services/scuba'), 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => url('/services/guide'), 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => url('/services/tours'), 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => url('/explore'), 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['loc' => url('/about'), 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['loc' => url('/how-it-works'), 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['loc' => url('/contact'), 'priority' => '0.6', 'changefreq' => 'monthly'],
        ];

        foreach ($staticPages as $page) {
            $urls[] = [
                'loc' => $page['loc'],
                'lastmod' => $now,
                'changefreq' => $page['changefreq'],
                'priority' => $page['priority'],
            ];
        }

        // 2. All active Bike listing pages
        $bikes = Bike::whereNotIn('status', [BikeStatus::RETIRED, 'retired'])
            ->orderBy('id')
            ->get();

        foreach ($bikes as $bike) {
            $urls[] = [
                'loc' => url("/services/bikes/{$bike->id}"),
                'lastmod' => $bike->updated_at?->toAtomString() ?? $now,
                'changefreq' => 'daily',
                'priority' => '0.8',
            ];
        }

        // 3. All active ServiceItem detail pages
        $serviceSlugs = [
            'two_wheelers' => 'bikes',
            'taxi' => 'cabs',
            'homestay' => 'homestays',
            'boating' => 'boating',
            'scuba' => 'scuba',
            'guide' => 'guide',
            'tours' => 'tours',
        ];

        $serviceItems = ServiceItem::whereIn('status', ['available', 'active'])
            ->orderBy('service_type')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        foreach ($serviceItems as $item) {
            $slug = $serviceSlugs[$item->service_type] ?? $item->service_type;
            $urls[] = [
                'loc' => url("/services/{$slug}/{$item->id}"),
                'lastmod' => $item->updated_at?->toAtomString() ?? $now,
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];
        }

        // Build valid XML
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $entry) {
            $xml .= "    <url>\n";
            $xml .= '        <loc>' . htmlspecialchars($entry['loc'], ENT_XML1, 'UTF-8') . "</loc>\n";
            $xml .= "        <lastmod>{$entry['lastmod']}</lastmod>\n";
            $xml .= "        <changefreq>{$entry['changefreq']}</changefreq>\n";
            $xml .= "        <priority>{$entry['priority']}</priority>\n";
            $xml .= "    </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}

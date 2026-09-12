<?php

declare(strict_types=1);

test('PageHead SEO component exists and supports all required meta and JSON-LD properties', function (): void {
    $path = resource_path('js/Components/SEO/PageHead.jsx');

    expect(file_exists($path))->toBeTrue();

    $content = file_get_contents($path);

    expect($content)
        ->toContain('export default function PageHead')
        ->toContain('title')
        ->toContain('description')
        ->toContain('canonicalUrl')
        ->toContain('ogImage')
        ->toContain('ogType')
        ->toContain('structuredData')
        ->toContain('og:title')
        ->toContain('og:description')
        ->toContain('og:image')
        ->toContain('og:type')
        ->toContain('og:url')
        ->toContain('twitter:card')
        ->toContain('twitter:title')
        ->toContain('twitter:description')
        ->toContain('twitter:image')
        ->toContain('application/ld+json');
});

test('Welcome page integrates PageHead with unique title, meta description, canonical URL, and LocalBusiness schema', function (): void {
    $path = resource_path('js/Pages/Welcome.jsx');

    expect(file_exists($path))->toBeTrue();

    $content = file_get_contents($path);

    expect($content)
        ->toContain("import PageHead from '../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('title="Bike Rental Honnavar | Boating, Scuba, Tours – GK WhizWheel"')
        ->toContain('canonicalUrl="https://whizwheels.in/"')
        ->toContain('"@type": "LocalBusiness"')
        ->toContain('"telephone": "+918660989586"')
        ->toContain('"priceRange": "₹350 - ₹5000"')
        ->toContain('"openingHours": "Mo-Su 06:00-23:00"')
        ->toContain('"@type": "PostalAddress"')
        ->toContain('"@type": "GeoCoordinates"');

    // Verify title length is under 60 chars
    preg_match('/title="([^"]+)"/', $content, $titleMatches);
    expect($titleMatches)->not->toBeEmpty();
    expect(mb_strlen($titleMatches[1]))->toBeLessThan(60);

    // Verify description length is under 155 chars
    preg_match('/description="([^"]+)"/', $content, $descMatches);
    expect($descMatches)->not->toBeEmpty();
    expect(mb_strlen($descMatches[1]))->toBeLessThan(155);
    expect($descMatches[1])
        ->toContain('Honnavar')
        ->toContain('Karavali coast');
});

test('Services, ServiceDetail, Bikes/Index, and Bikes/Show pages integrate PageHead with unique metadata and canonical URLs', function (): void {
    $welcomeContent = file_get_contents(resource_path('js/Pages/Welcome.jsx'));
    $servicesContent = file_get_contents(resource_path('js/Pages/Services.jsx'));
    $serviceDetailContent = file_get_contents(resource_path('js/Pages/ServiceDetail.jsx'));
    $bikesIndexContent = file_get_contents(resource_path('js/Pages/Bikes/Index.jsx'));
    $bikesShowContent = file_get_contents(resource_path('js/Pages/Bikes/Show.jsx'));

    // Services.jsx
    expect($servicesContent)
        ->toContain("import PageHead from '../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl="https://whizwheels.in/services"')
        ->toContain('title="Honnavar Travel & Rental Services Hub | GK WhizWheel"');

    // ServiceDetail.jsx
    expect($serviceDetailContent)
        ->toContain("import PageHead from '../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl={`https://whizwheels.in/services/${normalizedSlug}`}')
        ->toContain('title={`${service.title} | GK WhizWheel Honnavar`}');

    // Bikes/Index.jsx
    expect($bikesIndexContent)
        ->toContain("import PageHead from '../../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl="https://whizwheels.in/services/bikes"')
        ->toContain('title="Browse Fleet & Rates - Bike Rental in Honnavar | GK WhizWheel"');

    // Bikes/Show.jsx
    expect($bikesShowContent)
        ->toContain("import PageHead from '../../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl={`https://whizwheels.in/services/bikes/${bike.id}`}')
        ->toContain('title={`${bike.brand} ${bike.model_name} Rental in Honnavar | GK WhizWheel`}');

    // Verify none reuse the Welcome page title or description
    preg_match('/title="([^"]+)"/', $welcomeContent, $welcomeTitle);
    preg_match('/description="([^"]+)"/', $welcomeContent, $welcomeDesc);

    expect($servicesContent)->not->toContain($welcomeTitle[1]);
    expect($servicesContent)->not->toContain($welcomeDesc[1]);
    expect($bikesIndexContent)->not->toContain($welcomeTitle[1]);
    expect($bikesIndexContent)->not->toContain($welcomeDesc[1]);
});

test('Boating, Guide, Tours, Homestays, Cabs, and Scuba pages integrate PageHead with tailored search-intent titles, descriptions, canonical URLs, and schema', function (): void {
    $pages = [
        'BoatingPage.jsx' => [
            'canonical' => 'https://whizwheels.in/services/boating',
            'title' => 'Sharavathi Backwater Boating & Mangrove Cruises in Honnavar | GK WhizWheel',
            'schemaType' => "'@type': 'TouristTrip'",
            'lowPrice' => "lowPrice: '600'",
            'highPrice' => "highPrice: '4000'",
        ],
        'GuidePage.jsx' => [
            'canonical' => 'https://whizwheels.in/services/guide',
            'title' => 'Certified Local Tour Guides in Honnavar & Coastal Trails | GK WhizWheel',
            'schemaType' => "'@type': 'Product'",
            'lowPrice' => "lowPrice: '800'",
            'highPrice' => "highPrice: '2500'",
        ],
        'ToursPage.jsx' => [
            'canonical' => 'https://whizwheels.in/services/tours',
            'title' => 'Coastal Karnataka Tour Packages & Custom Trips from Honnavar | GK WhizWheel',
            'schemaType' => "'@type': 'TouristTrip'",
            'lowPrice' => "lowPrice: '2499'",
            'highPrice' => "highPrice: '15000'",
        ],
        'HomestaysPage.jsx' => [
            'canonical' => 'https://whizwheels.in/services/homestays',
            'title' => 'Riverside & Beach Homestays in Honnavar | Rooms & Cottages – GK WhizWheel',
            'schemaType' => "'@type': 'Product'",
            'lowPrice' => "lowPrice: '1200'",
            'highPrice' => "highPrice: '6500'",
        ],
        'CabsPage.jsx' => [
            'canonical' => 'https://whizwheels.in/services/cabs',
            'title' => 'Honnavar Taxi Service & AC Cab Rentals | Station Pickup – GK WhizWheel',
            'schemaType' => "'@type': 'Product'",
            'lowPrice' => "lowPrice: '1400'",
            'highPrice' => "highPrice: '6000'",
        ],
        'ScubaPage.jsx' => [
            'canonical' => 'https://whizwheels.in/services/scuba',
            'title' => 'Netrani Island Scuba Diving from Honnavar | PADI Certified – GK WhizWheel',
            'schemaType' => "'@type': 'TouristTrip'",
            'lowPrice' => "lowPrice: '3500'",
            'highPrice' => "highPrice: '5500'",
        ],
    ];

    $welcomeContent = file_get_contents(resource_path('js/Pages/Welcome.jsx'));
    preg_match('/title="([^"]+)"/', $welcomeContent, $welcomeTitle);
    preg_match('/description="([^"]+)"/', $welcomeContent, $welcomeDesc);

    $seenTitles = [$welcomeTitle[1]];

    foreach ($pages as $filename => $expected) {
        $content = file_get_contents(resource_path("js/Pages/{$filename}"));

        expect($content)
            ->toContain("import PageHead from '../Components/SEO/PageHead'")
            ->toContain('<PageHead')
            ->toContain("canonicalUrl=\"{$expected['canonical']}\"")
            ->toContain("title=\"{$expected['title']}\"")
            ->toContain($expected['schemaType'])
            ->toContain($expected['lowPrice'])
            ->toContain($expected['highPrice'])
            ->toContain('structuredData=');

        // Verify title is unique across all pages and doesn't reuse the homepage
        expect(in_array($expected['title'], $seenTitles, true))->toBeFalse();
        $seenTitles[] = $expected['title'];

        // Verify description doesn't reuse homepage
        expect($content)->not->toContain($welcomeDesc[1]);
    }
});

test('Bikes/Show page generates Product JSON-LD structuredData with dynamic price, INR currency, stock availability, and conditional aggregateRating', function (): void {
    $content = file_get_contents(resource_path('js/Pages/Bikes/Show.jsx'));

    expect($content)
        ->toContain("import PageHead from '../../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('structuredData={bikeStructuredData}')
        ->toContain("'@type': 'Product'")
        ->toContain('name: `${bike.brand} ${bike.model_name}`')
        ->toContain('image: absoluteImageUrl')
        ->toContain("'@type': 'Offer'")
        ->toContain('price: String(bikePrice)')
        ->toContain("priceCurrency: 'INR'")
        ->toContain("availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'")
        ->toContain("'@type': 'AggregateRating'")
        ->toContain('ratingValue: String(bike.rating || bike.average_rating')
        ->toContain('reviewCount: String(bike.review_count || bike.reviews_count');
});

test('About, HowItWorks, and Contact pages integrate PageHead with unique metadata, canonical URLs, and Contact LocalBusiness structuredData', function (): void {
    $aboutContent = file_get_contents(resource_path('js/Pages/About.jsx'));
    $howItWorksContent = file_get_contents(resource_path('js/Pages/HowItWorks.jsx'));
    $contactContent = file_get_contents(resource_path('js/Pages/Contact.jsx'));
    $welcomeContent = file_get_contents(resource_path('js/Pages/Welcome.jsx'));

    // About.jsx
    expect($aboutContent)
        ->toContain("import PageHead from '../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl="https://whizwheels.in/about"')
        ->toContain('title="About GK WhizWheels | Premier Bike Rental in Honnavar"');

    // HowItWorks.jsx
    expect($howItWorksContent)
        ->toContain("import PageHead from '../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl="https://whizwheels.in/how-it-works"')
        ->toContain('title="How It Works – 4 Simple Steps to Rent a Bike in Honnavar"');

    // Contact.jsx
    expect($contactContent)
        ->toContain("import PageHead from '../Components/SEO/PageHead'")
        ->toContain('<PageHead')
        ->toContain('canonicalUrl="https://whizwheels.in/contact"')
        ->toContain('title="Contact GK WhizWheel Honnavar | 24/7 Station & Main Rd Hub"')
        ->toContain("'@type': 'LocalBusiness'")
        ->toContain("contactPoint: [")
        ->toContain("telephone: '+918660989586'")
        ->toContain("areaServed: [")
        ->toContain("'Honnavar'")
        ->toContain("'Karavali coast'")
        ->toContain("'Uttara Kannada district'")
        ->toContain("sameAs: [")
        ->toContain("'https://share.google/GoM4iOgiuUIa7ZfwV'")
        ->toContain("'https://wa.me/918660989586'");

    // Titles must be unique and under 60 chars
    preg_match('/title="([^"]+)"/', $aboutContent, $aboutTitle);
    preg_match('/title="([^"]+)"/', $howItWorksContent, $howItWorksTitle);
    preg_match('/title="([^"]+)"/', $contactContent, $contactTitle);
    preg_match('/title="([^"]+)"/', $welcomeContent, $welcomeTitle);

    expect(mb_strlen($aboutTitle[1]))->toBeLessThan(60);
    expect(mb_strlen($howItWorksTitle[1]))->toBeLessThan(60);
    expect(mb_strlen($contactTitle[1]))->toBeLessThan(60);

    $titles = [$welcomeTitle[1], $aboutTitle[1], $howItWorksTitle[1], $contactTitle[1]];
    expect(count(array_unique($titles)))->toBe(4);

    // Descriptions must be unique and under 155 chars
    preg_match('/description="([^"]+)"/', $aboutContent, $aboutDesc);
    preg_match('/description="([^"]+)"/', $howItWorksContent, $howItWorksDesc);
    preg_match('/description="([^"]+)"/', $contactContent, $contactDesc);
    preg_match('/description="([^"]+)"/', $welcomeContent, $welcomeDesc);

    expect(mb_strlen($aboutDesc[1]))->toBeLessThan(155);
    expect(mb_strlen($howItWorksDesc[1]))->toBeLessThan(155);
    expect(mb_strlen($contactDesc[1]))->toBeLessThan(155);

    $descriptions = [$welcomeDesc[1], $aboutDesc[1], $howItWorksDesc[1], $contactDesc[1]];
    expect(count(array_unique($descriptions)))->toBe(4);
});

test('FAQ sections on Welcome, Services, HowItWorks, and individual service pages include FAQPage structuredData matching visible Q&A copy', function (): void {
    $pages = [
        'Welcome.jsx' => [
            'sampleQuestion' => 'What documents are required to rent a bike?',
            'sampleAnswer' => 'An original, valid Indian Driving License for two-wheelers',
        ],
        'Services.jsx' => [
            'sampleQuestion' => 'Should I choose a self-drive bike or a chauffeured private cab?',
            'sampleAnswer' => 'For solo travelers or couples looking for maximum freedom',
        ],
        'HowItWorks.jsx' => [
            'sampleQuestion' => 'Can I pick up at Honnavar Railway Station and return at Palya Main Rd?',
            'sampleAnswer' => 'One-way store rentals are fully supported between our two Honnavar hubs',
        ],
        'BoatingPage.jsx' => [
            'sampleQuestion' => 'What is the best time for pre-wedding and photography shoots on the boat?',
            'sampleAnswer' => 'The golden hour sunset slot (4:15 PM – 6:30 PM) is our most sought-after window',
        ],
        'CabsPage.jsx' => [
            'sampleQuestion' => 'How does the Honnavar Railway Station cab pickup work?',
            'sampleAnswer' => 'We have a dedicated dispatch hub at Honnavar Railway Station (Platform 1 exit)',
        ],
        'ScubaPage.jsx' => [
            'sampleQuestion' => 'Do I need to know swimming to do scuba diving at Netrani Island?',
            'sampleAnswer' => 'No, swimming is NOT required! Over 80% of our discovery divers are complete non-swimmers',
        ],
        'HomestaysPage.jsx' => [
            'sampleQuestion' => 'What are the check-in and check-out timings?',
            'sampleAnswer' => 'Standard check-in is 12:00 PM and check-out is 11:00 AM',
        ],
        'GuidePage.jsx' => [
            'sampleQuestion' => 'What languages do your local guides speak?',
            'sampleAnswer' => 'All our guides are fluent in Kannada and English',
        ],
        'ToursPage.jsx' => [
            'sampleQuestion' => 'What happens if it rains during a waterfall or beach tour?',
            'sampleAnswer' => 'Coastal Karnataka and the Western Ghats are breathtaking in green monsoon and post-monsoon months',
        ],
        'Bikes/Index.jsx' => [
            'sampleQuestion' => 'What is the average honnavar bike rental price?',
            'sampleAnswer' => 'Honda Activa scooters start from ₹350–₹400/day',
        ],
        'ServiceDetail.jsx' => [
            'sampleQuestion' => null, // Dynamic FAQs per service
            'sampleAnswer' => null,
        ],
    ];

    foreach ($pages as $file => $qa) {
        $path = resource_path("js/Pages/{$file}");
        expect(file_exists($path))->toBeTrue();

        $content = file_get_contents($path);

        expect($content)
            ->toContain("'@type': 'FAQPage'")
            ->toContain("'@type': 'Question'")
            ->toContain("'@type': 'Answer'")
            ->toContain('acceptedAnswer');

        if ($qa['sampleQuestion'] !== null) {
            expect($content)->toContain($qa['sampleQuestion']);
            expect($content)->toContain($qa['sampleAnswer']);
        }
    }
});

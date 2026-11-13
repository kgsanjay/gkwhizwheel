<?php

declare(strict_types=1);

test('customer page visual migration reuses shared Home-style surfaces without removing booking flows', function (): void {
    $hero = file_get_contents(resource_path('js/Components/Marketing/MarketingPageHero.jsx'));
    $bike = file_get_contents(resource_path('js/Pages/Bikes/Show.jsx'));
    $model = file_get_contents(resource_path('js/Pages/Bikes/ModelShow.jsx'));
    $checkout = file_get_contents(resource_path('js/Pages/Bikes/Checkout.jsx'));
    $explore = file_get_contents(resource_path('js/Pages/ExplorePage.jsx'));

    expect($hero)->toContain('MarketingPageHero')
        ->toContain('marketingPanelSx')
        ->toContain('palette.mode')
        ->toContain('children');

    expect($bike)->toContain('<MarketingPageHero')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain('AddonsSelector')
        ->toContain('Reserve & Price Quote');

    expect($model)->toContain('<MarketingPageHero')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain("apiClient.get('/bike-models/availability'")
        ->toContain('Continue to Secure Checkout');

    expect($checkout)->toContain('<MarketingPageHero')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain('presentation="page"')
        ->toContain('Review your trip')
        ->toContain('PhonePe or Razorpay');

    expect($explore)->toContain('<MarketingPageHero')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain('destinations.map(')
        ->toContain('tourismFaqs');
});

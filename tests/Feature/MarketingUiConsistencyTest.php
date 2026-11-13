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


test('existing service page hero styles share Home colors without dropping unique sections', function (): void {
    $pageSections = [
        'CabsPage.jsx' => ['FARE ESTIMATOR', 'CAB'],
        'BoatingPage.jsx' => ['BOAT', 'FAQ'],
        'ScubaPage.jsx' => ['SCUBA', 'FAQ'],
        'HomestaysPage.jsx' => ['ROOM', 'FAQ'],
        'ToursPage.jsx' => ['PACKAGE', 'FAQ'],
        'GuidePage.jsx' => ['GUIDE', 'FAQ'],
        'ServiceDetail.jsx' => ['PACKAGES', 'FAQ'],
    ];

    foreach ($pageSections as $page => $sections) {
        $content = file_get_contents(resource_path("js/Pages/{$page}"));
        expect($content)
            ->toContain('marketingHeroBackground(isDark)')
            ->toContain('component="section"');
        foreach ($sections as $section) {
            expect(strtoupper($content))->toContain($section);
        }
    }

    foreach (['About.jsx', 'Contact.jsx', 'HowItWorks.jsx'] as $page) {
        $content = file_get_contents(resource_path("js/Pages/{$page}"));
        expect($content)
            ->toContain('marketingHeroBackground(isDark)')
            ->toContain('component="section"');
    }
});


test('customer account, blog and policy headers share approved visual tokens', function (): void {
    foreach ([
        'Account/Bookings.jsx',
        'Account/BookingDetail.jsx',
        'Account/Kyc.jsx',
        'Bookings/Confirmation.jsx',
        'Blog/Index.jsx',
        'Blog/Show.jsx',
        'Privacy.jsx',
        'Terms.jsx',
    ] as $page) {
        $content = file_get_contents(resource_path("js/Pages/{$page}"));
        expect($content)->toContain('marketingHeroBackground(');
    }

    $bookings = file_get_contents(resource_path('js/Pages/Account/Bookings.jsx'));
    $confirmation = file_get_contents(resource_path('js/Pages/Bookings/Confirmation.jsx'));
    $kyc = file_get_contents(resource_path('js/Pages/Account/Kyc.jsx'));

    expect($bookings)->toContain('getStatusBadge')
        ->toContain('filteredBookings');

    expect($confirmation)->toContain('isConfirmed')
        ->toContain('isAwaitingPayment')
        ->toContain('Booking Confirmed!');

    expect($kyc)->toContain('KYC & Identity Verification');
});


test('service booking confirmation keeps its payment and voucher state while using shared surfaces', function (): void {
    $page = file_get_contents(resource_path('js/Pages/ServiceBookingConfirmation.jsx'));

    expect($page)->toContain('marketingHeroBackground(isDark)')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain('isVoucherAvailable')
        ->toContain('isPayable')
        ->toContain('setGateway')
        ->toContain('Download Trip Voucher (PDF)');
});


test('branch and login screens retain their actions and share consistent visual tokens', function (): void {
    $branch = file_get_contents(resource_path('js/Pages/Bikes/BranchLanding.jsx'));
    $customerLogin = file_get_contents(resource_path('js/Pages/Auth/Login.jsx'));
    $staffLogin = file_get_contents(resource_path('js/Pages/Admin/Login.jsx'));
    $adminLayout = file_get_contents(resource_path('js/Layouts/AdminLayout.jsx'));

    expect($branch)->toContain('marketingHeroBackground(isDark)')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain('models.map(')
        ->toContain('branch.pickup_points')
        ->toContain('ogImage={models.find(')
        ->not->toContain('ogImage="/images/services/two_wheelers.jpg"');

    expect($customerLogin)->toContain('marketingHeroBackground(isDark)')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain('loginForm.post')
        ->toContain('registerForm.post');

    expect($staffLogin)->toContain('marketingHeroBackground(isDark)')
        ->toContain('marketingPanelSx(isDark)')
        ->toContain("post('/admin/login')");

    expect($adminLayout)->toContain('linear-gradient(120deg')
        ->toContain('radial-gradient(circle at 95% 0%')
        ->toContain('{children}')
        ->toContain('sidebar_counts');
});

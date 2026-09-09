<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $bikes = \App\Models\Bike::with(['category', 'currentStore', 'images'])
        ->where('status', \App\Enums\BikeStatus::AVAILABLE)
        ->orderBy('id')
        ->get();

    $categories = \App\Models\BikeCategory::withCount(['bikes' => function ($query) {
        $query->where('status', \App\Enums\BikeStatus::AVAILABLE);
    }])->get();

    $stores = \App\Models\Store::where('status', \App\Enums\StoreStatus::ACTIVE)
        ->withCount(['bikes' => function ($query) {
            $query->where('status', \App\Enums\BikeStatus::AVAILABLE);
        }])
        ->get();

    return Inertia::render('Welcome', [
        'featuredBikes' => \App\Http\Resources\BikeResource::collection($bikes)->resolve(),
        'categories' => $categories,
        'stores' => $stores,
    ]);
})->name('home');

Route::get('/services/bikes', [\App\Http\Controllers\Web\BikeWebController::class, 'index'])->name('bikes.index');
Route::get('/services/bikes/{id}', [\App\Http\Controllers\Web\BikeWebController::class, 'show'])->name('services.bikes.show');
Route::redirect('/bikes', '/services/bikes', 301);
Route::redirect('/services/two-wheelers', '/services/bikes', 301);
Route::get('/bikes/{id}', [\App\Http\Controllers\Web\BikeWebController::class, 'show'])->name('bikes.show');

Route::get('/services', fn () => Inertia::render('Services'))->name('services');
Route::get('/services/{slug}', function (string $slug) {
    $serviceTypeMap = [
        'two-wheelers' => 'two_wheelers',
        'bikes' => 'two_wheelers',
        'taxi' => 'taxi',
        'cabs' => 'taxi',
        'boating' => 'boating',
        'scuba' => 'scuba',
        'homestay' => 'homestay',
        'homestays' => 'homestay',
        'guide' => 'guide',
        'tours' => 'tours',
    ];
    $mappedType = $serviceTypeMap[$slug] ?? $slug;
    $availableItems = \App\Models\ServiceItem::where('service_type', $mappedType)
        ->whereIn('status', ['available', 'active'])
        ->orderBy('sort_order')
        ->get();

    if ($slug === 'cabs' || $slug === 'taxi' || $slug === 'taxi-services') {
        return Inertia::render('CabsPage', [
            'slug' => $slug,
            'availableItems' => $availableItems,
        ]);
    }

    if ($slug === 'homestay' || $slug === 'homestays' || $slug === 'stays') {
        return Inertia::render('HomestaysPage', [
            'slug' => $slug,
            'availableItems' => $availableItems,
        ]);
    }

    if ($slug === 'boating' || $slug === 'boat' || $slug === 'boat-cruise' || $slug === 'sharavathi-boating') {
        return Inertia::render('BoatingPage', [
            'slug' => $slug,
            'availableItems' => $availableItems,
        ]);
    }

    if ($slug === 'scuba' || $slug === 'scuba-diving' || $slug === 'netrani' || $slug === 'netrani-scuba') {
        return Inertia::render('ScubaPage', [
            'slug' => $slug,
            'availableItems' => $availableItems,
        ]);
    }

    if ($slug === 'guide' || $slug === 'guides' || $slug === 'tour-guide' || $slug === 'tour-guides' || $slug === 'local-guide') {
        return Inertia::render('GuidePage', [
            'slug' => $slug,
            'availableItems' => $availableItems,
        ]);
    }

    if ($slug === 'tours' || $slug === 'tour' || $slug === 'packages' || $slug === 'package' || $slug === 'tour-packages' || $slug === 'karnataka-tours') {
        return Inertia::render('ToursPage', [
            'slug' => $slug,
            'availableItems' => $availableItems,
        ]);
    }

    return Inertia::render('ServiceDetail', [
        'slug' => $slug,
        'availableItems' => $availableItems,
    ]);
})->name('services.show');
Route::post('/services/book', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'store'])->name('services.book');
Route::post('/services/quote', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'calculateQuote'])->name('services.quote');
Route::get('/services/bookings/{bookingNumber}/confirmation', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'confirmation'])->name('services.booking.confirmation');
Route::post('/services/bookings/{bookingNumber}/initiate-payment', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'initiatePayment'])->name('services.booking.initiate-payment');
Route::post('/services/bookings/{bookingNumber}/verify-payment', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'verifyPayment'])->name('services.booking.verify-payment');
Route::get('/services/bookings/{bookingNumber}/voucher', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'downloadVoucher'])->name('services.booking.voucher');
Route::get('/services/bookings/{bookingNumber}/print', [\App\Http\Controllers\Web\CustomerServiceBookingController::class, 'printVoucher'])->name('services.booking.print');
Route::get('/about', fn () => Inertia::render('About'))->name('about');
Route::get('/about-us', fn () => Inertia::render('About'));
Route::get('/how-it-works', fn () => Inertia::render('HowItWorks'))->name('how-it-works');
Route::get('/contact', fn () => Inertia::render('Contact'))->name('contact');
Route::get('/terms', fn () => Inertia::render('Terms'))->name('terms');
Route::get('/rental-terms', fn () => Inertia::render('Terms'));

Route::get('/bookings/{id}/confirmation', [\App\Http\Controllers\Web\BookingWebController::class, 'confirmation'])->name('bookings.confirmation');
Route::get('/bookings/{id}/voucher', [\App\Http\Controllers\Web\BookingWebController::class, 'downloadVoucher'])->name('bookings.voucher');
Route::get('/bookings/{id}/print', [\App\Http\Controllers\Web\BookingWebController::class, 'printVoucher'])->name('bookings.print');
Route::post('/dev/bookings/{id}/simulate-payment', [\App\Http\Controllers\Web\BookingWebController::class, 'simulateTestPayment'])->name('dev.bookings.simulate-payment');

Route::get('/account', [\App\Http\Controllers\Web\CustomerAccountWebController::class, 'index'])->name('account.index');
Route::get('/account/bookings/{id}', [\App\Http\Controllers\Web\CustomerAccountWebController::class, 'show'])->name('account.bookings.show');
Route::get('/account/kyc', [\App\Http\Controllers\Web\CustomerAccountWebController::class, 'kyc'])->name('account.kyc');

// Authentication
Route::get('/login', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'create'])->name('login');
Route::post('/login', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'store'])->middleware('throttle:auth')->name('login.store');
Route::get('/signup', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'createRegister'])->name('register');
Route::get('/register', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'createRegister']);
Route::post('/register', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'storeRegister'])->middleware('throttle:auth')->name('register.store');
Route::get('/auth/google', [\App\Http\Controllers\Web\Auth\GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [\App\Http\Controllers\Web\Auth\GoogleAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
Route::get('/admin/login', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'create'])->name('admin.login');
Route::post('/admin/login', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'store'])->middleware('throttle:auth')->name('admin.login.store');
Route::match(['get', 'post'], '/logout', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'destroy'])->name('logout');
Route::match(['get', 'post'], '/admin/logout', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'destroy'])->name('admin.logout');

// Admin & Staff Portal Shell
Route::middleware(['admin.auth'])->prefix('admin')->group(function (): void {
    Route::get('/', [\App\Http\Controllers\Web\Admin\AdminDashboardController::class, 'index'])->name('admin.index');
    Route::get('/dashboard', [\App\Http\Controllers\Web\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dispatch', [\App\Http\Controllers\Web\Admin\AdminDispatchWebController::class, 'index'])->name('admin.dispatch.index');
    Route::get('/operations', fn () => redirect()->route('admin.bookings.index', ['status' => 'confirmed']))->name('admin.operations');
    Route::get('/customers', fn () => redirect()->route('admin.bookings.index'))->name('admin.customers');

    // Ground Coordinator QR Scanner & Fast Check-In
    Route::get('/check-in', [\App\Http\Controllers\Web\Admin\AdminCheckInWebController::class, 'index'])->name('admin.check-in.index');
    Route::post('/check-in/lookup', [\App\Http\Controllers\Web\Admin\AdminCheckInWebController::class, 'lookup'])->name('admin.check-in.lookup');
    Route::post('/check-in/sync', [\App\Http\Controllers\Web\Admin\AdminCheckInWebController::class, 'sync'])->name('admin.check-in.sync');
    Route::post('/check-in/{type}/{id}/process', [\App\Http\Controllers\Web\Admin\AdminCheckInWebController::class, 'process'])->name('admin.check-in.process');

    // Bike Inventory
    Route::get('/bikes', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'index'])->name('admin.bikes.index');
    Route::get('/bikes/create', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'create'])->name('admin.bikes.create');
    Route::post('/bikes', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'store'])->name('admin.bikes.store');
    Route::get('/bikes/export-sample-csv', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'exportSampleCsv'])->name('admin.bikes.export-sample-csv');
    Route::post('/bikes/import-csv', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'importCsv'])->name('admin.bikes.import-csv');
    Route::get('/bikes/{id}/edit', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'edit'])->name('admin.bikes.edit');
    Route::match(['post', 'put'], '/bikes/{id}', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'update'])->name('admin.bikes.update');
    Route::delete('/bikes/{id}', [\App\Http\Controllers\Web\Admin\AdminBikeWebController::class, 'destroy'])->name('admin.bikes.destroy');

    // Dynamic Pricing Rules
    Route::get('/pricing', [\App\Http\Controllers\Web\Admin\AdminPricingRuleWebController::class, 'index'])->name('admin.pricing.index');
    Route::post('/pricing', [\App\Http\Controllers\Web\Admin\AdminPricingRuleWebController::class, 'store'])->name('admin.pricing.store');
    Route::post('/pricing/simulate-quote', [\App\Http\Controllers\Web\Admin\AdminPricingRuleWebController::class, 'simulateQuote'])->name('admin.pricing.simulate-quote');
    Route::match(['post', 'put'], '/pricing/{id}', [\App\Http\Controllers\Web\Admin\AdminPricingRuleWebController::class, 'update'])->name('admin.pricing.update');
    Route::post('/pricing/{id}/toggle', [\App\Http\Controllers\Web\Admin\AdminPricingRuleWebController::class, 'toggle'])->name('admin.pricing.toggle');
    Route::delete('/pricing/{id}', [\App\Http\Controllers\Web\Admin\AdminPricingRuleWebController::class, 'destroy'])->name('admin.pricing.destroy');

    // Discount Coupons
    Route::get('/coupons', [\App\Http\Controllers\Web\Admin\AdminCouponWebController::class, 'index'])->name('admin.coupons.index');
    Route::post('/coupons', [\App\Http\Controllers\Web\Admin\AdminCouponWebController::class, 'store'])->name('admin.coupons.store');
    Route::match(['post', 'put'], '/coupons/{id}', [\App\Http\Controllers\Web\Admin\AdminCouponWebController::class, 'update'])->name('admin.coupons.update');
    Route::post('/coupons/{id}/toggle', [\App\Http\Controllers\Web\Admin\AdminCouponWebController::class, 'toggle'])->name('admin.coupons.toggle');
    Route::delete('/coupons/{id}', [\App\Http\Controllers\Web\Admin\AdminCouponWebController::class, 'destroy'])->name('admin.coupons.destroy');

    // Stores & Hubs
    Route::get('/stores', [\App\Http\Controllers\Web\Admin\AdminStoreWebController::class, 'index'])->name('admin.stores.index');
    Route::get('/stores/create', [\App\Http\Controllers\Web\Admin\AdminStoreWebController::class, 'create'])->name('admin.stores.create');
    Route::post('/stores', [\App\Http\Controllers\Web\Admin\AdminStoreWebController::class, 'store'])->name('admin.stores.store');
    Route::get('/stores/{id}/edit', [\App\Http\Controllers\Web\Admin\AdminStoreWebController::class, 'edit'])->name('admin.stores.edit');
    Route::match(['post', 'put'], '/stores/{id}', [\App\Http\Controllers\Web\Admin\AdminStoreWebController::class, 'update'])->name('admin.stores.update');
    Route::match(['post', 'patch'], '/stores/{id}/toggle', [\App\Http\Controllers\Web\Admin\AdminStoreWebController::class, 'toggle'])->name('admin.stores.toggle');

    // Staff Management
    Route::get('/staff', [\App\Http\Controllers\Web\Admin\AdminStaffWebController::class, 'index'])->name('admin.staff.index');
    Route::post('/staff', [\App\Http\Controllers\Web\Admin\AdminStaffWebController::class, 'store'])->name('admin.staff.store');
    Route::match(['post', 'put'], '/staff/{id}', [\App\Http\Controllers\Web\Admin\AdminStaffWebController::class, 'update'])->name('admin.staff.update');
    Route::post('/staff/{id}/assign-stores', [\App\Http\Controllers\Web\Admin\AdminStaffWebController::class, 'assignStores'])->name('admin.staff.assign-stores');
    Route::delete('/staff/{id}', [\App\Http\Controllers\Web\Admin\AdminStaffWebController::class, 'destroy'])->name('admin.staff.destroy');

    // Unified Bookings Calendar & Management
    Route::get('/bookings', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'index'])->name('admin.bookings.index');
    Route::get('/bookings/{id}/edit', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'edit'])->name('admin.bookings.edit');
    Route::match(['post', 'put'], '/bookings/{id}', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'update'])->name('admin.bookings.update');
    Route::get('/bookings/{id}/refund', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'refundScreen'])->name('admin.bookings.refund');
    Route::post('/bookings/{id}/refund', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'processRefund'])->name('admin.bookings.process-refund');
    Route::get('/bookings/{id}/voucher', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'downloadVoucher'])->name('admin.bookings.voucher');
    Route::post('/bookings/{id}/handover', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'handover'])->name('admin.bookings.handover');
    Route::post('/bookings/{id}/return', [\App\Http\Controllers\Web\Admin\AdminBookingWebController::class, 'processReturn'])->name('admin.bookings.return');


    // Multi-Service Items & Bookings (Online & Offline)
    Route::prefix('services/{serviceType}')->middleware(['service.access'])->group(function (): void {
        Route::get('/items', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'items'])->name('admin.services.items.index');
        Route::get('/items/create', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'createItem'])->name('admin.services.items.create');
        Route::post('/items', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'storeItem'])->name('admin.services.items.store');
        Route::get('/items/{id}/edit', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'editItem'])->name('admin.services.items.edit');
        Route::match(['post', 'put'], '/items/{id}', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'updateItem'])->name('admin.services.items.update');
        Route::delete('/items/{id}', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'destroyItem'])->name('admin.services.items.destroy');

        Route::get('/bookings', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'bookings'])->name('admin.services.bookings.index');
        Route::get('/bookings/create', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'createBooking'])->name('admin.services.bookings.create');
        Route::post('/bookings', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'storeBooking'])->name('admin.services.bookings.store');
        Route::get('/bookings/{id}', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'showBooking'])->name('admin.services.bookings.show');
        Route::post('/bookings/{id}/status', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'updateBookingStatus'])->name('admin.services.bookings.update-status');
        Route::post('/bookings/{id}/payment', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'recordPayment'])->name('admin.services.bookings.record-payment');
        Route::get('/bookings/{id}/voucher', [\App\Http\Controllers\Web\Admin\AdminServiceWebController::class, 'downloadVoucher'])->name('admin.services.bookings.voucher');
    });

    // Reports & Analytics Dashboards
    Route::get('/reports', [\App\Http\Controllers\Web\Admin\AdminReportWebController::class, 'index'])->name('admin.reports.index');
});

Route::post('/webhooks/razorpay', [\App\Http\Controllers\Api\V1\Webhooks\RazorpayWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

Route::post('/webhooks/phonepe', [\App\Http\Controllers\Api\V1\Webhooks\PhonePeWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

Route::get('/webhooks/whatsapp', [\App\Http\Controllers\Api\V1\Webhooks\WhatsAppWebhookController::class, 'verify']);

Route::post('/webhooks/whatsapp', [\App\Http\Controllers\Api\V1\Webhooks\WhatsAppWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $bikes = \App\Models\Bike::with(['category', 'currentStore', 'images'])
        ->where('status', \App\Enums\BikeStatus::AVAILABLE)
        ->latest()
        ->take(6)
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
});

Route::get('/bikes', [\App\Http\Controllers\Web\BikeWebController::class, 'index'])->name('bikes.index');
Route::get('/bikes/{id}', [\App\Http\Controllers\Web\BikeWebController::class, 'show'])->name('bikes.show');

Route::get('/bookings/{id}/confirmation', [\App\Http\Controllers\Web\BookingWebController::class, 'confirmation'])->name('bookings.confirmation');
Route::post('/dev/bookings/{id}/simulate-payment', [\App\Http\Controllers\Web\BookingWebController::class, 'simulateTestPayment'])->name('dev.bookings.simulate-payment');

Route::get('/account', [\App\Http\Controllers\Web\CustomerAccountWebController::class, 'index'])->name('account.index');
Route::get('/account/bookings/{id}', [\App\Http\Controllers\Web\CustomerAccountWebController::class, 'show'])->name('account.bookings.show');
Route::get('/account/kyc', [\App\Http\Controllers\Web\CustomerAccountWebController::class, 'kyc'])->name('account.kyc');

// Admin & Staff Authentication
Route::get('/admin/login', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'create'])->name('admin.login');
Route::post('/admin/login', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'store'])
    ->middleware('throttle:auth')
    ->name('admin.login.store');
Route::post('/admin/logout', [\App\Http\Controllers\Web\Admin\AdminAuthController::class, 'destroy'])->name('admin.logout');

// Admin & Staff Portal Shell
Route::middleware(['admin.auth'])->prefix('admin')->group(function (): void {
    Route::get('/', [\App\Http\Controllers\Web\Admin\AdminDashboardController::class, 'index'])->name('admin.index');
    Route::get('/dashboard', [\App\Http\Controllers\Web\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');

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

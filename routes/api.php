<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::middleware('throttle:auth')->group(function (): void {
            Route::post('/register', [AuthController::class, 'register']);
            Route::post('/login', [AuthController::class, 'login']);
        });

        Route::middleware('throttle:otp')->group(function (): void {
            Route::post('/otp/request', [AuthController::class, 'requestOtp']);
            Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
        });

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
        });
    });

    // Public Inquiries
    Route::post('/contact', [\App\Http\Controllers\Web\ContactWebController::class, 'store'])
        ->middleware('throttle:contact');

    // Public Bikes & Meta
    Route::get('/bikes', [\App\Http\Controllers\Api\V1\Public\BikeController::class, 'index']);
    Route::get('/bikes/{id}', [\App\Http\Controllers\Api\V1\Public\BikeController::class, 'show']);
    Route::get('/bikes/{id}/availability', [\App\Http\Controllers\Api\V1\Public\BikeController::class, 'availability']);
    Route::match(['get', 'post'], '/bikes/{id}/price-quote', [\App\Http\Controllers\Api\V1\Public\BikeController::class, 'priceQuote'])
        ->middleware('throttle:coupons');
    Route::get('/stores', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Store::where('status', \App\Enums\StoreStatus::ACTIVE)->orderBy('name')->get(),
            'message' => '',
        ]);
    });
    Route::get('/bike-categories', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\BikeCategory::orderBy('name')->get(),
            'message' => '',
        ]);
    });

    // Public Services
    Route::get('/services', function (\Illuminate\Http\Request $request) {
        $query = \App\Models\ServiceItem::whereIn('status', ['available', 'active'])
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')]);

        if ($serviceType = $request->query('service_type')) {
            $query->where('service_type', $serviceType);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('sort_order')->get(),
            'message' => '',
        ]);
    });

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
        $items = \App\Models\ServiceItem::where('service_type', $mappedType)
            ->whereIn('status', ['available', 'active'])
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'slug' => $slug,
                'service_type' => $mappedType,
                'items' => $items,
            ],
            'message' => '',
        ]);
    });

    // Customer Bookings
    Route::middleware(['auth:sanctum', 'throttle:bookings'])->prefix('bookings')->group(function (): void {
        Route::post('/hold', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'hold']);
        Route::get('/', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'show']);
        Route::post('/{id}/checkout', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'checkout'])->middleware('throttle:payments');
        Route::post('/{id}/checkout/phonepe', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'checkoutPhonepe'])->middleware('throttle:payments');
        Route::post('/{id}/confirm-payment', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'confirmPayment'])->middleware('throttle:payments');
        Route::post('/{id}/cancel', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'cancel']);
        Route::post('/{id}/extend', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'extend']);
        Route::get('/{id}/documents', [\App\Http\Controllers\Api\V1\Customer\BookingController::class, 'documents']);
    });

    // Customer KYC Documents & Push Tokens
    Route::middleware(['auth:sanctum', 'throttle:uploads'])->prefix('customer')->group(function (): void {
        Route::get('/kyc-documents', [\App\Http\Controllers\Api\V1\Customer\CustomerKycController::class, 'index']);
        Route::post('/kyc-documents', [\App\Http\Controllers\Api\V1\Customer\CustomerKycController::class, 'store']);
        Route::get('/kyc-documents/{id}/download', [\App\Http\Controllers\Api\V1\Customer\CustomerKycController::class, 'download'])->name('customer.kyc-documents.download');

        // Native Expo Push Token Registration
        Route::post('/push-token', [\App\Http\Controllers\Api\V1\Customer\PushTokenController::class, 'store']);
        Route::delete('/push-token', [\App\Http\Controllers\Api\V1\Customer\PushTokenController::class, 'destroy']);
    });

    // Admin Routes
    Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('admin')->group(function (): void {
        // Bikes
        Route::prefix('bikes')->group(function (): void {
            Route::post('/', [\App\Http\Controllers\Api\V1\Admin\BikeController::class, 'store']);
            Route::post('/bulk-import', [\App\Http\Controllers\Api\V1\Admin\BikeController::class, 'bulkImport']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\Admin\BikeController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\V1\Admin\BikeController::class, 'destroy']);
            Route::post('/{id}/documents', [\App\Http\Controllers\Api\V1\Admin\BikeController::class, 'uploadDocument']);
        });

        // Pricing Rules
        Route::prefix('pricing-rules')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Admin\PricingRuleController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Admin\PricingRuleController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\PricingRuleController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\Admin\PricingRuleController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\V1\Admin\PricingRuleController::class, 'destroy']);
        });

        // Coupons
        Route::prefix('coupons')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Admin\CouponController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Admin\CouponController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\CouponController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\Admin\CouponController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\V1\Admin\CouponController::class, 'destroy']);
        });

        // Stores
        Route::prefix('stores')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Admin\StoreController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Admin\StoreController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\StoreController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\Admin\StoreController::class, 'update']);
        });

        // Staff (Admin & Store Manager)
        Route::prefix('staff')->middleware('role:super_admin,store_manager')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Admin\StaffController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Admin\StaffController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\StaffController::class, 'show']);
            Route::post('/{id}/stores', [\App\Http\Controllers\Api\V1\Admin\StaffController::class, 'assignStores']);
            Route::delete('/{id}/stores/{storeId}', [\App\Http\Controllers\Api\V1\Admin\StaffController::class, 'unassignStore']);
        });

        // Bookings
        Route::prefix('bookings')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Admin\BookingController::class, 'index']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\BookingController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\Admin\BookingController::class, 'update']);
        });

        // Refunds (Admin & Store Manager)
        Route::post('bookings/{id}/refund', [\App\Http\Controllers\Api\V1\Admin\BookingController::class, 'refund'])
            ->middleware('role:super_admin,store_manager');

        // Reports (Admin & Store Manager)
        Route::prefix('reports')->middleware('role:super_admin,store_manager')->group(function (): void {
            Route::get('/revenue', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'revenue']);
            Route::get('/utilization', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'utilization']);
        });

        // Activity Logs
        Route::get('/activity-logs', [\App\Http\Controllers\Api\V1\Admin\ActivityLogController::class, 'index']);
    });

    // Admin & Store Manager Service Items
    Route::middleware(['auth:sanctum', 'role:super_admin,store_manager'])->prefix('admin/service-items')->group(function (): void {
        Route::get('/', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'update']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'updateStatus']);
        Route::put('/{id}/status', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'updateStatus']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\V1\Admin\ServiceItemController::class, 'destroy']);
    });

    // Staff & Store Manager Operations (Offline / Walk-in Mobile App - Block G)
    Route::middleware(['auth:sanctum', 'role:staff,store_manager,super_admin', 'throttle:mobile-api'])->prefix('staff')->group(function (): void {
        Route::prefix('customers')->group(function (): void {
            Route::get('/lookup', [\App\Http\Controllers\Api\V1\Staff\CustomerController::class, 'lookup']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Staff\CustomerController::class, 'store']);
        });

        Route::prefix('bookings')->group(function (): void {
            Route::get('/active', [\App\Http\Controllers\Api\V1\Staff\BookingController::class, 'active']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Staff\BookingController::class, 'store']);
            Route::post('/{id}/collect-payment', [\App\Http\Controllers\Api\V1\Staff\BookingController::class, 'collectPayment']);
            Route::post('/{id}/handover', [\App\Http\Controllers\Api\V1\Staff\BookingController::class, 'handover']);
            Route::post('/{id}/return', [\App\Http\Controllers\Api\V1\Staff\BookingController::class, 'returnBike']);
        });

        Route::prefix('service-bookings')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'show']);
            Route::put('/{id}/status', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'updateStatus']);
            Route::patch('/{id}/status', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'updateStatus']);
            Route::post('/{id}/mark-in-progress', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'markInProgress']);
            Route::post('/{id}/mark-completed', [\App\Http\Controllers\Api\V1\Staff\ServiceBookingController::class, 'markCompleted']);
        });

        Route::prefix('bikes')->group(function (): void {
            Route::get('/', [\App\Http\Controllers\Api\V1\Staff\BikeController::class, 'index']);
            Route::post('/{id}/maintenance', [\App\Http\Controllers\Api\V1\Staff\BikeController::class, 'maintenance']);
        });

        Route::post('/sync', [\App\Http\Controllers\Api\V1\Staff\SyncController::class, 'sync']);
    });

    // Mobile App Version & Deprecation Check (Block F & Block G)
    Route::get('/staff/app-version', [\App\Http\Controllers\Api\V1\Staff\AppVersionController::class, 'show'])
        ->middleware('throttle:mobile-api');
    Route::get('/customer/app-version', [\App\Http\Controllers\Api\V1\Staff\AppVersionController::class, 'customer'])
        ->middleware('throttle:mobile-api');

    // Signed Bike Document Download
    Route::get('/bike-documents/{id}', \App\Http\Controllers\Api\V1\Public\BikeDocumentDownloadController::class)
        ->name('bike-documents.download')
        ->middleware('signed');

    // Signed Customer KYC Document Download
    Route::get('/kyc-documents/{id}', \App\Http\Controllers\Api\V1\Public\KycDocumentDownloadController::class)
        ->name('kyc-documents.download')
        ->middleware('signed');

    // Webhooks
    Route::post('/webhooks/razorpay', [\App\Http\Controllers\Api\V1\Webhooks\RazorpayWebhookController::class, 'handle']);
    Route::post('/webhooks/phonepe', [\App\Http\Controllers\Api\V1\Webhooks\PhonePeWebhookController::class, 'handle']);
    Route::get('/webhooks/whatsapp', [\App\Http\Controllers\Api\V1\Webhooks\WhatsAppWebhookController::class, 'verify']);
    Route::post('/webhooks/whatsapp', [\App\Http\Controllers\Api\V1\Webhooks\WhatsAppWebhookController::class, 'handle']);
});

Route::post('/webhooks/razorpay', [\App\Http\Controllers\Api\V1\Webhooks\RazorpayWebhookController::class, 'handle']);
Route::post('/webhooks/phonepe', [\App\Http\Controllers\Api\V1\Webhooks\PhonePeWebhookController::class, 'handle']);
Route::get('/webhooks/whatsapp', [\App\Http\Controllers\Api\V1\Webhooks\WhatsAppWebhookController::class, 'verify']);
Route::post('/webhooks/whatsapp', [\App\Http\Controllers\Api\V1\Webhooks\WhatsAppWebhookController::class, 'handle']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppVersionController extends Controller
{
    /**
     * Return the latest APK version information for the Store Staff Android App.
     */
    public function show(Request $request): JsonResponse
    {
        $latestVersion = (string) config('app.staff_app_version', '1.2.0');
        $minRequiredVersion = (string) config('app.staff_app_min_version', '1.0.0');
        $apkUrl = (string) config(
            'app.staff_app_download_url',
            url('/downloads/gkwhizwheel-staff-v1.2.0.apk')
        );
        $releaseNotes = (string) config(
            'app.staff_app_release_notes',
            'New release with enhanced offline sync resilience, instant handover photo baseline, and return deposit calculation.'
        );

        return response()->json([
            'success' => true,
            'data' => [
                'latest_version' => $latestVersion,
                'min_required_version' => $minRequiredVersion,
                'apk_url' => $apkUrl,
                'release_notes' => $releaseNotes,
                'published_at' => '2026-09-06',
            ],
            'message' => 'Staff app version information retrieved successfully.',
        ]);
    }

    /**
     * Return the latest version information for the Customer Mobile App (Block F).
     */
    public function customer(Request $request): JsonResponse
    {
        $latestVersion = (string) config('app.customer_app_version', '1.0.0');
        $minRequiredVersion = (string) config('app.customer_app_min_version', '1.0.0');
        $downloadUrl = (string) config(
            'app.customer_app_download_url',
            url('/downloads/gkwhizwheel-customer-v1.0.0.apk')
        );
        $releaseNotes = (string) config(
            'app.customer_app_release_notes',
            'Initial release with live bike search, instant availability, and KYC verification.'
        );

        return response()->json([
            'success' => true,
            'data' => [
                'latest_version' => $latestVersion,
                'min_required_version' => $minRequiredVersion,
                'download_url' => $downloadUrl,
                'release_notes' => $releaseNotes,
                'published_at' => '2026-09-12',
            ],
            'message' => 'Customer app version information retrieved successfully.',
        ]);
    }
}

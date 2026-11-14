<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsWebController extends Controller
{
    /**
     * Display the global site settings management page.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => SiteSetting::getAllSettings(),
        ]);
    }

    /**
     * Update global site settings in storage.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brand_name' => ['nullable', 'string', 'max:100'],
            'primary_phone' => ['required', 'string', 'max:25'],
            'whatsapp_number' => ['required', 'string', 'max:25'],
            'support_email' => ['required', 'email', 'max:150'],
            'operating_hours_label' => ['required', 'string', 'max:100'],
            'tagline' => ['required', 'string', 'max:255'],
            'explore_label' => ['nullable', 'string', 'max:50'],
            'locations_summary' => ['required', 'string', 'max:150'],
            'google_rating_score' => ['nullable', 'string', 'max:10'],
            'google_rating_value' => ['nullable', 'string', 'max:10'],
            'google_reviews_count' => ['nullable', 'string', 'max:20'],
            'google_rating_label' => ['nullable', 'string', 'max:100'],
            'google_maps_reviews_url' => ['nullable', 'url', 'max:500'],
        ]);

        if (! empty($validated['google_rating_score']) && empty($validated['google_rating_value'])) {
            $validated['google_rating_value'] = $validated['google_rating_score'];
        } elseif (! empty($validated['google_rating_value']) && empty($validated['google_rating_score'])) {
            $validated['google_rating_score'] = $validated['google_rating_value'];
        }

        $oldSettings = SiteSetting::getAllSettings();

        foreach ($validated as $key => $value) {
            SiteSetting::set($key, (string) ($value ?? ''));
        }

        SiteSetting::clearCache();

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'site_settings.updated',
            'subject_type' => SiteSetting::class,
            'subject_id' => 1,
            'old_values' => $oldSettings,
            'new_values' => $validated,
        ]);

        return redirect()->back()->with('success', 'Platform settings updated successfully.');
    }

    /**
     * Execute quick maintenance actions for SuperAdmin.
     */
    public function maintenanceAction(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403, 'Unauthorized.');

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:release_holds,audit_compliance,flush_cache'],
        ]);

        $action = $validated['action'];
        $details = '';
        $message = '';

        switch ($action) {
            case 'release_holds':
                Artisan::call('bookings:release-expired-holds');
                $out1 = trim(Artisan::output());
                Artisan::call('services:release-expired-holds');
                $out2 = trim(Artisan::output());
                $details = $out1.' | '.$out2;
                $message = 'Expired booking & service holds released successfully.';
                break;

            case 'audit_compliance':
                Artisan::call('bikes:check-document-expiry');
                $details = trim(Artisan::output());
                $message = 'Bike compliance and document expiry audit executed successfully.';
                break;

            case 'flush_cache':
                SiteSetting::clearCache();
                if (! app()->environment('testing')) {
                    Artisan::call('optimize:clear');
                    Artisan::call('config:cache');
                    Artisan::call('route:cache');
                    Artisan::call('view:cache');
                }
                $details = 'SiteSetting cache cleared and application cache flushed.';
                $message = 'Platform settings and application cache flushed and refreshed.';
                break;
        }

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'system_maintenance.'.$action,
            'subject_type' => SiteSetting::class,
            'subject_id' => 1,
            'new_values' => [
                'action' => $action,
                'details' => $details,
            ],
        ]);

        return redirect()->back()->with('success', $message);
    }
}

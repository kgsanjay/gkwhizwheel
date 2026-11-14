<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'primary_phone' => ['required', 'string', 'max:25'],
            'whatsapp_number' => ['required', 'string', 'max:25'],
            'support_email' => ['required', 'email', 'max:150'],
            'operating_hours_label' => ['required', 'string', 'max:100'],
            'tagline' => ['required', 'string', 'max:255'],
            'explore_label' => ['nullable', 'string', 'max:50'],
            'locations_summary' => ['required', 'string', 'max:150'],
            'google_rating_label' => ['nullable', 'string', 'max:100'],
            'google_rating_value' => ['nullable', 'string', 'max:10'],
            'google_reviews_count' => ['nullable', 'string', 'max:20'],
            'google_maps_reviews_url' => ['nullable', 'url', 'max:500'],
        ]);

        $oldSettings = SiteSetting::getAllSettings();

        foreach ($validated as $key => $value) {
            SiteSetting::set($key, (string) ($value ?? ''));
        }

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
}


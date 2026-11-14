<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'description',
    ];

    /**
     * Retrieve all settings as a key-value dictionary with in-memory / cache acceleration.
     *
     * @return array<string, mixed>
     */
    public static function getAllSettings(): array
    {
        $defaults = [
            'primary_phone' => '+918660989586',
            'whatsapp_number' => config('whizwheel.whatsapp_enquiry_number', '918660989586'),
            'support_email' => 'contact@whizwheels.in',
            'operating_hours_label' => 'Open 24/7',
            'tagline' => 'Coastal Travel Hub • Rides, Stays & Experiences',
            'explore_label' => 'Explore',
            'locations_summary' => 'Honnavar & Murudeshwar',
            'google_rating_label' => '5.0 Google Rated (324+)',
            'google_rating_value' => '5.0',
            'google_reviews_count' => '324+',
            'google_maps_reviews_url' => 'https://maps.app.goo.gl/y94Ap38BbZGWGSDdA',
        ];

        try {
            $dbSettings = Cache::remember('site_settings_all', 300, function (): array {
                return static::pluck('value', 'key')->toArray();
            });

            return array_merge($defaults, array_filter($dbSettings, fn ($v) => $v !== null && $v !== ''));
        } catch (\Throwable) {
            return $defaults;
        }
    }

    /**
     * Get a single setting by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $all = static::getAllSettings();

        return $all[$key] ?? $default;
    }

    /**
     * Set a setting value and flush cache.
     */
    public static function set(string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrInsert(
            ['key' => $key],
            [
                'value' => (string) $value,
                'group' => $group,
                'updated_at' => now(),
            ]
        );

        Cache::forget('site_settings_all');
    }
}


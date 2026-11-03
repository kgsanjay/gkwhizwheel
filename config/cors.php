<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Never grant credentialed cross-origin requests to arbitrary subdomains or
    // development hosts on production. Add any approved extra web origins via
    // CORS_ALLOWED_ORIGINS after verifying ownership of each origin.
    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        [
            'https://whizwheels.in',
            'https://www.whizwheels.in',
            'whizwheel-staff://',
            'whizwheel-customer://',
            'gkwhizwheel-staff://',
            'gkwhizwheel://',
            'capacitor://localhost',
            'ionic://localhost',
        ],
        in_array(env('APP_ENV', 'production'), ['local', 'testing'], true) ? [
            'http://localhost',
            'http://localhost:3000',
            'http://localhost:8000',
            'http://127.0.0.1:8000',
            'http://10.0.2.2:8000',
        ] : [],
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))
    )))),

    // Patterns are deliberately disabled: wildcard subdomain access is unsafe
    // with supports_credentials=true and should not be a deployment default.
    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'X-XSRF-TOKEN',
        'X-CSRF-TOKEN',
        'X-Inertia',
        'X-Inertia-Version',
        'Idempotency-Key',
    ],

    'exposed_headers' => [
        'Idempotency-Key',
        'X-Inertia',
    ],

    'max_age' => 86400,

    'supports_credentials' => true,

];


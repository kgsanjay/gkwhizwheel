<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'razorpay' => [
        'key_id' => env('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
        'key_secret' => env('RAZORPAY_KEY_SECRET', 'test_secret_placeholder'),
        'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET', 'test_webhook_secret'),
    ],

    'phonepe' => [
        'merchant_id' => env('PHONEPE_MERCHANT_ID', 'PGTESTPAYUAT'),
        'salt_key' => env('PHONEPE_SALT_KEY', 'test_phonepe_salt_key'),
        'salt_index' => env('PHONEPE_SALT_INDEX', '1'),
        'env' => env('PHONEPE_ENV', 'sandbox'),
        'base_url' => env('PHONEPE_BASE_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox'),
        'callback_url' => env('PHONEPE_CALLBACK_URL', 'http://localhost/webhooks/phonepe'),
        'redirect_url' => env('PHONEPE_REDIRECT_URL', 'http://localhost/payment/phonepe/callback'),
    ],

    'whatsapp' => [
        'token' => env('WHATSAPP_CLOUD_API_TOKEN', 'test_wa_token'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID', 'test_wa_phone_id'),
        'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID', 'test_wa_business_id'),
        'webhook_verify_token' => env('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'test_wa_verify_token'),
        'api_version' => env('WHATSAPP_API_VERSION', 'v19.0'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:8000/auth/google/callback'),
    ],

];

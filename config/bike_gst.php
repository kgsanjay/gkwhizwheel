<?php

declare(strict_types=1);

return [
    // Rates must be confirmed for the specific vehicle/service classification.
    // Null deliberately means GST has NOT been configured; never assume 18%.
    'rate_percent' => env('BIKE_GST_RATE_PERCENT'),
    // Existing website price cards are treated as tax-exclusive only if enabled.
    'price_mode' => env('BIKE_GST_PRICE_MODE', 'exclusive'),
    'supplier_gstin' => env('BIKE_GST_SUPPLIER_GSTIN'),
    'supplier_name' => env('BIKE_GST_SUPPLIER_NAME'),
    'supplier_address' => env('BIKE_GST_SUPPLIER_ADDRESS'),
    'sac' => env('BIKE_GST_SAC'),
];

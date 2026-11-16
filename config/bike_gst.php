<?php

declare(strict_types=1);

return [
    // Rates must be confirmed for the specific vehicle/service classification.
    // Statutory rate: 18% for vehicle leasing/rental services (SAC 997311).
    'rate_percent' => env('BIKE_GST_RATE_PERCENT', 18),
    // Existing website price cards are treated as tax-exclusive only if enabled.
    'price_mode' => env('BIKE_GST_PRICE_MODE', 'exclusive'),
    'supplier_gstin' => env('BIKE_GST_SUPPLIER_GSTIN', '29BHQPC0339C1ZK'),
    'supplier_name' => env('BIKE_GST_SUPPLIER_NAME', 'G K WHIZWHEELS RENTAL BIKE'),
    'supplier_legal_name' => env('BIKE_GST_SUPPLIER_LEGAL_NAME', 'G VINAYAK'),
    'supplier_address' => env('BIKE_GST_SUPPLIER_ADDRESS', 'Ground Floor, 417/D Shop No 1, Venkatesh Nilaya, Palya Main Road, Honnavar, Karnataka - 581334'),
    'sac' => env('BIKE_GST_SAC', '997311'),
];

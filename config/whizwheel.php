<?php

declare(strict_types=1);

return [
    // Single official WhatsApp enquiries number across all branches.
    // Change via environment configuration, not duplicated in public UI.
    'whatsapp_enquiry_number' => env('WHIZWHEEL_WHATSAPP_ENQUIRY_NUMBER', '918660989586'),
];

<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Enums\BikeDocumentType;
use App\Models\Bike;
use App\Models\BikeDocument;

/**
 * Explicitly approved compliance fixture for successful operation tests.
 * Test-only synthetic metadata; no real RC, owner, chassis, insurance scans.
 */
final class VerifiedBikeDocuments
{
    public static function attach(Bike $bike): void
    {
        foreach ([
            BikeDocumentType::RC,
            BikeDocumentType::INSURANCE,
            BikeDocumentType::EMISSION_CERTIFICATE,
        ] as $type) {
            BikeDocument::create([
                'bike_id' => $bike->id,
                'document_type' => $type,
                'file_path' => 'test-only/synthetic-'.$type->value.'.pdf',
                'issue_date' => now()->subMonth()->toDateString(),
                'expiry_date' => $type === BikeDocumentType::RC
                    ? null : now()->addMonths(9)->toDateString(),
                'verified' => true,
            ]);
        }
    }
}

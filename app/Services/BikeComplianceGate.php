<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Models\Bike;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

/**
 * Verify private compliance document metadata before physical vehicle release.
 * This DOES NOT assert that an uploaded scan is authentic; staff verifies each
 * private document before marking its metadata verified.
 */
final class BikeComplianceGate
{
    /** @return list<string> */
    public function problems(Bike $bike, ?CarbonInterface $date = null): array
    {
        $date ??= now();
        $day = $date->toDateString();

        $bike->load('documents');

        $issues = [];
        foreach ([
            [BikeDocumentType::RC, 'Registration certificate', false],
            [BikeDocumentType::INSURANCE, 'Insurance', true],
            [BikeDocumentType::EMISSION_CERTIFICATE, 'PUC/emission certificate', true],
        ] as [$type, $label, $requiresExpiry]) {
            $docs = $bike->documents
                ->filter(fn ($doc) => $doc->document_type === $type && $doc->verified === true);
            $valid = $docs->contains(function ($doc) use ($requiresExpiry, $day): bool {
                // Unknown expiry must not be silently treated as valid for
                // insurance or PUC. RC may be non-expiring depending on class.
                if ($requiresExpiry && $doc->expiry_date === null) {
                    return false;
                }
                if ($doc->expiry_date !== null && $doc->expiry_date->toDateString() < $day) {
                    return false;
                }
                if ($doc->issue_date !== null && $doc->issue_date->toDateString() > $day) {
                    return false;
                }
                return true;
            });
            if (! $valid) {
                $issues[] = "Missing, unverified or expired {$label}";
            }
        }

        if ($bike->next_service_due_date !== null
            && $bike->next_service_due_date->toDateString() < $day) {
            $issues[] = 'Overdue vehicle maintenance';
        }
        return $issues;
    }

    public function assertReadyForHandover(Bike $bike): void
    {
        if ($bike->status !== BikeStatus::AVAILABLE) {
            throw ValidationException::withMessages([
                'bike' => 'The bike is not in an approved available condition.',
            ]);
        }
        if ($issues = $this->problems($bike)) {
            throw ValidationException::withMessages([
                'bike' => 'Do not release the bike: '.implode('; ', $issues).'.',
            ]);
        }
    }
}

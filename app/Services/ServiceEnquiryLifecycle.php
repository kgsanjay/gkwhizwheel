<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceEnquiry;
use Illuminate\Validation\ValidationException;

final class ServiceEnquiryLifecycle
{
    /** No enquiry status is a confirmed booking or paid quote. */
    private const NEXT = [
        'requested' => ['reviewing', 'closed', 'cancelled'],
        'reviewing' => ['requested', 'closed', 'cancelled'],
        'closed' => [],
        'cancelled' => [],
    ];

    public function allowed(string $status): array
    {
        return self::NEXT[$status] ?? [];
    }

    public function assertTransition(ServiceEnquiry $enquiry, string $next): void
    {
        if ($enquiry->status === $next) {
            return;
        }
        if (! in_array($next, $this->allowed($enquiry->status), true)) {
            throw ValidationException::withMessages([
                'status' => "Cannot change an enquiry from {$enquiry->status} to {$next}.",
            ]);
        }
    }
}

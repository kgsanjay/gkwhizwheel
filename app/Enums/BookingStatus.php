<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum BookingStatus: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case HELD = 'held';
    case PENDING_PAYMENT = 'pending_payment';
    case CONFIRMED = 'confirmed';
    case HANDED_OVER = 'handed_over';
    case RETURNED = 'returned';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
    case NO_SHOW = 'no_show';
}

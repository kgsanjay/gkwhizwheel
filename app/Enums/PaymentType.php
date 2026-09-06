<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum PaymentType: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case ADVANCE = 'advance';
    case DEPOSIT = 'deposit';
    case LATE_FEE = 'late_fee';
    case DAMAGE_FEE = 'damage_fee';
    case REFUND = 'refund';
}

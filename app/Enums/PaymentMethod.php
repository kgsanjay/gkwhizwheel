<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum PaymentMethod: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case RAZORPAY = 'razorpay';
    case PHONEPE = 'phonepe';
    case CASH = 'cash';
    case CARD_POS = 'card_pos';
}

<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum PaymentStatus: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case PENDING = 'pending';
    case SUCCESS = 'success';
    case FAILED = 'failed';
    case REFUNDED = 'refunded';
}

<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum BikeStatus: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case AVAILABLE = 'available';
    case ON_RENT = 'on_rent';
    case MAINTENANCE = 'maintenance';
    case RETIRED = 'retired';
}

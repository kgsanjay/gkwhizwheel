<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum AddonType: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case HELMET = 'helmet';
    case EXTRA_RIDER = 'extra_rider';
    case INSURANCE = 'insurance';
    case GPS = 'gps';
}

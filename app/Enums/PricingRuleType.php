<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum PricingRuleType: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case WEEKEND = 'weekend';
    case HOLIDAY = 'holiday';
    case SEASONAL = 'seasonal';
    case ONE_WAY_FEE = 'one_way_fee';
}

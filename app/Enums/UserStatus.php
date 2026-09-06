<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum UserStatus: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case ACTIVE = 'active';
    case BLACKLISTED = 'blacklisted';
}

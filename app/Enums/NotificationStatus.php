<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum NotificationStatus: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case SENT = 'sent';
    case DELIVERED = 'delivered';
    case FAILED = 'failed';
}

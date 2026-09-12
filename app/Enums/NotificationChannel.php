<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum NotificationChannel: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case EMAIL = 'email';
    case WHATSAPP = 'whatsapp';
    case EXPO_PUSH = 'expo_push';
}

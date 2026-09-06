<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum UserRole: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case CUSTOMER = 'customer';
    case STAFF = 'staff';
    case STORE_MANAGER = 'store_manager';
    case SUPER_ADMIN = 'super_admin';
}

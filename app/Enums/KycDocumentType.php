<?php

declare(strict_types=1);

namespace App\Enums;

use ArchTech\Enums\InvokableCases;
use ArchTech\Enums\Names;
use ArchTech\Enums\Options;
use ArchTech\Enums\Values;

enum KycDocumentType: string
{
    use InvokableCases;
    use Names;
    use Options;
    use Values;

    case DRIVING_LICENSE = 'driving_license';
    case NATIONAL_ID = 'national_id';
    case PASSPORT = 'passport';
}

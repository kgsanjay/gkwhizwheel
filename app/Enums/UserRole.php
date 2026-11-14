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

    // Standardized role aliases
    public const MANAGER = self::STAFF;
    public const ADMIN = self::STORE_MANAGER;
    public const SUPERADMIN = self::SUPER_ADMIN;

    public function isSuperAdmin(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return in_array($this, [self::STORE_MANAGER, self::SUPER_ADMIN], true);
    }

    public function isManager(): bool
    {
        return $this === self::STAFF;
    }

    public function isStaffOrAdmin(): bool
    {
        return in_array($this, [self::SUPER_ADMIN, self::STORE_MANAGER, self::STAFF], true);
    }

    public static function fromString(string $role): self
    {
        $normalized = match ($role) {
            'superadmin' => 'super_admin',
            'admin' => 'store_manager',
            'manager' => 'staff',
            default => $role,
        };

        return self::from($normalized);
    }
}

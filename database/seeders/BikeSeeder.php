<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Fleet inventory must be managed through the authenticated bike management
 * API/admin screens and stored in the bikes table.
 *
 * Intentionally does not create sample motorcycles. Never delete existing
 * bikes or overwrite their pricing and registration records during seeding.
 */
class BikeSeeder extends Seeder
{
    public function run(): void
    {
        // Real inventory is imported or maintained by authorized staff.
    }
}

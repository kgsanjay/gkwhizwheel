<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds for Super Admin only.
     */
    public function run(): void
    {
        // 1. Ensure Spatie roles exist for all enum cases
        foreach (UserRole::cases() as $role) {
            Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
            Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'sanctum']);
        }

        // 2. Create the solitary Super Admin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@whizwheel.com'],
            [
                'name' => 'Super Admin',
                'phone' => '+919999900001',
                'password' => Hash::make('Admin@12345'),
                'role' => UserRole::SUPER_ADMIN,
                'status' => UserStatus::ACTIVE,
                'whatsapp_opt_in' => true,
                'email_verified_at' => now(),
            ]
        );

        $superAdmin->syncRoles([UserRole::SUPER_ADMIN->value]);
    }
}

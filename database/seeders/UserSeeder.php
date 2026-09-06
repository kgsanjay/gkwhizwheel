<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure Spatie roles exist for all enum cases
        foreach (UserRole::cases() as $role) {
            Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);
            Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'sanctum']);
        }

        $koramangala = Store::where('name', 'Koramangala Hub')->first();
        $indiranagar = Store::where('name', 'Indiranagar Station')->first();

        // 1. Admin Users
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

        $opsManager = User::firstOrCreate(
            ['email' => 'ops@whizwheel.com'],
            [
                'name' => 'Operations Manager',
                'phone' => '+919999900002',
                'password' => Hash::make('Admin@12345'),
                'role' => UserRole::STORE_MANAGER,
                'status' => UserStatus::ACTIVE,
                'whatsapp_opt_in' => true,
                'email_verified_at' => now(),
            ]
        );
        $opsManager->syncRoles([UserRole::STORE_MANAGER->value]);

        // 2. Staff Users
        $staffRajesh = User::firstOrCreate(
            ['email' => 'rajesh@whizwheel.com'],
            [
                'name' => 'Rajesh Kumar',
                'phone' => '+919999900011',
                'password' => Hash::make('Staff@12345'),
                'role' => UserRole::STAFF,
                'status' => UserStatus::ACTIVE,
                'whatsapp_opt_in' => true,
                'email_verified_at' => now(),
            ]
        );
        $staffRajesh->syncRoles([UserRole::STAFF->value]);
        if ($koramangala !== null) {
            $staffRajesh->stores()->syncWithoutDetaching([$koramangala->id]);
        }

        $staffPriya = User::firstOrCreate(
            ['email' => 'priya@whizwheel.com'],
            [
                'name' => 'Priya Sharma',
                'phone' => '+919999900012',
                'password' => Hash::make('Staff@12345'),
                'role' => UserRole::STAFF,
                'status' => UserStatus::ACTIVE,
                'whatsapp_opt_in' => true,
                'email_verified_at' => now(),
            ]
        );
        $staffPriya->syncRoles([UserRole::STAFF->value]);
        if ($indiranagar !== null) {
            $staffPriya->stores()->syncWithoutDetaching([$indiranagar->id]);
        }

        $staffSuresh = User::firstOrCreate(
            ['email' => 'suresh@whizwheel.com'],
            [
                'name' => 'Suresh Nair',
                'phone' => '+919999900013',
                'password' => Hash::make('Staff@12345'),
                'role' => UserRole::STAFF,
                'status' => UserStatus::ACTIVE,
                'whatsapp_opt_in' => true,
                'email_verified_at' => now(),
            ]
        );
        $staffSuresh->syncRoles([UserRole::STAFF->value]);
        $storeIds = array_filter([$koramangala?->id, $indiranagar?->id]);
        if (! empty($storeIds)) {
            $staffSuresh->stores()->syncWithoutDetaching($storeIds);
        }
    }
}

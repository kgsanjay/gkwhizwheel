<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Spatie\Permission\Models\Role;

test('user model casts role to UserRole enum', function () {
    $user = new User([
        'name' => 'Test Staff',
        'email' => 'staff@example.com',
        'phone' => '+919988776655',
        'role' => UserRole::STAFF,
    ]);

    expect($user->role)->toBe(UserRole::STAFF)
        ->and($user->role->value)->toBe('staff');
});

test('user role enum supports archtechx enums utilities', function () {
    expect(UserRole::values())->toBe([
        'customer',
        'staff',
        'store_manager',
        'super_admin',
    ])
    ->and(UserRole::names())->toBe([
        'CUSTOMER',
        'STAFF',
        'STORE_MANAGER',
        'SUPER_ADMIN',
    ])
    ->and(UserRole::CUSTOMER())->toBe('customer');
});

test('spatie roles can be assigned to and checked on a user', function () {
    $role = Role::create([
        'name' => UserRole::STORE_MANAGER->value,
        'guard_name' => 'web',
    ]);

    $user = User::factory()->create([
        'role' => UserRole::STORE_MANAGER,
    ]);

    $user->assignRole($role);

    expect($user->hasRole(UserRole::STORE_MANAGER->value))->toBeTrue();
});

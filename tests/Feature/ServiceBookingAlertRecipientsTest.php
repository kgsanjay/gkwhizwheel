<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\Store;
use App\Models\User;
use App\Services\ServiceBookingAlertRecipients;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('new booking alerts reach only active managers assigned to the exact branch and service', function (): void {
    $honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.45, 'phone' => '9888802001', 'status' => StoreStatus::ACTIVE,
    ]);
    $murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Main Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'phone' => '9888802002', 'status' => StoreStatus::ACTIVE,
    ]);

    $createManager = function (string $email, Store $store, array $services, UserStatus $status = UserStatus::ACTIVE): User {
        $user = User::create([
            'name' => 'Service Manager', 'email' => $email,
            'phone' => '9888802010', 'password' => 'Password123!',
            'role' => UserRole::STORE_MANAGER, 'status' => $status,
        ]);
        $user->stores()->attach($store->id);
        $user->syncAssignedServices($services);
        return $user;
    };

    $eligible = $createManager('eligible.alert@example.test', $honnavar, ['boating']);
    $foreign = $createManager('foreign.alert@example.test', $murudeshwar, ['boating']);
    $wrongService = $createManager('taxi.alert@example.test', $honnavar, ['taxi']);
    $inactive = $createManager('inactive.alert@example.test', $honnavar, ['boating'], UserStatus::BLACKLISTED);
    $headquarters = User::create([
        'name' => 'HQ', 'email' => 'hq.alert@example.test',
        'phone' => '9888802011', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);

    $booking = new ServiceBooking(['service_type' => 'boating', 'store_id' => $honnavar->id]);
    $ids = app(ServiceBookingAlertRecipients::class)->forBooking($booking)->modelKeys();
    expect($ids)->toContain($eligible->id)
        ->not->toContain($foreign->id, $wrongService->id, $inactive->id, $headquarters->id);

    $booking->store_id = $murudeshwar->id;
    expect(app(ServiceBookingAlertRecipients::class)->forBooking($booking)->modelKeys())
        ->toBe([$foreign->id]);

    $booking->store_id = null;
    expect(app(ServiceBookingAlertRecipients::class)->forBooking($booking)->modelKeys())
        ->toBe([$headquarters->id]);
});

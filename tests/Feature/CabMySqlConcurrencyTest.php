<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use App\Models\Store;
use App\Services\ServiceResourceAllocator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Separate MySQL processes are necessary: in-memory SQLite and Laravel's
 * transaction-wrapped tests cannot prove InnoDB SELECT ... FOR UPDATE behavior.
 * This test runs only in its dedicated, isolated MySQL CI database.
 */
test('two concurrent mysql allocator writers cannot reserve the same cab resource', function (): void {
    if (DB::getDriverName() !== 'mysql' || ! function_exists('pcntl_fork')) {
        if (getenv('CAB_REQUIRE_MYSQL_RACE') === '1') {
            throw new RuntimeException('Required concurrency test must use a real MySQL driver with pcntl.');
        }
        $this->markTestSkipped('Requires real MySQL and pcntl_fork.');
    }

    $store = Store::create([
        'name' => 'Concurrent Cab CI', 'address_line' => 'MySQL CI Test Road',
        'city' => 'Test City', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $store->id, 'service_type' => 'taxi', 'name' => 'Race Test Cab',
        'price_base' => 1000, 'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $resource = ServiceResource::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'resource_type' => 'cab_vehicle', 'code' => 'MYSQL-CAB-RACE',
        'name' => 'Capacity One Cab', 'capacity_units' => 1, 'status' => 'available',
    ]);

    $start = now()->addDays(7)->startOfDay()->addHours(9);
    $end = $start->copy()->addHours(3);
    $bookingIds = [];
    foreach ([1, 2] as $suffix) {
        $booking = ServiceBooking::create([
            'store_id' => $store->id, 'service_item_id' => $item->id,
            'service_type' => 'taxi', 'booking_number' => 'MYSQL-CAB-RACE-'.$suffix,
            'booking_channel' => 'offline_walkin',
            'customer_name' => 'MySQL Test Customer '.$suffix,
            'customer_phone' => '900000010'.$suffix,
            'start_datetime' => $start, 'end_datetime' => $end,
            'quantity' => 1, 'total_amount' => 1000,
            'advance_paid' => 0, 'balance_due' => 1000, 'status' => 'confirmed',
        ]);
        $bookingIds[] = $booking->id;
    }

    // The shared Pest suite wraps feature tests in a transaction. Commit the
    // dedicated CI-only MySQL fixtures before forking, otherwise isolated
    // child connections cannot see the parent rows. Never do this in SQLite.
    while (DB::transactionLevel() > 0) {
        DB::commit();
    }
    DB::disconnect();
    $barrier = tempnam(sys_get_temp_dir(), 'cab-race-start-');
    $files = [];
    $children = [];
    try {
        foreach ($bookingIds as $bookingId) {
            $result = tempnam(sys_get_temp_dir(), 'cab-race-result-');
            $files[] = $result;
            $pid = pcntl_fork();
            if ($pid === -1) {
                throw new RuntimeException('Could not fork an independent allocation process.');
            }
            if ($pid === 0) {
                try {
                    DB::purge();
                    $deadline = microtime(true) + 8.0;
                    while (! file_exists($barrier.'.go') && microtime(true) < $deadline) {
                        usleep(10000);
                    }
                    if (! file_exists($barrier.'.go')) {
                        throw new RuntimeException('Concurrency barrier timed out.');
                    }
                    app(ServiceResourceAllocator::class)->allocate(
                        $resource->id, $bookingId,
                        $start->toDateTimeString(), $end->toDateTimeString(),
                        1, 'confirmed'
                    );
                    file_put_contents($result, 'success');
                } catch (ValidationException $e) {
                    file_put_contents($result, 'capacity_rejected');
                } catch (Throwable $e) {
                    file_put_contents($result, 'unexpected:'.get_class($e).':'.$e->getMessage());
                }
                exit(0);
            }
            $children[] = $pid;
        }
        touch($barrier.'.go');
        foreach ($children as $pid) {
            pcntl_waitpid($pid, $status);
            expect(pcntl_wifexited($status))->toBeTrue()
                ->and(pcntl_wexitstatus($status))->toBe(0);
        }
        DB::purge();
        $outcomes = array_map(fn (string $path): string => (string) file_get_contents($path), $files);
        sort($outcomes);
        expect($outcomes)->toBe(['capacity_rejected', 'success']);
        expect(ServiceResourceAllocation::where('service_resource_id', $resource->id)
            ->where('status', 'confirmed')->count())->toBe(1);
    } finally {
        foreach ($children as $pid) {
            if (pcntl_waitpid($pid, $status, WNOHANG) === 0) {
                posix_kill($pid, SIGTERM);
                pcntl_waitpid($pid, $status);
            }
        }
        foreach ($files as $file) {
            @unlink($file);
        }
        @unlink($barrier.'.go');
        @unlink($barrier);
    }
});


test('concurrent mysql cab dispatch assigns paired vehicle and driver to only one booking', function (): void {
    if (DB::getDriverName() !== 'mysql' || ! function_exists('pcntl_fork')) {
        if (getenv('CAB_REQUIRE_MYSQL_RACE') === '1') {
            throw new RuntimeException('Dedicated cab concurrency gate requires MySQL and pcntl.');
        }
        $this->markTestSkipped('Requires MySQL and process forking.');
    }

    $store = Store::create([
        'name' => 'Paired Dispatch CI', 'address_line' => 'Race Test Road',
        'city' => 'Test City', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $store->id, 'service_type' => 'taxi',
        'name' => 'Concurrent Paired Cab',
        'price_base' => 1200, 'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $operator = \App\Models\User::create([
        'name' => 'MySQL Dispatch Admin',
        'email' => 'mysql-cab-dispatch@example.test',
        'phone' => '9000012345', 'password' => 'Password123!',
        'role' => \App\Enums\UserRole::SUPER_ADMIN,
        'status' => \App\Enums\UserStatus::ACTIVE,
    ]);
    $vehicleResource = ServiceResource::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'resource_type' => 'cab_vehicle', 'code' => 'MYSQL-PAIR-VEHICLE',
        'name' => 'Paired CI Cab', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $driverResource = ServiceResource::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'resource_type' => 'cab_driver', 'code' => 'MYSQL-PAIR-DRIVER',
        'name' => 'Paired CI Driver', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $cab = \App\Models\CabVehicle::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'service_resource_id' => $vehicleResource->id,
        'registration_number' => 'KA47CI2026',
        'vehicle_class' => 'sedan', 'make' => 'Test', 'model_name' => 'CI Cab',
        'ownership_type' => 'owned', 'seats' => 4, 'luggage_capacity' => 2,
        'documents_verified' => true, 'status' => 'available',
        'insurance_expires_on' => now()->addYear(),
        'permit_expires_on' => now()->addYear(),
        'fitness_expires_on' => now()->addYear(),
        'last_inspected_on' => now(),
    ]);
    $driver = \App\Models\CabDriver::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'service_resource_id' => $driverResource->id,
        'name' => 'Paired Race Driver',
        'license_fingerprint' => hash('sha256', 'mysql-paired-race-licence'),
        'license_last_four' => '9876', 'documents_verified' => true,
        'license_expires_on' => now()->addYear(),
        'last_verified_on' => now(), 'status' => 'available',
    ]);
    $start = now()->addDays(8)->startOfDay()->addHours(9);
    $end = $start->copy()->addHours(3);
    $bookings = [];
    foreach ([1, 2] as $n) {
        $bookings[] = ServiceBooking::create([
            'store_id' => $store->id, 'service_item_id' => $item->id,
            'service_type' => 'taxi', 'booking_number' => 'MYSQL-PAIR-CAB-'.$n,
            'booking_channel' => 'offline_walkin', 'customer_name' => 'Paired CI '.$n,
            'customer_phone' => '900001000'.$n,
            'start_datetime' => $start, 'end_datetime' => $end,
            'quantity' => 2, 'total_amount' => 1200,
            'advance_paid' => 0, 'balance_due' => 1200, 'status' => 'confirmed',
        ]);
    }

    // Dedicated CI database only. Commit fixtures so that forked children can
    // use independent real InnoDB connections rather than inherited PDO state.
    while (DB::transactionLevel() > 0) {
        DB::commit();
    }
    DB::disconnect();
    $signal = tempnam(sys_get_temp_dir(), 'cab-pair-start-');
    $outcomes = [];
    $pids = [];
    try {
        foreach ($bookings as $booking) {
            $output = tempnam(sys_get_temp_dir(), 'cab-pair-result-');
            $outcomes[] = $output;
            $pid = pcntl_fork();
            if ($pid === -1) {
                throw new RuntimeException('Cannot start isolated MySQL cab worker.');
            }
            if ($pid === 0) {
                try {
                    DB::purge();
                    $deadline = microtime(true) + 8.0;
                    while (! file_exists($signal.'.go') && microtime(true) < $deadline) {
                        usleep(10000);
                    }
                    if (! file_exists($signal.'.go')) {
                        throw new RuntimeException('Paired dispatch worker barrier timed out.');
                    }
                    app(\App\Services\CabDispatchService::class)->assign(
                        $booking->id, $cab->id, $driver->id, $operator
                    );
                    file_put_contents($output, 'success');
                } catch (ValidationException $e) {
                    file_put_contents($output, 'rejected');
                } catch (Throwable $e) {
                    file_put_contents($output, 'unexpected:'.get_class($e).':'.$e->getMessage());
                }
                exit(0);
            }
            $pids[] = $pid;
        }
        touch($signal.'.go');
        foreach ($pids as $pid) {
            pcntl_waitpid($pid, $status);
            expect(pcntl_wifexited($status))->toBeTrue()
                ->and(pcntl_wexitstatus($status))->toBe(0);
        }
        DB::purge();
        $results = array_map(fn (string $file): string => (string) file_get_contents($file), $outcomes);
        sort($results);
        expect($results)->toBe(['rejected', 'success']);
        expect(\App\Models\CabDispatch::whereIn('service_booking_id', array_map(
            fn (ServiceBooking $b): int => $b->id, $bookings
        ))->count())->toBe(1);
        foreach ([$vehicleResource->id, $driverResource->id] as $resourceId) {
            expect(ServiceResourceAllocation::where('service_resource_id', $resourceId)
                ->where('status', 'confirmed')->count())->toBe(1);
        }
        $vehicleBooking = ServiceResourceAllocation::where('service_resource_id', $vehicleResource->id)
            ->where('status', 'confirmed')->value('service_booking_id');
        $driverBooking = ServiceResourceAllocation::where('service_resource_id', $driverResource->id)
            ->where('status', 'confirmed')->value('service_booking_id');
        expect($vehicleBooking)->toBe($driverBooking);
    } finally {
        foreach ($pids as $pid) {
            if (pcntl_waitpid($pid, $status, WNOHANG) === 0) {
                posix_kill($pid, SIGTERM);
                pcntl_waitpid($pid, $status);
            }
        }
        foreach ($outcomes as $path) {
            @unlink($path);
        }
        @unlink($signal.'.go');
        @unlink($signal);
    }
});


test('mysql reschedule and competing cab assignment cannot claim the same new time slot', function (): void {
    if (DB::getDriverName() !== 'mysql' || ! function_exists('pcntl_fork')) {
        if (getenv('CAB_REQUIRE_MYSQL_RACE') === '1') {
            throw new RuntimeException('Reschedule race gate requires MySQL and pcntl.');
        }
        $this->markTestSkipped('Requires independent MySQL connections.');
    }

    $store = Store::create([
        'name' => 'Reschedule Race CI', 'address_line' => 'Race Test Road',
        'city' => 'Test City', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $store->id, 'service_type' => 'taxi',
        'name' => 'Concurrent Paired Cab',
        'price_base' => 1200, 'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $operator = \App\Models\User::create([
        'name' => 'MySQL Dispatch Admin',
        'email' => 'mysql-cab-dispatch@example.test',
        'phone' => '9000012345', 'password' => 'Password123!',
        'role' => \App\Enums\UserRole::SUPER_ADMIN,
        'status' => \App\Enums\UserStatus::ACTIVE,
    ]);
    $vehicleResource = ServiceResource::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'resource_type' => 'cab_vehicle', 'code' => 'MYSQL-RES-VEHICLE',
        'name' => 'Reschedule CI Cab', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $driverResource = ServiceResource::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'resource_type' => 'cab_driver', 'code' => 'MYSQL-RES-DRIVER',
        'name' => 'Reschedule CI Driver', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $cab = \App\Models\CabVehicle::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'service_resource_id' => $vehicleResource->id,
        'registration_number' => 'KA47RES2026',
        'vehicle_class' => 'sedan', 'make' => 'Test', 'model_name' => 'CI Cab',
        'ownership_type' => 'owned', 'seats' => 4, 'luggage_capacity' => 2,
        'documents_verified' => true, 'status' => 'available',
        'insurance_expires_on' => now()->addYear(),
        'permit_expires_on' => now()->addYear(),
        'fitness_expires_on' => now()->addYear(),
        'last_inspected_on' => now(),
    ]);
    $driver = \App\Models\CabDriver::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'service_resource_id' => $driverResource->id,
        'name' => 'Reschedule Race Driver',
        'license_fingerprint' => hash('sha256', 'mysql-reschedule-race-licence'),
        'license_last_four' => '9876', 'documents_verified' => true,
        'license_expires_on' => now()->addYear(),
        'last_verified_on' => now(), 'status' => 'available',
    ]);
    $start = now()->addDays(8)->startOfDay()->addHours(9);
    $end = $start->copy()->addHours(3);
    $bookings = [];
    foreach ([1, 2] as $n) {
        $slotStart = $n === 1 ? $start : $start->copy()->addDay();
        $slotEnd = $slotStart->copy()->addHours(3);
        $bookings[] = ServiceBooking::create([
            'store_id' => $store->id, 'service_item_id' => $item->id,
            'service_type' => 'taxi', 'booking_number' => 'MYSQL-RES-CAB-'.$n,
            'booking_channel' => 'offline_walkin', 'customer_name' => 'Reschedule CI '.$n,
            'customer_phone' => '900001000'.$n,
            'start_datetime' => $slotStart, 'end_datetime' => $slotEnd,
            'quantity' => 2, 'total_amount' => 1200,
            'advance_paid' => 0, 'balance_due' => 1200, 'status' => 'confirmed',
        ]);
    }


    $dispatch = app(\App\Services\CabDispatchService::class)->assign(
        $bookings[0], $cab, $driver, $operator
    );
    $proposal = \App\Models\CabRescheduleRequest::create([
        'cab_dispatch_id' => $dispatch->id,
        'requested_by' => $operator->id,
        'original_starts_at' => $start,
        'original_ends_at' => $end,
        'proposed_starts_at' => $bookings[1]->start_datetime,
        'proposed_ends_at' => $bookings[1]->end_datetime,
        'status' => 'pending',
        'reason' => 'CI verifies reschedule and simultaneous allocation',
    ]);

    // The fixture transaction must commit before independent child connections.
    while (DB::transactionLevel() > 0) {
        DB::commit();
    }
    DB::disconnect();
    $signal = tempnam(sys_get_temp_dir(), 'cab-move-start-');
    $outcomes = [];
    $pids = [];
    try {
        foreach (['reschedule', 'assign'] as $operation) {
            $output = tempnam(sys_get_temp_dir(), 'cab-move-result-');
            $outcomes[] = $output;
            $pid = pcntl_fork();
            if ($pid === -1) {
                throw new RuntimeException('Cannot fork independent cab-reschedule race worker.');
            }
            if ($pid === 0) {
                try {
                    DB::purge();
                    $deadline = microtime(true) + 8.0;
                    while (! file_exists($signal.'.go') && microtime(true) < $deadline) {
                        usleep(10000);
                    }
                    if (! file_exists($signal.'.go')) {
                        throw new RuntimeException('Cab-reschedule race barrier timed out.');
                    }
                    if ($operation === 'reschedule') {
                        app(\App\Services\CabRescheduleService::class)->resolve(
                            $proposal->id, $operator, 'approved'
                        );
                    } else {
                        app(\App\Services\CabDispatchService::class)->assign(
                            $bookings[1]->id, $cab->id, $driver->id, $operator
                        );
                    }
                    file_put_contents($output, $operation.':success');
                } catch (ValidationException $e) {
                    file_put_contents($output, $operation.':rejected');
                } catch (Throwable $e) {
                    file_put_contents($output, $operation.':unexpected:'.get_class($e).':'.$e->getMessage());
                }
                exit(0);
            }
            $pids[] = $pid;
        }
        touch($signal.'.go');
        foreach ($pids as $pid) {
            pcntl_waitpid($pid, $status);
            expect(pcntl_wifexited($status))->toBeTrue()
                ->and(pcntl_wexitstatus($status))->toBe(0);
        }
        DB::purge();
        $results = array_map(fn (string $path): string => (string) file_get_contents($path), $outcomes);
        sort($results);
        expect($results)->toBeIn([
            ['assign:rejected', 'reschedule:success'],
            ['assign:success', 'reschedule:rejected'],
        ]);
        $finalDispatch = \App\Models\CabDispatch::findOrFail($dispatch->id);
        $finalProposal = \App\Models\CabRescheduleRequest::findOrFail($proposal->id);
        $otherDispatch = \App\Models\CabDispatch::where('service_booking_id', $bookings[1]->id)->first();
        $newStart = $bookings[1]->start_datetime->toDateTimeString();
        $vehicleAllocations = ServiceResourceAllocation::where('service_resource_id', $vehicleResource->id)
            ->where('status', 'confirmed')->get();
        $driverAllocations = ServiceResourceAllocation::where('service_resource_id', $driverResource->id)
            ->where('status', 'confirmed')->get();
        expect($vehicleAllocations)->toHaveCount($driverAllocations->count());
        foreach ($vehicleAllocations as $allocation) {
            $matching = $driverAllocations->firstWhere('service_booking_id', $allocation->service_booking_id);
            expect($matching)->not->toBeNull()
                ->and($matching->starts_at->toDateTimeString())->toBe($allocation->starts_at->toDateTimeString());
        }
        if ($finalProposal->status === 'approved') {
            expect($otherDispatch)->toBeNull()
                ->and($finalDispatch->starts_at->toDateTimeString())->toBe($newStart)
                ->and(\App\Models\CabNotificationEvent::where('event_type', 'reschedule_approved')->count())->toBe(1);
        } else {
            expect($finalProposal->status)->toBe('pending')
                ->and($otherDispatch)->not->toBeNull()
                ->and($finalDispatch->starts_at->toDateTimeString())->toBe($start->toDateTimeString())
                ->and(\App\Models\CabNotificationEvent::where('event_type', 'reschedule_approved')->count())->toBe(0);
        }
    } finally {
        foreach ($pids as $pid) {
            if (pcntl_waitpid($pid, $status, WNOHANG) === 0) {
                posix_kill($pid, SIGTERM);
                pcntl_waitpid($pid, $status);
            }
        }
        foreach ($outcomes as $path) {
            @unlink($path);
        }
        @unlink($signal.'.go');
        @unlink($signal);
    }
});

<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use App\Models\Store;
use App\Services\ServiceResourceAllocator;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

uses(DatabaseMigrations::class);

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
            'start_datetime' => $start, 'end_datetime' => $end,
            'quantity' => 1, 'total_amount' => 1000,
            'advance_paid' => 0, 'balance_due' => 1000, 'status' => 'confirmed',
        ]);
        $bookingIds[] = $booking->id;
    }

    // Fork only after fixtures have committed and the shared PDO connection
    // is disconnected. Each child obtains a fresh InnoDB connection.
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

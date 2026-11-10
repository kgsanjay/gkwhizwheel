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

test('concurrent mysql approval preserves capacity and replay audit', function (bool $sameBooking): void {
    if (DB::getDriverName() !== 'mysql' || ! function_exists('pcntl_fork')) {
        if (getenv('CAB_REQUIRE_MYSQL_RACE') === '1') {
            throw new RuntimeException('Required concurrency test must use a real MySQL driver with pcntl.');
        }
        $this->markTestSkipped('Requires real MySQL and pcntl_fork.');
    }

    if (app()->environment() !== 'testing' || DB::connection()->getDatabaseName() !== 'gkw_cab_race_ci') {
        throw new RuntimeException('Approval race requires the disposable CI database.');
    }
    $operator = \App\Models\User::factory()->create([
        'role' => \App\Enums\UserRole::SUPER_ADMIN, 'status' => \App\Enums\UserStatus::ACTIVE,
    ]);
    $store = Store::create([
        'name' => 'Concurrent Cab CI', 'address_line' => 'MySQL CI Test Road',
        'city' => 'Test City', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $store->id, 'service_type' => 'boating', 'name' => 'Race Test Cab',
        'price_base' => 1000, 'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $resource = ServiceResource::create([
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'resource_type' => 'boat', 'code' => 'MYSQL-CAB-RACE',
        'name' => 'Capacity One Cab', 'capacity_units' => 1, 'status' => 'available',
    ]);

    $start = now()->addDays(7)->startOfDay()->addHours(9);
    $end = $start->copy()->addHours(3);
    $bookingIds = [];
    foreach ([1, 2] as $suffix) {
        $booking = ServiceBooking::create([
            'store_id' => $store->id, 'service_item_id' => $item->id,
            'service_type' => 'boating', 'booking_number' => 'MYSQL-CAB-RACE-'.$suffix,
            'booking_channel' => 'offline_walkin',
            'customer_name' => 'MySQL Test Customer '.$suffix,
            'customer_phone' => '900000010'.$suffix,
            'start_datetime' => $start, 'end_datetime' => $end,
            'quantity' => 1, 'total_amount' => 1000,
            'advance_paid' => 0, 'balance_due' => 1000, 'payment_status' => 'pending',
            'status' => 'held', 'held_until' => now()->addMinutes(10),
        ]);
        $bookingIds[] = $booking->id;
    }

    $approval = [
        'expected_total_paise' => 100000, 'expected_starts_at' => $start->toDateTimeString(),
        'expected_ends_at' => $end->toDateTimeString(), 'resource_ids' => [$resource->id],
        'approval_notes' => 'Concurrent synthetic manager approval',
    ];
    if ($sameBooking) {
        $bookingIds[1] = $bookingIds[0];
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
                    app(\App\Services\ServiceBookingApproval::class)->approve($bookingId, $operator, $approval);
                    file_put_contents($result, 'success');
                } catch (ValidationException $e) {
                    file_put_contents($result, array_keys($e->errors()) === ['resource']
                        ? 'capacity_rejected' : 'unexpected_validation:'.json_encode($e->errors()));
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
        expect($outcomes)->toBe($sameBooking ? ['success', 'success'] : ['capacity_rejected', 'success']);
        expect(ServiceResourceAllocation::where('service_resource_id', $resource->id)
            ->where('status', 'confirmed')->count())->toBe(1);
        // Replay the winning request on a fresh parent connection: retries must
        // return the same committed allocation without consuming capacity twice.
        $winner = ServiceResourceAllocation::where('service_resource_id', $resource->id)
            ->where('status', 'confirmed')->sole();
        foreach ([1, 2] as $retry) {
            $replayed = app(\App\Services\ServiceBookingApproval::class)->approve($winner->service_booking_id, $operator, $approval);
            expect($replayed->status)->toBe('confirmed');
        }
        expect(\App\Models\ActivityLog::where('action', 'service_booking.approved')->count())->toBe(1)
            ->and(ServiceBooking::whereIn('id', $bookingIds)->where('status', 'confirmed')->count())->toBe(1);
        if (! $sameBooking) {
            expect(ServiceBooking::whereIn('id', $bookingIds)->where('status', 'held')->count())->toBe(1);
        }
        expect(ServiceResourceAllocation::where('service_resource_id', $resource->id)->count())->toBe(1);
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
})->with(['different proposals' => false, 'identical approval replay' => true]);

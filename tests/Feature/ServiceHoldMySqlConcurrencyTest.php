<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use App\Services\ServiceAvailabilityService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

test('mysql concurrent service hold retries create exactly one booking', function (): void {
    if (DB::getDriverName() !== 'mysql' || ! function_exists('pcntl_fork')) {
        if (getenv('CAB_REQUIRE_MYSQL_RACE') === '1') {
            throw new RuntimeException('Required MySQL concurrency test needs mysql and pcntl.');
        }
        $this->markTestSkipped('Requires real MySQL and pcntl.');
    }
    if (app()->environment() !== 'testing' || DB::connection()->getDatabaseName() !== 'gkw_cab_race_ci') {
        throw new RuntimeException('Only the disposable CI race database may run this test.');
    }

    $customer = User::factory()->create();
    $store = Store::create([
        'name' => 'Service Hold Race Branch', 'address_line' => 'CI Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.44, 'status' => StoreStatus::ACTIVE,
    ]);
    $item = ServiceItem::create([
        'store_id' => $store->id, 'service_type' => 'homestay',
        'name' => 'Single Race Room', 'price_base' => 500,
        'price_unit' => 'per_night', 'capacity' => '1 Room', 'status' => 'available',
    ]);
    $params = [
        'idempotency_key' => 'mysql-service-hold-race-'.$item->id,
        'store_id' => $store->id, 'service_item_id' => $item->id,
        'service_type' => 'homestay', 'user_id' => $customer->id,
        'customer_name' => 'Race Customer', 'customer_phone' => '9876543210',
        'booking_channel' => 'offline_phone',
        'start_datetime' => now()->addDays(7)->startOfHour()->toDateTimeString(),
        'end_datetime' => now()->addDays(8)->startOfHour()->toDateTimeString(),
        'pickup_location' => 'Honnavar', 'quantity' => 1,
        'base_amount' => 500, 'tax_amount' => 0, 'discount_amount' => 0,
        'total_amount' => 500, 'advance_paid' => 0, 'balance_due' => 500,
        'payment_status' => 'pending', 'payment_method' => 'pay_on_arrival',
    ];
    while (DB::transactionLevel() > 0) {
        DB::commit();
    }
    DB::disconnect();
    $barrier = tempnam(sys_get_temp_dir(), 'service-hold-barrier-');
    $children = [];
    $files = [];
    try {
        for ($i = 0; $i < 2; $i++) {
            $result = tempnam(sys_get_temp_dir(), 'service-hold-result-');
            $files[] = $result;
            $pid = pcntl_fork();
            if ($pid === -1) {
                throw new RuntimeException('Fork failed.');
            }
            if ($pid === 0) {
                try {
                    DB::purge();
                    $deadline = microtime(true) + 8;
                    while (! file_exists($barrier.'.go') && microtime(true) < $deadline) {
                        usleep(10000);
                    }
                    if (! file_exists($barrier.'.go')) {
                        throw new RuntimeException('Start barrier timed out.');
                    }
                    $booking = app(ServiceAvailabilityService::class)->holdServiceBooking($params);
                    file_put_contents($result, 'success:'.$booking->id);
                } catch (ValidationException $e) {
                    file_put_contents($result, 'validation:'.json_encode($e->errors()));
                } catch (Throwable $e) {
                    file_put_contents($result, 'error:'.get_class($e).':'.$e->getMessage());
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
        $outcomes = array_map(fn ($file) => (string) file_get_contents($file), $files);
        expect($outcomes[0])->toStartWith('success:')
            ->and($outcomes[1])->toBe($outcomes[0]);
        expect(ServiceBooking::where('idempotency_key', $params['idempotency_key'])->count())->toBe(1);
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

<?php

declare(strict_types=1);

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\SyncStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('activity_logs table has exact columns and polymorphic index', function () {
    expect(Schema::hasTable('activity_logs'))->toBeTrue();

    $columns = [
        'id',
        'user_id',
        'store_id',
        'action',
        'subject_type',
        'subject_id',
        'old_values',
        'new_values',
        'created_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('activity_logs', $column))->toBeTrue("Missing activity_logs.{$column}");
    }

    expect(Schema::hasColumn('activity_logs', 'updated_at'))->toBeFalse();

    $indexes = Schema::getIndexes('activity_logs');
    $hasMorphIndex = collect($indexes)->contains(function ($idx) {
        return in_array('subject_type', $idx['columns'], true) && in_array('subject_id', $idx['columns'], true);
    });

    expect($hasMorphIndex)->toBeTrue();
});

test('notification_logs table has exact columns per schema', function () {
    expect(Schema::hasTable('notification_logs'))->toBeTrue();

    $columns = [
        'id',
        'user_id',
        'booking_id',
        'channel',
        'template',
        'status',
        'error_message',
        'sent_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('notification_logs', $column))->toBeTrue("Missing notification_logs.{$column}");
    }

    expect(Schema::hasColumn('notification_logs', 'created_at'))->toBeFalse()
        ->and(Schema::hasColumn('notification_logs', 'updated_at'))->toBeFalse();
});

test('sync_queue table has exact columns and unique idempotency key', function () {
    expect(Schema::hasTable('sync_queue'))->toBeTrue();

    $columns = [
        'id',
        'device_id',
        'user_id',
        'action_type',
        'payload_json',
        'idempotency_key',
        'status',
        'synced_at',
        'created_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('sync_queue', $column))->toBeTrue("Missing sync_queue.{$column}");
    }

    expect(Schema::hasColumn('sync_queue', 'updated_at'))->toBeFalse();

    $indexes = Schema::getIndexes('sync_queue');
    $hasUniqueIdempotency = collect($indexes)->filter(fn ($idx) => $idx['unique'])
        ->contains(fn ($idx) => in_array('idempotency_key', $idx['columns'], true));

    expect($hasUniqueIdempotency)->toBeTrue();
});

test('can insert records into activity_logs, notification_logs, and sync_queue', function () {
    $user = User::factory()->create();

    $storeId = DB::table('stores')->insertGetId([
        'name' => 'Jayanagar Branch',
        'address_line' => '4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560011',
        'latitude' => 12.9250000,
        'longitude' => 77.5938000,
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // activity_log
    $logId = DB::table('activity_logs')->insertGetId([
        'user_id' => $user->id,
        'store_id' => $storeId,
        'action' => 'pricing_rule.updated',
        'subject_type' => 'PricingRule',
        'subject_id' => 10,
        'old_values' => json_encode(['value' => 10.0]),
        'new_values' => json_encode(['value' => 15.0]),
        'created_at' => now(),
    ]);

    // notification_log
    $notifId = DB::table('notification_logs')->insertGetId([
        'user_id' => $user->id,
        'booking_id' => null,
        'channel' => NotificationChannel::WHATSAPP->value,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::SENT->value,
        'error_message' => null,
        'sent_at' => now(),
    ]);

    // sync_queue
    $syncId = DB::table('sync_queue')->insertGetId([
        'device_id' => 'device-android-imei-12345',
        'user_id' => $user->id,
        'action_type' => 'mark_returned',
        'payload_json' => json_encode(['booking_id' => 1, 'odometer' => 15200]),
        'idempotency_key' => 'idemp-sync-uuid-999',
        'status' => SyncStatus::PENDING->value,
        'synced_at' => null,
        'created_at' => now(),
    ]);

    expect(DB::table('activity_logs')->where('id', $logId)->value('action'))->toBe('pricing_rule.updated')
        ->and(DB::table('notification_logs')->where('id', $notifId)->value('channel'))->toBe('whatsapp')
        ->and(DB::table('sync_queue')->where('id', $syncId)->value('status'))->toBe('pending');
});

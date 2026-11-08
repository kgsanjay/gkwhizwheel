<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Read-only contract for the versioned resource-foundation migration, not all migrations. */
final class ServiceResourceSchemaPreflight
{
    public const MIGRATION = '2026_11_07_000011_create_service_resources_and_allocations';

    private const TABLES = [
        'service_resources' => [
            'columns' => ['id', 'service_item_id', 'store_id', 'resource_type', 'code', 'name', 'capacity_units', 'status', 'created_at', 'updated_at'],
            'indexes' => [
                [['service_item_id', 'code'], true],
                [['service_item_id', 'status'], false],
                [['store_id', 'resource_type', 'status'], false],
            ],
            'foreign_keys' => [
                ['service_item_id', 'service_items'], ['store_id', 'stores'],
            ],
        ],
        'service_resource_allocations' => [
            'columns' => ['id', 'service_resource_id', 'service_booking_id', 'starts_at', 'ends_at', 'quantity', 'status', 'held_until', 'created_at', 'updated_at'],
            'indexes' => [
                [['service_resource_id', 'service_booking_id'], true],
                [['service_resource_id', 'starts_at', 'ends_at', 'status'], false],
                [['service_booking_id', 'status'], false],
            ],
            'foreign_keys' => [
                ['service_resource_id', 'service_resources'], ['service_booking_id', 'service_bookings'],
            ],
        ],
    ];

    public function inspect(bool $requireMySql = false): array
    {
        $driver = DB::getDriverName();
        $findings = [];
        if (! in_array($driver, ['mysql', 'sqlite'], true) || ($requireMySql && $driver !== 'mysql')) {
            $findings[] = 'unsupported_or_unverified_driver';
        }
        foreach (['service_items', 'service_bookings', 'stores', 'migrations'] as $table) {
            if (! Schema::hasTable($table)) {
                $findings[] = 'missing_prerequisite:'.$table;
            }
        }
        $historyCount = Schema::hasTable('migrations')
            ? DB::table('migrations')->where('migration', self::MIGRATION)->count() : 0;
        if ($historyCount > 1) {
            $findings[] = 'duplicate_migration_history';
        }
        $tables = [];
        foreach (self::TABLES as $table => $contract) {
            $exists = Schema::hasTable($table);
            $tables[$table] = ['exists' => $exists, 'rows' => $exists ? DB::table($table)->count() : null];
            if (! $exists) {
                continue;
            }
            foreach (array_diff($contract['columns'], Schema::getColumnListing($table)) as $column) {
                $findings[] = 'missing_column:'.$table.'.'.$column;
            }
            $indexes = Schema::getIndexes($table);
            foreach ($contract['indexes'] as [$columns, $unique]) {
                $found = collect($indexes)->contains(fn (array $index): bool =>
                    $index['columns'] === $columns && (bool) $index['unique'] === $unique);
                if (! $found) {
                    $findings[] = 'missing_'.($unique ? 'unique' : 'index').':'.$table.'.'.implode(',', $columns);
                }
            }
            $foreignKeys = Schema::getForeignKeys($table);
            foreach ($contract['foreign_keys'] as [$column, $parent]) {
                $found = collect($foreignKeys)->contains(fn (array $key): bool =>
                    $key['columns'] === [$column] && $key['foreign_table'] === $parent
                    && $key['foreign_columns'] === ['id']
                    && in_array(strtolower($key['on_delete']), ['restrict', 'no action'], true));
                if (! $found) {
                    $findings[] = 'missing_restrict_foreign_key:'.$table.'.'.$column;
                }
            }
            if ($driver === 'mysql') {
                $engine = DB::table('information_schema.tables')->where('table_schema', DB::getDatabaseName())
                    ->where('table_name', DB::getTablePrefix().$table)->value('engine');
                if (strtolower((string) $engine) !== 'innodb') {
                    $findings[] = 'non_innodb_table:'.$table;
                }
            }
        }
        $present = count(array_filter($tables, fn (array $table): bool => $table['exists']));
        if ($historyCount > 0 && $present !== 2) {
            $findings[] = 'recorded_migration_missing_tables';
        }
        if ($historyCount === 0 && $present > 0) {
            $findings[] = $present === 2 ? 'unrecorded_existing_schema' : 'partial_unrecorded_schema';
        }
        $state = $findings !== [] ? 'blocked' : ($present === 0 ? 'fresh_pending' : 'applied');
        return [
            'scope' => self::MIGRATION, 'driver' => $driver, 'state' => $state,
            'migration_history_rows' => $historyCount, 'tables' => $tables,
            'findings' => $findings, 'writes_performed' => false,
            'limits' => 'Foundation structure only; does not certify exact column types/defaults, data integrity, backups, other migrations or release readiness.',
        ];
    }
}

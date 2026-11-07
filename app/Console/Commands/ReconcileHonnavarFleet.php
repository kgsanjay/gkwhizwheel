<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * Safe, explicit, registration-based reconciliation of ten Honnavar RCs.
 * Does not copy any RC documents or identity/chassis/engine/financial details.
 * Normal invocation is read-only; --apply requires approved catalog IDs.
 */
final class ReconcileHonnavarFleet extends Command
{
    protected $signature = 'fleet:reconcile-honnavar
        {--apply : Insert only missing registrations after verification}
        {--store-id= : Confirm the active Honnavar branch ID explicitly}
        {--dio-model-id= : Approved Honda Dio DLX catalog model ID}
        {--activa-model-id= : Approved Honda Activa STD catalog model ID (not assumed 6G)}
        {--access-model-id= : Approved Suzuki Access 125 catalog model ID}';

    protected $description = 'Dry-run or safely insert ten RC-documented Honnavar scooters as non-bookable maintenance inventory';

    private const VEHICLES = [
        'dio' => ['brand' => 'Honda', 'name' => 'Dio DLX', 'registrations' => [
            'KA47A4047', 'KA47A4052', 'KA47A4054', 'KA47A4056', 'KA47A4057',
        ]],
        'activa' => ['brand' => 'Honda', 'name' => 'Activa STD', 'registrations' => [
            'KA47A8004', 'KA47A8005', 'KA47A8006',
        ]],
        'access' => ['brand' => 'Suzuki', 'name' => 'Access 125', 'registrations' => [
            'KA47A8011', 'KA47A8012',
        ]],
    ];

    public function handle(): int
    {
        try {
            $storeId = $this->selectedStoreId();
            $catalog = $this->approvedModels($this->option('apply'));
            $report = $this->preflight($storeId, $catalog);

            foreach ($report as $row) {
                $this->line(implode(' | ', [
                    $row['registration'], $row['model'], $row['result'], $row['location'],
                ]));
            }

            $missing = count(array_filter($report, fn (array $row): bool => $row['result'] === 'MISSING'));
            $blocked = count(array_filter($report, fn (array $row): bool => $row['blocked']));
            $this->info("Honnavar inventory: 10 RC registrations; {$missing} missing, {$blocked} requiring review.");

            if (! $this->option('apply')) {
                $this->warn('DRY RUN — database unchanged. Review actual branch and catalog mapping before --apply.');
                return $blocked === 0 ? self::SUCCESS : self::FAILURE;
            }

            if ($blocked > 0) {
                throw new RuntimeException('Conflicting, duplicate or soft-deleted registrations found. No rows inserted.');
            }

            DB::transaction(function () use ($storeId, $catalog): void {
                // Lock branch/catalog references and re-check all registrations
                // before any writes, so failure leaves all changes rolled back.
                $store = Store::whereKey($storeId)->lockForUpdate()->firstOrFail();
                if (mb_strtolower($store->city) !== 'honnavar' || $store->status !== StoreStatus::ACTIVE) {
                    throw new RuntimeException('Selected Honnavar branch is not active. No changes made.');
                }
                foreach ($catalog as $key => $model) {
                    $fresh = BikeModel::whereKey($model->id)->lockForUpdate()->firstOrFail();
                    $this->assertModel($fresh, $key);
                }
                $report = $this->preflight($storeId, $catalog);
                if (count(array_filter($report, fn (array $row): bool => $row['blocked'])) > 0) {
                    throw new RuntimeException('Fleet changed during preflight. No changes made.');
                }
                foreach (self::VEHICLES as $key => $group) {
                    $model = $catalog[$key];
                    foreach ($group['registrations'] as $registration) {
                        $exists = Bike::withTrashed()->where('registration_number', $registration)->exists();
                        if ($exists) {
                            continue; // Preserve existing status, documents, bookings, assignment, rates.
                        }
                        Bike::create([
                            'category_id' => $model->category_id,
                            'bike_model_id' => $model->id,
                            'current_store_id' => $storeId,
                            'home_store_id' => $storeId,
                            'brand' => $model->brand,
                            'model_name' => $model->name,
                            'registration_number' => $registration,
                            'fuel_type' => $model->fuel_type ?? FuelType::PETROL,
                            'transmission' => $model->transmission ?? Transmission::AUTOMATIC,
                            'status' => BikeStatus::MAINTENANCE,
                        ]);
                    }
                }
            });

            $this->info('Approved missing vehicles inserted as MAINTENANCE. Nothing was made rentable or priced.');
            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('No unapproved fleet changes: '.$e->getMessage());
            return self::FAILURE;
        }
    }

    private function selectedStoreId(): ?int
    {
        $raw = $this->option('store-id');
        if ($raw !== null && (! ctype_digit((string) $raw) || (int) $raw < 1)) {
            throw new RuntimeException('Provide a valid positive --store-id.');
        }
        if ($this->option('apply') && $raw === null) {
            throw new RuntimeException('Explicit --store-id required before writing.');
        }
        if ($raw !== null) {
            $store = Store::findOrFail((int) $raw);
            if (mb_strtolower($store->city) !== 'honnavar' || $store->status !== StoreStatus::ACTIVE) {
                throw new RuntimeException('The selected branch must be an ACTIVE Honnavar store.');
            }
        }
        return $raw !== null ? (int) $raw : null;
    }

    /** @return array<string, BikeModel> */
    private function approvedModels(bool $required): array
    {
        $models = [];
        foreach (['dio', 'activa', 'access'] as $key) {
            $raw = $this->option($key.'-model-id');
            if ($raw === null) {
                if ($required) {
                    throw new RuntimeException("Approved --{$key}-model-id is required.");
                }
                continue;
            }
            if (! ctype_digit((string) $raw) || (int) $raw < 1) {
                throw new RuntimeException("Invalid catalog ID for {$key}.");
            }
            $model = BikeModel::findOrFail((int) $raw);
            $this->assertModel($model, $key);
            $models[$key] = $model;
        }
        return $models;
    }

    private function assertModel(BikeModel $model, string $key): void
    {
        $expected = self::VEHICLES[$key];
        if (! $model->is_active || ! $model->category_id
            || strcasecmp(trim($model->brand), $expected['brand']) !== 0
            || strcasecmp(trim($model->name), $expected['name']) !== 0) {
            throw new RuntimeException(
                "Catalog for {$key} must be an active {$expected['brand']} {$expected['name']} model with a category. "
                .'Activa STD is NOT silently mapped to Activa 6G.'
            );
        }
    }

    /** @param array<string, BikeModel> $catalog
     *  @return list<array{registration:string,model:string,result:string,location:string,blocked:bool}>
     */
    private function preflight(?int $storeId, array $catalog): array
    {
        $registrations = array_merge(...array_map(
            fn (array $group): array => $group['registrations'], array_values(self::VEHICLES)
        ));
        $existing = Bike::withTrashed()
            ->whereIn('registration_number', $registrations)
            ->get()
            ->groupBy('registration_number');

        $report = [];
        foreach (self::VEHICLES as $key => $group) {
            foreach ($group['registrations'] as $registration) {
                $rows = $existing->get($registration, collect());
                $result = 'MISSING';
                $location = 'not in database';
                $blocked = false;
                if ($rows->count() > 1) {
                    $result = 'DUPLICATE'; $location = 'multiple existing records'; $blocked = true;
                } elseif ($rows->count() === 1) {
                    $bike = $rows->first();
                    $location = "home={$bike->home_store_id}, current={$bike->current_store_id}, status={$bike->status->value}";
                    $correctModel = strcasecmp((string) $bike->brand, $group['brand']) === 0
                        && strcasecmp((string) $bike->model_name, $group['name']) === 0
                        && (! isset($catalog[$key]) || $bike->bike_model_id === $catalog[$key]->id);
                    $correctBranch = $storeId !== null
                        && (int) $bike->home_store_id === $storeId
                        && (int) $bike->current_store_id === $storeId;
                    $blocked = $bike->trashed() || ! $correctModel || ! $correctBranch;
                    $result = $blocked ? 'REVIEW EXISTING' : 'MATCH EXISTING';
                }
                $report[] = [
                    'registration' => $registration,
                    'model' => $group['brand'].' '.$group['name'],
                    'result' => $result,
                    'location' => $location,
                    'blocked' => $blocked,
                ];
            }
        }
        return $report;
    }
}

<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Staff-provided Murudeshwar fleet mapping. Runs as a preview by default.
 * Existing registration identities, bookings, pricing and status are preserved.
 */
class ImportMurudeshwarFleet extends Command
{
    protected $signature = 'bikes:import-murudeshwar
        {--store= : Exact destination store ID (mandatory, never guess based on city)}
        {--apply : Save reviewed new registrations; dry-run by default}';

    protected $description = 'Safely import ten staff-provided Murudeshwar registrations into existing scooter model inventory.';

    private const FLEET = [
        'KA47A8991' => ['Yamaha', 'Fascino 125', 450, 500],
        'KA47A8988' => ['Honda', 'Activa 6G', 400, 500],
        'KA47A8989' => ['Honda', 'Activa 6G', 400, 500],
        'KA47A8999' => ['Yamaha', 'Fascino 125', 450, 500],
        'KA47A9088' => ['Suzuki', 'Access 125', 450, 500],
        'KA47A9089' => ['Suzuki', 'Access 125', 450, 500],
        'KA47A9090' => ['Suzuki', 'Access 125', 450, 500],
        'KA47A9091' => ['Suzuki', 'Access 125', 450, 500],
        'KA47A9092' => ['Honda', 'Activa 6G', 400, 500],
        'KA47A9053' => ['Honda', 'Activa 6G', 400, 500],
    ];

    public function handle(): int
    {
        $storeId = $this->option('store');
        if (! is_string($storeId) || ! preg_match('/^[1-9][0-9]*$/', $storeId)) {
            $this->error('Supply the exact Murudeshwar branch ID, e.g. --store=3. Nothing changed.');
            return self::FAILURE;
        }

        $store = Store::find((int) $storeId);
        if (! $store || $store->status !== StoreStatus::ACTIVE
            || ! str_contains(mb_strtolower($store->city.' '.$store->name), 'murudeshwar')) {
            $this->error('Branch ID must identify an active Murudeshwar store. Nothing changed.');
            return self::FAILURE;
        }

        $category = BikeCategory::query()->whereRaw('LOWER(name) = ?', ['scooter'])->first();
        if (! $category) {
            $this->error('Scooter category missing. Create it in admin first. Nothing changed.');
            return self::FAILURE;
        }

        try {
            // All checks run before writes. During apply they repeat inside one transaction.
            $summary = $this->review((int) $store->id, (int) $category->id);
            $this->table(['Registration', 'Bike model', 'Action'], $summary);
            if (! $this->option('apply')) {
                $this->warn('DRY RUN ONLY. Back up the database and use --apply to save new bikes.');
                return self::SUCCESS;
            }

            DB::transaction(function () use ($store, $category): void {
                $this->review((int) $store->id, (int) $category->id);
                $models = [];
                foreach (self::FLEET as $registration => [$brand, $name, $weekday, $weekend]) {
                    $key = $brand.'|'.$name;
                    if (! isset($models[$key])) {
                        $models[$key] = BikeModel::query()->firstOrCreate([
                            'category_id' => $category->id,
                            'brand' => $brand,
                            'name' => $name,
                            'fuel_type' => FuelType::PETROL->value,
                            'transmission' => Transmission::AUTOMATIC->value,
                        ], ['is_active' => true]);
                        if (! $models[$key]->is_active) {
                            throw new RuntimeException('Catalog model '.$brand.' '.$name.' is inactive.');
                        }
                    }

                    $existing = $this->existingByNormalizedNumber($registration);
                    if ($existing !== null) {
                        continue; // Never change an existing bike, its status, or its bookings.
                    }

                    Bike::create([
                        'category_id' => $category->id,
                        'bike_model_id' => $models[$key]->id,
                        'current_store_id' => $store->id,
                        'home_store_id' => $store->id,
                        'brand' => $brand,
                        'model_name' => $name,
                        'registration_number' => $registration,
                        'fuel_type' => FuelType::PETROL,
                        'transmission' => Transmission::AUTOMATIC,
                        'base_daily_rate_override' => $weekday,
                        'weekend_daily_rate_override' => $weekend,
                        'deposit_amount_override' => 0,
                        'status' => BikeStatus::MAINTENANCE,
                    ]);
                }
            });

            $this->info('Import saved. New vehicles are held in MAINTENANCE until RC, insurance, actual identity and availability are verified in admin.');
            $this->info('Re-run dry-run to check records. Approved branch-specific model rates remain unchanged.');
            return self::SUCCESS;
        } catch (\Throwable $exception) {
            $this->error('No partial import: '.$exception->getMessage());
            return self::FAILURE;
        }
    }

    private function review(int $storeId, int $categoryId): array
    {
        $rows = [];
        foreach (self::FLEET as $registration => [$brand, $name]) {
            $existing = $this->existingByNormalizedNumber($registration);
            if ($existing !== null) {
                if ($existing->trashed()
                    || (int) $existing->current_store_id !== $storeId
                    || (int) $existing->category_id !== $categoryId
                    || mb_strtolower(trim($existing->brand)) !== mb_strtolower($brand)
                    || mb_strtolower(trim($existing->model_name)) !== mb_strtolower($name)
                    || ($existing->bike_model_id !== null && (
                        $existing->bikeModel === null
                        || $existing->bikeModel->brand !== $brand
                        || $existing->bikeModel->name !== $name
                    ))) {
                    throw new RuntimeException('Existing registration conflicts with branch/model: '.$registration);
                }
                $action = 'Already exists — unchanged';
            } else {
                $action = 'Create pending vehicle (maintenance)';
            }
            $rows[] = [$registration, $brand.' '.$name, $action];
        }
        return $rows;
    }

    private function existingByNormalizedNumber(string $registration): ?Bike
    {
        // Allows historic formatting KA 47 A 9088 / KA-47-A-9088
        // without creating a second vehicle record.
        return Bike::withTrashed()
            ->with('bikeModel')
            ->whereRaw("UPPER(REPLACE(REPLACE(registration_number, '-', ''), ' ', '')) = ?", [$registration])
            ->first();
    }
}

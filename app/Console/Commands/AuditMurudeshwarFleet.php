<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\StoreStatus;
use App\Models\Bike;
use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use RuntimeException;
use Throwable;

/**
 * Read-only preflight for ten previously supplied Murudeshwar registrations.
 *
 * The expected grouping is an UNVERIFIED mapping; no RC inspection or physical
 * inspection is performed by this command. It never creates/edits bikes.
 */
final class AuditMurudeshwarFleet extends Command
{
    protected $signature = 'fleet:audit-murudeshwar
        {--store-id= : Explicit active Murudeshwar branch ID; inferred only if exactly one match}
        {--strict : Exit with failure on missing registrations or any review findings}';

    protected $description = 'Read-only Murudeshwar scooter register audit; never changes bikes, branches or models';

    private const GROUPS = [
        'access' => [
            'brand' => 'Suzuki',
            'expected_model' => 'Access 125',
            'plates' => ['KA47A9088', 'KA47A9089', 'KA47A9090', 'KA47A9091'],
        ],
        'activa' => [
            'brand' => 'Honda',
            'expected_model' => 'Activa 6G',
            'plates' => ['KA47A8988', 'KA47A8989', 'KA47A9092', 'KA47A9053'],
        ],
        'fascino' => [
            'brand' => 'Yamaha',
            'expected_model' => 'Fascino 125',
            'plates' => ['KA47A8991', 'KA47A8999'],
        ],
    ];

    public function handle(): int
    {
        $this->info('READ ONLY: no vehicle, branch, catalog or booking changes are performed.');
        $this->warn('Expected model descriptions are supplied mappings, NOT verified from Murudeshwar RCs.');

        try {
            $store = $this->findBranch();
            $this->line("Active Murudeshwar branch ID: {$store->id}");

            $registrations = collect(self::GROUPS)
                ->flatMap(fn (array $group): array => $group['plates'])
                ->all();
            /** @var Collection<string, Collection<int, Bike>> $matches */
            $matches = Bike::withTrashed()
                ->with('bikeModel')
                ->whereIn('registration_number', $registrations)
                ->get()
                ->groupBy('registration_number');

            $missing = 0;
            $review = 0;
            $matched = 0;
            foreach (self::GROUPS as $group) {
                foreach ($group['plates'] as $plate) {
                    $bikes = $matches->get($plate, collect());
                    [$finding, $detail] = $this->finding($bikes, $store, $group);
                    $this->line("{$plate} | {$group['brand']} {$group['expected_model']} (provisional) | {$finding} | {$detail}");
                    if ($finding === 'MISSING') {
                        ++$missing;
                    } elseif ($finding === 'MATCHED_NEEDS_RC_AND_PHYSICAL_CHECK') {
                        ++$matched;
                    } else {
                        ++$review;
                    }
                }
            }

            $this->info("10 expected registrations: {$matched} database matches, {$missing} missing, {$review} flagged for review.");
            $this->warn('Even a matched record must be independently checked against actual RC, insurance, PUC, physical stock and bookability before publication.');

            if ($this->option('strict') && ($missing > 0 || $review > 0)) {
                return self::FAILURE;
            }
            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Audit cannot safely complete: '.$e->getMessage());
            return self::FAILURE;
        }
    }

    private function findBranch(): Store
    {
        $id = $this->option('store-id');
        $query = Store::query()
            ->where('status', StoreStatus::ACTIVE->value)
            ->whereRaw('LOWER(city) = ?', ['murudeshwar']);

        if ($id !== null) {
            if (! ctype_digit((string) $id) || (int) $id < 1) {
                throw new RuntimeException('--store-id must be a positive integer.');
            }
            $query->whereKey((int) $id);
        }
        $branches = $query->get();
        if ($branches->count() !== 1) {
            throw new RuntimeException('Identify exactly one ACTIVE Murudeshwar branch. Use --store-id after checking actual stores.');
        }
        return $branches->first();
    }

    /**
     * @param Collection<int, Bike> $bikes
     * @param array{brand:string,expected_model:string,plates:list<string>} $expected
     * @return array{string,string}
     */
    private function finding(Collection $bikes, Store $branch, array $expected): array
    {
        if ($bikes->isEmpty()) {
            return ['MISSING', 'Do not auto-create; first verify registration and physical vehicle'];
        }
        if ($bikes->count() > 1) {
            return ['DUPLICATE', 'Multiple active/soft-deleted records; reconcile manually'];
        }

        /** @var Bike $bike */
        $bike = $bikes->first();
        $where = "home={$bike->home_store_id}; current={$bike->current_store_id}";
        if ($bike->trashed()) {
            return ['SOFT_DELETED', "{$where}; preserve historical record; do not reimport"];
        }
        if ((int) $bike->home_store_id !== $branch->id || (int) $bike->current_store_id !== $branch->id) {
            return ['WRONG_BRANCH', "{$where}; investigate transfer and open bookings"];
        }
        if (strcasecmp(trim((string) $bike->brand), $expected['brand']) !== 0) {
            return ['BRAND_MISMATCH', "stored brand={$bike->brand}; check RC"];
        }
        if (strcasecmp(trim((string) $bike->model_name), $expected['expected_model']) !== 0) {
            return ['MODEL_VARIANT_UNVERIFIED', "stored model={$bike->model_name}; check RC and catalog"];
        }
        if ($bike->bike_model_id === null || $bike->bikeModel === null) {
            return ['CATALOG_UNLINKED', 'Bike has no valid catalog model; no automatic association'];
        }
        if (strcasecmp(trim((string) $bike->bikeModel->brand), $expected['brand']) !== 0
            || strcasecmp(trim((string) $bike->bikeModel->name), $expected['expected_model']) !== 0
            || $bike->bikeModel->category_id !== $bike->category_id) {
            return ['CATALOG_MISMATCH', 'Catalog brand/model/category disagree with physical bike row'];
        }

        $status = $bike->status?->value ?? (string) $bike->status;
        return ['MATCHED_NEEDS_RC_AND_PHYSICAL_CHECK', "{$where}; status={$status}; never auto-publish"];
    }
}

<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Enums\StoreStatus;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\PickupPoint;
use App\Models\PricingRule;
use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * One-time, reversible-by-backup staging consolidation.
 * The former railway store remains in the database as an inactive legacy record
 * so old bookings and audit logs retain their foreign keys.
 */
class ReconcileCoastalBranches extends Command
{
    protected $signature = 'branches:reconcile-coastal {--apply : Apply after reviewing dry-run and taking a backup}';
    protected $description = 'Consolidate the two Honnavar store records into one active operational branch and create draft pickup points.';

    private const POINTS = [
        1 => [
            ['Honnavar Main Office', 'Palya Main Rd, Honnavar', 'branch-counter'],
            ['Honnavar Railway Station', 'Railway Station Road, Honnavar', 'railway-station'],
            ['Honnavar KSRTC Bus Stand', 'Honnavar, Karnataka', 'ksrtc-bus-stand'],
            ['Honnavar Hotel Delivery (on request)', null, 'hotel-delivery'],
        ],
        3 => [
            ['Murudeshwar Branch Counter', 'Temple Main Road, near KSRTC Bus Stand', 'branch-counter'],
            ['Murudeshwar KSRTC Bus Stand', 'Murudeshwar, Karnataka', 'ksrtc-bus-stand'],
            ['Murudeshwar Railway Station', 'Murudeshwar, Karnataka', 'railway-station'],
            ['Murudeshwar Temple Area', 'Murudeshwar, Karnataka', 'temple-area'],
            ['Murudeshwar Hotel Delivery (on request)', null, 'hotel-delivery'],
        ],
    ];

    public function handle(): int
    {
        try {
            $this->preflight();
            $railway = Store::findOrFail(2);
            $railwayBikes = Bike::where('current_store_id', 2)->orWhere('home_store_id', 2)->count();

            $this->info('Operational branches: Honnavar #1 and Murudeshwar #3.');
            $this->line('Legacy Honnavar Railway Station Hub #2 remains for history, but will be inactive.');
            $this->line('Physical bike rows referencing legacy store #2: '.$railwayBikes);
            $this->line('Active one-way pricing rules to/from #2 will be disabled (not deleted).');
            $this->line('Nine suggested pickup points will be created as DRAFT, not customer bookable.');
            if (! $this->option('apply')) {
                $this->warn('DRY RUN. Database unchanged. Back up staging DB then rerun with --apply.');
                return self::SUCCESS;
            }

            DB::transaction(function (): void {
                $this->preflight();
                // Actual branch contacts and customer-supplied Maps share links.
                Store::whereKey(1)->update([
                    'name' => 'GK WhizWheel Honnavar Branch',
                    'phone' => '+918660989586',
                    'google_maps_url' => 'https://maps.app.goo.gl/xNRYJeqZR6DuqR7a6',
                    'status' => StoreStatus::ACTIVE,
                ]);
                Store::whereKey(3)->update([
                    'name' => 'GK WhizWheel Murudeshwar Branch',
                    'phone' => '+917892094155',
                    'google_maps_url' => 'https://maps.app.goo.gl/DUvVetyLkxzzMP6c8',
                    'status' => StoreStatus::ACTIVE,
                ]);

                // Preserve store #2 primary key for historical reservations, logs and transfers.
                Bike::where('current_store_id', 2)->update(['current_store_id' => 1]);
                Bike::where('home_store_id', 2)->update(['home_store_id' => 1]);
                PricingRule::where('rule_type', \App\Enums\PricingRuleType::ONE_WAY_FEE)
                    ->where(function ($q): void {
                        $q->where('from_store_id', 2)->orWhere('to_store_id', 2);
                    })->update(['is_active' => false]);
                Store::whereKey(2)->update(['status' => StoreStatus::INACTIVE]);
                foreach (self::POINTS as $storeId => $points) {
                    foreach ($points as [$name, $address, $slug]) {
                        PickupPoint::firstOrCreate(
                            ['store_id' => $storeId, 'slug' => $slug],
                            [
                                'name' => $name,
                                'address_line' => $address,
                                'delivery_fee' => 0, // Not an advertised fee until operator confirmation.
                                'is_active' => false,
                                'supports_pickup' => true,
                                'supports_return' => true,
                            ]
                        );
                    }
                }
            });
            $this->info('Applied: two active branches; legacy station retained inactive; candidate points created as drafts.');
            $this->warn('Verify pickup coverage, instructions, delivery charges, and exact coordinates before activating any point.');
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Nothing should be applied on failure: '.$e->getMessage());
            return self::FAILURE;
        }
    }

    private function preflight(): void
    {
        foreach ([1 => 'honnavar', 2 => 'honnavar', 3 => 'murudeshwar'] as $id => $city) {
            $store = Store::find($id);
            if (! $store || mb_strtolower($store->city) !== $city) {
                throw new RuntimeException('Store #'.$id.' did not match the uploaded database. Abort without changes.');
            }
        }
        // No current/forward reservation should refer to the legacy station.
        // Historical bookings keep their existing store IDs for accurate records.
        $blocked = Booking::where(function ($q): void {
                $q->where('pickup_store_id', 2)->orWhere('return_store_id', 2);
            })
            ->whereIn('status', [
                BookingStatus::HELD, BookingStatus::PENDING_PAYMENT,
                BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER,
            ])->exists();
        if ($blocked) {
            throw new RuntimeException('Active bookings use legacy station #2. Reconcile bookings manually before consolidation.');
        }
        // Refuse to move leased inventory without a complete branch/vehicle review.
        if (Bike::where(function ($q): void {
                $q->where('current_store_id', 2)->orWhere('home_store_id', 2);
            })->where('status', \App\Enums\BikeStatus::ON_RENT)->exists()) {
            throw new RuntimeException('A bike assigned to legacy station #2 is currently on rent.');
        }
    }
}

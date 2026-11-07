<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AssignLegacyServiceBranches extends Command
{
    protected $signature = 'services:assign-branch
        {store : Existing destination store ID}
        {--items=* : Explicit legacy service item IDs}
        {--bookings=* : Explicit legacy service booking IDs}
        {--apply : Commit after validating every selected record}';

    protected $description = 'Review and explicitly assign legacy services to a branch (dry-run by default).';

    public function handle(): int
    {
        $storeId = filter_var($this->argument('store'), FILTER_VALIDATE_INT);
        $store = $storeId ? Store::find($storeId) : null;
        if (! $store) {
            $this->error('A valid existing branch ID is required.');
            return self::FAILURE;
        }

        $itemIds = $this->parseIds((array) $this->option('items'));
        $bookingIds = $this->parseIds((array) $this->option('bookings'));
        if ($itemIds === null || $bookingIds === null || ($itemIds === [] && $bookingIds === [])) {
            $this->error('Supply explicit numeric IDs in --items or --bookings (no automatic city inference).');
            return self::FAILURE;
        }

        // Read and validate the entire selection before changing any record.
        return DB::transaction(function () use ($store, $itemIds, $bookingIds): int {
            $items = ServiceItem::whereIn('id', $itemIds)->lockForUpdate()->get()->keyBy('id');
            $bookings = ServiceBooking::whereIn('id', $bookingIds)->lockForUpdate()->get()->keyBy('id');
            if ($items->count() !== count($itemIds) || $bookings->count() !== count($bookingIds)) {
                $this->error('At least one supplied service record does not exist; no changes made.');
                return self::FAILURE;
            }

            foreach ($items as $item) {
                if ($item->store_id !== null && (int) $item->store_id !== (int) $store->id) {
                    $this->error("Item {$item->id} already belongs to a different branch.");
                    return self::FAILURE;
                }
                if (ServiceBooking::where('service_item_id', $item->id)
                    ->whereNotNull('store_id')
                    ->where('store_id', '<>', $store->id)->exists()) {
                    $this->error("Item {$item->id} has bookings assigned elsewhere.");
                    return self::FAILURE;
                }
            }

            foreach ($bookings as $booking) {
                if ($booking->store_id !== null && (int) $booking->store_id !== (int) $store->id) {
                    $this->error("Booking {$booking->id} already belongs to a different branch.");
                    return self::FAILURE;
                }
                if ($booking->service_item_id !== null) {
                    $linked = $items->get($booking->service_item_id)
                        ?? ServiceItem::find($booking->service_item_id);
                    if (! $linked || ($linked->store_id !== null && (int) $linked->store_id !== (int) $store->id)) {
                        $this->error("Booking {$booking->id} references an item owned by another branch or missing.");
                        return self::FAILURE;
                    }
                    if ($linked->store_id === null && ! $items->has($linked->id)) {
                        $this->error("Booking {$booking->id} needs linked item {$linked->id} included in --items.");
                        return self::FAILURE;
                    }
                }
            }

            $this->line("Branch: {$store->name} (#{$store->id}); items: ".count($itemIds).'; bookings: '.count($bookingIds));
            if (! $this->option('apply')) {
                $this->warn('DRY RUN: no changes made. Re-run with --apply after reviewing the IDs.');
                return self::SUCCESS;
            }

            foreach ($items as $item) {
                $item->update(['store_id' => $store->id]);
            }
            foreach ($bookings as $booking) {
                $booking->update(['store_id' => $store->id]);
            }
            $this->info('Explicit branch assignment completed.');
            return self::SUCCESS;
        });
    }

    /** @return array<int, int>|null */
    private function parseIds(array $raw): ?array
    {
        $ids = [];
        foreach ($raw as $value) {
            if (! is_string($value) && ! is_int($value)) {
                return null;
            }
            $id = filter_var($value, FILTER_VALIDATE_INT);
            if ($id === false || $id <= 0) {
                return null;
            }
            $ids[] = (int) $id;
        }
        return array_values(array_unique($ids));
    }
}

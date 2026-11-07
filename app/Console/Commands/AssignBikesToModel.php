<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Bike;
use App\Models\BikeModel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AssignBikesToModel extends Command
{
    protected $signature = 'bikes:assign-model
        {model : Existing bike_models ID}
        {--bike=* : Explicit physical bike IDs (repeat as needed)}
        {--apply : Persist only after reviewing the dry-run output}';

    protected $description = 'Explicitly associate physical bikes with a matching catalog model; dry-run by default.';

    public function handle(): int
    {
        $model = BikeModel::find($this->argument('model'));
        if (! $model) {
            $this->error('Bike model not found.');

            return self::FAILURE;
        }

        $rawIds = $this->option('bike');
        if ($rawIds === []) {
            $this->error('Provide at least one explicit --bike=ID. No bulk auto-matching is performed.');

            return self::FAILURE;
        }
        $ids = [];
        foreach ($rawIds as $raw) {
            if (! preg_match('/^[1-9][0-9]*$/', (string) $raw)) {
                $this->error('Each --bike value must be a positive integer.');

                return self::FAILURE;
            }
            $ids[] = (int) $raw;
        }
        if (count($ids) !== count(array_unique($ids))) {
            $this->error('Duplicate bike IDs supplied.');

            return self::FAILURE;
        }

        $bikes = Bike::query()->whereIn('id', $ids)->orderBy('id')->get();
        if ($bikes->count() !== count($ids)) {
            $this->error('One or more selected bikes do not exist. No changes applied.');

            return self::FAILURE;
        }

        foreach ($bikes as $bike) {
            if ((int) $bike->category_id !== (int) $model->category_id
                || mb_strtolower(trim($bike->brand)) !== mb_strtolower(trim($model->brand))
                || mb_strtolower(trim($bike->model_name)) !== mb_strtolower(trim($model->name))
                || $bike->fuel_type !== $model->fuel_type
                || $bike->transmission !== $model->transmission
                || ($bike->bike_model_id !== null && (int) $bike->bike_model_id !== (int) $model->id)) {
                $this->error('Bike #'.$bike->id.' does not match the catalog identity or already belongs to another model.');

                return self::FAILURE;
            }
        }

        $this->info('Selected '.count($ids).' physical bike(s) for model #'.$model->id.' ('.$model->brand.' '.$model->name.').');
        $this->line('Bike IDs: '.implode(', ', $ids));
        if (! $this->option('apply')) {
            $this->warn('DRY RUN: No changes made. Use --apply after verification.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($model, $ids): void {
            // Revalidate under locks to prevent a concurrent edit between the
            // review and the write.
            $bikes = Bike::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();
            foreach ($bikes as $bike) {
                if ((int) $bike->category_id !== (int) $model->category_id
                    || mb_strtolower(trim($bike->brand)) !== mb_strtolower(trim($model->brand))
                    || mb_strtolower(trim($bike->model_name)) !== mb_strtolower(trim($model->name))
                    || $bike->fuel_type !== $model->fuel_type
                    || $bike->transmission !== $model->transmission
                    || ($bike->bike_model_id !== null && (int) $bike->bike_model_id !== (int) $model->id)) {
                    throw new \Illuminate\Validation\ValidationException(
                        \Illuminate\Validation\Validator::make([], [])
                    );
                }
            }
            foreach ($bikes as $bike) {
                $bike->update(['bike_model_id' => $model->id]);
            }
        });

        $this->info('Assigned '.count($ids).' physical bike(s). Existing bookings remain unchanged.');

        return self::SUCCESS;
    }
}

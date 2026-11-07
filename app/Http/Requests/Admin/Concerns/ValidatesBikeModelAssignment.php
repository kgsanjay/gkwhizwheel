<?php
declare(strict_types=1);

namespace App\Http\Requests\Admin\Concerns;

use App\Models\Bike;
use App\Models\BikeModel;
use Illuminate\Validation\Validator;

trait ValidatesBikeModelAssignment
{
    protected function validateBikeModelAssignment(Validator $validator, ?Bike $bike = null): void
    {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        $id = $this->input('bike_model_id', $bike?->bike_model_id);
        if ($id === null || $id === '') {
            return;
        }

        $model = BikeModel::find($id);
        if (! $model) {
            $validator->errors()->add('bike_model_id', 'Choose an existing catalog model.');

            return;
        }
        if (! $model->is_active && (int) ($bike?->bike_model_id ?? 0) !== $model->id) {
            $validator->errors()->add('bike_model_id', 'This catalog model is inactive.');

            return;
        }

        foreach ([
            'category_id' => $model->category_id,
            'brand' => $model->brand,
            'model_name' => $model->name,
            'fuel_type' => $model->fuel_type->value,
            'transmission' => $model->transmission->value,
        ] as $field => $expected) {
            $actual = $this->input($field);
            if ($actual === null && $bike !== null) {
                $actual = $bike->{$field};
            }
            if ($actual instanceof \BackedEnum) {
                $actual = $actual->value;
            }
            $matches = $field === 'category_id'
                ? (int) $actual === (int) $expected
                : mb_strtolower(trim((string) $actual)) === mb_strtolower(trim((string) $expected));
            if (! $matches) {
                $validator->errors()->add($field, 'This field must match the chosen bike model.');
            }
        }
    }
}

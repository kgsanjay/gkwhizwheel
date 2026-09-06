<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class BikeListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'category_id' => ['nullable', 'integer', 'exists:bike_categories,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'required_with:start_date', 'after_or_equal:start_date'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}

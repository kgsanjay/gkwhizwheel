<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class SyncBatchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if ($user === null) {
            return false;
        }

        if (in_array($user->role, [UserRole::STAFF, UserRole::STORE_MANAGER, UserRole::SUPER_ADMIN], true)) {
            return true;
        }

        try {
            return $user->hasAnyRole(['staff', 'store_manager', 'super_admin', 'admin']);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Prepare data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('items') && ! $this->has('actions')) {
            $this->merge([
                'actions' => $this->input('items'),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'device_id' => ['nullable', 'string', 'max:150'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.idempotency_key' => ['required', 'string', 'max:100'],
            'actions.*.action_type' => ['required', 'string', 'max:100'],
            'actions.*.payload' => ['required', 'array'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'actions.required' => 'An array of queued offline actions is required for batch sync.',
            'actions.*.idempotency_key.required' => 'Every queued action must include an idempotency_key.',
            'actions.*.action_type.required' => 'Every queued action must specify an action_type.',
            'actions.*.payload.required' => 'Every queued action must supply a payload object.',
        ];
    }
}

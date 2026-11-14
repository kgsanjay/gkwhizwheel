<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use App\Enums\StoreStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffRequest extends FormRequest
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

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $targetRole = (string) $this->input('role');
            if (in_array(strtolower($targetRole), ['super_admin', 'superadmin', 'admin', 'store_manager'], true)) {
                abort(403, 'Branch Admin is forbidden from creating Admin or SuperAdmin accounts.');
            }

            $storeIds = (array) $this->input('store_ids', []);
            if (empty($storeIds)) {
                abort(403, 'Branch Admin must assign staff to an owned branch.');
            }

            $accessible = $user->accessibleStoreIds();
            foreach ($storeIds as $sid) {
                if (! in_array((int) $sid, $accessible, true)) {
                    abort(403, 'Branch Admin cannot assign staff to an unassigned branch.');
                }
            }

            return true;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => [
                'required',
                'string',
                Rule::in([
                    UserRole::ADMIN->value,
                    UserRole::STORE_MANAGER->value,
                    UserRole::MANAGER->value,
                    UserRole::STAFF->value,
                ]),
            ],
            'store_ids' => ['nullable', 'array'],
            'store_ids.*' => ['integer', 'distinct', Rule::exists('stores', 'id')->where('status', StoreStatus::ACTIVE->value)],
            'services' => ['nullable', 'array'],
            'services.*' => ['string', Rule::in(['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'])],
        ];
    }
}

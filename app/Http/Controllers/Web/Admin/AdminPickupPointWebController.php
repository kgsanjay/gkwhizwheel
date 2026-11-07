<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\PickupPoint;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPickupPointWebController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

        return Inertia::render('Admin/PickupPoints/Index', [
            'stores' => Store::where('status', StoreStatus::ACTIVE)->orderBy('city')
                ->get(['id', 'name', 'city']),
            'points' => PickupPoint::with('store:id,name,city')->orderBy('store_id')
                ->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $data = $request->validate($this->rules());
        $branch = Store::where('status', StoreStatus::ACTIVE)->findOrFail($data['store_id']);
        $data['slug'] = \Illuminate\Support\Str::slug($data['name']);
        if ($branch->pickupPoints()->where('slug', $data['slug'])->exists()) {
            return back()->withErrors(['name' => 'Pickup point already exists at this branch.']);
        }
        $data['is_active'] = false; // Explicitly verify operational coverage before publishing.
        PickupPoint::create($data);

        return redirect()->route('admin.pickup-points.index')->with('success', 'Pickup point created as draft.');
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $point = PickupPoint::findOrFail($id);
        $data = $request->validate($this->rules());
        Store::where('status', StoreStatus::ACTIVE)->findOrFail($data['store_id']);
        $data['slug'] = \Illuminate\Support\Str::slug($data['name']);
        if (PickupPoint::where('store_id', $data['store_id'])->where('slug', $data['slug'])
            ->whereKeyNot($point->id)->exists()) {
            return back()->withErrors(['name' => 'Pickup point already exists at this branch.']);
        }
        // Status is handled by an explicit, separate publish action.
        unset($data['is_active']);
        $point->update($data);
        return back()->with('success', 'Pickup point updated.');
    }

    public function toggle(int $id, Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $point = PickupPoint::with('store')->findOrFail($id);
        abort_if($point->store->status !== StoreStatus::ACTIVE, 422, 'Branch is inactive.');
        $point->update(['is_active' => ! $point->is_active]);
        return back()->with('success', 'Pickup point publication updated.');
    }

    private function rules(): array
    {
        return [
            'store_id' => ['required', 'integer', Rule::exists('stores', 'id')],
            'name' => ['required', 'string', 'min:3', 'max:160'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'delivery_fee' => ['required', 'numeric', 'between:0,999999.99'],
            'supports_pickup' => ['required', 'boolean'],
            'supports_return' => ['required', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}

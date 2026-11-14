<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\PickupPoint;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPickupPointWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->isSuperAdmin() || $user?->isAdmin(), 403);
        $isSuperAdmin = $user->isSuperAdmin();
        $accessible = $user->accessibleStoreIds();

        return Inertia::render('Admin/PickupPoints/Index', [
            'stores' => Store::where('status', StoreStatus::ACTIVE)
                ->when(! $isSuperAdmin, fn ($q) => $q->whereIn('id', $accessible))
                ->orderBy('city')
                ->get(['id', 'name', 'city']),
            'points' => PickupPoint::with('store:id,name,city')
                ->when(! $isSuperAdmin, fn ($q) => $q->whereIn('store_id', $accessible))
                ->orderBy('store_id')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user?->isSuperAdmin() || $user?->isAdmin(), 403);

        $data = $request->validate($this->rules());

        if (! $user->isSuperAdmin()) {
            abort_unless(in_array((int) $data['store_id'], $user->accessibleStoreIds(), true), 403, 'Cannot create pickup point for an unassigned branch.');
        }

        $branch = Store::where('status', StoreStatus::ACTIVE)->findOrFail($data['store_id']);
        $data['slug'] = Str::slug($data['name']);
        if ($branch->pickupPoints()->where('slug', $data['slug'])->exists()) {
            return back()->withErrors(['name' => 'Pickup point already exists at this branch.']);
        }
        $data['delivery_fee'] = $data['delivery_fee'] ?? 0;
        $data['is_active'] = false; // Explicitly verify operational coverage before publishing.
        PickupPoint::create($data);

        return redirect()->route('admin.pickup-points.index')->with('success', 'Pickup point created as draft.');
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user?->isSuperAdmin() || $user?->isAdmin(), 403);

        $point = PickupPoint::findOrFail($id);
        if (! $user->isSuperAdmin()) {
            abort_unless(in_array((int) $point->store_id, $user->accessibleStoreIds(), true), 403, 'Cannot edit pickup point belonging to another branch.');
        }

        $data = $request->validate($this->rules());
        if (! $user->isSuperAdmin()) {
            abort_unless(in_array((int) $data['store_id'], $user->accessibleStoreIds(), true), 403, 'Cannot reassign pickup point to an unassigned branch.');
        }

        Store::where('status', StoreStatus::ACTIVE)->findOrFail($data['store_id']);
        $data['slug'] = Str::slug($data['name']);
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
        $user = $request->user();
        abort_unless($user?->isSuperAdmin() || $user?->isAdmin(), 403);

        $point = PickupPoint::with('store')->findOrFail($id);
        if (! $user->isSuperAdmin()) {
            abort_unless(in_array((int) $point->store_id, $user->accessibleStoreIds(), true), 403, 'Cannot toggle pickup point belonging to another branch.');
        }

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
            'delivery_fee' => ['nullable', 'numeric', 'between:0,999999.99'],
            'pickup_fee' => ['nullable', 'numeric', 'between:0,999999.99'],
            'return_fee' => ['nullable', 'numeric', 'between:0,999999.99'],
            'supports_pickup' => ['required', 'boolean'],
            'supports_return' => ['required', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}

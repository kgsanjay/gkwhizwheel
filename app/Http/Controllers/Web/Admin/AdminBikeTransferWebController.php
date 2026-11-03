<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\BikeTransfer;
use App\Models\Store;
use App\Services\BikeTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminBikeTransferWebController extends Controller
{
    public function index(Request $request): Response
    {
        $actor = $request->user();
        $this->requireOperationsRole($actor);
        $ids = $actor->role === UserRole::SUPER_ADMIN
            ? null
            : $actor->getAuthorizedStoreIds();

        $query = BikeTransfer::with(['bike', 'fromStore', 'toStore', 'requester', 'approver', 'dispatcher', 'receiver'])
            ->latest('id');

        if ($ids !== null) {
            $query->where(function ($q) use ($ids): void {
                $q->whereIn('from_store_id', $ids)->orWhereIn('to_store_id', $ids);
            });
        }

        $bikes = Bike::query()->where('status', BikeStatus::AVAILABLE)
            ->when($ids !== null, fn ($q) => $q->whereIn('current_store_id', $ids))
            ->orderBy('brand')->orderBy('model_name')
            ->get(['id', 'brand', 'model_name', 'registration_number', 'current_store_id']);

        return Inertia::render('Admin/BikeTransfers/Index', [
            'transfers' => $query->limit(100)->get()->map(fn (BikeTransfer $transfer) => [
                'id' => $transfer->id,
                'bike' => $transfer->bike ? [
                    'id' => $transfer->bike->id,
                    'name' => $transfer->bike->brand.' '.$transfer->bike->model_name,
                ] : null,
                'from_store_id' => $transfer->from_store_id,
                'to_store_id' => $transfer->to_store_id,
                'source' => $transfer->fromStore?->name,
                'destination' => $transfer->toStore?->name,
                'status' => $transfer->status,
                'reason' => $transfer->reason,
                'requested_by' => $transfer->requester?->name,
                'approved_by' => $transfer->approver?->name,
                'dispatched_by' => $transfer->dispatcher?->name,
                'received_by' => $transfer->receiver?->name,
                'created_at' => $transfer->created_at?->toIso8601String(),
                'received_at' => $transfer->received_at?->toIso8601String(),
            ]),
            'bikes' => $bikes,
            'stores' => Store::where('status', StoreStatus::ACTIVE)->orderBy('name')
                ->get(['id', 'name', 'city']),
            'allowed_store_ids' => $ids,
            'is_super_admin' => $actor->role === UserRole::SUPER_ADMIN,
        ]);
    }

    public function store(Request $request, BikeTransferService $service): RedirectResponse
    {
        $this->requireOperationsRole($request->user());
        $data = $request->validate([
            'bike_id' => ['required', 'integer', 'exists:bikes,id'],
            'to_store_id' => ['required', 'integer', 'exists:stores,id'],
            'reason' => ['required', 'string', 'max:1500'],
        ]);
        $service->request($request->user(), $data['bike_id'], $data['to_store_id'], $data['reason']);

        return redirect()->route('admin.bike-transfers.index')->with('success', 'Transfer request created.');
    }

    public function approve(int $id, Request $request, BikeTransferService $service): RedirectResponse
    {
        $service->approve($request->user(), $id);
        return redirect()->route('admin.bike-transfers.index')->with('success', 'Transfer approved.');
    }

    public function dispatch(int $id, Request $request, BikeTransferService $service): RedirectResponse
    {
        $service->dispatch($request->user(), $id);
        return redirect()->route('admin.bike-transfers.index')->with('success', 'Bike dispatched for transfer.');
    }

    public function receive(int $id, Request $request, BikeTransferService $service): RedirectResponse
    {
        $service->receive($request->user(), $id);
        return redirect()->route('admin.bike-transfers.index')->with('success', 'Bike received and branch inventory updated.');
    }

    public function cancel(int $id, Request $request, BikeTransferService $service): RedirectResponse
    {
        $service->cancel($request->user(), $id);
        return redirect()->route('admin.bike-transfers.index')->with('success', 'Transfer cancelled.');
    }

    private function requireOperationsRole($actor): void
    {
        abort_unless($actor && in_array($actor->role, [
            UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF,
        ], true), 403);
    }
}

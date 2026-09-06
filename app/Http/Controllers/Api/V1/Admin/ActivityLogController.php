<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Authorize that the current authenticated user has admin privileges.
     */
    protected function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        $isAuthorized = $user !== null && (
            $user->role === UserRole::SUPER_ADMIN
            || $user->hasRole('super_admin')
            || $user->hasRole('admin')
        );

        if (! $isAuthorized) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }

    /**
     * Display a filterable, paginated audit trail of activity logs.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $query = ActivityLog::query()->with(['user', 'store']);

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', (int) $request->query('store_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%'.$request->query('action').'%');
        }

        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->query('subject_type'));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->query('end_date'));
        }

        $perPage = $request->integer('per_page', 25);
        $logs = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ActivityLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'message' => 'Activity logs retrieved successfully.',
        ]);
    }
}

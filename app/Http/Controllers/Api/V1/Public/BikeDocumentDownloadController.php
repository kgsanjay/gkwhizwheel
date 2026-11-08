<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\BikeDocument;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class BikeDocumentDownloadController extends Controller
{
    /**
     * Download or view a bike document via a verified signed URL.
     * Enforces ownership, booking, and administrative role checks.
     */
    public function __invoke(int $id, Request $request): Response
    {
        $user = $request->user() ?? auth('sanctum')->user();
        abort_unless($user !== null && $user->status === UserStatus::ACTIVE, 403);
        $document = BikeDocument::with('bike')->findOrFail($id);

        if ($user->role !== UserRole::SUPER_ADMIN) {
            if (in_array($user->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
                $storeIds = $user->getAuthorizedStoreIds();
                abort_unless($user->canManageService('two_wheelers') && $document->bike !== null
                    && ($storeIds === null || in_array((int) $document->bike->current_store_id, $storeIds, true)), 403);
            } else {
                // Recheck ownership and current booking status when downloading,
                // so a previously issued signed URL cannot outlive cancellation.
                abort_unless($user->role === UserRole::CUSTOMER && Booking::query()
                    ->where('user_id', $user->id)->where('bike_id', $document->bike_id)
                    ->whereIn('status', [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT,
                        BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER])->exists(), 403);
            }
        }

        abort_unless($document->file_path && Storage::disk('local')->exists($document->file_path), 404);
        return Storage::disk('local')->download($document->file_path, null, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\KycDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class KycDocumentDownloadController extends Controller
{
    /**
     * Download or view a customer KYC document via a verified signed URL.
     * Enforces ownership and administrative role checks.
     */
    public function __invoke(int $id, Request $request): Response
    {
        $document = KycDocument::findOrFail($id);

        $user = $request->user() ?? auth('sanctum')->user();

        if ($user === null) {
            abort(403, 'Authentication is required to access identity documents.');
        }

        {
            $isOwner = (int) $document->user_id === (int) $user->id;
            $isStaffOrAdmin = $user->role === UserRole::SUPER_ADMIN;
            if (in_array($user->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
                $storeIds = $user->getAuthorizedStoreIds();
                $isStaffOrAdmin = $storeIds !== null && \App\Models\Booking::query()
                    ->where('user_id', $document->user_id)
                    ->where(function ($query) use ($storeIds): void {
                        $query->whereIn('pickup_store_id', $storeIds)
                            ->orWhereIn('return_store_id', $storeIds);
                    })->exists();
            }

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'Unauthorized access to KYC document.');
            }
        }

        if ($document->file_path && Storage::disk('local')->exists($document->file_path)) {
            return Storage::disk('local')->download($document->file_path);
        }

        if ($document->file_path && Storage::exists($document->file_path)) {
            return Storage::download($document->file_path);
        }

        // Return JSON document descriptor response for testing/placeholder records
        abort(404, 'KYC document file not found.');
    }
}

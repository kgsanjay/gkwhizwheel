<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\KycDocumentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UploadKycDocumentRequest;
use App\Http\Resources\KycDocumentResource;
use App\Models\KycDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CustomerKycController extends Controller
{
    /**
     * List all KYC documents belonging to the authenticated customer.
     */
    public function index(Request $request): JsonResponse
    {
        $documents = $request->user()->kycDocuments()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => KycDocumentResource::collection($documents),
            'message' => '',
        ]);
    }

    /**
     * Upload a new KYC document (Driving License, National ID, or Passport).
     */
    public function store(UploadKycDocumentRequest $request): JsonResponse
    {
        $user = $request->user();
        $file = $request->file('file');
        $documentType = KycDocumentType::from((string) $request->validated('document_type'));

        // Store file securely in local storage under documents/kyc
        $path = $file->store('documents/kyc');

        // Check if user already uploaded this document type
        $existing = KycDocument::where('user_id', $user->id)
            ->where('document_type', $documentType)
            ->first();

        if ($existing !== null) {
            // Delete old file if exists
            if ($existing->file_path && Storage::exists($existing->file_path)) {
                Storage::delete($existing->file_path);
            }

            $existing->update([
                'file_path' => $path,
                'verified' => false,
                'verified_by' => null,
                'verified_at' => null,
            ]);

            $document = $existing;
        } else {
            $document = KycDocument::create([
                'user_id' => $user->id,
                'document_type' => $documentType,
                'file_path' => $path,
                'verified' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => new KycDocumentResource($document),
            'message' => 'KYC document uploaded successfully.',
        ], 201);
    }
}

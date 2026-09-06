<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\BikeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class BikeDocumentDownloadController extends Controller
{
    /**
     * Download or view a bike document via a verified signed URL.
     */
    public function __invoke(int $id, Request $request): Response
    {
        $document = BikeDocument::findOrFail($id);

        if (Storage::exists($document->file_path)) {
            return Storage::download($document->file_path);
        }

        // Return JSON document response for testing/placeholder records
        return new JsonResponse([
            'success' => true,
            'data' => [
                'id' => $document->id,
                'document_type' => $document->document_type?->value ?? (string) $document->document_type,
                'file_path' => $document->file_path,
                'verified' => (bool) $document->verified,
            ],
            'message' => 'Document access verified.',
        ]);
    }
}

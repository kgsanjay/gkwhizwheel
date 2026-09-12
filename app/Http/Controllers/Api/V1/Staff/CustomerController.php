<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Enums\BookingStatus;
use App\Enums\KycDocumentType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreCustomerRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\KycDocument;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Look up existing customer by phone number (Walk-in Flow Step 1).
     */
    public function lookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $rawPhone = (string) $validated['phone'];

        $cleanPhone = trim($rawPhone);
        $digitsOnly = preg_replace('/[^0-9]/', '', $cleanPhone);
        $last10 = substr($digitsOnly, -10);

        $customer = User::query()
            ->where(function ($query) use ($cleanPhone, $digitsOnly, $last10) {
                $query->where('phone', $cleanPhone)
                    ->orWhere('phone', '+'.ltrim($cleanPhone, '+'))
                    ->orWhere('phone', ltrim($cleanPhone, '+'));

                if (! empty($digitsOnly)) {
                    $query->orWhere('phone', '+'.$digitsOnly)
                        ->orWhere('phone', $digitsOnly);
                }

                if (strlen($last10) === 10) {
                    $query->orWhere('phone', 'like', "%{$last10}");
                }
            })
            ->with(['kycDocuments', 'bookings'])
            ->first();

        if ($customer === null) {
            return response()->json([
                'success' => true,
                'data' => [
                    'found' => false,
                    'customer' => null,
                ],
                'message' => 'Customer not found.',
            ]);
        }

        $isBlacklisted = $customer->status === UserStatus::BLACKLISTED;
        $hasPastDamage = $customer->bookings->contains(fn ($b) => (float) $b->damage_fee_amount > 0);
        $hasPastNoShow = $customer->bookings->contains(fn ($b) => $b->status === BookingStatus::NO_SHOW);

        $bookingSummary = [
            'total_bookings' => $customer->bookings->count(),
            'completed_bookings' => $customer->bookings->where('status', BookingStatus::COMPLETED)->count(),
            'cancelled_bookings' => $customer->bookings->where('status', BookingStatus::CANCELLED)->count(),
            'active_bookings' => $customer->bookings->whereIn('status', [BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER])->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'found' => true,
                'customer' => array_merge((new UserResource($customer))->resolve(), [
                    'is_blacklisted' => $isBlacklisted,
                    'has_past_damage' => $hasPastDamage,
                    'has_past_no_show' => $hasPastNoShow,
                    'booking_summary' => $bookingSummary,
                    'recent_bookings' => BookingResource::collection($customer->bookings->sortByDesc('created_at')->take(5)),
                ]),
            ],
            'message' => 'Customer profile retrieved successfully.',
        ]);
    }

    /**
     * Create new customer + KYC docs in one atomic call (Walk-in Flow).
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = DB::transaction(function () use ($request) {
            $customer = User::create([
                'name' => $request->validated('name'),
                'phone' => $request->validated('phone'),
                'email' => $request->validated('email'),
                'password' => null,
                'role' => UserRole::CUSTOMER,
                'whatsapp_opt_in' => $request->boolean('whatsapp_opt_in', true),
                'status' => UserStatus::ACTIVE,
            ]);

            $docsToProcess = [];

            if ($request->hasFile('driving_license')) {
                $docsToProcess[] = [
                    'type' => KycDocumentType::DRIVING_LICENSE,
                    'file' => $request->file('driving_license'),
                ];
            }

            if ($request->hasFile('national_id')) {
                $docsToProcess[] = [
                    'type' => KycDocumentType::NATIONAL_ID,
                    'file' => $request->file('national_id'),
                ];
            }

            if ($request->hasFile('passport')) {
                $docsToProcess[] = [
                    'type' => KycDocumentType::PASSPORT,
                    'file' => $request->file('passport'),
                ];
            }

            $rawDocuments = $request->all('documents')['documents'] ?? null;
            if (is_array($rawDocuments)) {
                foreach ($rawDocuments as $index => $docItem) {
                    $file = $request->file("documents.{$index}.file");
                    $typeVal = $docItem['document_type'] ?? null;
                    if ($file instanceof UploadedFile && is_string($typeVal)) {
                        $enumType = KycDocumentType::tryFrom($typeVal);
                        if ($enumType !== null) {
                            $docsToProcess[] = [
                                'type' => $enumType,
                                'file' => $file,
                            ];
                        }
                    }
                }
            }

            $createdCount = 0;
            foreach ($docsToProcess as $doc) {
                $path = $doc['file']->store('documents/kyc', 'local');
                KycDocument::create([
                    'user_id' => $customer->id,
                    'document_type' => $doc['type'],
                    'file_path' => $path,
                    'verified' => true,
                    'verified_by' => $request->user()->id,
                    'verified_at' => now(),
                ]);
                $createdCount++;
            }

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'customer_created',
                'subject_type' => User::class,
                'subject_id' => $customer->id,
                'new_values' => [
                    'source' => 'walk_in',
                    'channel' => 'walk_in',
                    'phone' => $customer->phone,
                    'name' => $customer->name,
                    'kyc_documents_count' => $createdCount,
                ],
            ]);

            return $customer->load('kycDocuments');
        });

        return response()->json([
            'success' => true,
            'data' => new UserResource($customer),
            'message' => 'Customer and KYC documents created successfully.',
        ], 201);
    }
}

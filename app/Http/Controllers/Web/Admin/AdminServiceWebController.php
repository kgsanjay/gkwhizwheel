<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceItemCategory;
use App\Models\ServiceItemDocument;
use App\Models\ServiceItemImage;
use App\Models\User;
use App\Notifications\ServiceBookingConfirmedNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminServiceWebController extends Controller
{

    /**
     * Non-superadmins may access only records explicitly owned by assigned branches.
     * Legacy records without store_id remain accessible solely to headquarters.
     */
    private function restrictToAssignedStores(\Illuminate\Database\Eloquent\Builder $query, ?\App\Models\User $user = null): \Illuminate\Database\Eloquent\Builder
    {
        $user ??= request()->user();
        if ($user?->role !== \App\Enums\UserRole::SUPER_ADMIN) {
            $query->whereIn('store_id', $user?->getAuthorizedStoreIds() ?? []);
        }

        return $query;
    }

    private function assertServiceRecordAccess(?int $storeId): void
    {
        $user = request()->user();
        if ($user?->role === \App\Enums\UserRole::SUPER_ADMIN) {
            return;
        }

        abort_unless($storeId !== null && in_array($storeId, $user?->getAuthorizedStoreIds() ?? [], true), 403, 'Service record does not belong to an assigned branch.');
    }

    private function resolveServiceStore(?int $requestedStoreId): ?int
    {
        $user = request()->user();
        if ($user?->role === \App\Enums\UserRole::SUPER_ADMIN) {
            if ($requestedStoreId !== null) {
                abort_unless(\App\Models\Store::whereKey($requestedStoreId)
                    ->where('status', \App\Enums\StoreStatus::ACTIVE->value)->exists(), 422, 'Branch is not active.');
            }
            return $requestedStoreId;
        }

        $authorized = $user?->getAuthorizedStoreIds() ?? [];
        if ($requestedStoreId !== null) {
            abort_unless(in_array($requestedStoreId, $authorized, true), 403, 'Branch is not assigned or active.');
            return $requestedStoreId;
        }

        // Existing admin forms have no branch selector. Infer only where unambiguous.
        abort_unless(count($authorized) === 1, 422, 'Select an assigned branch before creating a service record.');
        return $authorized[0];
    }

    /**
     * Service type metadata definitions
     */
    public const SERVICE_CONFIGS = [
        'two_wheelers' => [
            'slug' => 'two_wheelers',
            'title' => 'Two-Wheeler Rentals',
            'item_label' => 'Bike / Scooter',
            'prefix' => 'BW',
            'units' => ['per_day' => 'Per Day', 'per_hour' => 'Per Hour', 'per_week' => 'Per Week'],
            'categories' => ['Scooter (110cc-125cc)', 'Commuter Bike (150cc)', 'Cruiser (350cc)', 'Adventure Touring', 'Electric Scooter'],
            'suggested_features' => ['2 ISI Helmets Included', 'Phone Mount & USB Charger', 'Tubeless Tyres', 'Well Serviced & Polished', 'Complimentary City Map', 'Unlimited KM Option'],
        ],
        'taxi' => [
            'slug' => 'taxi',
            'title' => 'Taxi & Cab Services',
            'item_label' => 'Cab / Vehicle',
            'prefix' => 'TX',
            'units' => ['per_km' => 'Per KM', 'per_day' => 'Per Day', 'per_trip' => 'Per Trip'],
            'categories' => ['Sedan (Dzire/Etios 4+1)', 'SUV (Ertiga 6+1)', 'Premium MUV (Innova Crysta 7+1)', 'Tempo Traveller (12+1)', 'Luxury EV'],
            'suggested_features' => ['Chilled Dual AC', 'Commercial Yellow Board', 'Experienced Hill & Ghat Driver', 'Luggage Carrier on Roof', 'Fastag Enabled', 'GPS Monitored', 'Bluetooth Music System', 'Clean & Sanitized Daily'],
        ],
        'boating' => [
            'slug' => 'boating',
            'title' => 'Backwater Boating',
            'item_label' => 'Boat / Cruise Package',
            'prefix' => 'BT',
            'units' => ['per_person' => 'Per Person', 'per_trip' => 'Per Trip (Private)', 'per_hour' => 'Per Hour'],
            'categories' => ['Speedboat Safari', 'Sharavathi Shikara Cruise', 'Mangrove Kayaking Trail', 'Sunset Cruise Yacht', 'Houseboat Day Stay'],
            'suggested_features' => ['Life Jackets for All Guests', 'Certified Lifeguard on Board', 'Sharavathi Island Halt', 'Mangrove Bird Watching', 'Free Packaged Drinking Water', 'Surround Music System', 'Safety Briefing Included'],
        ],
        'scuba' => [
            'slug' => 'scuba',
            'title' => 'Netrani Scuba Diving',
            'item_label' => 'Dive Package / Batch',
            'prefix' => 'SC',
            'units' => ['per_dive' => 'Per Dive', 'per_person' => 'Per Person', 'per_session' => 'Per Session'],
            'categories' => ['Introductory Shore Dive', 'Netrani Island Boat Dive', 'PADI Discovery Scuba', 'Snorkeling & Dolphin Safari'],
            'suggested_features' => ['Free 4K Underwater Video & Photos', '1-on-1 PADI Certified Instructor', 'Speedboat Transfer to Netrani', 'Full Scuba Gear & Wetsuit', 'Fresh Fruits & Light Refreshments', 'Non-Swimmers Fully Welcome'],
            'document_types' => [
                'instructor_certification' => [
                    'label' => 'Instructor Certification (PADI / SSI)',
                    'description' => 'Valid dive master or instructor certification credential',
                ],
                'insurance_docs' => [
                    'label' => 'Insurance Documentation',
                    'description' => 'Commercial dive operator liability and accident insurance policy',
                ],
            ],
        ],
        'homestay' => [
            'slug' => 'homestay',
            'title' => 'Coastal Homestays',
            'item_label' => 'Room / Cottage',
            'prefix' => 'HS',
            'units' => ['per_night' => 'Per Night', 'per_day' => 'Per Day', 'per_room' => 'Per Room/Night'],
            'categories' => ['Beachfront Luxury Villa', 'River Heritage Cottage', 'Forest Eco-Stay', 'Deluxe AC Family Suite', 'Cozy Backwater Room'],
            'suggested_features' => ['Direct Beach / Water Access', 'Free High-Speed Wi-Fi', 'Authentic Karavali Homemade Meals', 'Air Conditioned Rooms', '24/7 Hot Water & Power Backup', 'Private Verandah & Garden', 'Campfire & BBQ Facility', 'Secure Car Parking'],
            'document_types' => [
                'fire_safety' => [
                    'label' => 'Fire Safety Certificate / NOC',
                    'description' => 'Fire and emergency services clearance certification',
                ],
                'trade_license' => [
                    'label' => 'Trade License / Gram Panchayat NOC',
                    'description' => 'Official local commercial trade and homestay operating license',
                ],
            ],
        ],
        'guide' => [
            'slug' => 'guide',
            'title' => 'Local Travel Guide',
            'item_label' => 'Guide Profile / Trail',
            'prefix' => 'GD',
            'units' => ['per_trip' => 'Per Trip', 'per_day' => 'Per Day', 'per_hour' => 'Per Hour'],
            'categories' => ['Coastal & Beach Trek Guide', 'Heritage & Temple Specialist', 'Sharavathi Wildlife Trail', 'Photography & Secret Spots Guide'],
            'suggested_features' => ['Govt Approved Certified Guide', 'Fluent in English, Kannada, Hindi', 'Deep Historical & Cultural Knowledge', 'Customized Route According to Group Pace', 'Local Culinary & Shopping Tips', 'First Aid Trained'],
            'document_types' => [
                'govt_guide_license' => [
                    'label' => 'Govt. Tourist Guide License',
                    'description' => 'Ministry of Tourism or Karnataka Tourism approved guide license card',
                ],
            ],
        ],
        'tours' => [
            'slug' => 'tours',
            'title' => 'Karnataka Tour Packages',
            'item_label' => 'Tour Itinerary / Package',
            'prefix' => 'TR',
            'units' => ['per_person' => 'Per Person', 'per_package' => 'Full Package', 'per_couple' => 'Per Couple'],
            'categories' => ['1-Day Honnavar & Murudeshwar', '2-Day Coastal & Jog Falls Circuit', '3-Day Karavali Heritage & Nature', 'Gokarna Beach & Temple Trail'],
            'suggested_features' => ['Dedicated Private AC Cab Included', 'All Tolls, Parking & Driver Bata Paid', 'All Sightseeing Entry Tickets Included', 'Complimentary South Indian Breakfast', 'Dedicated 24/7 Trip Coordinator', 'Zero Hidden Fees Guaranteed'],
        ],
    ];

    /**
     * Get all service configuration definitions.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function getServiceConfigs(): array
    {
        return self::SERVICE_CONFIGS;
    }

    /**
     * Ensure valid service type or abort 404
     */
    public function getServiceConfig(string $serviceType): array
    {
        if (! isset(self::SERVICE_CONFIGS[$serviceType])) {
            abort(404, "Unknown service: {$serviceType}");
        }

        $config = self::SERVICE_CONFIGS[$serviceType];

        // Dynamically load categories from database if available
        $dbCategories = ServiceItemCategory::where('service_type', $serviceType)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('name')
            ->all();

        if (! empty($dbCategories)) {
            $config['categories'] = $dbCategories;
        }

        return $config;
    }

    /**
     * List inventory items for the selected service
     */
    public function items(Request $request, string $serviceType): Response
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $config = $this->getServiceConfig($serviceType);

        $query = $this->restrictToAssignedStores(ServiceItem::where('service_type', $serviceType))
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')]);

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        $items = $query->orderBy('sort_order')->orderBy('name')->paginate(12)->withQueryString();

        $stats = [
            'total' => $this->restrictToAssignedStores(ServiceItem::where('service_type', $serviceType))->count(),
            'available' => $this->restrictToAssignedStores(ServiceItem::where('service_type', $serviceType))->where('status', 'available')->count(),
            'maintenance' => $this->restrictToAssignedStores(ServiceItem::where('service_type', $serviceType))->where('status', 'maintenance')->count(),
        ];

        return Inertia::render('Admin/Services/Items/Index', [
            'serviceConfig' => $config,
            'items' => $items,
            'filters' => $request->only(['search', 'status']),
            'stats' => $stats,
        ]);
    }

    /**
     * Show form to create new service item
     */
    public function createItem(string $serviceType): Response
    {
        $config = $this->getServiceConfig($serviceType);

        return Inertia::render('Admin/Services/Items/Create', [
            'serviceConfig' => $config,
        ]);
    }

    /**
     * Store new service item
     */
    public function storeItem(Request $request, string $serviceType): RedirectResponse
    {
        if ($request->user()?->isManager()) {
            abort(403, 'Managers cannot register new service items.');
        }

        $config = $this->getServiceConfig($serviceType);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price_base' => ['required', 'numeric', 'min:0'],
            'price_unit' => ['required', 'string', 'max:50'],
            'capacity' => ['nullable', 'string', 'max:50'],
            'image_url' => ['nullable', 'url', 'max:500'],
            'primary_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],
            'badge' => ['nullable', 'string', 'max:50'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:100'],
            'status' => ['required', 'string', 'in:available,maintenance,booked,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'documents' => ['nullable', 'array'],
            'documents.*.document_type' => ['required_with:documents', 'string', 'max:100'],
            'documents.*.file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:10240'],
            'documents.*.expiry_date' => ['nullable', 'date'],
            'documents.*.verified' => ['nullable', 'boolean'],
        ]);

        $itemData = collect($validated)->except(['primary_image', 'images', 'primary_image_index', 'documents'])->all();
        $itemData['service_type'] = $serviceType;
        $itemData['store_id'] = $this->resolveServiceStore(isset($validated['store_id']) ? (int) $validated['store_id'] : null);
        $itemData['sort_order'] = $validated['sort_order'] ?? 0;
        $itemData['features'] = $validated['features'] ?? [];

        $item = DB::transaction(function () use ($itemData, $request, $validated) {
            $item = ServiceItem::create($itemData);

            $primarySet = false;
            $sortIndex = 0;

            if ($request->hasFile('primary_image')) {
                $primaryFile = $request->file('primary_image');
                if ($primaryFile instanceof UploadedFile) {
                    $path = $primaryFile->store('services/primary', 'public');
                    ServiceItemImage::create([
                        'service_item_id' => $item->id,
                        'image_path' => $path,
                        'sort_order' => $sortIndex++,
                        'is_primary' => true,
                    ]);
                    $primarySet = true;
                    if (empty($item->image_url)) {
                        $item->update(['image_url' => Storage::disk('public')->url($path)]);
                    }
                }
            }

            if ($request->hasFile('images')) {
                $targetPrimaryIndex = $request->input('primary_image_index');
                foreach ($request->file('images') as $idx => $imageFile) {
                    if ($imageFile instanceof UploadedFile) {
                        $path = $imageFile->store('services/gallery', 'public');
                        $isPrimary = (! $primarySet && $targetPrimaryIndex !== null && (int) $targetPrimaryIndex === $idx)
                            || (! $primarySet && $targetPrimaryIndex === null && $sortIndex === 0 && ! $request->hasFile('primary_image'));

                        if ($isPrimary) {
                            $primarySet = true;
                            if (empty($item->image_url)) {
                                $item->update(['image_url' => Storage::disk('public')->url($path)]);
                            }
                        }

                        ServiceItemImage::create([
                            'service_item_id' => $item->id,
                            'image_path' => $path,
                            'sort_order' => $sortIndex++,
                            'is_primary' => $isPrimary,
                        ]);
                    }
                }
            }

            if (! empty($validated['documents']) && is_array($validated['documents'])) {
                foreach ($validated['documents'] as $docData) {
                    if (isset($docData['file']) && $docData['file'] instanceof UploadedFile) {
                        $path = $docData['file']->store('services/private-documents', 'local');
                        ServiceItemDocument::create([
                            'service_item_id' => $item->id,
                            'document_type' => $docData['document_type'],
                            'file_path' => $path,
                            'expiry_date' => $docData['expiry_date'] ?? null,
                            'verified' => ! empty($docData['verified']),
                            'uploaded_by' => $request->user()?->id,
                        ]);
                    }
                }
            }

            return $item;
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'service_item.created',
            'description' => "Created {$config['item_label']}: {$item->name}",
            'subject_type' => ServiceItem::class,
            'subject_id' => (string) $item->id,
            'metadata' => ['service_type' => $serviceType, 'price' => $item->price_base],
        ]);

        return redirect()->route('admin.services.items.index', $serviceType)
            ->with('success', "{$config['item_label']} '{$item->name}' created successfully.");
    }

    /**
     * Show form to edit existing item
     */
    public function editItem(string $serviceType, int $id): Response
    {
        $config = $this->getServiceConfig($serviceType);
        $item = ServiceItem::where('service_type', $serviceType)
            ->with([
                'images' => fn ($q) => $q->orderBy('sort_order'),
                'documents.uploader:id,name',
            ])
            ->findOrFail($id);
        $this->assertServiceRecordAccess($item->store_id);

        return Inertia::render('Admin/Services/Items/Edit', [
            'serviceConfig' => $config,
            'item' => $item,
        ]);
    }

    /**
     * Update existing service item
     */
    public function updateItem(Request $request, string $serviceType, int $id): RedirectResponse
    {
        $config = $this->getServiceConfig($serviceType);
        $item = ServiceItem::where('service_type', $serviceType)->findOrFail($id);
        $this->assertServiceRecordAccess($item->store_id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price_base' => ['required', 'numeric', 'min:0'],
            'price_unit' => ['required', 'string', 'max:50'],
            'capacity' => ['nullable', 'string', 'max:50'],
            'image_url' => ['nullable', 'url', 'max:500'],
            'primary_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'primary_image_id' => ['nullable', 'integer'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],
            'image_order' => ['nullable', 'array'],
            'image_order.*' => ['integer'],
            'images_meta' => ['nullable', 'array'],
            'images_meta.*.id' => ['required_with:images_meta', 'integer'],
            'images_meta.*.sort_order' => ['nullable', 'integer'],
            'images_meta.*.is_primary' => ['nullable', 'boolean'],
            'delete_image_ids' => ['nullable', 'array'],
            'delete_image_ids.*' => ['integer'],
            'badge' => ['nullable', 'string', 'max:50'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:100'],
            'status' => ['required', 'string', 'in:available,maintenance,booked,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'documents' => ['nullable', 'array'],
            'documents.*.document_type' => ['required_with:documents', 'string', 'max:100'],
            'documents.*.file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:10240'],
            'documents.*.expiry_date' => ['nullable', 'date'],
            'documents.*.verified' => ['nullable', 'boolean'],
            'delete_document_ids' => ['nullable', 'array'],
            'delete_document_ids.*' => ['integer'],
        ]);

        if ($request->user()?->isManager() && isset($validated['price_base']) && round((float) $validated['price_base'], 2) !== round((float) $item->price_base, 2)) {
            abort(403, 'Managers cannot alter service base price.');
        }

        $itemData = collect($validated)->except([
            'primary_image', 'images', 'primary_image_id', 'primary_image_index',
            'image_order', 'images_meta', 'delete_image_ids', 'documents', 'delete_document_ids',
        ])->all();

        $itemData['store_id'] = $this->resolveServiceStore(isset($validated['store_id']) ? (int) $validated['store_id'] : $item->store_id);
        DB::transaction(function () use ($item, $itemData, $validated, $request) {
            $item->update($itemData);

            // 1. Delete requested images
            if (! empty($validated['delete_image_ids'])) {
                $imagesToDelete = ServiceItemImage::where('service_item_id', $item->id)
                    ->whereIn('id', $validated['delete_image_ids'])
                    ->get();
                foreach ($imagesToDelete as $delImg) {
                    Storage::disk('public')->delete($delImg->image_path);
                    $delImg->delete();
                }
            }

            // 2. Reorder existing images via image_order array (list of IDs)
            if (! empty($validated['image_order'])) {
                foreach ($validated['image_order'] as $orderIndex => $imgId) {
                    ServiceItemImage::where('service_item_id', $item->id)
                        ->where('id', (int) $imgId)
                        ->update(['sort_order' => $orderIndex]);
                }
            }

            // 2b. Reorder / meta update via images_meta (id, sort_order, is_primary)
            if (! empty($validated['images_meta'])) {
                foreach ($validated['images_meta'] as $meta) {
                    $img = ServiceItemImage::where('service_item_id', $item->id)
                        ->where('id', (int) $meta['id'])
                        ->first();
                    if ($img) {
                        $updates = [];
                        if (isset($meta['sort_order'])) {
                            $updates['sort_order'] = (int) $meta['sort_order'];
                        }
                        if (isset($meta['is_primary'])) {
                            $updates['is_primary'] = (bool) $meta['is_primary'];
                            if ($meta['is_primary']) {
                                ServiceItemImage::where('service_item_id', $item->id)
                                    ->where('id', '!=', $img->id)
                                    ->update(['is_primary' => false]);
                                if (empty($item->image_url)) {
                                    $item->update(['image_url' => Storage::disk('public')->url($img->image_path)]);
                                }
                            }
                        }
                        if (! empty($updates)) {
                            $img->update($updates);
                        }
                    }
                }
            }

            // Track current max sort order
            $currentMaxSort = (int) (ServiceItemImage::where('service_item_id', $item->id)->max('sort_order') ?? -1);

            // 3. Upload new primary_image if supplied
            if ($request->hasFile('primary_image')) {
                $file = $request->file('primary_image');
                if ($file instanceof UploadedFile) {
                    ServiceItemImage::where('service_item_id', $item->id)->update(['is_primary' => false]);
                    $path = $file->store('services/primary', 'public');
                    $newImg = ServiceItemImage::create([
                        'service_item_id' => $item->id,
                        'image_path' => $path,
                        'sort_order' => ++$currentMaxSort,
                        'is_primary' => true,
                    ]);
                    if (empty($item->image_url)) {
                        $item->update(['image_url' => Storage::disk('public')->url($path)]);
                    }
                }
            }

            // 4. Upload new gallery images
            if ($request->hasFile('images')) {
                $targetPrimaryIndex = $request->input('primary_image_index');
                foreach ($request->file('images') as $idx => $imageFile) {
                    if ($imageFile instanceof UploadedFile) {
                        $path = $imageFile->store('services/gallery', 'public');
                        $isPrimary = ($targetPrimaryIndex !== null && (int) $targetPrimaryIndex === $idx);

                        if ($isPrimary) {
                            ServiceItemImage::where('service_item_id', $item->id)->update(['is_primary' => false]);
                            if (empty($item->image_url)) {
                                $item->update(['image_url' => Storage::disk('public')->url($path)]);
                            }
                        }

                        ServiceItemImage::create([
                            'service_item_id' => $item->id,
                            'image_path' => $path,
                            'sort_order' => ++$currentMaxSort,
                            'is_primary' => $isPrimary,
                        ]);
                    }
                }
            }

            // 5. Explicitly set an existing image as primary by ID
            if (! empty($validated['primary_image_id'])) {
                $primaryImg = ServiceItemImage::where('service_item_id', $item->id)
                    ->where('id', (int) $validated['primary_image_id'])
                    ->first();
                if ($primaryImg) {
                    ServiceItemImage::where('service_item_id', $item->id)->update(['is_primary' => false]);
                    $primaryImg->update(['is_primary' => true]);

                    if (empty($item->image_url)) {
                        $item->update(['image_url' => Storage::disk('public')->url($primaryImg->image_path)]);
                    }
                }
            }

            // 6. Delete requested documents
            if (! empty($validated['delete_document_ids'])) {
                $docsToDelete = ServiceItemDocument::where('service_item_id', $item->id)
                    ->whereIn('id', $validated['delete_document_ids'])
                    ->get();
                foreach ($docsToDelete as $delDoc) {
                    $delDoc->deleteStoredFile();
                    $delDoc->delete();
                }
            }

            // 7. Create or update documents
            if (! empty($validated['documents']) && is_array($validated['documents'])) {
                foreach ($validated['documents'] as $docData) {
                    $docType = $docData['document_type'] ?? null;
                    if (! $docType) {
                        continue;
                    }

                    $existingDoc = ServiceItemDocument::where('service_item_id', $item->id)
                        ->where('document_type', $docType)
                        ->first();

                    $payload = [];
                    if (array_key_exists('expiry_date', $docData)) {
                        $payload['expiry_date'] = $docData['expiry_date'] ?: null;
                    }
                    if (array_key_exists('verified', $docData)) {
                        $payload['verified'] = (bool) $docData['verified'];
                    }

                    if (isset($docData['file']) && $docData['file'] instanceof UploadedFile) {
                        if ($existingDoc) {
                            $existingDoc->deleteStoredFile();
                        }
                        $path = $docData['file']->store('services/private-documents', 'local');
                        $payload['file_path'] = $path;
                        $payload['uploaded_by'] = $request->user()?->id;
                    }

                    if ($existingDoc) {
                        if (! empty($payload)) {
                            $existingDoc->update($payload);
                        }
                    } elseif (isset($payload['file_path'])) {
                        ServiceItemDocument::create(array_merge([
                            'service_item_id' => $item->id,
                            'document_type' => $docType,
                            'uploaded_by' => $request->user()?->id,
                            'verified' => ! empty($docData['verified']),
                        ], $payload));
                    }
                }
            }
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'service_item.updated',
            'description' => "Updated {$config['item_label']}: {$item->name}",
            'subject_type' => ServiceItem::class,
            'subject_id' => (string) $item->id,
            'metadata' => ['service_type' => $serviceType],
        ]);

        return redirect()->route('admin.services.items.index', $serviceType)
            ->with('success', "{$config['item_label']} updated successfully.");
    }

    /**
     * Delete service item
     */
    public function destroyItem(Request $request, string $serviceType, int $id): RedirectResponse
    {
        $config = $this->getServiceConfig($serviceType);
        $item = ServiceItem::where('service_type', $serviceType)
            ->with(['images', 'documents'])
            ->findOrFail($id);
        $this->assertServiceRecordAccess($item->store_id);
        $name = $item->name;

        DB::transaction(function () use ($item) {
            foreach ($item->images as $image) {
                Storage::disk('public')->delete($image->image_path);
            }
            foreach ($item->documents as $doc) {
                $doc->deleteStoredFile();
            }
            $item->delete();
        });

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'service_item.deleted',
            'description' => "Deleted {$config['item_label']}: {$name}",
            'subject_type' => ServiceItem::class,
            'subject_id' => (string) $id,
        ]);

        return redirect()->route('admin.services.items.index', $serviceType)
            ->with('success', "{$config['item_label']} '{$name}' deleted.");
    }

    /** Download private compliance files through the existing service/branch boundary. */
    public function downloadDocument(Request $request, string $serviceType, int $itemId, int $documentId): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless($request->user()?->status === \App\Enums\UserStatus::ACTIVE, 403);
        $item = ServiceItem::where('service_type', $serviceType)->findOrFail($itemId);
        $this->assertServiceRecordAccess($item->store_id);
        $doc = ServiceItemDocument::where('service_item_id', $item->id)->findOrFail($documentId);
        abort_unless($doc->usesPrivateStorage() && Storage::disk('local')->exists($doc->file_path), 404);
        return Storage::disk('local')->download($doc->file_path, null, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Delete an uploaded document from a service item
     */
    public function destroyDocument(Request $request, string $serviceType, int $itemId, int $documentId): RedirectResponse
    {
        $item = ServiceItem::where('service_type', $serviceType)->findOrFail($itemId);
        $this->assertServiceRecordAccess($item->store_id);
        $doc = ServiceItemDocument::where('service_item_id', $item->id)->findOrFail($documentId);

        $doc->deleteStoredFile();
        $doc->delete();

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'service_item_document.deleted',
            'description' => "Deleted document '{$doc->document_type}' from {$item->name}",
            'subject_type' => ServiceItem::class,
            'subject_id' => (string) $item->id,
            'metadata' => ['service_type' => $serviceType, 'document_type' => $doc->document_type],
        ]);

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }

    /**
     * List bookings for the selected service
     */
    public function bookings(Request $request, string $serviceType): Response
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:50'],
            'channel' => ['nullable', 'string', 'max:50'],
        ]);

        $config = $this->getServiceConfig($serviceType);

        $query = $this->restrictToAssignedStores(ServiceBooking::with(['serviceItem', 'creator'])
            ->where('service_type', $serviceType));

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('booking_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('channel') && $request->query('channel') !== 'all') {
            $query->where('booking_channel', (string) $request->query('channel'));
        }

        $bookings = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        $stats = [
            'total' => $this->restrictToAssignedStores(ServiceBooking::where('service_type', $serviceType))->count(),
            'confirmed' => $this->restrictToAssignedStores(ServiceBooking::where('service_type', $serviceType))->where('status', 'confirmed')->count(),
            'in_progress' => $this->restrictToAssignedStores(ServiceBooking::where('service_type', $serviceType))->where('status', 'in_progress')->count(),
            'completed' => $this->restrictToAssignedStores(ServiceBooking::where('service_type', $serviceType))->where('status', 'completed')->count(),
            'revenue' => $this->restrictToAssignedStores(ServiceBooking::where('service_type', $serviceType))->whereIn('payment_status', ['partial', 'paid'])->sum('advance_paid'),
        ];

        return Inertia::render('Admin/Services/Bookings/Index', [
            'serviceConfig' => $config,
            'bookings' => $bookings,
            'filters' => $request->only(['search', 'status', 'channel']),
            'stats' => $stats,
        ]);
    }

    /**
     * Show offline / walk-in booking creation form
     */
    public function createBooking(string $serviceType): Response
    {
        $config = $this->getServiceConfig($serviceType);

        $items = $this->restrictToAssignedStores(ServiceItem::where('service_type', $serviceType))
            ->where('status', 'available')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Services/Bookings/Create', [
            'serviceConfig' => $config,
            'items' => $items,
        ]);
    }

    /**
     * Store offline walk-in / phone booking created by Admin or Staff
     */
    public function storeBooking(Request $request, string $serviceType): RedirectResponse
    {
        $config = $this->getServiceConfig($serviceType);

        $validated = $request->validate([
            'service_item_id' => ['nullable', 'exists:service_items,id'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'regex:/^[6-9]\d{9}$/'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'booking_channel' => ['required', 'string', 'in:offline_walkin,offline_phone'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'drop_location' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'base_amount' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'advance_paid' => ['required', 'numeric', 'min:0', 'max:0'],
            'payment_method' => ['required', 'string', 'in:cash,upi,card,pay_on_arrival,online'],
            'status' => ['required', 'string', 'in:held'],
            'customer_notes' => ['nullable', 'string'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        $item = ! empty($validated['service_item_id']) ? ServiceItem::findOrFail($validated['service_item_id']) : null;
        if ($item !== null) {
            abort_unless($item->service_type === $serviceType, 422, 'Incorrect service type.');
            $this->assertServiceRecordAccess($item->store_id);
        }
        $storeId = $this->resolveServiceStore(isset($validated['store_id']) ? (int) $validated['store_id'] : $item?->store_id);
        abort_unless($storeId !== null, 422, 'Select an active branch for a new service booking.');
        if ($item !== null && $item->store_id !== $storeId) {
            abort(422, 'Service item must belong to the booking branch.');
        }
        // Unassigned inventory cannot be used in branch-originated bookings.
        if ($item === null && request()->user()?->role !== \App\Enums\UserRole::SUPER_ADMIN) {
            abort(422, 'Select an inventory item assigned to your branch.');
        }

        $prefix = $config['prefix'];
        $dateCode = Carbon::now()->format('ymd');
        $randomCode = strtoupper(Str::random(4));
        $bookingNumber = "GKW-{$prefix}-{$dateCode}-{$randomCode}";

        $total = max(0, (float) $validated['base_amount'] - (float) ($validated['discount_amount'] ?? 0));
        $advance = (float) $validated['advance_paid'];
        $balance = max(0, $total - $advance);

        $paymentStatus = 'pending';
        if ($advance >= $total && $total > 0) {
            $paymentStatus = 'paid';
        } elseif ($advance > 0) {
            $paymentStatus = 'partial';
        }

        $availabilityService = app(\App\Services\AvailabilityService::class);
        try {
            $booking = $availabilityService->holdServiceBooking([
                'booking_number' => $bookingNumber,
                'store_id' => $storeId,
                'service_type' => $serviceType,
                'service_item_id' => $validated['service_item_id'] ?? null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'booking_channel' => $validated['booking_channel'],
                'start_datetime' => $validated['start_datetime'],
                'end_datetime' => $validated['end_datetime'] ?? null,
                'pickup_location' => $validated['pickup_location'] ?? 'Palya Main Rd Hub, Honnavar',
                'drop_location' => $validated['drop_location'] ?? null,
                'quantity' => $validated['quantity'],
                'base_amount' => $validated['base_amount'],
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'total_amount' => $total,
                'advance_paid' => $advance,
                'balance_due' => $balance,
                'payment_status' => $paymentStatus,
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'],
                'customer_notes' => $validated['customer_notes'] ?? null,
                'admin_notes' => $validated['admin_notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);
        } catch (\App\Exceptions\ServiceItemNotAvailableException $e) {
            return back()->withInput()->withErrors(['service_item_id' => $e->getMessage()])->with('error', $e->getMessage());
        }

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'service_booking.offline_created',
            'description' => "Created offline {$config['title']} booking {$bookingNumber} for {$booking->customer_name}",
            'subject_type' => ServiceBooking::class,
            'subject_id' => (string) $booking->id,
            'metadata' => [
                'total_amount' => $total,
                'advance_paid' => $advance,
                'channel' => $validated['booking_channel'],
            ],
        ]);

        return redirect()->route('admin.services.bookings.index', $serviceType)
            ->with('success', "Offline booking #{$bookingNumber} saved as an unpaid hold for resource approval.");
    }

    /**
     * Show booking details & manage operations
     */
    public function showBooking(string $serviceType, int $id): Response
    {
        $config = $this->getServiceConfig($serviceType);

        $booking = ServiceBooking::with(['serviceItem', 'creator', 'user'])
            ->where('service_type', $serviceType)
            ->findOrFail($id);
        $this->assertServiceRecordAccess($booking->store_id);

        return Inertia::render('Admin/Services/Bookings/Show', [
            'serviceConfig' => $config,
            'booking' => $booking,
            'approvalReview' => $booking->store_id !== null && in_array(auth()->user()->role, [\App\Enums\UserRole::SUPER_ADMIN, \App\Enums\UserRole::STORE_MANAGER], true)
                ? app(\App\Services\ServiceBookingApproval::class)->review($booking, auth()->user()) : null,
            'allowedStatuses' => $booking->service_type === 'taxi' && in_array($booking->status, ['confirmed', 'in_progress'], true)
                ? [] : array_values(array_diff(app(\App\Services\ServiceBookingLifecycle::class)->allowed($booking->status), ['confirmed', 'expired'])),
        ]);
    }

    /**
     * Update booking status
     */
    public function updateBookingStatus(Request $request, string $serviceType, int $id): RedirectResponse
    {
        ServiceBooking::where('service_type', $serviceType)->findOrFail($id);
        $data = $request->validate([
            'status' => ['required', 'in:confirmed,in_progress,completed,cancelled'],
            'admin_notes' => ['nullable', 'string', 'max:1200'],
        ]);
        app(\App\Services\ServiceBookingApproval::class)->transition(
            $id, $request->user(), $data['status'], $data['admin_notes'] ?? null
        );
        return back()->with('success', 'Service booking state updated.');
    }

    /**
     * Record cash/UPI payment collection against balance due
     */
    public function recordPayment(Request $request, string $serviceType, int $id): RedirectResponse
    {
        $this->getServiceConfig($serviceType);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'decimal:0,2', 'min:1'],
            'payment_method' => ['required', 'string', 'in:cash,upi,card'],
            'notes' => ['nullable', 'string'],
        ]);

        // Lock the booking while validating the outstanding balance so two
        // simultaneous cashier requests cannot both spend the same balance.
        $newBalance = DB::transaction(function () use ($request, $serviceType, $id, $validated): float {
            $booking = ServiceBooking::where('service_type', $serviceType)
                ->whereKey($id)->lockForUpdate()->firstOrFail();
            $this->assertServiceRecordAccess($booking->store_id);

            if (! in_array($booking->status, ['confirmed', 'in_progress'], true)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => 'Payment collection requires a confirmed or in-progress service booking.',
                ]);
            }

            $amount = (float) $validated['amount'];
            $outstanding = round(max(0, (float) $booking->total_amount - (float) $booking->advance_paid), 2);
            if ($amount > $outstanding) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => 'Payment cannot exceed the outstanding booking balance.',
                ]);
            }

            $newAdvance = round((float) $booking->advance_paid + $amount, 2);
            $balance = round(max(0, (float) $booking->total_amount - $newAdvance), 2);
            $bookingNotes = $booking->admin_notes ? $booking->admin_notes . "\n" : '';
            $bookingNotes .= "[" . Carbon::now()->format('d M H:i') . "] Collected ₹{$amount} via {$validated['payment_method']}. " . ($validated['notes'] ?? '');

            $booking->update([
                'advance_paid' => $newAdvance,
                'balance_due' => $balance,
                'payment_status' => $balance <= 0 ? 'paid' : 'partial',
                'admin_notes' => $bookingNotes,
            ]);

            ActivityLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'service_booking.payment_collected',
                'description' => "Collected ₹{$amount} for {$booking->booking_number} via {$validated['payment_method']}",
                'subject_type' => ServiceBooking::class,
                'subject_id' => (string) $booking->id,
            ]);

            return $balance;
        });

        return back()->with('success', "Payment of ₹{$validated['amount']} recorded successfully. Balance: ₹{$newBalance}.");
    }

    /**
     * Download official PDF travel voucher / pass for service booking
     */
    public function downloadVoucher(Request $request, string $serviceType, int $id, \App\Services\VoucherService $voucherService): \Illuminate\Http\Response
    {
        $request->validate([
            'stream' => ['nullable', 'boolean'],
        ]);

        $this->getServiceConfig($serviceType);

        $booking = ServiceBooking::with(['serviceItem'])
            ->where('service_type', $serviceType)
            ->findOrFail($id);
        $this->assertServiceRecordAccess($booking->store_id);

        return $voucherService->generateServiceVoucherPdf($booking, $request->boolean('stream'));
    }
}

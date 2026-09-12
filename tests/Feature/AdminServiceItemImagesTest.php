<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceItem;
use App\Models\ServiceItemImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');

    $this->superAdmin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin_images@gkwhizwheel.com',
        'phone' => '9876500001',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('admin can create service item with primary_image and multiple gallery images', function () {
    $primaryFile = UploadedFile::fake()->image('boat_primary.jpg', 800, 600);
    $gallery1 = UploadedFile::fake()->image('gallery1.jpg', 800, 600);
    $gallery2 = UploadedFile::fake()->image('gallery2.jpg', 800, 600);

    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.services.items.store', 'boating'), [
            'name' => 'Sharavathi Deluxe Cruise',
            'category' => 'Cruises',
            'description' => 'Luxury estuary cruise',
            'price_base' => 1500,
            'price_unit' => 'per_trip',
            'capacity' => '8 Persons',
            'status' => 'available',
            'sort_order' => 1,
            'primary_image' => $primaryFile,
            'images' => [$gallery1, $gallery2],
        ]);

    $response->assertRedirect(route('admin.services.items.index', 'boating'));
    $response->assertSessionHas('success');

    $item = ServiceItem::where('name', 'Sharavathi Deluxe Cruise')->firstOrFail();
    expect($item->images)->toHaveCount(3);

    $primary = $item->images->where('is_primary', true)->first();
    expect($primary)->not->toBeNull();
    expect($primary->sort_order)->toBe(0);
    Storage::disk('public')->assertExists($primary->image_path);

    $galleryImages = $item->images->where('is_primary', false)->values();
    expect($galleryImages)->toHaveCount(2);
    expect($galleryImages[0]->sort_order)->toBe(1);
    expect($galleryImages[1]->sort_order)->toBe(2);
    Storage::disk('public')->assertExists($galleryImages[0]->image_path);
    Storage::disk('public')->assertExists($galleryImages[1]->image_path);
});

test('admin can update service item: set new primary image, reorder, delete images, and add new ones', function () {
    $item = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Innova Crysta Luxury',
        'category' => 'Premium MUV',
        'price_base' => 3500,
        'price_unit' => 'per_day',
        'capacity' => '7+1',
        'status' => 'available',
        'sort_order' => 0,
    ]);

    $img1 = ServiceItemImage::create([
        'service_item_id' => $item->id,
        'image_path' => 'services/gallery/innova1.jpg',
        'sort_order' => 0,
        'is_primary' => true,
    ]);
    $img2 = ServiceItemImage::create([
        'service_item_id' => $item->id,
        'image_path' => 'services/gallery/innova2.jpg',
        'sort_order' => 1,
        'is_primary' => false,
    ]);
    $img3 = ServiceItemImage::create([
        'service_item_id' => $item->id,
        'image_path' => 'services/gallery/innova3.jpg',
        'sort_order' => 2,
        'is_primary' => false,
    ]);

    Storage::disk('public')->put($img1->image_path, 'fake content 1');
    Storage::disk('public')->put($img2->image_path, 'fake content 2');
    Storage::disk('public')->put($img3->image_path, 'fake content 3');

    $newGallery = UploadedFile::fake()->image('innova_new.jpg');

    // Reorder: set img2 as primary and first, delete img3, and add new gallery image
    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.services.items.update', ['serviceType' => 'taxi', 'id' => $item->id]), [
            'name' => 'Innova Crysta Luxury 2026',
            'price_base' => 3800,
            'price_unit' => 'per_day',
            'status' => 'available',
            'primary_image_id' => $img2->id,
            'image_order' => [$img2->id, $img1->id],
            'delete_image_ids' => [$img3->id],
            'images' => [$newGallery],
        ]);

    $response->assertRedirect(route('admin.services.items.index', 'taxi'));

    // Verify img3 is deleted from DB and storage
    expect(ServiceItemImage::where('id', $img3->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($img3->image_path);

    // Refresh img1 and img2
    $img1->refresh();
    $img2->refresh();

    expect($img2->is_primary)->toBeTrue();
    expect($img2->sort_order)->toBe(0);

    expect($img1->is_primary)->toBeFalse();
    expect($img1->sort_order)->toBe(1);

    // Verify newly uploaded gallery image exists
    $newImages = ServiceItemImage::where('service_item_id', $item->id)->get();
    expect($newImages)->toHaveCount(3); // img2, img1, and the newly added image
});

test('destroyItem deletes all associated service item image files from public storage', function () {
    $item = ServiceItem::create([
        'service_type' => 'scuba',
        'name' => 'Netrani Deep Sea Dive',
        'category' => 'Scuba',
        'price_base' => 4500,
        'price_unit' => 'per_person',
        'status' => 'available',
    ]);

    $img1 = ServiceItemImage::create([
        'service_item_id' => $item->id,
        'image_path' => 'services/gallery/scuba1.jpg',
        'sort_order' => 0,
        'is_primary' => true,
    ]);
    $img2 = ServiceItemImage::create([
        'service_item_id' => $item->id,
        'image_path' => 'services/gallery/scuba2.jpg',
        'sort_order' => 1,
        'is_primary' => false,
    ]);

    Storage::disk('public')->put($img1->image_path, 'fake scuba 1');
    Storage::disk('public')->put($img2->image_path, 'fake scuba 2');

    $response = $this->actingAs($this->superAdmin)
        ->delete(route('admin.services.items.destroy', ['serviceType' => 'scuba', 'id' => $item->id]));

    $response->assertRedirect();
    expect(ServiceItem::where('id', $item->id)->exists())->toBeFalse();
    expect(ServiceItemImage::where('service_item_id', $item->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($img1->image_path);
    Storage::disk('public')->assertMissing($img2->image_path);
});

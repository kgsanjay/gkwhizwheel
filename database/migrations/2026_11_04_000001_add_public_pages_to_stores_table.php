<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table): void {
            $table->string('slug', 160)->nullable()->unique();
            $table->string('public_name', 160)->nullable();
            $table->string('hero_image_url', 2048)->nullable();
            $table->text('public_description')->nullable();
            $table->text('pickup_instructions')->nullable();
            $table->string('seo_title', 160)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->string('publication_status', 20)->default('draft')->index();
            $table->timestamp('published_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table): void {
            $table->dropUnique(['slug']);
            $table->dropIndex(['publication_status']);
            $table->dropColumn([
                'slug', 'public_name', 'hero_image_url', 'public_description',
                'pickup_instructions', 'seo_title', 'seo_description',
                'publication_status', 'published_at',
            ]);
        });
    }
};

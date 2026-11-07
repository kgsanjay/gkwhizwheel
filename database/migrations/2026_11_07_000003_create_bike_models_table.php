<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bike_models', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('category_id')->constrained('bike_categories')->restrictOnDelete();
            $table->string('brand', 100);
            $table->string('name', 100);
            $table->string('fuel_type', 20);
            $table->string('transmission', 20);
            $table->text('description')->nullable();
            $table->string('primary_image_path', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['category_id', 'brand', 'name', 'fuel_type', 'transmission'],
                'bike_models_exact_identity_unique'
            );
        });

        Schema::table('bikes', function (Blueprint $table): void {
            // Nullable while existing vehicles are reconciled; no automatic
            // category/brand/model guesses during migration.
            $table->foreignId('bike_model_id')->nullable()
                ->constrained('bike_models')->nullOnDelete();
            $table->index(['bike_model_id', 'current_store_id', 'status'], 'bikes_model_store_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('bikes', function (Blueprint $table): void {
            $table->dropIndex('bikes_model_store_status_idx');
            $table->dropConstrainedForeignId('bike_model_id');
        });

        Schema::dropIfExists('bike_models');
    }
};

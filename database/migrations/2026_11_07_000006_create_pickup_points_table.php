<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pickup_points', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->string('name', 160);
            $table->string('slug', 160);
            $table->string('address_line', 255)->nullable();
            $table->string('landmark', 255)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->boolean('supports_pickup')->default(true);
            $table->boolean('supports_return')->default(true);
            $table->boolean('is_active')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['store_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pickup_points');
    }
};

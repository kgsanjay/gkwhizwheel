<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bikes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('bike_categories');
            $table->foreignId('current_store_id')->constrained('stores');
            $table->foreignId('home_store_id')->constrained('stores');
            $table->string('brand', 100);
            $table->string('model_name', 100);
            $table->string('registration_number', 30)->unique();
            $table->enum('fuel_type', ['petrol', 'electric']);
            $table->enum('transmission', ['manual', 'automatic']);
            $table->decimal('base_daily_rate_override', 10, 2)->nullable();
            $table->decimal('deposit_amount_override', 10, 2)->nullable();
            $table->unsignedInteger('odometer_reading')->default(0);
            $table->enum('status', ['available', 'on_rent', 'maintenance', 'retired'])->default('available');
            $table->date('next_service_due_date')->nullable();
            $table->string('primary_image_path', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('current_store_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bikes');
    }
};

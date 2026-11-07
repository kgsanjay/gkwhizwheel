<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('branch_bike_model_prices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('bike_model_id')->constrained('bike_models')->cascadeOnDelete();
            $table->decimal('weekday_rate', 10, 2);
            $table->decimal('weekend_rate', 10, 2);
            $table->timestamps();
            $table->unique(['store_id', 'bike_model_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_bike_model_prices');
    }
};

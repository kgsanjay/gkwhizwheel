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
        Schema::create('bike_condition_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bike_condition_log_id')->constrained('bike_condition_logs')->cascadeOnDelete();
            $table->string('file_path', 255);
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bike_condition_photos');
    }
};

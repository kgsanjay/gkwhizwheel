<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            // Null for legacy individual-bike bookings. When populated it
            // identifies the model the customer explicitly requested.
            $table->foreignId('bike_model_id')->nullable()
                ->constrained('bike_models')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('bike_model_id');
        });
    }
};

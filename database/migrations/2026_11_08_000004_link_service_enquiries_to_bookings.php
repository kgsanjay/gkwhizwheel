<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Nullable for legacy proposals; unique prevents duplicate conversion
        // even when two managers submit simultaneously.
        Schema::table('service_bookings', function (Blueprint $table): void {
            $table->foreignId('service_enquiry_id')->nullable()
                ->unique('service_bookings_enquiry_unique')
                ->constrained('service_enquiries')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('service_bookings', function (Blueprint $table): void {
            $table->dropForeign(['service_enquiry_id']);
            $table->dropUnique('service_bookings_enquiry_unique');
            $table->dropColumn('service_enquiry_id');
        });
    }
};

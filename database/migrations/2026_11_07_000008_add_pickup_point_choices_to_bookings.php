<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignId('pickup_point_id')->nullable()->constrained('pickup_points')->nullOnDelete();
            $table->foreignId('return_point_id')->nullable()->constrained('pickup_points')->nullOnDelete();
            $table->string('pickup_location_details', 255)->nullable();
            $table->string('return_location_details', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('pickup_point_id');
            $table->dropConstrainedForeignId('return_point_id');
            $table->dropColumn(['pickup_location_details', 'return_location_details']);
        });
    }
};

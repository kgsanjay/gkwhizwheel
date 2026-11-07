<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pickup_points', function (Blueprint $table): void {
            // NULL means not quoted/approved, NEVER infer a free delivery.
            $table->decimal('pickup_fee', 10, 2)->nullable();
            $table->decimal('return_fee', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pickup_points', function (Blueprint $table): void {
            $table->dropColumn(['pickup_fee', 'return_fee']);
        });
    }
};

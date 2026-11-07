<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Keep the new keys nullable during migration: existing legacy records
        // require an explicit, audited assignment before branch-scoped exposure.
        Schema::table('service_items', function (Blueprint $table): void {
            $table->foreignId('store_id')->nullable()->after('id')
                ->constrained('stores')->nullOnDelete();
            $table->index(['store_id', 'service_type', 'status'], 'service_items_branch_type_status_idx');
        });

        Schema::table('service_bookings', function (Blueprint $table): void {
            $table->foreignId('store_id')->nullable()->after('id')
                ->constrained('stores')->nullOnDelete();
            $table->index(['store_id', 'service_type', 'status'], 'service_bookings_branch_type_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('service_bookings', function (Blueprint $table): void {
            $table->dropIndex('service_bookings_branch_type_status_idx');
            $table->dropConstrainedForeignId('store_id');
        });
        Schema::table('service_items', function (Blueprint $table): void {
            $table->dropIndex('service_items_branch_type_status_idx');
            $table->dropConstrainedForeignId('store_id');
        });
    }
};

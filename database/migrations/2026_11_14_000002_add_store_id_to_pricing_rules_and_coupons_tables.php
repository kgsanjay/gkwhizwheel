<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table): void {
            if (! Schema::hasColumn('pricing_rules', 'store_id')) {
                $table->foreignId('store_id')->nullable()->after('category_id')->constrained('stores')->nullOnDelete();
            }
        });

        Schema::table('coupons', function (Blueprint $table): void {
            if (! Schema::hasColumn('coupons', 'store_id')) {
                $table->foreignId('store_id')->nullable()->after('code')->constrained('stores')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table): void {
            if (Schema::hasColumn('pricing_rules', 'store_id')) {
                $table->dropConstrainedForeignId('store_id');
            }
        });

        Schema::table('coupons', function (Blueprint $table): void {
            if (Schema::hasColumn('coupons', 'store_id')) {
                $table->dropConstrainedForeignId('store_id');
            }
        });
    }
};

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
        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
            $table->string('service_type')->nullable()->after('category_id')->index();
            $table->foreignId('service_item_id')->nullable()->after('service_type')->constrained('service_items')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->dropForeign(['service_item_id']);
            $table->dropColumn(['name', 'service_type', 'service_item_id']);
        });
    }
};

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
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bike_id')->nullable()->constrained('bikes')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('bike_categories')->nullOnDelete();
            $table->enum('rule_type', ['weekend', 'holiday', 'seasonal', 'one_way_fee']);
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->date('date_start')->nullable();
            $table->date('date_end')->nullable();
            $table->foreignId('from_store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->foreignId('to_store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->enum('rate_type', ['percentage', 'fixed_override', 'flat_addon']);
            $table->decimal('value', 10, 2);
            $table->unsignedTinyInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};

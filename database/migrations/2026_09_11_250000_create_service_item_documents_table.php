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
        Schema::create('service_item_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_item_id')->constrained('service_items')->cascadeOnDelete();
            $table->string('document_type', 100);
            $table->string('file_path', 255);
            $table->boolean('verified')->default(false);
            $table->date('expiry_date')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['service_item_id', 'document_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_item_documents');
    }
};

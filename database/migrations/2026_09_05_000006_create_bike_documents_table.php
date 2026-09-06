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
        Schema::create('bike_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bike_id')->constrained('bikes')->cascadeOnDelete();
            $table->enum('document_type', ['rc', 'insurance', 'emission_certificate']);
            $table->string('file_path', 255);
            $table->date('issue_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('verified')->default(false);
            $table->timestamps();

            $table->unique(['bike_id', 'document_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bike_documents');
    }
};

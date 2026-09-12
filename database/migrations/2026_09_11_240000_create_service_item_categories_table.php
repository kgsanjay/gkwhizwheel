<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_item_categories', function (Blueprint $table) {
            $table->id();
            $table->string('service_type', 50)->index();
            $table->string('name', 100);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['service_type', 'name']);
            $table->index(['service_type', 'sort_order']);
        });

        // Seed default categories across all 7 service types
        $defaultCategories = [
            'two_wheelers' => ['Scooter (110cc-125cc)', 'Commuter Bike (150cc)', 'Cruiser (350cc)', 'Adventure Touring', 'Electric Scooter'],
            'taxi' => ['Sedan (Dzire/Etios 4+1)', 'SUV (Ertiga 6+1)', 'Premium MUV (Innova Crysta 7+1)', 'Tempo Traveller (12+1)', 'Luxury EV'],
            'boating' => ['Speedboat Safari', 'Sharavathi Shikara Cruise', 'Mangrove Kayaking Trail', 'Sunset Cruise Yacht', 'Houseboat Day Stay'],
            'scuba' => ['Introductory Shore Dive', 'Netrani Island Boat Dive', 'PADI Discovery Scuba', 'Snorkeling & Dolphin Safari'],
            'homestay' => ['Beachfront Luxury Villa', 'River Heritage Cottage', 'Forest Eco-Stay', 'Deluxe AC Family Suite', 'Cozy Backwater Room'],
            'guide' => ['Coastal & Beach Trek Guide', 'Heritage & Temple Specialist', 'Sharavathi Wildlife Trail', 'Photography & Secret Spots Guide'],
            'tours' => ['1-Day Honnavar & Murudeshwar', '2-Day Coastal & Jog Falls Circuit', '3-Day Karavali Heritage & Nature', 'Gokarna Beach & Temple Trail'],
        ];

        $now = now();
        $inserts = [];

        foreach ($defaultCategories as $serviceType => $names) {
            foreach ($names as $idx => $name) {
                $inserts[] = [
                    'service_type' => $serviceType,
                    'name' => $name,
                    'sort_order' => $idx + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('service_item_categories')->insert($inserts);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_item_categories');
    }
};

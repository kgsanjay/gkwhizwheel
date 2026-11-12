<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;

final class ReviewController extends Controller
{
    /**
     * Customer-submitted, approved motorcycle reviews only.
     * Never fabricate testimonials or imply these are Google ratings.
     */
    public function index(): JsonResponse
    {
        $approved = Review::query()
            ->where('is_visible', true)
            ->whereNotNull('comment')
            ->where('comment', '!=', '');

        $total = (clone $approved)->count();
        $average = (clone $approved)->avg('rating');
        $reviews = $approved->with(['bike:id,brand,model_name', 'user:id,name'])
            ->latest('id')->limit(24)->get();

        return response()->json([
            'success' => true,
            'data' => $reviews->map(fn (Review $review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'customer_name' => $review->user?->name ?? 'Verified customer',
                'bike_name' => trim(($review->bike?->brand ?? '').' '.($review->bike?->model_name ?? '')),
                'created_at' => $review->created_at?->toDateString(),
            ])->values()->all(),
            'meta' => [
                'total' => $total,
                'average_rating' => $average !== null ? round((float) $average, 1) : null,
            ],
        ]);
    }
}

<?php

declare(strict_types=1);

use App\Enums\AddonType;
use App\Enums\BikeConditionStage;
use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\DiscountType;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\RefundStatus;
use App\Enums\StoreStatus;
use App\Enums\SyncStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeConditionLog;
use App\Models\BikeConditionPhoto;
use App\Models\BikeDocument;
use App\Models\BikeImage;
use App\Models\Booking;
use App\Models\BookingAddon;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\KycDocument;
use App\Models\NotificationLog;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Refund;
use App\Models\Review;
use App\Models\Store;
use App\Models\SyncQueue;
use App\Models\User;

test('models cast enums and soft deletes behave correctly', function (): void {
    $user = User::create([
        'name' => 'Alice Customer',
        'email' => 'alice@example.com',
        'phone' => '9876543210',
        'password' => 'secret123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    expect($user->role)->toBe(UserRole::CUSTOMER)
        ->and($user->status)->toBe(UserStatus::ACTIVE);

    $user->delete();
    expect($user->trashed())->toBeTrue()
        ->and(User::count())->toBe(0)
        ->and(User::withTrashed()->count())->toBe(1);

    $user->restore();

    $store = Store::create([
        'name' => 'Downtown Hub',
        'address_line' => '100 Main St',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9715987,
        'longitude' => 77.5945627,
        'operating_hours' => ['mon' => '09:00-20:00'],
        'status' => StoreStatus::ACTIVE,
    ]);

    expect($store->status)->toBe(StoreStatus::ACTIVE)
        ->and($store->operating_hours)->toBeArray();

    $category = BikeCategory::create([
        'name' => 'Scooter',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 1500.00,
    ]);

    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-EQ-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);

    expect($bike->fuel_type)->toBe(FuelType::PETROL)
        ->and($bike->transmission)->toBe(Transmission::AUTOMATIC)
        ->and($bike->status)->toBe(BikeStatus::AVAILABLE);

    $bike->delete();
    expect($bike->trashed())->toBeTrue()
        ->and(Bike::count())->toBe(0)
        ->and(Bike::withTrashed()->count())->toBe(1);

    $bike->restore();
});

test('wiring between user, store, bikes, and operational models works end-to-end', function (): void {
    $store1 = Store::create([
        'name' => 'Store North',
        'address_line' => 'North Gate',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560002',
        'latitude' => 13.0000000,
        'longitude' => 77.5000000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $store2 = Store::create([
        'name' => 'Store South',
        'address_line' => 'South Gate',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560003',
        'latitude' => 12.8000000,
        'longitude' => 77.6000000,
        'status' => StoreStatus::ACTIVE,
    ]);

    $customer = User::create([
        'name' => 'Bob Rider',
        'email' => 'bob@example.com',
        'phone' => '9111122222',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $staff = User::create([
        'name' => 'Charlie Staff',
        'email' => 'charlie@example.com',
        'phone' => '9333344444',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    // Store - Staff relation
    $staff->stores()->attach($store1->id);
    expect($staff->stores)->toHaveCount(1)
        ->and($store1->staff)->toHaveCount(1)
        ->and($store1->staff->first()->id)->toBe($staff->id);

    $category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 1200.00,
        'default_deposit_amount' => 5000.00,
    ]);

    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store1->id,
        'home_store_id' => $store1->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Meteor 350',
        'registration_number' => 'KA-05-CR-9999',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    expect($bike->category->name)->toBe('Cruiser')
        ->and($category->bikes)->toHaveCount(1)
        ->and($store1->currentBikes)->toHaveCount(1)
        ->and($store1->homeBikes)->toHaveCount(1)
        ->and($bike->currentStore->id)->toBe($store1->id);

    // Bike Images & Documents
    $image = BikeImage::create([
        'bike_id' => $bike->id,
        'file_path' => 'bikes/meteor-front.jpg',
        'sort_order' => 1,
    ]);
    expect($bike->images)->toHaveCount(1)
        ->and($image->bike->id)->toBe($bike->id);

    $doc = BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => BikeDocumentType::RC,
        'file_path' => 'docs/rc-meteor.pdf',
        'uploaded_by' => $staff->id,
        'verified' => true,
    ]);
    expect($bike->documents)->toHaveCount(1)
        ->and($doc->bike->id)->toBe($bike->id)
        ->and($doc->uploader->id)->toBe($staff->id)
        ->and($staff->uploadedBikeDocuments)->toHaveCount(1);

    // Pricing Rules
    $rule = PricingRule::create([
        'category_id' => $category->id,
        'rule_type' => PricingRuleType::WEEKEND,
        'day_of_week' => 6,
        'rate_type' => PricingRateType::PERCENTAGE,
        'value' => 15.00,
        'priority' => 1,
        'is_active' => true,
    ]);
    expect($category->pricingRules)->toHaveCount(1)
        ->and($rule->category->id)->toBe($category->id);

    // Coupons
    $coupon = Coupon::create([
        'code' => 'RIDE10',
        'discount_type' => DiscountType::PERCENTAGE,
        'value' => 10.00,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
        'is_active' => true,
    ]);

    // Booking
    $booking = Booking::create([
        'booking_reference' => 'BK-2026-00001',
        'bike_id' => $bike->id,
        'user_id' => $customer->id,
        'pickup_store_id' => $store1->id,
        'return_store_id' => $store2->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-09-10',
        'end_date' => '2026-09-12',
        'base_amount' => 2400.00,
        'pricing_adjustments_amount' => 0.00,
        'one_way_fee_amount' => 300.00,
        'addon_amount' => 200.00,
        'discount_amount' => 240.00,
        'deposit_amount' => 5000.00,
        'total_amount' => 2660.00,
        'price_breakdown_json' => ['base' => 2400, 'one_way' => 300],
        'created_by' => $staff->id,
        'completed_by' => $staff->id,
        'idempotency_key' => 'idemp-booking-001',
    ]);

    expect($booking->bike->id)->toBe($bike->id)
        ->and($booking->user->id)->toBe($customer->id)
        ->and($booking->pickupStore->id)->toBe($store1->id)
        ->and($booking->returnStore->id)->toBe($store2->id)
        ->and($booking->creator->id)->toBe($staff->id)
        ->and($booking->completer->id)->toBe($staff->id)
        ->and($customer->bookings)->toHaveCount(1)
        ->and($staff->createdBookings)->toHaveCount(1)
        ->and($staff->completedBookings)->toHaveCount(1);

    // Coupon Usage
    $couponUsage = CouponUsage::create([
        'coupon_id' => $coupon->id,
        'user_id' => $customer->id,
        'booking_id' => $booking->id,
    ]);
    expect($coupon->usages)->toHaveCount(1)
        ->and($couponUsage->coupon->id)->toBe($coupon->id)
        ->and($couponUsage->user->id)->toBe($customer->id)
        ->and($couponUsage->booking->id)->toBe($booking->id)
        ->and($booking->couponUsages)->toHaveCount(1);

    // Addons
    $addon = BookingAddon::create([
        'booking_id' => $booking->id,
        'addon_type' => AddonType::HELMET,
        'quantity' => 2,
        'unit_price' => 100.00,
    ]);
    expect($booking->addons)->toHaveCount(1)
        ->and($addon->booking->id)->toBe($booking->id)
        ->and($addon->addon_type)->toBe(AddonType::HELMET);

    // Payments & Refunds
    $payment = Payment::create([
        'booking_id' => $booking->id,
        'type' => PaymentType::ADVANCE,
        'amount' => 2660.00,
        'method' => PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_rzp_12345',
        'status' => PaymentStatus::SUCCESS,
        'collected_by' => $staff->id,
    ]);
    expect($booking->payments)->toHaveCount(1)
        ->and($payment->booking->id)->toBe($booking->id)
        ->and($payment->collector->id)->toBe($staff->id)
        ->and($payment->type)->toBe(PaymentType::ADVANCE);

    $refund = Refund::create([
        'booking_id' => $booking->id,
        'payment_id' => $payment->id,
        'amount' => 500.00,
        'reason' => 'Early return discount',
        'processed_by' => $staff->id,
        'status' => RefundStatus::COMPLETED,
    ]);
    expect($booking->refunds)->toHaveCount(1)
        ->and($payment->refunds)->toHaveCount(1)
        ->and($refund->payment->id)->toBe($payment->id)
        ->and($refund->processor->id)->toBe($staff->id)
        ->and($refund->status)->toBe(RefundStatus::COMPLETED);

    // KYC Documents
    $kyc = KycDocument::create([
        'user_id' => $customer->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE,
        'file_path' => 'kyc/bob-dl.pdf',
        'verified' => true,
        'verified_by' => $staff->id,
        'verified_at' => now(),
    ]);
    expect($customer->kycDocuments)->toHaveCount(1)
        ->and($kyc->user->id)->toBe($customer->id)
        ->and($kyc->verifier->id)->toBe($staff->id)
        ->and($staff->verifiedKycDocuments)->toHaveCount(1)
        ->and($kyc->document_type)->toBe(KycDocumentType::DRIVING_LICENSE);

    // Condition Logs & Photos
    $conditionLog = BikeConditionLog::create([
        'booking_id' => $booking->id,
        'stage' => BikeConditionStage::HANDOVER,
        'odometer_reading' => 12500,
        'notes' => 'Minor scratch on left mirror',
        'logged_by' => $staff->id,
    ]);
    $photo = BikeConditionPhoto::create([
        'bike_condition_log_id' => $conditionLog->id,
        'file_path' => 'inspections/left-mirror.jpg',
    ]);
    expect($booking->conditionLogs)->toHaveCount(1)
        ->and($conditionLog->booking->id)->toBe($booking->id)
        ->and($conditionLog->logger->id)->toBe($staff->id)
        ->and($conditionLog->photos)->toHaveCount(1)
        ->and($photo->log->id)->toBe($conditionLog->id)
        ->and($conditionLog->stage)->toBe(BikeConditionStage::HANDOVER);

    // Reviews
    $review = Review::create([
        'booking_id' => $booking->id,
        'user_id' => $customer->id,
        'bike_id' => $bike->id,
        'rating' => 5,
        'comment' => 'Smooth ride!',
        'is_visible' => true,
    ]);
    expect($booking->review->id)->toBe($review->id)
        ->and($review->booking->id)->toBe($booking->id)
        ->and($review->user->id)->toBe($customer->id)
        ->and($review->bike->id)->toBe($bike->id)
        ->and($bike->reviews)->toHaveCount(1);

    // Activity Log (Polymorphic)
    $activity = ActivityLog::create([
        'user_id' => $staff->id,
        'store_id' => $store1->id,
        'action' => 'booking.handed_over',
        'subject_type' => Booking::class,
        'subject_id' => $booking->id,
        'old_values' => ['status' => 'confirmed'],
        'new_values' => ['status' => 'handed_over'],
    ]);
    expect($activity->user->id)->toBe($staff->id)
        ->and($activity->store->id)->toBe($store1->id)
        ->and($activity->subject)->toBeInstanceOf(Booking::class)
        ->and($activity->subject->id)->toBe($booking->id)
        ->and($activity->new_values)->toBe(['status' => 'handed_over']);

    // Notification Log
    $notification = NotificationLog::create([
        'user_id' => $customer->id,
        'booking_id' => $booking->id,
        'channel' => NotificationChannel::WHATSAPP,
        'template' => 'booking_confirmation',
        'status' => NotificationStatus::DELIVERED,
        'sent_at' => now(),
    ]);
    expect($notification->user->id)->toBe($customer->id)
        ->and($notification->booking->id)->toBe($booking->id)
        ->and($notification->channel)->toBe(NotificationChannel::WHATSAPP)
        ->and($notification->status)->toBe(NotificationStatus::DELIVERED)
        ->and($booking->notificationLogs)->toHaveCount(1);

    // Sync Queue
    $syncItem = SyncQueue::create([
        'device_id' => 'device-tab-01',
        'user_id' => $staff->id,
        'action_type' => 'mark_returned',
        'payload_json' => ['booking_id' => $booking->id, 'odometer' => 12850],
        'idempotency_key' => 'idemp-sync-001',
        'status' => SyncStatus::PENDING,
    ]);
    expect($syncItem->user->id)->toBe($staff->id)
        ->and($syncItem->status)->toBe(SyncStatus::PENDING)
        ->and($syncItem->payload_json)->toBe(['booking_id' => $booking->id, 'odometer' => 12850])
        ->and($staff->syncQueueItems)->toHaveCount(1);
});

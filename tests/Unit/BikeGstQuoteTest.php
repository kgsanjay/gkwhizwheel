<?php

declare(strict_types=1);

use App\Services\BikeGstQuote;

it('does not invent a GST rate when the business rate is unset', function (): void {
    config()->set('bike_gst.rate_percent', null);
    expect(app(BikeGstQuote::class)->calculate(1000.0))->toMatchArray([
        'status' => 'not_configured',
        'gst_rate_percent' => null,
        'gst_amount' => 0.0,
        'total_after_gst' => 1000.0,
    ]);
});

it('calculates tax exclusive amounts when configured', function (): void {
    config()->set('bike_gst.rate_percent', 18);
    config()->set('bike_gst.price_mode', 'exclusive');
    expect(app(BikeGstQuote::class)->calculate(1000.0))->toMatchArray([
        'status' => 'configured',
        'taxable_amount' => 1000.0,
        'gst_amount' => 180.0,
        'total_after_gst' => 1180.0,
    ]);
});

it('extracts tax from inclusive prices without adding it twice', function (): void {
    config()->set('bike_gst.rate_percent', 18);
    config()->set('bike_gst.price_mode', 'inclusive');
    expect(app(BikeGstQuote::class)->calculate(1180.0))->toMatchArray([
        'taxable_amount' => 1000.0,
        'gst_amount' => 180.0,
        'total_after_gst' => 1180.0,
    ]);
});

it('rejects invalid tax settings', function (): void {
    config()->set('bike_gst.rate_percent', 110);
    app(BikeGstQuote::class)->calculate(1000.0);
})->throws(InvalidArgumentException::class);

it('adds configured GST after waiving deposit and preserves the fee base', function (): void {
    config()->set('bike_gst.rate_percent', 18);
    config()->set('bike_gst.price_mode', 'exclusive');
    $quote = [
        'deposit_amount' => 500.0,
        'total_amount' => 1600.0, // ₹1000 rental + ₹100 delivery + ₹500 refundable deposit
        'price_breakdown_json' => [
            'rental_subtotal' => 1000.0,
            'location_fee_amount' => 100.0,
            'deposit_amount' => 500.0,
        ],
    ];

    $result = \App\Services\BikeBookingPayments::waiveDeposit($quote);
    expect($result['deposit_amount'])->toBe(0.0)
        ->and($result['total_amount'])->toBe(1298.0)
        ->and($result['price_breakdown_json']['bike_gst']['gst_amount'])->toBe(198.0)
        ->and(\App\Services\BikeBookingPayments::waiveDeposit($result)['total_amount'])->toBe(1298.0);
});

it('preserves legacy quote amounts when no GST rate is configured', function (): void {
    config()->set('bike_gst.rate_percent', null);
    $result = \App\Services\BikeBookingPayments::waiveDeposit([
        'deposit_amount' => 100.0,
        'total_amount' => 1100.0,
        'price_breakdown_json' => [],
    ]);
    expect($result['total_amount'])->toBe(1000.0)
        ->and($result['price_breakdown_json']['bike_gst']['status'])->toBe('not_configured');
});

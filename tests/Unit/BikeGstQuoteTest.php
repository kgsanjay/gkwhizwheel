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

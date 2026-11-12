<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;

/**
 * Bike quote tax calculation only. Does not issue a tax invoice.
 * Tax classification and place-of-supply splitting require separate review.
 */
final class BikeGstQuote
{
    /**
     * @return array{status:string, taxable_amount:float, gst_rate_percent:float|null,
     *               gst_amount:float, total_after_gst:float, price_mode:string|null}
     */
    public function calculate(float $subtotal): array
    {
        $subtotal = round(max(0.0, $subtotal), 2);
        $configured = config('bike_gst.rate_percent');

        if ($configured === null || $configured === '') {
            return [
                'status' => 'not_configured',
                'taxable_amount' => $subtotal,
                'gst_rate_percent' => null,
                'gst_amount' => 0.0,
                'total_after_gst' => $subtotal,
                'price_mode' => null,
            ];
        }

        if (! is_numeric($configured) || (float) $configured < 0 || (float) $configured > 100) {
            throw new InvalidArgumentException('Invalid bike GST rate configuration.');
        }

        $rate = (float) $configured;
        $mode = config('bike_gst.price_mode', 'exclusive');
        if (! in_array($mode, ['exclusive', 'inclusive'], true)) {
            throw new InvalidArgumentException('Invalid bike GST price mode.');
        }

        if ($mode === 'inclusive') {
            $taxable = round($subtotal / (1 + $rate / 100), 2);
            $tax = round($subtotal - $taxable, 2);
            $total = $subtotal;
        } else {
            $taxable = $subtotal;
            $tax = round($subtotal * $rate / 100, 2);
            $total = round($subtotal + $tax, 2);
        }

        return [
            'status' => 'configured',
            'taxable_amount' => $taxable,
            'gst_rate_percent' => $rate,
            'gst_amount' => $tax,
            'total_after_gst' => $total,
            'price_mode' => $mode,
        ];
    }
}

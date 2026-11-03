/**
 * Public presentation helpers. Prices always come from admin-managed records;
 * marketing defaults must not be displayed as live booking offers.
 */
export const serviceTypeBySlug = {
    bikes: 'two_wheelers',
    cabs: 'taxi',
    homestays: 'homestay',
    boating: 'boating',
    scuba: 'scuba',
    guide: 'guide',
    tours: 'tours',
};

const formatINR = (value) => Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
});

export function getServiceDisplayRate(slug, items = [], bikes = []) {
    if (slug === 'bikes') {
        const rates = bikes
            .map((bike) => Number(bike.daily_rate))
            .filter((rate) => Number.isFinite(rate) && rate > 0);
        return rates.length ? `From ₹${formatINR(Math.min(...rates))} / day` : 'Check bike availability';
    }

    const serviceType = serviceTypeBySlug[slug] || slug;
    const prices = items
        .filter((item) => item.service_type === serviceType && ['available', 'active'].includes(item.status))
        .map((item) => ({ price: Number(item.price_base), unit: item.price_unit }))
        .filter((item) => Number.isFinite(item.price) && item.price > 0);
    if (!prices.length) return 'Enquire for availability';
    const lowest = prices.reduce((min, current) => current.price < min.price ? current : min);
    const unit = lowest.unit ? ` / ${lowest.unit.replace(/^per_/, '').replaceAll('_', ' ')}` : '';
    return `From ₹${formatINR(lowest.price)}${unit}`;
}

export function getServiceDisplayImage(slug, items = [], fallback) {
    const serviceType = serviceTypeBySlug[slug] || slug;
    const first = items.find((item) =>
        item.service_type === serviceType && ['available', 'active'].includes(item.status) && item.primary_image_url
    );
    return first?.primary_image_url || fallback;
}

/**
 * Placeholder and image fallback utility for GK WhizWheel.
 * Provides resilient fallback placeholders for all fleet and service images.
 */

export const PLACEHOLDER_IMAGES = {
    hero: '/images/placeholders/placeholder-hero.svg',
    bikes: '/images/placeholders/placeholder-bikes.svg',
    boating: '/images/placeholders/placeholder-boating.svg',
    scuba: '/images/placeholders/placeholder-scuba.svg',
    cabs: '/images/placeholders/placeholder-cabs.svg',
    homestays: '/images/placeholders/placeholder-homestays.svg',
    guide: '/images/placeholders/placeholder-guide.svg',
    tours: '/images/placeholders/placeholder-tours.svg',
    fleet: '/images/placeholders/placeholder-fleet.svg',
    default: '/images/placeholders/placeholder-default.svg',
};

/**
 * Get the appropriate placeholder image path for a given service slug or key.
 */
export function getServicePlaceholder(slug = '') {
    const key = (slug || '').toLowerCase();
    if (key.includes('bike') || key.includes('two_wheeler')) return PLACEHOLDER_IMAGES.bikes;
    if (key.includes('boat')) return PLACEHOLDER_IMAGES.boating;
    if (key.includes('scuba') || key.includes('div')) return PLACEHOLDER_IMAGES.scuba;
    if (key.includes('cab') || key.includes('taxi')) return PLACEHOLDER_IMAGES.cabs;
    if (key.includes('home') || key.includes('stay') || key.includes('room')) return PLACEHOLDER_IMAGES.homestays;
    if (key.includes('guide')) return PLACEHOLDER_IMAGES.guide;
    if (key.includes('tour') || key.includes('package')) return PLACEHOLDER_IMAGES.tours;
    return PLACEHOLDER_IMAGES.default;
}

/**
 * Get placeholder for a vehicle fleet model.
 */
export function getVehiclePlaceholder() {
    return PLACEHOLDER_IMAGES.fleet;
}

/**
 * Standard image onError handler to replace broken or missing image with fallback.
 */
export function handleImageFallback(event, fallbackSrc) {
    if (event?.currentTarget) {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallbackSrc || PLACEHOLDER_IMAGES.default;
    }
}

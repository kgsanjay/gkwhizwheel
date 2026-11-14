import apiClient, { setAuthToken } from '../../api/client';

/**
 * Shared booking utilities for GK WhizWheels dedicated service modals
 */

export function sanitizePhone(phone) {
    return (phone || '').replace(/\D/g, '');
}

export function validatePhone(phone) {
    const clean = sanitizePhone(phone);
    if (clean.length !== 10) return false;
    return /^[6-9]/.test(clean);
}

export function formatWhatsAppUrl(phoneNumber, messageText) {
    const cleanPhone = sanitizePhone(phoneNumber);
    const encoded = encodeURIComponent(messageText);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export async function resolveGuestAccount({ name, phone, email }) {
    const cleanPhone = sanitizePhone(phone);
    const res = await apiClient.post('/auth/checkout-resolve', {
        name: (name || '').trim(),
        phone: cleanPhone,
        email: email ? email.trim() : undefined,
    });
    if (res.status === 'authenticated') {
        if (res.data?.token) setAuthToken(res.data.token);
    }
    return res;
}

export function getSupportContact() {
    if (typeof window !== 'undefined') {
        const pageProps = window.__page?.props || window.__PAGE_PROPS__ || {};
        const siteSettings = pageProps.site_settings || {};
        const branches = pageProps.public_branches || [];
        const phone = siteSettings.primary_phone || branches[0]?.phone || '+918660989586';
        const wa = siteSettings.whatsapp_number || branches[0]?.whatsapp || phone;
        return {
            phone,
            whatsapp: wa.replace(/\D/g, '') || '918660989586',
        };
    }
    return {
        phone: '+918660989586',
        whatsapp: '918660989586',
    };
}

export const SUPPORT_WHATSAPP = typeof window !== 'undefined' && window.__page?.props?.site_settings?.whatsapp_number
    ? window.__page.props.site_settings.whatsapp_number.replace(/\D/g, '')
    : '918660989586';
export const SUPPORT_PHONE = typeof window !== 'undefined' && window.__page?.props?.site_settings?.primary_phone
    ? window.__page.props.site_settings.primary_phone
    : '+918660989586';

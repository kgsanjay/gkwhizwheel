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

export const SUPPORT_WHATSAPP = '918660989586';
export const SUPPORT_PHONE = '+918660989586';

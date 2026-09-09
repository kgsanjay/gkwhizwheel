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

export const SUPPORT_WHATSAPP = '918660989586';
export const SUPPORT_PHONE = '+918660989586';

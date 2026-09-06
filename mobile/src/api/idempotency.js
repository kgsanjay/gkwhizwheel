/**
 * RFC4122 v4 UUID generator matching website implementation (CheckoutModal.jsx).
 * Safe for React Native, Node.js, and web runtimes.
 */
export function generateIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        } catch {
            // fallback if crypto.randomUUID throws in restricted context
        }
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export default generateIdempotencyKey;

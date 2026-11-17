/**
 * Format dates in Asia/Kolkata (IST) to match Laravel's app.timezone.
 * Prevents the midnight–05:30 IST UTC rollover bug where Date#toISOString() returns yesterday.
 */
const IST_DATE_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });

const IST_DATETIME_FMT = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

export function getIstDate(offsetDays = 0) {
    return IST_DATE_FMT.format(new Date(Date.now() + offsetDays * 86400000));
}

export function getIstDateTime(offsetDays = 0) {
    const parts = Object.fromEntries(
        IST_DATETIME_FMT.formatToParts(new Date(Date.now() + offsetDays * 86400000)).map((p) => [p.type, p.value])
    );
    const hour = parts.hour === '24' ? '00' : parts.hour;
    return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

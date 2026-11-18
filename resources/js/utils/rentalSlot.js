/**
 * Standard 23-hour rental slot helper (1-hour hub turnaround/sanitization buffer per cycle).
 */
export function formatTime12h(time24 = '09:00') {
    const [hRaw, mRaw] = String(time24 || '09:00').split(':');
    const h = Number(hRaw);
    const m = Number(mRaw || 0);
    if (Number.isNaN(h)) return String(time24 || '09:00');
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function computeRentalSlot(startDate, endDate, pickupTime = '09:00', returnTime = '08:00') {
    const fallback = {
        days: 1,
        hours: 23,
        pickupTime24: pickupTime || '09:00',
        returnTime24: '08:00',
        pickupTime12: formatTime12h(pickupTime || '09:00'),
        returnTime12: formatTime12h('08:00'),
        slotLabel: '23 Hr Slot',
        durationLabel: '1 Day (23 Hr Slot)',
    };

    if (!startDate || !endDate) return fallback;

    const pTime = pickupTime || '09:00';
    const rTime = returnTime || '08:00';
    const start = new Date(`${startDate}T${pTime}:00`);
    const end = new Date(`${endDate}T${rTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return fallback;
    }

    let diffHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    let effectiveEnd = end;

    // Exact 24h multiples (e.g. legacy 09:00 -> 09:00) map to the 23h operational slot (-1 hr buffer).
    if (diffHours >= 24 && diffHours % 24 === 0) {
        diffHours -= 1;
        effectiveEnd = new Date(end.getTime() - 60 * 60 * 1000);
    }

    const days = Math.max(1, Math.ceil(diffHours / 24));
    const effectiveReturn24 = `${String(effectiveEnd.getHours()).padStart(2, '0')}:${String(effectiveEnd.getMinutes()).padStart(2, '0')}`;
    const slotLabel = `${diffHours} Hr Slot`;

    return {
        days,
        hours: diffHours,
        pickupTime24: pTime,
        returnTime24: effectiveReturn24,
        pickupTime12: formatTime12h(pTime),
        returnTime12: formatTime12h(effectiveReturn24),
        slotLabel,
        durationLabel: `${days} Day${days > 1 ? 's' : ''} (${slotLabel})`,
    };
}

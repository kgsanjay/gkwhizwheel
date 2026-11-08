import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Alert, Box, Button, Card, CardContent, Chip, Divider, Grid,
    MenuItem, Stack, TextField, Typography,
} from '@mui/material';

const format = value => value ? new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

export default function CabOperations({
    dispatches = [], reschedules = [], refundReviews = [],
    bookings = [], vehicles = [], drivers = [], disputes = [], notificationEvents = [],
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [assignment, setAssignment] = useState({ service_booking_id: '', cab_vehicle_id: '', cab_driver_id: '' });
    const [reason, setReason] = useState({});
    const [dates, setDates] = useState({});
    const [confirmations, setConfirmations] = useState({});
    const [odometer, setOdometer] = useState({});
    const [disputeReviewNotes, setDisputeReviewNotes] = useState({});
    const [dispute, setDispute] = useState({ bookingId: '', category: 'service_quality', description: '' });

    const submit = async (url, data, confirmation) => {
        if (busy || (confirmation && !window.confirm(confirmation))) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await axios.post(url, data);
            setNotice('Request recorded. Reloading current operations data.');
            router.reload({ only: ['dispatches', 'reschedules', 'refundReviews', 'disputes', 'notificationEvents', 'bookings'] });
        } catch (e) {
            const errors = e.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') :
                (e.response?.data?.message || 'Request could not be completed. No success has been assumed.'));
        } finally {
            setBusy(false);
        }
    };

    const readyBookings = bookings.filter(b => !dispatches.some(d => d.service_booking_id === b.id));
    const selectedBooking = bookings.find(b => String(b.id) === String(assignment.service_booking_id));
    const eligibleVehicles = vehicles.filter(v => v.status === 'available'
        && v.store_id === selectedBooking?.store_id && v.service_item_id === selectedBooking?.service_item_id);
    const eligibleDrivers = drivers.filter(v => v.status === 'available'
        && v.store_id === selectedBooking?.store_id && v.service_item_id === selectedBooking?.service_item_id);

    return (
        <AdminLayout title="Cab Operations">
            <Head title="Cab Operations" />
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Cab operations</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Branch-authorized dispatch, date-change requests and refund reviews.
                        A reschedule proposal is not a confirmed change; a refund review is not a payout.
                    </Typography>
                    <Button component={Link} href="/admin/services/taxi/bookings" size="small">View cab bookings</Button>
                </Box>
                {error && <Alert severity="error" role="alert" onClose={() => setError('')}>{error}</Alert>}
                {notice && <Alert severity="success" role="status" onClose={() => setNotice('')}>{notice}</Alert>}

                <Card variant="outlined"><CardContent>
                    <Typography variant="h6" gutterBottom>Assign a verified cab and driver</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Only approved active resources can be assigned. Server checks compliance, capacity and scheduling.
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField select fullWidth label="Confirmed booking" value={assignment.service_booking_id}
                                onChange={e => setAssignment({ service_booking_id: e.target.value, cab_vehicle_id: '', cab_driver_id: '' })}>
                                {readyBookings.map(b => <MenuItem key={b.id} value={b.id}>{b.booking_number} · Branch {b.store_id}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select fullWidth label="Cab" value={assignment.cab_vehicle_id}
                                onChange={e => setAssignment({ ...assignment, cab_vehicle_id: e.target.value })}>
                                {eligibleVehicles.map(v => <MenuItem key={v.id} value={v.id}>Cab #{v.id} · {v.vehicle_class}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select fullWidth label="Driver" value={assignment.cab_driver_id}
                                onChange={e => setAssignment({ ...assignment, cab_driver_id: e.target.value })}>
                                {eligibleDrivers.map(d => <MenuItem key={d.id} value={d.id}>{d.name} · #{d.id}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button fullWidth variant="contained" disabled={busy || !assignment.service_booking_id
                                || !assignment.cab_vehicle_id || !assignment.cab_driver_id}
                                onClick={() => submit('/admin/cab-dispatches', assignment,
                                    'Assign this verified cab and driver to the selected booking?')}>Assign</Button>
                        </Grid>
                    </Grid>
                </CardContent></Card>

                <Typography variant="h6" fontWeight={700}>Dispatch timeline ({dispatches.length} latest)</Typography>
                {dispatches.length === 0 && <Alert severity="info">No cab dispatch records in your authorized branches.</Alert>}
                <Grid container spacing={2}>
                    {dispatches.map(d => <Grid item xs={12} lg={6} key={d.id}>
                        <Card variant="outlined"><CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography fontWeight={700}>Dispatch #{d.id} · Booking #{d.service_booking_id}</Typography>
                                <Chip label={d.status.replaceAll('_', ' ')} size="small" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                                Branch {d.store_id} · Cab #{d.cab_vehicle_id} · Driver #{d.cab_driver_id}
                            </Typography>
                            <Typography variant="body2">{format(d.starts_at)} — {format(d.ends_at)}</Typography>
                            <Divider sx={{ my: 2 }} />
                            {d.status === 'assigned' && <>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                                    <TextField size="small" label="Start odometer (optional)" type="number"
                                        value={odometer[d.id] ?? ''} onChange={e => setOdometer({ ...odometer, [d.id]: e.target.value })}/>
                                    <Button disabled={busy} variant="outlined" onClick={() => submit(
                                        `/admin/cab-dispatches/${d.id}/start`,
                                        odometer[d.id] ? { start_odometer: Number(odometer[d.id]) } : {},
                                        'Start trip? This changes the booking to in progress.'
                                    )}>Start trip</Button>
                                </Stack>
                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2">Propose a new schedule (not yet confirmed)</Typography>
                                    <TextField size="small" label="Proposed start" type="datetime-local" InputLabelProps={{ shrink: true }}
                                        value={dates[d.id]?.start || ''} onChange={e => setDates({ ...dates, [d.id]: { ...dates[d.id], start: e.target.value } })}/>
                                    <TextField size="small" label="Proposed end" type="datetime-local" InputLabelProps={{ shrink: true }}
                                        value={dates[d.id]?.end || ''} onChange={e => setDates({ ...dates, [d.id]: { ...dates[d.id], end: e.target.value } })}/>
                                    <TextField size="small" label="Reason for schedule request" value={reason[`res-${d.id}`] || ''}
                                        onChange={e => setReason({ ...reason, [`res-${d.id}`]: e.target.value })}/>
                                    <Button disabled={busy || !dates[d.id]?.start || !dates[d.id]?.end || (reason[`res-${d.id}`] || '').trim().length < 5}
                                        onClick={() => submit(`/admin/cab-dispatches/${d.id}/reschedule-requests`, {
                                            proposed_starts_at: dates[d.id].start,
                                            proposed_ends_at: dates[d.id].end, reason: reason[`res-${d.id}`],
                                        })}>Submit reschedule proposal</Button>
                                </Stack>
                                <TextField fullWidth size="small" label="Cancellation reason" value={reason[`cancel-${d.id}`] || ''}
                                    onChange={e => setReason({ ...reason, [`cancel-${d.id}`]: e.target.value })}/>
                                <Button sx={{ mt: 1 }} color="error" disabled={busy || (reason[`cancel-${d.id}`] || '').trim().length < 5}
                                    onClick={() => submit(`/admin/cab-dispatches/${d.id}/cancel`,
                                        { reason: reason[`cancel-${d.id}`] },
                                        'Cancel this cab booking and release its assigned cab/driver? This does NOT issue a refund.'
                                    )}>Cancel before departure</Button>
                            </>}
                            {d.status === 'in_progress' && <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <TextField size="small" label="End odometer (optional)" type="number"
                                    value={odometer[d.id] ?? ''} onChange={e => setOdometer({ ...odometer, [d.id]: e.target.value })}/>
                                <Button variant="outlined" disabled={busy} onClick={() => submit(
                                    `/admin/cab-dispatches/${d.id}/complete`,
                                    odometer[d.id] ? { end_odometer: Number(odometer[d.id]) } : {},
                                    'Mark trip completed? This releases allocated resources.'
                                )}>Complete trip</Button>
                            </Stack>}
                            {d.status === 'cancelled' && <>
                                <Typography variant="caption" display="block" sx={{ my: 1 }}>
                                    Financial review is separate from cancellation and does not send money.
                                </Typography>
                                <TextField size="small" fullWidth label="Refund review reason"
                                    value={reason[`refund-${d.id}`] || ''}
                                    onChange={e => setReason({ ...reason, [`refund-${d.id}`]: e.target.value })}/>
                                <Button disabled={busy || (reason[`refund-${d.id}`] || '').trim().length < 5}
                                    sx={{ mt: 1 }} onClick={() => submit(
                                        `/admin/cab-bookings/${d.service_booking_id}/refund-reviews`,
                                        { reason: reason[`refund-${d.id}`] }
                                    )}>Request refund review (no payout)</Button>
                            </>}
                        </CardContent></Card>
                    </Grid>)}
                </Grid>

                <Typography variant="h6" fontWeight={700}>Pending rescheduling decisions ({reschedules.length})</Typography>
                {reschedules.length === 0 && <Typography color="text.secondary">No pending reschedule proposals.</Typography>}
                <Grid container spacing={2}>
                    {reschedules.map(p => <Grid item xs={12} md={6} key={p.id}><Card variant="outlined"><CardContent>
                        <Typography fontWeight={700}>Proposal #{p.id} · Dispatch #{p.cab_dispatch_id}</Typography>
                        <Typography variant="body2" sx={{ my: 1 }}>{format(p.proposed_starts_at)} — {format(p.proposed_ends_at)}</Typography>
                        <Alert severity="warning" sx={{ mb: 1 }}>
                            Approval only supports unpaid offline trips. Confirm customer consent and unchanged fare first.
                        </Alert>
                        <Stack spacing={1}>
                            <label><input type="checkbox" checked={!!confirmations[`consent-${p.id}`]}
                                onChange={e => setConfirmations({ ...confirmations, [`consent-${p.id}`]: e.target.checked })}/> Customer consent verified</label>
                            <label><input type="checkbox" checked={!!confirmations[`fare-${p.id}`]}
                                onChange={e => setConfirmations({ ...confirmations, [`fare-${p.id}`]: e.target.checked })}/> Unchanged fare authorized</label>
                            <TextField size="small" label="Rejection reason" value={reason[`reject-${p.id}`] || ''}
                                onChange={e => setReason({ ...reason, [`reject-${p.id}`]: e.target.value })}/>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" disabled={busy || !confirmations[`consent-${p.id}`] || !confirmations[`fare-${p.id}`]}
                                    onClick={() => submit(`/admin/cab-reschedule-requests/${p.id}/resolve`, {
                                        decision: 'approved', customer_consent_confirmed: true, unchanged_fare_approved: true,
                                    }, 'Approve and atomically update cab and driver allocation times?')}>Approve</Button>
                                <Button color="error" disabled={busy || (reason[`reject-${p.id}`] || '').trim().length < 5}
                                    onClick={() => submit(`/admin/cab-reschedule-requests/${p.id}/resolve`, {
                                        decision: 'rejected', reason: reason[`reject-${p.id}`],
                                    })}>Reject</Button>
                            </Stack>
                        </Stack>
                    </CardContent></Card></Grid>)}
                </Grid>

                <Card variant="outlined"><CardContent>
                    <Typography variant="h6" gutterBottom>Log an operational incident or financial dispute</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This is an internal record only. Do not enter customer payment credentials, identity-document numbers or other sensitive details.
                        Submitting does not create a charge or authorize a refund.
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Booking ID" type="number" inputProps={{ min: 1 }}
                                value={dispute.bookingId}
                                onChange={e => setDispute({ ...dispute, bookingId: e.target.value })}/>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField select fullWidth label="Incident category" value={dispute.category}
                                onChange={e => setDispute({ ...dispute, category: e.target.value })}>
                                {['billing', 'refund', 'service_quality', 'schedule', 'safety', 'other']
                                    .map(v => <MenuItem key={v} value={v}>{v.replaceAll('_', ' ')}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth multiline minRows={2} label="Incident description (no sensitive data)"
                                value={dispute.description} inputProps={{ maxLength: 2000 }}
                                onChange={e => setDispute({ ...dispute, description: e.target.value })}/>
                        </Grid>
                        <Grid item xs={12}>
                            <Button variant="outlined" disabled={busy || Number(dispute.bookingId) < 1 || dispute.description.trim().length < 10}
                                onClick={() => submit(`/admin/cab-bookings/${dispute.bookingId}/disputes`, {
                                    category: dispute.category, description: dispute.description.trim(),
                                })}>Record incident (no financial action)</Button>
                        </Grid>
                    </Grid>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3 }}>Recent disputes ({disputes.length})</Typography>
                    {disputes.length === 0 && <Typography color="text.secondary">No incident records in your authorized branches.</Typography>}
                    <Stack spacing={1} sx={{ mt: 1 }}>
                        {disputes.map(d => <Stack key={d.id} direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between" spacing={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="body2">#{d.id} · Booking #{d.service_booking_id} · {d.category.replaceAll('_', ' ')}</Typography>
                            <Stack spacing={1}>
                                <Chip size="small" label={d.status.replaceAll('_', ' ')} />
                                {['open', 'reviewing'].includes(d.status) && <>
                                    <TextField size="small" multiline label="Internal review notes (required)" inputProps={{ maxLength: 2000 }}
                                        value={disputeReviewNotes[d.id] || ''}
                                        onChange={e => setDisputeReviewNotes({ ...disputeReviewNotes, [d.id]: e.target.value })}/>
                                    <Button size="small" disabled={busy || (disputeReviewNotes[d.id] || '').trim().length < 10}
                                        onClick={() => submit(`/admin/cab-disputes/${d.id}/transition`, {
                                            status: d.status === 'open' ? 'reviewing' : 'closed_internal',
                                            review_notes: disputeReviewNotes[d.id],
                                        }, d.status === 'open' ? 'Move incident into internal review?' :
                                            'Close this non-financial incident internally? This does not settle a payment or refund.')}>
                                        {d.status === 'open' ? 'Begin review' : 'Close internal incident'}
                                    </Button>
                                    {d.status === 'reviewing' && ['billing', 'refund'].includes(d.category) &&
                                        <Typography variant="caption" color="warning.main">
                                            Financial cases cannot be closed without approved settlement workflow.
                                        </Typography>}
                                </>}
                            </Stack>
                        </Stack>)}
                    </Stack>
                </CardContent></Card>

                <Card variant="outlined"><CardContent>
                    <Typography variant="h6" gutterBottom>Customer notification events (not sent)</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        These records are internal notification intents awaiting approved templates, consent and delivery setup.
                        No message is sent automatically.
                    </Alert>
                    {notificationEvents.length === 0 && <Typography color="text.secondary">No cab notification events recorded.</Typography>}
                    <Stack spacing={1}>
                        {notificationEvents.map(e => <Stack key={e.id} direction={{ xs: 'column', sm: 'row' }}
                            spacing={1} justifyContent="space-between" sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2">Booking #{e.service_booking_id} · {e.event_type.replaceAll('_', ' ')}</Typography>
                            <Chip label={e.status.replaceAll('_', ' ')} size="small" />
                        </Stack>)}
                    </Stack>
                </CardContent></Card>

                <Typography variant="h6" fontWeight={700}>Refund review queue ({refundReviews.length})</Typography>
                {refundReviews.length === 0 && <Typography color="text.secondary">No cab refund reviews recorded.</Typography>}
                <Grid container spacing={2}>
                    {refundReviews.map(r => <Grid item xs={12} sm={6} md={4} key={r.id}>
                        <Card variant="outlined"><CardContent>
                            <Typography fontWeight={700}>Review #{r.id} · Booking #{r.service_booking_id}</Typography>
                            <Chip size="small" label={r.status.replaceAll('_', ' ')} sx={{ my: 1 }} />
                            <Typography color={r.reconciliation_required ? 'error.main' : 'text.secondary'} variant="body2">
                                {r.reconciliation_required ? 'Payment reconciliation required' : 'Recorded advance matches verified receipts'}
                            </Typography>
                            <Typography variant="caption">No refund has been initiated or authorized.</Typography>
                        </CardContent></Card>
                    </Grid>)}
                </Grid>
            </Stack>
        </AdminLayout>
    );
}

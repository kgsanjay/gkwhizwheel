import React, { useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { Alert, Box, Button, Card, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';

export default function ApprovalReview({ review, booking, serviceSlug }) {
    const [resource, setResource] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [driver, setDriver] = useState('');
    const [notes, setNotes] = useState('');
    const [open, setOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState([]);
    if (!review || !['held', 'pending_payment'].includes(booking.status)) return null;
    const cab = booking.service_type === 'taxi';
    const selected = cab ? vehicle && driver : resource;
    const labels = cab
        ? `${review.vehicles.find(v => String(v.id) === String(vehicle))?.name || ''} / ${review.drivers.find(d => String(d.id) === String(driver))?.name || ''}`
        : review.resources.find(r => String(r.id) === String(resource))?.name;
    const submit = async () => {
        if (busy || !accepted) return;
        setBusy(true);
        setErrors([]);
        try {
            await axios.post(`/admin/services/${serviceSlug}/bookings/${booking.id}/approve`, {
                expected_total_paise: review.expected_total_paise,
                expected_starts_at: review.expected_starts_at,
                expected_ends_at: review.expected_ends_at,
                approval_notes: notes,
                ...(cab ? { cab_vehicle_id: Number(vehicle), cab_driver_id: Number(driver) } : { resource_ids: [Number(resource)] }),
            });
            router.reload();
        } catch (error) {
            setOpen(false);
            setAccepted(false);
            setErrors(error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat()
                : ['Approval could not be confirmed. Reload to check the current booking before trying again.']);
        } finally {
            setBusy(false);
        }
    };
    return <Card sx={{ mb: 3 }}><CardContent>
        <Typography variant="h6">Review reservation approval</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
            {errors.map((error, index) => <Alert severity="error" key={index}>{error}</Alert>)}
            {review.blocked ? <Alert severity="warning">This proposal cannot be approved. It needs a current unpaid offline hold, an active branch and service, and a complete future schedule. Expired or historical payment records require separate review.</Alert> : <>
                <Alert severity="info">Candidates are not reserved. Schedule and capacity are checked when you approve. Approval preserves the proposed amount and does not collect payment or send a customer confirmation.</Alert>
                {cab ? <>
                    <TextField select required label="Cab" value={vehicle} onChange={e => setVehicle(e.target.value)} disabled={busy}>
                        {review.vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.name} · {v.seats} seats</MenuItem>)}
                    </TextField>
                    <TextField select required label="Driver" value={driver} onChange={e => setDriver(e.target.value)} disabled={busy}>
                        {review.drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                    </TextField>
                    {(!review.vehicles.length || !review.drivers.length) && <Alert severity="warning">No eligible cab and driver pair is listed for this branch and service.</Alert>}
                </> : <>
                    <TextField select required label="Service resource" value={resource} onChange={e => setResource(e.target.value)} disabled={busy}>
                        {review.resources.map(r => <MenuItem key={r.id} value={r.id}>{r.code} · {r.name} · capacity {r.capacity_units}</MenuItem>)}
                    </TextField>
                    {!review.resources.length && <Alert severity="warning">No eligible resource is listed for this branch, service and quantity.</Alert>}
                </>}
                <TextField label="Approval notes" multiline minRows={2} value={notes} onChange={e => setNotes(e.target.value)} inputProps={{ maxLength: 1200 }} helperText="Record your review of the proposed amount and schedule (5–1200 characters)." disabled={busy} />
                <Button variant="contained" disabled={!selected || notes.trim().length < 5 || busy} onClick={() => { setAccepted(false); setOpen(true); }}>Review and approve</Button>
            </>}
            <Button onClick={() => router.reload()} disabled={busy}>Reload current proposal and candidates</Button>
        </Stack>
        <Dialog open={open} onClose={() => { if (!busy) setOpen(false); }} fullWidth maxWidth="sm">
            <DialogTitle>Confirm reservation approval</DialogTitle>
            <DialogContent><Stack spacing={2}>
                <Typography>Booking {booking.booking_number} · Branch #{booking.store_id} · Quantity {booking.quantity}</Typography>
                <Typography>{labels}</Typography>
                <Typography>Start: {review.expected_starts_at} · End: {review.expected_ends_at} (booking time)</Typography>
                <Typography>Proposed total: ₹{(review.expected_total_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{notes}</Typography>
                <FormControlLabel control={<Checkbox checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy} />} label="I reviewed this amount, schedule and resource selection." />
            </Stack></DialogContent>
            <DialogActions><Button disabled={busy} onClick={() => setOpen(false)}>Back</Button><Button variant="contained" disabled={!accepted || busy} onClick={submit}>{busy ? 'Approving…' : 'Approve reservation'}</Button></DialogActions>
        </Dialog>
    </CardContent></Card>;
}

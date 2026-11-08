import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, FormControlLabel, Grid, MenuItem, Stack,
    TextField, Typography,
} from '@mui/material';
import AuthModal from '../Auth/AuthModal';
import { sanitizePhone, validatePhone } from './bookingUtils';

const tripTypes = [
    { value: 'one_way', label: 'One-way transfer' },
    { value: 'round_trip', label: 'Round trip' },
    { value: 'local', label: 'Local sightseeing / hourly' },
    { value: 'airport', label: 'Airport transfer' },
];
const classes = [
    ['hatchback', 'Hatchback'], ['sedan', 'Sedan'], ['suv', 'SUV'],
    ['mpv', 'MPV'], ['van', 'Van'], ['tempo_traveller', 'Tempo Traveller'],
];
const localDatetime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function CabsBookingModal({ open, onClose, initialTripType = 'one_way', availableItems = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [authOpen, setAuthOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [received, setReceived] = useState(false);
    const [form, setForm] = useState({
        trip_type: tripTypes.some((item) => item.value === initialTripType) ? initialTripType : 'one_way',
        service_item_id: '',
        store_id: '',
        vehicle_class: '',
        pickup_location: '',
        drop_location: '',
        start_datetime: localDatetime(),
        end_datetime: '',
        passengers: 2,
        bags: 0,
        travel_reference: '',
        stops: '',
        special_requests: '',
        customer_name: user?.name || '',
        customer_phone: user?.phone || '',
        customer_email: user?.email || '',
        terms_acknowledged: false,
    });
    const setField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
    const selectedItem = useMemo(
        () => availableItems.find((item) => String(item.id) === String(form.service_item_id)),
        [availableItems, form.service_item_id],
    );
    useEffect(() => {
        if (user) {
            setForm((old) => ({
                ...old,
                customer_name: old.customer_name || user.name || '',
                customer_phone: old.customer_phone || user.phone || '',
                customer_email: old.customer_email || user.email || '',
            }));
        }
    }, [user]);

    const submit = (event) => {
        event.preventDefault();
        setErrors({});
        if (!user) {
            setAuthOpen(true);
            return;
        }
        if (!validatePhone(form.customer_phone)) {
            setErrors({ customer_phone: 'Enter a valid 10-digit Indian mobile number.' });
            return;
        }
        const stops = form.stops.split('\n').map((part) => part.trim()).filter(Boolean);
        if (stops.length > 6) {
            setErrors({ stops: 'Enter no more than six intermediate stops.' });
            return;
        }
        const payload = {
            ...form,
            customer_phone: sanitizePhone(form.customer_phone),
            service_item_id: form.service_item_id || null,
            store_id: selectedItem?.store_id || null,
            vehicle_class: form.vehicle_class || null,
            end_datetime: form.end_datetime || null,
            customer_email: form.customer_email || null,
            travel_reference: form.travel_reference || null,
            stops,
        };
        delete payload.estimated_fare;
        setSubmitting(true);
        router.post('/services/cabs/enquire', payload, {
            preserveScroll: true,
            onSuccess: () => setReceived(true),
            onError: (validation) => setErrors(validation),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md"
                aria-labelledby="cab-request-title">
                <DialogTitle id="cab-request-title">Request a cab trip</DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This is an enquiry, not a confirmed reservation or payable quotation.
                        Our team will verify the route, fare, vehicle and driver before confirming any booking.
                    </Alert>
                    {received && <Alert severity="success" sx={{ mb: 2 }} role="status">
                        Cab enquiry received. Check My Service Enquiries for updates. No payment has been taken.
                    </Alert>}
                    <Box component="form" id="cab-request-form" onSubmit={submit}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField select fullWidth label="Trip type" value={form.trip_type}
                                    onChange={(e) => setField('trip_type', e.target.value)}>
                                    {tripTypes.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField select fullWidth label="Preferred vehicle class" value={form.vehicle_class}
                                    onChange={(e) => setField('vehicle_class', e.target.value)} error={!!errors.vehicle_class}
                                    helperText={errors.vehicle_class || 'Preference only; availability is not guaranteed'}>
                                    <MenuItem value="">No preference</MenuItem>
                                    {classes.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                                </TextField>
                            </Grid>
                            {availableItems.length > 0 && <Grid size={{ xs: 12 }}>
                                <TextField select fullWidth label="Published cab service (optional)" value={form.service_item_id}
                                    onChange={(e) => setField('service_item_id', e.target.value)}
                                    error={!!errors.service_item_id} helperText={errors.service_item_id || 'Only published options are listed. No vehicle is reserved.'}>
                                    <MenuItem value="">Let the team recommend an option</MenuItem>
                                    {availableItems.filter((item) => item.status === 'available' || item.status === 'active')
                                        .map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                </TextField>
                            </Grid>}
                            {[
                                ['pickup_location', 'Pickup address'], ['drop_location', 'Destination / return address'],
                            ].map(([field, label]) => <Grid key={field} size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth required label={label} value={form[field]}
                                    onChange={(e) => setField(field, e.target.value)}
                                    inputProps={{ maxLength: 255 }} error={!!errors[field]} helperText={errors[field]} />
                            </Grid>)}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth required type="datetime-local" label="Pickup date and time"
                                    value={form.start_datetime} onChange={(e) => setField('start_datetime', e.target.value)}
                                    InputLabelProps={{ shrink: true }} inputProps={{ min: localDatetime() }}
                                    error={!!errors.start_datetime} helperText={errors.start_datetime} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth type="datetime-local" label="Expected return date and time (optional)"
                                    value={form.end_datetime} onChange={(e) => setField('end_datetime', e.target.value)}
                                    InputLabelProps={{ shrink: true }} inputProps={{ min: form.start_datetime }}
                                    error={!!errors.end_datetime} helperText={errors.end_datetime} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField fullWidth required type="number" label="Passengers" value={form.passengers}
                                    onChange={(e) => setField('passengers', e.target.value)} inputProps={{ min: 1, max: 30 }}
                                    error={!!errors.passengers} helperText={errors.passengers} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField fullWidth required type="number" label="Bags" value={form.bags}
                                    onChange={(e) => setField('bags', e.target.value)} inputProps={{ min: 0, max: 30 }}
                                    error={!!errors.bags} helperText={errors.bags} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Train / flight number (if relevant)" value={form.travel_reference}
                                    onChange={(e) => setField('travel_reference', e.target.value)}
                                    inputProps={{ maxLength: 40 }} error={!!errors.travel_reference}
                                    helperText={errors.travel_reference} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth multiline minRows={2}
                                    label="Intermediate stops (one per line, maximum six)" value={form.stops}
                                    onChange={(e) => setField('stops', e.target.value)}
                                    error={!!errors.stops} helperText={errors.stops} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth multiline minRows={2} label="Special requests (optional)"
                                    value={form.special_requests} onChange={(e) => setField('special_requests', e.target.value)}
                                    inputProps={{ maxLength: 1200 }} error={!!errors.special_requests}
                                    helperText={errors.special_requests} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth required label="Full name" value={form.customer_name}
                                    onChange={(e) => setField('customer_name', e.target.value)}
                                    error={!!errors.customer_name} helperText={errors.customer_name} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth required label="Mobile number" value={form.customer_phone}
                                    onChange={(e) => setField('customer_phone', e.target.value)}
                                    error={!!errors.customer_phone} helperText={errors.customer_phone} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth type="email" label="Email (optional)" value={form.customer_email}
                                    onChange={(e) => setField('customer_email', e.target.value)}
                                    error={!!errors.customer_email} helperText={errors.customer_email} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel control={<Checkbox checked={form.terms_acknowledged}
                                    onChange={(e) => setField('terms_acknowledged', e.target.checked)} />}
                                    label="I understand this is a request only. Final fare, cancellation/refund terms, vehicle and availability require confirmation." />
                                {errors.terms_acknowledged && <Typography color="error" variant="caption">{errors.terms_acknowledged}</Typography>}
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} disabled={submitting}>Close</Button>
                    <Button type="submit" form="cab-request-form" variant="contained"
                        disabled={submitting || received || !form.terms_acknowledged}
                        startIcon={submitting ? <CircularProgress size={16} /> : null}>
                        {submitting ? 'Sending...' : 'Send cab enquiry'}
                    </Button>
                </DialogActions>
            </Dialog>
            <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </>
    );
}

import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Alert, Box, Button, Card, CardContent, Chip, Grid, MenuItem,
    Stack, TextField, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow,
} from '@mui/material';
import AdminLayout from '../../../Layouts/AdminLayout';

const statusColor = {
    requested: 'warning',
    approved: 'info',
    in_transit: 'secondary',
    received: 'success',
    cancelled: 'default',
};

export default function BikeTransferIndex({
    transfers = [], bikes = [], stores = [],
    allowed_store_ids = null, is_super_admin = false,
}) {
    const { flash = {} } = usePage().props;
    const [form, setForm] = useState({ bike_id: '', to_store_id: '', reason: '' });
    const [busy, setBusy] = useState(false);
    const selectedBike = bikes.find((bike) => String(bike.id) === String(form.bike_id));
    const accessible = (id) => is_super_admin || (Array.isArray(allowed_store_ids) && allowed_store_ids.includes(Number(id)));

    const submit = (event) => {
        event.preventDefault();
        setBusy(true);
        router.post('/admin/bike-transfers', form, {
            onFinish: () => setBusy(false),
            onSuccess: () => setForm({ bike_id: '', to_store_id: '', reason: '' }),
        });
    };

    const act = (transfer, action) => {
        const prompts = {
            approve: 'Approve this bike transfer? This blocks new bookings for the bike.',
            dispatch: 'Confirm the bike has physically left the source branch?',
            receive: 'Confirm the bike has physically arrived and was checked in at the destination?',
            cancel: 'Cancel this transfer request?',
        };
        if (!window.confirm(prompts[action])) return;
        setBusy(true);
        router.post(`/admin/bike-transfers/${transfer.id}/${action}`, {}, { onFinish: () => setBusy(false) });
    };

    return (
        <AdminLayout title="Bike Branch Transfers">
            <Head title="Bike Branch Transfers | GK WhizWheel" />
            <Stack spacing={3}>
                <Box>
                    <Typography component="h1" variant="h4" fontWeight={800}>Bike Branch Transfers</Typography>
                    <Typography color="text.secondary">
                        Request, approve, dispatch and receive bikes between branches with a permanent audit trail.
                        The bike's physical location changes only after destination receipt.
                    </Typography>
                </Box>
                {flash.success && <Alert severity="success">{flash.success}</Alert>}
                <Alert severity="info">Transfers with active or future bookings are blocked. Approved or in-transit bikes are unavailable to new customers.</Alert>

                <Card variant="outlined">
                    <CardContent>
                        <Typography component="h2" variant="h6" fontWeight={700} mb={2}>Request a transfer</Typography>
                        <Box component="form" onSubmit={submit}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField select fullWidth required label="Bike" value={form.bike_id}
                                        onChange={(e) => setForm((p) => ({ ...p, bike_id: e.target.value }))}>
                                        {bikes.map((bike) => (
                                            <MenuItem key={bike.id} value={bike.id}>
                                                {bike.brand} {bike.model_name} ({bike.registration_number})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField fullWidth disabled label="Current branch"
                                        value={stores.find((store) => String(store.id) === String(selectedBike?.current_store_id))?.name || ''} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField select fullWidth required label="Destination branch" value={form.to_store_id}
                                        onChange={(e) => setForm((p) => ({ ...p, to_store_id: e.target.value }))}>
                                        {stores.filter((store) => String(store.id) !== String(selectedBike?.current_store_id)).map((store) => (
                                            <MenuItem key={store.id} value={store.id}>{store.name} ({store.city})</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Button variant="contained" fullWidth type="submit" disabled={busy || !form.bike_id || !form.to_store_id || !form.reason.trim()}
                                        sx={{ height: 55 }}>
                                        Request Transfer
                                    </Button>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField label="Reason / operational instructions" multiline minRows={2} required fullWidth
                                        value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent>
                        <Typography component="h2" variant="h6" fontWeight={700} mb={2}>Transfer history & pending actions</Typography>
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Bike</TableCell>
                                        <TableCell>From → To</TableCell>
                                        <TableCell>Requested by</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transfers.map((transfer) => (
                                        <TableRow key={transfer.id}>
                                            <TableCell>{transfer.bike?.name || 'Bike'} #{transfer.bike?.id}</TableCell>
                                            <TableCell>{transfer.source} → {transfer.destination}</TableCell>
                                            <TableCell>{transfer.requested_by || '—'}</TableCell>
                                            <TableCell><Chip size="small" color={statusColor[transfer.status] || 'default'} label={transfer.status.replaceAll('_', ' ')} /></TableCell>
                                            <TableCell sx={{ maxWidth: 220 }}>{transfer.reason}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
                                                    {transfer.status === 'requested' && is_super_admin && (
                                                        <Button disabled={busy} onClick={() => act(transfer, 'approve')} size="small" variant="outlined">Approve</Button>
                                                    )}
                                                    {transfer.status === 'approved' && accessible(transfer.from_store_id) && (
                                                        <Button disabled={busy} onClick={() => act(transfer, 'dispatch')} size="small" variant="outlined">Dispatch</Button>
                                                    )}
                                                    {transfer.status === 'in_transit' && accessible(transfer.to_store_id) && (
                                                        <Button disabled={busy} onClick={() => act(transfer, 'receive')} size="small" variant="contained">Confirm Receipt</Button>
                                                    )}
                                                    {['requested', 'approved'].includes(transfer.status) && accessible(transfer.from_store_id) && (
                                                        <Button disabled={busy} onClick={() => act(transfer, 'cancel')} color="error" size="small">Cancel</Button>
                                                    )}
                                                    {['received', 'cancelled'].includes(transfer.status) && 'Closed'}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!transfers.length && <TableRow><TableCell colSpan={6}>No transfers recorded yet.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Stack>
        </AdminLayout>
    );
}

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
    DialogContent, DialogTitle, FormControlLabel, Checkbox, MenuItem,
    Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, Pagination, CircularProgress,
} from '@mui/material';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function RelocationsIndex({
    tasks = { data: [], current_page: 1, last_page: 1, total: 0 },
    stores = [], filters = {}, can_confirm = false,
}) {
    const [selected, setSelected] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const close = () => {
        if (submitting) return;
        setSelected(null);
        setConfirmed(false);
        setError('');
    };

    const submitReceipt = () => {
        if (!selected || !confirmed || !can_confirm || submitting) return;
        setSubmitting(true);
        setError('');
        router.post(`/admin/relocations/${selected.id}/confirm-receipt`, {
            destination_store_id: selected.required_store_id,
            physical_receipt_confirmed: true,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelected(null);
                setConfirmed(false);
                setError('');
            },
            onError: (errors) => setError(Object.values(errors || {}).join(' ') || 'Unable to confirm this transfer.'),
            onFinish: () => setSubmitting(false),
        });
    };

    const storeName = (id) => stores.find((store) => Number(store.id) === Number(id))?.name || `Branch #${id}`;
    const filterStore = (id) => router.get('/admin/relocations', id ? { store_id: id } : {}, { preserveState: true });
    const selectPage = (_, page) => router.get('/admin/relocations', {
        ...(filters.store_id ? { store_id: filters.store_id } : {}), page,
    }, { preserveState: true, preserveScroll: true });

    return (
        <AdminLayout title="Bike Relocations">
            <Head title="Bike Relocations - GK WhizWheel" />
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <AltRouteIcon color="primary" />
                        <Typography variant="h5" fontWeight={800}>Fleet relocation tasks</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">Resolve vehicle location conflicts before the next confirmed pickup. Confirmation requires physical receipt.</Typography>
                </Box>
                <Button component={Link} href="/admin/dashboard" startIcon={<ArrowBackIcon />} variant="outlined">Dashboard</Button>
            </Stack>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ pb: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                        <Stack spacing={0.5}>
                            <Typography fontWeight={800}>Pending relocations <Chip size="small" label={tasks.total || 0} sx={{ ml: 1 }} /></Typography>
                            <Typography color="text.secondary" variant="caption">Assignments are filtered to your permitted branches.</Typography>
                        </Stack>
                        <TextField label="Required pickup branch" select size="small" value={filters.store_id || ''} sx={{ minWidth: 220 }} onChange={(e) => filterStore(e.target.value)}>
                            <MenuItem value="">All accessible branches</MenuItem>
                            {stores.map((store) => <MenuItem key={store.id} value={String(store.id)}>{store.name}</MenuItem>)}
                        </TextField>
                    </Stack>
                </CardContent>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" aria-label="Pending bike relocation tasks">
                        <TableHead>
                            <TableRow>
                                <TableCell>Bike</TableCell>
                                <TableCell>Current branch</TableCell>
                                <TableCell>Required branch</TableCell>
                                <TableCell>Upcoming booking</TableCell>
                                <TableCell>Pickup date</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(tasks.data || []).map((task) => (
                                <TableRow key={task.id} hover>
                                    <TableCell>
                                        <Typography fontWeight={700} variant="body2">{task.bike_registration || `Bike #${task.bike_id}`}</Typography>
                                        <Typography variant="caption" color="text.secondary">Task #{task.id}</Typography>
                                    </TableCell>
                                    <TableCell>{storeName(task.from_store_id)}</TableCell>
                                    <TableCell><Chip size="small" color="warning" variant="outlined" label={storeName(task.required_store_id)} /></TableCell>
                                    <TableCell>{task.affected_booking_reference || `#${task.affected_booking_id}`}</TableCell>
                                    <TableCell>{task.pickup_date || '—'}</TableCell>
                                    <TableCell align="right">
                                        {can_confirm ? (
                                            <Button variant="outlined" size="small" onClick={() => { setSelected(task); setConfirmed(false); setError(''); }}>Confirm receipt</Button>
                                        ) : (
                                            <Typography color="text.secondary" variant="caption">Superadmin review</Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!tasks.data || tasks.data.length === 0) && (
                                <TableRow><TableCell colSpan={6}>
                                    <Box py={5} textAlign="center">
                                        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                                        <Typography fontWeight={700}>No pending relocations</Typography>
                                        <Typography variant="body2" color="text.secondary">There are no outstanding pickup-location conflicts for the selected branch.</Typography>
                                    </Box>
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {(tasks.last_page || 1) > 1 && (
                    <Stack alignItems="center" sx={{ py: 2 }}>
                        <Pagination count={tasks.last_page} page={tasks.current_page} onChange={selectPage} />
                    </Stack>
                )}
            </Card>

            <Dialog open={Boolean(selected)} onClose={close} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm physical bike receipt</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Alert severity="warning">Confirm only after the bike is physically present at the receiving branch. This action updates its operational location.</Alert>
                        <Typography variant="body2">Bike: <strong>{selected?.bike_registration || `#${selected?.bike_id}`}</strong></Typography>
                        <Typography variant="body2">Receiving branch: <strong>{selected ? storeName(selected.required_store_id) : ''}</strong></Typography>
                        <Typography variant="body2">Affected pickup: <strong>{selected?.affected_booking_reference}</strong> ({selected?.pickup_date})</Typography>
                        <FormControlLabel control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />} label="I have verified that this bike is physically at the required branch." />
                        {error && <Alert severity="error">{error}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={close} disabled={submitting}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={submitReceipt} disabled={!confirmed || submitting} startIcon={submitting ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}>
                        Confirm receipt
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

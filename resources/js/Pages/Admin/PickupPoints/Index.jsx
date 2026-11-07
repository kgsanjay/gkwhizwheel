import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack,
    Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, MenuItem } from '@mui/material';

const blank = { store_id: '', name: '', address_line: '', landmark: '', latitude: '', longitude: '',
    delivery_fee: '0', pickup_fee: '', return_fee: '', supports_pickup: true, supports_return: true, sort_order: 0 };

export default function PickupPointsIndex({ stores = [], points = [] }) {
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
    const edit = (point) => {
        setEditingId(point.id);
        setForm({
            store_id: point.store_id,
            name: point.name,
            address_line: point.address_line || '',
            landmark: point.landmark || '',
            latitude: point.latitude ?? '',
            longitude: point.longitude ?? '',
            delivery_fee: point.delivery_fee ?? '0',
            pickup_fee: point.pickup_fee ?? '',
            return_fee: point.return_fee ?? '',
            supports_pickup: Boolean(point.supports_pickup),
            supports_return: Boolean(point.supports_return),
            sort_order: point.sort_order ?? 0,
        });
        setErrors({});
    };
    const save = (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        router.post(editingId ? `/admin/pickup-points/${editingId}` : '/admin/pickup-points', {
            ...form,
            pickup_fee: form.pickup_fee === '' ? null : Number(form.pickup_fee),
            return_fee: form.return_fee === '' ? null : Number(form.return_fee),
            latitude: form.latitude === '' ? null : Number(form.latitude),
            longitude: form.longitude === '' ? null : Number(form.longitude),
        }, {
            preserveScroll: true,
            onSuccess: () => { setForm(blank); setEditingId(null); setErrors({}); },
            onError: setErrors,
            onFinish: () => setSaving(false),
        });
    };
    return <AdminLayout title="Pickup & Return Points">
        <Head title="Pickup Points | G.K. WhizWheel" />
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4" fontWeight={800}>Branch pickup & return points</Typography>
                <Typography color="text.secondary" variant="body2">
                    Two operational branches can offer multiple pickup locations. Draft points are never shown to customers.
                    Confirm delivery availability, service hours and fees before publishing.
                </Typography>
            </Box>
            <Card variant="outlined"><CardContent>
                <Typography fontWeight={700} variant="h6">{editingId ? 'Edit pickup point' : 'Add pickup point'}</Typography>
                <Box component="form" onSubmit={save} sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth select required label="Branch" value={form.store_id}
                                onChange={(e) => set('store_id', e.target.value)}>
                                {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name} ({s.city})</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth required label="Pickup point name" value={form.name}
                                onChange={(e) => set('name', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth label="Landmark / meeting instructions" value={form.landmark}
                                onChange={(e) => set('landmark', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField fullWidth label="Address" value={form.address_line}
                                onChange={(e) => set('address_line', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField fullWidth label="Latitude" type="number" value={form.latitude}
                                onChange={(e) => set('latitude', e.target.value)}
                                slotProps={{ htmlInput: { step: 'any' } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField fullWidth label="Longitude" type="number" value={form.longitude}
                                onChange={(e) => set('longitude', e.target.value)}
                                slotProps={{ htmlInput: { step: 'any' } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField fullWidth label="Pickup charge ₹" type="number" value={form.pickup_fee}
                                onChange={(e) => set('pickup_fee', e.target.value)}
                                helperText="Leave blank until confirmed. Enter 0 only if free."
                                slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField fullWidth label="Return charge ₹" type="number" value={form.return_fee}
                                onChange={(e) => set('return_fee', e.target.value)}
                                helperText="Different from pickup; blank prevents paid checkout."
                                slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Switch checked={form.supports_pickup} onChange={(e) => set('supports_pickup', e.target.checked)} />
                                <Typography>Pickup allowed</Typography>
                                <Switch checked={form.supports_return} onChange={(e) => set('supports_return', e.target.checked)} />
                                <Typography>Return allowed</Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                    {Object.keys(errors).length > 0 && <Alert severity="error" sx={{ mt: 2 }}>{Object.values(errors).join(' ')}</Alert>}
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button type="submit" variant="contained" disabled={saving || !form.store_id}>Save pickup point</Button>
                        {editingId && <Button onClick={() => { setEditingId(null); setForm(blank); }}>Cancel edit</Button>}
                    </Stack>
                </Box>
            </CardContent></Card>
            <Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={700}>Locations by branch</Typography></CardContent>
                <TableContainer><Table size="small">
                    <TableHead><TableRow><TableCell>Branch</TableCell><TableCell>Location</TableCell>
                        <TableCell>Pickup fee</TableCell><TableCell>Return fee</TableCell><TableCell>Service</TableCell><TableCell>Status</TableCell><TableCell>Manage</TableCell></TableRow></TableHead>
                    <TableBody>{points.map((p) => <TableRow key={p.id}>
                        <TableCell>{p.store?.city || p.store?.name}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{p.name}</Typography>
                            <Typography color="text.secondary" variant="caption">{p.address_line || 'Address to be confirmed'}</Typography></TableCell>
                        <TableCell>{p.pickup_fee == null ? 'Not configured' : `₹${Number(p.pickup_fee).toFixed(2)}`}</TableCell>
                        <TableCell>{p.return_fee == null ? 'Not configured' : `₹${Number(p.return_fee).toFixed(2)}`}</TableCell>
                        <TableCell>{p.supports_pickup ? 'Pickup' : ''}{p.supports_pickup && p.supports_return ? ' / ' : ''}{p.supports_return ? 'Return' : ''}</TableCell>
                        <TableCell><Chip size="small" color={p.is_active ? 'success' : 'default'}
                            label={p.is_active ? 'Published' : 'Draft'} /></TableCell>
                        <TableCell><Stack direction="row" gap={1}>
                            <Button size="small" onClick={() => edit(p)}>Edit</Button>
                            <Button size="small" color={p.is_active ? 'warning' : 'success'}
                                onClick={() => router.post(`/admin/pickup-points/${p.id}/toggle`, {}, { preserveScroll: true })}>
                                {p.is_active ? 'Unpublish' : 'Publish'}
                            </Button>
                        </Stack></TableCell>
                    </TableRow>)}</TableBody>
                </Table></TableContainer>
            </Card>
        </Stack>
    </AdminLayout>;
}

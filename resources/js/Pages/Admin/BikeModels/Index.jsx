import React, { useMemo, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Alert, Box, Button, Card, CardContent, Chip, Collapse, Dialog, DialogActions,
    DialogContent, DialogTitle, Divider, Grid, MenuItem, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CategoryIcon from '@mui/icons-material/Category';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function BikeModelsIndex({ models = [], categories = [], stores = [], unlinked_units = 0 }) {
    const [open, setOpen] = useState(false);
    const [bulkModel, setBulkModel] = useState(null);
    const [bulkStore, setBulkStore] = useState('');
    const [bulkRows, setBulkRows] = useState([{ registration_number: '', odometer_reading: 0 }]);
    const [bulkErrors, setBulkErrors] = useState({});
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState('');
    const [rateEdits, setRateEdits] = useState({});
    const [rateSaving, setRateSaving] = useState(false);
    const rateKey = (modelId, storeId) => `${modelId}-${storeId}`;
    const editRates = (model, store) => {
        const key = rateKey(model.id, store.id);
        const configured = (model.branch_prices || []).find((rate) => Number(rate.store_id) === Number(store.id));
        return rateEdits[key] || {
            weekday_rate: configured?.weekday_rate ?? '',
            weekend_rate: configured?.weekend_rate ?? '',
        };
    };
    const saveRates = (event, model, store) => {
        event.preventDefault();
        if (rateSaving) return;
        setRateSaving(true);
        router.post(`/admin/bike-models/${model.id}/branch-prices`, {
            store_id: store.id,
            ...editRates(model, store),
        }, {
            preserveScroll: true,
            onFinish: () => setRateSaving(false),
        });
    };
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        category_id: '', brand: '', name: '', fuel_type: 'petrol', transmission: 'automatic', description: '',
    });
    const filtered = useMemo(() => models.filter((m) =>
        `${m.brand} ${m.name} ${m.category_name}`.toLowerCase().includes(search.toLowerCase())
    ), [models, search]);
    const storeName = (id) => stores.find((store) => Number(store.id) === Number(id))?.name || `Branch #${id}`;

    const startBulk = (model) => {
        setBulkModel(model);
        setBulkStore(stores.find((store) => store.id)?.id || '');
        setBulkRows([{ registration_number: '', odometer_reading: 0 }]);
        setBulkErrors({});
    };
    const changeRow = (index, key, value) => setBulkRows((rows) =>
        rows.map((row, i) => i === index ? { ...row, [key]: value } : row)
    );
    const submitBulk = (event) => {
        event.preventDefault();
        if (!bulkModel || !bulkStore || bulkProcessing || bulkRows.length === 0) return;
        setBulkErrors({});
        setBulkProcessing(true);
        router.post(`/admin/bike-models/${bulkModel.id}/bikes/bulk`, {
                store_id: bulkStore,
                bikes: bulkRows.map((row) => ({
                    registration_number: row.registration_number.trim().toUpperCase(),
                    odometer_reading: row.odometer_reading === '' ? 0 : Number(row.odometer_reading),
                })),
            }, {
                preserveScroll: true,
                onSuccess: () => setBulkModel(null),
                onError: setBulkErrors,
                onFinish: () => setBulkProcessing(false),
            });
    };

    const submit = (event) => {
        event.preventDefault();
        post('/admin/bike-models', {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); reset(); },
        });
    };

    return (
        <AdminLayout title="Bike Model Catalog">
            <Head title="Bike Models - GK WhizWheel Admin" />
            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CategoryIcon color="primary" />
                            <Typography variant="h5" fontWeight={800}>Bike Model Catalog</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            One catalog model per bike type, with individual registered vehicles tracked by their current branch.
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { clearErrors(); setOpen(true); }}>Add Bike Model</Button>
                </Stack>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                            <Typography variant="body2" color="text.secondary">Catalog models</Typography>
                            <Typography variant="h4" fontWeight={800}>{models.length}</Typography>
                        </CardContent></Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                            <Typography variant="body2" color="text.secondary">Linked physical bikes</Typography>
                            <Typography variant="h4" fontWeight={800}>{models.reduce((sum, model) => sum + model.total_units, 0)}</Typography>
                        </CardContent></Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                            <Typography variant="body2" color="text.secondary">Not yet assigned to models</Typography>
                            <Typography variant="h4" fontWeight={800}>{unlinked_units}</Typography>
                        </CardContent></Card>
                    </Grid>
                </Grid>

                {unlinked_units > 0 && (
                    <Alert severity="info">
                        {unlinked_units} physical bike(s) are not yet linked to a catalog model. Existing reservations continue to use individual bikes. Model assignment is a separate, reviewed operation.
                    </Alert>
                )}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
                            <Typography fontWeight={800}>Models and physical inventory</Typography>
                            <TextField size="small" label="Search models" value={search}
                                onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
                        </Stack>
                    </CardContent>
                    <TableContainer>
                        <Table size="small" aria-label="Bike models inventory">
                            <TableHead><TableRow>
                                <TableCell>Model</TableCell><TableCell>Category</TableCell>
                                <TableCell align="right">Total bikes</TableCell>
                                <TableCell>Physical branch inventory</TableCell><TableCell align="right">Details</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                                {filtered.map((model) => (
                                    <React.Fragment key={model.id}>
                                        <TableRow hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <TwoWheelerIcon color="action" />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={800}>{model.brand} {model.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{model.fuel_type} · {model.transmission}</Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{model.category_name || '—'}</TableCell>
                                            <TableCell align="right"><Chip size="small" label={model.total_units} /></TableCell>
                                            <TableCell>
                                                <Stack direction="row" gap={1} flexWrap="wrap">
                                                    {(model.branches || []).map((branch) =>
                                                        <Chip key={branch.store_id} size="small" variant="outlined"
                                                            label={`${branch.store_name}: ${branch.available_now} available / ${branch.total_units} total`} />
                                                    )}
                                                    {!model.branches?.length && <Typography variant="caption" color="text.secondary">No units linked</Typography>}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button size="small" endIcon={expanded === model.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                    onClick={() => setExpanded(expanded === model.id ? null : model.id)}
                                                    aria-expanded={expanded === model.id}>
                                                    {expanded === model.id ? 'Hide' : 'View bikes'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow><TableCell colSpan={5} sx={{ py: 0, px: 2 }}>
                                            <Collapse in={expanded === model.id} unmountOnExit>
                                                <Box sx={{ py: 2 }}>
                                                    <Typography fontWeight={700} variant="subtitle2" sx={{ mb: 1 }}>Individual physical vehicles</Typography>
                                                    {(model.units || []).length === 0
                                                        ? <Typography variant="body2" color="text.secondary">No registered bikes are linked to this model yet.</Typography>
                                                        : (model.units || []).map((bike) =>
                                                            <Stack key={bike.id} direction="row" alignItems="center" gap={2} sx={{ py: 0.7, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                                                                <Typography variant="body2" fontWeight={700}>{bike.registration_number}</Typography>
                                                                <Typography variant="body2" color="text.secondary">{storeName(bike.current_store_id)}</Typography>
                                                                <Chip size="small" label={bike.status.replaceAll('_', ' ')} />
                                                                <Button component={Link} href={`/admin/bikes/${bike.id}/edit`} size="small">View vehicle</Button>
                                                            </Stack>
                                                        )
                                                    }
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography fontWeight={700} variant="subtitle2" sx={{ mb: 1 }}>Branch-specific rental pricing (₹ / day)</Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                                        Set separate Mon–Thu and Fri–Sun prices per branch. If left unconfigured, existing bike rates continue to apply. Rates are used for quotes from this pickup branch.
                                                    </Typography>
                                                    <Stack spacing={1.5}>
                                                        {stores.map((store) => {
                                                            const prices = editRates(model, store);
                                                            const key = rateKey(model.id, store.id);
                                                            return (
                                                                <Box component="form" onSubmit={(event) => saveRates(event, model, store)} key={store.id}
                                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                    <Typography variant="body2" sx={{ width: 160 }}>{store.name}</Typography>
                                                                    <TextField size="small" type="number" label="Mon–Thu ₹" value={prices.weekday_rate}
                                                                        slotProps={{ htmlInput: { min: 0, step: '0.01' } }} required sx={{ width: 140 }}
                                                                        onChange={(event) => setRateEdits((prev) => ({ ...prev,
                                                                            [key]: { ...prices, weekday_rate: event.target.value } }))} />
                                                                    <TextField size="small" type="number" label="Fri–Sun ₹" value={prices.weekend_rate}
                                                                        slotProps={{ htmlInput: { min: 0, step: '0.01' } }} required sx={{ width: 140 }}
                                                                        onChange={(event) => setRateEdits((prev) => ({ ...prev,
                                                                            [key]: { ...prices, weekend_rate: event.target.value } }))} />
                                                                    <Button size="small" type="submit" variant="outlined" disabled={rateSaving}>Save rates</Button>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Button size="small" variant="contained" sx={{ mr: 1 }} startIcon={<AddIcon />} onClick={() => startBulk(model)}>
                                                        Add multiple bikes
                                                    </Button>
                                                    <Button component={Link} href="/admin/bikes/create" size="small" variant="outlined" startIcon={<AddIcon />}>
                                                        Register another physical bike
                                                    </Button>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                                        Individual registration supports catalog association. Bulk registration adds up to 50 bikes per batch at one branch.
                                                    </Typography>
                                                </Box>
                                            </Collapse>
                                        </TableCell></TableRow>
                                    </React.Fragment>
                                ))}
                                {filtered.length === 0 && <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography color="text.secondary">No models found. Create the first model to start organizing your fleet.</Typography>
                                </TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Stack>

            <Dialog open={Boolean(bulkModel)} onClose={() => !bulkProcessing && setBulkModel(null)} fullWidth maxWidth="md">
                <Box component="form" onSubmit={submitBulk}>
                    <DialogTitle>Register multiple {bulkModel?.brand} {bulkModel?.name} bikes</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <Alert severity="info">Each registration creates a distinct vehicle. Shared model specifications are copied automatically. All rows must be valid for this batch to be saved.</Alert>
                            <TextField select required fullWidth label="Home and current branch" value={bulkStore}
                                onChange={(e) => setBulkStore(e.target.value)}
                                error={Boolean(bulkErrors.store_id)} helperText={bulkErrors.store_id}>
                                {stores.map((store) => <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>)}
                            </TextField>
                            {bulkRows.map((row, index) => (
                                <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                                    <Typography variant="caption" sx={{ minWidth: 38 }}>#{index + 1}</Typography>
                                    <TextField required fullWidth size="small" label="Registration number"
                                        value={row.registration_number}
                                        onChange={(e) => changeRow(index, 'registration_number', e.target.value.toUpperCase())}
                                        error={Boolean(bulkErrors[`bikes.${index}.registration_number`])}
                                        helperText={bulkErrors[`bikes.${index}.registration_number`]} />
                                    <TextField size="small" type="number" label="Odometer (km)" sx={{ minWidth: 150 }}
                                        value={row.odometer_reading}
                                        onChange={(e) => changeRow(index, 'odometer_reading', e.target.value)}
                                        inputProps={{ min: 0 }} />
                                    <Button color="inherit" disabled={bulkRows.length === 1 || bulkProcessing}
                                        onClick={() => setBulkRows((rows) => rows.filter((_, i) => i !== index))}>Remove</Button>
                                </Stack>
                            ))}
                            <Button variant="outlined" startIcon={<AddIcon />} disabled={bulkRows.length >= 50 || bulkProcessing}
                                onClick={() => setBulkRows((rows) => [...rows, { registration_number: '', odometer_reading: 0 }])}>
                                Add another registration ({bulkRows.length}/50)
                            </Button>
                            {Object.entries(bulkErrors).filter(([key]) => !key.startsWith('bikes.')).map(([key, message]) =>
                                <Alert severity="error" key={key}>{message}</Alert>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button disabled={bulkProcessing} onClick={() => setBulkModel(null)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={bulkProcessing || !bulkStore || bulkRows.some((row) => !row.registration_number.trim())}>
                            Register {bulkRows.length} bikes
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={open} onClose={() => !processing && setOpen(false)} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={submit}>
                    <DialogTitle>Create a bike model</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField select required label="Category" value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)} error={Boolean(errors.category_id)}
                                helperText={errors.category_id} fullWidth>
                                {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                            </TextField>
                            <TextField required label="Brand / Make" placeholder="Honda" value={data.brand} fullWidth
                                onChange={(e) => setData('brand', e.target.value)} error={Boolean(errors.brand)} helperText={errors.brand} />
                            <TextField required label="Model Name" placeholder="Activa 6G" value={data.name} fullWidth
                                onChange={(e) => setData('name', e.target.value)} error={Boolean(errors.name)} helperText={errors.name} />
                            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                <TextField select fullWidth required label="Fuel" value={data.fuel_type}
                                    onChange={(e) => setData('fuel_type', e.target.value)}>
                                    <MenuItem value="petrol">Petrol</MenuItem><MenuItem value="electric">Electric</MenuItem>
                                </TextField>
                                <TextField select fullWidth required label="Transmission" value={data.transmission}
                                    onChange={(e) => setData('transmission', e.target.value)}>
                                    <MenuItem value="automatic">Automatic</MenuItem><MenuItem value="manual">Manual</MenuItem>
                                </TextField>
                            </Stack>
                            <TextField fullWidth multiline minRows={2} label="Description (optional)"
                                value={data.description} onChange={(e) => setData('description', e.target.value)}
                                error={Boolean(errors.description)} helperText={errors.description} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpen(false)} disabled={processing}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing}>Create model</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </AdminLayout>
    );
}

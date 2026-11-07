import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState('');
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        category_id: '', brand: '', name: '', fuel_type: 'petrol', transmission: 'automatic', description: '',
    });
    const filtered = useMemo(() => models.filter((m) =>
        `${m.brand} ${m.name} ${m.category_name}`.toLowerCase().includes(search.toLowerCase())
    ), [models, search]);
    const storeName = (id) => stores.find((store) => Number(store.id) === Number(id))?.name || `Branch #${id}`;

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
                                                    <Button component={Link} href="/admin/bikes/create" size="small" variant="outlined" startIcon={<AddIcon />}>
                                                        Register another physical bike
                                                    </Button>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                                        Catalog association for newly registered bikes is not yet available in this form.
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

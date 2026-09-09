import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import MapPicker from '../../../Components/MapPicker';
import {
    Box,
    Typography,
    Grid,
    Button,
    TextField,
    MenuItem,
    Paper,
    Stack,
    Divider,
    Alert,
    CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PlaceIcon from '@mui/icons-material/Place';
import StorefrontIcon from '@mui/icons-material/Storefront';

export default function StoresCreate({
    statuses = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address_line: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '',
        latitude: 12.9716,
        longitude: 77.5946,
        phone: '',
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/stores');
    };

    const handleMapCoordinatesChange = ({ latitude, longitude }) => {
        setData((prev) => ({
            ...prev,
            latitude,
            longitude,
        }));
    };

    return (
        <AdminLayout title="Add Store Hub">
            <Head title="Add Store Hub - Admin" />

            {/* Top Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    component={Link}
                    href="/admin/stores"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 2, textTransform: 'none' }}
                >
                    Back to Store Hubs
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Add Store Hub
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Configure a new physical pickup & dropoff location. Use the OpenStreetMap picker to pinpoint exact GPS coordinates.
                </Typography>
            </Box>

            {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Please correct the errors in the form below.
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    {/* Left Column: Hub Information */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', mb: 3 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                                <StorefrontIcon color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Hub Location Details
                                </Typography>
                            </Stack>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Store Hub Name"
                                        placeholder="e.g. Indiranagar Hub"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={Boolean(errors.name)}
                                        helperText={errors.name}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Full Address Line"
                                        placeholder="Building, street, landmark..."
                                        value={data.address_line}
                                        onChange={(e) => setData('address_line', e.target.value)}
                                        error={Boolean(errors.address_line)}
                                        helperText={errors.address_line}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="City"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        error={Boolean(errors.city)}
                                        helperText={errors.city}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="State"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        error={Boolean(errors.state)}
                                        helperText={errors.state}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Pincode"
                                        placeholder="560038"
                                        value={data.pincode}
                                        onChange={(e) => setData('pincode', e.target.value)}
                                        error={Boolean(errors.pincode)}
                                        helperText={errors.pincode}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Hub Phone Number"
                                        placeholder="9876500001"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        error={Boolean(errors.phone)}
                                        helperText={errors.phone}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Operational Status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        error={Boolean(errors.status)}
                                        helperText={errors.status}
                                    >
                                        {statuses.map((s) => (
                                            <MenuItem key={s.value} value={s.value}>
                                                {s.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Right Column: OpenStreetMap / Leaflet Picker */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', mb: 3 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                <PlaceIcon color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Interactive GPS Map Picker
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Drag the pin or click on the map to set the store coordinates accurately for rider pickups and navigation.
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {/* Map Picker Component */}
                            <MapPicker
                                latitude={data.latitude}
                                longitude={data.longitude}
                                onChange={handleMapCoordinatesChange}
                                height="380px"
                            />

                            {/* Numeric Coordinates Sync */}
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        label="Latitude"
                                        value={data.latitude}
                                        onChange={(e) => setData('latitude', Number(e.target.value))}
                                        inputProps={{ step: '0.000001', min: '-90', max: '90' }}
                                        error={Boolean(errors.latitude)}
                                        helperText={errors.latitude}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        label="Longitude"
                                        value={data.longitude}
                                        onChange={(e) => setData('longitude', Number(e.target.value))}
                                        inputProps={{ step: '0.000001', min: '-180', max: '180' }}
                                        error={Boolean(errors.longitude)}
                                        helperText={errors.longitude}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Submit Bar */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button component={Link} href="/admin/stores" sx={{ textTransform: 'none' }}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={processing}
                                startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                sx={{ textTransform: 'none', borderRadius: 2, px: 3.5, fontWeight: 700 }}
                            >
                                Save Store Hub
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
}

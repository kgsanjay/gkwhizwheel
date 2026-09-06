import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Paper,
    Stack,
    Divider,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import Co2Icon from '@mui/icons-material/Co2';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

export default function BikesCreate({
    categories = [],
    stores = [],
    fuel_types = [],
    transmissions = [],
    statuses = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        brand: '',
        model_name: '',
        registration_number: '',
        category_id: categories[0]?.id || '',
        home_store_id: stores[0]?.id || '',
        current_store_id: stores[0]?.id || '',
        fuel_type: fuel_types[0]?.value || 'petrol',
        transmission: transmissions[0]?.value || 'manual',
        odometer_reading: 0,
        base_daily_rate_override: '',
        deposit_amount_override: '',
        status: 'available',
        next_service_due_date: '',
        primary_image: null,
        // Documents array: RC, Insurance, Emission
        documents: [
            { document_type: 'rc', file: null, expiry_date: '' },
            { document_type: 'insurance', file: null, expiry_date: '' },
            { document_type: 'emission_certificate', file: null, expiry_date: '' },
        ],
    });

    const [imagePreview, setImagePreview] = useState(null);

    const handlePrimaryImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('primary_image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDocFileChange = (index, file) => {
        const newDocs = [...data.documents];
        newDocs[index].file = file;
        setData('documents', newDocs);
    };

    const handleDocExpiryChange = (index, date) => {
        const newDocs = [...data.documents];
        newDocs[index].expiry_date = date;
        setData('documents', newDocs);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/bikes', {
            forceFormData: true,
        });
    };

    const docLabels = [
        { title: 'Registration Certificate (RC)', type: 'rc', icon: <BadgeIcon sx={{ color: 'primary.main' }} /> },
        { title: 'Vehicle Insurance Policy', type: 'insurance', icon: <SecurityIcon sx={{ color: 'secondary.main' }} /> },
        { title: 'Emission Certificate (PUC)', type: 'emission_certificate', icon: <Co2Icon sx={{ color: 'success.main' }} /> },
    ];

    return (
        <AdminLayout title="Add New Bike to Fleet">
            <Head title="Add New Bike - GkWhizWheel Admin" />

            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button
                        component={Link}
                        href="/admin/bikes"
                        startIcon={<ArrowBackIcon />}
                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                    >
                        Fleet Inventory
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Onboard New Bike
                    </Typography>
                </Box>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    {/* Left Column: Vehicle Specs & Hub Assignment */}
                    <Grid item xs={12} md={7}>
                        {/* 1. Basic Specifications */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TwoWheelerIcon color="primary" /> Vehicle Specifications
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Brand / Make"
                                        placeholder="e.g. Royal Enfield, Ather, Honda"
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                        error={Boolean(errors.brand)}
                                        helperText={errors.brand}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Model Name"
                                        placeholder="e.g. Hunter 350, 450X, Activa 6G"
                                        value={data.model_name}
                                        onChange={(e) => setData('model_name', e.target.value)}
                                        error={Boolean(errors.model_name)}
                                        helperText={errors.model_name}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Registration Number"
                                        placeholder="e.g. KA-05-MH-2002"
                                        value={data.registration_number}
                                        onChange={(e) => setData('registration_number', e.target.value.toUpperCase())}
                                        error={Boolean(errors.registration_number)}
                                        helperText={errors.registration_number}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        required
                                        fullWidth
                                        size="small"
                                        label="Vehicle Category"
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        error={Boolean(errors.category_id)}
                                        helperText={errors.category_id}
                                    >
                                        {categories.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {c.name} (Base ₹{c.base_daily_rate}/d)
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        required
                                        fullWidth
                                        size="small"
                                        label="Fuel Type"
                                        value={data.fuel_type}
                                        onChange={(e) => setData('fuel_type', e.target.value)}
                                    >
                                        {fuel_types.map((f) => (
                                            <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        required
                                        fullWidth
                                        size="small"
                                        label="Transmission"
                                        value={data.transmission}
                                        onChange={(e) => setData('transmission', e.target.value)}
                                    >
                                        {transmissions.map((t) => (
                                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        type="number"
                                        fullWidth
                                        size="small"
                                        label="Initial Odometer (km)"
                                        value={data.odometer_reading}
                                        onChange={(e) => setData('odometer_reading', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Initial Fleet Status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        {statuses.map((s) => (
                                            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* 2. Hub Assignment & Pricing Overrides */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Hub Assignment & Pricing Overrides
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        required
                                        fullWidth
                                        size="small"
                                        label="Home Hub"
                                        value={data.home_store_id}
                                        onChange={(e) => setData('home_store_id', e.target.value)}
                                    >
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        required
                                        fullWidth
                                        size="small"
                                        label="Current Physical Hub"
                                        value={data.current_store_id}
                                        onChange={(e) => setData('current_store_id', e.target.value)}
                                    >
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        type="number"
                                        fullWidth
                                        size="small"
                                        label="Daily Rate Override (Optional ₹)"
                                        placeholder="Leave empty to use category default"
                                        value={data.base_daily_rate_override}
                                        onChange={(e) => setData('base_daily_rate_override', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        type="number"
                                        fullWidth
                                        size="small"
                                        label="Deposit Override (Optional ₹)"
                                        placeholder="Leave empty to use category default"
                                        value={data.deposit_amount_override}
                                        onChange={(e) => setData('deposit_amount_override', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Right Column: Photos and Legal Documents */}
                    <Grid item xs={12} md={5}>
                        {/* Primary Photo Upload */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Vehicle Primary Photo
                            </Typography>

                            <Box
                                sx={{
                                    border: '2px dashed',
                                    borderColor: imagePreview ? 'secondary.main' : 'divider',
                                    borderRadius: 3,
                                    p: 2.5,
                                    textAlign: 'center',
                                    bgcolor: imagePreview ? 'transparent' : 'background.default',
                                    cursor: 'pointer',
                                }}
                                component="label"
                            >
                                <input
                                    type="file"
                                    hidden
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePrimaryImageChange}
                                />
                                {imagePreview ? (
                                    <Box
                                        component="img"
                                        src={imagePreview}
                                        alt="Preview"
                                        sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2 }}
                                    />
                                ) : (
                                    <Box sx={{ py: 3 }}>
                                        <CloudUploadIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            Upload Vehicle Photo
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            JPG, PNG or WEBP (Max 5MB)
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>

                        {/* Legal Documents & Expiry Dates */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                                Regulatory Documents
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
                                Upload legal documents with expiry date tracking for automated expiry alerts.
                            </Typography>

                            <Stack spacing={2.5}>
                                {docLabels.map((item, idx) => (
                                    <Box key={item.type} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            {item.icon}
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {item.title}
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} sm={7}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    component="label"
                                                    fullWidth
                                                    startIcon={<CloudUploadIcon />}
                                                    sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.8 }}
                                                >
                                                    {data.documents[idx].file ? data.documents[idx].file.name.substring(0, 18) + '...' : 'Choose PDF / Image'}
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept=".pdf,image/jpeg,image/png"
                                                        onChange={(e) => handleDocFileChange(idx, e.target.files[0] || null)}
                                                    />
                                                </Button>
                                            </Grid>
                                            <Grid item xs={12} sm={5}>
                                                <TextField
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    label="Expiry Date"
                                                    InputLabelProps={{ shrink: true }}
                                                    value={data.documents[idx].expiry_date}
                                                    onChange={(e) => handleDocExpiryChange(idx, e.target.value)}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>

                        {/* Submit Actions */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                component={Link}
                                href="/admin/bikes"
                                variant="outlined"
                                disabled={processing}
                                sx={{ textTransform: 'none', px: 3, borderRadius: 2 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                disabled={processing}
                                startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
                                sx={{ textTransform: 'none', fontWeight: 700, px: 3, borderRadius: 2 }}
                            >
                                {processing ? 'Creating Bike...' : 'Register Bike in Fleet'}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </AdminLayout>
    );
}

import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import Co2Icon from '@mui/icons-material/Co2';
import DeleteIcon from '@mui/icons-material/Delete';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

export default function BikesEdit({
    bike = {},
    categories = [],
    stores = [],
    fuel_types = [],
    transmissions = [],
    statuses = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        brand: bike.brand || '',
        model_name: bike.model_name || '',
        registration_number: bike.registration_number || '',
        category_id: bike.category_id || '',
        home_store_id: bike.home_store_id || '',
        current_store_id: bike.current_store_id || '',
        fuel_type: bike.fuel_type || 'petrol',
        transmission: bike.transmission || 'manual',
        odometer_reading: bike.odometer_reading || 0,
        base_daily_rate_override: bike.base_daily_rate_override ?? '',
        deposit_amount_override: bike.deposit_amount_override ?? '',
        status: bike.status || 'available',
        next_service_due_date: bike.next_service_due_date || '',
        primary_image: null,
        documents: [
            {
                document_type: 'rc',
                file: null,
                expiry_date: bike.documents?.rc?.expiry_date || '',
            },
            {
                document_type: 'insurance',
                file: null,
                expiry_date: bike.documents?.insurance?.expiry_date || '',
            },
            {
                document_type: 'emission_certificate',
                file: null,
                expiry_date: bike.documents?.emission?.expiry_date || '',
            },
        ],
    });

    const [imagePreview, setImagePreview] = useState(bike.primary_image_url || null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        post(`/admin/bikes/${bike.id}`, {
            forceFormData: true,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(`/admin/bikes/${bike.id}`, {
            onSuccess: () => setDeleteDialogOpen(false),
        });
    };

    const docLabels = [
        { title: 'Registration Certificate (RC)', key: 'rc', icon: <BadgeIcon sx={{ color: 'primary.main' }} /> },
        { title: 'Vehicle Insurance Policy', key: 'insurance', icon: <SecurityIcon sx={{ color: 'secondary.main' }} /> },
        { title: 'Emission Certificate (PUC)', key: 'emission', icon: <Co2Icon sx={{ color: 'success.main' }} /> },
    ];

    return (
        <AdminLayout title={`Edit ${bike.brand} ${bike.model_name}`}>
            <Head title={`Edit Bike: ${bike.registration_number} - GkWhizWheel Admin`} />

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
                        Edit {bike.brand} {bike.model_name}
                    </Typography>
                    <Chip
                        label={bike.registration_number}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: 'primary.50', color: 'primary.dark' }}
                    />
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                    Decommission Bike
                </Button>
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
                                    >
                                        {categories.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
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
                                        label="Odometer (km)"
                                        value={data.odometer_reading}
                                        onChange={(e) => setData('odometer_reading', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Fleet Status"
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
                                        label="Daily Rate Override (₹)"
                                        placeholder="Category default"
                                        value={data.base_daily_rate_override}
                                        onChange={(e) => setData('base_daily_rate_override', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        type="number"
                                        fullWidth
                                        size="small"
                                        label="Deposit Override (₹)"
                                        placeholder="Category default"
                                        value={data.deposit_amount_override}
                                        onChange={(e) => setData('deposit_amount_override', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Right Column: Photos and Legal Documents */}
                    <Grid item xs={12} md={5}>
                        {/* Primary Photo */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Vehicle Photo
                            </Typography>

                            <Box
                                sx={{
                                    border: '2px dashed',
                                    borderColor: imagePreview ? 'secondary.main' : 'divider',
                                    borderRadius: 3,
                                    p: 2,
                                    textAlign: 'center',
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
                                    <Box>
                                        <Box
                                            component="img"
                                            src={imagePreview}
                                            alt="Preview"
                                            sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2 }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600, display: 'block', mt: 1 }}>
                                            Click to replace photo
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ py: 3 }}>
                                        <CloudUploadIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            Upload Vehicle Photo
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
                                Update compliance documents and expiry dates for real-time tracking.
                            </Typography>

                            <Stack spacing={2.5}>
                                {docLabels.map((item, idx) => {
                                    const existingDoc = bike.documents?.[item.key];
                                    return (
                                        <Box key={item.key} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {item.icon}
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                        {item.title}
                                                    </Typography>
                                                </Box>
                                                {existingDoc ? (
                                                    <Chip label="Uploaded" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                ) : (
                                                    <Chip label="Missing" color="warning" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                )}
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
                                                        {data.documents[idx].file
                                                            ? data.documents[idx].file.name.substring(0, 18) + '...'
                                                            : existingDoc ? 'Replace File' : 'Upload File'}
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
                                    );
                                })}
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
                                {processing ? 'Saving Changes...' : 'Update Bike Details'}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            {/* Delete Modal */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Decommission</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to remove <strong>{bike.brand} {bike.model_name}</strong> ({bike.registration_number}) from the fleet?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Confirm Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';

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
    const [isDragging, setIsDragging] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handlePrimaryImageChange = (file) => {
        if (file) {
            setData('primary_image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemovePrimaryImage = () => {
        setData('primary_image', null);
        setImagePreview(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handlePrimaryImageChange(file);
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
                    <Grid size={{ xs: 12, md: 7 }}>
                        {/* 1. Basic Specifications */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TwoWheelerIcon color="primary" /> Vehicle Specifications
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        type="number"
                                        fullWidth
                                        size="small"
                                        label="Odometer (km)"
                                        value={data.odometer_reading}
                                        onChange={(e) => setData('odometer_reading', e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Hub Assignment & Pricing Overrides
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                            <MenuItem key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                            <MenuItem key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                    <Grid size={{ xs: 12, md: 5 }}>
                        {/* Primary Photo Upload */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                        Vehicle Primary Photo
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Main vehicle showcase photo in customer catalog & mobile app
                                    </Typography>
                                </Box>
                                {imagePreview && (
                                    <Chip
                                        icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />}
                                        label={data.primary_image ? "New File" : "Current Photo"}
                                        color="success"
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                                    />
                                )}
                            </Box>

                            {imagePreview ? (
                                <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ position: 'relative', height: 220, bgcolor: 'background.default' }}>
                                        <Box
                                            component="img"
                                            src={imagePreview}
                                            alt="Vehicle preview"
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 10,
                                                right: 10,
                                                bgcolor: 'rgba(0,0,0,0.65)',
                                                backdropFilter: 'blur(6px)',
                                                borderRadius: 2,
                                                px: 1.2,
                                                py: 0.4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 700, fontSize: '0.72rem' }}>
                                                {data.primary_image?.size
                                                    ? `${(data.primary_image.size / (1024 * 1024)).toFixed(2)} MB`
                                                    : 'Active Image'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Action Bar */}
                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ p: 1.8, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                                {data.primary_image?.name || 'Existing vehicle photo'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                {data.primary_image ? 'Will replace current image on save' : 'Currently displayed in catalog'}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                component="label"
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                            >
                                                Replace
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={(e) => handlePrimaryImageChange(e.target.files?.[0] || null)}
                                                />
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="text"
                                                startIcon={<DeleteIcon />}
                                                onClick={handleRemovePrimaryImage}
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Remove
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>
                            ) : (
                                <Box
                                    component="label"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: isDragging ? 'secondary.main' : 'divider',
                                        borderRadius: 3,
                                        p: { xs: 3, sm: 4 },
                                        textAlign: 'center',
                                        bgcolor: isDragging ? 'rgba(245, 158, 11, 0.08)' : 'background.default',
                                        cursor: 'pointer',
                                        display: 'block',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: 'secondary.main',
                                            bgcolor: 'rgba(245, 158, 11, 0.04)',
                                        },
                                    }}
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => handlePrimaryImageChange(e.target.files?.[0] || null)}
                                    />

                                    <Box
                                        sx={{
                                            width: 58,
                                            height: 58,
                                            borderRadius: '50%',
                                            bgcolor: 'rgba(245, 158, 11, 0.12)',
                                            color: 'warning.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 1.8,
                                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                                        }}
                                    >
                                        <CloudUploadIcon sx={{ fontSize: 30 }} />
                                    </Box>

                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
                                        Drag & Drop Vehicle Image Here
                                    </Typography>

                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                        or <Box component="span" sx={{ color: 'secondary.main', fontWeight: 700, textDecoration: 'underline' }}>browse from your device</Box>
                                    </Typography>

                                    <Stack direction="row" spacing={0.8} justifyContent="center" sx={{ mb: 1.5 }}>
                                        <Chip size="small" label="JPG" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                        <Chip size="small" label="PNG" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                        <Chip size="small" label="WEBP" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                        <Chip size="small" label="Max 5MB" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                    </Stack>

                                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.72rem' }}>
                                        Recommendation: Horizontal photo (16:9 ratio, min. 1200×675 px)
                                    </Typography>
                                </Box>
                            )}

                            {errors.primary_image && (
                                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                    {errors.primary_image}
                                </Alert>
                            )}
                        </Paper>

                        {/* Legal Documents & Expiry Dates */}
                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                    Regulatory Documents
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Update compliance documents and expiry dates for real-time tracking.
                                </Typography>
                            </Box>

                            <Stack spacing={2}>
                                {docLabels.map((item, idx) => {
                                    const existingDoc = bike.documents?.[item.key];
                                    const hasNewFile = Boolean(data.documents[idx]?.file);
                                    const newFileName = data.documents[idx]?.file?.name;

                                    return (
                                        <Box
                                            key={item.key}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2.5,
                                                bgcolor: 'background.default',
                                                border: '1px solid',
                                                borderColor: hasNewFile ? 'success.light' : 'divider',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {item.icon}
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                                        {item.title}
                                                    </Typography>
                                                </Box>
                                                {hasNewFile ? (
                                                    <Chip
                                                        icon={<CheckCircleIcon sx={{ fontSize: '0.85rem !important' }} />}
                                                        label="New File"
                                                        color="success"
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                                    />
                                                ) : existingDoc ? (
                                                    <Chip
                                                        label="On File"
                                                        color="info"
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Missing"
                                                        color="warning"
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                                    />
                                                )}
                                            </Box>

                                            <Grid container spacing={1.5} alignItems="flex-start">
                                                <Grid size={{ xs: 12, sm: 6.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.6, display: 'block' }}>
                                                        Document File
                                                    </Typography>
                                                    <Button
                                                        variant={hasNewFile ? 'contained' : 'outlined'}
                                                        color={hasNewFile ? 'inherit' : 'primary'}
                                                        size="small"
                                                        component="label"
                                                        fullWidth
                                                        startIcon={hasNewFile ? <CheckCircleIcon color="success" /> : <CloudUploadIcon />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: 2,
                                                            py: 0.8,
                                                            fontWeight: hasNewFile ? 700 : 500,
                                                            fontSize: '0.82rem',
                                                            borderColor: hasNewFile ? 'success.main' : 'divider',
                                                            bgcolor: hasNewFile ? 'action.hover' : 'transparent',
                                                            justifyContent: 'flex-start',
                                                            px: 1.5,
                                                            height: 40,
                                                        }}
                                                    >
                                                        <Typography noWrap variant="caption" sx={{ fontWeight: 600 }}>
                                                            {hasNewFile
                                                                ? (newFileName.length > 20 ? newFileName.substring(0, 18) + '...' : newFileName)
                                                                : existingDoc ? 'Replace File' : 'Upload File'}
                                                        </Typography>
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept=".pdf,image/jpeg,image/png"
                                                            onChange={(e) => handleDocFileChange(idx, e.target.files?.[0] || null)}
                                                        />
                                                    </Button>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 5.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.6, display: 'block' }}>
                                                        Expiry Date
                                                    </Typography>
                                                    <TextField
                                                        type="date"
                                                        size="small"
                                                        fullWidth
                                                        value={data.documents[idx].expiry_date || ''}
                                                        onChange={(e) => handleDocExpiryChange(idx, e.target.value)}
                                                        sx={{
                                                            '& .MuiInputBase-root': {
                                                                borderRadius: 2,
                                                                fontSize: '0.82rem',
                                                                height: 40,
                                                            },
                                                        }}
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

import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import MultiImageUploader from '../../../../Components/MultiImageUploader';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Grid,
    Stack,
    Divider,
    InputAdornment,
    Alert,
    Chip,
    Paper,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArticleIcon from '@mui/icons-material/Article';

export default function ServiceItemCreate({ serviceConfig = {} }) {
    const [featureInput, setFeatureInput] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category: '',
        description: '',
        price_base: '',
        price_unit: Object.keys(serviceConfig.units || {})[0] || 'per_day',
        capacity: '',
        image_url: '',
        images: [],
        primary_image_index: null,
        documents: [],
        badge: '',
        features: [],
        status: 'available',
        sort_order: 0,
    });

    const docTypes = serviceConfig.document_types || {};
    const hasDocRequirements = Object.keys(docTypes).length > 0;

    const handleDocFileChange = (docType, file) => {
        const existing = [...data.documents];
        const idx = existing.findIndex((d) => d.document_type === docType);
        if (idx >= 0) {
            existing[idx] = { ...existing[idx], file };
        } else {
            existing.push({ document_type: docType, file, expiry_date: '', verified: true });
        }
        setData('documents', existing);
    };

    const handleDocExpiryChange = (docType, expiry_date) => {
        const existing = [...data.documents];
        const idx = existing.findIndex((d) => d.document_type === docType);
        if (idx >= 0) {
            existing[idx] = { ...existing[idx], expiry_date };
        } else {
            existing.push({ document_type: docType, file: null, expiry_date, verified: true });
        }
        setData('documents', existing);
    };

    const handleDocVerifiedChange = (docType, verified) => {
        const existing = [...data.documents];
        const idx = existing.findIndex((d) => d.document_type === docType);
        if (idx >= 0) {
            existing[idx] = { ...existing[idx], verified };
        } else {
            existing.push({ document_type: docType, file: null, expiry_date: '', verified });
        }
        setData('documents', existing);
    };

    const handleDocRemove = (docType) => {
        setData('documents', data.documents.filter((d) => d.document_type !== docType));
    };

    const handleAddFeature = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            if (featureInput.trim()) {
                setData('features', [...data.features, featureInput.trim()]);
                setFeatureInput('');
            }
        }
    };

    const handleRemoveFeature = (indexToRemove) => {
        setData('features', data.features.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/services/${serviceConfig.slug}/items`);
    };

    return (
        <AdminLayout title={`Add New ${serviceConfig.item_label}`}>
            <Head title={`Add ${serviceConfig.item_label} - Admin`} />

            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
                <Box sx={{ mb: 3 }}>
                    <Button
                        component={Link}
                        href={`/admin/services/${serviceConfig.slug}/items`}
                        startIcon={<ArrowBackIcon />}
                        sx={{ textTransform: 'none', color: 'text.secondary', mb: 1 }}
                    >
                        Back to {serviceConfig.title} Inventory
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Add New {serviceConfig.item_label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Register a new vehicle, package, or offering for {serviceConfig.title.toLowerCase()}.
                    </Typography>
                </Box>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* Item Name */}
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        label={`${serviceConfig.item_label} Name`}
                                        required
                                        fullWidth
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={Boolean(errors.name)}
                                        helperText={errors.name || 'e.g. Toyota Innova Crysta AC 7-Seater, Sunset Mangrove Cruise'}
                                    />
                                </Grid>

                                {/* Category */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Category / Subtype"
                                        fullWidth
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        error={Boolean(errors.category)}
                                        helperText={errors.category || 'e.g. SUV, Speedboat, Cottage'}
                                    />
                                    {serviceConfig.categories && serviceConfig.categories.length > 0 && (
                                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {serviceConfig.categories.map((cat) => (
                                                <Chip
                                                    key={cat}
                                                    label={cat}
                                                    size="small"
                                                    variant={data.category === cat ? 'filled' : 'outlined'}
                                                    color={data.category === cat ? 'primary' : 'default'}
                                                    onClick={() => setData('category', cat)}
                                                    sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Grid>

                                {/* Price Base & Unit */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Base Tariff / Rate (₹)"
                                        required
                                        type="number"
                                        fullWidth
                                        value={data.price_base}
                                        onChange={(e) => setData('price_base', e.target.value)}
                                        error={Boolean(errors.price_base)}
                                        helperText={errors.price_base}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CurrencyRupeeIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        label="Pricing Unit"
                                        required
                                        fullWidth
                                        value={data.price_unit}
                                        onChange={(e) => setData('price_unit', e.target.value)}
                                        error={Boolean(errors.price_unit)}
                                        helperText={errors.price_unit}
                                    >
                                        {Object.entries(serviceConfig.units || {}).map(([val, lbl]) => (
                                            <MenuItem key={val} value={val}>
                                                {lbl} ({val})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Capacity & Badge */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Capacity / Seating"
                                        fullWidth
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', e.target.value)}
                                        error={Boolean(errors.capacity)}
                                        helperText={errors.capacity || 'e.g. 7 Passengers, 10 Persons, 3 Guests'}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Highlight Badge (Optional)"
                                        fullWidth
                                        value={data.badge}
                                        onChange={(e) => setData('badge', e.target.value)}
                                        error={Boolean(errors.badge)}
                                        helperText={errors.badge || 'e.g. Bestseller, Family Favorite, Zero Deposit'}
                                    />
                                </Grid>

                                {/* Multi-Image Showcase & Gallery */}
                                <Grid item xs={12}>
                                    <MultiImageUploader
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        title={`${serviceConfig.item_label || 'Service'} Photos & Gallery`}
                                        helperText="Upload photos. Drag & drop to reorder, and click 'Make Primary' to choose the cover image."
                                    />
                                </Grid>

                                {/* Description */}
                                <Grid item xs={12}>
                                    <TextField
                                        label="Detailed Description"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        error={Boolean(errors.description)}
                                        helperText={errors.description || 'Highlight key benefits, route details, and inclusions.'}
                                    />
                                </Grid>

                                {/* Features Tags */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                        Included Highlights / Features
                                    </Typography>

                                    {serviceConfig.suggested_features && serviceConfig.suggested_features.length > 0 && (
                                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Quick-Add Common Inclusions:
                                            </Typography>
                                            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ gap: 0.6 }}>
                                                {serviceConfig.suggested_features.map((feat) => {
                                                    const isAdded = data.features.includes(feat);
                                                    return (
                                                        <Chip
                                                            key={feat}
                                                            label={isAdded ? `✓ ${feat}` : `+ ${feat}`}
                                                            size="small"
                                                            color={isAdded ? 'primary' : 'default'}
                                                            variant={isAdded ? 'filled' : 'outlined'}
                                                            onClick={() => {
                                                                if (isAdded) {
                                                                    setData('features', data.features.filter((f) => f !== feat));
                                                                } else {
                                                                    setData('features', [...data.features, feat]);
                                                                }
                                                            }}
                                                            sx={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: isAdded ? 700 : 500 }}
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Type custom feature and click Add..."
                                            value={featureInput}
                                            onChange={(e) => setFeatureInput(e.target.value)}
                                            onKeyDown={handleAddFeature}
                                        />
                                        <Button
                                            variant="outlined"
                                            onClick={handleAddFeature}
                                            sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
                                        >
                                            + Add
                                        </Button>
                                    </Box>

                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                        {data.features.map((feat, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    bgcolor: 'action.hover',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span>{feat}</span>
                                                <Typography
                                                    component="span"
                                                    onClick={() => handleRemoveFeature(idx)}
                                                    sx={{ cursor: 'pointer', color: 'error.main', fontWeight: 900, ml: 0.5 }}
                                                >
                                                    ×
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Grid>

                                {/* Certifications & Regulatory Documents (Only for services that need it) */}
                                {hasDocRequirements && (
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <VerifiedUserIcon color="primary" /> Certifications & Compliance Documents
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Upload official permits, licenses, or insurance documentation for this {serviceConfig.item_label.toLowerCase()}.
                                            </Typography>
                                        </Box>

                                        <Stack spacing={2}>
                                            {Object.entries(docTypes).map(([typeKey, cfg]) => {
                                                const docEntry = data.documents.find((d) => d.document_type === typeKey);
                                                return (
                                                    <Paper
                                                        key={typeKey}
                                                        variant="outlined"
                                                        sx={{ p: 2, borderRadius: 2, bgcolor: docEntry?.file ? 'action.hover' : 'background.paper' }}
                                                    >
                                                        <Grid container spacing={2} alignItems="center">
                                                            <Grid item xs={12} sm={5}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                    {cfg.label}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                                    {cfg.description}
                                                                </Typography>
                                                                {docEntry?.file && (
                                                                    <Chip
                                                                        icon={<ArticleIcon />}
                                                                        label={docEntry.file.name}
                                                                        size="small"
                                                                        color="primary"
                                                                        onDelete={() => handleDocRemove(typeKey)}
                                                                        sx={{ mt: 1, maxWidth: '100%' }}
                                                                    />
                                                                )}
                                                            </Grid>
                                                            <Grid item xs={12} sm={3}>
                                                                <Button
                                                                    variant={docEntry?.file ? 'outlined' : 'contained'}
                                                                    component="label"
                                                                    size="small"
                                                                    startIcon={<UploadFileIcon />}
                                                                    sx={{ textTransform: 'none', fontWeight: 700 }}
                                                                >
                                                                    {docEntry?.file ? 'Replace File' : 'Choose Document'}
                                                                    <input
                                                                        type="file"
                                                                        hidden
                                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                                        onChange={(e) => {
                                                                            if (e.target.files?.[0]) {
                                                                                handleDocFileChange(typeKey, e.target.files[0]);
                                                                            }
                                                                        }}
                                                                    />
                                                                </Button>
                                                            </Grid>
                                                            <Grid item xs={12} sm={4}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <TextField
                                                                        type="date"
                                                                        size="small"
                                                                        label="Expiry Date"
                                                                        InputLabelProps={{ shrink: true }}
                                                                        value={docEntry?.expiry_date || ''}
                                                                        onChange={(e) => handleDocExpiryChange(typeKey, e.target.value)}
                                                                        sx={{ minWidth: 140 }}
                                                                    />
                                                                    <FormControlLabel
                                                                        control={
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={docEntry?.verified ?? true}
                                                                                onChange={(e) => handleDocVerifiedChange(typeKey, e.target.checked)}
                                                                            />
                                                                        }
                                                                        label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Verified</Typography>}
                                                                    />
                                                                </Stack>
                                                            </Grid>
                                                        </Grid>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    </Grid>
                                )}

                                {/* Status & Sorting */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        label="Availability Status"
                                        fullWidth
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        error={Boolean(errors.status)}
                                    >
                                        <MenuItem value="available">Available (Ready for Booking)</MenuItem>
                                        <MenuItem value="maintenance">In Maintenance / Servicing</MenuItem>
                                        <MenuItem value="booked">Booked / Reserved</MenuItem>
                                        <MenuItem value="inactive">Inactive / Hidden</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        type="number"
                                        label="Display Sort Order"
                                        fullWidth
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        helperText="Lower numbers appear first"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                                        <Button
                                            component={Link}
                                            href={`/admin/services/${serviceConfig.slug}/items`}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="secondary"
                                            disabled={processing}
                                            startIcon={<SaveIcon />}
                                            sx={{ fontWeight: 800, textTransform: 'none', px: 4 }}
                                        >
                                            {processing ? 'Saving...' : `Save ${serviceConfig.item_label}`}
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </AdminLayout>
    );
}

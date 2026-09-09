import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

export default function ServiceItemEdit({ serviceConfig = {}, item = {} }) {
    const [featureInput, setFeatureInput] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        name: item.name || '',
        category: item.category || '',
        description: item.description || '',
        price_base: item.price_base || '',
        price_unit: item.price_unit || Object.keys(serviceConfig.units || {})[0] || 'per_day',
        capacity: item.capacity || '',
        image_url: item.image_url || '',
        badge: item.badge || '',
        features: item.features || [],
        status: item.status || 'available',
        sort_order: item.sort_order || 0,
    });

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
        put(`/admin/services/${serviceConfig.slug}/items/${item.id}`);
    };

    return (
        <AdminLayout title={`Edit ${item.name}`}>
            <Head title={`Edit ${item.name} - Admin`} />

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
                        Edit {serviceConfig.item_label}: {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Update rates, capacity, features, and operational availability.
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
                                        helperText={errors.name}
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
                                        helperText={errors.category}
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
                                        helperText={errors.capacity}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Highlight Badge"
                                        fullWidth
                                        value={data.badge}
                                        onChange={(e) => setData('badge', e.target.value)}
                                        error={Boolean(errors.badge)}
                                        helperText={errors.badge}
                                    />
                                </Grid>

                                {/* Image URL */}
                                <Grid item xs={12}>
                                    <TextField
                                        label="Image URL"
                                        fullWidth
                                        value={data.image_url}
                                        onChange={(e) => setData('image_url', e.target.value)}
                                        error={Boolean(errors.image_url)}
                                        helperText={errors.image_url}
                                    />
                                    {data.image_url && (
                                        <Box sx={{ mt: 1.5 }}>
                                            <Box
                                                component="img"
                                                src={data.image_url}
                                                alt="Preview"
                                                sx={{ height: 120, borderRadius: 2, objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </Box>
                                    )}
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
                                        helperText={errors.description}
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
                                                    const isAdded = data.features && data.features.includes(feat);
                                                    return (
                                                        <Chip
                                                            key={feat}
                                                            label={isAdded ? `✓ ${feat}` : `+ ${feat}`}
                                                            size="small"
                                                            color={isAdded ? 'primary' : 'default'}
                                                            variant={isAdded ? 'filled' : 'outlined'}
                                                            onClick={() => {
                                                                const current = data.features || [];
                                                                if (isAdded) {
                                                                    setData('features', current.filter((f) => f !== feat));
                                                                } else {
                                                                    setData('features', [...current, feat]);
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
                                        {data.features && data.features.map((feat, idx) => (
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
                                            color="primary"
                                            disabled={processing}
                                            startIcon={<SaveIcon />}
                                            sx={{ fontWeight: 800, textTransform: 'none', px: 4 }}
                                        >
                                            {processing ? 'Updating...' : 'Save Changes'}
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

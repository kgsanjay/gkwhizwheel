import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import {
    Alert, Box, Button, Card, CardContent, CircularProgress, Grid,
    MenuItem, Stack, TextField, Typography, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PageHead from '../../Components/SEO/PageHead';
import AppLayout from '../../Layouts/AppLayout';
import apiClient from '../../api/client';

export default function ModelShow({ model, stores = [], initialFilters = {} }) {
    const [pickupId, setPickupId] = useState(String(initialFilters.pickup_store_id || ''));
    const [returnId, setReturnId] = useState(String(initialFilters.return_store_id || initialFilters.pickup_store_id || ''));
    const [startDate, setStartDate] = useState(initialFilters.start_date || '');
    const [endDate, setEndDate] = useState(initialFilters.end_date || '');

    const datesValid = Boolean(pickupId && returnId && startDate && endDate && startDate <= endDate);
    const params = {
        pickup_store_id: pickupId,
        return_store_id: returnId,
        start_date: startDate,
        end_date: endDate,
        bike_model_id: model.id,
    };
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['bike-model-details-availability', params],
        queryFn: () => apiClient.get('/bike-models/availability', { params }),
        enabled: datesValid,
        retry: false,
    });
    const availability = data?.data?.[0] || null;
    const pickup = stores.find((s) => String(s.id) === pickupId);
    const returning = stores.find((s) => String(s.id) === returnId);
    const price = model.indicative_daily_rate;
    const canonical = `https://whizwheels.in${model.canonical_path}`;
    const title = `${model.brand} ${model.name} Bike Rental | GK WhizWheel`;
    const description = model.description || `Rent a ${model.brand} ${model.name} with GK WhizWheel. Compare availability at our branches, choose your rental dates and see the exact fare before payment.`;
    const beginBooking = () => {
        if (!datesValid || !availability?.is_available) return;
        router.get('/services/bikes/checkout', {
            bike_model_id: model.id,
            pickup_store_id: pickupId,
            return_store_id: returnId,
            start_date: startDate,
            end_date: endDate,
        });
    };
    const availabilityText = !datesValid
        ? 'Select branches and dates to check availability.'
        : isLoading ? 'Checking live availability…'
        : isError ? 'Availability could not be checked.'
        : `${availability?.available_units ?? 0} bike(s) available for selected dates`;

    return (
        <AppLayout>
            <PageHead title={title} description={description.slice(0, 160)}
                canonicalUrl={canonical}
                ogType="product"
                ogImage={model.primary_image_url || undefined}
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: `${model.brand} ${model.name}`,
                        description,
                        brand: { '@type': 'Brand', name: model.brand },
                        ...(model.primary_image_url ? { image: model.primary_image_url } : {}),
                        url: canonical,
                        ...(price !== null ? {
                            offers: {
                                '@type': 'Offer',
                                priceCurrency: 'INR',
                                price: price,
                                url: canonical,
                                description: 'Indicative category day rate; final price is calculated for the allocated vehicle and route.',
                            },
                        } : {}),
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whizwheels.in/' },
                            { '@type': 'ListItem', position: 2, name: 'Bike Rentals', item: 'https://whizwheels.in/services/bikes' },
                            { '@type': 'ListItem', position: 3, name: `${model.brand} ${model.name}`, item: canonical },
                        ],
                    },
                ]}
            />
            <Box component="main" sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
                <Button component={Link} href="/services/bikes" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
                    Back to bike rentals
                </Button>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ bgcolor: 'action.hover', minHeight: 300, display: 'grid', placeItems: 'center' }}>
                                {model.primary_image_url
                                    ? <Box component="img" alt={`${model.brand} ${model.name} rental bike`}
                                        src={model.primary_image_url} sx={{ width: '100%', maxHeight: 440, objectFit: 'contain' }} />
                                    : <TwoWheelerIcon aria-label="Bike model" sx={{ fontSize: 96, color: 'text.disabled' }} />}
                            </Box>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="overline" color="text.secondary">{model.category_name || 'Two-wheeler'}</Typography>
                                <Typography component="h1" variant="h3" fontWeight={850} sx={{ mb: 2 }}>
                                    {model.brand} {model.name}
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                    <Chip label={model.fuel_type} variant="outlined" />
                                    <Chip label={model.transmission} variant="outlined" />
                                    <Chip label={`${model.total_units} registered unit(s)`} variant="outlined" />
                                </Stack>
                                <Typography color="text.secondary">{description}</Typography>
                                {price !== null && <Typography fontWeight={750} sx={{ mt: 2 }}>
                                    Indicative base rate: ₹{Number(price).toLocaleString('en-IN')} / day
                                </Typography>}
                                <Typography variant="caption" color="text.secondary">
                                    Individual vehicles may have pricing overrides; exact rental, deposit, and any one-way fees are displayed after reservation and before checkout.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card variant="outlined" sx={{ borderRadius: 3, position: { md: 'sticky' }, top: { md: 95 } }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Check availability</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Choose where to collect and return your bike.
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField select fullWidth required label="Pickup branch" value={pickupId}
                                        onChange={(e) => { setPickupId(e.target.value); if (!returnId) setReturnId(e.target.value); }}>
                                        {stores.map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.name} ({s.city})</MenuItem>)}
                                    </TextField>
                                    <TextField select fullWidth required label="Return branch" value={returnId}
                                        onChange={(e) => setReturnId(e.target.value)}>
                                        {stores.map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.name} ({s.city})</MenuItem>)}
                                    </TextField>
                                    <TextField type="date" fullWidth required label="Pickup date" value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                                    <TextField type="date" fullWidth required label="Return date" value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                                    {isError && <Alert severity="error">{error?.message || 'Please check your dates.'}</Alert>}
                                    <Alert severity={datesValid && availability?.is_available ? 'success' : 'info'}>
                                        {availabilityText}
                                    </Alert>
                                    {isLoading && <CircularProgress size={22} aria-label="Checking bike availability" />}
                                    <Button variant="contained" color="secondary" size="large"
                                        disabled={!datesValid || isLoading || !availability?.is_available || isError}
                                        onClick={beginBooking}>Continue to Secure Checkout</Button>
                                    <Typography variant="caption" color="text.secondary">
                                        Instant hold via PhonePe, UPI & Cards. Zero password friction — Google 1-Tap & Auto-Account.
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </AppLayout>
    );
}

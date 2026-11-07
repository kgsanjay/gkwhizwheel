import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, Stack, Chip, Button, Alert,
    TextField, MenuItem, CircularProgress } from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import apiClient from '../../api/client';
import AuthModal from '../Auth/AuthModal';
import CheckoutModal from '../Booking/CheckoutModal';

export default function ModelRentalCatalog({ filters, stores, onModelsLoaded }) {
    const [returnStoreId, setReturnStoreId] = useState('');
    const [chosenModel, setChosenModel] = useState(null);
    const [loginOpen, setLoginOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [user, setUser] = useState(null);
    const pickupId = String(filters.store_id || '');
    const returnId = returnStoreId || pickupId;
    const ready = Boolean(pickupId && returnId && filters.start_date && filters.end_date
        && filters.start_date <= filters.end_date);
    const params = {
        ...(pickupId ? { pickup_store_id: pickupId } : {}),
        ...(returnId ? { return_store_id: returnId } : {}),
        ...(filters.start_date ? { start_date: filters.start_date } : {}),
        ...(filters.end_date ? { end_date: filters.end_date } : {}),
        ...(filters.category_id ? { category_id: filters.category_id } : {}),
    };
    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ['bike-model-catalog', params],
        queryFn: () => apiClient.get('/bike-models/catalog', { params }),
        retry: false,
    });
    const models = response?.data || [];
    const pickupStore = stores.find((s) => String(s.id) === pickupId);
    const returnStore = stores.find((s) => String(s.id) === returnId);

    const beginReservation = (model) => {
        setChosenModel(model);
        const hasToken = typeof window !== 'undefined'
            && (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
        if (!hasToken) {
            setLoginOpen(true);
        } else {
            setCheckoutOpen(true);
        }
    };

    return (
        <Box component="section" aria-labelledby="model-inventory-heading" sx={{ mb: 5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                <Box>
                    <Typography id="model-inventory-heading" component="h2" variant="h5" fontWeight={850}>
                        Choose your bike model
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        One card per model. Each reservation is assigned a separately registered physical bike.
                    </Typography>
                </Box>
                <TextField select size="small" label="Return branch" value={returnStoreId || pickupId}
                    onChange={(event) => setReturnStoreId(event.target.value)}
                    disabled={!pickupId} sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                    {stores.map((store) => <MenuItem key={store.id} value={String(store.id)}>{store.name}</MenuItem>)}
                </TextField>
            </Stack>
            {!ready && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Select a pickup branch and rental dates above to view how many bikes are available to book.
                    You can choose a different return branch here.
                </Alert>
            )}
            {isError && <Alert severity="error" sx={{ mb: 2 }}>
                {error?.message || 'Unable to load the bike model catalog.'}
            </Alert>}
            {isLoading && <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress aria-label="Loading bike models" /></Stack>}
            {!isLoading && !isError && models.length === 0 && (
                <Alert severity="info">There are no model-linked vehicles matching this category yet. Individual legacy bikes remain listed below.</Alert>
            )}
            <Grid container spacing={2.5}>
                {models.map((model) => (
                    <Grid key={model.bike_model_id} size={{ xs: 12, sm: 6, lg: 4 }}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ height: 190, bgcolor: 'action.hover', display: 'grid', placeItems: 'center' }}>
                                {model.primary_image_url
                                    ? <Box component="img" src={model.primary_image_url}
                                        alt={`${model.brand} ${model.name}`} loading="lazy"
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <TwoWheelerIcon sx={{ fontSize: 72, color: 'text.disabled' }} aria-hidden="true" />}
                            </Box>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1.4 }}>
                                <Typography variant="h6" component="h3" fontWeight={800}>
                                    {model.brand} {model.name}
                                </Typography>
                                <Stack direction="row" gap={1} flexWrap="wrap">
                                    <Chip label={model.category_name || 'Bike'} size="small" variant="outlined" />
                                    <Chip label={model.transmission} size="small" variant="outlined" />
                                    <Chip label={model.fuel_type} size="small" variant="outlined" />
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    <LocationOnIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    {pickupStore?.name || 'Choose pickup branch'}
                                </Typography>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography fontWeight={800} color={ready && model.available_units > 0 ? 'success.main' : 'text.primary'}>
                                            {ready ? `${model.available_units} available for these dates` : 'Select dates for availability'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {model.total_units} registered across branches
                                        </Typography>
                                    </Box>
                                </Stack>
                                {model.indicative_daily_rate !== null && (
                                    <Typography variant="body2">
                                        Indicative category rate: ₹{Number(model.indicative_daily_rate).toLocaleString('en-IN')}/day
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    Exact vehicle pricing, one-way fees and deposit are calculated after allocation, before payment.
                                </Typography>
                                <Button variant="contained" color="secondary" fullWidth sx={{ mt: 'auto' }}
                                    disabled={!ready || !model.is_available || isLoading}
                                    onClick={() => beginReservation(model)}>
                                    {!ready ? 'Choose dates and branch' : model.is_available ? 'Reserve this model' : 'Unavailable for selected dates'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)}
                onSuccess={(loggedUser) => { setUser(loggedUser); setLoginOpen(false); setCheckoutOpen(true); }} />
            {chosenModel && pickupStore && returnStore && (
                <CheckoutModal
                    key={`${chosenModel.bike_model_id}-${pickupId}-${returnId}-${filters.start_date}-${filters.end_date}`}
                    open={checkoutOpen} onClose={() => setCheckoutOpen(false)}
                    bike={{ brand: chosenModel.brand, model_name: chosenModel.name }}
                    bikeModelId={chosenModel.bike_model_id}
                    startDate={filters.start_date} endDate={filters.end_date}
                    pickupStore={pickupStore} returnStore={returnStore}
                    currentUser={user} selectedAddons={[]} couponCode="" quote={null}
                />
            )}
        </Box>
    );
}

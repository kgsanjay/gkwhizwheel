import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Box, Container, Typography, Button, Grid, Stack, TextField, MenuItem, Paper } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import BikeImage from './BikeImage';

const colors = {
    ink: '#123E43',
    body: '#46575A',
    teal: '#14565B',
    orange: '#C45D2C',
    paper: '#FFFFFF',
    cream: '#FAF8F1',
    line: '#DEE5E0',
};

const toLocalDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

export default function HomeHero({ stores = [], featuredBikes = [] }) {
    const today = toLocalDate(new Date());
    const initialEnd = toLocalDate(new Date(Date.now() + 2 * 86400000));
    const [pickupStore, setPickupStore] = useState('');
    const [returnStore, setReturnStore] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(initialEnd);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedStore = stores.find((store) => String(store.id) === pickupStore);
    const effectiveReturnStore = returnStore || pickupStore;
    const isOneWay = Boolean(pickupStore && effectiveReturnStore && effectiveReturnStore !== pickupStore);
    const canSearch = Boolean(pickupStore && startDate && endDate && startDate >= today && endDate >= startDate);

    const submitSearch = (event) => {
        event.preventDefault();
        if (!canSearch || isSubmitting) return;
        const params = new URLSearchParams({
            store_id: pickupStore,
            return_store_id: effectiveReturnStore,
            start_date: startDate,
            end_date: endDate,
        });
        setIsSubmitting(true);
        router.visit('/services/bikes?' + params.toString(), {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const heroBike = featuredBikes.find((bike) => bike.primary_image_url) || featuredBikes[0] || { brand: 'Honda', model_name: 'Activa' };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '9px',
            bgcolor: '#fff',
            '& fieldset': { borderColor: '#DDE4DE' },
            '&:hover fieldset': { borderColor: '#96ACA4' },
            '&.Mui-focused fieldset': { borderColor: colors.teal, borderWidth: 1.5 },
        },
        '& .MuiInputBase-input': { color: colors.ink },
        '& .MuiSelect-select': { color: colors.ink },
        '& .MuiInputLabel-root': { color: '#526064' },
        '& .MuiInputLabel-root.Mui-focused': { color: colors.teal },
    };

    return (
        <Box component="section" aria-labelledby="home-hero-title" sx={{ bgcolor: colors.cream, color: colors.ink, borderBottom: '1px solid #E9ECE5' }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 8 } }}>
                <Grid container spacing={{ xs: 4, lg: 7 }} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                            <Box sx={{ width: 22, height: 2, bgcolor: colors.orange }} />
                            <Typography sx={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 800, color: colors.teal }}>
                                Discover coastal Karnataka
                            </Typography>
                        </Stack>
                        <Typography id="home-hero-title" component="h1" sx={{
                            color: colors.ink,
                            fontWeight: 750,
                            fontSize: { xs: 'clamp(2.6rem, 9vw, 3.6rem)', md: 'clamp(3.2rem, 4.5vw, 4.65rem)' },
                            letterSpacing: '-.058em',
                            lineHeight: 1.07,
                            maxWidth: 750,
                        }}>
                            Explore the coast.<Box component="span" sx={{ display: 'block', color: colors.teal }}>Ride your way.</Box>
                        </Typography>
                        <Typography sx={{ color: colors.body, fontSize: { xs: 16, md: 18 }, lineHeight: 1.8, mt: 3, maxWidth: 590 }}>
                            Rent a scooter or motorcycle from Honnavar or Murudeshwar. Choose your pickup point, compare bikes and see the price before booking.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <Button component={Link} href="/services/bikes" variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{
                                bgcolor: colors.teal, color: '#fff', px: 3.5, py: 1.6, fontWeight: 750,
                                fontSize: 15, borderRadius: 1.25, boxShadow: 'none',
                                '&:hover': { bgcolor: colors.ink, boxShadow: 'none' },
                            }}>
                                Explore our bikes
                            </Button>
                            <Button component={Link} href="/locations" endIcon={<ArrowForwardRoundedIcon />} sx={{
                                color: colors.ink, px: 1, fontWeight: 750, fontSize: 15,
                                '&:hover': { color: colors.orange, bgcolor: 'transparent' },
                            }}>
                                Find a pickup branch
                            </Button>
                        </Stack>
                        <Stack direction="row" gap={2} flexWrap="wrap" sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E7E0' }}>
                            <Stack direction="row" gap={0.7} alignItems="center">
                                <PlaceOutlinedIcon sx={{ fontSize: 19, color: colors.orange }} />
                                <Typography sx={{ color: colors.body, fontSize: 13.5, fontWeight: 650 }}>Multiple pickup locations</Typography>
                            </Stack>
                            <Stack direction="row" gap={0.7} alignItems="center">
                                <SwapHorizRoundedIcon sx={{ fontSize: 19, color: colors.orange }} />
                                <Typography sx={{ color: colors.body, fontSize: 13.5, fontWeight: 650 }}>One-way returns where available</Typography>
                            </Stack>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{
                            bgcolor: '#E6EDE6', borderRadius: 2, overflow: 'hidden', height: { xs: 300, sm: 390, md: 475 },
                            position: 'relative', boxShadow: '0 24px 55px rgba(12,58,54,.08)',
                        }}>
                            <BikeImage bike={heroBike} alt="Featured G.K. WhizWheel rental bike" eager
                                sx={{ height: '100%', bgcolor: '#E6EDE6' }} />
                            <Box sx={{
                                position: 'absolute', left: { xs: 15, md: 24 }, right: { xs: 15, md: 24 }, bottom: { xs: 15, md: 24 },
                                bgcolor: '#fff', borderRadius: 1.5, p: { xs: 1.6, md: 2 }, boxShadow: '0 8px 28px rgba(0,0,0,.08)',
                            }}>
                                <Stack direction="row" spacing={1.4} alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography sx={{ color: colors.orange, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                                            Featured rental
                                        </Typography>
                                        <Typography sx={{ color: colors.ink, mt: .3, fontWeight: 750, fontSize: { xs: 15, md: 17 } }}>
                                            {[heroBike.brand, heroBike.model_name].filter(Boolean).join(' ')}
                                        </Typography>
                                    </Box>
                                    <Button component={Link} href="/services/bikes" aria-label="Browse rental bikes"
                                        sx={{ minWidth: 40, color: colors.teal, '&:hover': { bgcolor: '#F2F6F2' } }}>
                                        <ArrowForwardRoundedIcon />
                                    </Button>
                                </Stack>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
                <Paper component="form" onSubmit={submitSearch} elevation={0} sx={{
                    bgcolor: colors.paper, mt: { xs: 5, md: 7 }, p: { xs: 2.5, md: 3.5 },
                    border: '1px solid ' + colors.line, borderRadius: 2, boxShadow: '0 12px 34px rgba(18,62,67,.055)',
                }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 2.5 }}>
                        <Box>
                            <Typography component="h2" sx={{ fontWeight: 750, fontSize: { xs: 22, md: 25 }, letterSpacing: '-.035em', color: colors.ink }}>
                                Find your rental bike
                            </Typography>
                            <Typography sx={{ fontSize: 13.5, mt: .5, color: colors.body }}>Choose your pickup, return and rental dates.</Typography>
                        </Box>
                        {selectedStore && (
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: colors.teal }}>
                                Pickup: {selectedStore.city}
                            </Typography>
                        )}
                    </Stack>
                    <Grid container spacing={2} alignItems="stretch">
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <TextField select fullWidth required label="Pickup location" size="small" value={pickupStore} sx={fieldSx}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    const shouldFollowPickup = !returnStore || returnStore === pickupStore;
                                    setPickupStore(next);
                                    if (shouldFollowPickup) setReturnStore(next);
                                }}>
                                <MenuItem value="">Choose a branch</MenuItem>
                                {stores.map((store) => <MenuItem key={store.id} value={String(store.id)}>{store.public_name || store.name} ({store.city})</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <TextField select fullWidth label="Return location" size="small" value={returnStore} sx={fieldSx}
                                onChange={(event) => setReturnStore(event.target.value)}>
                                <MenuItem value="">Same as pickup</MenuItem>
                                {stores.map((store) => <MenuItem key={store.id} value={String(store.id)}>{store.public_name || store.name} ({store.city})</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                            <TextField type="date" fullWidth required label="Pickup date" size="small" value={startDate} sx={fieldSx}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
                                onChange={(event) => {
                                    setStartDate(event.target.value);
                                    if (endDate < event.target.value) setEndDate(event.target.value);
                                }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                            <TextField type="date" fullWidth required label="Return date" size="small" value={endDate} sx={fieldSx}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: startDate || today } }}
                                onChange={(event) => setEndDate(event.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 2 }}>
                            <Button fullWidth type="submit" disabled={!canSearch || isSubmitting} variant="contained" endIcon={<ArrowForwardRoundedIcon />}
                                sx={{ bgcolor: colors.orange, color: '#fff', minHeight: 41, fontWeight: 750, fontSize: 14,
                                    borderRadius: 1.2, boxShadow: 'none', '&:hover': { bgcolor: '#A94722', boxShadow: 'none' } }}>
                                {isSubmitting ? 'Searching…' : 'Search bikes'}
                            </Button>
                        </Grid>
                    </Grid>
                    <Typography sx={{ mt: 1.8, fontSize: 12.5, lineHeight: 1.6, color: colors.body }}>
                        {isOneWay
                            ? 'Different-branch return selected. Any applicable one-way fee is calculated and shown before payment.'
                            : 'Your final rental price and applicable terms are shown before checkout.'}
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}

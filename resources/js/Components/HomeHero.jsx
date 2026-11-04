import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Box, Container, Typography, Button, Grid, Stack, TextField, MenuItem, Paper } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';

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

    const heroBike = featuredBikes.find((bike) => bike.primary_image_url);

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '9px',
            bgcolor: '#fff',
            '& fieldset': { borderColor: '#DDE4DE' },
            '&:hover fieldset': { borderColor: '#96ACA4' },
            '&.Mui-focused fieldset': { borderColor: colors.teal, borderWidth: 1.5 },
        },
        '& .MuiInputLabel-root': { color: '#526064' },
        '& .MuiInputLabel-root.Mui-focused': { color: colors.teal },
    };

    return (
        <Box component="section" aria-labelledby="home-hero-title" sx={{ bgcolor: colors.cream, color: colors.ink, borderBottom: '1px solid #E9ECE5' }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 9 } }}>
                <Grid container spacing={{ xs: 4, lg: 7 }} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                            <Box sx={{ width: 22, height: 2, bgcolor: colors.orange }} />
                            <Typography sx={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 800, color: colors.teal }}>
                                Discover coastal Karnataka
                            </Typography>
                        </Stack>
                        <Typography id="home-hero-title" component="h1" sx={{
                            fontWeight: 750,
                            fontSize: { xs: 'clamp(2.55rem, 9vw, 3.4rem)', md: 'clamp(3.7rem, 5.2vw, 5.25rem)' },
                            letterSpacing: '-.058em',
                            lineHeight: 1.07,
                            maxWidth: 750,
                        }}>
                            Your coastal ride, <Box component="span" sx={{ color: colors.teal }}>your way.</Box>
                        </Typography>
                        <Typography sx={{ color: colors.body, fontSize: { xs: 16, md: 18 }, lineHeight: 1.8, mt: 3, maxWidth: 590 }}>
                            Pick up a bike in Honnavar or Murudeshwar. Choose your dates, explore our fleet, and see the full rental price before you book.
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
                            bgcolor: '#E2EBE5', borderRadius: 2, overflow: 'hidden', height: { xs: 245, sm: 320, md: 420 },
                            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {heroBike ? (
                                <Box component="img" src={heroBike.primary_image_url}
                                    alt={heroBike.brand + ' ' + heroBike.model_name + ' from G.K. WhizWheel rental fleet'}
                                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: { xs: 2, md: 3 } }} />
                            ) : (
                                <Box component="img" src="/images/services/two_wheelers.webp" alt="G.K. WhizWheel bike and scooter rentals"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <Box sx={{ position: 'absolute', bottom: 17, left: 17, right: 17, bgcolor: 'rgba(255,255,255,.96)', borderRadius: 1.25, px: 2, py: 1.3 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <TwoWheelerOutlinedIcon sx={{ fontSize: 22, color: colors.teal }} />
                                        <Typography sx={{ fontSize: 13.5, fontWeight: 750 }}>Find the right ride for your trip</Typography>
                                    </Stack>
                                    <ArrowForwardRoundedIcon sx={{ color: colors.orange, fontSize: 20 }} />
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

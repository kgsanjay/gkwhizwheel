import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import {
    Alert, Box, Breadcrumbs, Button, CircularProgress,
    Container, Grid, Paper, Stack, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AppLayout from '../../Layouts/AppLayout';
import CheckoutModal from '../../Components/Booking/CheckoutModal';
import apiClient from '../../api/client';
import MarketingPageHero, { marketingPanelSx } from '../../Components/Marketing/MarketingPageHero';

/**
 * Dedicated bike checkout page. The hold, account resolution, quote review and
 * gateway logic live in CheckoutModal and are shared with the older dialog flow.
 */
export default function BikeCheckout({
    bike, bikeModelId = null, pickupStore, returnStore,
    startDate, endDate, couponCode = '', selectedAddons = [], backUrl = '/services/bikes',
}) {
    const isDark = useTheme().palette.mode === 'dark';
    const isModel = Boolean(bikeModelId);
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['bike-full-page-quote', bike.id, startDate, endDate, pickupStore.id, returnStore.id, couponCode, selectedAddons],
        queryFn: () => apiClient.post(`/bikes/${bike.id}/price-quote`, {
            start_date: startDate,
            end_date: endDate,
            pickup_store_id: Number(pickupStore.id),
            return_store_id: Number(returnStore.id),
            coupon_code: couponCode || undefined,
            addons: selectedAddons,
        }),
        enabled: !isModel && Boolean(bike?.id),
        retry: false,
    });
    const quote = data?.data || null;
    const ready = isModel || Boolean(quote);

    return (
        <AppLayout>
            <Head title={`Secure Bike Checkout | ${bike.brand} ${bike.model_name} | GK WhizWheel`} />
            <Box sx={{ bgcolor: 'background.default', minHeight: '85vh', pb: { xs: 5, md: 9 } }}>
                <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 } }}>
                    <Breadcrumbs sx={{ mb: 2.5 }}>
                        <Link href="/services/bikes" style={{ color: '#475569', textDecoration: 'none' }}>Bike rentals</Link>
                        <Link href={backUrl} style={{ color: '#475569', textDecoration: 'none' }}>Bike details</Link>
                        <Typography color="text.primary" fontWeight={700}>Checkout</Typography>
                    </Breadcrumbs>
                    <Button component={Link} href={backUrl} startIcon={<ArrowBackIcon />}
                        sx={{ mb: 2, textTransform: 'none', fontWeight: 700 }}>
                        Edit bike, branches or dates
                    </Button>
                    <MarketingPageHero
                        eyebrow="SECURE BIKE CHECKOUT"
                        title="Complete your bike rental"
                        description="Review your trip, enter billing details and confirm the exact price before any payment begins."
                        icon={<SecurityIcon />}
                        compact
                    />
                    <Grid container spacing={3} alignItems="start">
                        <Grid size={{ xs: 12, md: 8 }}>
                            {isLoading && (
                                <Paper variant="outlined" sx={{ ...marketingPanelSx(isDark), p: 4, textAlign: 'center' }}>
                                    <CircularProgress size={28} sx={{ mb: 2 }} />
                                    <Typography>Checking availability and the latest rental price…</Typography>
                                </Paper>
                            )}
                            {isError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error?.message || 'The bike quote could not be loaded. Check the selected dates or try again.'}
                                    <Button component={Link} href={backUrl} size="small" sx={{ ml: 1 }}>Edit selection</Button>
                                </Alert>
                            )}
                            {ready && (
                                <CheckoutModal
                                    key={`${bikeModelId || bike.id}-${pickupStore.id}-${returnStore.id}-${startDate}-${endDate}`}
                                    presentation="page"
                                    open
                                    onClose={() => {}}
                                    bike={bike}
                                    bikeModelId={bikeModelId}
                                    startDate={startDate}
                                    endDate={endDate}
                                    pickupStore={pickupStore}
                                    returnStore={returnStore}
                                    selectedAddons={selectedAddons}
                                    couponCode={couponCode}
                                    quote={quote}
                                />
                            )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ ...marketingPanelSx(isDark), p: 3, position: { md: 'sticky' }, top: { md: 90 } }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{
                                    mb: 2.5, p: 2, borderRadius: 2.5,
                                    background: isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB',
                                    border: '1px solid rgba(245,158,11,0.25)',
                                }}>
                                    <TwoWheelerIcon sx={{ color: '#D97706', fontSize: 34 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={900}>{bike.brand} {bike.model_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Two-wheeler rental</Typography>
                                    </Box>
                                </Stack>
                                <Typography variant="body2" sx={{ mb: 1 }}><strong>Pickup:</strong> {pickupStore.name} · {startDate}</Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}><strong>Return:</strong> {returnStore.name} · {endDate}</Typography>
                                <Stack spacing={2} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">No refundable deposit for online bike reservations</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">Server-confirmed quote before payment</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <SecurityIcon fontSize="small" color="primary" />
                                        <Typography variant="body2">Secure payment via PhonePe or Razorpay</Typography>
                                    </Stack>
                                </Stack>
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Your rental voucher and billing statement become available in My Bookings according to booking status.
                                    A billing statement is not a GST tax invoice.
                                </Alert>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </AppLayout>
    );
}

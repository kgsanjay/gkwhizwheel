import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
import DirectionsIcon from '@mui/icons-material/Directions';
import apiClient from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    TextField,
    MenuItem,
    Paper,
    Divider,
    CircularProgress,
    Alert,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import AddonsSelector from '../../Components/Booking/AddonsSelector';
import AuthModal from '../../Components/Auth/AuthModal';
import CheckoutModal from '../../Components/Booking/CheckoutModal';

export default function BikeShow({ bike, stores = [] }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';
    const { auth } = usePage().props;
    const [currentUser, setCurrentUser] = useState(auth?.user || null);

    // Read query params from URL if passed from index page
    const searchParams = new URLSearchParams(window.location.search);
    const initialStart = searchParams.get('start_date') || '';
    const initialEnd = searchParams.get('end_date') || '';
    const initialPickup = searchParams.get('pickup_store_id') || String(bike.current_store_id || (stores[0]?.id || ''));

    const [startDate, setStartDate] = useState(initialStart);
    const [endDate, setEndDate] = useState(initialEnd);
    const [pickupStoreId, setPickupStoreId] = useState(initialPickup);
    const [returnStoreId, setReturnStoreId] = useState(initialPickup);
    const [couponCode, setCouponCode] = useState('');
    const [selectedAddons, setSelectedAddons] = useState([]);

    // Modal states
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

    const isElectric = bike.fuel_type === 'electric';
    const isOneWay = pickupStoreId !== '' && returnStoreId !== '' && pickupStoreId !== returnStoreId;

    const pickupStore = stores.find((s) => String(s.id) === String(pickupStoreId)) || { id: pickupStoreId, name: 'Store Hub' };
    const returnStore = stores.find((s) => String(s.id) === String(returnStoreId)) || { id: returnStoreId, name: 'Store Hub' };

    // Check token on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token && !currentUser) {
            apiClient.get('/user').then((res) => {
                if (res.data) setCurrentUser(res.data);
            }).catch(() => {});
        }
    }, []);

    // React Query: Fetch live price quote when dates and stores are present
    const canFetchQuote = Boolean(startDate && endDate && pickupStoreId && returnStoreId && startDate <= endDate);

    const quotePayload = {
        start_date: startDate,
        end_date: endDate,
        pickup_store_id: Number(pickupStoreId),
        return_store_id: Number(returnStoreId),
        coupon_code: couponCode.trim() || undefined,
        addons: selectedAddons,
    };

    const {
        data: quoteResponse,
        isLoading: isQuoteLoading,
        isError: isQuoteError,
        error: quoteError,
    } = useQuery({
        queryKey: ['price-quote', bike.id, quotePayload],
        queryFn: () => apiClient.post(`/bikes/${bike.id}/price-quote`, quotePayload),
        enabled: canFetchQuote,
        retry: false,
    });

    const quote = quoteResponse?.data;

    const handleBookNowClick = () => {
        const hasToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!currentUser && !hasToken) {
            setAuthModalOpen(true);
        } else {
            setCheckoutModalOpen(true);
        }
    };

    const handleAuthSuccess = (user) => {
        setCurrentUser(user);
        setCheckoutModalOpen(true);
    };

    return (
        <AppLayout>
            <Head title={`${bike.brand} ${bike.model_name} - Bike Rental in Honnavar`} />

            <Box sx={{ maxWidth: '1410px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
                {/* Back Navigation */}
                <Box sx={{ mb: 3 }}>
                    <Button
                        component={Link}
                        href="/bikes"
                        startIcon={<ArrowBackIcon />}
                        sx={{ color: '#64748B', fontWeight: 600 }}
                    >
                        Back to Fleet Catalog
                    </Button>
                </Box>

            {/* Main Details Grid */}
            <Grid container spacing={4}>
                {/* Left Column: Vehicle Overview, Specifications & Add-ons */}
                <Grid size={{ xs: 12, md: 7 }}>
                    {/* Vehicle Hero Card */}
                    <Card sx={{ mb: 4, overflow: 'hidden', bgcolor: isDark ? '#131D2F' : '#FFFFFF', border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                        <Box
                            sx={{
                                height: 280,
                                width: '100%',
                                position: 'relative',
                                bgcolor: isDark ? '#0B1120' : '#F1F5F9',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Box
                                component="img"
                                src={bike.primary_image_url || (bike.primary_image_path ? (bike.primary_image_path.startsWith('http') ? bike.primary_image_path : `/storage/${bike.primary_image_path}`) : null) || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'}
                                alt={`${bike.brand} ${bike.model_name}`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                }}
                            />

                            {/* Electric/Petrol chip */}
                            <Chip
                                icon={
                                    isElectric ? (
                                        <ElectricBoltIcon sx={{ color: '#F59E0B !important' }} />
                                    ) : (
                                        <LocalGasStationIcon sx={{ color: '#FFFFFF !important' }} />
                                    )
                                }
                                label={isElectric ? 'Electric Vehicle' : 'Petrol Engine'}
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    bgcolor: 'rgba(15, 23, 42, 0.88)',
                                    backdropFilter: 'blur(8px)',
                                    color: isElectric ? '#F59E0B' : '#FFFFFF',
                                    fontWeight: 800,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                            />

                            {/* Registration Badge */}
                            <Chip
                                label={bike.registration_number}
                                sx={{
                                    position: 'absolute',
                                    bottom: 16,
                                    left: 16,
                                    bgcolor: 'rgba(15, 23, 42, 0.88)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#FFFFFF',
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    letterSpacing: '0.08em',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                            />
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                                {bike.category?.name || 'Two-Wheeler'} • {bike.transmission || 'Automatic'}
                            </Typography>
                            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mt: 0.5, mb: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                {bike.brand} {bike.model_name}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                                <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? '#CBD5E1' : '#334155' }}>
                                    Current Store: {bike.current_store?.name || 'Honnavar Hub'} ({bike.current_store?.address_line})
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Specifications Table */}
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Vehicle Specifications
                            </Typography>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500, width: '40%' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{bike.category?.name || 'Standard'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Fuel / Power</TableCell>
                                        <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{bike.fuel_type}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Transmission</TableCell>
                                        <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{bike.transmission}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Odometer</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{bike.odometer_reading?.toLocaleString('en-IN') || 0} km</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Base Daily Rate</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                             ₹{Number(bike.base_daily_rate_override || bike.category?.base_daily_rate || 0).toLocaleString('en-IN')} / day
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B', fontWeight: 500 }}>Security Deposit</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#334155' }}>
                                             ₹{Number(bike.deposit_amount_override || bike.category?.default_deposit_amount || 0).toLocaleString('en-IN')} (Refundable)
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Add-ons Selector */}
                    <AddonsSelector
                        selectedAddons={selectedAddons}
                        onChange={(newAddons) => setSelectedAddons(newAddons)}
                    />

                    {/* Rental Policies Card */}
                    <Paper elevation={0} sx={{ p: 3, border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0', borderRadius: 3, bgcolor: isDark ? '#131D2F' : '#FFFFFF' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SecurityIcon color="primary" fontSize="small" />
                            Rental & Compliance Guarantees
                        </Typography>

                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.3 }} />
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Conforming Documents:</strong> Valid Insurance, Emission PUC, and digital Registration Certificate attached.
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.3 }} />
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Instant Refundable Deposit:</strong> Full refund processed via gateway back to original payment method upon return inspection.
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.3 }} />
                                <Typography variant="body2" color="text.secondary">
                                    <strong>One-Way Drop Permitted:</strong> Rent at Palya Main Rd, return at Honnavar Railway Station with dynamic store routing.
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column: Live Booking Dates & Price-Quote Calculator */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card
                        elevation={0}
                        sx={{
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                            bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                            borderRadius: 3,
                            position: 'sticky',
                            top: 80,
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ p: 3, bgcolor: '#0F172A', color: '#FFFFFF' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <ReceiptLongIcon sx={{ color: '#F59E0B' }} />
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                                    Reserve & Price Quote
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                                Select your rental period to view itemized live pricing.
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            {/* Date Selection */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Pickup Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Return Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </Grid>
                            </Grid>

                            {/* Store Selection */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Pickup Store"
                                        value={pickupStoreId}
                                        onChange={(e) => setPickupStoreId(e.target.value)}
                                    >
                                        {stores.map((s) => (
                                             <MenuItem key={s.id} value={s.id}>
                                                 {s.name}
                                             </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Return Store"
                                        value={returnStoreId}
                                        onChange={(e) => setReturnStoreId(e.target.value)}
                                    >
                                        {stores.map((s) => (
                                             <MenuItem key={s.id} value={s.id}>
                                                 {s.name}
                                             </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            {/* One-way rental banner */}
                            {isOneWay && (
                                <Alert severity="info" sx={{ mb: 2, fontSize: '0.8125rem' }}>
                                    One-way trip selected: Pick up at store and return to a different hub.
                                </Alert>
                            )}

                            {/* Optional Coupon code */}
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Coupon Code (Optional)"
                                    placeholder="e.g. WEEKEND10"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {/* Live Price Quote Breakdown Display */}
                            {!canFetchQuote && (
                                <Box sx={{ py: 3, textAlign: 'center', bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#F8FAFC', borderRadius: 2, border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #CBD5E1' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select both <strong>Pickup Date</strong> and <strong>Return Date</strong> to calculate your live quote.
                                    </Typography>
                                </Box>
                            )}

                            {canFetchQuote && isQuoteLoading && (
                                <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={32} color="secondary" />
                                    <Typography variant="caption" color="text.secondary">
                                        Calculating dynamic pricing & rules...
                                    </Typography>
                                </Box>
                            )}

                            {canFetchQuote && isQuoteError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {quoteError?.message || 'Unable to calculate quote for selected dates.'}
                                </Alert>
                            )}

                            {canFetchQuote && !isQuoteLoading && !isQuoteError && quote && (
                                <Box sx={{ bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', p: 2.5, borderRadius: 2, border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0', mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        Price Breakdown
                                    </Typography>

                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Base Rental
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ₹{Number(quote.base_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>

                                        {quote.pricing_adjustments_amount > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Weekend / Holiday Adjustments
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#EA580C' }}>
                                                    + ₹{Number(quote.pricing_adjustments_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {quote.one_way_fee_amount > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    One-Way Return Fee
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#EA580C' }}>
                                                    + ₹{Number(quote.one_way_fee_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {quote.addon_amount > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Add-ons & Equipment ({selectedAddons.length})
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                                    + ₹{Number(quote.addon_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {quote.discount_amount > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: '#10B981' }}>
                                                    Coupon Discount
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>
                                                    - ₹{Number(quote.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Refundable Deposit
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ₹{Number(quote.deposit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 1 }} />

                                        {/* Total Amount Due */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pt: 0.5 }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    Total Advance + Deposit
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                    Combined checkout charge
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                ₹{Number(quote.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            )}

                            {/* Booking Action Button */}
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                fullWidth
                                disabled={!canFetchQuote || isQuoteLoading || !quote}
                                onClick={handleBookNowClick}
                                sx={{
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)',
                                }}
                            >
                                Book This Bike (15m Hold)
                            </Button>

                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#64748B', mt: 1.5 }}>
                                Instant confirmation with Razorpay & PhonePe. Concurrency-safe reservation.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            </Box>

            {/* Authentication Dialog (if unauthenticated when Book Now clicked) */}
            <AuthModal
                open={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
            />

            {/* Reservation Checkout Dialog */}
            {quote && (
                <CheckoutModal
                    open={checkoutModalOpen}
                    onClose={() => setCheckoutModalOpen(false)}
                    bike={bike}
                    startDate={startDate}
                    endDate={endDate}
                    pickupStore={pickupStore}
                    returnStore={returnStore}
                    selectedAddons={selectedAddons}
                    couponCode={couponCode}
                    quote={quote}
                    currentUser={currentUser}
                />
            )}
        </AppLayout>
    );
}

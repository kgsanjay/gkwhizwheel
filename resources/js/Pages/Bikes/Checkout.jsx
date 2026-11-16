import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Breadcrumbs,
    useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import AppLayout from '../../Layouts/AppLayout';
import CheckoutModal from '../../Components/Booking/CheckoutModal';
import apiClient from '../../api/client';
import { useColorMode } from '../../theme/ColorModeContext';
import { getServicePlaceholder } from '../../utils/placeholder';

/**
 * Dedicated, authoritative bike rental checkout page.
 * Features server-side validated holds, account resolution, and PhonePe payment.
 */
export default function BikeCheckout({
    bike = {},
    bikeModelId = null,
    pickupStore = {},
    returnStore = {},
    startDate,
    endDate,
    pickupTime = '09:00',
    returnTime = '09:00',
    pickupPointId = null,
    returnPointId = null,
    couponCode = '',
    selectedAddons = [],
    backUrl = '/services/bikes',
}) {
    const theme = useTheme();
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const isModel = Boolean(bikeModelId);

    // Rental duration calculation
    const tripDuration = useMemo(() => {
        try {
            const start = new Date(`${startDate}T${pickupTime || '09:00'}`);
            const end = new Date(`${endDate}T${returnTime || '09:00'}`);
            const diffMs = end - start;
            if (diffMs <= 0) return { days: 1, hours: 24, label: '1 Day (24 Hours)' };
            const hours = Math.ceil(diffMs / (1000 * 60 * 60));
            const days = Math.max(1, Math.ceil(hours / 24));
            return {
                days,
                hours,
                label: `${days} Day${days > 1 ? 's' : ''} (${hours} Hours)`,
            };
        } catch {
            return { days: 1, hours: 24, label: '1 Day' };
        }
    }, [startDate, endDate, pickupTime, returnTime]);

    // Query quote for individual bike units
    const { data, isLoading, isError, error } = useQuery({
        queryKey: [
            'bike-full-page-quote',
            bike.id,
            startDate,
            endDate,
            pickupStore?.id,
            returnStore?.id,
            couponCode,
            selectedAddons,
        ],
        queryFn: () =>
            apiClient.post(`/bikes/${bike.id}/price-quote`, {
                start_date: startDate,
                end_date: endDate,
                pickup_time: pickupTime,
                return_time: returnTime,
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

    const vehicleTitle = `${bike.brand || 'GK'} ${bike.model_name || bike.name || 'Rental Bike'}`;
    const vehicleImage = bike.primary_image_url || bike.image_url || getServicePlaceholder('bikes');
    const whatsappContactUrl = `https://wa.me/91${(pickupStore.phone || '8660989586').replace(/\D/g, '')}?text=Hi%20GK%20WhizWheel%20${encodeURIComponent(pickupStore.city || pickupStore.name)}%20Hub,%20I%20have%20a%20question%20regarding%20my%20checkout%20for%20${encodeURIComponent(vehicleTitle)}.`;

    return (
        <AppLayout>
            <Head title={`Secure Bike Checkout | ${vehicleTitle} | GK WhizWheel`} />

            <Box
                component="main"
                sx={{
                    bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                    minHeight: '90vh',
                    py: { xs: 3, md: 5 },
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                }}
            >
                <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
                    {/* Top Header & Breadcrumbs Strip */}
                    <Box sx={{ mb: 3 }}>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem', mb: 1.5 }}>
                            <Link href="/" style={{ color: isDark ? '#94A3B8' : '#64748B', textDecoration: 'none' }}>
                                Home
                            </Link>
                            <Link href="/services/bikes" style={{ color: isDark ? '#94A3B8' : '#64748B', textDecoration: 'none' }}>
                                Bike Rentals
                            </Link>
                            <Typography sx={{ fontSize: '0.85rem', color: isDark ? '#CBD5E1' : '#334155', fontWeight: 600 }}>
                                {pickupStore.city || pickupStore.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: isDark ? '#38BDF8' : '#0D9488', fontWeight: 750 }}>
                                Secure Checkout
                            </Typography>
                        </Breadcrumbs>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: { xs: 'flex-start', md: 'center' },
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box>
                                <Button
                                    component={Link}
                                    href={backUrl}
                                    startIcon={<ArrowBackIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 750,
                                        fontSize: '0.85rem',
                                        p: 0,
                                        mb: 0.5,
                                        color: isDark ? '#38BDF8' : '#0F766E',
                                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                    }}
                                >
                                    Modify dates, location or vehicle model
                                </Button>
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    sx={{
                                        fontWeight: 900,
                                        fontSize: { xs: '1.75rem', sm: '2.25rem' },
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                        letterSpacing: '-0.025em',
                                    }}
                                >
                                    Complete Your Bike Reservation
                                </Typography>
                            </Box>

                            {/* SSL Encryption & Security Pill */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    icon={<LockIcon sx={{ fontSize: '0.95rem !important', color: '#10B981 !important' }} />}
                                    label="256-Bit SSL Encrypted Checkout"
                                    size="small"
                                    sx={{
                                        fontWeight: 750,
                                        fontSize: '0.75rem',
                                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                                        color: isDark ? '#34D399' : '#059669',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
                                    }}
                                />
                                <Chip
                                    icon={<VerifiedUserIcon sx={{ fontSize: '0.95rem !important', color: '#F59E0B !important' }} />}
                                    label="100% Legal Commercial Fleet"
                                    size="small"
                                    sx={{
                                        fontWeight: 750,
                                        fontSize: '0.75rem',
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                                        color: isDark ? '#FBBF24' : '#D97706',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Main Checkout Grid (Grid v2) */}
                    <Grid container spacing={{ xs: 3, lg: 4 }} alignItems="flex-start">
                        {/* Left Column (8 cols): Interactive Checkout Form & Payment Gateway */}
                        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 2, lg: 1 } }}>
                            {isLoading && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 6,
                                        borderRadius: 4,
                                        textAlign: 'center',
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                    }}
                                >
                                    <CircularProgress size={36} sx={{ color: isDark ? '#38BDF8' : '#0F766E', mb: 2 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', mb: 0.5 }}>
                                        Verifying fleet availability and server tariffs…
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                        Securing real-time allocation for {vehicleTitle} at {pickupStore.name}.
                                    </Typography>
                                </Paper>
                            )}

                            {isError && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 3,
                                        fontWeight: 650,
                                    }}
                                    action={
                                        <Button component={Link} href={backUrl} color="inherit" size="small" sx={{ fontWeight: 750 }}>
                                            Edit Selection
                                        </Button>
                                    }
                                >
                                    {error?.message || 'The rental quote could not be loaded. Please check your chosen dates or pick another model.'}
                                </Alert>
                            )}

                            {ready && (
                                <Box
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        boxShadow: isDark
                                            ? '0 16px 36px -8px rgba(0, 0, 0, 0.5)'
                                            : '0 16px 36px -8px rgba(15, 118, 110, 0.08)',
                                    }}
                                >
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
                                        initialPickupPointId={pickupPointId}
                                        initialReturnPointId={returnPointId}
                                        pickupTime={pickupTime}
                                        returnTime={returnTime}
                                    />
                                </Box>
                            )}
                        </Grid>

                        {/* Right Column (4 cols): Sticky Trip Itinerary & Reassurance Summary */}
                        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 1, lg: 2 } }}>
                            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 95 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Vehicle & Itinerary Summary Card */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                                        boxShadow: isDark
                                            ? '0 12px 28px -6px rgba(0, 0, 0, 0.4)'
                                            : '0 12px 28px -6px rgba(15, 118, 110, 0.08)',
                                    }}
                                >
                                    {/* Full-width Vehicle Showcase Hero */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            height: { xs: 200, sm: 220 },
                                            overflow: 'hidden',
                                            bgcolor: isDark ? '#0B1120' : '#E2E8F0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderBottom: 1,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={vehicleImage}
                                            alt={vehicleTitle}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center',
                                                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': { transform: 'scale(1.04)' },
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = getServicePlaceholder('bikes');
                                            }}
                                        />

                                        {/* Floating Category Pill */}
                                        <Chip
                                            label={bike.category_name || 'Scooter'}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                color: '#FFFFFF',
                                                backdropFilter: 'blur(8px)',
                                                border: 1,
                                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                            }}
                                        />

                                        {/* Floating Verified Fleet Pill */}
                                        <Chip
                                            icon={<CheckCircleIcon sx={{ fontSize: '0.85rem !important', color: '#10B981 !important' }} />}
                                            label="Verified Fleet"
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                color: '#FFFFFF',
                                                backdropFilter: 'blur(8px)',
                                                border: 1,
                                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                                        {/* Vehicle Info */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 850, color: isDark ? '#94A3B8' : '#64748B' }}>
                                                {bike.brand || 'GK Fleet'}
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 850, color: isDark ? '#F8FAFC' : '#0F172A', mb: 1 }}>
                                                {bike.model_name || bike.name}
                                            </Typography>

                                            {/* Specs Badges */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                <Chip
                                                    icon={<LocalGasStationIcon sx={{ fontSize: '0.85rem !important' }} />}
                                                    label={bike.fuel_type || 'Petrol'}
                                                    size="small"
                                                    sx={{ fontSize: '0.72rem', fontWeight: 750 }}
                                                />
                                                <Chip
                                                    icon={<SpeedIcon sx={{ fontSize: '0.85rem !important' }} />}
                                                    label={bike.transmission || 'Automatic'}
                                                    size="small"
                                                    sx={{ fontSize: '0.72rem', fontWeight: 750 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }} />

                                        {/* Trip Schedule Details */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                                                <LocationOnIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E', fontSize: 20, mt: 0.2 }} />
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                        Pickup Location & Time:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                        {pickupStore.name} ({pickupStore.city})
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 650 }}>
                                                        {startDate} at {pickupTime}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                                                <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 20, mt: 0.2 }} />
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                        Return Location & Time:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                        {returnStore.name} ({returnStore.city})
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 650 }}>
                                                        {endDate} at {returnTime}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Duration Pill */}
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.25,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0FDFA',
                                                    border: 1,
                                                    borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#CCFBF1',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#38BDF8' : '#0F766E' }}>
                                                    Total Trip Duration:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 850, color: '#F59E0B' }}>
                                                    {tripDuration.label}
                                                </Typography>
                                            </Paper>

                                            {/* Live Tariff & 18% GST Summary */}
                                            {quote && (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.06)' : '#F0FDF4',
                                                        border: 1,
                                                        borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#BBF7D0',
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                                            Rental Subtotal:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                            ₹{Number(quote.price_breakdown_json?.bike_gst?.taxable_amount || quote.base_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Box>
                                                    {quote.price_breakdown_json?.bike_gst?.status === 'configured' && (
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 750 }}>
                                                                GST (18% Statutory):
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 750, color: isDark ? '#34D399' : '#059669' }}>
                                                                +₹{Number(quote.price_breakdown_json.bike_gst.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    <Divider sx={{ my: 0.8, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#DCFCE7' }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 850, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                            Total Payable:
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                                                            ₹{Number(quote.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            )}
                                        </Box>

                                        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }} />

                                        {/* 4 Inclusions Checkmarks */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 17 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#334155' }}>
                                                    Zero Security Deposit (Instant Digital KYC)
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 17 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#334155' }}>
                                                    2 Sanitized ISI Helmets (Rider & Pillion Free)
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 17 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#334155' }}>
                                                    Comprehensive Commercial Fleet Insurance
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 17 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#334155' }}>
                                                    24/7 Roadside Rescue across Coastal Highway
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Payment Gateways & Concierge Card */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3.5,
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <PaymentIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E', fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 850, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                            PhonePe Payment Gateway
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 2, lineHeight: 1.5 }}>
                                        Instant confirmation via UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards & NetBanking.
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                        <Chip icon={<QrCode2Icon />} label="PhonePe UPI" size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                                        <Chip icon={<CreditCardIcon />} label="All Cards" size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                                        <Chip icon={<AccountBalanceIcon />} label="NetBanking" size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                                    </Box>

                                    <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }} />

                                    {/* Direct Concierge Contact */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                Need Booking Help?
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                {pickupStore.phone || '8660989586'}
                                            </Typography>
                                        </Box>
                                        <Button
                                            component="a"
                                            href={whatsappContactUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            size="small"
                                            startIcon={<WhatsAppIcon sx={{ color: '#10B981 !important' }} />}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: '0.78rem',
                                                color: '#10B981',
                                            }}
                                        >
                                            WhatsApp →
                                        </Button>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </AppLayout>
    );
}

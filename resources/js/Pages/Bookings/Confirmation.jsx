import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Alert,
    Container,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import DirectionsIcon from '@mui/icons-material/Directions';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import QrCode2Icon from '@mui/icons-material/QrCode2';

const formatInr = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatStoreAddress = (store) => {
    const parts = [store?.address_line, store?.city].filter(Boolean);
    const deduped = parts.filter((part, idx) => {
        if (idx === 0) return true;
        return !parts[0].toLowerCase().includes(part.toLowerCase());
    });
    const base = deduped.join(', ');
    if (store?.pincode && !base.includes(String(store.pincode))) {
        return `${base} - ${store.pincode}`;
    }
    return base || 'Honnavar, Karnataka';
};

const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
};

export default function BookingConfirmation({ booking, qrDataUri }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const bike = booking.bike || {};
    const pickupStore = booking.pickup_store || {};
    const returnStore = booking.return_store || {};
    const addons = booking.addons || [];
    const payments = booking.payments || [];
    const breakdown = booking.price_breakdown_json || {};
    const gst = booking.bike_gst || breakdown.bike_gst || null;
    const billing = booking.billing || breakdown.checkout_billing || null;

    const latestPayment = payments.find((p) => p.status === 'success') || payments[0] || null;
    const paymentMethodLabel = (latestPayment?.method || latestPayment?.payment_method || 'phonepe').toUpperCase();
    const isConfirmed = ['confirmed', 'handed_over', 'returned', 'completed'].includes(booking.status);
    const isAwaitingPayment = ['held', 'pending_payment'].includes(booking.status);
    const isOneWay = pickupStore.id && returnStore.id && pickupStore.id !== returnStore.id;
    const isElectric = bike.fuel_type === 'electric';

    const days = Number(breakdown.days || 1);
    const hours = Number(breakdown.hours || days * 24);
    const pickupTime = breakdown.pickup_time || '09:00';
    const returnTime = breakdown.return_time || '09:00';
    const locationFee = Number(booking.location_fee_amount ?? breakdown.location_fee_amount ?? 0);
    const totalAmount = Number(booking.total_amount || 0);
    const paidAmount = Number(booking.paid_amount || 0);
    const balanceDue = Number(booking.balance_due ?? Math.max(0, totalAmount - paidAmount));
    const depositAmount = Number(booking.deposit_amount || 0);
    const hasConfiguredGst = gst?.status === 'configured';
    const gstRate = Number(gst?.gst_rate_percent || 18);
    const halfGstRate = gstRate / 2;

    // Consistent theme tokens matching Checkout.jsx
    const surfaceBg = isDark ? '#131D2F' : '#FFFFFF';
    const subtleBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC';
    const borderCol = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
    const rowBorderCol = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9';
    const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';
    const textMuted = isDark ? '#CBD5E1' : '#334155';

    const cellBase = {
        py: 1.1,
        px: 0,
        borderColor: rowBorderCol,
        fontSize: '0.86rem',
    };

    return (
        <AppLayout>
            <Head title={`Booking ${booking.booking_reference} | GK WhizWheel`} />

            <Box
                component="main"
                sx={{
                    bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                    minHeight: '90vh',
                    py: { xs: 3, md: 4.5 },
                }}
            >
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
                    {/* Top Navigation & Primary Document Actions */}
                    <Box
                        sx={{
                            mb: 3,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'stretch', sm: 'center' },
                            gap: 1.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                component={Link}
                                href="/account"
                                startIcon={<ArrowBackIcon />}
                                size="small"
                                sx={{
                                    color: textMuted,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    px: 1.5,
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
                                }}
                            >
                                My Bookings
                            </Button>
                            <Typography variant="caption" sx={{ color: textSecondary }}>
                                /
                            </Typography>
                            <Button
                                component={Link}
                                href="/services/bikes"
                                size="small"
                                sx={{
                                    color: textSecondary,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    px: 1,
                                    borderRadius: 2,
                                }}
                            >
                                Browse Fleet
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                            {isConfirmed && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    component="a"
                                    href={`/bookings/${booking.id}/voucher`}
                                    download
                                    startIcon={<DownloadIcon />}
                                    sx={{
                                        bgcolor: '#D97706',
                                        color: '#FFFFFF',
                                        '&:hover': { bgcolor: '#B45309' },
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        px: 2,
                                        py: 0.9,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                                    }}
                                >
                                    Rental Voucher (PDF)
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                size="small"
                                component="a"
                                href={`/bookings/${booking.id}/billing-statement`}
                                startIcon={<ReceiptLongIcon />}
                                sx={{
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                    color: textPrimary,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    px: 1.75,
                                    py: 0.9,
                                    borderRadius: 2,
                                }}
                            >
                                Billing Statement (PDF)
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                component="a"
                                href={`/bookings/${booking.id}/print?autoprint=1`}
                                target="_blank"
                                startIcon={<PrintIcon />}
                                sx={{
                                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                    color: textPrimary,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    px: 1.75,
                                    py: 0.9,
                                    borderRadius: 2,
                                }}
                            >
                                Print Pass
                            </Button>
                        </Box>
                    </Box>

                    {/* Executive Confirmation Status Header */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, sm: 3.5 },
                            mb: 3,
                            bgcolor: surfaceBg,
                            border: 1,
                            borderColor: isConfirmed
                                ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0')
                                : borderCol,
                            borderRadius: 3.5,
                            boxShadow: isDark
                                ? '0 12px 30px rgba(0,0,0,0.35)'
                                : '0 10px 28px rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: { xs: 'flex-start', md: 'center' },
                                justifyContent: 'space-between',
                                gap: 2.5,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        flexShrink: 0,
                                        borderRadius: 3,
                                        bgcolor: isConfirmed
                                            ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5')
                                            : (isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFFBEB'),
                                        color: isConfirmed ? '#10B981' : '#F59E0B',
                                        border: 1,
                                        borderColor: isConfirmed
                                            ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0')
                                            : (isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {isConfirmed ? <CheckCircleIcon sx={{ fontSize: 32 }} /> : <ReceiptLongIcon sx={{ fontSize: 32 }} />}
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                        <Typography
                                            variant="h5"
                                            component="h1"
                                            sx={{ fontWeight: 900, color: textPrimary, letterSpacing: '-0.02em' }}
                                        >
                                            {isConfirmed
                                                ? 'Booking Confirmed!'
                                                : isAwaitingPayment
                                                    ? 'Payment Verification Pending'
                                                    : 'Booking Status Update'}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={(booking.status || 'UNKNOWN').replace('_', ' ').toUpperCase()}
                                            color={isConfirmed ? 'success' : 'warning'}
                                            sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: textSecondary, mb: 1.5, maxWidth: 560 }}>
                                        {isConfirmed
                                            ? 'Your bike is reserved and locked in our fleet ledger. Present your check-in pass or reference at pickup.'
                                            : isAwaitingPayment
                                                ? 'Your payment is being verified. Refresh shortly once the gateway confirms your transaction.'
                                                : 'Review your reservation details and billing statement below.'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip
                                            size="small"
                                            label={`Ref: ${booking.booking_reference}`}
                                            sx={{
                                                bgcolor: isDark ? 'rgba(56, 189, 248, 0.14)' : '#0F172A',
                                                color: isDark ? '#38BDF8' : '#FFFFFF',
                                                border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : 'none',
                                                fontFamily: 'monospace',
                                                fontWeight: 800,
                                                fontSize: '0.78rem',
                                            }}
                                        />
                                        {latestPayment && (
                                            <Chip
                                                size="small"
                                                icon={<AccountBalanceWalletIcon sx={{ fontSize: '15px !important' }} />}
                                                label={`Paid via ${paymentMethodLabel}`}
                                                sx={{
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                                    color: textMuted,
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Key Financial Snapshot Pill */}
                            <Paper
                                elevation={0}
                                sx={{
                                    px: 2.5,
                                    py: 1.75,
                                    borderRadius: 2.5,
                                    bgcolor: subtleBg,
                                    border: 1,
                                    borderColor: borderCol,
                                    minWidth: { xs: '100%', md: 240 },
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>
                                        Paid Online
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 850, fontVariantNumeric: 'tabular-nums' }}>
                                        {formatInr(paidAmount)}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 0.75, borderColor: rowBorderCol }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>
                                        {balanceDue > 0 ? 'Balance at Pickup' : 'Payment Status'}
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            color: balanceDue > 0 ? '#F59E0B' : '#10B981',
                                            fontWeight: 900,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {balanceDue > 0 ? formatInr(balanceDue) : 'Paid in Full'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Paper>

                    {/* Main 2-Column Standard Layout */}
                    <Grid container spacing={3} alignItems="flex-start">
                        {/* LEFT COLUMN (7 cols): QR Pass, Vehicle & Schedule, Handover */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            {/* Express Hub Check-In QR Pass */}
                            {isConfirmed && (booking.qr_data_uri || qrDataUri) && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 2.5, sm: 3 },
                                        mb: 3,
                                        bgcolor: surfaceBg,
                                        border: isDark ? '1.5px dashed rgba(45, 212, 191, 0.45)' : '1.5px dashed #0F766E',
                                        borderRadius: 3.5,
                                    }}
                                >
                                    <Grid container spacing={2.5} alignItems="center">
                                        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    bgcolor: '#FFFFFF',
                                                    borderRadius: 2.5,
                                                    border: '1px solid #CBD5E1',
                                                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <img
                                                    src={booking.qr_data_uri || qrDataUri}
                                                    alt={`Check-In QR for ${booking.booking_reference}`}
                                                    style={{ width: 128, height: 128, display: 'block', margin: '0 auto' }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        display: 'block',
                                                        mt: 0.75,
                                                        fontFamily: 'monospace',
                                                        fontWeight: 800,
                                                        color: '#0F172A',
                                                        fontSize: '0.72rem',
                                                    }}
                                                >
                                                    #{booking.booking_reference}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 8 }} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.75,
                                                    px: 1.25,
                                                    py: 0.4,
                                                    borderRadius: 1.5,
                                                    mb: 1,
                                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
                                                    color: isDark ? '#34D399' : '#065F46',
                                                    border: 1,
                                                    borderColor: isDark ? 'rgba(16, 185, 129, 0.28)' : '#A7F3D0',
                                                }}
                                            >
                                                <QrCode2Icon sx={{ fontSize: 16 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Express Hub Check-In Pass
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 850, color: textPrimary, mb: 0.5 }}>
                                                Instant Vehicle Handover Pass
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: textSecondary, mb: 1.5, lineHeight: 1.5 }}>
                                                Show this QR code on your phone to our ground executive at{' '}
                                                <strong style={{ color: textPrimary }}>{pickupStore.name || 'Honnavar Hub'}</strong> for fast key &amp; helmet handover. No printout required.
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                                                <Chip
                                                    size="small"
                                                    icon={<TwoWheelerIcon sx={{ fontSize: '15px !important' }} />}
                                                    label={`${bike.brand || ''} ${bike.model_name || 'Scooter'}`}
                                                    sx={{ fontWeight: 650, fontSize: '0.74rem' }}
                                                />
                                                <Chip
                                                    size="small"
                                                    icon={<VerifiedUserIcon sx={{ fontSize: '15px !important' }} />}
                                                    color="success"
                                                    variant="outlined"
                                                    label="Zero Security Deposit"
                                                    sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}

                            {/* Vehicle & Trip Schedule Card */}
                            <Card
                                elevation={0}
                                sx={{
                                    mb: 3,
                                    borderRadius: 3.5,
                                    overflow: 'hidden',
                                    bgcolor: surfaceBg,
                                    border: 1,
                                    borderColor: borderCol,
                                }}
                            >
                                <Box
                                    sx={{
                                        px: { xs: 2.5, sm: 3 },
                                        py: 2,
                                        bgcolor: isDark ? '#1E293B' : '#0F172A',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 1.5,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(245, 158, 11, 0.16)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <TwoWheelerIcon sx={{ color: '#F59E0B', fontSize: 24 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#FFFFFF', lineHeight: 1.2 }}>
                                                {bike.brand} {bike.model_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'capitalize' }}>
                                                {bike.category?.name || 'Two-Wheeler'} • {isElectric ? 'Electric EV' : (bike.fuel_type || 'Petrol')} • {bike.transmission || 'Automatic'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            size="small"
                                            label={`${days} Day${days > 1 ? 's' : ''} (${hours}h)`}
                                            sx={{
                                                bgcolor: 'rgba(56, 189, 248, 0.16)',
                                                color: '#38BDF8',
                                                fontWeight: 750,
                                                fontSize: '0.74rem',
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={bike.registration_number || 'REG-PENDING'}
                                            sx={{
                                                bgcolor: 'rgba(255, 255, 255, 0.14)',
                                                color: '#FFFFFF',
                                                fontFamily: 'monospace',
                                                fontWeight: 800,
                                                fontSize: '0.76rem',
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    <Typography
                                        variant="overline"
                                        sx={{ fontWeight: 800, color: textSecondary, letterSpacing: '0.08em', display: 'block', mb: 1.5 }}
                                    >
                                        Trip Schedule &amp; Hub Locations
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {/* Pickup Hub */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    height: '100%',
                                                    borderRadius: 2.5,
                                                    bgcolor: subtleBg,
                                                    border: 1,
                                                    borderColor: borderCol,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                                    <LocationOnIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#10B981', letterSpacing: '0.05em' }}>
                                                        Pickup Hub
                                                    </Typography>
                                                </Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary, mb: 0.25 }}>
                                                    {pickupStore.name || 'Honnavar Hub'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mb: 1.25, lineHeight: 1.4 }}>
                                                    {formatStoreAddress(pickupStore)}
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: textMuted }}>
                                                        <CalendarTodayIcon sx={{ fontSize: 13, color: textSecondary }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            {booking.start_date}
                                                        </Typography>
                                                        <AccessTimeIcon sx={{ fontSize: 13, color: textSecondary, ml: 0.5 }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            {pickupTime}
                                                        </Typography>
                                                    </Box>
                                                    {pickupStore.phone && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: textSecondary }}>
                                                            <PhoneIcon sx={{ fontSize: 13 }} />
                                                            <Typography variant="caption">{pickupStore.phone}</Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                                <Box
                                                    component="a"
                                                    href={
                                                        pickupStore.name && pickupStore.name.toLowerCase().includes('railway')
                                                            ? 'https://www.google.com/maps/dir/?api=1&destination=Honnavar+Railway+Station,+Karnataka'
                                                            : 'https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334'
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        color: isDark ? '#38BDF8' : '#0F766E',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 750,
                                                        textDecoration: 'none',
                                                        mt: 1.25,
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    <DirectionsIcon sx={{ fontSize: 14 }} /> Get Directions ↗
                                                </Box>
                                            </Paper>
                                        </Grid>

                                        {/* Return Hub */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    height: '100%',
                                                    borderRadius: 2.5,
                                                    bgcolor: subtleBg,
                                                    border: 1,
                                                    borderColor: borderCol,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                                    <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#F59E0B', letterSpacing: '0.05em' }}>
                                                        Return Hub {isOneWay ? '(One-Way)' : ''}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary, mb: 0.25 }}>
                                                    {returnStore.name || 'Honnavar Hub'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mb: 1.25, lineHeight: 1.4 }}>
                                                    {formatStoreAddress(returnStore)}
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: textMuted }}>
                                                        <CalendarTodayIcon sx={{ fontSize: 13, color: textSecondary }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            {booking.end_date}
                                                        </Typography>
                                                        <AccessTimeIcon sx={{ fontSize: 13, color: textSecondary, ml: 0.5 }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            {returnTime}
                                                        </Typography>
                                                    </Box>
                                                    {returnStore.phone && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: textSecondary }}>
                                                            <PhoneIcon sx={{ fontSize: 13 }} />
                                                            <Typography variant="caption">{returnStore.phone}</Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Handover Checklist & Digital Vehicle Documents */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, sm: 3 },
                                    borderRadius: 3.5,
                                    bgcolor: surfaceBg,
                                    border: 1,
                                    borderColor: borderCol,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <BadgeIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
                                        Pickup Handover Checklist
                                    </Typography>
                                </Box>
                                <Stack spacing={1} sx={{ mb: 2.5 }}>
                                    <Typography variant="body2" sx={{ color: textSecondary }}>
                                        1. <strong style={{ color: textPrimary }}>Original Driving License:</strong> Required from the primary rider at key handover.
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: textSecondary }}>
                                        2. <strong style={{ color: textPrimary }}>Government Photo ID:</strong> Aadhaar, Passport, or Voter ID for digital KYC verification.
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: textSecondary }}>
                                        3. <strong style={{ color: textPrimary }}>360° Walkaround Check:</strong> Odometer &amp; vehicle photos logged jointly with hub staff.
                                    </Typography>
                                </Stack>

                                <Divider sx={{ my: 2, borderColor: rowBorderCol }} />

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 2,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <DescriptionIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                                                Digital Bike Documents
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: textSecondary }}>
                                                Access RC, Insurance certificate &amp; Emission PUC digitally during your trip.
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        component={Link}
                                        href={`/account/bookings/${booking.id}`}
                                        variant="outlined"
                                        size="small"
                                        startIcon={<DescriptionIcon />}
                                        sx={{
                                            fontWeight: 750,
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#0F766E',
                                            color: isDark ? '#38BDF8' : '#0F766E',
                                        }}
                                    >
                                        Manage &amp; View Docs
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* RIGHT COLUMN (5 cols): Standard Billing Statement & Receipt */}
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    position: { lg: 'sticky' },
                                    top: { lg: 92 },
                                    borderRadius: 3.5,
                                    border: 1,
                                    borderColor: borderCol,
                                    bgcolor: surfaceBg,
                                    boxShadow: isDark
                                        ? '0 14px 32px rgba(0, 0, 0, 0.4)'
                                        : '0 12px 28px rgba(15, 23, 42, 0.06)',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Billing Statement Header */}
                                <Box
                                    sx={{
                                        px: { xs: 2.5, sm: 3 },
                                        py: 2,
                                        bgcolor: subtleBg,
                                        borderBottom: 1,
                                        borderColor: borderCol,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ReceiptLongIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E' }} />
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: textPrimary, lineHeight: 1.2 }}>
                                                Billing Statement
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: textSecondary, fontFamily: 'monospace' }}>
                                                #{booking.booking_reference}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        size="small"
                                        component="a"
                                        href={`/bookings/${booking.id}/billing-statement`}
                                        startIcon={<DownloadIcon sx={{ fontSize: '15px !important' }} />}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 750,
                                            fontSize: '0.76rem',
                                            color: isDark ? '#38BDF8' : '#0F766E',
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        PDF
                                    </Button>
                                </Box>

                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    {/* Billed To Section (Integrated inside Billing Statement) */}
                                    <Box
                                        sx={{
                                            p: 1.75,
                                            mb: 2.5,
                                            borderRadius: 2,
                                            bgcolor: subtleBg,
                                            border: 1,
                                            borderColor: borderCol,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                <PersonOutlineIcon sx={{ fontSize: 15, color: textSecondary }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: textSecondary }}
                                                >
                                                    Billed To
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={billing?.type === 'business' ? 'Business (GST)' : 'Personal'}
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.68rem',
                                                    fontWeight: 750,
                                                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                                    color: textMuted,
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary }}>
                                            {billing?.name || booking.user?.name || 'Valued Rider'}
                                        </Typography>
                                        {billing?.address && (
                                            <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25 }}>
                                                {billing.address}{billing.state_code ? ` (State Code: ${billing.state_code})` : ''}
                                            </Typography>
                                        )}
                                        {billing?.gstin && (
                                            <Typography variant="caption" sx={{ color: textMuted, fontFamily: 'monospace', fontWeight: 700, display: 'block', mt: 0.25 }}>
                                                GSTIN: {billing.gstin}
                                            </Typography>
                                        )}
                                        {(booking.user?.phone || booking.user?.email) && (
                                            <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25 }}>
                                                {[booking.user?.phone ? `+91 ${booking.user.phone}` : null, booking.user?.email]
                                                    .filter(Boolean)
                                                    .join(' • ')}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Itemized Fare Breakdown */}
                                    <Typography
                                        variant="overline"
                                        sx={{ fontWeight: 800, color: textSecondary, letterSpacing: '0.08em', display: 'block', mb: 0.5 }}
                                    >
                                        Fare &amp; Tax Breakdown
                                    </Typography>

                                    <Table size="small" sx={{ '& td': { fontVariantNumeric: 'tabular-nums' } }}>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ ...cellBase, color: textSecondary }}>
                                                    Base Rental ({days} Day{days > 1 ? 's' : ''})
                                                </TableCell>
                                                <TableCell align="right" sx={{ ...cellBase, fontWeight: 700, color: textPrimary }}>
                                                    {formatInr(booking.base_amount)}
                                                </TableCell>
                                            </TableRow>

                                            {Number(booking.pricing_adjustments_amount || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{ ...cellBase, color: textSecondary }}>
                                                        Weekend / Seasonal Adjustment
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ ...cellBase, fontWeight: 700, color: '#F59E0B' }}>
                                                        + {formatInr(booking.pricing_adjustments_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {locationFee > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{ ...cellBase, color: textSecondary }}>
                                                        Pickup &amp; Return Location Fee
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ ...cellBase, fontWeight: 700, color: textPrimary }}>
                                                        + {formatInr(locationFee)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {Number(booking.one_way_fee_amount || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{ ...cellBase, color: textSecondary }}>
                                                        One-Way Relocation Fee
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ ...cellBase, fontWeight: 700, color: '#F59E0B' }}>
                                                        + {formatInr(booking.one_way_fee_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {addons.length > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{ ...cellBase, color: textSecondary }}>
                                                        Add-ons ({addons.length} item{addons.length > 1 ? 's' : ''})
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ ...cellBase, fontWeight: 700, color: textPrimary }}>
                                                        + {formatInr(booking.addon_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {Number(booking.discount_amount || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{ ...cellBase, color: '#10B981', fontWeight: 600 }}>
                                                        Coupon Discount
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ ...cellBase, fontWeight: 750, color: '#10B981' }}>
                                                        - {formatInr(booking.discount_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {hasConfiguredGst && (
                                                <TableRow>
                                                    <TableCell sx={{ ...cellBase, color: textSecondary }}>
                                                        GST ({gstRate}% — CGST {halfGstRate}% + SGST {halfGstRate}%)
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ ...cellBase, fontWeight: 700, color: textPrimary }}>
                                                        {gst.price_mode === 'inclusive' ? '' : '+ '}
                                                        {formatInr(gst.gst_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            <TableRow>
                                                <TableCell sx={{ ...cellBase, color: depositAmount > 0 ? textSecondary : '#10B981' }}>
                                                    {depositAmount > 0 ? 'Refundable Security Deposit' : 'Security Deposit (Waived)'}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{ ...cellBase, fontWeight: 700, color: depositAmount > 0 ? textPrimary : '#10B981' }}
                                                >
                                                    {formatInr(depositAmount)}
                                                </TableCell>
                                            </TableRow>

                                            {/* Grand Total Row */}
                                            <TableRow>
                                                <TableCell
                                                    sx={{
                                                        pt: 1.75,
                                                        pb: 1.25,
                                                        px: 0,
                                                        fontWeight: 850,
                                                        fontSize: '0.95rem',
                                                        color: textPrimary,
                                                        borderTop: 2,
                                                        borderBottom: 1,
                                                        borderColor: borderCol,
                                                    }}
                                                >
                                                    Total Rental {hasConfiguredGst ? `(Incl. ${gstRate}% GST)` : ''}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        pt: 1.75,
                                                        pb: 1.25,
                                                        px: 0,
                                                        fontWeight: 900,
                                                        fontSize: '1.1rem',
                                                        color: textPrimary,
                                                        borderTop: 2,
                                                        borderBottom: 1,
                                                        borderColor: borderCol,
                                                    }}
                                                >
                                                    {formatInr(totalAmount)}
                                                </TableCell>
                                            </TableRow>

                                            {/* Paid Online Row */}
                                            <TableRow>
                                                <TableCell sx={{ ...cellBase, pt: 1.25, fontWeight: 700, color: '#10B981', borderBottom: 0 }}>
                                                    Paid Online ({paymentMethodLabel})
                                                </TableCell>
                                                <TableCell align="right" sx={{ ...cellBase, pt: 1.25, fontWeight: 800, color: '#10B981', borderBottom: 0 }}>
                                                    - {formatInr(paidAmount)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>

                                    {/* Balance Due Highlight Box */}
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: balanceDue > 0
                                                ? (isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB')
                                                : (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5'),
                                            border: 1,
                                            borderColor: balanceDue > 0
                                                ? (isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A')
                                                : (isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'),
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 850,
                                                    color: balanceDue > 0
                                                        ? (isDark ? '#FBBF24' : '#B45309')
                                                        : (isDark ? '#34D399' : '#065F46'),
                                                }}
                                            >
                                                {balanceDue > 0 ? 'Balance Due at Pickup' : 'Paid in Full'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: textSecondary }}>
                                                {balanceDue > 0 ? 'Pay via UPI or Cash at hub handover' : 'Nothing due for quoted rental at pickup'}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 900,
                                                fontVariantNumeric: 'tabular-nums',
                                                color: balanceDue > 0 ? '#F59E0B' : '#10B981',
                                            }}
                                        >
                                            {formatInr(balanceDue)}
                                        </Typography>
                                    </Box>

                                    {/* Payment Ledger / Gateway Reference */}
                                    {latestPayment && (
                                        <Box
                                            sx={{
                                                mt: 2.5,
                                                p: 1.75,
                                                borderRadius: 2,
                                                bgcolor: subtleBg,
                                                border: 1,
                                                borderColor: borderCol,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: textSecondary, display: 'block', mb: 1 }}
                                            >
                                                Transaction Record
                                            </Typography>
                                            <Stack spacing={0.6}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                                    <Typography variant="caption" sx={{ color: textSecondary }}>
                                                        Gateway Ref:
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 750, color: textPrimary, wordBreak: 'break-all', textAlign: 'right' }}>
                                                        {latestPayment.gateway_reference || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                                    <Typography variant="caption" sx={{ color: textSecondary }}>
                                                        Method &amp; Status:
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', textTransform: 'capitalize' }}>
                                                        {paymentMethodLabel} • {latestPayment.status}
                                                    </Typography>
                                                </Box>
                                                {latestPayment.created_at && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                                        <Typography variant="caption" sx={{ color: textSecondary }}>
                                                            Recorded At:
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: textMuted }}>
                                                            {formatDateTime(latestPayment.created_at)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    )}

                                    <Alert
                                        icon={<VerifiedUserIcon fontSize="inherit" />}
                                        severity={hasConfiguredGst ? 'info' : 'warning'}
                                        sx={{ mt: 2, borderRadius: 2, fontSize: '0.78rem' }}
                                    >
                                        {hasConfiguredGst
                                            ? `Includes ${gstRate}% statutory GST (${formatInr(gst.gst_amount)}). Zero security deposit required at handover.`
                                            : 'GST details not configured. This billing statement is a payment summary, not a GST tax invoice.'}
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </AppLayout>
    );
}

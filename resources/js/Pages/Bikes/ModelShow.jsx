import React, { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PageHead from '../../Components/SEO/PageHead';
import AppLayout from '../../Layouts/AppLayout';
import apiClient from '../../api/client';
import { useColorMode } from '../../theme/ColorModeContext';
import { computeRentalSlot } from '../../utils/rentalSlot';

function getIstDate(offsetDays = 0) {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 + offsetDays * 86400000);
    return ist.toISOString().slice(0, 10);
}

function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatLabel(val) {
    if (!val) return '';
    return String(val)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function FieldLabel({ children, required = false, isDark = false }) {
    return (
        <Typography
            component="label"
            variant="caption"
            sx={{
                display: 'block',
                fontWeight: 750,
                fontSize: '0.75rem',
                color: isDark ? '#CBD5E1' : '#334155',
                mb: 0.6,
                letterSpacing: '0.01em',
            }}
        >
            {children}
            {required && (
                <Box component="span" sx={{ color: '#EF4444', ml: 0.35 }}>
                    *
                </Box>
            )}
        </Typography>
    );
}

export default function ModelShow({ model, stores = [], initialFilters = {} }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const today = useMemo(() => getIstDate(0), []);
    const tomorrow = useMemo(() => getIstDate(1), []);
    const defaultStoreId = String(initialFilters.pickup_store_id || stores[0]?.id || '');

    const [pickupId, setPickupId] = useState(defaultStoreId);
    const [returnId, setReturnId] = useState(String(initialFilters.return_store_id || defaultStoreId));
    const [pickupPointId, setPickupPointId] = useState(
        initialFilters.pickup_point_id ? String(initialFilters.pickup_point_id) : ''
    );
    const [returnPointId, setReturnPointId] = useState(
        initialFilters.return_point_id ? String(initialFilters.return_point_id) : ''
    );
    const [startDate, setStartDate] = useState(initialFilters.start_date || today);
    const [endDate, setEndDate] = useState(initialFilters.end_date || tomorrow);
    const [pickupTime, setPickupTime] = useState(initialFilters.pickup_time || '09:00');
    const [returnTime, setReturnTime] = useState(initialFilters.return_time || '08:00');

    const pickupStore = useMemo(
        () => stores.find((s) => String(s.id) === pickupId) || null,
        [stores, pickupId]
    );
    const returnStore = useMemo(
        () => stores.find((s) => String(s.id) === returnId) || null,
        [stores, returnId]
    );

    const pickupPoints = useMemo(
        () => (pickupStore?.pickup_points || []).filter((p) => p.supports_pickup !== false),
        [pickupStore]
    );
    const returnPoints = useMemo(
        () => (returnStore?.pickup_points || []).filter((p) => p.supports_return !== false),
        [returnStore]
    );

    const selectedPickupPoint = useMemo(
        () => pickupPoints.find((p) => String(p.id) === pickupPointId) || null,
        [pickupPoints, pickupPointId]
    );
    const selectedReturnPoint = useMemo(
        () => returnPoints.find((p) => String(p.id) === returnPointId) || null,
        [returnPoints, returnPointId]
    );

    const handlePickupStoreChange = (nextStoreId) => {
        setPickupId(nextStoreId);
        if (!returnId) setReturnId(nextStoreId);
        const nextStore = stores.find((s) => String(s.id) === nextStoreId);
        const validIds = new Set((nextStore?.pickup_points || []).map((p) => String(p.id)));
        if (pickupPointId && !validIds.has(pickupPointId)) {
            setPickupPointId('');
        }
    };

    const handleReturnStoreChange = (nextStoreId) => {
        setReturnId(nextStoreId);
        const nextStore = stores.find((s) => String(s.id) === nextStoreId);
        const validIds = new Set((nextStore?.pickup_points || []).map((p) => String(p.id)));
        if (returnPointId && !validIds.has(returnPointId)) {
            setReturnPointId('');
        }
    };

    const handlePreset = (preset) => {
        if (preset === '23h') {
            setStartDate(getIstDate(0));
            setEndDate(getIstDate(1));
            setPickupTime('09:00');
            setReturnTime('08:00');
        } else if (preset === '48h') {
            setStartDate(getIstDate(0));
            setEndDate(getIstDate(2));
            setPickupTime('09:00');
            setReturnTime('08:00');
        } else if (preset === '3d') {
            setStartDate(getIstDate(0));
            setEndDate(getIstDate(3));
            setPickupTime('08:00');
            setReturnTime('19:00');
        }
    };

    const activePreset = useMemo(() => {
        if (startDate === getIstDate(0) && endDate === getIstDate(1) && pickupTime === '09:00' && returnTime === '08:00') return '23h';
        if (startDate === getIstDate(0) && endDate === getIstDate(2) && pickupTime === '09:00' && returnTime === '08:00') return '48h';
        if (startDate === getIstDate(0) && endDate === getIstDate(3) && pickupTime === '08:00' && returnTime === '19:00') return '3d';
        return null;
    }, [startDate, endDate, pickupTime, returnTime]);

    const rentalSlot = useMemo(
        () => computeRentalSlot(startDate, endDate, pickupTime, returnTime),
        [startDate, endDate, pickupTime, returnTime]
    );

    const timeWindowValid = useMemo(() => {
        if (!startDate || !endDate || !pickupTime || !returnTime) return false;
        const startDt = new Date(`${startDate}T${pickupTime}:00`);
        const endDt = new Date(`${endDate}T${returnTime}:00`);
        return !Number.isNaN(startDt.getTime()) && !Number.isNaN(endDt.getTime()) && endDt > startDt;
    }, [startDate, endDate, pickupTime, returnTime]);

    const datesValid = Boolean(pickupId && returnId && startDate && endDate && startDate <= endDate && timeWindowValid);

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
    const branchPricing = model.branch_prices?.[pickupId] || null;
    const weekdayRate = branchPricing?.weekday_rate ?? model.indicative_daily_rate;
    const weekendRate = branchPricing?.weekend_rate ?? (weekdayRate !== null ? Math.round(weekdayRate * 1.2) : null);

    const pickupFee = Number(selectedPickupPoint?.pickup_fee ?? selectedPickupPoint?.delivery_fee ?? 0);
    const returnFee = Number(selectedReturnPoint?.return_fee ?? selectedReturnPoint?.delivery_fee ?? 0);
    const locationSurcharge = pickupFee + returnFee;
    const estimatedRental = weekdayRate !== null ? weekdayRate * rentalSlot.days + locationSurcharge : null;

    const canonical = `https://whizwheels.in${model.canonical_path}`;
    const title = `${model.brand} ${model.name} Bike Rental | GK WhizWheel`;
    const description =
        model.description ||
        `Rent a ${model.brand} ${model.name} with GK WhizWheel. Compare availability at our branches, choose your rental dates and pickup time, and see the exact fare before payment.`;

    const beginBooking = () => {
        if (!datesValid || !availability?.is_available) return;
        const checkoutParams = {
            bike_model_id: model.id,
            pickup_store_id: pickupId,
            return_store_id: returnId,
            start_date: startDate,
            end_date: endDate,
            pickup_time: pickupTime,
            return_time: returnTime,
        };
        if (pickupPointId) checkoutParams.pickup_point_id = pickupPointId;
        if (returnPointId) checkoutParams.return_point_id = returnPointId;

        router.get('/services/bikes/checkout', checkoutParams);
    };

    const availabilityText = !startDate || !endDate || !pickupId || !returnId
        ? 'Select branches, dates, and times to check live availability.'
        : !timeWindowValid
            ? 'Return date & time must be after pickup date & time.'
            : isLoading
                ? 'Checking live fleet availability…'
                : isError
                    ? 'Availability could not be checked right now.'
                    : availability?.is_available
                        ? `${availability.available_units} unit${availability.available_units === 1 ? '' : 's'} available for your selected slot`
                        : 'No units available for these dates. Try different dates or branch.';

    const surfaceBg = isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF';
    const subtleBg = isDark ? 'rgba(11, 17, 32, 0.65)' : '#F8FAFC';
    const borderCol = isDark ? 'rgba(255, 255, 255, 0.09)' : '#E2E8F0';
    const accentText = isDark ? '#FBBF24' : '#B45309';
    const priceText = isDark ? '#FBBF24' : '#D97706';
    const liveUnitsBadge = datesValid && !isLoading && availability
        ? availability.available_units
        : (model.available_units_now ?? model.total_units);

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
            fontSize: '0.88rem',
            fontWeight: 600,
        },
    };

    return (
        <AppLayout>
            <PageHead
                title={title}
                description={description.slice(0, 160)}
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
                        ...(weekdayRate !== null
                            ? {
                                offers: {
                                    '@type': 'Offer',
                                    priceCurrency: 'INR',
                                    price: weekdayRate,
                                    url: canonical,
                                    description: 'Indicative day rate; exact rental, GST, and route fees are shown before payment.',
                                },
                            }
                            : {}),
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

            <Box
                component="main"
                sx={{
                    maxWidth: 1320,
                    mx: 'auto',
                    px: { xs: 2, md: 4 },
                    pt: { xs: 2.5, md: 3.5 },
                    pb: { xs: 12, md: 6 },
                }}
            >
                {/* Top Navigation Bar */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        mb: 3,
                    }}
                >
                    <Button
                        component={Link}
                        href="/services/bikes"
                        startIcon={<ArrowBackIcon />}
                        size="small"
                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, color: 'text.primary' }}
                    >
                        Back to bike rentals
                    </Button>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.82rem' }}>
                        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.72 }}>
                            Home
                        </Link>
                        <Link href="/services/bikes" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.72 }}>
                            Bike Rentals
                        </Link>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                            {model.brand} {model.name}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Grid container spacing={3.5} alignItems="flex-start">
                    {/* LEFT COLUMN: Vehicle Showcase, Specs & Trust Highlights */}
                    <Grid size={{ xs: 12, lg: 7 }}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                bgcolor: surfaceBg,
                                borderColor: borderCol,
                                boxShadow: isDark
                                    ? '0 18px 40px rgba(0, 0, 0, 0.35)'
                                    : '0 10px 30px rgba(15, 23, 42, 0.06)',
                            }}
                        >
                            {/* Full-Bleed Vehicle Stage */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    aspectRatio: { xs: '16 / 11', sm: '16 / 10' },
                                    maxHeight: 430,
                                    bgcolor: isDark ? '#1E293B' : '#DFE3E8',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Top Floating Badges inside safe padding */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        left: 16,
                                        right: 16,
                                        zIndex: 2,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Chip
                                        label={model.category_name || 'Two-Wheeler'}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.94)',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                        }}
                                    />
                                    <Chip
                                        label={
                                            liveUnitsBadge > 0
                                                ? `${liveUnitsBadge} of ${model.total_units} Available`
                                                : 'Currently Booked Out'
                                        }
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: liveUnitsBadge > 0 ? '#059669' : '#DC2626',
                                            color: '#FFFFFF',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                                        }}
                                    />
                                </Box>

                                {model.primary_image_url ? (
                                    <Box
                                        component="img"
                                        alt={`${model.brand} ${model.name} rental bike`}
                                        src={model.primary_image_url}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center',
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <TwoWheelerIcon
                                        aria-label="Bike model"
                                        sx={{ fontSize: 108, color: 'text.disabled' }}
                                    />
                                )}
                            </Box>

                            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        mb: 2,
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="overline"
                                            sx={{
                                                color: accentText,
                                                fontWeight: 850,
                                                letterSpacing: '0.09em',
                                                display: 'block',
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {model.brand} · {model.category_name || 'Two-Wheeler'}
                                        </Typography>
                                        <Typography
                                            component="h1"
                                            variant="h3"
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: { xs: '1.75rem', sm: '2.15rem' },
                                                lineHeight: 1.15,
                                                mt: 0.25,
                                            }}
                                        >
                                            {model.brand} {model.name}
                                        </Typography>
                                    </Box>

                                    {weekdayRate !== null && (
                                        <Box
                                            sx={{
                                                textAlign: { xs: 'left', sm: 'right' },
                                                px: 2,
                                                py: 1,
                                                borderRadius: 2.5,
                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(245, 158, 11, 0.28)' : '#FDE68A',
                                            }}
                                        >
                                            <Typography variant="h5" fontWeight={900} sx={{ color: priceText, lineHeight: 1.1 }}>
                                                ₹{Number(weekdayRate).toLocaleString('en-IN')}
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    sx={{ ml: 0.5, fontWeight: 700, color: 'text.secondary' }}
                                                >
                                                    / 23 hr
                                                </Typography>
                                            </Typography>
                                            {weekendRate !== null && weekendRate !== weekdayRate && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ display: 'block', mt: 0.25, fontWeight: 600 }}
                                                >
                                                    Weekend: ₹{Number(weekendRate).toLocaleString('en-IN')}/day
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                {/* Spec Badges (Box flex-wrap, never Stack flexWrap) */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                                    <Chip
                                        icon={<LocalGasStationIcon sx={{ fontSize: 16 }} />}
                                        label={formatLabel(model.fuel_type)}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                    <Chip
                                        icon={<SettingsIcon sx={{ fontSize: 16 }} />}
                                        label={formatLabel(model.transmission)}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                    <Chip
                                        icon={<SportsMotorsportsIcon sx={{ fontSize: 16 }} />}
                                        label="Complimentary Helmet"
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                    <Chip
                                        icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                                        label="Zero Security Deposit"
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                    <Chip
                                        icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                                        label="23 Hr Standard Slot"
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Box>

                                <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 3, fontSize: '0.95rem' }}>
                                    {description}
                                </Typography>

                                <Divider sx={{ my: 2.5, borderColor: borderCol }} />

                                {/* Included Benefits Strip */}
                                <Grid container spacing={2}>
                                    {[
                                        {
                                            icon: <QrCode2Icon sx={{ fontSize: 20, color: priceText }} />,
                                            bg: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                                            title: 'Express QR Handover',
                                            desc: 'Show your confirmation QR at the hub for instant key & helmet pickup.',
                                        },
                                        {
                                            icon: <VerifiedUserIcon sx={{ fontSize: 20, color: '#059669' }} />,
                                            bg: isDark ? 'rgba(16, 185, 129, 0.14)' : '#D1FAE5',
                                            title: 'Road-Ready Fleet',
                                            desc: 'Active RC, Insurance & PUC verified before every handover.',
                                        },
                                        {
                                            icon: <CheckCircleIcon sx={{ fontSize: 20, color: '#0284C7' }} />,
                                            bg: isDark ? 'rgba(14, 165, 233, 0.14)' : '#E0F2FE',
                                            title: 'Book with ₹100 Advance',
                                            desc: 'Lock your bike online now and settle the balance before pickup.',
                                        },
                                    ].map((item) => (
                                        <Grid key={item.title} size={{ xs: 12, sm: 4 }}>
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
                                                <Box
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 2,
                                                        bgcolor: item.bg,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        mb: 1.25,
                                                    }}
                                                >
                                                    {item.icon}
                                                </Box>
                                                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.4 }}>
                                                    {item.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                                                    {item.desc}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5, lineHeight: 1.5 }}>
                                    Exact rental breakdown (including 18% GST and any inter-branch or doorstep delivery charges) is calculated on the next step before payment.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* RIGHT COLUMN: Clean Grouped Booking Form */}
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Card
                            id="availability-booking-card"
                            variant="outlined"
                            sx={{
                                borderRadius: 4,
                                position: { lg: 'sticky' },
                                top: { lg: 92 },
                                bgcolor: surfaceBg,
                                borderColor: borderCol,
                                boxShadow: isDark
                                    ? '0 20px 45px rgba(0, 0, 0, 0.42)'
                                    : '0 14px 36px rgba(15, 23, 42, 0.08)',
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                {/* Card Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="h5" fontWeight={900}>
                                        Configure Your Trip
                                    </Typography>
                                    <Chip
                                        label={rentalSlot.slotLabel}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                                            color: accentText,
                                            border: 1,
                                            borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Choose pickup/return hubs, dates, and exact times to check live availability.
                                </Typography>

                                <Stack spacing={2}>
                                    {/* Quick Presets */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                                        <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mr: 0.5 }}>
                                            Quick slots:
                                        </Typography>
                                        {[
                                            { id: '23h', label: '23h Day Trip' },
                                            { id: '48h', label: '48h 2-Day' },
                                            { id: '3d', label: '3-Day Coastal' },
                                        ].map((preset) => {
                                            const isActive = activePreset === preset.id;
                                            return (
                                                <Chip
                                                    key={preset.id}
                                                    label={preset.label}
                                                    size="small"
                                                    clickable
                                                    onClick={() => handlePreset(preset.id)}
                                                    sx={{
                                                        fontWeight: 750,
                                                        fontSize: '0.75rem',
                                                        bgcolor: isActive
                                                            ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7')
                                                            : 'transparent',
                                                        color: isActive ? accentText : 'text.primary',
                                                        border: 1,
                                                        borderColor: isActive ? '#F59E0B' : borderCol,
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>

                                    {/* PICK-UP BLOCK */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: subtleBg,
                                            border: 1,
                                            borderColor: borderCol,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                                            <Typography
                                                variant="caption"
                                                fontWeight={850}
                                                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#34D399' : '#047857' }}
                                            >
                                                Pick-up Details
                                            </Typography>
                                        </Box>

                                        <Stack spacing={1.5}>
                                            <Box>
                                                <FieldLabel required isDark={isDark}>Pickup Branch</FieldLabel>
                                                <TextField
                                                    select
                                                    fullWidth
                                                    size="small"
                                                    hiddenLabel
                                                    value={pickupId}
                                                    onChange={(e) => handlePickupStoreChange(e.target.value)}
                                                    sx={inputSx}
                                                >
                                                    {stores.map((s) => (
                                                        <MenuItem key={s.id} value={String(s.id)}>
                                                            {s.name} ({s.city})
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Box>

                                            {pickupPoints.length > 0 && (
                                                <Box>
                                                    <FieldLabel isDark={isDark}>Pickup Point</FieldLabel>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        hiddenLabel
                                                        value={pickupPointId}
                                                        onChange={(e) => setPickupPointId(e.target.value)}
                                                        sx={inputSx}
                                                    >
                                                        <MenuItem value="">Main Hub (Free)</MenuItem>
                                                        {pickupPoints.map((pt) => (
                                                            <MenuItem key={pt.id} value={String(pt.id)}>
                                                                {pt.name}
                                                                {pt.pickup_fee > 0 ? ` (+₹${pt.pickup_fee})` : ' (Free)'}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                            )}

                                            <Grid container spacing={1.5}>
                                                <Grid size={{ xs: 7 }}>
                                                    <FieldLabel required isDark={isDark}>Pickup Date</FieldLabel>
                                                    <TextField
                                                        type="date"
                                                        fullWidth
                                                        size="small"
                                                        hiddenLabel
                                                        value={startDate}
                                                        onChange={(e) => {
                                                            const next = e.target.value;
                                                            setStartDate(next);
                                                            if (endDate && next && endDate < next) {
                                                                setEndDate(next);
                                                            }
                                                        }}
                                                        slotProps={{ htmlInput: { min: today } }}
                                                        sx={inputSx}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <FieldLabel required isDark={isDark}>Pickup Time</FieldLabel>
                                                    <TextField
                                                        type="time"
                                                        fullWidth
                                                        size="small"
                                                        hiddenLabel
                                                        value={pickupTime}
                                                        onChange={(e) => setPickupTime(e.target.value)}
                                                        sx={inputSx}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </Paper>

                                    {/* RETURN BLOCK */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: subtleBg,
                                            border: 1,
                                            borderColor: borderCol,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                                            <Typography
                                                variant="caption"
                                                fontWeight={850}
                                                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: accentText }}
                                            >
                                                Return Details
                                            </Typography>
                                        </Box>

                                        <Stack spacing={1.5}>
                                            <Box>
                                                <FieldLabel required isDark={isDark}>Return Branch</FieldLabel>
                                                <TextField
                                                    select
                                                    fullWidth
                                                    size="small"
                                                    hiddenLabel
                                                    value={returnId}
                                                    onChange={(e) => handleReturnStoreChange(e.target.value)}
                                                    sx={inputSx}
                                                >
                                                    {stores.map((s) => (
                                                        <MenuItem key={s.id} value={String(s.id)}>
                                                            {s.name} ({s.city})
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Box>

                                            {returnPoints.length > 0 && (
                                                <Box>
                                                    <FieldLabel isDark={isDark}>Return Point</FieldLabel>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        hiddenLabel
                                                        value={returnPointId}
                                                        onChange={(e) => setReturnPointId(e.target.value)}
                                                        sx={inputSx}
                                                    >
                                                        <MenuItem value="">Main Hub (Free)</MenuItem>
                                                        {returnPoints.map((pt) => (
                                                            <MenuItem key={pt.id} value={String(pt.id)}>
                                                                {pt.name}
                                                                {pt.return_fee > 0 ? ` (+₹${pt.return_fee})` : ' (Free)'}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Box>
                                            )}

                                            <Grid container spacing={1.5}>
                                                <Grid size={{ xs: 7 }}>
                                                    <FieldLabel required isDark={isDark}>Return Date</FieldLabel>
                                                    <TextField
                                                        type="date"
                                                        fullWidth
                                                        size="small"
                                                        hiddenLabel
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        slotProps={{ htmlInput: { min: startDate || today } }}
                                                        sx={inputSx}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <FieldLabel required isDark={isDark}>Return Time</FieldLabel>
                                                    <TextField
                                                        type="time"
                                                        fullWidth
                                                        size="small"
                                                        hiddenLabel
                                                        value={returnTime}
                                                        onChange={(e) => setReturnTime(e.target.value)}
                                                        sx={inputSx}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </Paper>

                                    {/* Live Schedule & Fare Summary */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#FFFBEB',
                                            border: 1,
                                            borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <CalendarMonthIcon sx={{ fontSize: 17, color: priceText }} />
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={800}
                                                    color="text.secondary"
                                                    sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                                >
                                                    Selected Schedule
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={850} sx={{ color: isDark ? '#38BDF8' : '#0F766E' }}>
                                                {rentalSlot.durationLabel}
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={1.5} sx={{ mb: estimatedRental !== null ? 1.5 : 0 }}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Pick-up
                                                </Typography>
                                                <Typography variant="body2" fontWeight={800}>
                                                    {formatShortDate(startDate)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: accentText, fontWeight: 800 }}>
                                                    {rentalSlot.pickupTime12}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Return
                                                </Typography>
                                                <Typography variant="body2" fontWeight={800}>
                                                    {formatShortDate(endDate)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: accentText, fontWeight: 800 }}>
                                                    {rentalSlot.returnTime12}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {estimatedRental !== null && (
                                            <>
                                                <Divider sx={{ my: 1.25, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#FDE68A' }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                                                            Estimated Base Rental ({rentalSlot.days} day{rentalSlot.days > 1 ? 's' : ''})
                                                        </Typography>
                                                        {locationSurcharge > 0 && (
                                                            <Typography variant="caption" sx={{ color: accentText, fontWeight: 700 }}>
                                                                Includes +₹{locationSurcharge} point fee
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={900} sx={{ color: priceText, whiteSpace: 'nowrap' }}>
                                                        ₹{Number(estimatedRental).toLocaleString('en-IN')}
                                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.4, fontWeight: 700 }}>
                                                            + GST
                                                        </Typography>
                                                    </Typography>
                                                </Box>
                                            </>
                                        )}
                                    </Paper>

                                    {isError && (
                                        <Alert severity="error" sx={{ borderRadius: 2.5 }}>
                                            {error?.message || 'Please check your selected dates and branches.'}
                                        </Alert>
                                    )}

                                    <Alert
                                        severity={
                                            !timeWindowValid
                                                ? 'warning'
                                                : datesValid && availability?.is_available
                                                    ? 'success'
                                                    : datesValid && !isLoading && availability && !availability.is_available
                                                        ? 'warning'
                                                        : 'info'
                                        }
                                        icon={isLoading ? <CircularProgress size={18} aria-label="Checking bike availability" /> : undefined}
                                        sx={{ borderRadius: 2.5, fontWeight: 700 }}
                                    >
                                        {availabilityText}
                                    </Alert>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        endIcon={<ArrowForwardIcon />}
                                        disabled={!datesValid || isLoading || !availability?.is_available || isError}
                                        onClick={beginBooking}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2.5,
                                            fontWeight: 850,
                                            fontSize: '0.98rem',
                                            textTransform: 'none',
                                            color: '#0F172A',
                                            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                                boxShadow: '0 10px 24px rgba(217, 119, 6, 0.42)',
                                            },
                                        }}
                                    >
                                        Continue to Secure Checkout
                                    </Button>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'center' }}>
                                        <LocationOnIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary" textAlign="center">
                                            Instant hold via PhonePe, UPI & Cards · Zero password friction
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Mobile Sticky Booking Dock */}
                <Box
                    sx={{
                        display: { xs: 'flex', lg: 'none' },
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1150,
                        bgcolor: 'background.paper',
                        borderTop: 1,
                        borderColor: 'divider',
                        boxShadow: '0 -6px 20px rgba(0,0,0,0.16)',
                        px: 2,
                        py: 1.25,
                        pb: 'calc(env(safe-area-inset-bottom, 8px) + 8px)',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                    }}
                >
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                            {model.brand} {model.name} · {rentalSlot.slotLabel}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ color: priceText, lineHeight: 1.15 }}>
                            {estimatedRental !== null
                                ? `₹${Number(estimatedRental).toLocaleString('en-IN')}`
                                : weekdayRate !== null
                                    ? `₹${Number(weekdayRate).toLocaleString('en-IN')}`
                                    : 'Check Fare'}
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                {estimatedRental !== null ? '+ GST' : '/ day'}
                            </Typography>
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="medium"
                        onClick={() => {
                            if (datesValid && availability?.is_available) {
                                beginBooking();
                            } else {
                                const card = document.getElementById('availability-booking-card');
                                if (card) card.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        sx={{
                            fontWeight: 850,
                            borderRadius: 2.5,
                            px: 2.5,
                            py: 1,
                            textTransform: 'none',
                            color: '#0F172A',
                            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                        }}
                    >
                        {datesValid && availability?.is_available ? 'Book Now' : 'Select Slot'}
                    </Button>
                </Box>
            </Box>
        </AppLayout>
    );
}

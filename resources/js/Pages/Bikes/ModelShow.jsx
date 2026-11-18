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

    const surfaceBg = isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF';
    const subtleBg = isDark ? 'rgba(11, 17, 32, 0.65)' : '#F8FAFC';
    const borderCol = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
    const liveUnitsBadge = datesValid && !isLoading && availability
        ? availability.available_units
        : (model.available_units_now ?? model.total_units);

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
                    maxWidth: 1360,
                    mx: 'auto',
                    px: { xs: 2, md: 4 },
                    pt: { xs: 2.5, md: 4 },
                    pb: { xs: 12, md: 6 },
                }}
            >
                {/* Breadcrumb & Back */}
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
                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                    >
                        Back to bike rentals
                    </Button>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.82rem' }}>
                        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.75 }}>
                            Home
                        </Link>
                        <Link href="/services/bikes" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.75 }}>
                            Bike Rentals
                        </Link>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                            {model.brand} {model.name}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Grid container spacing={4} alignItems="flex-start">
                    {/* LEFT COLUMN: Vehicle Showcase, Specs & Trust Highlights */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                bgcolor: surfaceBg,
                                borderColor: borderCol,
                                boxShadow: isDark
                                    ? '0 18px 40px rgba(0, 0, 0, 0.35)'
                                    : '0 12px 32px rgba(15, 23, 42, 0.06)',
                            }}
                        >
                            {/* Showcase Image Container */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    background: isDark
                                        ? 'radial-gradient(circle at 50% 35%, rgba(56, 189, 248, 0.14), rgba(15, 23, 42, 0.95) 75%)'
                                        : 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.12), #F8FAFC 75%)',
                                    minHeight: { xs: 240, sm: 340 },
                                    display: 'grid',
                                    placeItems: 'center',
                                    p: { xs: 2.5, sm: 4 },
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        left: 16,
                                        right: 16,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                    }}
                                >
                                    <Chip
                                        label={model.category_name || 'Two-Wheeler'}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.94)',
                                            border: 1,
                                            borderColor: borderCol,
                                        }}
                                    />
                                    <Chip
                                        label={
                                            liveUnitsBadge > 0
                                                ? `${liveUnitsBadge} of ${model.total_units} Available`
                                                : 'Currently Booked Out'
                                        }
                                        size="small"
                                        color={liveUnitsBadge > 0 ? 'success' : 'error'}
                                        sx={{ fontWeight: 800 }}
                                    />
                                </Box>

                                {model.primary_image_url ? (
                                    <Box
                                        component="img"
                                        alt={`${model.brand} ${model.name} rental bike`}
                                        src={model.primary_image_url}
                                        sx={{
                                            width: '100%',
                                            maxHeight: 380,
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 14px 24px rgba(15, 23, 42, 0.22))',
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
                                        alignItems: 'baseline',
                                        justifyContent: 'space-between',
                                        gap: 1.5,
                                        mb: 2,
                                    }}
                                >
                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#F59E0B', fontWeight: 800, letterSpacing: '0.08em' }}>
                                            {model.brand} · {model.category_name || 'Two-Wheeler'}
                                        </Typography>
                                        <Typography
                                            component="h1"
                                            variant="h3"
                                            sx={{ fontWeight: 900, fontSize: { xs: '1.75rem', sm: '2.25rem' }, lineHeight: 1.15 }}
                                        >
                                            {model.brand} {model.name}
                                        </Typography>
                                    </Box>
                                    {weekdayRate !== null && (
                                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                            <Typography variant="h4" fontWeight={900} sx={{ color: '#F59E0B', lineHeight: 1 }}>
                                                ₹{Number(weekdayRate).toLocaleString('en-IN')}
                                                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
                                                    / 23 hr
                                                </Typography>
                                            </Typography>
                                            {weekendRate !== null && weekendRate !== weekdayRate && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                                    Weekend rate: ₹{Number(weekendRate).toLocaleString('en-IN')} / day
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

                                <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
                                    {description}
                                </Typography>

                                <Divider sx={{ my: 2.5, borderColor: borderCol }} />

                                {/* Included Benefits Strip */}
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
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
                                            <QrCode2Icon sx={{ color: '#F59E0B', mb: 0.75 }} />
                                            <Typography variant="subtitle2" fontWeight={800}>
                                                Express QR Handover
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Show your confirmation QR at the hub for instant key & helmet pickup.
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
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
                                            <VerifiedUserIcon sx={{ color: '#10B981', mb: 0.75 }} />
                                            <Typography variant="subtitle2" fontWeight={800}>
                                                Road-Ready Fleet
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Active RC, Insurance & PUC verified before every handover.
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
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
                                            <CheckCircleIcon sx={{ color: '#38BDF8', mb: 0.75 }} />
                                            <Typography variant="subtitle2" fontWeight={800}>
                                                Book with ₹100 Advance
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Reserve your vehicle online now and pay the balance before pickup.
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5 }}>
                                    Exact rental breakdown (including 18% GST and any inter-branch or doorstep delivery charges) is calculated on the next step before payment.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* RIGHT COLUMN: Enhanced Availability & Trip Time Booking Form */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card
                            id="availability-booking-card"
                            variant="outlined"
                            sx={{
                                borderRadius: 4,
                                position: { md: 'sticky' },
                                top: { md: 92 },
                                bgcolor: surfaceBg,
                                borderColor: borderCol,
                                boxShadow: isDark
                                    ? '0 20px 45px rgba(0, 0, 0, 0.42)'
                                    : '0 14px 36px rgba(15, 23, 42, 0.08)',
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Typography variant="h5" fontWeight={900}>
                                        Configure Your Trip
                                    </Typography>
                                    <Chip
                                        label={rentalSlot.slotLabel}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.14)',
                                            color: '#D97706',
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                    Choose pickup/return hubs, dates, and exact times to check live availability.
                                </Typography>

                                <Stack spacing={2.25}>
                                    {/* Quick Presets */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                                        <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ mr: 0.5 }}>
                                            Quick slots:
                                        </Typography>
                                        <Chip
                                            label="23h Day Trip"
                                            size="small"
                                            variant="outlined"
                                            clickable
                                            onClick={() => handlePreset('23h')}
                                            sx={{ fontWeight: 700, fontSize: '0.73rem' }}
                                        />
                                        <Chip
                                            label="48h 2-Day"
                                            size="small"
                                            variant="outlined"
                                            clickable
                                            onClick={() => handlePreset('48h')}
                                            sx={{ fontWeight: 700, fontSize: '0.73rem' }}
                                        />
                                        <Chip
                                            label="3-Day Coastal"
                                            size="small"
                                            variant="outlined"
                                            clickable
                                            onClick={() => handlePreset('3d')}
                                            sx={{ fontWeight: 700, fontSize: '0.73rem' }}
                                        />
                                    </Box>

                                    {/* Branches */}
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                select
                                                fullWidth
                                                required
                                                size="small"
                                                label="Pickup branch"
                                                value={pickupId}
                                                onChange={(e) => handlePickupStoreChange(e.target.value)}
                                            >
                                                {stores.map((s) => (
                                                    <MenuItem key={s.id} value={String(s.id)}>
                                                        {s.name} ({s.city})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                select
                                                fullWidth
                                                required
                                                size="small"
                                                label="Return branch"
                                                value={returnId}
                                                onChange={(e) => handleReturnStoreChange(e.target.value)}
                                            >
                                                {stores.map((s) => (
                                                    <MenuItem key={s.id} value={String(s.id)}>
                                                        {s.name} ({s.city})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                    </Grid>

                                    {/* Optional Landmark Pickup / Return Points */}
                                    {(pickupPoints.length > 0 || returnPoints.length > 0) && (
                                        <Grid container spacing={1.5}>
                                            {pickupPoints.length > 0 && (
                                                <Grid size={{ xs: 12, sm: returnPoints.length > 0 ? 6 : 12 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        label="Pickup point"
                                                        value={pickupPointId}
                                                        onChange={(e) => setPickupPointId(e.target.value)}
                                                    >
                                                        <MenuItem value="">Main Hub (Free)</MenuItem>
                                                        {pickupPoints.map((pt) => (
                                                            <MenuItem key={pt.id} value={String(pt.id)}>
                                                                {pt.name}
                                                                {pt.pickup_fee > 0 ? ` (+₹${pt.pickup_fee})` : ' (Free)'}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                            )}
                                            {returnPoints.length > 0 && (
                                                <Grid size={{ xs: 12, sm: pickupPoints.length > 0 ? 6 : 12 }}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        label="Return point"
                                                        value={returnPointId}
                                                        onChange={(e) => setReturnPointId(e.target.value)}
                                                    >
                                                        <MenuItem value="">Main Hub (Free)</MenuItem>
                                                        {returnPoints.map((pt) => (
                                                            <MenuItem key={pt.id} value={String(pt.id)}>
                                                                {pt.name}
                                                                {pt.return_fee > 0 ? ` (+₹${pt.return_fee})` : ' (Free)'}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                            )}
                                        </Grid>
                                    )}

                                    {/* Pickup Date + Time */}
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 7 }}>
                                            <TextField
                                                type="date"
                                                fullWidth
                                                required
                                                size="small"
                                                label="Pickup date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    const next = e.target.value;
                                                    setStartDate(next);
                                                    if (endDate && next && endDate < next) {
                                                        setEndDate(next);
                                                    }
                                                }}
                                                slotProps={{
                                                    inputLabel: { shrink: true },
                                                    htmlInput: { min: today },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 5 }}>
                                            <TextField
                                                type="time"
                                                fullWidth
                                                required
                                                size="small"
                                                label="Pickup time"
                                                value={pickupTime}
                                                onChange={(e) => setPickupTime(e.target.value)}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* Return Date + Time */}
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 7 }}>
                                            <TextField
                                                type="date"
                                                fullWidth
                                                required
                                                size="small"
                                                label="Return date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                slotProps={{
                                                    inputLabel: { shrink: true },
                                                    htmlInput: { min: startDate || today },
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 5 }}>
                                            <TextField
                                                type="time"
                                                fullWidth
                                                required
                                                size="small"
                                                label="Return time"
                                                value={returnTime}
                                                onChange={(e) => setReturnTime(e.target.value)}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* Live Schedule & Fare Summary */}
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
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.25 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <CalendarMonthIcon sx={{ fontSize: 17, color: '#F59E0B' }} />
                                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    Selected Schedule
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={850} sx={{ color: isDark ? '#38BDF8' : '#0F766E' }}>
                                                {rentalSlot.durationLabel}
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={1} sx={{ mb: estimatedRental !== null ? 1.5 : 0 }}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Pick-up
                                                </Typography>
                                                <Typography variant="body2" fontWeight={800}>
                                                    {formatShortDate(startDate)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800 }}>
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
                                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800 }}>
                                                    {rentalSlot.returnTime12}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {estimatedRental !== null && (
                                            <>
                                                <Divider sx={{ my: 1.25, borderColor: borderCol }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            Estimated Base Rental ({rentalSlot.days} day{rentalSlot.days > 1 ? 's' : ''})
                                                        </Typography>
                                                        {locationSurcharge > 0 && (
                                                            <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                                                Includes +₹{locationSurcharge} point fee
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={900} sx={{ color: '#F59E0B' }}>
                                                        ₹{Number(estimatedRental).toLocaleString('en-IN')}
                                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.4 }}>
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
                                        sx={{ borderRadius: 2.5, fontWeight: 650 }}
                                    >
                                        {availabilityText}
                                    </Alert>

                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        endIcon={<ArrowForwardIcon />}
                                        disabled={!datesValid || isLoading || !availability?.is_available || isError}
                                        onClick={beginBooking}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2.5,
                                            fontWeight: 850,
                                            fontSize: '0.98rem',
                                            textTransform: 'none',
                                            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
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
                        display: { xs: 'flex', md: 'none' },
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
                        <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#D97706', lineHeight: 1.15 }}>
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
                        color="secondary"
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

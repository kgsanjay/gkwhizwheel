import React, { useState, useId } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
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
    CircularProgress,
    Alert,
    Stack,
    Divider,
    InputAdornment,
    Breadcrumbs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DirectionsIcon from '@mui/icons-material/Directions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SpeedIcon from '@mui/icons-material/Speed';
import NavigationIcon from '@mui/icons-material/Navigation';

export default function BikesIndex({ categories = [], stores = [], initialFilters = {} }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    // Form control unique IDs for SC 1.3.1 (Info & Relationships)
    const categoryInputId = useId();
    const storeInputId = useId();
    const startDateInputId = useId();
    const endDateInputId = useId();
    const minPriceInputId = useId();
    const maxPriceInputId = useId();

    const [filters, setFilters] = useState({
        category_id: initialFilters.category_id || '',
        store_id: initialFilters.store_id || '',
        min_price: initialFilters.min_price || '',
        max_price: initialFilters.max_price || '',
        start_date: initialFilters.start_date || '',
        end_date: initialFilters.end_date || '',
    });

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleCategoryChip = (catId) => {
        setFilters((prev) => ({
            ...prev,
            category_id: prev.category_id === String(catId) ? '' : String(catId),
        }));
    };

    const handleReset = () => {
        setFilters({
            category_id: '',
            store_id: '',
            min_price: '',
            max_price: '',
            start_date: '',
            end_date: '',
        });
    };

    // Clean active params (omit empty strings)
    const activeParams = Object.entries(filters).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
            acc[key] = val;
        }
        return acc;
    }, {});

    // React Query to fetch bikes
    const {
        data: bikesResponse,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['bikes', activeParams],
        queryFn: () => apiClient.get('/bikes', { params: activeParams }),
        keepPreviousData: true,
    });

    const bikes = bikesResponse?.data || [];

    // WCAG Compliant Text Tokens
    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155'; // Passes WCAG AAA (7.5:1 on light)
    const mutedTextColor = isDark ? '#94A3B8' : '#475569'; // Passes WCAG AA (5.4:1 on light)
    const cardBgColor = isDark ? '#111827' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
    const weekdayPriceColor = isDark ? '#F59E0B' : '#B45309'; // Contrast > 5.2:1 in light mode
    const weekendPriceColor = isDark ? '#38BDF8' : '#0369A1'; // Contrast > 5.5:1 in light mode



    return (
        <AppLayout>
            <Head>
                <title>Browse Fleet & Rates - Bike Rental in Honnavar | GK WhizWheels</title>
                <meta
                    name="description"
                    content="Rent verified Honda Activa scooters, Royal Enfield Classic 350, and commuter bikes in Honnavar from ₹350/day. Zero deposit options, free helmets, and 5-min station pickup."
                />
            </Head>

            {/* WCAG SC 2.4.1 Main Landmark Container */}
            <Box component="main" id="main-content" sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    1. MODERN 2-COLUMN HERO SECTION (Left Text + Right Bike Rental Showcase Card)
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="fleet-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E293B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 55%, #EFF6FF 100%)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                    }}
                >
                    {/* Ambient Glows */}
                    <Box
                        aria-hidden="true"
                        sx={{
                            position: 'absolute',
                            top: -100,
                            right: -80,
                            width: 500,
                            height: 500,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <Box
                        aria-hidden="true"
                        sx={{
                            position: 'absolute',
                            bottom: -100,
                            left: -80,
                            width: 450,
                            height: 450,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />

                    <Box sx={{ maxWidth: '1380px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
                            {/* Left Column: Headline, Narrative, Value Props & CTAs */}
                            <Grid size={{ xs: 12, lg: 6.5 }}>
                                {/* Breadcrumbs & Live Badge */}
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                                    <Breadcrumbs
                                        aria-label="Breadcrumb navigation"
                                        sx={{ '& .MuiBreadcrumbs-separator': { color: secondaryTextColor } }}
                                    >
                                        <Typography
                                            component={Link}
                                            href="/"
                                            variant="caption"
                                            sx={{
                                                color: secondaryTextColor,
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                '&:hover': { color: '#F59E0B' },
                                                '&:focus-visible': { outline: '2px solid #F59E0B', borderRadius: 1 },
                                            }}
                                        >
                                            Home
                                        </Typography>
                                        <Typography
                                            component={Link}
                                            href="/services"
                                            variant="caption"
                                            sx={{
                                                color: secondaryTextColor,
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                '&:hover': { color: '#F59E0B' },
                                            }}
                                        >
                                            Services
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            aria-current="page"
                                            sx={{ color: isDark ? '#F59E0B' : '#B45309', fontWeight: 800 }}
                                        >
                                            Bikes & Scooters
                                        </Typography>
                                    </Breadcrumbs>

                                    <Chip
                                        icon={<StarIcon aria-hidden="true" sx={{ fontSize: '0.9rem !important', color: '#F59E0B' }} />}
                                        label="5.0 ★ Google Rated (324+ Reviews)"
                                        size="small"
                                        sx={{
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                                            color: isDark ? '#FBBF24' : '#92400E',
                                            fontWeight: 800,
                                            fontSize: '0.74rem',
                                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                                        }}
                                    />
                                </Box>

                                {/* Modern Headline */}
                                <Typography
                                    id="fleet-hero-heading"
                                    variant="h1"
                                    component="h1"
                                    sx={{
                                        color: primaryTextColor,
                                        fontSize: { xs: '2.15rem', sm: '2.85rem', md: '3.4rem' },
                                        fontWeight: 950,
                                        lineHeight: { xs: 1.15, md: 1.1 },
                                        letterSpacing: '-0.035em',
                                        mb: 1.8,
                                    }}
                                >
                                    Rental Bikes & Scooters in{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        Honnavar
                                    </Box>
                                </Typography>

                                {/* Subhead Narrative */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: secondaryTextColor,
                                        fontSize: { xs: '0.98rem', sm: '1.05rem', md: '1.1rem' },
                                        lineHeight: 1.65,
                                        mb: 3,
                                        maxWidth: 620,
                                        fontWeight: 500,
                                    }}
                                >
                                    Explore Honnavar beaches, Sharavathi backwaters, Gokarna & Jog Falls with verified, road-tested two-wheelers. Free 5-minute handover right at <strong>Honnavar Railway Station (Platform 1 Exit)</strong> or our Palya Main Road Head Office.
                                </Typography>

                                {/* 4 Modern Trust Features - Clean Frosted Badges */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5, maxWidth: 640 }}>
                                    {[
                                        {
                                            icon: <ShieldIcon sx={{ color: '#F59E0B', fontSize: 18 }} />,
                                            title: 'Zero Security Deposit',
                                            desc: 'Available on Aadhaar & round-trip verification',
                                        },
                                        {
                                            icon: <LocationOnIcon sx={{ color: '#0284C7', fontSize: 18 }} />,
                                            title: 'Station Platform 1 Delivery',
                                            desc: 'Bike waiting as soon as your train arrives',
                                        },
                                        {
                                            icon: <SportsMotorsportsIcon sx={{ color: '#10B981', fontSize: 18 }} />,
                                            title: '2 Free Sanitized Helmets',
                                            desc: 'ISI helmets + phone mount & charger included',
                                        },
                                        {
                                            icon: <PhoneIcon sx={{ color: '#7C3AED', fontSize: 18 }} />,
                                            title: '24/7 Roadside Rescue',
                                            desc: 'On-call breakdown helpline across Uttara Kannada',
                                        },
                                    ].map((item, idx) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.4,
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.2,
                                                    borderRadius: 2.5,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
                                                    transition: 'border-color 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: '#F59E0B',
                                                    },
                                                }}
                                            >
                                                <Box sx={{ mt: 0.2, flexShrink: 0 }}>{item.icon}</Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.84rem', lineHeight: 1.2 }}>
                                                        {item.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.73rem', display: 'block', mt: 0.3, lineHeight: 1.3 }}>
                                                        {item.desc}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Action Buttons */}
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1.5 }}>
                                    <Button
                                        component="a"
                                        href="#fleet-catalog-heading"
                                        variant="contained"
                                        size="medium"
                                        endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                        sx={{
                                            fontWeight: 900,
                                            px: 3,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.92rem',
                                            bgcolor: '#F59E0B',
                                            color: '#0F172A',
                                            boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.4)',
                                            '&:hover': { bgcolor: '#D97706' },
                                        }}
                                    >
                                        Explore Available Fleet ({bikes.length > 0 ? bikes.length : '9'} Bikes) ↓
                                    </Button>
                                    <Button
                                        component="a"
                                        href="tel:+918660989586"
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<PhoneIcon sx={{ color: isDark ? '#FBBF24' : '#D97706' }} />}
                                        sx={{
                                            fontWeight: 750,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': {
                                                borderColor: '#F59E0B',
                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)',
                                            },
                                        }}
                                    >
                                        Call 24/7 Desk
                                    </Button>
                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20rent%20a%20bike%20in%20Honnavar."
                                        target="_blank"
                                        rel="noreferrer"
                                        variant="contained"
                                        size="medium"
                                        startIcon={<WhatsAppIcon />}
                                        sx={{
                                            bgcolor: '#16A34A',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': { bgcolor: '#15803D' },
                                        }}
                                    >
                                        WhatsApp
                                    </Button>
                                </Stack>
                            </Grid>

                            {/* Right Column: Modern High-End Bike Rental Card */}
                            <Grid size={{ xs: 12, lg: 5.5 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: 'relative',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                                        backdropFilter: 'blur(20px)',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                        boxShadow: isDark
                                            ? '0 25px 50px -12px rgba(0,0,0,0.65)'
                                            : '0 20px 45px -10px rgba(15, 23, 42, 0.08)',
                                    }}
                                >
                                    {/* Top Card Header */}
                                    <Box
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TwoWheelerIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 850, letterSpacing: '0.06em', color: primaryTextColor, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                                Honnavar Station Fleet Hub
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label="From ₹350 / Day"
                                            size="small"
                                            sx={{
                                                bgcolor: '#F59E0B',
                                                color: '#0F172A',
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                height: 24,
                                            }}
                                        />
                                    </Box>

                                    {/* Cinematic Bike Image Showcase */}
                                    <Box sx={{ position: 'relative', height: { xs: 240, sm: 280 } }}>
                                        <Box
                                            component="img"
                                            src="/images/services/two_wheelers.jpg"
                                            alt="Rental Bikes and Scooters in Honnavar"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                p: 2,
                                            }}
                                        >
                                            {/* Top Overlay Badges */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label="Self-Drive Rentals"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FBBF24',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                                    }}
                                                />
                                                <Chip
                                                    icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 13 }} />}
                                                    label="5.0 ★ Verified"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 700,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                    }}
                                                />
                                            </Box>

                                            {/* Bottom Overlay Title */}
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', display: 'block' }}>
                                                    Honnavar • Gokarna • Murudeshwar • Jog Falls
                                                </Typography>
                                                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mt: 0.3 }}>
                                                    Tour Coastal Karnataka With Full Independence
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* 3 Metric Pillars Under Image */}
                                    <Grid container sx={{ p: 1.2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0' }}>
                                        {[
                                            { label: 'DAILY RATE', val: 'Starts ₹350' },
                                            { label: 'STATION PICKUP', val: 'Platform 1 (5 Min)' },
                                            { label: 'SECURITY DEPOSIT', val: 'Zero Deposit' },
                                        ].map((stat, idx) => (
                                            <Grid key={idx} size={{ xs: 4 }} sx={{ textAlign: 'center', borderRight: idx < 2 ? (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0') : 'none', py: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em', display: 'block' }}>
                                                    {stat.label}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 900, fontSize: '0.78rem', mt: 0.2 }}>
                                                    {stat.val}
                                                </Typography>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Card Footer Features & Booking Action */}
                                    <Box sx={{ p: 2.2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800, fontSize: '0.78rem' }}>
                                                Fleet Ready for Handover at Railway Station Counter
                                            </Typography>
                                        </Box>

                                        {/* Quick Fleet Model Badges */}
                                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.6, mb: 2 }}>
                                            {['Honda Activa 6G', 'Classic 350', 'CB350', 'Electric EV'].map((modelName, mIdx) => (
                                                <Chip
                                                    key={mIdx}
                                                    label={modelName}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.72rem',
                                                        fontWeight: 750,
                                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                                        color: primaryTextColor,
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    }}
                                                />
                                            ))}
                                        </Stack>

                                        {/* Direct Booking CTA */}
                                        <Button
                                            component="a"
                                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20rent%20a%20bike%20in%20Honnavar."
                                            target="_blank"
                                            rel="noreferrer"
                                            variant="contained"
                                            fullWidth
                                            startIcon={<WhatsAppIcon />}
                                            sx={{
                                                bgcolor: '#16A34A',
                                                color: '#FFFFFF',
                                                fontWeight: 850,
                                                py: 1.1,
                                                borderRadius: 2.2,
                                                fontSize: '0.88rem',
                                                '&:hover': { bgcolor: '#15803D' },
                                            }}
                                        >
                                            Quick Reserve via WhatsApp
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. SEARCH & FILTER PANEL (Sleek Modern Floating Dock)
                ========================================================================== */}
                <Box
                    sx={{
                        maxWidth: '1380px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        pt: { xs: 4, md: 5 },
                        pb: 2,
                    }}
                >
                    <Paper
                        component="section"
                        aria-labelledby="filter-section-heading"
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, sm: 3 },
                            mb: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                            backdropFilter: 'blur(20px)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                            borderRadius: 3.5,
                            boxShadow: isDark ? '0 15px 35px rgba(0,0,0,0.35)' : '0 10px 30px rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        {/* Category Quick Tabs */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FilterAltIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                                <Typography id="filter-section-heading" variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                                    Filter Fleet By Category:
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8 }}>
                                <Chip
                                    label={`All Fleet (${bikes.length})`}
                                    size="small"
                                    onClick={() => handleFilterChange('category_id', '')}
                                    sx={{
                                        fontWeight: 850,
                                        cursor: 'pointer',
                                        bgcolor: filters.category_id === '' ? '#F59E0B' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                                        color: filters.category_id === '' ? '#0F172A' : primaryTextColor,
                                        border: filters.category_id === '' ? '1px solid #F59E0B' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'),
                                        '&:hover': { bgcolor: filters.category_id === '' ? '#D97706' : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') },
                                    }}
                                />
                                {categories.map((cat) => {
                                    const isSelected = filters.category_id === String(cat.id);
                                    return (
                                        <Chip
                                            key={cat.id}
                                            label={cat.name}
                                            size="small"
                                            onClick={() => handleCategoryChip(cat.id)}
                                            sx={{
                                                fontWeight: isSelected ? 850 : 700,
                                                cursor: 'pointer',
                                                bgcolor: isSelected ? '#F59E0B' : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                                                color: isSelected ? '#0F172A' : primaryTextColor,
                                                border: isSelected ? '1px solid #F59E0B' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'),
                                                '&:hover': { bgcolor: isSelected ? '#D97706' : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') },
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* Search Filter Inputs */}
                        <Grid container spacing={2} alignItems="center">
                            {/* Pickup Store / Hub */}
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    id={storeInputId}
                                    name="store_id"
                                    select
                                    fullWidth
                                    label="Pickup & Return Hub"
                                    value={filters.store_id}
                                    onChange={(e) => handleFilterChange('store_id', e.target.value)}
                                    size="small"
                                    slotProps={{
                                        inputLabel: { htmlFor: storeInputId },
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOnIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                >
                                    <MenuItem value="">All Hubs (Honnavar)</MenuItem>
                                    {stores.map((store) => (
                                        <MenuItem key={store.id} value={store.id}>
                                            {store.name} ({store.city})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Pickup Date */}
                            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                <TextField
                                    id={startDateInputId}
                                    name="start_date"
                                    fullWidth
                                    type="date"
                                    label="Pickup Date"
                                    slotProps={{
                                        inputLabel: { shrink: true, htmlFor: startDateInputId },
                                    }}
                                    size="small"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                            </Grid>

                            {/* Return Date */}
                            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                <TextField
                                    id={endDateInputId}
                                    name="end_date"
                                    fullWidth
                                    type="date"
                                    label="Return Date"
                                    slotProps={{
                                        inputLabel: { shrink: true, htmlFor: endDateInputId },
                                    }}
                                    size="small"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </Grid>

                            {/* Max Price */}
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <TextField
                                    id={maxPriceInputId}
                                    name="max_price"
                                    fullWidth
                                    type="number"
                                    label="Max Budget/Day"
                                    placeholder="e.g. 1500"
                                    size="small"
                                    slotProps={{
                                        inputLabel: { htmlFor: maxPriceInputId },
                                        input: {
                                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        },
                                    }}
                                    value={filters.max_price}
                                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                />
                            </Grid>

                            {/* Reset Filter Action */}
                            <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<RestartAltIcon aria-hidden="true" />}
                                    onClick={handleReset}
                                    aria-label="Reset all search filters"
                                    sx={{
                                        color: primaryTextColor,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                        fontWeight: 750,
                                        height: 40,
                                        fontSize: '0.82rem',
                                        '&:hover': {
                                            borderColor: '#F59E0B',
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)',
                                        },
                                    }}
                                >
                                    Reset
                                </Button>
                            </Grid>
                        </Grid>

                        {/* Search Dock Footer */}
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 700, fontSize: '0.84rem' }}>
                                    {!isLoading ? (
                                        <>Showing <Box component="span" sx={{ color: isDark ? '#F59E0B' : '#B45309', fontWeight: 900 }}>{bikes.length}</Box> verified vehicle(s) ready for delivery</>
                                    ) : (
                                        'Updating live fleet inventory...'
                                    )}
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 600 }}>
                                Dual Hubs: Honnavar Railway Station (Platform 1) • Palya Main Road Head Office
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Error Display */}
                    {isError && (
                        <Alert
                            severity="error"
                            role="alert"
                            sx={{ mb: 4, borderRadius: 2, fontWeight: 600 }}
                        >
                            {error?.message || 'Unable to connect to the fleet catalog. Please check your internet connection or try again.'}
                        </Alert>
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
                            <CircularProgress color="secondary" size={48} aria-label="Loading available bikes" />
                            <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                                Checking live fleet inventory in Honnavar...
                            </Typography>
                        </Box>
                    )}

                    {/* Empty State */}
                    {!isLoading && !isError && bikes.length === 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                py: 9,
                                px: 3,
                                textAlign: 'center',
                                border: isDark ? '1px dashed rgba(255, 255, 255, 0.2)' : '1px dashed #94A3B8',
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                backdropFilter: 'blur(16px)',
                            }}
                        >
                            <TwoWheelerIcon aria-hidden="true" sx={{ fontSize: 64, color: isDark ? '#64748B' : '#94A3B8', mb: 2 }} />
                            <Typography variant="h5" component="h3" sx={{ fontWeight: 850, mb: 1, color: primaryTextColor }}>
                                No Bikes Found Matching Your Filter
                            </Typography>
                            <Typography variant="body2" sx={{ maxWidth: 480, mx: 'auto', mb: 3, color: secondaryTextColor, lineHeight: 1.6 }}>
                                We could not find bikes in that specific budget or date bracket. Try widening your price range or clearing the category filter.
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleReset}
                                sx={{ fontWeight: 800, px: 3, py: 1, borderRadius: 2 }}
                            >
                                Clear All Filters
                            </Button>
                        </Paper>
                    )}

                    {/* =========================================================================
                        3. BIKE CATALOG GRID (Modern 2026 Cards with Exact Specs & Real Rates)
                    ========================================================================== */}
                    {!isLoading && !isError && bikes.length > 0 && (
                        <Box component="section" aria-labelledby="fleet-catalog-heading">
                            <Typography
                                id="fleet-catalog-heading"
                                variant="h2"
                                sx={{
                                    fontSize: { xs: '1.4rem', sm: '1.75rem' },
                                    fontWeight: 900,
                                    color: primaryTextColor,
                                    letterSpacing: '-0.02em',
                                    mb: 3,
                                }}
                            >
                                Available Fleet & Models in Honnavar
                            </Typography>

                            <Grid container spacing={3}>
                                {bikes.map((bike) => {
                                    const weekdayRate = bike.weekday_rate || bike.daily_rate || bike.base_daily_rate_override || bike.category?.base_daily_rate || '350.00';
                                    const weekendRate = bike.weekend_rate || (Number(weekdayRate) + (Number(weekdayRate) >= 1000 ? (Number(weekdayRate) >= 1200 ? 300 : 200) : (Number(weekdayRate) === 450 ? 50 : 100)));
                                    const isElectric = bike.fuel_type === 'electric';

                                    // Build forward query params to retain user dates
                                    const queryParams = new URLSearchParams();
                                    if (filters.start_date) queryParams.set('start_date', filters.start_date);
                                    if (filters.end_date) queryParams.set('end_date', filters.end_date);
                                    if (filters.store_id) queryParams.set('pickup_store_id', filters.store_id);
                                    const detailUrl = `/bikes/${bike.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

                                    const imageSrc = bike.primary_image_url || (bike.primary_image_path ? (bike.primary_image_path.startsWith('http') ? bike.primary_image_path : `/storage/${bike.primary_image_path}`) : null) || '/storage/bikes/honda-activa.jpg';

                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bike.id}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    bgcolor: cardBgColor,
                                                    border: `1px solid ${cardBorderColor}`,
                                                    borderRadius: 3.5,
                                                    overflow: 'hidden',
                                                    boxShadow: isDark
                                                        ? '0 10px 30px rgba(0,0,0,0.35)'
                                                        : '0 4px 20px -4px rgba(15, 23, 42, 0.08)',
                                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        borderColor: '#F59E0B',
                                                        boxShadow: isDark
                                                            ? '0 20px 40px rgba(0,0,0,0.6)'
                                                            : '0 16px 36px -6px rgba(15, 23, 42, 0.12)',
                                                    },
                                                }}
                                            >
                                                {/* Bike Photo Showcase */}
                                                <Box
                                                    sx={{
                                                        height: 220,
                                                        width: '100%',
                                                        position: 'relative',
                                                        bgcolor: isDark ? '#1F2937' : '#E2E8F0',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={imageSrc}
                                                        alt={`${bike.brand} ${bike.model_name} rental scooter/bike in Honnavar`}
                                                        loading="lazy"
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            objectPosition: 'center 75%',
                                                            transition: 'transform 0.4s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.04)',
                                                            },
                                                        }}
                                                    />

                                                    {/* Fuel / EV Badge */}
                                                    <Chip
                                                        icon={
                                                            isElectric ? (
                                                                <ElectricBoltIcon aria-hidden="true" sx={{ color: '#F59E0B !important' }} />
                                                            ) : (
                                                                <LocalGasStationIcon aria-hidden="true" sx={{ color: '#FFFFFF !important' }} />
                                                            )
                                                        }
                                                        label={isElectric ? 'Electric EV' : 'Petrol'}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 12,
                                                            right: 12,
                                                            bgcolor: 'rgba(15, 23, 42, 0.88)',
                                                            backdropFilter: 'blur(8px)',
                                                            color: isElectric ? '#F59E0B' : '#FFFFFF',
                                                            fontWeight: 800,
                                                            border: '1px solid rgba(255, 255, 255, 0.25)',
                                                        }}
                                                    />

                                                    {/* Registration Plate Tag */}
                                                    <Chip
                                                        label={bike.registration_number}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 12,
                                                            left: 12,
                                                            bgcolor: 'rgba(15, 23, 42, 0.9)',
                                                            backdropFilter: 'blur(8px)',
                                                            color: '#F8FAFC',
                                                            fontSize: '0.74rem',
                                                            fontFamily: 'monospace',
                                                            fontWeight: 800,
                                                            letterSpacing: '0.05em',
                                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        }}
                                                    />

                                                    {/* Scrim Bottom Gradient for Legibility */}
                                                    <Box
                                                        aria-hidden="true"
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            left: 0,
                                                            right: 0,
                                                            height: '40px',
                                                            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.4), transparent)',
                                                            pointerEvents: 'none',
                                                        }}
                                                    />
                                                </Box>

                                                {/* Card Content */}
                                                <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                    {/* Category & Transmission Pill */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: isDark ? '#38BDF8' : '#0369A1',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                fontSize: '0.72rem',
                                                            }}
                                                        >
                                                            {bike.category?.name || 'Two-Wheeler'} • {bike.transmission || 'Automatic'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 750 }}>
                                                            ✓ Verified
                                                        </Typography>
                                                    </Box>

                                                    <Typography
                                                        variant="h5"
                                                        component="h3"
                                                        sx={{
                                                            fontWeight: 850,
                                                            color: primaryTextColor,
                                                            mb: 1,
                                                            fontSize: '1.25rem',
                                                            lineHeight: 1.3,
                                                        }}
                                                    >
                                                        {bike.brand} {bike.model_name}
                                                    </Typography>

                                                    {/* Pickup Hub Location */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2 }}>
                                                        <LocationOnIcon aria-hidden="true" sx={{ fontSize: 16, color: isDark ? '#F59E0B' : '#D97706' }} />
                                                        <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                                                            {bike.current_store?.name || 'Honnavar Main Hub (Palya & Railway Stn)'}
                                                        </Typography>
                                                    </Box>

                                                    {/* Pricing Box (Mon-Thu vs Fri-Sun) */}
                                                    <Box
                                                        sx={{
                                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                                            p: 1.8,
                                                            borderRadius: 2.5,
                                                            mb: 2.5,
                                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 750, fontSize: '0.84rem' }}>
                                                                Mon – Thu <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500 }}>(Weekday)</Box>
                                                            </Typography>
                                                            <Typography variant="h6" sx={{ fontWeight: 950, color: weekdayPriceColor, lineHeight: 1 }}>
                                                                ₹{Number(weekdayRate).toLocaleString('en-IN')}{' '}
                                                                <Typography component="span" variant="caption" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                                                                    /day
                                                                </Typography>
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 750, fontSize: '0.84rem' }}>
                                                                Fri – Sun <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500 }}>(Weekend)</Box>
                                                            </Typography>
                                                            <Typography variant="h6" sx={{ fontWeight: 950, color: weekendPriceColor, lineHeight: 1 }}>
                                                                ₹{Number(weekendRate).toLocaleString('en-IN')}{' '}
                                                                <Typography component="span" variant="caption" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                                                                    /day
                                                                </Typography>
                                                            </Typography>
                                                        </Box>

                                                        <Divider sx={{ my: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800 }}>
                                                                ✓ Zero Deposit Option
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                                                                Instant 5-Min Pickup
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Primary Booking Button */}
                                                    <Button
                                                        component={Link}
                                                        href={detailUrl}
                                                        variant="contained"
                                                        color="secondary"
                                                        fullWidth
                                                        endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                                        aria-label={`Book ${bike.brand} ${bike.model_name} starting at ₹${weekdayRate} per day`}
                                                        sx={{
                                                            mt: 'auto',
                                                            fontWeight: 900,
                                                            borderRadius: 2.2,
                                                            py: 1.2,
                                                            fontSize: '0.92rem',
                                                            bgcolor: '#F59E0B',
                                                            color: '#0F172A',
                                                            '&:hover': { bgcolor: '#D97706' },
                                                            '&:focus-visible': {
                                                                outline: '3px solid #0F172A',
                                                                outlineOffset: '2px',
                                                            },
                                                        }}
                                                    >
                                                        Book Now
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    )}

                    {/* =========================================================================
                        4. HONNAVAR BIKE RENTAL PRICE & DURATION DISCOUNTS
                    ========================================================================== */}
                    <Box id="pricing" component="section" aria-labelledby="pricing-heading" sx={{ mt: { xs: 8, md: 11 }, mb: 10 }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="TRANSPARENT TARIFF • ZERO SURGE"
                                sx={{
                                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                                    color: isDark ? '#38BDF8' : '#0369A1',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.06em',
                                    mb: 1.5,
                                    border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
                                }}
                            />
                            <Typography
                                id="pricing-heading"
                                variant="h2"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    letterSpacing: '-0.02em',
                                    fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.7rem' },
                                    mb: 1.5,
                                }}
                            >
                                Honnavar Bike Rental Price & Transparent Rates
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 680, mx: 'auto', lineHeight: 1.7 }}>
                                Zero hidden surge fees. We offer the best <strong>honnavar bike rental price</strong> with exact 24-hour block billing, automated multi-day volume discounts, and guaranteed security deposit refunds.
                            </Typography>
                        </Box>

                        {/* Rate Comparison Table */}
                        <Paper
                            elevation={0}
                            sx={{
                                mb: 5,
                                bgcolor: isDark ? '#111827' : '#FFFFFF',
                                border: `1px solid ${cardBorderColor}`,
                                borderRadius: 3.5,
                                overflow: 'hidden',
                                boxShadow: isDark ? 'none' : '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
                            }}
                        >
                            <TableContainer
                                tabIndex={0}
                                aria-label="Honnavar bike rental pricing and rate comparison table"
                                sx={{ '&:focus-visible': { outline: '2px solid #F59E0B' } }}
                            >
                                <Table sx={{ minWidth: 700 }}>
                                    <TableHead sx={{ bgcolor: isDark ? '#0F172A' : '#1E293B' }}>
                                        <TableRow>
                                            <TableCell component="th" scope="col" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem' }}>Vehicle Model</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem' }}>Category & Spec</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#FBBF24', fontWeight: 800, fontSize: '0.9rem' }}>Mon – Thu (Weekday)</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#7DD3FC', fontWeight: 800, fontSize: '0.9rem' }}>Fri – Sun (Weekend)</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#6EE7B7', fontWeight: 800, fontSize: '0.9rem' }}>Security Deposit</TableCell>
                                            <TableCell component="th" scope="col" align="right" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[
                                            { name: 'Honda Dio DLX', keyword: 'dio', spec: '110cc • Automatic • Petrol', weekday: 350, weekend: 450 },
                                            { name: "Honda H'ness CB350", keyword: 'ness', spec: '350cc • Manual Cruiser • Petrol', weekday: 1200, weekend: 1500 },
                                            { name: 'Royal Enfield Classic 350', keyword: 'classic', spec: '350cc • Manual Cruiser • Petrol', weekday: 1000, weekend: 1200 },
                                            { name: 'TVS Ntorq 125', keyword: 'ntorq', spec: '125cc • Sport Scooter • Petrol', weekday: 500, weekend: 600 },
                                            { name: 'Yamaha Fascino 125', keyword: 'fascino', spec: '125cc • Retro Style • Petrol', weekday: 450, weekend: 500 },
                                            { name: 'Suzuki Access 125', keyword: 'access', spec: '125cc • Classic Scooter • Petrol', weekday: 450, weekend: 500 },
                                            { name: 'Honda Activa 6G', keyword: 'activa', spec: '110cc • Easy Commuter • Petrol', weekday: 400, weekend: 500 },
                                            { name: 'Suzuki Burgman Street 125', keyword: 'burgman', spec: '125cc • Maxi Comfort • Petrol', weekday: 500, weekend: 600 },
                                            { name: 'TVS Orbiter EV', keyword: 'orbiter', spec: 'Electric Scooter • 0 Emissions', weekday: 500, weekend: 600 },
                                        ].map((row) => {
                                            const matchedBike = bikes.find((b) =>
                                                (b.model_name && b.model_name.toLowerCase().includes(row.keyword)) ||
                                                (b.brand && row.name.toLowerCase().includes(b.brand.toLowerCase()))
                                            );
                                            const bookHref = matchedBike ? `/bikes/${matchedBike.id}` : '#fleet-catalog-heading';

                                            return (
                                                <TableRow
                                                    key={row.name}
                                                    sx={{
                                                        '&:nth-of-type(even)': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC' },
                                                        '&:hover': { bgcolor: isDark ? 'rgba(245, 158, 11, 0.06)' : '#FFFBEB' },
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                        {row.name}
                                                    </TableCell>
                                                    <TableCell sx={{ color: secondaryTextColor, fontSize: '0.85rem' }}>
                                                        {row.spec}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, color: weekdayPriceColor }}>
                                                        ₹{row.weekday} <Box component="span" sx={{ fontSize: '0.74rem', color: mutedTextColor, fontWeight: 500 }}>/day</Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, color: weekendPriceColor }}>
                                                        ₹{row.weekend} <Box component="span" sx={{ fontSize: '0.74rem', color: mutedTextColor, fontWeight: 500 }}>/day</Box>
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800, fontSize: '0.85rem' }}>
                                                        ₹1,000 (Refundable)
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            component={matchedBike ? Link : 'a'}
                                                            href={bookHref}
                                                            size="small"
                                                            variant="contained"
                                                            color="secondary"
                                                            aria-label={`Select ${row.name} for booking`}
                                                            sx={{
                                                                fontWeight: 800,
                                                                px: 2,
                                                                borderRadius: 1.5,
                                                                bgcolor: '#F59E0B',
                                                                color: '#0F172A',
                                                                '&:hover': { bgcolor: '#D97706' },
                                                                '&:focus-visible': { outline: '2px solid #0F172A', outlineOffset: '1px' },
                                                            }}
                                                        >
                                                            Select
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        {/* Duration Discount Tiers */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h4"
                                component="h3"
                                sx={{
                                    fontWeight: 900,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.3rem', sm: '1.6rem' },
                                    mb: 2.5,
                                }}
                            >
                                Multi-Day Rental Volume Discounts
                            </Typography>

                            <Grid container spacing={3}>
                                {/* Daily Rental */}
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            height: '100%',
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            borderRadius: 3.5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Daily Rental
                                        </Typography>
                                        <Typography variant="h5" component="h4" sx={{ color: primaryTextColor, fontWeight: 950, my: 1 }}>
                                            1 – 2 Days
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2.5, lineHeight: 1.5 }}>
                                            Ideal for day trips to Sharavathi backwaters and Honnavar Eco Beach.
                                        </Typography>
                                        <Stack spacing={1.2} sx={{ mb: 3, flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Standard Tariff (From ₹350)</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>1 ISI Certified Helmet Free</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Exact 24-Hour Block Billing</Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component="a"
                                            href="#fleet-catalog-heading"
                                            variant="outlined"
                                            fullWidth
                                            sx={{
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                color: primaryTextColor,
                                                fontWeight: 800,
                                                '&:hover': { borderColor: '#F59E0B', color: '#F59E0B' },
                                                '&:focus-visible': { outline: '2px solid #F59E0B' },
                                            }}
                                        >
                                            Pick Bike Above
                                        </Button>
                                    </Paper>
                                </Grid>

                                {/* Weekend Coastal Getaway */}
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            height: '100%',
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                                            border: '2px solid #F59E0B',
                                            borderRadius: 3.5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >
                                        <Chip
                                            label="POPULAR"
                                            size="small"
                                            color="secondary"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                fontWeight: 850,
                                                fontSize: '0.68rem',
                                                bgcolor: '#F59E0B',
                                                color: '#0F172A',
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: isDark ? '#F59E0B' : '#B45309', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Coastal Getaway
                                        </Typography>
                                        <Typography variant="h5" component="h4" sx={{ color: primaryTextColor, fontWeight: 950, my: 1 }}>
                                            3 – 6 Days
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2.5, lineHeight: 1.5 }}>
                                            Explore Honnavar, Murudeshwar, and Gokarna with long-stay comfort.
                                        </Typography>
                                        <Stack spacing={1.2} sx={{ mb: 3, flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#F59E0B', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800 }}>10% Tiered Discount</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Dual Helmets Included</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Station Pickup Priority</Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component="a"
                                            href="#fleet-catalog-heading"
                                            variant="contained"
                                            color="secondary"
                                            fullWidth
                                            sx={{
                                                fontWeight: 850,
                                                bgcolor: '#F59E0B',
                                                color: '#0F172A',
                                                '&:hover': { bgcolor: '#D97706' },
                                                '&:focus-visible': { outline: '3px solid #0F172A' },
                                            }}
                                        >
                                            Book 3+ Days
                                        </Button>
                                    </Paper>
                                </Grid>

                                {/* Weekly Explorer */}
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            height: '100%',
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            borderRadius: 3.5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Weekly Explorer
                                        </Typography>
                                        <Typography variant="h5" component="h4" sx={{ color: primaryTextColor, fontWeight: 950, my: 1 }}>
                                            7 – 29 Days
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2.5, lineHeight: 1.5 }}>
                                            Top choice for tourists and remote workationers in coastal Karnataka.
                                        </Typography>
                                        <Stack spacing={1.2} sx={{ mb: 3, flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800 }}>15% Volume Discount</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Unlimited Kilometers</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Free 24/7 Roadside Cover</Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component="a"
                                            href="#fleet-catalog-heading"
                                            variant="outlined"
                                            fullWidth
                                            sx={{
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                color: primaryTextColor,
                                                fontWeight: 800,
                                                '&:hover': { borderColor: '#F59E0B', color: '#F59E0B' },
                                                '&:focus-visible': { outline: '2px solid #F59E0B' },
                                            }}
                                        >
                                            View Weekly Deals
                                        </Button>
                                    </Paper>
                                </Grid>

                                {/* Monthly Lease */}
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            height: '100%',
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            borderRadius: 3.5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Monthly Lease
                                        </Typography>
                                        <Typography variant="h5" component="h4" sx={{ color: primaryTextColor, fontWeight: 950, my: 1 }}>
                                            30+ Days
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2.5, lineHeight: 1.5 }}>
                                            Long term scooter rental in Honnavar with zero maintenance headaches.
                                        </Typography>
                                        <Stack spacing={1.2} sx={{ mb: 3, flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800 }}>Up to 25% Max Savings</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Free Routine Maintenance</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon aria-hidden="true" sx={{ color: '#059669', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Doorstep Hub Swaps</Typography>
                                            </Box>
                                        </Stack>
                                        <Button
                                            component="a"
                                            href="tel:+918660989586"
                                            variant="outlined"
                                            fullWidth
                                            sx={{
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                color: primaryTextColor,
                                                fontWeight: 800,
                                                '&:hover': { borderColor: '#F59E0B', color: '#F59E0B' },
                                                '&:focus-visible': { outline: '2px solid #F59E0B' },
                                            }}
                                        >
                                            Call for Monthly Quote
                                        </Button>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* =========================================================================
                        5. HOW HONNAVAR BIKE RENT WORKS (Connected Glowing 4-Step Pipeline)
                    ========================================================================== */}
                    <Box id="how-it-works" component="section" aria-labelledby="how-it-works-heading" sx={{ mb: { xs: 8, md: 11 } }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="EFFORTLESS BOOKING WORKFLOW"
                                sx={{
                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.12)',
                                    color: isDark ? '#34D399' : '#065F46',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.06em',
                                    mb: 1.5,
                                    border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(5, 150, 105, 0.3)',
                                }}
                            />
                            <Typography
                                id="how-it-works-heading"
                                variant="h2"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    letterSpacing: '-0.02em',
                                    fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.7rem' },
                                    mb: 1.5,
                                }}
                            >
                                How Honnavar Bike Rent Works
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto', lineHeight: 1.7 }}>
                                Renting a two-wheeler in Honnavar takes only 2 minutes online. We guarantee clean paperwork and instant station handover.
                            </Typography>
                        </Box>

                        <Box sx={{ position: 'relative' }}>
                            {/* Connected Pipeline Glowing Track on Desktop */}
                            <Box
                                aria-hidden="true"
                                sx={{
                                    display: { xs: 'none', md: 'block' },
                                    position: 'absolute',
                                    top: 48,
                                    left: '12%',
                                    right: '12%',
                                    height: '3px',
                                    background: isDark
                                        ? 'linear-gradient(90deg, #F59E0B 0%, #38BDF8 50%, #10B981 100%)'
                                        : 'linear-gradient(90deg, #D97706 0%, #0284C7 50%, #059669 100%)',
                                    opacity: 0.7,
                                    zIndex: 0,
                                }}
                            />

                            <Grid container spacing={3}>
                                {[
                                    {
                                        step: '01',
                                        badge: '⚡ Real-Time Fleet',
                                        title: 'Choose Bike & Hub',
                                        desc: 'Pick your preferred Honda Activa, Dio, or Royal Enfield with live real-time stock at Palya Main Rd or Honnavar Railway Station.',
                                        color: '#F59E0B',
                                        bgBadge: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                    },
                                    {
                                        step: '02',
                                        badge: '🔒 15-Min Concurrency Lock',
                                        title: 'Reserve & Hold Online',
                                        desc: 'Your vehicle is locked exclusively with zero double-booking risk. Pay securely with UPI, cards, or select pay on arrival.',
                                        color: '#38BDF8',
                                        bgBadge: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)',
                                    },
                                    {
                                        step: '03',
                                        badge: '🚉 Station Exit Handover',
                                        title: 'Digital KYC Handover',
                                        desc: 'Show your original Driving License. Receive sanitized ISI helmets, mobile holder, and digital vehicle documents in under 5 mins.',
                                        color: '#10B981',
                                        bgBadge: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                                    },
                                    {
                                        step: '04',
                                        badge: '💳 Immediate Deposit Refund',
                                        title: 'Ride & Swift Return',
                                        desc: 'Ride across Honnavar, Gokarna, and Murudeshwar with 24/7 breakdown help. Return at any hub; deposit refunds initiate on the spot.',
                                        color: '#A855F7',
                                        bgBadge: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(147, 51, 234, 0.1)',
                                    },
                                ].map((item, idx) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3.5,
                                                height: '100%',
                                                bgcolor: cardBgColor,
                                                border: `1px solid ${cardBorderColor}`,
                                                borderRadius: 3.5,
                                                position: 'relative',
                                                zIndex: 1,
                                                boxShadow: isDark
                                                    ? '0 10px 30px rgba(0,0,0,0.3)'
                                                    : '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                {/* Glowing Step Orb */}
                                                <Box
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        borderRadius: '50%',
                                                        bgcolor: item.bgBadge,
                                                        border: `2px solid ${item.color}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: item.color,
                                                        fontWeight: 950,
                                                        fontSize: '1.25rem',
                                                        boxShadow: `0 0 20px ${item.color}33`,
                                                    }}
                                                >
                                                    {item.step}
                                                </Box>
                                                <Chip
                                                    label={item.badge}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: item.bgBadge,
                                                        color: item.color,
                                                        fontWeight: 800,
                                                        fontSize: '0.68rem',
                                                    }}
                                                />
                                            </Box>

                                            <Typography variant="h6" component="h3" sx={{ color: primaryTextColor, fontWeight: 900, mb: 1.2, fontSize: '1.15rem' }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.6, flexGrow: 1 }}>
                                                {item.desc}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>

                    {/* =========================================================================
                        6. POPULAR SCENIC COASTAL RIDING ROUTES FROM HONNAVAR
                    ========================================================================== */}
                    <Box component="section" aria-labelledby="scenic-routes-heading" sx={{ mb: { xs: 8, md: 11 } }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="COASTAL KARNATAKA RIDING GUIDE"
                                sx={{
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.12)',
                                    color: isDark ? '#FBBF24' : '#92400E',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.06em',
                                    mb: 1.5,
                                    border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                                }}
                            />
                            <Typography
                                id="scenic-routes-heading"
                                variant="h2"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    letterSpacing: '-0.02em',
                                    fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.7rem' },
                                    mb: 1.5,
                                }}
                            >
                                Popular Riding Routes & Coastal Circuits
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 660, mx: 'auto', lineHeight: 1.7 }}>
                                Honnavar is the strategic gateway to Uttara Kannada. Enjoy smooth roads, dramatic sea cliffs, and shaded river trails.
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {[
                                {
                                    route: 'Sharavathi River & Mangrove Loop',
                                    distance: '12 km circuit',
                                    time: '25 mins ride',
                                    bike: 'Any Scooter (Activa/Dio)',
                                    highlight: 'Mangrove boardwalks, boat points & suspension bridge views',
                                },
                                {
                                    route: 'Honnavar Eco Beach Sunset Trail',
                                    distance: '5.8 km one-way',
                                    time: '12 mins ride',
                                    bike: 'Scooter or Electric EV',
                                    highlight: 'Blue Flag eco beach, palm groves & sunset seaside walkway',
                                },
                                {
                                    route: 'Apsarakonda Waterfalls & Ocean Cliff',
                                    distance: '7.2 km one-way',
                                    time: '18 mins ride',
                                    bike: 'Any Scooter / Bike',
                                    highlight: 'Natural freshwater pool, Pandava caves & panoramic cliff viewpoint',
                                },
                                {
                                    route: 'Murudeshwar Coastal Highway (NH-66)',
                                    distance: '27 km one-way',
                                    time: '35 mins ride',
                                    bike: 'Royal Enfield / Cruiser / 125cc',
                                    highlight: 'Gigantic Shiva statue, 18-storey Raja Gopura & beach water sports',
                                },
                                {
                                    route: 'Mirjan Historic Fort Trail',
                                    distance: '11.5 km one-way',
                                    time: '18 mins ride',
                                    bike: 'Any Two-Wheeler',
                                    highlight: '16th-century laterite stone architecture & lush green moat lawns',
                                },
                                {
                                    route: 'Gokarna Om Beach & Cliff Circuit',
                                    distance: '44 km one-way',
                                    time: '55 mins ride',
                                    bike: 'Classic 350 / Ntorq 125 / Commuter',
                                    highlight: 'Kudle Beach, Om Beach cliff cafes & Mahabaleshwar temple trail',
                                },
                            ].map((item, idx) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            borderRadius: 3.5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'border-color 0.2s ease, transform 0.2s ease',
                                            '&:hover': {
                                                borderColor: '#F59E0B',
                                                transform: 'translateY(-3px)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Chip
                                                icon={<NavigationIcon aria-hidden="true" sx={{ fontSize: '0.9rem !important', color: '#F59E0B' }} />}
                                                label={item.distance}
                                                size="small"
                                                sx={{
                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: isDark ? '#FBBF24' : '#92400E',
                                                    fontWeight: 800,
                                                    fontSize: '0.72rem',
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                ⏱ {item.time}
                                            </Typography>
                                        </Box>

                                        <Typography variant="h6" component="h3" sx={{ fontWeight: 850, color: primaryTextColor, mb: 1, fontSize: '1.1rem', lineHeight: 1.3 }}>
                                            {item.route}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.55, mb: 2, flexGrow: 1 }}>
                                            {item.highlight}
                                        </Typography>

                                        <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 1.5 }} />

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ color: isDark ? '#38BDF8' : '#0369A1', fontWeight: 750 }}>
                                                Best Bike: {item.bike}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* =========================================================================
                        7. HONNAVAR RENTAL BIKES FAQS (Accessible Accordions with Explicit IDs)
                    ========================================================================== */}
                    <Box id="faq" component="section" aria-labelledby="faq-heading" sx={{ mb: { xs: 8, md: 11 } }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="FREQUENTLY ASKED QUESTIONS"
                                sx={{
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.12)',
                                    color: isDark ? '#FBBF24' : '#92400E',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.06em',
                                    mb: 1.5,
                                    border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                                }}
                            />
                            <Typography
                                id="faq-heading"
                                variant="h2"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    letterSpacing: '-0.02em',
                                    fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.7rem' },
                                    mb: 1.5,
                                }}
                            >
                                Honnavar Rental Bikes — FAQs
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto' }}>
                                Everything you need to know about <strong>bike rental in honnavar</strong>, rental rates, deposits, and documents.
                            </Typography>
                        </Box>

                        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                            {[
                                {
                                    q: 'What is the average honnavar bike rental price?',
                                    a: 'At GK WhizWheels, our honnavar bike rental price is transparent and straightforward: Honda Activa scooters start from ₹350–₹400/day, sporty 125cc scooters start from ₹450–₹500/day, and Royal Enfield Classic 350 / Honda CB350 start from ₹1,000–₹1,200/day. We offer additional discounts of 10% for 3+ days and 15% for weekly rentals, with zero surge fees.',
                                },
                                {
                                    q: 'Can I get rental bikes delivered to Honnavar Railway Station?',
                                    a: 'Yes! We have an active Honnavar Railway Station Desk located right on Station Road at the Platform 1 exit. When your Konkan Railway train arrives, our representative meets you with your selected vehicle and helmets for an express 5-minute handover.',
                                },
                                {
                                    q: 'What documents are required for honnavar bike rent?',
                                    a: 'To rent a two-wheeler with GK WhizWheels, you need: (1) An original, valid Indian Driving License for two-wheelers, and (2) One government ID proof (Aadhaar Card, Voter ID, or Passport). You can upload documents during online checkout or present them during vehicle pickup.',
                                },
                                {
                                    q: 'Are helmets and vehicle documents provided?',
                                    a: 'Yes! Every booking includes one sanitized, ISI-certified rider helmet free of charge. A pillion helmet is available for an extra ₹50/day. All vehicles are registered with valid commercial permits, insurance, and PUC certificates.',
                                },
                                {
                                    q: 'Can I ride to Gokarna, Murudeshwar, or Jog Falls?',
                                    a: 'Yes! All GK WhizWheels bikes have valid Karnataka road tax and permit to travel anywhere along the coastal belt, including Murudeshwar (27 km), Gokarna (48 km), Yana Caves, and Jog Falls (60 km).',
                                },
                                {
                                    q: 'How does the security deposit refund work?',
                                    a: 'We offer zero deposit options for verified return tickets. For standard rentals requiring a ₹1,000 security deposit, the refund is initiated immediately to your UPI ID or bank account as soon as the vehicle is returned in good order.',
                                },
                            ].map((faq, index) => (
                                <Accordion
                                    key={index}
                                    defaultExpanded={index === 0}
                                    sx={{
                                        bgcolor: cardBgColor,
                                        color: primaryTextColor,
                                        mb: 2,
                                        borderRadius: '14px !important',
                                        border: `1px solid ${cardBorderColor}`,
                                        boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                                        '&:before': { display: 'none' },
                                    }}
                                >
                                    <AccordionSummary
                                        id={`faq-header-${index}`}
                                        aria-controls={`faq-content-${index}`}
                                        expandIcon={<ExpandMoreIcon aria-hidden="true" sx={{ color: isDark ? '#F59E0B' : '#B45309' }} />}
                                        sx={{
                                            '&:focus-visible': { outline: '2px solid #F59E0B', borderRadius: 2 },
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.98rem', sm: '1.08rem' } }}>
                                            {faq.q}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails id={`faq-content-${index}`} sx={{ pt: 0, pb: 2.5 }}>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.75, fontSize: '0.95rem' }}>
                                            {faq.a}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    </Box>

                    {/* =========================================================================
                        8. BOTTOM CALL-TO-ACTION PORTAL (Multi-Channel Support & Hub Map)
                    ========================================================================== */}
                    <Paper
                        component="section"
                        aria-labelledby="cta-heading"
                        elevation={0}
                        sx={{
                            p: { xs: 4, sm: 6 },
                            mb: 8,
                            borderRadius: 4,
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)'
                                : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 10px 30px rgba(245, 158, 11, 0.08)',
                        }}
                    >
                        <Chip
                            label="LOCAL HONNAVAR DESK • OPEN 24 HOURS"
                            sx={{
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                                color: isDark ? '#FBBF24' : '#92400E',
                                fontWeight: 850,
                                fontSize: '0.74rem',
                                letterSpacing: '0.06em',
                                mb: 2,
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                        />

                        <Typography
                            id="cta-heading"
                            variant="h3"
                            component="h2"
                            sx={{
                                fontWeight: 950,
                                color: primaryTextColor,
                                mb: 1.5,
                                textAlign: 'center',
                                maxWidth: 750,
                                mx: 'auto',
                                fontSize: { xs: '1.8rem', sm: '2.3rem' },
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Need Help Selecting the Right Bike?
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: secondaryTextColor,
                                maxWidth: 640,
                                mx: 'auto',
                                mb: 3.5,
                                lineHeight: 1.7,
                                textAlign: 'center',
                            }}
                        >
                            Our local Honnavar hub staff is available 24/7 to assist with model selection, route recommendations, and train platform deliveries.
                        </Typography>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            justifyContent="center"
                            alignItems="center"
                            sx={{ mx: 'auto', width: { xs: '100%', sm: 'auto' } }}
                        >
                            <Button
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20rent%20a%20bike%20in%20Honnavar."
                                target="_blank"
                                rel="noreferrer"
                                variant="contained"
                                color="success"
                                size="large"
                                startIcon={<WhatsAppIcon aria-hidden="true" />}
                                aria-label="Chat with local Honnavar desk on WhatsApp"
                                sx={{
                                    fontWeight: 850,
                                    px: 3.5,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    bgcolor: '#16A34A',
                                    color: '#FFFFFF',
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': { bgcolor: '#15803D' },
                                    '&:focus-visible': { outline: '3px solid #16A34A', outlineOffset: '2px' },
                                }}
                            >
                                Chat on WhatsApp
                            </Button>

                            <Button
                                component="a"
                                href="tel:+918660989586"
                                variant="contained"
                                color="secondary"
                                size="large"
                                startIcon={<PhoneIcon aria-hidden="true" />}
                                aria-label="Call Honnavar 24/7 helpline at +91 8660989586"
                                sx={{
                                    fontWeight: 850,
                                    px: 3.5,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    bgcolor: '#F59E0B',
                                    color: '#0F172A',
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': { bgcolor: '#D97706' },
                                    '&:focus-visible': { outline: '3px solid #0F172A', outlineOffset: '2px' },
                                }}
                            >
                                Call 24/7 Support
                            </Button>

                            <Button
                                component={Link}
                                href="/contact"
                                variant="outlined"
                                size="large"
                                startIcon={<DirectionsIcon aria-hidden="true" />}
                                aria-label="Find Honnavar station hubs and office directions"
                                sx={{
                                    fontWeight: 800,
                                    px: 3.5,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#94A3B8',
                                    color: primaryTextColor,
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': {
                                        borderColor: '#F59E0B',
                                        color: '#F59E0B',
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
                                    },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
                            >
                                Find Station Hubs
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        </AppLayout>
    );
}

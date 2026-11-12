import React, { useState, useId } from 'react';
import { Link } from '@inertiajs/react';
import PageHead from '../../Components/SEO/PageHead';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
import apiClient from '../../api/client';
import RelatedGuidesStrip from '../../Components/Blog/RelatedGuidesStrip';
import ModelRentalCatalog from '../../Components/Bikes/ModelRentalCatalog';
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

const BIKE_FAQS = [
    {
        q: 'What is the average honnavar bike rental price?',
        a: 'Rates are calculated from the bike, selected dates, rental duration, pickup and return branches, and any applicable fees or discounts. Choose dates to see the actual quote before paying.',
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
        q: 'Is a security deposit required for online bike rentals?',
        a: 'New online bike rental reservations require no refundable security deposit. Pay ₹100 in advance or pay the full rental quote online; any remaining rental balance is collected at pickup.',
    },
];

const bikeFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BIKE_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
        },
    })),
};

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
    const featuredBike = bikes.find((bike) => bike.primary_image_url || bike.images?.[0]?.image_url) || null;
    const legacyBikes = bikes.filter((bike) => !bike.bike_model_id);
    // Public comparison uses registered inventory and actual configured rates.
    // Never advertise non-existent models, made-up weekend surcharges or deposits.
    const comparisonBikes = [...new Map(
        bikes.map((bike) => [
            bike.bike_model_id ? `model-${bike.bike_model_id}` : `bike-${bike.id}`,
            bike,
        ])
    ).values()];

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
            <PageHead
                title="Bike & Scooter Rentals by Branch | GK WhizWheel"
                description="Browse self-drive bikes and scooters by branch and dates. Check current pricing and availability with no security deposit for new online bike bookings."
                canonicalUrl="https://whizwheels.in/services/bikes"
                ogImage={featuredBike?.primary_image_url || featuredBike?.images?.[0]?.image_url || undefined}
                ogType="website"
                structuredData={bikeFaqSchema}
            />

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

                    <Box sx={{ maxWidth: '1440px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
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
                                        label="Browse Our Rental Fleet"
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
                                        Explore Available Fleet ({isLoading ? 'Loading…' : bikes.length} Bikes) ↓
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
                                            label="Check Current Rates"
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
                                        {featuredBike ? (
                                            <Box component="img"
                                                src={featuredBike.primary_image_url || featuredBike.images?.[0]?.image_url}
                                                alt={`${featuredBike.brand} ${featuredBike.model_name} currently listed for rent`}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                        ) : (
                                            <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', bgcolor: '#1E293B' }}>
                                                <TwoWheelerIcon sx={{ fontSize: 92, color: '#94A3B8' }} aria-hidden="true" />
                                            </Box>
                                        )}
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
                                                    label={`${bikes.length} bikes in live catalog` }
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
                                                <Typography variant="h6" component="p" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mt: 0.3 }}>
                                                    Tour Coastal Karnataka With Full Independence
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* 3 Metric Pillars Under Image */}
                                    <Grid container sx={{ p: 1.2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0' }}>
                                        {[
                                            { label: 'DAILY RATE', val: 'See Live Quote' },
                                            { label: 'PICKUP', val: 'Select Branch' },
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
                        maxWidth: '1440px',
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
                                    <MenuItem value="">All available hubs</MenuItem>
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
                                {stores.length} active rental location(s)
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

                    {stores.length > 0 && (
                        <Box component="nav" aria-label="Browse rental branches" sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                                Explore bikes by rental location
                            </Typography>
                            <Stack direction="row" gap={1} flexWrap="wrap">
                                {stores.map((store) => (
                                    <Button key={store.id} variant="outlined" size="small" component={Link}
                                        href={`/bike-rentals/branches/${store.id}/${(store.city || store.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}>
                                        {store.city || store.name}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>
                    )}
                    <ModelRentalCatalog filters={filters} stores={stores} />

                    {/* =========================================================================
                        3. BIKE CATALOG GRID (Modern 2026 Cards with Exact Specs & Real Rates)
                    ========================================================================== */}
                    {!isLoading && !isError && legacyBikes.length > 0 && (
                        <Box component="section" aria-labelledby="fleet-catalog-heading">
                            <Typography
                                id="fleet-catalog-heading"
                                variant="h2"
                                component="h2"
                                sx={{
                                    fontSize: { xs: '1.4rem', sm: '1.75rem' },
                                    fontWeight: 900,
                                    color: primaryTextColor,
                                    letterSpacing: '-0.02em',
                                    mb: 3,
                                }}
                            >
                                Additional individually listed bikes
                            </Typography>

                            <Grid container spacing={3}>
                                {legacyBikes.map((bike) => {
                                    const weekdayRate = bike.weekday_rate ?? bike.daily_rate ?? bike.category?.base_daily_rate ?? null;
                                    const weekendRate = bike.weekend_rate ?? bike.daily_rate ?? bike.category?.base_daily_rate ?? null;
                                    const isElectric = bike.fuel_type === 'electric';

                                    // Build forward query params to retain user dates
                                    const queryParams = new URLSearchParams();
                                    if (filters.start_date) queryParams.set('start_date', filters.start_date);
                                    if (filters.end_date) queryParams.set('end_date', filters.end_date);
                                    if (filters.store_id) queryParams.set('pickup_store_id', filters.store_id);
                                    const detailUrl = `/bikes/${bike.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

                                    const imageSrc = bike.primary_image_url || bike.images?.[0]?.image_url || null;

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
                                                    {imageSrc ? (
                                                        <Box component="img"
                                                            src={imageSrc}
                                                            alt={`${bike.brand || ''} ${bike.model_name || 'Bike'}`}
                                                            loading="lazy"
                                                            sx={{
                                                                width: '100%', height: '100%', objectFit: 'cover',
                                                                objectPosition: 'center 75%',
                                                                transition: 'transform 0.4s ease',
                                                                '&:hover': { transform: 'scale(1.04)' },
                                                            }}
                                                        />
                                                    ) : <TwoWheelerIcon sx={{ fontSize: 82, color: 'text.disabled' }} aria-hidden="true" />}

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
                                                            {bike.category?.name || 'Two-Wheeler'} • {bike.transmission || 'Transmission not listed'}
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
                                                            {bike.current_store?.name || 'Location not available'}
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
                                                            <Typography variant="h6" component="span" sx={{ fontWeight: 950, color: weekdayPriceColor, lineHeight: 1 }}>
                                                                {weekdayRate == null ? 'Rate on request' : `₹${Number(weekdayRate).toLocaleString('en-IN')}`}{' '}
                                                                <Typography component="span" variant="caption" sx={{ color: secondaryTextColor, fontWeight: 600 }}>
                                                                    /day
                                                                </Typography>
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 750, fontSize: '0.84rem' }}>
                                                                Fri – Sun <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500 }}>(Weekend)</Box>
                                                            </Typography>
                                                            <Typography variant="h6" component="span" sx={{ fontWeight: 950, color: weekendPriceColor, lineHeight: 1 }}>
                                                                {weekendRate == null ? 'Rate on request' : `₹${Number(weekendRate).toLocaleString('en-IN')}`}{' '}
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
                                                        aria-label={`View ${bike.brand} ${bike.model_name} and check available rental rates`}
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
                                component="h2"
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
                                aria-label="Configured bike rental rates by model and vehicle"
                                sx={{ '&:focus-visible': { outline: '2px solid #F59E0B' } }}
                            >
                                <Table sx={{ minWidth: 700 }}>
                                    <TableHead sx={{ bgcolor: isDark ? '#0F172A' : '#1E293B' }}>
                                        <TableRow>
                                            <TableCell component="th" scope="col" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem' }}>Vehicle Model</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem' }}>Category & Spec</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#FBBF24', fontWeight: 800, fontSize: '0.9rem' }}>Mon – Thu (Weekday)</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#7DD3FC', fontWeight: 800, fontSize: '0.9rem' }}>Fri – Sun (Weekend)</TableCell>
                                            <TableCell component="th" scope="col" sx={{ color: '#6EE7B7', fontWeight: 800, fontSize: '0.9rem' }}>Online Deposit</TableCell>
                                            <TableCell component="th" scope="col" align="right" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {comparisonBikes.map((bike) => {
                                            const name = [bike.brand, bike.model_name].filter(Boolean).join(' ');
                                            const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                            const href = bike.bike_model_id
                                                ? `/services/bikes/models/${bike.bike_model_id}/${slug}`
                                                : `/bikes/${bike.id}`;
                                            return (
                                                <TableRow key={bike.bike_model_id ? `model-${bike.bike_model_id}` : bike.id}
                                                    sx={{ '&:nth-of-type(even)': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC' } }}>
                                                    <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                        {name}
                                                    </TableCell>
                                                    <TableCell sx={{ color: secondaryTextColor, fontSize: '0.85rem' }}>
                                                        {[bike.category?.name, bike.fuel_type, bike.transmission].filter(Boolean).join(' · ')}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, color: weekdayPriceColor }}>
                                                        {bike.weekday_rate == null && bike.daily_rate == null ? 'Rate on request' : `₹${Number(bike.weekday_rate ?? bike.daily_rate).toLocaleString('en-IN')}`} <Box component="span" sx={{ fontSize: '0.74rem', color: mutedTextColor, fontWeight: 500 }}>/day indicative</Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 850, color: weekendPriceColor }}>
                                                        {bike.weekend_rate == null && bike.daily_rate == null ? 'Rate on request' : `₹${Number(bike.weekend_rate ?? bike.daily_rate).toLocaleString('en-IN')}`} <Box component="span" sx={{ fontSize: '0.74rem', color: mutedTextColor, fontWeight: 500 }}>/day indicative</Box>
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800 }}>
                                                        ₹0 for new online bookings
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button component={Link} href={href} size="small" variant="contained"
                                                            color="secondary" aria-label={`View ${name} booking options`}>
                                                            Check dates
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {!isLoading && comparisonBikes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6}>
                                                    No currently listed bikes. Please check the catalog again later.
                                                </TableCell>
                                            </TableRow>
                                        )}
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
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 600 }}>Check live bike API rates for your dates</Typography>
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
                                component="h2"
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
                                        desc: 'Browse the available bike models returned by our fleet API, choose a pickup branch and check the rental dates before booking.',
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
                                        badge: '✅ Deposit-Free Online',
                                        title: 'Ride & Swift Return',
                                        desc: 'Ride on your booked dates and return to the selected branch. No security deposit is required for new online bike bookings.',
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
                                component="h2"
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
                                    bike: 'View available bikes',
                                    highlight: 'Mangrove boardwalks, boat points & suspension bridge views',
                                },
                                {
                                    route: 'Honnavar Eco Beach Sunset Trail',
                                    distance: '5.8 km one-way',
                                    time: '12 mins ride',
                                    bike: 'View available bikes',
                                    highlight: 'Blue Flag eco beach, palm groves & sunset seaside walkway',
                                },
                                {
                                    route: 'Apsarakonda Waterfalls & Ocean Cliff',
                                    distance: '7.2 km one-way',
                                    time: '18 mins ride',
                                    bike: 'View available bikes',
                                    highlight: 'Natural freshwater pool, Pandava caves & panoramic cliff viewpoint',
                                },
                                {
                                    route: 'Murudeshwar Coastal Highway (NH-66)',
                                    distance: '27 km one-way',
                                    time: '35 mins ride',
                                    bike: 'View available bikes',
                                    highlight: 'Gigantic Shiva statue, 18-storey Raja Gopura & beach water sports',
                                },
                                {
                                    route: 'Mirjan Historic Fort Trail',
                                    distance: '11.5 km one-way',
                                    time: '18 mins ride',
                                    bike: 'View available bikes',
                                    highlight: '16th-century laterite stone architecture & lush green moat lawns',
                                },
                                {
                                    route: 'Gokarna Om Beach & Cliff Circuit',
                                    distance: '44 km one-way',
                                    time: '55 mins ride',
                                    bike: 'View available bikes',
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
                                component="h2"
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
                            {BIKE_FAQS.map((faq, index) => (
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
            <RelatedGuidesStrip
                serviceKey="bikes"
                title="Two-Wheeler Rental & NH-66 Coastal Route Guides"
                subtitle="Scooter vs cruiser comparisons, digital KYC steps & self-drive loops connecting Honnavar and Murudeshwar."
            />
        </AppLayout>
    );
}

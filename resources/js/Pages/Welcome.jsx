import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    Paper,
    Divider,
    TextField,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ExploreIcon from '@mui/icons-material/Explore';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LandscapeIcon from '@mui/icons-material/Landscape';
import CastleIcon from '@mui/icons-material/Castle';
import DirectionsIcon from '@mui/icons-material/Directions';

export default function Welcome({ featuredBikes = [], categories = [], stores = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Quick search form state
    const today = new Date().toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const [searchStore, setSearchStore] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(dayAfter);
    const [activeTab, setActiveTab] = useState('all');

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchStore) params.append('store_id', searchStore);
        if (searchCategory) params.append('category_id', searchCategory);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        router.visit(`/bikes?${params.toString()}`);
    };

    const filteredBikes = activeTab === 'all'
        ? featuredBikes
        : featuredBikes.filter((b) => b.category?.name?.toLowerCase().includes(activeTab) || b.category_id === Number(activeTab));

    // Structured JSON-LD for local SEO & search engine rich snippets
    const structuredData = {
        "@context": "https://schema.org",
        "@type": ["AutoRental", "LocalBusiness"],
        "name": "G.K. WhizWheel Rental bike - Honnavar",
        "alternateName": ["GK WhizWheels", "G.K. WhizWheel", "Whizwheels Honnavar"],
        "sameAs": ["https://share.google/GoM4iOgiuUIa7ZfwV"],
        "description": "Premier two-wheeler rental agency in Honnavar offering well-maintained Honda Activa, Honda H'ness CB350, Royal Enfield, and scooters starting at ₹350/day. Zero deposit option, 24-hour service, and instant booking at Palya Main Rd and Honnavar Railway Station.",
        "image": "https://whizwheels.in/images/logo.png",
        "telephone": ["+918660989586", "+919731699125"],
        "email": "contact@whizwheels.in",
        "url": "https://whizwheels.in",
        "priceRange": "₹350 - ₹1500 per day",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Palya Main Rd",
            "addressLocality": "Honnavar",
            "addressRegion": "Karnataka",
            "postalCode": "581334",
            "addressCountry": "IN"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 14.2802,
            "longitude": 74.4437
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "324",
            "bestRating": "5",
            "worstRating": "1"
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            }
        ],
        "areaServed": [
            { "@type": "City", "name": "Honnavar" },
            { "@type": "City", "name": "Kumta" },
            { "@type": "City", "name": "Bhatkal" },
            { "@type": "City", "name": "Murudeshwar" },
            { "@type": "City", "name": "Gokarna" }
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Honnavar Bike Rentals Catalog",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Honda Activa 6G Rental in Honnavar",
                        "description": "Daily scooter rental starting at ₹350/day with zero deposit option for exploring Honnavar beaches and Sharavathi backwaters"
                    },
                    "price": "350",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Honda H'ness CB350 Rental in Honnavar",
                        "description": "Premium cruiser motorcycle rental for coastal highway road trips"
                    },
                    "price": "1200",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Royal Enfield Classic 350 Rental in Honnavar",
                        "description": "Classic thumping cruiser bike rental for long coastal highway trips to Murudeshwar and Gokarna"
                    },
                    "price": "899",
                    "priceCurrency": "INR"
                }
            ]
        }
    };

    return (
        <AppLayout>
            <Head>
                <title>Bike Rental in Honnavar - G.K. WhizWheel | Zero Deposit & Starts ₹350/Day</title>
                <meta
                    name="description"
                    content="Rent top-rated bikes and scooters in Honnavar starting at ₹350/day. G.K. WhizWheel offers 5.0★ rated fleet (Activa, Royal Enfield, H'ness CB350) with zero deposit option, sanitized fleet, 24-hour service, and instant booking at Palya Main Rd & Railway Station. Call +91 8660989586 / 097316 99125."
                />
                <meta
                    name="keywords"
                    content="bike rental in honnavar, honnavar bike rental price, rental bikes in honnavar, honnavar rental bikes, honnavar bike rent, honnavar bike rentals, G.K. WhizWheel Rental bike Honnavar, scooty rent in honnavar, activa rent in honnavar"
                />
                <meta property="og:title" content="Bike Rental in Honnavar - G.K. WhizWheel | Zero Deposit | Starts ₹350/Day" />
                <meta
                    property="og:description"
                    content="Rent top-rated bikes and scooters in Honnavar starting at ₹350/day. 5.0★ Google Rated (324+ reviews). Zero deposit, sanitized fleet, and instant booking. Call +91 8660989586 / 097316 99125."
                />
                <meta property="og:image" content="/images/logo.png" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>

            {/* =========================================================================
                1. HERO SECTION (1920px CONTAINER-FLUID)
            ========================================================================== */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '1920px',
                    mx: 'auto',
                    px: { xs: 2, sm: 4, md: 6, lg: 8 },
                    mb: 8,
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        py: { xs: 5, md: 8 },
                        px: { xs: 2.5, sm: 4, md: 6 },
                        borderRadius: { xs: 3, md: 4 },
                        background: isDark ? 'radial-gradient(130% 120% at 90% 10%, #1E293B 0%, #0F172A 60%, #090E17 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #EFF6FF 100%)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background Ambient Glows */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -120,
                            right: -100,
                            width: 450,
                            height: 450,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 70%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -150,
                            left: -100,
                            width: 400,
                            height: 400,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 70%)',
                            pointerEvents: 'none',
                        }}
                    />

                    <Grid container spacing={5} alignItems="center">
                        {/* Left Hero Content & Quick Booking Form */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <Chip
                                icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 16 }} />}
                                label="G.K. WhizWheel • 5.0 ★ (324 Google Reviews) • Honnavar, Karnataka"
                                sx={{
                                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#FBBF24',
                                    fontWeight: 700,
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    mb: 2.5,
                                    py: 0.5,
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            />

                            <Typography
                                variant="h1"
                                component="h1"
                                sx={{
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                    fontSize: { xs: '2.25rem', sm: '3rem', md: '3.6rem' },
                                    fontWeight: 900,
                                    lineHeight: 1.12,
                                    letterSpacing: '-0.03em',
                                    mb: 2,
                                }}
                            >
                                Bike Rental in Honnavar <br />
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    G.K. WhizWheel • Starts ₹350/Day
                                </Box>
                            </Typography>

                            <Typography
                                variant="subtitle1"
                                sx={{
                                    color: isDark ? '#FBBF24' : '#D97706',
                                    fontWeight: 700,
                                    fontStyle: 'italic',
                                    mb: 1.5,
                                    fontSize: '1.05rem',
                                }}
                            >
                                “Ride the Freedom, Feel the Wind. Your trusted partner for bike rentals in Honnavar.”
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: isDark ? '#94A3B8' : '#475569',
                                    fontSize: { xs: '1rem', md: '1.1rem' },
                                    lineHeight: 1.65,
                                    mb: 4,
                                    maxWidth: 640,
                                }}
                            >
                                Welcome to <strong>G.K. WhizWheel Rental bike - Honnavar</strong>. Check live <strong>honnavar bike rental price</strong> starting at just ₹350/day. Rent sanitized Activas, Royal Enfields, and Honda H'ness CB350 with zero deposit options, 24/7 service, and instant pickup at Palya Main Rd or Honnavar Railway Station.
                            </Typography>

                            {/* Interactive Quick Search Bar */}
                            <Paper
                                elevation={0}
                                component="form"
                                onSubmit={handleSearch}
                                sx={{
                                    p: { xs: 2, sm: 2.5 },
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF',
                                    backdropFilter: 'blur(14px)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                    borderRadius: 3,
                                    boxShadow: isDark ? '0 12px 30px -5px rgba(0, 0, 0, 0.4)' : '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
                                    mb: 3,
                                }}
                            >
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Pickup & Return Hub"
                                            value={searchStore}
                                            onChange={(e) => setSearchStore(e.target.value)}
                                            InputLabelProps={{ sx: { color: isDark ? '#94A3B8' : '#64748B' } }}
                                            sx={{
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                                borderRadius: 1.5,
                                                '& .MuiOutlinedInput-root': {
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    '& fieldset': { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1' },
                                                    '&:hover fieldset': { borderColor: '#F59E0B' },
                                                },
                                            }}
                                        >
                                            <MenuItem value="">All Honnavar Hubs</MenuItem>
                                            {stores.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.name} ({s.bikes_count || 0} bikes)
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Bike Category"
                                            value={searchCategory}
                                            onChange={(e) => setSearchCategory(e.target.value)}
                                            InputLabelProps={{ sx: { color: isDark ? '#94A3B8' : '#64748B' } }}
                                            sx={{
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                                borderRadius: 1.5,
                                                '& .MuiOutlinedInput-root': {
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    '& fieldset': { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1' },
                                                    '&:hover fieldset': { borderColor: '#F59E0B' },
                                                },
                                            }}
                                        >
                                            <MenuItem value="">All Categories (Scooters, Cruisers, EV)</MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 4.5 }}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            size="small"
                                            label="Pickup Date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            InputLabelProps={{ shrink: true, sx: { color: isDark ? '#94A3B8' : '#64748B' } }}
                                            sx={{
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                                borderRadius: 1.5,
                                                '& .MuiOutlinedInput-root': {
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    '& fieldset': { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1' },
                                                    '&:hover fieldset': { borderColor: '#F59E0B' },
                                                },
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 4.5 }}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            size="small"
                                            label="Drop-off Date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            InputLabelProps={{ shrink: true, sx: { color: isDark ? '#94A3B8' : '#64748B' } }}
                                            sx={{
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                                borderRadius: 1.5,
                                                '& .MuiOutlinedInput-root': {
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    '& fieldset': { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1' },
                                                    '&:hover fieldset': { borderColor: '#F59E0B' },
                                                },
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <Button
                                            fullWidth
                                            type="submit"
                                            variant="contained"
                                            color="secondary"
                                            size="medium"
                                            startIcon={<SearchIcon />}
                                            sx={{
                                                py: 1,
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                borderRadius: 1.5,
                                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                            }}
                                        >
                                            Find Bikes
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Trust Signals */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                        Free Sanitized ISI Helmets
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                        Instant Deposit Refund
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                        Railway Station Delivery
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                        24/7 Roadside Support
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        {/* Right Hero Showcase — Logo Emblem & Key Value Metrics */}
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 3, sm: 4 },
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                    backdropFilter: 'blur(16px)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                                    boxShadow: isDark ? 'none' : '0 12px 35px -5px rgba(15, 23, 42, 0.08)',
                                    borderRadius: 4,
                                    textAlign: 'center',
                                    position: 'relative',
                                }}
                            >
                                {/* Brand Logo Badge */}
                                <Box
                                    component="img"
                                    src="/images/logo.png"
                                    alt="GK WhizWheels — Official Logo"
                                    sx={{
                                        width: '100%',
                                        maxWidth: 290,
                                        height: 'auto',
                                        mx: 'auto',
                                        mb: 2.5,
                                        borderRadius: 3,
                                        filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.45))',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': { transform: 'scale(1.02)' },
                                    }}
                                />

                                <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mb: 1 }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <StarIcon key={s} sx={{ color: '#F59E0B', fontSize: 24 }} />
                                    ))}
                                </Stack>

                                <Typography variant="h5" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 900, letterSpacing: '-0.01em' }}>
                                    5.0 ★★★★★
                                </Typography>
                                <Typography variant="subtitle2" sx={{ color: isDark ? '#FBBF24' : '#D97706', fontWeight: 800, mb: 0.5 }}>
                                    324+ Verified Google Reviews
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 2.5 }}>
                                    Two wheeler rental agency in Honnavar, Karnataka • Open 24 Hours
                                </Typography>

                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 2.5 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 4 }}>
                                        <Typography variant="h5" sx={{ color: '#F59E0B', fontWeight: 900 }}>
                                            ₹350
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                            Starts From/Day
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <Typography variant="h5" sx={{ color: '#38BDF8', fontWeight: 900 }}>
                                            2 Hubs
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                            Palya Rd & Station
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 900 }}>
                                            24/7
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                            Open 24 Hours
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 2.5 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', border: isDark ? 'none' : '1px solid #E2E8F0', p: 2, borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#0F172A', fontWeight: 600 }}>
                                            Palya Main Rd, Honnavar, Karnataka 581334
                                        </Typography>
                                        <Box component="a" href="https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334" target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color: '#38BDF8', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', ml: 'auto', '&:hover': { textDecoration: 'underline' } }}>
                                            <DirectionsIcon sx={{ fontSize: 13 }} /> Directions ↗
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PhoneIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#0F172A', fontWeight: 600 }}>
                                            +91 8660989586 • 097316 99125
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTimeIcon sx={{ color: '#38BDF8', fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                            Open 24 Hours Daily
                                        </Typography>
                                    </Box>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    component="a"
                                    href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                    target="_blank"
                                    rel="noreferrer"
                                    size="small"
                                    sx={{ mt: 2, color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)', textTransform: 'none', fontWeight: 700 }}
                                >
                                    View 324 Reviews on Google (5.0 ★) →
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* =========================================================================
                REST OF ALL SECTIONS (1410px CONTAINER)
            ========================================================================== */}
            <Box sx={{ maxWidth: '1410px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>

                {/* =========================================================================
                    2. CATEGORY SELECTOR TABS
                ========================================================================== */}
                <Box sx={{ mb: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
                        <Box>
                            <Chip
                                label="Browse Rental Bikes in Honnavar"
                                sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1 }}
                            />
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em' }}>
                                Choose Your Ride Style in Honnavar
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#94A3B8', mt: 0.5 }}>
                                Select a vehicle category to filter our fleet of rental bikes in Honnavar or compare daily rates.
                            </Typography>
                        </Box>
                        <Button
                            component={Link}
                            href="/bikes"
                            endIcon={<ArrowForwardIcon />}
                            sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'none' }}
                        >
                            View All Bikes
                        </Button>
                    </Box>

                    <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                        <Chip
                            label="All Fleet Models"
                            clickable
                            onClick={() => setActiveTab('all')}
                            color={activeTab === 'all' ? 'secondary' : 'default'}
                            variant={activeTab === 'all' ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                px: 1.5,
                                py: 2.2,
                                borderRadius: 2,
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                color: activeTab === 'all' ? '#000000' : '#E2E8F0',
                            }}
                        />
                        {categories.map((c) => (
                            <Chip
                                key={c.id}
                                label={`${c.name} (${c.bikes_count || 0})`}
                                clickable
                                onClick={() => setActiveTab(c.name.toLowerCase())}
                                color={activeTab === c.name.toLowerCase() ? 'secondary' : 'default'}
                                variant={activeTab === c.name.toLowerCase() ? 'filled' : 'outlined'}
                                sx={{
                                    fontWeight: 700,
                                    px: 1.5,
                                    py: 2.2,
                                    borderRadius: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.15)',
                                    color: activeTab === c.name.toLowerCase() ? '#000000' : '#E2E8F0',
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* =========================================================================
                    3. FEATURED FLEET CARDS (Popular Rental Bikes in Honnavar)
                ========================================================================== */}
                <Box id="fleet" sx={{ mb: 10 }}>
                    <Grid container spacing={3.5}>
                        {filteredBikes.map((bike) => {
                            // Resolve real bike image from database
                            const bikeImage = bike.primary_image_url
                                || (bike.primary_image_path ? (bike.primary_image_path.startsWith('http') ? bike.primary_image_path : `/storage/${bike.primary_image_path}`) : null)
                                || bike.images?.[0]?.image_path
                                || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80';

                            const isElectric = (bike.fuel_type || '').toLowerCase() === 'electric';
                            const weekdayRateNum = Number(bike.weekday_rate || bike.daily_rate || bike.base_daily_rate_override || 350);
                            const weekendRateNum = Number(bike.weekend_rate || (weekdayRateNum + (weekdayRateNum >= 1000 ? (weekdayRateNum >= 1200 ? 300 : 200) : (weekdayRateNum === 450 ? 50 : 100))));

                            return (
                                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={bike.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            borderRadius: 3.5,
                                            overflow: 'hidden',
                                            transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                borderColor: 'rgba(245, 158, 11, 0.5)',
                                                boxShadow: isDark
                                                    ? '0 20px 35px -10px rgba(0, 0, 0, 0.6)'
                                                    : '0 16px 30px -10px rgba(15, 23, 42, 0.12)',
                                            },
                                        }}
                                    >
                                        {/* Bike Real Photo Header */}
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                height: 220,
                                                width: '100%',
                                                bgcolor: isDark ? '#0F172A' : '#ECEEF1',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                p: 1.5,
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={bikeImage}
                                                alt={`${bike.brand} ${bike.model_name} — Rental Bikes in Honnavar`}
                                                loading="lazy"
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    width: 'auto',
                                                    height: 'auto',
                                                    objectFit: 'contain',
                                                    borderRadius: 2,
                                                    transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        transform: 'scale(1.06)',
                                                    },
                                                }}
                                            />

                                            {/* Category Tag */}
                                            <Chip
                                                label={bike.category?.name || 'Two Wheeler'}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    left: 14,
                                                    bgcolor: 'rgba(15, 23, 42, 0.88)',
                                                    backdropFilter: 'blur(8px)',
                                                    color: '#F59E0B',
                                                    fontWeight: 800,
                                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                                }}
                                            />

                                            {/* Store Location Tag */}
                                            <Chip
                                                icon={<LocationOnIcon sx={{ fontSize: 14, color: '#38BDF8 !important' }} />}
                                                label={bike.current_store?.name || 'Honnavar Hub'}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    right: 14,
                                                    bgcolor: 'rgba(15, 23, 42, 0.88)',
                                                    backdropFilter: 'blur(8px)',
                                                    color: '#FFFFFF',
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                }}
                                            />
                                        </Box>

                                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h5" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, mb: 0.5 }}>
                                                {bike.brand} {bike.model_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, mb: 2, display: 'block', letterSpacing: '0.04em' }}>
                                                REG: {bike.registration_number} • HONNAVAR
                                            </Typography>

                                            {/* Accurate Specs Pills from DB */}
                                            <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', px: 1.2, py: 0.5, borderRadius: 1.5 }}>
                                                    {isElectric ? (
                                                        <ElectricBoltIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                                                    ) : (
                                                        <LocalGasStationIcon sx={{ fontSize: 15, color: isDark ? '#94A3B8' : '#64748B' }} />
                                                    )}
                                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#334155', fontWeight: 700, textTransform: 'capitalize' }}>
                                                        {bike.fuel_type || 'Petrol'}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', px: 1.2, py: 0.5, borderRadius: 1.5 }}>
                                                    <SpeedIcon sx={{ fontSize: 15, color: isDark ? '#94A3B8' : '#64748B' }} />
                                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#334155', fontWeight: 700, textTransform: 'capitalize' }}>
                                                        {bike.transmission || 'Automatic'}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(16, 185, 129, 0.12)', px: 1.2, py: 0.5, borderRadius: 1.5 }}>
                                                    <VerifiedUserIcon sx={{ fontSize: 15, color: '#10B981' }} />
                                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                                        Insured
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* Official Rate Card Pricing Box */}
                                            <Box
                                                sx={{
                                                    mt: 'auto',
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                                    p: 2,
                                                    borderRadius: 2.5,
                                                    mb: 2.5,
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, fontSize: '0.85rem' }}>
                                                        Mon – Thu <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500 }}>(Weekday)</Box>
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1 }}>
                                                        ₹{weekdayRateNum.toLocaleString('en-IN')}
                                                        <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 0.5, fontWeight: 600 }}>
                                                            /day
                                                        </Typography>
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, fontSize: '0.85rem' }}>
                                                        Fri – Sun <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500 }}>(Weekend)</Box>
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: isDark ? '#38BDF8' : '#0284C7', fontWeight: 900, lineHeight: 1 }}>
                                                        ₹{weekendRateNum.toLocaleString('en-IN')}
                                                        <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 0.5, fontWeight: 600 }}>
                                                            /day
                                                        </Typography>
                                                    </Typography>
                                                </Box>

                                                <Divider sx={{ my: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0' }} />

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                                        ✓ Zero Deposit Option
                                                    </Typography>
                                                    <Chip
                                                        label="Available"
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.68rem',
                                                            fontWeight: 800,
                                                            bgcolor: 'rgba(16, 185, 129, 0.12)',
                                                            color: '#10B981',
                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                        }}
                                                    />
                                                </Box>
                                            </Box>

                                            <Stack direction="row" spacing={1.5}>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    color="secondary"
                                                    component={Link}
                                                    href={`/bikes/${bike.id}`}
                                                    sx={{
                                                        fontWeight: 800,
                                                        py: 1.1,
                                                        borderRadius: 2,
                                                        fontSize: '0.925rem',
                                                    }}
                                                >
                                                    Book Now
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    component={Link}
                                                    href={`/bikes/${bike.id}`}
                                                    sx={{
                                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                        color: isDark ? '#E2E8F0' : '#0F172A',
                                                        fontWeight: 700,
                                                        px: 2.5,
                                                        borderRadius: 2,
                                                        '&:hover': {
                                                            borderColor: '#F59E0B',
                                                            bgcolor: 'rgba(245, 158, 11, 0.08)',
                                                        },
                                                    }}
                                                >
                                                    Details
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* View All Fleet Action */}
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            component={Link}
                            href="/bikes"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                bgcolor: '#1E293B',
                                color: '#FFFFFF',
                                py: 1.75,
                                px: 5,
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                borderRadius: 2.5,
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.4)',
                                '&:hover': {
                                    bgcolor: '#334155',
                                    borderColor: '#F59E0B',
                                },
                            }}
                        >
                            Explore All Rental Bikes in Honnavar
                        </Button>
                    </Box>
                </Box>

                {/* =========================================================================
                    4. HONNAVAR BIKE RENTAL PRICE & DURATION DISCOUNTS
                ========================================================================== */}
                <Box id="pricing" sx={{ mb: 10 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Chip
                            label="Transparent Tariff • Honnavar Bike Rental Price"
                            sx={{ bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontWeight: 700, mb: 1.5 }}
                        />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            Honnavar Bike Rental Price & Transparent Rates
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 680, mx: 'auto' }}>
                            Zero hidden surge fees. We offer the best <strong>honnavar bike rental price</strong> with exact 24-hour block billing, automated multi-day volume discounts, and guaranteed security deposit refunds.
                        </Typography>
                    </Box>

                    {/* Rate Comparison Table */}
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 4,
                            bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            borderRadius: 3,
                            overflow: 'hidden',
                        }}
                    >
                        <TableContainer>
                            <Table sx={{ minWidth: 700 }}>
                                <TableHead sx={{ bgcolor: isDark ? '#0B1120' : '#0F172A' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem' }}>Vehicle Model</TableCell>
                                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem' }}>Category & Spec</TableCell>
                                        <TableCell sx={{ color: '#F59E0B', fontWeight: 800, fontSize: '0.92rem' }}>Mon – Thu (Weekday)</TableCell>
                                        <TableCell sx={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.92rem' }}>Fri – Sun (Weekend)</TableCell>
                                        <TableCell sx={{ color: '#10B981', fontWeight: 800, fontSize: '0.92rem' }}>Security Deposit</TableCell>
                                        <TableCell align="right" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem' }}>Action</TableCell>
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
                                        const matchedBike = featuredBikes.find(b =>
                                            (b.model_name && b.model_name.toLowerCase().includes(row.keyword)) ||
                                            (b.brand && row.name.toLowerCase().includes(b.brand.toLowerCase()))
                                        );
                                        const bookHref = matchedBike ? `/bikes/${matchedBike.id}` : '/bikes';

                                        return (
                                            <TableRow key={row.name} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)' } }}>
                                                <TableCell sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>
                                                    {row.name}
                                                </TableCell>
                                                <TableCell sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.85rem' }}>
                                                    {row.spec}
                                                </TableCell>
                                                <TableCell sx={{ color: '#F59E0B', fontWeight: 900, fontSize: '1rem' }}>
                                                    ₹{row.weekday.toLocaleString('en-IN')} <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#64748B' }}>/day</Box>
                                                </TableCell>
                                                <TableCell sx={{ color: isDark ? '#38BDF8' : '#0284C7', fontWeight: 900, fontSize: '1rem' }}>
                                                    ₹{row.weekend.toLocaleString('en-IN')} <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#64748B' }}>/day</Box>
                                                </TableCell>
                                                <TableCell sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.88rem' }}>
                                                    ✓ Zero Deposit
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        component={Link}
                                                        href={bookHref}
                                                        size="small"
                                                        variant={row.weekday >= 1000 ? "contained" : "outlined"}
                                                        color="secondary"
                                                        sx={{ fontWeight: 800, borderRadius: 1.5, px: 2 }}
                                                    >
                                                        Book Now
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
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Daily Rental
                                </Typography>
                                <Typography variant="h4" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 900, my: 1 }}>
                                    1 – 2 Days
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                                    Ideal for day trips to Sharavathi backwaters and Eco Beach.
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Standard Daily Tariff (From ₹399)</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>1 ISI Certified Helmet Free</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Exact 24-Hour Block Window</Typography>
                                    </Box>
                                </Stack>
                                <Button variant="outlined" component={Link} href="/bikes" fullWidth sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                                    Rent For 1-2 Days
                                </Button>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    bgcolor: 'rgba(245, 158, 11, 0.06)',
                                    border: '2px solid #F59E0B',
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                }}
                            >
                                <Chip
                                    label="POPULAR"
                                    size="small"
                                    color="secondary"
                                    sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 800, fontSize: '0.65rem' }}
                                />
                                <Typography variant="subtitle2" sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Coastal Getaway
                                </Typography>
                                <Typography variant="h4" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 900, my: 1 }}>
                                    3 – 6 Days
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
                                    Explore Honnavar, Murudeshwar, and Gokarna over a long weekend.
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#F59E0B', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>10% Tiered Discount</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Dual Helmets (Rider + Pillion)</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Station Pickup Priority</Typography>
                                    </Box>
                                </Stack>
                                <Button variant="contained" color="secondary" component={Link} href="/bikes" fullWidth sx={{ fontWeight: 800 }}>
                                    Book Weekend
                                </Button>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Weekly Explorer
                                </Typography>
                                <Typography variant="h4" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 900, my: 1 }}>
                                    7 – 29 Days
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                                    Preferred by tourists and workationers exploring Uttara Kannada.
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>15% Volume Discount</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Unlimited Kilometers</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Free 24/7 Breakdown Assistance</Typography>
                                    </Box>
                                </Stack>
                                <Button variant="outlined" component={Link} href="/bikes" fullWidth sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                                    View Weekly Deals
                                </Button>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Monthly Lease
                                </Typography>
                                <Typography variant="h4" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 900, my: 1 }}>
                                    30+ Days
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                                    Long term bike rental in Honnavar without maintenance hassle.
                                </Typography>
                                <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Up to 25% Maximum Savings</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Free Routine Servicing</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Doorstep Hub Support</Typography>
                                    </Box>
                                </Stack>
                                <Button variant="outlined" component="a" href="tel:+918660989586" fullWidth sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                                    Call for Monthly Quote
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* =========================================================================
                    5. SCENIC ROUTES & ATTRACTIONS (Honnavar Bike Rentals)
                ========================================================================== */}
                <Box id="routes" sx={{ mb: 10 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Chip
                            label="Must-Visit Coastal Destinations"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1.5 }}
                        />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            Top Places to Visit with Honnavar Bike Rentals
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 680, mx: 'auto' }}>
                            Honnavar is the gateway to Karnataka’s pristine coastline. With <strong>GK WhizWheels</strong>, ride smoothly to breathtaking river estuaries, white sand beaches, and historic forts.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' }}>
                                        <DirectionsBoatIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                            Sharavathi Backwaters & Boating
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                            8 km from Honnavar Office
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Cruising on a rented Honda Activa across the Sharavathi railway and road bridges offers unforgettable river estuary panoramas, mangrove kayaking, and serene sunset boat rides.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                                        <BeachAccessIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                            Honnavar Eco Beach & Boardwalk
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                            4 km from Palya Main Rd
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Certified Blue Flag eco-beach with a scenic wooden promenade winding through rich mangrove forests. Ideal for evening rides, photography, and calm Arabian Sea breezes.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                                        <LandscapeIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                            Apsarakonda Waterfalls & Hill
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                            7 km south on NH66
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    A natural freshwater waterfall cascading into a natural pond alongside ancient Pandava caves, with a stunning viewpoint overlooking the Arabian Sea sunset.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(168, 85, 247, 0.12)', color: '#C084FC' }}>
                                        <CastleIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                            Mirjan Fort Historical Ride
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                            22 km north on NH66
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Built in the 16th century with laterite stones and moss-covered ramparts. Ride your rental bike on the smooth NH66 highway to explore Queen Chennabhairadevi’s historic stronghold.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#F87171' }}>
                                        <ExploreIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                            Murudeshwar Shiva Temple
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                            27 km south on NH66
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Home to the world's 2nd tallest Shiva statue, a 20-storey Raja Gopuram, and exciting watersports like scuba diving and parasailing at Netrani Island base.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' }}>
                                        <TwoWheelerIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                            Gokarna & Om Beach Highway
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                            48 km north on NH66
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    The quintessential Karnataka coastal highway road trip. Ride Royal Enfield Classic 350 or Activa from Honnavar to Om Beach, Kudle Beach, and Mahabaleshwar Temple.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* =========================================================================
                    6. HOW HONNAVAR BIKE RENT WORKS (TIMELINE)
                ========================================================================== */}
                <Box id="how-it-works" sx={{ mb: 10 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Chip
                            label="Simple 4-Step Process"
                            sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 700, mb: 1.5 }}
                        />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            How Honnavar Bike Rent Works
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#94A3B8' : '#64748B', maxWidth: 640, mx: 'auto' }}>
                            Renting a bike in Honnavar has never been simpler. Book online in 2 minutes and pick up smoothly.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                }}
                            >
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontWeight: 900, mb: 2 }}>
                                    01
                                </Box>
                                <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, mb: 1 }}>
                                    Choose Bike & Hub
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Select from verified Honda Activa scooters, cruisers, or commuter bikes with live real-time availability in Honnavar.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                }}
                            >
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontWeight: 900, mb: 2 }}>
                                    02
                                </Box>
                                <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, mb: 1 }}>
                                    Hold & Book Online
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Your chosen bike is locked with a 15-minute concurrency guard. Check out securely via UPI, Card, or NetBanking.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                }}
                            >
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: 900, mb: 2 }}>
                                    03
                                </Box>
                                <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, mb: 1 }}>
                                    Digital KYC Handover
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Show your original Driving License at Palya Main Rd or Honnavar Railway Station. Receive helmets and digital vehicle documents.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                    borderRadius: 3,
                                }}
                            >
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', fontWeight: 900, mb: 2 }}>
                                    04
                                </Box>
                                <Typography variant="h6" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, mb: 1 }}>
                                    Return & Refund
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                    Return the bike at either Honnavar hub. Your refundable security deposit is initiated immediately back to your bank account.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* =========================================================================
                    7. HONNAVAR HUBS (Palya Main Rd & Railway Station Hub)
                ========================================================================== */}
                <Box id="hubs" sx={{ mb: 10 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
                        <Box>
                            <Chip
                                label="Convenient Pickup & Return Points"
                                sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1 }}
                            />
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em' }}>
                                Pick Up Your Honnavar Rental Bikes
                            </Typography>
                        </Box>
                    </Box>

                    <Grid container spacing={4}>
                        {stores.map((store) => (
                            <Grid size={{ xs: 12, md: 6 }} key={store.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        height: '100%',
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                        borderRadius: 3.5,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography variant="h5" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}>
                                                    {store.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                                    ● Active Hub • {store.bikes_count || 0} Bikes Ready for Handover
                                                </Typography>
                                            </Box>
                                            <Chip
                                                icon={<AccessTimeIcon sx={{ fontSize: 14, color: '#10B981 !important' }} />}
                                                label="Open 24 Hours"
                                                size="small"
                                                sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 700 }}
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                                            <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 20, mt: 0.25 }} />
                                            <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6, fontWeight: 600 }}>
                                                {store.address || 'Palya Main Rd, Honnavar, Karnataka 581334'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                            <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                                                Hub Contact: +91 8660989586 • 097316 99125
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                                            <Chip label="Train Arrival Pickup" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0' }} />
                                            <Chip label="On-Site Helmet Fitting" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0' }} />
                                        </Stack>
                                    </Box>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            component={Link}
                                            href={`/bikes?store_id=${store.id}`}
                                            fullWidth
                                            sx={{ fontWeight: 800 }}
                                        >
                                            View Bikes at this Hub
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            component="a"
                                            href={store.name && store.name.toLowerCase().includes("railway")
                                                ? "https://www.google.com/maps/dir/?api=1&destination=Honnavar+Railway+Station,+Karnataka"
                                                : "https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334"}
                                            target="_blank"
                                            rel="noreferrer"
                                            startIcon={<DirectionsIcon />}
                                            fullWidth
                                            sx={{
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                color: isDark ? '#FFFFFF' : '#0F172A',
                                                fontWeight: 700,
                                                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' }
                                            }}
                                        >
                                            Get Directions
                                        </Button>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    8. FREQUENTLY ASKED QUESTIONS (Honnavar Rental Bikes FAQs)
                ========================================================================== */}
                <Box id="faq" sx={{ mb: 10 }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Chip
                            label="Got Questions? We Have Answers"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1 }}
                        />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            Honnavar Rental Bikes — FAQs
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                            Everything you need to know about <strong>bike rental in honnavar</strong>, rental rates, deposits, and documents.
                        </Typography>
                    </Box>

                    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
                        <Accordion
                            defaultExpanded
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: '#FFFFFF',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    What is the average honnavar bike rental price?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                    At GK WhizWheels, our <strong>honnavar bike rental price</strong> is transparent and straightforward: Honda Activa 6G scooters start from <strong>₹399/day</strong>, commuter motorcycles (Honda Shine / Splendor) start from <strong>₹499/day</strong>, and Royal Enfield Classic 350 starts from <strong>₹899/day</strong>. We offer additional discounts of 10% for 3+ days and 15% for weekly rentals, with zero surge fees.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: '#FFFFFF',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Can I get rental bikes in honnavar delivered to Honnavar Railway Station?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                    Yes! We have an active <strong>Honnavar Railway Station Hub</strong> located right outside on Railway Station Road. When your Konkan Railway train arrives, our executive meets you for a swift 5-minute digital handover so you can immediately begin your road trip without paying expensive auto fares.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: '#FFFFFF',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    What documents are required for honnavar bike rent?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                    To rent a two-wheeler with GK WhizWheels, you need: (1) An original, valid Indian Driving License for two-wheelers, and (2) One government ID proof (Aadhaar Card, Voter ID, or Passport). You can verify your documents ahead of time via our customer KYC portal or complete quick verification upon bike pickup.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: '#FFFFFF',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Are helmets and insurance included with honnavar bike rentals?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                    Yes! Every booking includes one clean, ISI-certified sanitized rider helmet at no extra cost. A second helmet for your pillion can be added for just ₹50/day. All bikes in our fleet are comprehensively insured with valid RC and PUC emission certificates available right in your online booking dashboard.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: '#FFFFFF',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    How is the security deposit refunded?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                    A refundable security deposit of ₹1,000 (scooters/commuters) or ₹1,500 (Royal Enfield) is collected at pickup. Upon returning the vehicle at Palya Main Rd or Honnavar Railway Station, our staff verifies fuel level and vehicle condition, and your deposit is refunded directly within 2 hours back to your original payment method.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: '#FFFFFF',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Can I ride the rental bike to Murudeshwar, Gokarna, or Jog Falls?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                    Yes! You are completely free to ride throughout Karnataka including Murudeshwar (27 km south), Gokarna (48 km north), Kumta (20 km), Yana Caves, and Jog Falls (60 km). All bikes feature valid Karnataka permits and active commercial rental paperwork.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </Box>

                {/* =========================================================================
                    9. BOTTOM CTA BANNER
                ========================================================================== */}
                <Box
                    sx={{
                        p: { xs: 4, md: 6 },
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4,
                    }}
                >
                    <Typography variant="h3" component="h2" sx={{ color: '#FFFFFF', fontWeight: 900, mb: 2 }}>
                        Ready for the Best Bike Rental in Honnavar?
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto', mb: 3.5, lineHeight: 1.6 }}>
                        Reserve your bike online in under 2 minutes, or contact our Palya Main Rd office directly for instant confirmations and station pickup.
                    </Typography>

                    {/* Direct Contact Highlights */}
                    <Box
                        sx={{
                            display: 'inline-flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: { xs: 2, sm: 4 },
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                            mb: 4,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                                Palya Main Rd, Honnavar, Karnataka 581334
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} />
                            <Typography
                                component="a"
                                href="tel:+918660989586"
                                variant="body2"
                                sx={{ color: '#E2E8F0', fontWeight: 700, textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                            >
                                +91 8660989586
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>•</Typography>
                            <Typography
                                component="a"
                                href="tel:09731699125"
                                variant="body2"
                                sx={{ color: '#E2E8F0', fontWeight: 700, textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                            >
                                097316 99125
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>
                                Open 24 Hours
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                            <Typography
                                component="a"
                                href="mailto:contact@whizwheels.in"
                                variant="body2"
                                sx={{ color: '#E2E8F0', fontWeight: 600, textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                            >
                                contact@whizwheels.in
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <StarIcon sx={{ color: '#FBBF24', fontSize: 18 }} />
                            <Typography
                                component="a"
                                href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                target="_blank"
                                rel="noreferrer"
                                variant="body2"
                                sx={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                5.0★ (324 Reviews on Google)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <DirectionsIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                            <Typography
                                component="a"
                                href="https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334"
                                target="_blank"
                                rel="noreferrer"
                                variant="body2"
                                sx={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Get Directions ↗
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            component={Link}
                            href="/bikes"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                py: 1.6,
                                px: 4.5,
                                fontWeight: 800,
                                fontSize: '1rem',
                                borderRadius: 2,
                                boxShadow: '0 8px 20px -3px rgba(245, 158, 11, 0.4)',
                            }}
                        >
                            Rent a Bike Now
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            component="a"
                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20am%20looking%20for%20a%20bike%20rental%20in%20Honnavar."
                            target="_blank"
                            rel="noreferrer"
                            startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                            sx={{
                                py: 1.6,
                                px: 3.5,
                                color: '#FFFFFF',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                fontWeight: 700,
                                '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                            }}
                        >
                            WhatsApp: +91 8660989586
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            component="a"
                            href="tel:+918660989586"
                            startIcon={<PhoneIcon sx={{ color: '#F59E0B' }} />}
                            sx={{
                                py: 1.6,
                                px: 3.5,
                                color: '#FFFFFF',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                fontWeight: 700,
                                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                            }}
                        >
                            Call Us Now
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </AppLayout>
    );
}

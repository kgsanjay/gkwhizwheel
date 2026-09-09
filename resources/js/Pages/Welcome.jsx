import React, { useState, useEffect, useRef } from 'react';
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
    Avatar,
    IconButton,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ExploreIcon from '@mui/icons-material/Explore';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LandscapeIcon from '@mui/icons-material/Landscape';
import CastleIcon from '@mui/icons-material/Castle';
import DirectionsIcon from '@mui/icons-material/Directions';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LuggageIcon from '@mui/icons-material/Luggage';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ServiceBookingModal from '../Components/ServiceBookingModal';

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
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [serviceModalId, setServiceModalId] = useState('boating');

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 6);
        }, 8000);
        return () => clearInterval(timer);
    }, [isPaused]);

    const handlePrevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? 5 : prev - 1));
    };

    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % 6);
    };

    const handleOpenServiceModal = (id) => {
        setServiceModalId(id);
        setServiceModalOpen(true);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchStore) params.append('store_id', searchStore);
        if (searchCategory) params.append('category_id', searchCategory);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        router.visit(`/services/bikes?${params.toString()}`);
    };


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
            "name": "Honnavar Travel & Mobility Services Catalog",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Bike & Scooter Rentals in Honnavar",
                        "description": "Daily self-drive scooter and motorcycle rental starting at ₹350/day with zero deposit option for exploring Honnavar beaches and Sharavathi backwaters"
                    },
                    "price": "350",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Honnavar Coastal Cabs & Station Taxi Transfers",
                        "description": "Private sanitized AC cabs for Honnavar Railway Station pickups, Gokarna day trips, and Murudeshwar sightseeing"
                    },
                    "price": "1499",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Honnavar Homestays & Coastal Rooms",
                        "description": "Riverside and beachfront authentic homestays in Honnavar with authentic Karavali meals and serene backwater views"
                    },
                    "price": "1200",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Sharavathi Backwater Boating & Mangrove Cruises",
                        "description": "Guided motorboat and Shikara boat cruises through the pristine Sharavathi river estuary and mangrove trails in Honnavar"
                    },
                    "price": "350",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Netrani Island Scuba Diving & Snorkeling",
                        "description": "PADI certified underwater scuba diving and snorkeling expeditions at Netrani Island with boat transfer and HD footage"
                    },
                    "price": "3499",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Local Travel Guides & Heritage Trails",
                        "description": "Certified local storytelling guides for Mirjan Fort, Apsarakonda, hidden waterfalls, and coastal heritage walks"
                    },
                    "price": "799",
                    "priceCurrency": "INR"
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Custom Honnavar Vacation Tour Packages",
                        "description": "All-in-one customized Karavali vacation packages combining stays, rides, boating, and scuba with 24/7 coordinator"
                    },
                    "price": "2999",
                    "priceCurrency": "INR"
                }
            ]
        }
    };

    return (
        <AppLayout>
            <Head>
                <title>Top-Rated Travel & Bike Rentals in Honnavar | Cabs, Stays, Boating & Scuba - G.K. WhizWheel</title>
                <meta
                    name="description"
                    content="Explore Honnavar & Coastal Karnataka with G.K. WhizWheel. Bike rentals starting ₹350/day, AC taxi transfers, riverside homestays, Sharavathi backwater boating, Netrani scuba diving & custom packages. 5.0★ Google Rated (324+ reviews) at Palya Main Rd & Honnavar Railway Station. Call +91 8660989586 / 097316 99125."
                />
                <meta
                    name="keywords"
                    content="bike rental in honnavar, honnavar cabs, honnavar homestays, sharavathi backwater boating, netrani scuba diving, honnavar tour packages, G.K. WhizWheel, rental bikes in honnavar, scooty rent in honnavar, honnavar taxi service"
                />
                <link rel="canonical" href="https://whizwheels.in/" />
                <meta property="og:title" content="Top-Rated Travel & Bike Rentals in Honnavar | G.K. WhizWheel" />
                <meta
                    property="og:description"
                    content="All-in-one travel agency in Honnavar: Bike rentals starting ₹350/day, AC cabs, riverfront homestays, Sharavathi boating & Netrani scuba. 5.0★ Google Rated (324+ reviews)."
                />
                <meta property="og:image" content="/images/logo.png" />
                <meta property="og:url" content="https://whizwheels.in/" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Top-Rated Travel & Bike Rentals in Honnavar | G.K. WhizWheel" />
                <meta name="twitter:description" content="Bike rentals starting ₹350/day, AC cabs, homestays, Sharavathi backwater boating & Netrani scuba diving in Honnavar. 5.0★ Google Rated." />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>

            {/* =========================================================================
                1. MASTER HERO SECTION (G.K. WHIZWHEEL OVERARCHING SERVICE PROVIDER)
            ========================================================================== */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    position: 'relative',
                    py: { xs: 5, sm: 7, md: 9 },
                    px: { xs: 2, sm: 4, md: 6, lg: 8 },
                    mb: { xs: 4, md: 6 },
                    background: isDark
                        ? 'radial-gradient(130% 120% at 90% 10%, #1E293B 0%, #0F172A 60%, #090E17 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #EFF6FF 100%)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
                    overflow: 'hidden',
                }}
            >
                {/* Background Ambient Glows */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -120,
                        right: -100,
                        width: 550,
                        height: 550,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -150,
                        left: -100,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Box sx={{ maxWidth: '1440px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                        {/* Left Hero Story & Introduction */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <Chip
                                icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 16 }} />}
                                label="G.K. WhizWheel • 5.0 ★ (324 Google Reviews) • Honnavar, Karnataka"
                                sx={{
                                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#FBBF24',
                                    fontWeight: 700,
                                    fontSize: { xs: '0.72rem', sm: '0.85rem' },
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
                                    fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
                                    fontWeight: 900,
                                    lineHeight: 1.15,
                                    letterSpacing: '-0.03em',
                                    mb: 2,
                                }}
                            >
                                Your Complete Coastal Karnataka <br />
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 40%, #0284C7 80%, #10B981 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Travel & Mobility Partner
                                </Box>
                            </Typography>

                            <Typography
                                variant="subtitle1"
                                sx={{
                                    color: isDark ? '#FBBF24' : '#D97706',
                                    fontWeight: 700,
                                    fontStyle: 'italic',
                                    mb: 2,
                                    fontSize: { xs: '1rem', sm: '1.15rem' },
                                }}
                            >
                                “Ride the Freedom, Feel the Wind • Two-Wheelers, Cabs, Homestays, Boating & Scuba.”
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: isDark ? '#CBD5E1' : '#334155',
                                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                                    lineHeight: 1.7,
                                    mb: 4,
                                    maxWidth: 680,
                                }}
                            >
                                Welcome to <strong>G.K. WhizWheel</strong>. We are Honnavar’s premier travel and mobility agency. Whether you want to <strong>rent a bike starting at ₹350/day</strong>, hire a <strong>private AC cab</strong> for station pickup & Gokarna tours, book a serene <strong>Sharavathi riverfront homestay</strong>, cruise the <strong>mangrove backwaters</strong>, or explore underwater coral reefs at <strong>Netrani Island</strong> — our local team manages every detail under one verified roof with zero hidden fees.
                            </Typography>

                            {/* Key Highlights Pill Badges */}
                            <Grid container spacing={1.5} sx={{ mb: 4 }}>
                                {[
                                    { text: '5.0 ★ Google Rated (324+ Reviews)', color: '#F59E0B' },
                                    { text: 'Palya Rd & Railway Station Hubs', color: '#0284C7' },
                                    { text: 'Zero Security Deposit Options', color: '#10B981' },
                                    { text: '24/7 Roadside & Trip Assistance', color: '#7C3AED' },
                                ].map((item, i) => (
                                    <Grid key={i} size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircleIcon sx={{ color: item.color, fontSize: 18 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                                {item.text}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Hero Action Buttons */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    variant="contained"
                                    component={Link}
                                    href="/services/bikes"
                                    size="large"
                                    startIcon={<TwoWheelerIcon />}
                                    sx={{
                                        bgcolor: '#F59E0B',
                                        color: '#0F172A',
                                        fontWeight: 800,
                                        py: 1.4,
                                        px: 3.5,
                                        borderRadius: 2.5,
                                        fontSize: '0.98rem',
                                        boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.4)',
                                        '&:hover': { bgcolor: '#D97706' },
                                    }}
                                >
                                    Browse Available Bikes (19+ Fleet) →
                                </Button>
                                <Button
                                    variant="outlined"
                                    component="a"
                                    href="#service-offerings"
                                    size="large"
                                    sx={{
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                        fontWeight: 700,
                                        py: 1.4,
                                        px: 3,
                                        borderRadius: 2.5,
                                        fontSize: '0.98rem',
                                        '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.06)' },
                                    }}
                                >
                                    Explore All 7 Services ↓
                                </Button>
                            </Stack>
                        </Grid>

                        {/* Right Hero Showcase — Official Emblem & Direct Contact Card */}
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 3, sm: 3.5 },
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                    backdropFilter: 'blur(16px)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                                    boxShadow: isDark
                                        ? '0 20px 40px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                        : '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
                                    borderRadius: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2.5,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Box
                                        component="a"
                                        href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.8,
                                            px: 1.5,
                                            py: 0.6,
                                            borderRadius: 9999,
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            color: isDark ? '#FBBF24' : '#B45309',
                                            textDecoration: 'none',
                                            fontSize: '0.8rem',
                                            fontWeight: 800,
                                        }}
                                    >
                                        <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                        5.0 Google Rating (324+ Reviews)
                                    </Box>
                                    <Chip
                                        size="small"
                                        label="● Open 24/7"
                                        sx={{
                                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                                            color: isDark ? '#34D399' : '#047857',
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            border: '1px solid rgba(16, 185, 129, 0.25)',
                                        }}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        bgcolor: '#FFFFFF',
                                        borderRadius: 3,
                                        p: { xs: 2, sm: 2.5 },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src="/images/logo.png"
                                        alt="GK WhizWheel Official Logo"
                                        sx={{ width: '100%', maxWidth: 260, height: 'auto', display: 'block', mx: 'auto' }}
                                    />
                                </Box>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: 800 }}>
                                        Complete Tourism Agency in Honnavar
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#334155', display: 'block', mt: 0.3 }}>
                                        Two-Wheelers • AC Cabs • Stays • Boating • Scuba • Tours
                                    </Typography>
                                </Box>

                                {/* 3 Metrics (component="span" to avoid skipped heading levels) */}
                                <Grid container spacing={1.5} sx={{ textAlign: 'center' }}>
                                    <Grid size={{ xs: 4 }}>
                                        <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                                            <Typography component="span" variant="h6" sx={{ display: 'block', color: '#F59E0B', fontWeight: 900, lineHeight: 1.2 }}>₹350</Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 600, fontSize: '0.7rem' }}>Bikes from</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                                            <Typography component="span" variant="h6" sx={{ display: 'block', color: '#0284C7', fontWeight: 900, lineHeight: 1.2 }}>2 Hubs</Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 600, fontSize: '0.7rem' }}>Palya & Station</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                                            <Typography component="span" variant="h6" sx={{ display: 'block', color: '#10B981', fontWeight: 900, lineHeight: 1.2 }}>0 Lock</Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 600, fontSize: '0.7rem' }}>Zero Deposit</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Contact & Directions */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0', p: 1.8, borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 17, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#0F172A', fontWeight: 600, fontSize: '0.75rem' }}>
                                            Palya Main Rd, Honnavar, Karnataka 581334
                                        </Typography>
                                        <Box component="a" href="https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334" target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color: '#38BDF8', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', ml: 'auto', flexShrink: 0 }}>
                                            <DirectionsIcon sx={{ fontSize: 13 }} /> Directions ↗
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PhoneIcon sx={{ color: '#10B981', fontSize: 15, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#0F172A', fontWeight: 600, fontSize: '0.75rem' }}>
                                            +91 8660989586 • 097316 99125
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* =========================================================================
                2. DEDICATED SERVICE OFFERINGS SHOWCASE (7 CURATED SERVICES)
                   ORDER: 1. Bike Rentals, 2. Cab, 3. Homestay/Rooms, 4. Boating, 5. Scuba, 6. Guide, 7. Custom Tour Package
            ========================================================================== */}
            <Box id="service-offerings" sx={{ maxWidth: '1240px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mb: 9 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: isDark ? '#FBBF24' : '#B45309',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            mb: 1.5,
                        }}
                    >
                        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                        One Verified Karavali Travel Portal
                    </Box>
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={{
                            fontWeight: 950,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            letterSpacing: '-0.03em',
                            mb: 1.5,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                            lineHeight: 1.15,
                        }}
                    >
                        7 Curated Services For Your Honnavar Trip
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: isDark ? '#CBD5E1' : '#334155',
                            maxWidth: 720,
                            mx: 'auto',
                            fontSize: { xs: '0.98rem', md: '1.1rem' },
                            lineHeight: 1.65,
                        }}
                    >
                        Explore dedicated live fleets, certified water activities, riverfront cottages, and local trail experts with zero deposit and transparent tariffs.
                    </Typography>
                </Box>

                {/* 7 Services Grid (Cards 1 to 6 in 3-column responsive grid, Card 7 as Flagship Widescreen Showcase) */}
                <Grid container spacing={3.5}>
                    {[
                        {
                            id: 'bikes',
                            order: '01',
                            title: 'Bike & Scooter Rentals',
                            tag: 'Self-Drive Fleet',
                            tagline: 'Self-drive Honda Activa 6G, Royal Enfield Classic 350 & CB350 with zero deposit options and instant station delivery.',
                            rate: 'Starts ₹350 / Day',
                            image: '/images/services/two_wheelers.jpg',
                            color: '#F59E0B',
                            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            href: '/services/bikes',
                            cta: 'Explore Bikes & Rent',
                            icon: <TwoWheelerIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                '19+ Fleet (Activa 6G, Classic 350, CB350)',
                                '2 Sanitized ISI Helmets & Phone Mount Free',
                                'Honnavar Railway Station Delivery Available',
                            ],
                        },
                        {
                            id: 'cabs',
                            order: '02',
                            title: 'Coastal Cabs & Taxis',
                            tag: 'AC Chauffeur Fleet',
                            tagline: 'Chilled AC Swift Dzire, Ertiga & Innova Crysta with courteous, punctual local drivers who know every scenic shortcut.',
                            rate: 'Station ₹400 • Tour ₹2,400',
                            image: '/images/services/taxi.jpg',
                            color: '#0284C7',
                            gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                            href: '/services/cabs',
                            cta: 'View Cabs & Book Transfer',
                            icon: <LocalTaxiIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                'Punctual Railway Station & Airport Pickups',
                                '8hr / 80km Full Day Sightseeing Packages',
                                'Outstation to Jog Falls, Murudeshwar & Gokarna',
                            ],
                        },
                        {
                            id: 'homestays',
                            order: '03',
                            title: 'Homestays & Coastal Rooms',
                            tag: 'Verified Accommodations',
                            tagline: 'Peaceful Sharavathi riverfront wooden cottages, mangrove villas & beachside rooms serving home-cooked coastal meals.',
                            rate: 'Starts ₹1,800 / Night',
                            image: '/images/services/homestay.jpg',
                            color: '#E11D48',
                            gradient: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                            href: '/services/homestays',
                            cta: 'View Stays & Check Availability',
                            icon: <HomeWorkIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                'Sharavathi Riverfront Cottages & Beach Stays',
                                'Authentic Karavali Seafood & Veg Dinners',
                                '100% Couple-Safe & Family-Friendly Verified',
                            ],
                        },
                        {
                            id: 'boating',
                            order: '04',
                            title: 'Sharavathi Backwater Boating',
                            tag: 'River & Mangrove Cruise',
                            tagline: 'Glide through tranquil mangrove channels and witness where the mighty Sharavathi River meets the Arabian Sea at sunset.',
                            rate: 'Starts ₹400 / Person',
                            image: '/images/services/boating.jpg',
                            color: '#059669',
                            gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            href: '/services/boating',
                            cta: 'View Cruises & Reserve Slot',
                            icon: <DirectionsBoatIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                '100% Certified Safety Life Jackets Provided',
                                '04:30 PM Golden Sunset Estuary Cruise',
                                'Private Island & Shikara Charters Available',
                            ],
                        },
                        {
                            id: 'scuba',
                            order: '05',
                            title: 'Netrani Island Scuba Diving',
                            tag: 'PADI Coral Expedition',
                            tagline: 'Dive into Karnataka’s clearest coral waters with 1:1 certified dive master guidance. Non-swimmers and first-timers welcome!',
                            rate: 'Starts ₹2,999 / Dive',
                            image: '/images/services/scuba.jpg',
                            color: '#6366F1',
                            gradient: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
                            href: '/services/scuba',
                            cta: 'View Dive Packages & Book',
                            icon: <ScubaDivingIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                'Beginners & Non-Swimmers 100% Welcome',
                                'Free 4K Underwater GoPro Video & Photos',
                                'Daily 06:30 AM Murudeshwar Harbor Departure',
                            ],
                        },
                        {
                            id: 'guide',
                            order: '06',
                            title: 'Local Travel Guides & Trails',
                            tag: 'Expert Local Insiders',
                            tagline: 'Discover hidden freshwater forest cascades, Mirjan Fort architecture, and panoramic cliff vantage points off the tourist track.',
                            rate: 'Half-Day ₹1,200 • Full Day ₹2,200',
                            image: '/images/services/guide.jpg',
                            color: '#D97706',
                            gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                            href: '/services/guide',
                            cta: 'View Guided Trails & Tours',
                            icon: <ExploreIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                'Secret Apsarakonda Freshwater Waterfall Trek',
                                'Mirjan Fort Queen Heritage & History Walk',
                                'Curated Sunset Clifftops & Photography Spots',
                            ],
                        },
                    ].map((srv) => (
                        <Grid key={srv.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 4.5,
                                    bgcolor: isDark ? 'rgba(26, 34, 53, 0.85)' : '#FFFFFF',
                                    backdropFilter: 'blur(16px)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    boxShadow: isDark
                                        ? '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                                        : '0 10px 30px -10px rgba(15, 23, 42, 0.06), 0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        borderColor: srv.color,
                                        boxShadow: isDark
                                            ? `0 24px 48px -12px ${srv.color}35, 0 0 0 1px ${srv.color}60`
                                            : `0 24px 48px -12px ${srv.color}30, 0 4px 12px -2px rgba(15, 23, 42, 0.05)`,
                                        '& .card-img': {
                                            transform: 'scale(1.08)',
                                        },
                                        '& .cta-arrow': {
                                            transform: 'translateX(5px)',
                                        },
                                    },
                                }}
                            >
                                {/* Media Header with 2026 Glassmorphic Overlays */}
                                <Box sx={{ position: 'relative', height: 220, bgcolor: '#0F172A', overflow: 'hidden' }}>
                                    <Box
                                        component="img"
                                        className="card-img"
                                        src={srv.image}
                                        alt={srv.title}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                                        }}
                                    />
                                    {/* Multi-layered cinematic vignette */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.1) 40%, rgba(15,23,42,0.92) 100%)',
                                        }}
                                    />

                                    {/* Top Bar: Category Glass Pill & Floating Frosted Orb */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 14,
                                            left: 14,
                                            right: 14,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.8,
                                                px: 1.4,
                                                py: 0.5,
                                                borderRadius: 9999,
                                                bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                color: '#FFFFFF',
                                                fontSize: '0.74rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.04em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: srv.color }} />
                                            {srv.tag}
                                        </Box>

                                        <Box
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(15, 23, 42, 0.82)',
                                                backdropFilter: 'blur(12px)',
                                                border: `1.5px solid ${srv.color}`,
                                                boxShadow: `0 0 16px ${srv.color}50`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: srv.color,
                                            }}
                                        >
                                            {srv.icon}
                                        </Box>
                                    </Box>

                                    {/* Bottom Floating Bar: Tariff Badge + Rating Guarantee */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 12,
                                            left: 14,
                                            right: 14,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                px: 1.5,
                                                py: 0.55,
                                                borderRadius: 2,
                                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(12px)',
                                                border: `1.5px solid ${srv.color}`,
                                                boxShadow: `0 4px 14px -2px ${srv.color}40`,
                                                color: isDark ? '#FFFFFF' : '#0F172A',
                                                fontWeight: 900,
                                                fontSize: '0.78rem',
                                                letterSpacing: '0.02em',
                                            }}
                                        >
                                            {srv.rate}
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                px: 1.2,
                                                py: 0.45,
                                                borderRadius: 9999,
                                                bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                backdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                color: '#FBBF24',
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                            }}
                                        >
                                            <StarIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                                            5.0 Verified
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Card Body & Structured Highlights */}
                                <CardContent
                                    sx={{
                                        p: 3,
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box sx={{ mb: 2.5 }}>
                                        <Typography
                                            variant="h5"
                                            component="h3"
                                            sx={{
                                                fontWeight: 900,
                                                color: isDark ? '#FFFFFF' : '#0F172A',
                                                letterSpacing: '-0.02em',
                                                mb: 1,
                                                lineHeight: 1.25,
                                                fontSize: '1.25rem',
                                            }}
                                        >
                                            {srv.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isDark ? '#CBD5E1' : '#334155',
                                                fontSize: '0.88rem',
                                                lineHeight: 1.6,
                                                mb: 2.5,
                                            }}
                                        >
                                            {srv.tagline}
                                        </Typography>

                                        {/* 3 Value Pillars */}
                                        <Stack spacing={1}>
                                            {srv.highlights.map((h, hIdx) => (
                                                <Box key={hIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
                                                    <CheckCircleIcon
                                                        sx={{
                                                            fontSize: 16,
                                                            color: srv.color,
                                                            mt: '2px',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: isDark ? '#E2E8F0' : '#334155',
                                                            fontWeight: 600,
                                                            fontSize: '0.82rem',
                                                            lineHeight: 1.45,
                                                        }}
                                                    >
                                                        {h}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>

                                    {/* 2026 CTA Button */}
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        component={Link}
                                        href={srv.href}
                                        sx={{
                                            bgcolor: srv.color,
                                            color: srv.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                            fontWeight: 850,
                                            py: 1.35,
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            fontSize: '0.92rem',
                                            boxShadow: `0 6px 18px -2px ${srv.color}45`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.8,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                bgcolor: srv.color,
                                                filter: 'brightness(0.92)',
                                                boxShadow: `0 10px 24px -2px ${srv.color}65`,
                                            },
                                        }}
                                    >
                                        <span>{srv.cta}</span>
                                        <ArrowForwardIcon className="cta-arrow" sx={{ fontSize: 18, transition: 'transform 0.3s ease' }} />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    {/* =========================================================================
                        SERVICE 07 (FLAGSHIP): CUSTOM TOUR PACKAGE & KARAVALI COMBOS
                    ========================================================================== */}
                    <Grid size={{ xs: 12 }}>
                        <Card
                            sx={{
                                borderRadius: 5,
                                bgcolor: isDark ? 'rgba(26, 34, 53, 0.9)' : '#FFFFFF',
                                backdropFilter: 'blur(16px)',
                                border: isDark ? '1.5px solid rgba(139, 92, 246, 0.4)' : '1.5px solid #DDD6FE',
                                boxShadow: isDark
                                    ? '0 20px 50px -15px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                    : '0 20px 50px -15px rgba(139, 92, 246, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    borderColor: '#8B5CF6',
                                    boxShadow: isDark
                                        ? '0 30px 60px -15px rgba(139, 92, 246, 0.45), 0 0 0 1px #8B5CF6'
                                        : '0 30px 60px -15px rgba(139, 92, 246, 0.3), 0 4px 16px -2px rgba(15, 23, 42, 0.08)',
                                    '& .tour-img': {
                                        transform: 'scale(1.06)',
                                    },
                                    '& .tour-arrow': {
                                        transform: 'translateX(6px)',
                                    },
                                },
                            }}
                        >
                            <Grid container>
                                {/* Left: Panoramic Media Showcase */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            height: { xs: 260, md: '100%' },
                                            minHeight: { md: 360 },
                                            bgcolor: '#0F172A',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            className="tour-img"
                                            src="/images/services/tour.jpg"
                                            alt="Custom Karavali Tour Packages"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background:
                                                    'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.15) 40%, rgba(15,23,42,0.95) 100%)',
                                            }}
                                        />

                                        {/* Floating Overlays */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 16,
                                                left: 16,
                                                right: 16,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Chip
                                                icon={<AutoAwesomeIcon sx={{ fontSize: '15px !important', color: '#FFFFFF !important' }} />}
                                                label="07 • ALL-IN-ONE ITINERARY"
                                                size="small"
                                                sx={{
                                                    bgcolor: '#8B5CF6',
                                                    color: '#FFFFFF',
                                                    fontWeight: 900,
                                                    fontSize: '0.74rem',
                                                    letterSpacing: '0.04em',
                                                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.5)',
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                    backdropFilter: 'blur(12px)',
                                                    border: '1.5px solid #8B5CF6',
                                                    boxShadow: '0 0 18px rgba(139, 92, 246, 0.6)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#A78BFA',
                                                }}
                                            >
                                                <AutoAwesomeIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                        </Box>

                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 16,
                                                left: 16,
                                                right: 16,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    px: 1.8,
                                                    py: 0.6,
                                                    borderRadius: 2,
                                                    bgcolor: 'rgba(15, 23, 42, 0.92)',
                                                    backdropFilter: 'blur(12px)',
                                                    border: '1.5px solid #8B5CF6',
                                                    color: '#FFFFFF',
                                                    fontWeight: 900,
                                                    fontSize: '0.82rem',
                                                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                                                }}
                                            >
                                                Custom Combos • Save 10%
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    px: 1.2,
                                                    py: 0.5,
                                                    borderRadius: 9999,
                                                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                                                    backdropFilter: 'blur(12px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#FBBF24',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                                5.0 Rated
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Right: Comprehensive Details & Interactive Actions */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Box
                                        sx={{
                                            p: { xs: 3, sm: 4, md: 4.5 },
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                <Chip
                                                    label="SAVE 10% ON COMBO BOOKINGS"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                                                        color: isDark ? '#C4B5FD' : '#6D28D9',
                                                        fontWeight: 850,
                                                        fontSize: '0.74rem',
                                                        border: '1px solid rgba(139, 92, 246, 0.4)',
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: isDark ? '#A78BFA' : '#7C3AED', fontWeight: 700 }}>
                                                    • 100% Customized
                                                </Typography>
                                            </Box>

                                            <Typography
                                                variant="h4"
                                                component="h3"
                                                sx={{
                                                    fontWeight: 950,
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    letterSpacing: '-0.03em',
                                                    mb: 1.5,
                                                    lineHeight: 1.2,
                                                    fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.1rem' },
                                                }}
                                            >
                                                Custom Tour Packages & Karavali Combos
                                            </Typography>

                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: isDark ? '#CBD5E1' : '#334155',
                                                    fontSize: { xs: '0.92rem', md: '1rem' },
                                                    lineHeight: 1.65,
                                                    mb: 3,
                                                }}
                                            >
                                                Why coordinate with 5 different operators? We curate your end-to-end trip under one verified roof.
                                                Bundle <strong>two-wheelers or private AC cabs</strong>, <strong>Sharavathi riverfront cottages</strong>,
                                                <strong>mangrove sunset boating</strong>, and <strong>Netrani scuba diving</strong> into a personalized itinerary
                                                backed by a dedicated local Honnavar coordinator.
                                            </Typography>

                                            {/* Multi-service bundled inclusions tag cloud */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                                {[
                                                    { label: '🏍️ Self-Drive Bikes', color: '#F59E0B' },
                                                    { label: '🚖 Chauffeur Cabs', color: '#0284C7' },
                                                    { label: '🏡 Riverfront Stays', color: '#E11D48' },
                                                    { label: '🚤 Sunset Boating', color: '#059669' },
                                                    { label: '🤿 Netrani Scuba', color: '#6366F1' },
                                                    { label: '🗺️ Local Guide', color: '#D97706' },
                                                ].map((item, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={item.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9',
                                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                                            fontWeight: 750,
                                                            fontSize: '0.78rem',
                                                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1',
                                                        }}
                                                    />
                                                ))}
                                            </Box>

                                            {/* Key Pillars */}
                                            <Stack spacing={1.2} sx={{ mb: 4 }}>
                                                {[
                                                    'Tailored for Couples, Family Getaways, Group Treks & Weekend Roadtrips',
                                                    '10% Instant Package Discount vs Booking Each Service Individually',
                                                    'Dedicated Local Honnavar Trip Manager On 24/7 Call From Arrival to Departure',
                                                ].map((text, i) => (
                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <CheckCircleIcon sx={{ fontSize: 17, color: '#8B5CF6', flexShrink: 0 }} />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: isDark ? '#E2E8F0' : '#334155',
                                                                fontWeight: 650,
                                                                fontSize: '0.88rem',
                                                            }}
                                                        >
                                                            {text}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>

                                        {/* Action Bar */}
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <Button
                                                variant="contained"
                                                component={Link}
                                                href="/services/tours"
                                                size="large"
                                                sx={{
                                                    bgcolor: '#8B5CF6',
                                                    color: '#FFFFFF',
                                                    fontWeight: 850,
                                                    py: 1.4,
                                                    px: 3.5,
                                                    borderRadius: 2.5,
                                                    textTransform: 'none',
                                                    fontSize: '0.95rem',
                                                    boxShadow: '0 8px 22px -4px rgba(139, 92, 246, 0.5)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    '&:hover': {
                                                        bgcolor: '#7C3AED',
                                                        boxShadow: '0 12px 28px -4px rgba(139, 92, 246, 0.65)',
                                                    },
                                                }}
                                            >
                                                <span>Build Custom Tour Package</span>
                                                <ArrowForwardIcon className="tour-arrow" sx={{ fontSize: 19, transition: 'transform 0.3s ease' }} />
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                component="a"
                                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheel%2C%20I%20want%20to%20plan%20a%20custom%20tour%20package%20for%20Honnavar"
                                                target="_blank"
                                                rel="noreferrer"
                                                size="large"
                                                startIcon={<WhatsAppIcon sx={{ color: '#10B981 !important' }} />}
                                                sx={{
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    fontWeight: 800,
                                                    py: 1.4,
                                                    px: 3,
                                                    borderRadius: 2.5,
                                                    textTransform: 'none',
                                                    fontSize: '0.95rem',
                                                    '&:hover': {
                                                        borderColor: '#10B981',
                                                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                                                    },
                                                }}
                                            >
                                                WhatsApp Tour Specialist
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* =========================================================================
                REST OF ALL SECTIONS (1240px CONTAINER)
            ========================================================================== */}
            <Box sx={{ maxWidth: '1240px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>

                {/* =========================================================================
                    1.5. OFFICIAL G.K. WHIZWHEEL FLYER TRUST BADGES (6 KEY ADVANTAGES)
                ========================================================================== */}
                <Box
                    sx={{
                        mb: 6,
                        mt: { xs: 3, md: 4 },
                        p: { xs: 2.5, md: 3 },
                        borderRadius: 3,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        {[
                            {
                                icon: <BuildCircleIcon sx={{ color: '#F59E0B', fontSize: 28 }} />,
                                title: 'Fully Serviced Vehicles',
                                desc: 'Daily sanitized & checked fleet',
                            },
                            {
                                icon: <WhatsAppIcon sx={{ color: '#10B981', fontSize: 28 }} />,
                                title: 'Easy WhatsApp Booking',
                                desc: '+91 86609 89586 (Instant Chat)',
                                isPhone: true,
                            },
                            {
                                icon: <CurrencyRupeeIcon sx={{ color: '#38BDF8', fontSize: 28 }} />,
                                title: 'Affordable Pricing',
                                desc: 'Starts ₹350/day • Zero Deposit option',
                            },
                            {
                                icon: <SecurityIcon sx={{ color: '#10B981', fontSize: 28 }} />,
                                title: 'Safe & Comfortable',
                                desc: 'Sanitized helmets & 24x7 support',
                            },
                            {
                                icon: <AccessTimeIcon sx={{ color: '#F59E0B', fontSize: 28 }} />,
                                title: 'Instant Booking',
                                desc: 'Reserve online in under 60 sec',
                            },
                            {
                                icon: <ExploreIcon sx={{ color: '#A855F7', fontSize: 28 }} />,
                                title: 'Tourist Friendly',
                                desc: 'Local advice, maps & routes',
                            },
                        ].map((badge, idx) => (
                            <Grid key={idx} size={{ xs: 6, sm: 4, md: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 1 }}>
                                    <Box
                                        sx={{
                                            p: 1.25,
                                            borderRadius: '50%',
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                            mb: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {badge.icon}
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.25 }}>
                                        {badge.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: badge.isPhone ? '#10B981' : (isDark ? '#CBD5E1' : '#334155'), fontWeight: badge.isPhone ? 700 : 500, fontSize: '0.72rem', lineHeight: 1.3 }}>
                                        {badge.desc}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    3. SCENIC ROUTES & ATTRACTIONS (Honnavar & Coastal Karnataka)
                       All 6 destinations with high-resolution imagery and accessible contrast
                ========================================================================== */}
                <Box component="section" id="routes" aria-labelledby="places-title" sx={{ mb: 11 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.8,
                                px: 2,
                                py: 0.6,
                                borderRadius: 9999,
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                color: isDark ? '#FBBF24' : '#B45309',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                mb: 1.5,
                            }}
                        >
                            <ExploreIcon sx={{ fontSize: 16 }} />
                            Must-Visit Coastal Destinations
                        </Box>
                        <Typography
                            id="places-title"
                            variant="h3"
                            component="h2"
                            sx={{
                                fontWeight: 950,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                letterSpacing: '-0.02em',
                                mb: 1.5,
                                fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' },
                            }}
                        >
                            Top Places to Visit in Honnavar & Along the Coast
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: isDark ? '#CBD5E1' : '#475569',
                                maxWidth: 720,
                                mx: 'auto',
                                fontSize: { xs: '0.96rem', md: '1.08rem' },
                                lineHeight: 1.65,
                            }}
                        >
                            Honnavar is Karnataka’s hidden coastal gem. Whether cruising on two wheels, relaxing in a private AC cab, or sailing through mangrove backwaters — <strong>G.K. WhizWheel</strong> connects you to Uttara Kannada’s most breathtaking natural wonders.
                        </Typography>
                    </Box>

                    <Grid container spacing={3.5}>
                        {[
                            {
                                title: 'Sharavathi Backwaters & Boating',
                                distance: '8 km from Hub',
                                transport: '🛵 Bike / 🚤 Boat',
                                image: '/images/places/sharavathi_backwaters.jpg',
                                alt: 'Scenic Sharavathi backwaters and mangrove estuary at sunset in Honnavar with wooden boat',
                                color: '#059669',
                                tags: ['Mangrove Estuary', 'Sunset Cruise', 'Kayaking'],
                                desc: 'Cruising across the Sharavathi bridges and mangrove channels offers calm water reflections, estuary sunsets where the river meets the sea, and serene Shikara rides.',
                                linkHref: '/services/boating',
                                linkText: 'Explore Boating & Cruises →',
                            },
                            {
                                title: 'Honnavar Eco Beach & Boardwalk',
                                distance: '4 km from Hub',
                                transport: '🛵 Bike / 🚖 Cab',
                                image: '/images/places/eco_beach_boardwalk.jpg',
                                alt: 'Honnavar Eco Beach wooden boardwalk trail curving through rich coastal mangrove trees towards the sea',
                                color: '#0284C7',
                                tags: ['Blue Flag Beach', 'Wooden Promenade', 'Sunset Walk'],
                                desc: 'Certified eco-beach featuring a picturesque wooden promenade winding through rich coastal mangroves. Ideal for gentle evening rides, nature photography, and sea breezes.',
                                linkHref: '/services/bikes',
                                linkText: 'Rent Bike for Beach Ride →',
                            },
                            {
                                title: 'Apsarakonda Waterfalls & Hill',
                                distance: '7 km South (NH66)',
                                transport: '🛵 Bike / 🚖 Cab',
                                image: '/images/places/apsarakonda_falls.jpg',
                                alt: 'Apsarakonda freshwater waterfall cascading into a natural pool surrounded by tropical palm trees',
                                color: '#D97706',
                                tags: ['Freshwater Cascade', 'Natural Lagoon', 'Cliff View'],
                                desc: 'A natural freshwater cascade flowing into a natural pond with ancient Pandava caves, accompanied by a panoramic hill-garden viewpoint over the Arabian Sea.',
                                linkHref: '/services/guide',
                                linkText: 'View Guided Waterfall Tour →',
                            },
                            {
                                title: 'Mirjan Fort Historic Ramparts',
                                distance: '22 km North (NH66)',
                                transport: '🛵 Bike / 🚖 Cab',
                                image: '/images/places/mirjan_fort.jpg',
                                alt: 'Historic 16th century Mirjan Fort with ancient laterite stone ramparts and moss-covered royal watchtowers',
                                color: '#7C3AED',
                                tags: ['16th Century Queen', 'Laterite Architecture', 'Highway Ride'],
                                desc: 'Built in the 16th century by Queen Chennabhairadevi (the Pepper Queen), this fortress features mossy laterite watchtowers and serene green grounds along NH66.',
                                linkHref: '/services/guide',
                                linkText: 'Explore Heritage Fort Tour →',
                            },
                            {
                                title: 'Murudeshwar Shiva Temple & Sea',
                                distance: '27 km South (NH66)',
                                transport: '🚖 Cab / 🛵 Bike',
                                image: '/images/places/murudeshwar_temple.jpg',
                                alt: 'Colossal Lord Shiva statue and Raja Gopuram overlooking the Arabian Sea at Murudeshwar temple',
                                color: '#E11D48',
                                tags: ['World Tallest Shiva', 'Raja Gopuram', 'Netrani Base'],
                                desc: 'Home to the world’s 2nd tallest Shiva statue seated on Kanduka hill overlooking the ocean, 20-storey Raja Gopuram, and gateway to Netrani scuba diving.',
                                linkHref: '/services/cabs',
                                linkText: 'Book AC Cab to Murudeshwar →',
                            },
                            {
                                title: 'Gokarna Om & Kudle Beaches',
                                distance: '48 km North (NH66)',
                                transport: '🚖 Cab / 🛵 Bike',
                                image: '/images/places/gokarna_beaches.jpg',
                                alt: 'Aerial view of Om Beach with crescent-shaped golden sands and turquoise sea in Gokarna',
                                color: '#2563EB',
                                tags: ['Om Beach', 'Kudle Coastline', 'Temple Town'],
                                desc: 'The quintessential Karnataka coastal highway road trip. Cruise on a Royal Enfield or hire an AC taxi from Honnavar to Om Beach, cafe hopping, and sacred temples.',
                                linkHref: '/services/cabs',
                                linkText: 'Book Gokarna Day Trip Cab →',
                            },
                        ].map((place, idx) => (
                            <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 4,
                                        bgcolor: isDark ? 'rgba(26, 34, 53, 0.85)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        boxShadow: isDark
                                            ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                                            : '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
                                        overflow: 'hidden',
                                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            borderColor: place.color,
                                            boxShadow: isDark
                                                ? `0 20px 40px -10px ${place.color}35`
                                                : `0 20px 40px -10px ${place.color}25`,
                                            '& .place-img': {
                                                transform: 'scale(1.08)',
                                            },
                                        },
                                    }}
                                >
                                    {/* High-Resolution Destination Image Header */}
                                    <Box sx={{ position: 'relative', height: 215, bgcolor: '#0F172A', overflow: 'hidden' }}>
                                        <Box
                                            component="img"
                                            className="place-img"
                                            src={place.image}
                                            alt={place.alt}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background:
                                                    'linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.1) 40%, rgba(15,23,42,0.9) 100%)',
                                            }}
                                        />

                                        {/* Floating Overlays */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                right: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    px: 1.4,
                                                    py: 0.45,
                                                    borderRadius: 9999,
                                                    bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    fontSize: '0.74rem',
                                                }}
                                            >
                                                📍 {place.distance}
                                            </Box>
                                            <Box
                                                sx={{
                                                    px: 1.4,
                                                    py: 0.45,
                                                    borderRadius: 9999,
                                                    bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: `1.5px solid ${place.color}`,
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    fontSize: '0.74rem',
                                                }}
                                            >
                                                {place.transport}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Card Content */}
                                    <CardContent
                                        sx={{
                                            p: 3,
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="h5"
                                                component="h3"
                                                sx={{
                                                    fontWeight: 900,
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    letterSpacing: '-0.02em',
                                                    lineHeight: 1.25,
                                                    fontSize: '1.2rem',
                                                    mb: 1.2,
                                                }}
                                            >
                                                {place.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: isDark ? '#CBD5E1' : '#334155',
                                                    fontSize: '0.88rem',
                                                    lineHeight: 1.6,
                                                    mb: 2,
                                                }}
                                            >
                                                {place.desc}
                                            </Typography>

                                            {/* Highlight Tag Cloud */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
                                                {place.tags.map((tag, tIdx) => (
                                                    <Chip
                                                        key={tIdx}
                                                        label={tag}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                                            fontWeight: 700,
                                                            fontSize: '0.74rem',
                                                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>

                                        {/* Action Link with keyboard focus accessibility */}
                                        <Button
                                            component={Link}
                                            href={place.linkHref}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                p: 0,
                                                color: isDark ? '#38BDF8' : '#0284C7',
                                                fontWeight: 800,
                                                fontSize: '0.88rem',
                                                textTransform: 'none',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    bgcolor: 'transparent',
                                                    textDecoration: 'underline',
                                                    color: place.color,
                                                },
                                                '&:focus-visible': {
                                                    outline: '3px solid #F59E0B',
                                                    outlineOffset: '2px',
                                                },
                                            }}
                                        >
                                            {place.linkText}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    4. CREATIVE 4-STEP BOOKING ROADMAP / JOURNEY TIMELINE
                       Creative visual connected timeline with micro-badges and high contrast
                ========================================================================== */}
                <Box component="section" id="how-it-works" aria-labelledby="process-title" sx={{ mb: 12 }}>
                    <Box sx={{ textAlign: 'center', mb: 7 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.8,
                                px: 2,
                                py: 0.6,
                                borderRadius: 9999,
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                color: isDark ? '#34D399' : '#047857',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                mb: 1.5,
                            }}
                        >
                            <SpeedIcon sx={{ fontSize: 16 }} />
                            Fast, Seamless & Transparent
                        </Box>
                        <Typography
                            id="process-title"
                            variant="h3"
                            component="h2"
                            sx={{
                                fontWeight: 950,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                letterSpacing: '-0.02em',
                                mb: 1.5,
                                fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' },
                            }}
                        >
                            How Booking Works with GK WhizWheel
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: isDark ? '#CBD5E1' : '#475569',
                                maxWidth: 680,
                                mx: 'auto',
                                fontSize: { xs: '0.96rem', md: '1.08rem' },
                                lineHeight: 1.65,
                            }}
                        >
                            From live online fleet selection to 24/7 on-ground assistance — enjoy Karnataka’s most seamless, zero-friction travel booking journey in 4 simple stages.
                        </Typography>
                    </Box>

                    {/* Interactive Connected Roadmap Timeline */}
                    <Box sx={{ position: 'relative' }}>
                        {/* Horizontal Connecting Glowing Pipe (Visible on md and up) */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 38,
                                left: '8%',
                                right: '8%',
                                height: 3,
                                background: isDark
                                    ? 'linear-gradient(90deg, #F59E0B 0%, #0284C7 33%, #10B981 66%, #8B5CF6 100%)'
                                    : 'linear-gradient(90deg, #D97706 0%, #0284C7 33%, #059669 66%, #7C3AED 100%)',
                                borderRadius: 2,
                                opacity: 0.8,
                                zIndex: 0,
                                display: { xs: 'none', md: 'block' },
                            }}
                        />

                        <Grid container spacing={3.5} sx={{ position: 'relative', zIndex: 1 }}>
                            {[
                                {
                                    step: '01',
                                    title: 'Choose Service & Dates',
                                    badge: '⚡ Real-Time Inventory',
                                    color: '#F59E0B',
                                    icon: <ExploreIcon sx={{ fontSize: 24 }} />,
                                    desc: 'Select from 19+ self-drive bikes, private AC cabs, riverfront homestays, mangrove boat cruises, or Netrani scuba diving slots.',
                                    perk: 'Zero deposit options available',
                                },
                                {
                                    step: '02',
                                    title: 'Instant Online Hold',
                                    badge: '🔒 Confirmed in < 60s',
                                    color: '#0284C7',
                                    icon: <SecurityIcon sx={{ fontSize: 24 }} />,
                                    desc: 'Lock in your ride, room, or excursion with transparent 24-hour block tariffs. No surge fees, no hidden platform taxes.',
                                    perk: 'Instant SMS & WhatsApp confirmation',
                                },
                                {
                                    step: '03',
                                    title: 'Station or Hub Handover',
                                    badge: '🚉 Doorstep Hub Handover',
                                    color: '#10B981',
                                    icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
                                    desc: 'Meet our local executive right outside Honnavar Railway Station or at our Palya Main Rd hub for rapid 3-minute digital KYC.',
                                    perk: '2 Clean ISI helmets & route map free',
                                },
                                {
                                    step: '04',
                                    title: '24/7 Care & Easy Return',
                                    badge: '🤝 24/7 Dedicated Helpline',
                                    color: '#8B5CF6',
                                    icon: <PhoneIcon sx={{ fontSize: 24 }} />,
                                    desc: 'Explore the Karavali coastline with round-the-clock roadside assistance and prompt security deposit refunds upon vehicle return.',
                                    perk: 'Prompt refunds credited within 1 hr',
                                },
                            ].map((step, sIdx) => (
                                <Grid key={sIdx} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            p: { xs: 3, sm: 3.5 },
                                            borderRadius: 4.5,
                                            bgcolor: isDark ? 'rgba(26, 34, 53, 0.85)' : '#FFFFFF',
                                            backdropFilter: 'blur(16px)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            boxShadow: isDark
                                                ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                                                : '0 10px 25px -8px rgba(15, 23, 42, 0.06)',
                                            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative',
                                            overflow: 'visible',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                borderColor: step.color,
                                                boxShadow: isDark
                                                    ? `0 20px 40px -10px ${step.color}35`
                                                    : `0 20px 40px -10px ${step.color}25`,
                                                '& .step-orb': {
                                                    transform: 'scale(1.12)',
                                                    boxShadow: `0 0 24px ${step.color}80`,
                                                },
                                            },
                                        }}
                                    >
                                        {/* Creative Glowing Step Number Orb */}
                                        <Box
                                            className="step-orb"
                                            sx={{
                                                width: 58,
                                                height: 58,
                                                borderRadius: '50%',
                                                bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                                                border: `3px solid ${step.color}`,
                                                boxShadow: `0 0 16px ${step.color}45`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: step.color,
                                                fontWeight: 950,
                                                fontSize: '1.25rem',
                                                letterSpacing: '-0.02em',
                                                mb: 2.5,
                                                mt: { md: -1 },
                                                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                                            }}
                                        >
                                            {step.step}
                                        </Box>

                                        {/* Micro Status Chip */}
                                        <Chip
                                            label={step.badge}
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? `${step.color}20` : `${step.color}15`,
                                                color: isDark ? '#FFFFFF' : (step.color === '#F59E0B' ? '#B45309' : step.color),
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                border: `1px solid ${step.color}50`,
                                                mb: 2,
                                            }}
                                        />

                                        <Typography
                                            variant="h5"
                                            component="h3"
                                            sx={{
                                                fontWeight: 900,
                                                color: isDark ? '#FFFFFF' : '#0F172A',
                                                letterSpacing: '-0.02em',
                                                fontSize: '1.2rem',
                                                lineHeight: 1.25,
                                                mb: 1.5,
                                            }}
                                        >
                                            {step.title}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isDark ? '#CBD5E1' : '#334155',
                                                fontSize: '0.88rem',
                                                lineHeight: 1.6,
                                                mb: 2.5,
                                                flexGrow: 1,
                                            }}
                                        >
                                            {step.desc}
                                        </Typography>

                                        {/* Bottom Key Benefit Pill */}
                                        <Box
                                            sx={{
                                                width: '100%',
                                                p: 1.2,
                                                borderRadius: 2,
                                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 0.8,
                                            }}
                                        >
                                            <CheckCircleIcon sx={{ fontSize: 15, color: step.color }} />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                                    fontWeight: 700,
                                                    fontSize: '0.76rem',
                                                }}
                                            >
                                                {step.perk}
                                            </Typography>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    7. CUSTOMER REVIEWS & EXPERIENCES (5.0 Google Rating from 324+ Happy Riders)
                ========================================================================== */}
                <Box id="reviews" sx={{ mb: 10 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 0.75,
                                borderRadius: 10,
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                                color: '#D97706',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                mb: 1.5,
                            }}
                        >
                            <StarIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                            5.0 Google Rating (324+ Verified Reviews)
                        </Box>
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            Loved by Travelers in Honnavar
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155', maxWidth: 640, mx: 'auto' }}>
                            Real reviews from road-trippers and explorers who chose GK WhizWheels for their Karnataka coastal journey.
                        </Typography>
                    </Box>

                    <Grid container spacing={3.5}>
                        {[
                            {
                                name: 'Ankit Sharma',
                                location: 'Bangalore, Karnataka',
                                bike: 'Honda Activa 6G',
                                trip: 'Sharavathi Backwaters & Eco Beach',
                                rating: 5,
                                review:
                                    'Super seamless experience! Booked online and selected Honnavar Railway Station pickup. The executive was waiting with the bike right as our train pulled in. Clean helmets, spotless scooter, and exact 24-hour block billing with zero surprise charges.',
                            },
                            {
                                name: 'Dr. Sneha & Rohan K.',
                                location: 'Mumbai, Maharashtra',
                                bike: 'Royal Enfield Classic 350',
                                trip: 'Coastal Ride to Mirjan Fort & Gokarna',
                                rating: 5,
                                review:
                                    'Rented the Classic 350 for 4 days. The bike was in mint mechanical condition with great tyres and smooth brakes. Cruised along NH66 all the way to Om Beach. The zero deposit option and instant WhatsApp assistance made this our best road trip yet!',
                            },
                            {
                                name: 'Karthik Venugopal',
                                location: 'Mysore, Karnataka',
                                bike: 'TVS Ntorq 125',
                                trip: 'Apsarakonda Falls & Murudeshwar',
                                rating: 5,
                                review:
                                    'Outstanding customer service by the GK WhizWheels team at Palya Main Rd. Quick KYC verification took under 3 minutes. The bike had great pickup for hill climbs around Apsarakonda. Deposit refund was credited directly within an hour of vehicle return.',
                            },
                        ].map((rev) => (
                            <Grid size={{ xs: 12, md: 4 }} key={rev.name}>
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
                                        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            borderColor: 'rgba(245, 158, 11, 0.4)',
                                            boxShadow: isDark
                                                ? '0 12px 28px -5px rgba(0, 0, 0, 0.5)'
                                                : '0 10px 25px -4px rgba(15, 23, 42, 0.08)',
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Stack direction="row" spacing={0.5}>
                                            {[...Array(rev.rating)].map((_, i) => (
                                                <StarIcon key={i} sx={{ fontSize: 18, color: '#F59E0B' }} />
                                            ))}
                                        </Stack>
                                        <Chip
                                            icon={<CheckCircleIcon sx={{ fontSize: 14, color: '#10B981 !important' }} />}
                                            label="Verified Ride"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10B981',
                                                fontWeight: 800,
                                                fontSize: '0.68rem',
                                            }}
                                        />
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDark ? '#E2E8F0' : '#334155',
                                            lineHeight: 1.7,
                                            mb: 3,
                                            flexGrow: 1,
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        "{rev.review}"
                                    </Typography>

                                    <Divider sx={{ mb: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar
                                            sx={{
                                                bgcolor: '#F59E0B',
                                                color: '#000000',
                                                fontWeight: 800,
                                                fontSize: '0.9rem',
                                                width: 42,
                                                height: 42,
                                            }}
                                        >
                                            {rev.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, lineHeight: 1.2 }}>
                                                {rev.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', display: 'block' }}>
                                                {rev.location} • {rev.trip}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    8. HONNAVAR HUBS (Palya Main Rd & Railway Station Hub)
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
                                                <Typography variant="h5" component="h3" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}>
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
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.6, fontWeight: 600 }}>
                                                {store.address_line ? `${store.address_line}, Karnataka 581334` : 'Palya Main Rd, Honnavar, Karnataka 581334'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                            <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                                                Hub Contact: +91 8660989586 • 097316 99125
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                                            <Chip label="Train Arrival Pickup" size="small" sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#334155' }} />
                                            <Chip label="On-Site Helmet Fitting" size="small" sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#334155' }} />
                                        </Stack>
                                    </Box>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            component={Link}
                                            href={`/services/bikes?store_id=${store.id}`}
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
                    7. FREQUENTLY ASKED QUESTIONS (GK WhizWheel Travel & Rental FAQs)
                ========================================================================== */}
                <Box id="faq" sx={{ mb: 10 }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Chip
                            label="Got Questions? We Have Answers"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1 }}
                        />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            Frequently Asked Questions
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                            Everything you need to know about our rental bikes, private cabs, Sharavathi boat cruises, homestays, and station pickups in Honnavar.
                        </Typography>
                    </Box>

                    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
                        <Accordion
                            defaultExpanded
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    What travel and rental services does GK WhizWheel offer in Honnavar?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    We are Honnavar’s complete coastal travel partner offering: (1) <strong>Two-Wheeler & Bike Rentals</strong> (Activa, Classic 350, CB350, electric scooters starting ₹350/day), (2) <strong>Private AC Cabs & Taxis</strong> (Swift Dzire, Innova Crysta, Tempo Travellers for station pickups and sightseeing), (3) <strong>Sharavathi River Backwater Boating</strong> & mangrove island cruises, (4) <strong>Netrani Island Scuba Diving</strong> with certified PADI dive masters, (5) <strong>Coastal Homestays & Riverfront Cottages</strong>, and (6) <strong>All-in-One Vacation Packages</strong> bundling stay, ride, and cruise.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Can I get pickup or delivery directly at Honnavar Railway Station?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    Yes! We maintain an active <strong>Honnavar Railway Station Hub</strong> located right on Station Road. Whether you book a rental bike, an AC cab, or a tour package, our executive meets you right outside the station upon your train arrival for a swift 5-minute handover, saving you from expensive local auto fares.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    What documents are required to book rental vehicles or services?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    For two-wheelers and self-drive rentals, you need: (1) An original, valid Indian Driving License for two-wheelers, and (2) One government ID proof (Aadhaar Card, Voter ID, or Passport). For cabs, boat cruises, scuba diving, and homestays, only standard government ID verification is required. You can complete digital KYC in advance on our website.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Can I bundle multiple services into an All-in-One Vacation Package?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    Yes! With our custom Karavali Vacation Packages, you can bundle Bikes or Cabs + Riverfront Homestay + Sharavathi Boat Cruise + Netrani Scuba into a single itinerary. Combo bookings receive an automatic 10% package discount and a dedicated local Honnavar trip coordinator who handles all logistics.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    How are payments, security deposits, and refunds handled?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    We maintain 100% transparent pricing with zero surprise charges. Security deposits (for two-wheeler rentals) are refundable and credited directly back to your UPI or bank account within 2 hours of vehicle return following a quick inspection. All bookings can be held online.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Can we travel with your vehicles to Gokarna, Murudeshwar, or Jog Falls?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    Yes! All GK WhizWheel rental bikes and cabs have full Karnataka permits to travel anywhere along the coastal circuit including Murudeshwar (27 km), Gokarna (48 km), Kumta (20 km), Yana Caves, Jog Falls (60 km), and Goa.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </Box>

                {/* =========================================================================
                    9. BOTTOM CTA BANNER (COMPREHENSIVE ALL-SERVICES PORTAL)
                       Highlighting Bikes, Cabs, Homestays, Boating, Scuba, Guides & Vacation Packages
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="cta-heading"
                    sx={{
                        p: { xs: 4, md: 7 },
                        borderRadius: 4.5,
                        background: isDark
                            ? 'radial-gradient(120% 120% at 50% 10%, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.98) 100%)'
                            : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 60%, #F0FDF4 100%)',
                        border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #FDE68A',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4,
                        boxShadow: isDark ? '0 25px 60px rgba(0, 0, 0, 0.6)' : '0 15px 35px rgba(245, 158, 11, 0.1)',
                    }}
                >
                    {/* Top Pill Badge */}
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.8,
                            px: 2.2,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: isDark ? '#FBBF24' : '#B45309',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            mb: 2.5,
                        }}
                    >
                        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                        All-In-One Coastal Karavali Travel Hub
                    </Box>

                    <Typography
                        id="cta-heading"
                        variant="h3"
                        component="h2"
                        sx={{
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontWeight: 950,
                            mb: 2,
                            textAlign: 'center',
                            maxWidth: 860,
                            mx: 'auto',
                            fontSize: { xs: '1.9rem', sm: '2.5rem', md: '3rem' },
                            letterSpacing: '-0.025em',
                            lineHeight: 1.18,
                        }}
                    >
                        Ready to Explore Honnavar & Along the Coast?
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: isDark ? '#CBD5E1' : '#334155',
                            maxWidth: 720,
                            mx: 'auto',
                            mb: 3.5,
                            lineHeight: 1.7,
                            textAlign: 'center',
                            fontSize: { xs: '0.98rem', md: '1.1rem' },
                        }}
                    >
                        Whether you need a self-drive scooter for beach hopping, a private AC taxi for station transfers, a riverfront homestay, a mangrove boat cruise, Netrani scuba diving, or a custom all-in-one vacation package — our verified local travel desk handles everything with zero hassle.
                    </Typography>

                    {/* Quick Interactive Service Pill Shortcuts */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 1.2,
                            mb: 4,
                            maxWidth: 900,
                        }}
                    >
                        {[
                            { name: '🛵 Bike & Scooter Rentals', href: '/services/bikes', color: '#F59E0B' },
                            { name: '🚖 Coastal Cabs & Transfers', href: '/services/cabs', color: '#0284C7' },
                            { name: '🏡 Homestays & Coastal Rooms', href: '/services/homestays', color: '#10B981' },
                            { name: '🚤 Sharavathi Boating', href: '/services/boating', color: '#059669' },
                            { name: '🤿 Netrani Scuba Diving', href: '/services/scuba', color: '#06B6D4' },
                            { name: '🗺️ Local Travel Guides', href: '/services/guide', color: '#8B5CF6' },
                            { name: '🌴 Custom Vacation Combos', href: '/services/tours', color: '#EC4899' },
                        ].map((srvPill, pIdx) => (
                            <Button
                                key={pIdx}
                                component={Link}
                                href={srvPill.href}
                                size="small"
                                sx={{
                                    py: 0.6,
                                    px: 1.8,
                                    borderRadius: 9999,
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                    color: isDark ? '#F1F5F9' : '#1E293B',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                        borderColor: srvPill.color,
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                        transform: 'translateY(-2px)',
                                    },
                                    '&:focus-visible': {
                                        outline: '3px solid #F59E0B',
                                        outlineOffset: '2px',
                                    },
                                }}
                            >
                                {srvPill.name}
                            </Button>
                        ))}
                    </Box>

                    {/* Direct Contact Highlights */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: { xs: 2, sm: 3.5 },
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                            mb: 4.5,
                            mx: 'auto',
                            maxWidth: '100%',
                            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600 }}>
                                Palya Main Rd & Railway Station, Honnavar 581334
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} />
                            <Typography
                                component="a"
                                href="tel:+918660989586"
                                variant="body2"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                    '&:hover': { color: '#F59E0B' },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
                            >
                                +91 8660989586
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>•</Typography>
                            <Typography
                                component="a"
                                href="tel:09731699125"
                                variant="body2"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                    '&:hover': { color: '#F59E0B' },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
                            >
                                097316 99125
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: isDark ? '#34D399' : '#047857', fontWeight: 800 }}>
                                Open 24 Hours Daily
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                            <Typography
                                component="a"
                                href="mailto:contact@whizwheels.in"
                                variant="body2"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 600,
                                    textDecoration: 'underline',
                                    '&:hover': { color: '#F59E0B' },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
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
                                sx={{
                                    color: isDark ? '#38BDF8' : '#0284C7',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                    '&:hover': { color: '#F59E0B' },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
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
                                sx={{
                                    color: isDark ? '#38BDF8' : '#0284C7',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                    '&:hover': { color: '#F59E0B' },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
                            >
                                Get Directions ↗
                            </Typography>
                        </Box>
                    </Box>

                    {/* Primary Multi-Service CTA Action Buttons */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        alignItems="center"
                        sx={{ mx: 'auto', width: { xs: '100%', sm: 'auto' } }}
                    >
                        <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            component={Link}
                            href="/services/tours"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                py: 1.6,
                                px: 4.5,
                                fontWeight: 800,
                                fontSize: '1rem',
                                borderRadius: 2.5,
                                boxShadow: '0 8px 20px -3px rgba(245, 158, 11, 0.4)',
                                width: { xs: '100%', sm: 'auto' },
                                '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                            }}
                        >
                            Plan Custom Vacation Package
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            component="a"
                            href="#service-offerings"
                            sx={{
                                py: 1.6,
                                px: 3.5,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#94A3B8',
                                fontWeight: 700,
                                borderRadius: 2.5,
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                            }}
                        >
                            Explore All 7 Services ↓
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            component="a"
                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20inquire%20about%20your%20Honnavar%20travel%20services%20(Bikes,%20Cabs,%20Stays,%20Boating,%20Scuba,%20Tours)."
                            target="_blank"
                            rel="noreferrer"
                            startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                            sx={{
                                py: 1.6,
                                px: 3.5,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#94A3B8',
                                fontWeight: 700,
                                borderRadius: 2.5,
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                                '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
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
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#94A3B8',
                                fontWeight: 700,
                                borderRadius: 2.5,
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                            }}
                        >
                            Call 24/7 Desk
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Universal Service Booking & Inquiry Modal */}
            <ServiceBookingModal
                open={serviceModalOpen}
                onClose={() => setServiceModalOpen(false)}
                initialServiceId={serviceModalId}
            />
        </AppLayout>
    );
}

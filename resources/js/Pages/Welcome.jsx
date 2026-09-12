import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import PageHead from '../Components/SEO/PageHead';
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
        "@type": "LocalBusiness",
        "name": "GK WhizWheel - Bike Rental & Travel Services Honnavar",
        "alternateName": ["GK WhizWheels", "G.K. WhizWheel", "Whizwheels Honnavar"],
        "sameAs": ["https://share.google/GoM4iOgiuUIa7ZfwV"],
        "description": "Premier travel and bike rental agency in Honnavar offering well-maintained scooters and bikes from ₹350/day, AC taxi transfers, backwater boating, scuba diving, and coastal homestays.",
        "image": "https://whizwheels.in/images/logo.png",
        "telephone": "+918660989586",
        "email": "contact@whizwheels.in",
        "url": "https://whizwheels.in/",
        "priceRange": "₹350 - ₹5000",
        "openingHours": "Mo-Su 06:00-23:00",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Palya Main Rd, near Honnavar Railway Station",
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
                "opens": "06:00",
                "closes": "23:00"
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

    const welcomeFaqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What documents are required to rent a bike?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'To rent a two-wheeler, you need: (1) An original, valid Indian Driving License for two-wheelers, and (2) One government ID proof (Aadhaar Card, Voter ID, or Passport). Digital KYC can be completed online in advance or in 3 minutes during the vehicle handover.',
                },
            },
            {
                '@type': 'Question',
                name: 'How much is the security deposit and when is it refunded?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We offer zero-deposit options for eligible verified profiles, and nominal deposits (₹500 – ₹1,500 depending on vehicle model) for others. Security deposits are 100% refundable and credited directly back to your UPI or bank account within 2 hours of vehicle return following a quick inspection.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is your cancellation and booking rescheduling policy?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We offer completely flexible cancellation. You can cancel your booking up to 12 hours before scheduled pickup for a full refund. Rescheduling dates or changing pickup times is free of charge, subject to fleet availability.',
                },
            },
            {
                '@type': 'Question',
                name: 'What happens if the bike breaks down or gets a flat tire?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'All GK WhizWheel bikes undergo rigorous mechanical checkups before every rental. In the rare event of a breakdown or puncture anywhere along the coastal circuit, our 24/7 mobile roadside assistance team will provide on-site repair or dispatch an immediate vehicle replacement.',
                },
            },
        ],
    };

    return (
        <AppLayout>
            <PageHead
                title="Bike Rental Honnavar | Boating, Scuba, Tours – GK WhizWheel"
                description="Explore Honnavar & Karavali coast with GK WhizWheel: bike rentals from ₹350/day, cabs, backwater boating, scuba diving, homestays & custom tour packages."
                canonicalUrl="https://whizwheels.in/"
                ogImage="/images/logo.png"
                ogType="website"
                structuredData={[structuredData, welcomeFaqSchema]}
            />

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
                                    Book Your Bike Now →
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
                                        alt="GK WhizWheel Official Logo - Bike Rental and Coastal Tourism Services in Honnavar"
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
                1.5 CONDENSED TRUST BADGES STRIP (Directly Under Hero)
            ========================================================================== */}
            <Box sx={{ maxWidth: '1240px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mb: { xs: 4, md: 6 }, mt: { xs: 2, md: 3 } }}>
                <Box
                    sx={{
                        py: 1.5,
                        px: { xs: 2, md: 3 },
                        borderRadius: 3,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(15, 23, 42, 0.04)',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: { xs: 1.5, md: 2 },
                        alignItems: 'center',
                    }}
                >
                    {[
                        { icon: <VerifiedUserIcon sx={{ color: '#10B981', fontSize: 22 }} />, title: 'Verified Documents', desc: 'Govt. approved legal fleet' },
                        { icon: <ElectricBoltIcon sx={{ color: '#F59E0B', fontSize: 22 }} />, title: 'Instant Confirmation', desc: 'Reserve online in < 60s' },
                        { icon: <AccessTimeIcon sx={{ color: '#38BDF8', fontSize: 22 }} />, title: '24/7 Road Support', desc: 'Breakdown & trip helpline' },
                        { icon: <LocationOnIcon sx={{ color: '#A855F7', fontSize: 22 }} />, title: 'Local Honnavar Team', desc: 'Station & Palya Main Rd' },
                    ].map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {item.icon}
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.2 }}>
                                    {item.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.74rem', display: 'block', lineHeight: 1.2 }}>
                                    {item.desc}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
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
                                        alt={`${srv.title} in Honnavar - GK WhizWheel`}
                                        loading="lazy"
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
                                            alt="Custom Karavali and Honnavar sightseeing tour packages by GK WhizWheel"
                                            loading="lazy"
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
                    4. CONDENSED 4-STEP BOOKING ROADMAP (Horizontal Strip)
                ========================================================================== */}
                <Box component="section" id="how-it-works" aria-labelledby="process-title" sx={{ mb: 8 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography
                            id="process-title"
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 900,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                letterSpacing: '-0.02em',
                                mb: 0.5,
                            }}
                        >
                            How Booking Works
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B' }}>
                            Four simple steps to your rental bike or coastal tour in Honnavar
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {[
                            {
                                icon: <ExploreIcon sx={{ color: '#F59E0B', fontSize: 22 }} />,
                                title: 'Choose Fleet & Dates',
                                desc: 'Pick your bike, cab, or tour package and select travel dates.',
                            },
                            {
                                icon: <SecurityIcon sx={{ color: '#0284C7', fontSize: 22 }} />,
                                title: 'Instant Online Hold',
                                desc: 'Lock in with transparent daily tariffs and zero hidden fees.',
                            },
                            {
                                icon: <LocationOnIcon sx={{ color: '#10B981', fontSize: 22 }} />,
                                title: 'Station or Hub Handover',
                                desc: 'Rapid 3-min pickup at Honnavar Station or Palya Main Rd.',
                            },
                            {
                                icon: <PhoneIcon sx={{ color: '#8B5CF6', fontSize: 22 }} />,
                                title: 'Ride & Prompt Return',
                                desc: 'Enjoy 24/7 roadside helpline and swift deposit refund upon return.',
                            },
                        ].map((step, sIdx) => (
                            <Grid key={sIdx} size={{ xs: 12, sm: 6, md: 3 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        height: '100%',
                                        borderRadius: 3,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ p: 0.9, borderRadius: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {step.icon}
                                        </Box>
                                        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: '0.92rem' }}>
                                            {step.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        {step.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    7. CUSTOMER REVIEWS & EXPERIENCES (What Our Riders Say)
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
                            <FormatQuoteIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                            Customer Experiences
                        </Box>
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            What Our Riders Say
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155', maxWidth: 640, mx: 'auto' }}>
                            Real feedback from road-trippers and explorers who chose GK WhizWheels for their Karnataka coastal journey.
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
                    8. CONDENSED HONNAVAR HUBS (2-Card Compact Row)
                ========================================================================== */}
                <Box id="hubs" sx={{ mb: 8 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 0.5 }}>
                            Honnavar Pickup & Return Hubs
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B' }}>
                            Two convenient locations for rapid bike pickup and returns
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                name: 'Palya Main Rd Hub (Head Office)',
                                address: 'Palya Main Rd, Honnavar, Karnataka 581334',
                                hours: 'Open 24 Hours Daily',
                                mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334',
                            },
                            {
                                name: 'Railway Station Hub',
                                address: 'Station Road (Platform 1 Exit), Honnavar, Karnataka 581334',
                                hours: 'Open 24 Hours Daily (Train Meet & Greet)',
                                mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=Honnavar+Railway+Station,+Karnataka',
                            },
                        ].map((hub, hIdx) => (
                            <Grid size={{ xs: 12, md: 6 }} key={hIdx}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        borderRadius: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                    }}
                                >
                                    <Box>
                                        <Typography variant="h6" component="h3" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, mb: 1 }}>
                                            {hub.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                            <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                                                {hub.address}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTimeIcon sx={{ color: '#10B981', fontSize: 18, flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', fontWeight: 600 }}>
                                                {hub.hours}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Button
                                        variant="outlined"
                                        component="a"
                                        href={hub.mapUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        startIcon={<DirectionsIcon />}
                                        sx={{
                                            alignSelf: 'flex-start',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                        }}
                                    >
                                        Get Directions
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    FAQ SECTION (Trimmed to 4 Essential Booking Questions)
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
                            Essential answers to help you book your rental bike in Honnavar with total peace of mind.
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
                                    What documents are required to rent a bike?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    To rent a two-wheeler, you need: (1) An original, valid Indian Driving License for two-wheelers, and (2) One government ID proof (Aadhaar Card, Voter ID, or Passport). Digital KYC can be completed online in advance or in 3 minutes during the vehicle handover.
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
                                    How much is the security deposit and when is it refunded?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    We offer zero-deposit options for eligible verified profiles, and nominal deposits (₹500 – ₹1,500 depending on vehicle model) for others. Security deposits are 100% refundable and credited directly back to your UPI or bank account within 2 hours of vehicle return following a quick inspection.
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
                                    What is your cancellation and booking rescheduling policy?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    We offer completely flexible cancellation. You can cancel your booking up to 12 hours before scheduled pickup for a full refund. Rescheduling dates or changing pickup times is free of charge, subject to fleet availability.
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
                                    What happens if the bike breaks down or gets a flat tire?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    All GK WhizWheel bikes undergo rigorous mechanical checkups before every rental. In the rare event of a breakdown or puncture anywhere along the coastal circuit, our 24/7 mobile roadside assistance team will provide on-site repair or dispatch an immediate vehicle replacement.
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

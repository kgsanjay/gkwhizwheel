import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@inertiajs/react';
import PageHead from '../Components/SEO/PageHead';
import AppLayout from '../Layouts/AppLayout';
import BoatingBookingModal from '../Components/BookingModals/BoatingBookingModal';
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
    Breadcrumbs,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import WaterIcon from '@mui/icons-material/Water';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ShieldIcon from '@mui/icons-material/Shield';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupsIcon from '@mui/icons-material/Groups';
import SecurityIcon from '@mui/icons-material/Security';
import ExploreIcon from '@mui/icons-material/Explore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import VideocamIcon from '@mui/icons-material/Videocam';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Distance matrix from Honnavar Hubs
const SIGHTSEEING_DISTANCES = [
    { spot: 'Sharavathi Main Boating Jetty (Gundbala / Town)', dist: '1.5 km', time: '5 Mins', note: 'Prime boarding point with parking and waiting lounge' },
    { spot: 'Honnavar Railway Station', dist: '2.8 km', time: '7 Mins', note: 'Direct station cab or rental bike delivery right to jetty' },
    { spot: 'Mavinkurve Suspension / Wooden Bridge', dist: '3.5 km', time: 'By Water: 12 Mins', note: 'Stunning river crossing photo point' },
    { spot: 'Kasarkod Eco Beach & Boardwalk', dist: '4.5 km', time: '10 Mins', note: 'Blue Flag beach adjacent to river mouth estuary' },
    { spot: 'Apsarakonda Waterfalls & Cliff View', dist: '7.0 km', time: '15 Mins', note: 'Freshwater cascade overlooking Arabian Sea' },
    { spot: 'Historic Mirjan Fort', dist: '21 km', time: '25 Mins', note: '16th-century fortress on river Aghanashini basin' },
    { spot: 'Murudeshwar Shiva Temple & Beach', dist: '27 km', time: '35 Mins', note: 'Combined day-tour: Boating + Murudeshwar cab' },
    { spot: 'Jog Falls (Gersoppa)', dist: '60 km', time: '1 Hr 15 Mins', note: 'Sharavathi river source in Western Ghats' },
];

const BOATING_FAQS = [
    {
        q: 'What is the best time for pre-wedding and photography shoots on the boat?',
        a: 'The golden hour sunset slot (4:15 PM – 6:30 PM) is our most sought-after window for pre-wedding shoots. The low-angle sunlight over the Sharavathi sea confluence produces warm, magical portraits. Early morning (7:00 AM – 9:00 AM) is also fantastic for mist over the river and peaceful, quiet reflections.',
    },
    {
        q: 'Are drones and video cameras allowed during boating in Honnavar?',
        a: 'Yes! Drones and video gear are permitted for personal, creative, and pre-wedding shoots. Our captains are experienced in holding the boat steady in calm backwaters to facilitate safe drone take-off and landing from the deck.',
    },
    {
        q: 'Can the couple take off lifejackets during photoshoot poses?',
        a: 'Under maritime safety rules, lifejackets are mandatory while the boat is cruising. However, during our private shoot charters, once the captain halts the boat in tranquil, placid backwater bays, the couple may remove lifejackets momentarily for portrait shots under supervision.',
    },
    {
        q: 'Is Sharavathi backwater boating safe for infants and senior citizens?',
        a: 'Yes! The Sharavathi backwater channels are remarkably calm, tranquil, and shielded from rough ocean waves. The boats are motorized, covered with sun canopies, and equipped with comfortable seating and certified life jackets.',
    },
    {
        q: 'Where is the boat boarding jetty located?',
        a: 'The primary boarding jetty is located just 5 minutes from Honnavar town center along the Sharavathi riverbank. Exact Google Maps pin coordinates and captain contact details are shared immediately upon booking.',
    },
];

const boatingFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BOATING_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
        },
    })),
};

const boatingTripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: 'Sharavathi Backwater Boating & Pre-Wedding Shoots',
    description: 'Experience world-class Sharavathi backwater boating, mangrove safaris, sunset cruises, and pre-wedding photoshoot boat charters in Honnavar.',
    touristType: 'Nature & Leisure Traveler',
    offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'INR',
        lowPrice: '600',
        highPrice: '4000',
        offerCount: '6',
        price: '600',
    },
    provider: {
        '@type': 'LocalBusiness',
        name: 'GK WhizWheel',
        telephone: '+918660989586',
        url: 'https://whizwheels.in',
    },
};

export default function BoatingPage({ availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'regular', 'shoots'
    const [selectedShootModal, setSelectedShootModal] = useState(null);

    // Filter bar state
    const [selectedSlot, setSelectedSlot] = useState('Sunset Golden Hour (4:45 PM)');
    const [passengerCount, setPassengerCount] = useState('2 - 4 Persons');

    // UI Color tokens
    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155';
    const mutedTextColor = isDark ? '#94A3B8' : '#64748B';
    const cardBgColor = isDark ? '#111827' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

    return (
        <AppLayout>
            <PageHead
                title="Sharavathi Backwater Boating & Mangrove Cruises in Honnavar | GK WhizWheel"
                description="Experience Sharavathi backwater boating, mangrove safaris & sunset cruises in Honnavar from ₹600. Govt-certified boat captains, life jackets & fast booking."
                canonicalUrl="https://whizwheels.in/services/boating"
                ogImage="/images/services/boating.jpg"
                ogType="website"
                structuredData={[boatingTripSchema, boatingFaqSchema]}
            />

            <Box component="main" id="main-content" sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    1. MODERN 2-COLUMN HERO SECTION
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="boating-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E293B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 50%, #F8FAFC 100%)',
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
                            background: 'radial-gradient(circle, rgba(5, 150, 105, 0.22) 0%, transparent 70%)',
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
                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />

                    <Box sx={{ maxWidth: '1380px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
                            {/* Left Column: Headline, Narrative & Trust Badges */}
                            <Grid size={{ xs: 12, lg: 6.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                                    <Breadcrumbs aria-label="Breadcrumb navigation" sx={{ '& .MuiBreadcrumbs-separator': { color: secondaryTextColor } }}>
                                        <Typography
                                            component={Link}
                                            href="/"
                                            variant="caption"
                                            sx={{
                                                color: secondaryTextColor,
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                '&:hover': { color: '#059669' },
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
                                                '&:hover': { color: '#059669' },
                                            }}
                                        >
                                            Services
                                        </Typography>
                                        <Typography variant="caption" aria-current="page" sx={{ color: '#059669', fontWeight: 800 }}>
                                            Sharavathi Boating & Shoots
                                        </Typography>
                                    </Breadcrumbs>

                                    <Chip
                                        icon={<StarIcon aria-hidden="true" sx={{ fontSize: '0.9rem !important', color: '#F59E0B' }} />}
                                        label="5.0 ★ Google Rated (450+ Reviews)"
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

                                <Typography
                                    id="boating-hero-heading"
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
                                    Honnavar Backwater Boating in{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(90deg, #059669 0%, #10B981 50%, #F59E0B 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        Sharavathi
                                    </Box>
                                </Typography>

                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5', px: 1.8, py: 0.6, borderRadius: 2, border: '1px solid rgba(5, 150, 105, 0.3)', mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 900, fontSize: '0.85rem' }}>
                                        Special Offer: ₹1,500 <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontWeight: 600 }}>₹1,600</span> • 1 to 1.5 Hour Scenic Ride 🛶
                                    </Typography>
                                </Box>

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
                                    A scenic boat ride through the famous Sharavathi backwaters and mangrove forests. Glide through lush green mangrove tunnels, serene sunset estuary views, and calm relaxing waters in Honnavar. We also provide dedicated boat services for <strong>pre-wedding shoots and creative photography</strong>.
                                </Typography>

                                {/* 4 Modern Trust Features - Clean Frosted Badges */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5, maxWidth: 640 }}>
                                    {[
                                        { title: 'Lush Green Mangrove Tunnels', desc: 'Glide through pristine, untouched coastal mangrove passages', icon: <DirectionsBoatIcon sx={{ color: '#059669', fontSize: 18 }} /> },
                                        { title: 'Perfect for Sunset Views 🌅', desc: 'Estuary confluence where the Sharavathi River meets Arabian Sea', icon: <WbSunnyIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
                                        { title: 'Calm & Relaxing Ride', desc: 'Tranquil water journey safe and soothing for all family members', icon: <WaterIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
                                        { title: 'Great for Photography 📸', desc: 'Mirror reflections, birdwatching & pre-wedding shoot staging', icon: <CameraAltIcon sx={{ color: '#E11D48', fontSize: 18 }} /> },
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
                                                    '&:hover': { borderColor: '#059669' },
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
                                        href="#cruises-catalog"
                                        variant="contained"
                                        size="medium"
                                        endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                        sx={{
                                            fontWeight: 900,
                                            px: 3,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.92rem',
                                            bgcolor: '#059669',
                                            color: '#FFFFFF',
                                            boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.5)',
                                            '&:hover': { bgcolor: '#047857' },
                                        }}
                                    >
                                        Book Boating (₹1,500) ↓
                                    </Button>

                                    <Button
                                        component="a"
                                        href="#pre-wedding-shoots"
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<CameraAltIcon sx={{ color: '#E11D48' }} />}
                                        sx={{
                                            fontWeight: 750,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': {
                                                borderColor: '#E11D48',
                                                bgcolor: 'rgba(225, 29, 72, 0.08)',
                                            },
                                        }}
                                    >
                                        Pre-Wedding Shoots
                                    </Button>

                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20Honnavar%20Backwater%20Boating%20(%E2%82%B91%2C500)%20ride."
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
                                        WhatsApp (₹1,500)
                                    </Button>
                                </Stack>
                            </Grid>

                            {/* Right Column: Modern High-End Showcase Card featuring user's exact flyer */}
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
                                            <LocationOnIcon sx={{ fontSize: 18, color: '#059669' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 850, letterSpacing: '0.06em', color: primaryTextColor, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                                Honnavar Backwaters
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label="Special Offer: ₹1,500"
                                            size="small"
                                            sx={{
                                                bgcolor: '#059669',
                                                color: '#FFFFFF',
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                height: 24,
                                            }}
                                        />
                                    </Box>

                                    {/* Poster Image Showcase */}
                                    <Box sx={{ position: 'relative', height: { xs: 260, sm: 300 }, overflow: 'hidden' }}>
                                        <Box
                                            component="img"
                                            src="/images/services/honnavar-backwater-boating.jpg"
                                            alt="Honnavar Backwater Boating - Explore Sharavathi Mangrove Forests"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center',
                                                display: 'block',
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.75) 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                p: 2,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label="Explore Sharavathi Mangroves"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(5, 150, 105, 0.6)',
                                                    }}
                                                />
                                                <Chip
                                                    label="1 - 1.5 Hour Ride"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#F59E0B',
                                                        color: '#1E293B',
                                                        fontWeight: 900,
                                                        fontSize: '0.72rem',
                                                    }}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#6EE7B7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', display: 'block' }}>
                                                    SCENIC BOAT SAFARI & PHOTOGRAPHY
                                                </Typography>
                                                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.25, mt: 0.3 }}>
                                                    Honnavar Backwater Boating
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Card Content & Features directly matching WhatsApp Catalog Flyer */}
                                    <Box sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                            <Typography variant="h4" component="span" sx={{ fontWeight: 950, color: '#059669', lineHeight: 1 }}>
                                                ₹1,500.00
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                                                ₹1,600.00
                                            </Typography>
                                            <Chip
                                                label="Save ₹100"
                                                size="small"
                                                sx={{
                                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                                                    color: '#059669',
                                                    fontWeight: 900,
                                                    height: 22,
                                                    fontSize: '0.72rem',
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.85rem', lineHeight: 1.45, mb: 1.8 }}>
                                            A scenic boat ride through the famous Sharavathi backwaters and mangrove forests. 🛶
                                        </Typography>

                                        {/* 4 Points from user flyer */}
                                        <Stack spacing={0.9} sx={{ mb: 2 }}>
                                            {[
                                                { text: 'Lush Green Mangrove Tunnels', icon: '🌿' },
                                                { text: 'Perfect for Sunset Views 🌅', icon: '🌅' },
                                                { text: 'Calm & Relaxing Ride', icon: '⛵' },
                                                { text: 'Great for Photography 📸', icon: '📸' },
                                            ].map((feat, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                    <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{feat.icon}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 750, color: primaryTextColor, fontSize: '0.82rem' }}>
                                                        {feat.text}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 2 }}>
                                            <AccessTimeIcon sx={{ fontSize: 16, color: '#059669' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                Duration: 1 to 1.5 Hour Ride
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1.5}>
                                            <Button
                                                component="a"
                                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20the%20Honnavar%20Backwater%20Boating%20(%E2%82%B91%2C500)%20ride."
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
                                                    fontSize: '0.86rem',
                                                    '&:hover': { bgcolor: '#15803D' },
                                                }}
                                            >
                                                Message Business
                                            </Button>
                                            <Button
                                                onClick={() => setModalOpen(true)}
                                                variant="outlined"
                                                sx={{
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                    color: primaryTextColor,
                                                    fontWeight: 800,
                                                    py: 1.1,
                                                    px: 2,
                                                    borderRadius: 2.2,
                                                    fontSize: '0.84rem',
                                                    whiteSpace: 'nowrap',
                                                    '&:hover': { borderColor: '#059669', bgcolor: 'rgba(5, 150, 105, 0.06)' },
                                                }}
                                            >
                                                Book Online
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. DEDICATED PRE-WEDDING & PHOTOSHOOT BOAT SERVICE CARD
                ========================================================================== */}
                <Box id="pre-wedding-shoots" sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 5, md: 7 } }}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
                            border: '1.5px solid rgba(225, 29, 72, 0.35)',
                            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 12px 36px rgba(225, 29, 72, 0.08)',
                            overflow: 'hidden',
                            p: { xs: 3, sm: 4, md: 5 },
                        }}
                    >
                        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<CameraAltIcon sx={{ color: '#E11D48 !important', fontSize: 16 }} />}
                                        label="PRE-WEDDING & CREATIVE SHOOTS"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontWeight: 900, fontSize: '0.74rem' }}
                                    />
                                    <Chip
                                        label="Boat Service for Shoots"
                                        size="small"
                                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: primaryTextColor, fontWeight: 750, fontSize: '0.72rem' }}
                                    />
                                </Box>

                                <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1.5, fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.35rem' }, lineHeight: 1.2 }}>
                                    We Provide Boating Service for Pre-Wedding & Other Shoots
                                </Typography>

                                <Typography variant="body1" sx={{ color: secondaryTextColor, lineHeight: 1.65, mb: 3, fontSize: { xs: '0.92rem', sm: '1rem' } }}>
                                    Looking for an enchanting, serene natural backdrop for your pre-wedding shoot, couple portraits, music video, or creative photography? We offer customized private boat charters in Honnavar with patient, photography-aware local captains who know the calmest mangrove tunnels, slow-drift reflection angles, and glowing sunset estuary locations.
                                </Typography>

                                {/* 4 Key Features */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5 }}>
                                    {[
                                        { title: 'Golden Hour Timing', desc: 'Custom sunrise mist or 4:30 PM sunset estuary lighting', icon: '🌅' },
                                        { title: 'Slow-Drift & Reflections', desc: 'Engine-off stillness for mirror reflections & clean audio', icon: '🛶' },
                                        { title: 'Safe Portrait Halts', desc: 'Temporary lifejacket removal permitted for still poses while docked/anchored', icon: '📸' },
                                        { title: 'Crew & Drone Friendly', desc: 'Comfortable deck space for couple, photographer, assistant & drone gear', icon: '🚁' },
                                    ].map((feat, fIdx) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={fIdx}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.6,
                                                    borderRadius: 2.5,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFF1F2',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #FFE4E6',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                                                    <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{feat.icon}</Typography>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.84rem' }}>
                                                            {feat.title}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.74rem', display: 'block', mt: 0.3, lineHeight: 1.3 }}>
                                                            {feat.desc}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Action Buttons */}
                                <Stack direction="row" spacing={1.8} flexWrap="wrap" sx={{ gap: 1.5 }}>
                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20inquire%20about%20booking%20a%20boat%20for%20a%20Pre-Wedding%20Photoshoot%20in%20Honnavar."
                                        target="_blank"
                                        rel="noreferrer"
                                        variant="contained"
                                        startIcon={<WhatsAppIcon />}
                                        sx={{
                                            bgcolor: '#E11D48',
                                            color: '#FFFFFF',
                                            fontWeight: 850,
                                            px: 3,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.9rem',
                                            boxShadow: '0 8px 20px -4px rgba(225, 29, 72, 0.4)',
                                            '&:hover': { bgcolor: '#BE123C' },
                                        }}
                                    >
                                        Inquire for Pre-Wedding Shoot
                                    </Button>
                                    <Button
                                        onClick={() => setModalOpen(true)}
                                        variant="outlined"
                                        sx={{
                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                            color: primaryTextColor,
                                            fontWeight: 750,
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': { borderColor: '#E11D48', bgcolor: 'rgba(225, 29, 72, 0.06)' },
                                        }}
                                    >
                                        Book Shoot Online
                                    </Button>
                                </Stack>
                            </Grid>

                            {/* Right Image Feature */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box
                                    sx={{
                                        borderRadius: 3.5,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: '0 16px 36px -10px rgba(0,0,0,0.3)',
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
                                        alt="Pre Wedding Shoot Boat in Honnavar Mangroves"
                                        loading="lazy"
                                        sx={{ width: '100%', height: { xs: 260, md: 360 }, objectFit: 'cover', display: 'block' }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.85) 100%)',
                                            p: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-end',
                                        }}
                                    >
                                        <Chip
                                            label="Custom Shoot Hours • Slow-Drift Pilots"
                                            size="small"
                                            sx={{ bgcolor: '#E11D48', color: '#FFFFFF', fontWeight: 850, alignSelf: 'flex-start', mb: 1 }}
                                        />
                                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, lineHeight: 1.3 }}>
                                            Romantic Sunset & Mangrove Shoot Charters
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#FDA4AF', mt: 0.5 }}>
                                            Couple + Photography Team • Direct Jetty Coordination
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Card>
                </Box>

                {/* =========================================================================
                    3. HONNAVAR BACKWATER BOATING PACKAGE SHOWCASE
                ========================================================================== */}
                <Box id="boating-package" sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ mb: 4 }}>
                        <Chip label="SHARAVATHI BACKWATER BOATING" size="small" sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', fontWeight: 850, mb: 1 }} />
                        <Typography variant="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.6rem' } }}>
                            Honnavar Backwater Boating
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor, mt: 0.5 }}>
                            We exclusively provide boating service in the scenic Sharavathi backwaters & mangrove forests of Honnavar.
                        </Typography>
                    </Box>

                    {/* Dedicated Single Package Showcase Card */}
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                            border: `1px solid ${cardBorderColor}`,
                            overflow: 'hidden',
                            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 12px 36px -8px rgba(5, 150, 105, 0.12)',
                            mb: 2,
                        }}
                    >
                        <Grid container>
                            {/* Left: Flyer Poster Visual */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        height: { xs: 300, sm: 380, md: '100%' },
                                        minHeight: { md: 440 },
                                        bgcolor: '#0F172A',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src="/images/services/honnavar-backwater-boating.jpg"
                                        alt="Honnavar Backwater Boating - Sharavathi River"
                                        loading="lazy"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            left: 16,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            zIndex: 2,
                                        }}
                                    >
                                        <Chip
                                            label="Special Offer ₹1,500"
                                            sx={{
                                                bgcolor: '#059669',
                                                color: '#FFFFFF',
                                                fontWeight: 900,
                                                fontSize: '0.82rem',
                                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
                                            }}
                                        />
                                        <Chip
                                            label="1 to 1.5 Hour Ride"
                                            sx={{
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Right: Package Specifications & Direct Booking */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <CardContent sx={{ p: { xs: 3, sm: 4, md: 4.5 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                            <Chip
                                                size="small"
                                                icon={<WaterIcon sx={{ fontSize: 14 }} />}
                                                label="Sharavathi Backwaters"
                                                sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', fontWeight: 800, fontSize: '0.75rem' }}
                                            />
                                            <Chip
                                                size="small"
                                                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                                                label="100% Life Jackets Included"
                                                sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: isDark ? '#34D399' : '#047857', fontWeight: 800, fontSize: '0.72rem' }}
                                            />
                                        </Box>

                                        <Typography variant="h4" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1 }}>
                                            Honnavar Backwater Boating
                                        </Typography>

                                        <Typography variant="body1" sx={{ color: secondaryTextColor, mb: 2.5, lineHeight: 1.6 }}>
                                            Explore the calm, emerald waters of the Sharavathi river and its world-famous mangrove forest tunnels. A scenic 1 to 1.5-hour peaceful boat safari operated by certified local captains.
                                        </Typography>

                                        {/* Pricing Block */}
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                mb: 3,
                                                borderRadius: 2.5,
                                                bgcolor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#F0FDF4',
                                                border: '1px solid rgba(5, 150, 105, 0.25)',
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                gap: 1.5,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <Typography variant="h3" component="span" sx={{ fontWeight: 950, color: '#059669', lineHeight: 1 }}>
                                                ₹1,500.00
                                            </Typography>
                                            <Typography variant="body1" sx={{ textDecoration: 'line-through', color: mutedTextColor, fontWeight: 700 }}>
                                                ₹1,600.00
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label="Save ₹100 Special Offer"
                                                sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
                                            />
                                            <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700, ml: 'auto' }}>
                                                Per Ride (1 to 1.5 Hours)
                                            </Typography>
                                        </Paper>

                                        {/* 4 Key Features From Flyer */}
                                        <Typography variant="caption" sx={{ fontWeight: 850, color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                                            What’s Included in This Ride:
                                        </Typography>

                                        <Grid container spacing={1.5} sx={{ mb: 3 }}>
                                            {[
                                                { icon: '🌿', title: 'Lush Green Mangrove Tunnels', desc: 'Cruise deep through serene mangrove waterways' },
                                                { icon: '🌅', title: 'Perfect for Sunset Views', desc: 'Breathtaking golden reflections over the estuary' },
                                                { icon: '🌊', title: 'Calm & Relaxing Ride', desc: 'Smooth, peaceful sailing safe for all age groups' },
                                                { icon: '📸', title: 'Great for Photography', desc: 'Captivating angles for cameras, reels & portraits' },
                                            ].map((feat, fIdx) => (
                                                <Grid key={fIdx} size={{ xs: 12, sm: 6 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: '1.4rem' }}>{feat.icon}</Typography>
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.85rem' }}>
                                                                {feat.title}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.74rem' }}>
                                                                {feat.desc}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>

                                    {/* Action Buttons */}
                                    <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 7 }}>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    size="large"
                                                    onClick={() => setModalOpen(true)}
                                                    sx={{
                                                        bgcolor: '#059669',
                                                        color: '#FFFFFF',
                                                        fontWeight: 850,
                                                        py: 1.4,
                                                        borderRadius: 2.5,
                                                        fontSize: '0.98rem',
                                                        boxShadow: '0 8px 24px -4px rgba(5, 150, 105, 0.4)',
                                                        '&:hover': { bgcolor: '#047857' },
                                                    }}
                                                >
                                                    Book Boating Now (₹1,500) →
                                                </Button>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 5 }}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    size="large"
                                                    component="a"
                                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20Honnavar%20Backwater%20Boating%20(%E2%82%B91%2C500)%20ride."
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                                    sx={{
                                                        borderColor: '#25D366',
                                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                                        fontWeight: 800,
                                                        py: 1.4,
                                                        borderRadius: 2.5,
                                                        '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)', borderColor: '#25D366' },
                                                    }}
                                                >
                                                    WhatsApp Book
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Grid>
                        </Grid>
                    </Card>
                </Box>

                {/* =========================================================================
                    4. HOW HONNAVAR BOATING & SHOOT BOOKING WORKS (4-Step Pipeline)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Chip
                            label="EASY DOCKING WORKFLOW"
                            sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', fontWeight: 850, mb: 1.5 }}
                        />
                        <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1.5 }}>
                            How Boating & Shoot Booking Works
                        </Typography>
                        <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto' }}>
                            Zero waiting at the jetty. Pre-fixed departures, lifejacket orientation, and smooth cruising.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                step: '01',
                                title: 'Book Backwater Boating or Shoot',
                                desc: 'Book the Honnavar Backwater Boating ride (₹1,500) or request a custom boat charter for pre-wedding shoots.',
                                color: '#059669',
                                badge: '⚡ Slot Booking',
                            },
                            {
                                step: '02',
                                title: 'Direct Jetty GPS Pin',
                                desc: 'Receive instant WhatsApp confirmation with exact Google Maps pin to the boarding jetty and captain phone number.',
                                color: '#0284C7',
                                badge: '📍 Live GPS Coordination',
                            },
                            {
                                step: '03',
                                title: 'Lifejacket Safety Briefing',
                                desc: 'Equip certified lifejackets. Photography crews receive special instruction for safe equipment balancing.',
                                color: '#E11D48',
                                badge: '🦺 100% Safety Verified',
                            },
                            {
                                step: '04',
                                title: 'Cruise & Capture Memories',
                                desc: 'Glide into secluded mangrove tunnels and sea confluence. Enjoy golden reflections with unhurried photo stops.',
                                color: '#F59E0B',
                                badge: '📸 Unhurried Photo Halts',
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
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '50%',
                                                bgcolor: `${item.color}15`,
                                                color: item.color,
                                                fontWeight: 950,
                                                fontSize: '1.2rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: `2px solid ${item.color}`,
                                            }}
                                        >
                                            {item.step}
                                        </Box>
                                        <Chip label={item.badge} size="small" sx={{ bgcolor: `${item.color}15`, color: item.color, fontWeight: 800, fontSize: '0.68rem' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 850, color: primaryTextColor, mb: 1 }}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.6 }}>
                                        {item.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    5. DISTANCES & BOARDING JETTY ACCESS GUIDE
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Chip
                            label="BOARDING JETTY & SURROUNDING ATTRACTIONS"
                            sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', fontWeight: 850, mb: 1.5 }}
                        />
                        <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor }}>
                            Distances from Honnavar Boating Jetties
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto', mt: 1 }}>
                            Convenient connections between railway station, homestays, and boating points in Honnavar.
                        </Typography>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3.5,
                            overflow: 'hidden',
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                            border: `1px solid ${cardBorderColor}`,
                        }}
                    >
                        <Grid container>
                            {SIGHTSEEING_DISTANCES.map((item, dIdx) => (
                                <Grid
                                    key={dIdx}
                                    size={{ xs: 12, sm: 6, md: 3 }}
                                    sx={{
                                        p: 2.5,
                                        borderRight: { sm: (dIdx + 1) % 2 !== 0 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0') : 'none', md: (dIdx + 1) % 4 !== 0 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0') : 'none' },
                                        borderBottom: dIdx < SIGHTSEEING_DISTANCES.length - 4 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0') : { xs: '1px solid #E2E8F0', md: 'none' },
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.88rem' }}>
                                        {item.spot}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Chip
                                            size="small"
                                            label={item.dist}
                                            sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}
                                        />
                                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                            {item.time}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', mt: 0.8 }}>
                                        {item.note}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Box>

                {/* =========================================================================
                    6. INCLUSIONS & SAFETY POLICIES CHECKLIST
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F0FDF4',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        What's Included in Every Boat Booking
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {[
                                        'Certified life jackets for every passenger (infant, child & adult sizes)',
                                        'Experienced native boat captain with decades of Sharavathi waterway mastery',
                                        'Entry permits & jetty boarding management included with zero waiting',
                                        'Slow-speed photography halts at mangrove tunnels & sea confluence',
                                        'For Shoots: Engine-off drifting allowed for clean cinematic dialogue & shots',
                                        'Safety kit, first aid box, and emergency phone link on board',
                                    ].map((inc, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                                {inc}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FEF2F2',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <SecurityIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        Guidelines & Safety Norms
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {[
                                        'Wearing lifejackets is mandatory while boat is in motion as per maritime regulations',
                                        'During photoshoots, lifejackets may be taken off briefly only when boat is stationary',
                                        'Please arrive 10 minutes prior to scheduled slot for peaceful boarding',
                                        'Strict no-littering policy inside mangrove bio-reserves (keep plastic onboard)',
                                        'Weather safety: In case of extreme rain/swells, free rescheduling is guaranteed',
                                    ].map((exc, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                                {exc}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* =========================================================================
                    7. HONNAVAR BOATING FAQS (Detailed Accordion)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, mb: 1 }}>
                        Sharavathi Boating & Photoshoots — FAQs
                    </Typography>
                    <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 3.5 }}>
                        Answers regarding timings, shoot arrangements, drone safety, and family suitability.
                    </Typography>

                    <Stack spacing={1.5}>
                        {BOATING_FAQS.map((faq, fIdx) => (
                            <Accordion
                                key={fIdx}
                                defaultExpanded={fIdx === 0}
                                sx={{
                                    bgcolor: cardBgColor,
                                    border: `1px solid ${cardBorderColor}`,
                                    borderRadius: '14px !important',
                                    '&:before': { display: 'none' },
                                    boxShadow: 'none',
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#059669' }} />}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 850, color: primaryTextColor }}>
                                        {faq.q}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.75 }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Box>

                {/* =========================================================================
                    8. BOTTOM CALLOUT BANNER
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: 8 }}>
                    <Paper
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#F0FDF4',
                            border: '1.5px solid rgba(5, 150, 105, 0.4)',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <Box>
                            <Chip label="24x7 HONNAVAR BOATING DESK" size="small" sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 900, mb: 1.5 }} />
                            <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, mb: 1, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' } }}>
                                Ready for a Backwater Cruise or Pre-Wedding Shoot?
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 650 }}>
                                Check live boat departure timings, reserve private sunset charters, or lock in your pre-wedding shoot dates in minutes.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20want%20to%20book%20a%20Boat%20Cruise%20or%20Pre-Wedding%20Shoot%20in%20Honnavar."
                                target="_blank"
                                rel="noreferrer"
                                startIcon={<WhatsAppIcon />}
                                sx={{
                                    bgcolor: '#16A34A',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    px: 3.5,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#15803D' },
                                }}
                            >
                                WhatsApp Boat Desk
                            </Button>
                            <Button
                                variant="outlined"
                                component="a"
                                href="tel:+918660989586"
                                startIcon={<PhoneIcon />}
                                sx={{
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                    color: primaryTextColor,
                                    fontWeight: 750,
                                    px: 3,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Call +91 86609 89586
                            </Button>
                        </Stack>
                    </Paper>
                </Box>

                {/* Dedicated Boating Booking Modal */}
                <BoatingBookingModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    initialSafariId="mangrove_backwater"
                    availableItems={availableItems}
                />
            </Box>
        </AppLayout>
    );
}

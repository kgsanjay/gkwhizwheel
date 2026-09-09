import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import TourBookingModal from '../Components/BookingModals/TourBookingModal';
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
    TextField,
    MenuItem,
    Slider,
    Checkbox,
    FormControlLabel,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import LuggageIcon from '@mui/icons-material/Luggage';
import ExploreIcon from '@mui/icons-material/Explore';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupsIcon from '@mui/icons-material/Groups';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShieldIcon from '@mui/icons-material/Shield';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LandscapeIcon from '@mui/icons-material/Landscape';

// Pre-packaged Curated Tours Catalog
const CURATED_PACKAGES = [
    {
        id: 'coastal-karavali-2d1n',
        title: '2D/1N Coastal Karavali Explorer Circuit',
        subtitle: 'Honnavar Backwaters, Kasarkod Eco Beach, Mirjan Fort & Murudeshwar',
        duration: '2 Days / 1 Night',
        idealFor: 'Weekend Getaway • Couples & Small Families',
        startingPrice: 4999,
        priceUnit: 'per person',
        image: '/images/places/sharavathi_backwaters.jpg',
        badge: 'WEEKEND BESTSELLER',
        badgeColor: '#059669',
        inclusions: [
            '1 Night Handpicked Riverfront Homestay / AC Room',
            'Dedicated Sanitized AC Cab with Chauffeur (or 2-Wheelers)',
            'Sharavathi Mangrove Safari Boating Ticket Included',
            'Authentic Coastal Breakfast & Travel Guidance',
            'Covers Mirjan Fort, Apsarakonda & Murudeshwar Sunset',
        ],
        itinerarySummary: 'Day 1: Honnavar Mangrove Safari + Kasarkod Beach + Apsarakonda | Day 2: Mirjan Fort Walk + Murudeshwar Shiva Temple & Return',
    },
    {
        id: 'complete-coastal-safari-3d2n',
        title: '3D/2N Complete Coastal Karnataka Safari',
        subtitle: 'Honnavar Mangroves + Yana Karst Caves + Vibhooti Falls + Gokarna Beaches',
        duration: '3 Days / 2 Nights',
        idealFor: 'Couples, Families & Nature Enthusiasts',
        startingPrice: 8999,
        priceUnit: 'per person',
        image: '/images/places/gokarna_beaches.jpg',
        badge: 'MOST POPULAR SAFARI',
        badgeColor: '#7C3AED',
        inclusions: [
            '2 Nights Premium Riverfront Homestay / Coastal Resort',
            'Dedicated Chauffeur Driven AC Sedan / Ertiga (All Fuel & Tolls)',
            'All Monument & Forest Permissions (Yana, Mirjan Fort, Apsarakonda)',
            'Sharavathi River Mangrove Boat Safari Ticket',
            'Dedicated Local Storyteller & Heritage Guide on key spots',
            'Daily Traditional Coastal Breakfasts Included',
        ],
        itinerarySummary: 'Day 1: Honnavar Estuary & Backwater Safari | Day 2: Yana Limestone Monoliths + Vibhooti Falls + Mirjan Fort | Day 3: Gokarna Mahabaleshwar Temple & Om Beach',
    },
    {
        id: 'grand-odyssey-4d3n',
        title: '4D/3N Grand Uttara Kannada & Jog Falls Odyssey',
        subtitle: 'Honnavar, Gokarna, Murudeshwar, Yana Monoliths & Roaring Jog Falls',
        duration: '4 Days / 3 Nights',
        idealFor: 'Full Family Vacations • Complete Regional Exploration',
        startingPrice: 12999,
        priceUnit: 'per person',
        image: '/images/places/murudeshwar_temple.jpg',
        badge: 'ALL-INCLUSIVE GRAND CIRCUIT',
        badgeColor: '#D97706',
        inclusions: [
            '3 Nights Handpicked Riverfront & Coastal Stays',
            'Private Dedicated AC Innova Crysta / Ertiga throughout trip',
            'Sharavathi Mangrove Safari + Jog Falls Entry & Viewpoints',
            'Mirjan Fort Historian Walk + Gokarna Vedic Temple Guidance',
            'All Tolls, Parking, Driver Allowance & Fuel Included',
            'Daily Delicious Breakfasts & Refreshments',
        ],
        itinerarySummary: 'Day 1: Honnavar Backwaters | Day 2: Murudeshwar & Netrani options | Day 3: Yana Caves & Vibhooti Cascades | Day 4: Majestic Jog Falls & Gersoppa Valley',
    },
    {
        id: 'adventure-scuba-3d2n',
        title: '3D/2N Adventure & Ocean Special (Scuba + Trekking)',
        subtitle: 'Netrani Island PADI Scuba Dive + Yana Rainforest Trek + Mangrove Cruise',
        duration: '3 Days / 2 Nights',
        idealFor: 'Adventure Seekers • Friends Group • Thrill Travelers',
        startingPrice: 11499,
        priceUnit: 'per person',
        image: '/images/services/scuba.jpg',
        badge: 'ADVENTURE COMBO',
        badgeColor: '#0284C7',
        inclusions: [
            'Netrani Island Discover Scuba Diving with 1-on-1 PADI Instructor',
            'Full Scuba Gear, Speedboat Ride, 4K GoPro Underwater Photos/Videos',
            '2 Nights Coastal Stay + Dedicated Vehicle for Transfers',
            'Guided Western Ghats Rainforest Trek to Yana & Vibhooti Pools',
            'Sharavathi Estuary Sunset Boating Cruise',
            'All Forest & Maritime Clearances Handled',
        ],
        itinerarySummary: 'Day 1: Honnavar Arrival & Mangrove Sunset | Day 2: Netrani Island Scuba Diving & Murudeshwar | Day 3: Yana Karst Rock Monoliths & Return',
    },
];

// Day-by-day Itinerary breakdown for 3D/2N bestseller
const DETAILED_TIMELINE_3D2N = [
    {
        day: 'Day 01',
        title: 'Honnavar Riverfront Welcome, Mangrove Safari & Golden Sunset',
        highlights: [
            '10:30 AM – Morning arrival at Honnavar Railway Station; greeted by dedicated chauffeur.',
            '11:30 AM – Check-in at your serene riverfront homestay on the banks of Sharavathi River. Traditional welcome drink.',
            '01:00 PM – Authentic coastal Karavali lunch recommendation (fresh fish curry or vegetarian Udupi thali).',
            '03:30 PM – Private Sharavathi Backwater Boating Safari through dense mangrove bio-reserves.',
            '05:15 PM – Kasarkod Eco Beach boardwalk & Arabian Sea estuary sunset view.',
            '07:30 PM – Colonel Hill British memorial overlook & relaxed evening dinner.',
        ],
        icon: <DirectionsBoatIcon sx={{ color: '#059669' }} />,
    },
    {
        day: 'Day 02',
        title: 'Colossal Yana Rock Monoliths, Vibhooti Falls & 16th-Century Mirjan Fort',
        highlights: [
            '08:00 AM – Hearty coastal breakfast (hot neer dosa or idli sambar).',
            '09:00 AM – Scenic drive into the dense Sahyadri Western Ghats towards Yana.',
            '10:30 AM – Guided forest trek to Bhairaveshwara & Mohini crystalline limestone karst rock towers and cave temple.',
            '01:00 PM – Cool dip and natural swimming in the crystal-clear stepped pools of Vibhooti Falls.',
            '03:30 PM – Architectural exploration of the moss-covered ramparts and secret escape moats of historic Mirjan Fort.',
            '06:00 PM – Sunset overlook at Apsarakonda hanging waterfall & Pandava cave.',
        ],
        icon: <LandscapeIcon sx={{ color: '#7C3AED' }} />,
    },
    {
        day: 'Day 03',
        title: 'Sacred Gokarna Atmalinga, Om Beach Cliff Walk & Farewell',
        highlights: [
            '07:30 AM – Early departure to Gokarna; visit sacred Sri Mahabaleshwar Temple & holy Koti Teertha tank.',
            '10:30 AM – Scenic coastal drive to Om Beach; relaxing cliff walk connecting to Kudle Beach viewpoints.',
            '01:00 PM – Lunch at iconic beachside cafes overlooking the gentle Arabian Sea waves.',
            '03:00 PM – Local spice, organic cashews, and traditional souvenir shopping in Gokarna temple street.',
            '05:00 PM – Seamless drop-off at Honnavar or Gokarna Railway Station for your return journey.',
        ],
        icon: <AccountBalanceIcon sx={{ color: '#D97706' }} />,
    },
];

// Transit matrix to Honnavar Gateways
const TRANSIT_GATEWAYS = [
    { gateway: 'Honnavar Railway Station (Direct Trains)', dist: '3 km', time: '8 Mins', note: 'Direct Konkan Railway connectivity from Bangalore, Mumbai, Goa & Mangalore' },
    { gateway: 'Goa International Airport (Dabolim / Mopa)', dist: '155 km', time: '3.5 Hours', note: 'Dedicated private AC cab pickup arranged directly from airport arrival' },
    { gateway: 'Mangalore International Airport (IXE)', dist: '165 km', time: '3.5 Hours', note: 'Scenic NH-66 highway drive with sea-view river bridges' },
    { gateway: 'Hubli Airport / Junction', dist: '170 km', time: '3.5 Hours', note: 'Descent through dense Western Ghats and Gersoppa valley' },
    { gateway: 'Bangalore (KSRTC Sleeper / Day Trains)', dist: '440 km', time: 'Overnight (8.5 Hrs)', note: 'Panchaganga Express & daily private sleepers drop right in Honnavar' },
];

// FAQs Data
const TOURS_FAQS = [
    {
        q: 'Can we customize the days, hotel categories, or sights in these tour packages?',
        a: 'Yes, 100%! Use our interactive Custom Package Builder right on this page or tell our travel concierge your preferences. You can adjust durations, swap hotels, add Netrani scuba diving, or include two-wheelers instead of a cab.',
    },
    {
        q: 'What is included in the package price?',
        a: 'All our curated packages include private vehicle transportation (fuel, tolls, driver allowance), comfortable handpicked stays with complimentary breakfast, pre-paid boating safari tickets, monument entries, and verified local guides on key circuits.',
    },
    {
        q: 'How does airport or railway station pickup work?',
        a: 'Your dedicated chauffeur meets you holding a personalized name placard at Honnavar, Gokarna, Kumta, or Murudeshwar railway stations. We also arrange direct AC cab transfers from Goa or Mangalore airports.',
    },
    {
        q: 'Why are lunch and dinner excluded in most packages?',
        a: 'We intentionally keep lunches and dinners flexible so you are never trapped eating generic buffet food at a hotel. Coastal Karnataka has extraordinary local culinary treasures (authentic Karavali seafood, pure veg Udupi thalis, beach shacks)—and your guide/driver will recommend the finest spots according to your taste.',
    },
    {
        q: 'What is the booking and payment policy?',
        a: 'You can reserve any tour package with an advance token of just 20%. The remaining balance is payable comfortably upon your arrival in Honnavar. Cancellations made 48 hours prior to check-in are eligible for a full refund.',
    },
    {
        q: 'Is it suitable for senior citizens and families with children?',
        a: 'Absolutely. All our itineraries are paced comfortably without rushed scheduling. We provide clean, smooth-riding AC vehicles, safe boating with certified lifejackets, and easy walking alternatives for elderly travelers.',
    },
];

export default function ToursPage({ availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [modalOpen, setModalOpen] = useState(false);

    // ==========================================
    // INTERACTIVE CUSTOM PACKAGE BUILDER STATE
    // ==========================================
    const [builderDuration, setBuilderDuration] = useState('3D2N'); // '2D1N', '3D2N', '4D3N', '5D4N'
    const [builderTravelers, setBuilderTravelers] = useState(2);
    const [builderTransport, setBuilderTransport] = useState('cab_sedan'); // 'cab_sedan', 'cab_innova', 'bikes', 'none'
    const [builderStay, setBuilderStay] = useState('riverfront_homestay'); // 'riverfront_homestay', 'luxury_resort', 'budget_guesthouse'
    const [includeBoating, setIncludeBoating] = useState(true);
    const [includeScuba, setIncludeScuba] = useState(false);
    const [includeGuide, setIncludeGuide] = useState(true);
    const [includeSunsetCruise, setIncludeSunsetCruise] = useState(false);
    const [includePhotoshootBoat, setIncludePhotoshootBoat] = useState(false);

    // Color tokens
    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155';
    const mutedTextColor = isDark ? '#94A3B8' : '#64748B';
    const cardBgColor = isDark ? '#111827' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

    // Calculation logic for interactive custom package builder
    const customCalculation = useMemo(() => {
        let days = 3;
        let nights = 2;
        if (builderDuration === '2D1N') { days = 2; nights = 1; }
        else if (builderDuration === '3D2N') { days = 3; nights = 2; }
        else if (builderDuration === '4D3N') { days = 4; nights = 3; }
        else if (builderDuration === '5D4N') { days = 5; nights = 4; }

        let transportCost = 0;
        let transportLabel = 'No Vehicle (Self Arranged)';
        if (builderTransport === 'cab_sedan') {
            transportCost = 2600 * days;
            transportLabel = `Private AC Sedan (${days} Days)`;
        } else if (builderTransport === 'cab_innova') {
            transportCost = 3800 * days;
            transportLabel = `Private AC Innova Crysta (${days} Days)`;
        } else if (builderTransport === 'bikes') {
            const bikeCount = Math.ceil(builderTravelers / 2);
            transportCost = 500 * bikeCount * days;
            transportLabel = `${bikeCount}x Self-Drive Scooter(s) (${days} Days)`;
        }

        const roomCount = Math.ceil(builderTravelers / 2);
        let stayCostPerNight = 2200;
        let stayLabel = 'Riverfront Traditional Homestay';
        if (builderStay === 'luxury_resort') {
            stayCostPerNight = 4800;
            stayLabel = 'Premium Coastal Resort / Villa';
        } else if (builderStay === 'budget_guesthouse') {
            stayCostPerNight = 1400;
            stayLabel = 'Standard Travel Guesthouse';
        }
        const totalStayCost = stayCostPerNight * roomCount * nights;

        let activitiesCost = 0;
        if (includeBoating) activitiesCost += 400 * builderTravelers;
        if (includeScuba) activitiesCost += 2999 * builderTravelers;
        if (includeGuide) activitiesCost += 800 * (days - 1);
        if (includeSunsetCruise) activitiesCost += 2500;
        if (includePhotoshootBoat) activitiesCost += 4500;

        const totalCost = transportCost + totalStayCost + activitiesCost;
        const perPersonCost = Math.round(totalCost / builderTravelers);

        return {
            days,
            nights,
            transportCost,
            transportLabel,
            stayCostPerNight,
            totalStayCost,
            stayLabel,
            roomCount,
            activitiesCost,
            totalCost,
            perPersonCost,
        };
    }, [
        builderDuration,
        builderTravelers,
        builderTransport,
        builderStay,
        includeBoating,
        includeScuba,
        includeGuide,
        includeSunsetCruise,
        includePhotoshootBoat,
    ]);

    const scrollToBuilder = () => {
        const el = document.getElementById('custom-package-builder');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <AppLayout noFooterMargin>
            <Head>
                <title>All-Inclusive Karnataka Tour Packages & Custom Trips in Honnavar | GK WhizWheels</title>
                <meta
                    name="description"
                    content="Experience world-class Coastal Karnataka tour packages: Honnavar backwaters, Gokarna beaches, Yana limestone rocks, Vibhooti Falls & Netrani scuba diving. Custom trip builder, chauffeur AC cabs, riverfront stays & native guides."
                />
            </Head>

            <Box sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    1. TOP NOTIFICATION BAR / TICKER
                ========================================================================== */}
                <Box
                    sx={{
                        width: '100%',
                        bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                        borderBottom: isDark ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid #E9D5FF',
                        py: 1,
                        px: { xs: 2, sm: 4 },
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={{ xs: 1, md: 3 }}
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ maxWidth: 1320, mx: 'auto' }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                icon={<VerifiedUserIcon sx={{ fontSize: '14px !important', color: '#7C3AED' }} />}
                                label="4.96/5 Traveler Rating • Guaranteed Departures"
                                sx={{
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.25)' : '#E9D5FF',
                                    color: isDark ? '#E9D5FF' : '#6B21A8',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                }}
                            />
                            <Typography variant="caption" sx={{ color: isDark ? '#E9D5FF' : '#581C87', fontWeight: 600 }}>
                                🌴 All-Inclusive Coastal Karavali & Ghats Packages • Private AC Cabs • Riverfront Stays • 0% Hidden Fees
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#475569', display: { xs: 'none', lg: 'block' } }}>
                                Speak with our Vacation Architect:
                            </Typography>
                            <Button
                                component="a"
                                href="tel:+918660989586"
                                size="small"
                                startIcon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
                                sx={{
                                    color: '#7C3AED',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    py: 0.2,
                                    px: 1,
                                    textTransform: 'none',
                                    borderRadius: 1.5,
                                    '&:hover': { bgcolor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)' },
                                }}
                            >
                                +91 86609 89586
                            </Button>
                        </Stack>
                    </Stack>
                </Box>

                {/* =========================================================================
                    2. MODERN 2-COLUMN HERO SECTION
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="tours-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E1B4B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 50%, #F8FAFC 100%)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        {/* Breadcrumbs */}
                        <Breadcrumbs
                            aria-label="breadcrumb"
                            sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: mutedTextColor } }}
                        >
                            <Link href="/" style={{ textDecoration: 'none' }}>
                                <Typography variant="caption" sx={{ color: mutedTextColor, '&:hover': { color: '#7C3AED' } }}>
                                    Home
                                </Typography>
                            </Link>
                            <Link href="/services" style={{ textDecoration: 'none' }}>
                                <Typography variant="caption" sx={{ color: mutedTextColor, '&:hover': { color: '#7C3AED' } }}>
                                    Services
                                </Typography>
                            </Link>
                            <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 700 }}>
                                Karnataka Tour Packages
                            </Typography>
                        </Breadcrumbs>

                        <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
                            {/* Left Column: Hero Content */}
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <Chip
                                    icon={<LuggageIcon sx={{ fontSize: '16px !important', color: '#7C3AED' }} />}
                                    label="ALL-INCLUSIVE COASTAL KARNATAKA VACATIONS"
                                    sx={{
                                        mb: 2,
                                        px: 1.5,
                                        py: 0.5,
                                        fontWeight: 800,
                                        fontSize: '0.78rem',
                                        letterSpacing: '0.04em',
                                        color: '#7C3AED',
                                        bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                        border: '1px solid',
                                        borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                    }}
                                />

                                <Typography
                                    id="tours-hero-heading"
                                    component="h1"
                                    variant="h2"
                                    sx={{
                                        fontWeight: 900,
                                        fontSize: { xs: '2rem', sm: '2.6rem', md: '3.1rem' },
                                        lineHeight: 1.15,
                                        color: primaryTextColor,
                                        letterSpacing: '-0.02em',
                                        mb: 2,
                                    }}
                                >
                                    Curated Coastal & Ghats Tours,{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #4F46E5 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            display: 'inline',
                                        }}
                                    >
                                        Crafted by Locals
                                    </Box>
                                </Typography>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: secondaryTextColor,
                                        fontSize: { xs: '0.98rem', sm: '1.08rem' },
                                        lineHeight: 1.65,
                                        mb: 3.5,
                                        maxWidth: 680,
                                    }}
                                >
                                    Experience the pure splendor of Uttara Kannada without the stress of coordinating cabs, hotels, and permits. From Gokarna’s serene beaches and Honnavar’s mangrove backwaters to the volcanic limestone monoliths of Yana and roaring Jog Falls—our packages bundle private sanitized cabs, riverfront stays, boat safaris, and native guides seamlessly.
                                </Typography>

                                {/* 4 Trust Pillars */}
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    {[
                                        { title: 'Handpicked River Stays', desc: 'Serene homestays with authentic home-cooked breakfast', icon: <HomeWorkIcon sx={{ color: '#E11D48', fontSize: 20 }} /> },
                                        { title: 'Private AC Cab / Chauffeur', desc: 'All fuel, parking & toll taxes 100% pre-included', icon: <DirectionsCarIcon sx={{ color: '#0284C7', fontSize: 20 }} /> },
                                        { title: 'All Entry Permits & Boating', desc: 'Sharavathi mangrove boats & monument access pre-booked', icon: <DirectionsBoatIcon sx={{ color: '#059669', fontSize: 20 }} /> },
                                        { title: 'Custom Day-by-Day Builder', desc: 'Tweak stays, add Netrani scuba, or adjust pacing freely', icon: <TuneIcon sx={{ color: '#7C3AED', fontSize: 20 }} /> },
                                    ].map((pillar, idx) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.8,
                                                    borderRadius: 2.5,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                                    border: `1px solid ${cardBorderColor}`,
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                }}
                                            >
                                                <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC' }}>
                                                    {pillar.icon}
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                        {pillar.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, lineHeight: 1.3, display: 'block' }}>
                                                        {pillar.desc}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* CTAs */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={scrollToBuilder}
                                        startIcon={<TuneIcon />}
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: '#7C3AED',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            px: 3.5,
                                            py: 1.5,
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
                                            '&:hover': {
                                                bgcolor: '#6D28D9',
                                                boxShadow: '0 12px 28px rgba(124, 58, 237, 0.45)',
                                            },
                                        }}
                                    >
                                        Launch Custom Package Builder
                                    </Button>

                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20would%20like%20to%20plan%20a%20Karnataka%20tour%20package."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="outlined"
                                        size="large"
                                        startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                        sx={{
                                            borderColor: isDark ? 'rgba(37, 211, 102, 0.4)' : '#25D366',
                                            color: isDark ? '#4ADE80' : '#15803D',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            px: 3,
                                            py: 1.5,
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            bgcolor: isDark ? 'rgba(37, 211, 102, 0.06)' : 'rgba(37, 211, 102, 0.04)',
                                            '&:hover': {
                                                borderColor: '#25D366',
                                                bgcolor: isDark ? 'rgba(37, 211, 102, 0.15)' : 'rgba(37, 211, 102, 0.1)',
                                            },
                                        }}
                                    >
                                        WhatsApp Trip Concierge
                                    </Button>
                                </Stack>

                                <Typography variant="caption" sx={{ color: mutedTextColor, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                    Instant PDF quotation in 1 hour • 20% advance token • Free date modification up to 48 hrs
                                </Typography>
                            </Grid>

                            {/* Right Column: Featured Bestseller Showcase Card */}
                            <Grid size={{ xs: 12, lg: 5 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        boxShadow: isDark
                                            ? '0 20px 40px rgba(0, 0, 0, 0.6)'
                                            : '0 20px 40px rgba(124, 58, 237, 0.12)',
                                    }}
                                >
                                    <Box sx={{ position: 'relative', height: 260, width: '100%', overflow: 'hidden' }}>
                                        <Box
                                            component="img"
                                            src="/images/places/gokarna_beaches.jpg"
                                            alt="Complete Coastal Karnataka Safari Tour Package"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                                '&:hover': { transform: 'scale(1.04)' },
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)',
                                            }}
                                        />
                                        <Chip
                                            icon={<StarIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                            label="BESTSELLER VACATION (3D/2N)"
                                            sx={{
                                                position: 'absolute',
                                                top: 16,
                                                left: 16,
                                                bgcolor: '#7C3AED',
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        />
                                        <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                                                <Box>
                                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                        Complete Coastal Karnataka Safari
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <LocationOnIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                                        Honnavar • Yana • Vibhooti • Gokarna
                                                    </Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        px: 1.2,
                                                        py: 0.4,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(0, 0, 0, 0.65)',
                                                        backdropFilter: 'blur(6px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                        <StarIcon sx={{ fontSize: 14 }} /> 4.98 (290+ Reviews)
                                                    </Typography>
                                                </Paper>
                                            </Stack>
                                        </Box>
                                    </Box>

                                    <CardContent sx={{ p: 3 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 700, textTransform: 'uppercase' }}>
                                                    All-Inclusive Package
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 900, color: '#7C3AED' }}>
                                                    ₹8,999{' '}
                                                    <Typography component="span" variant="caption" sx={{ color: mutedTextColor, fontWeight: 600 }}>
                                                        / person (Min 2 Pax)
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label="3 Days / 2 Nights"
                                                size="small"
                                                sx={{ bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF', color: '#7C3AED', fontWeight: 800 }}
                                            />
                                        </Stack>

                                        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', mb: 2.5, border: `1px solid ${cardBorderColor}` }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                What's Included in This Circuit:
                                            </Typography>
                                            <Stack spacing={0.8}>
                                                {[
                                                    'Dedicated AC Sedan/Ertiga with Chauffeur throughout trip',
                                                    '2 Nights Handpicked Riverfront Homestay with Breakfasts',
                                                    'Sharavathi Mangrove Safari Boating Ticket Included',
                                                    'Yana Caves, Vibhooti Falls & Mirjan Fort Permits Covered',
                                                    'Gokarna Mahabaleshwar & Om Beach Cliff Walk Exploration',
                                                ].map((item, idx) => (
                                                    <Stack direction="row" spacing={1} alignItems="flex-start" key={idx}>
                                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', mt: 0.2 }} />
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, lineHeight: 1.4 }}>
                                                            {item}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </Box>

                                        <Stack direction="row" spacing={1.5}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                onClick={() => setModalOpen(true)}
                                                sx={{
                                                    bgcolor: '#7C3AED',
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    py: 1.4,
                                                    borderRadius: 2.5,
                                                    textTransform: 'none',
                                                    '&:hover': { bgcolor: '#6D28D9' },
                                                }}
                                            >
                                                Book 3D/2N Safari
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="large"
                                                onClick={scrollToBuilder}
                                                sx={{
                                                    borderColor: cardBorderColor,
                                                    color: primaryTextColor,
                                                    fontWeight: 700,
                                                    borderRadius: 2.5,
                                                    textTransform: 'none',
                                                    px: 2.5,
                                                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' },
                                                }}
                                            >
                                                Customize
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    3. ⭐ INTERACTIVE CUSTOM PACKAGE BUILDER (Requested by User)
                ========================================================================== */}
                <Box
                    id="custom-package-builder"
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="REAL-TIME TRIP ESTIMATOR"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.85rem', sm: '2.3rem', md: '2.6rem' },
                                    letterSpacing: '-0.02em',
                                    textAlign: 'center',
                                    mb: 1.5,
                                    lineHeight: 1.2,
                                }}
                            >
                                Build Your Custom Karnataka Vacation
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 720,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                Select your travel duration, number of guests, preferred wheels, stay category, and bucket-list activities. See your live transparent cost instantly.
                            </Typography>
                        </Box>

                        <Grid container spacing={4} alignItems="flex-start">
                            {/* Left Configurator Column */}
                            <Grid size={{ xs: 12, lg: 8 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 2.5, sm: 4 },
                                        borderRadius: 4,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                    }}
                                >
                                    {/* 1. Trip Duration */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarMonthIcon sx={{ fontSize: 20, color: '#7C3AED' }} /> 1. Select Vacation Duration:
                                        </Typography>
                                        <Grid container spacing={1.5}>
                                            {[
                                                { id: '2D1N', label: '2 Days / 1 Night', hint: 'Weekend Escape' },
                                                { id: '3D2N', label: '3 Days / 2 Nights', hint: 'Most Popular' },
                                                { id: '4D3N', label: '4 Days / 3 Nights', hint: 'Relaxed Explorer' },
                                                { id: '5D4N', label: '5 Days / 4 Nights', hint: 'Grand Coastal Tour' },
                                            ].map((dur) => (
                                                <Grid size={{ xs: 6, sm: 3 }} key={dur.id}>
                                                    <Paper
                                                        onClick={() => setBuilderDuration(dur.id)}
                                                        elevation={0}
                                                        sx={{
                                                            p: 1.8,
                                                            borderRadius: 2.5,
                                                            cursor: 'pointer',
                                                            textAlign: 'center',
                                                            border: builderDuration === dur.id ? '2px solid #7C3AED' : `1px solid ${cardBorderColor}`,
                                                            bgcolor: builderDuration === dur.id
                                                                ? isDark ? 'rgba(124, 58, 237, 0.15)' : '#FAF5FF'
                                                                : 'transparent',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: builderDuration === dur.id ? '#7C3AED' : primaryTextColor }}>
                                                            {dur.label}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontSize: '0.72rem' }}>
                                                            {dur.hint}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>

                                    {/* 2. Number of Travelers */}
                                    <Box sx={{ mb: 4 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <GroupsIcon sx={{ fontSize: 20, color: '#7C3AED' }} /> 2. Number of Travelers:
                                            </Typography>
                                            <Chip
                                                label={`${builderTravelers} Traveler${builderTravelers > 1 ? 's' : ''} (${Math.ceil(builderTravelers / 2)} Room${Math.ceil(builderTravelers / 2) > 1 ? 's' : ''})`}
                                                size="small"
                                                sx={{ bgcolor: '#7C3AED', color: '#FFFFFF', fontWeight: 800 }}
                                            />
                                        </Stack>
                                        <Grid container spacing={1.5}>
                                            {[1, 2, 4, 6, 8].map((count) => (
                                                <Grid size={{ xs: 2.4 }} key={count}>
                                                    <Paper
                                                        onClick={() => setBuilderTravelers(count)}
                                                        elevation={0}
                                                        sx={{
                                                            py: 1.2,
                                                            borderRadius: 2,
                                                            cursor: 'pointer',
                                                            textAlign: 'center',
                                                            border: builderTravelers === count ? '2px solid #7C3AED' : `1px solid ${cardBorderColor}`,
                                                            bgcolor: builderTravelers === count
                                                                ? isDark ? 'rgba(124, 58, 237, 0.15)' : '#FAF5FF'
                                                                : 'transparent',
                                                        }}
                                                    >
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: builderTravelers === count ? '#7C3AED' : primaryTextColor }}>
                                                            {count} {count === 8 ? 'Pax+' : 'Pax'}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>

                                    {/* 3. Transport & Wheels */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DirectionsCarIcon sx={{ fontSize: 20, color: '#7C3AED' }} /> 3. Select Vehicle / Wheels:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {[
                                                { id: 'cab_sedan', title: 'Private AC Cab (Sedan / Dzire)', rate: '₹2,600 / day', desc: 'Chauffeur driven, fuel, parking & tolls 100% included. Ideal for 1-4 pax.' },
                                                { id: 'cab_innova', title: 'Premium AC Innova Crysta / Ertiga', rate: '₹3,800 / day', desc: 'Spacious 6-7 seater with luggage carrier, perfect for families & groups.' },
                                                { id: 'bikes', title: 'Self-Drive Scooters (Activa 6G)', rate: '₹500 / day / bike', desc: '2 Helmets included per bike. Freedom to cruise NH66 and cliff beaches.' },
                                                { id: 'none', title: 'No Vehicle (Own Transport)', rate: '₹0', desc: 'Bring your own car or bike. We coordinate hotel and activities.' },
                                            ].map((veh) => (
                                                <Grid size={{ xs: 12, sm: 6 }} key={veh.id}>
                                                    <Paper
                                                        onClick={() => setBuilderTransport(veh.id)}
                                                        elevation={0}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 2.5,
                                                            cursor: 'pointer',
                                                            border: builderTransport === veh.id ? '2px solid #7C3AED' : `1px solid ${cardBorderColor}`,
                                                            bgcolor: builderTransport === veh.id
                                                                ? isDark ? 'rgba(124, 58, 237, 0.15)' : '#FAF5FF'
                                                                : 'transparent',
                                                            height: '100%',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: builderTransport === veh.id ? '#7C3AED' : primaryTextColor }}>
                                                                {veh.title}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                                                                {veh.rate}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, lineHeight: 1.35, display: 'block' }}>
                                                            {veh.desc}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>

                                    {/* 4. Stay Preference */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <HomeWorkIcon sx={{ fontSize: 20, color: '#7C3AED' }} /> 4. Choose Accommodation Category:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {[
                                                { id: 'riverfront_homestay', title: 'Authentic Riverfront Homestay', rate: '₹2,200 / night / room', desc: 'Serene riverside balcony, AC room, and hot home-cooked traditional breakfast.' },
                                                { id: 'luxury_resort', title: 'Premium Coastal Resort / Villa', rate: '₹4,800 / night / room', desc: 'Swimming pool, multi-cuisine dining, beach access, and luxury amenities.' },
                                                { id: 'budget_guesthouse', title: 'Standard Travel Guesthouse', rate: '₹1,400 / night / room', desc: 'Clean, sanitized AC room close to town center and transportation hubs.' },
                                            ].map((stay) => (
                                                <Grid size={{ xs: 12, sm: 4 }} key={stay.id}>
                                                    <Paper
                                                        onClick={() => setBuilderStay(stay.id)}
                                                        elevation={0}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 2.5,
                                                            cursor: 'pointer',
                                                            border: builderStay === stay.id ? '2px solid #7C3AED' : `1px solid ${cardBorderColor}`,
                                                            bgcolor: builderStay === stay.id
                                                                ? isDark ? 'rgba(124, 58, 237, 0.15)' : '#FAF5FF'
                                                                : 'transparent',
                                                            height: '100%',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: builderStay === stay.id ? '#7C3AED' : primaryTextColor, mb: 0.3 }}>
                                                            {stay.title}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', display: 'block', mb: 0.8 }}>
                                                            {stay.rate}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, lineHeight: 1.35, display: 'block' }}>
                                                            {stay.desc}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>

                                    {/* 5. Add-on Activities */}
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ExploreIcon sx={{ fontSize: 20, color: '#7C3AED' }} /> 5. Select Bucket-List Experiences:
                                        </Typography>
                                        <Grid container spacing={1.5}>
                                            {[
                                                { label: 'Sharavathi Mangrove Safari Boating', hint: '+₹400 / person', checked: includeBoating, setter: setIncludeBoating, icon: '🛶' },
                                                { label: 'Netrani Island PADI Scuba Diving (Murudeshwar)', hint: '+₹2,999 / person (Incl. 4K GoPro)', checked: includeScuba, setter: setIncludeScuba, icon: '🤿' },
                                                { label: 'Dedicated Native Heritage Guide (Mirjan / Yana)', hint: '+₹800 / day', checked: includeGuide, setter: setIncludeGuide, icon: '🧭' },
                                                { label: 'Sunset Arabian Sea Private Boat Cruise', hint: '+₹2,500 / group', checked: includeSunsetCruise, setter: setIncludeSunsetCruise, icon: '🌅' },
                                                { label: 'Couple / Pre-Wedding Photography Boat Staging', hint: '+₹4,500 / charter', checked: includePhotoshootBoat, setter: setIncludePhotoshootBoat, icon: '📸' },
                                            ].map((act, i) => (
                                                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            bgcolor: act.checked ? (isDark ? 'rgba(124, 58, 237, 0.12)' : '#FAF5FF') : 'transparent',
                                                            border: `1px solid ${act.checked ? '#7C3AED' : cardBorderColor}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={act.checked}
                                                                    onChange={(e) => act.setter(e.target.checked)}
                                                                    sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }}
                                                                />
                                                            }
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                                        {act.icon} {act.label}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600 }}>
                                                                        {act.hint}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                            sx={{ m: 0, flexGrow: 1 }}
                                                        />
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Right Live Cost Summary Card */}
                            <Grid size={{ xs: 12, lg: 4 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3.5,
                                        borderRadius: 4,
                                        bgcolor: cardBgColor,
                                        border: `2px solid #7C3AED`,
                                        boxShadow: isDark
                                            ? '0 16px 36px rgba(0,0,0,0.6)'
                                            : '0 16px 36px rgba(124, 58, 237, 0.1)',
                                        position: 'sticky',
                                        top: 24,
                                    }}
                                >
                                    <Chip
                                        label="CUSTOM QUOTATION"
                                        size="small"
                                        sx={{ bgcolor: '#7C3AED', color: '#FFFFFF', fontWeight: 800, mb: 2 }}
                                    />
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: primaryTextColor, mb: 0.5 }}>
                                        Estimated Custom Plan
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', mb: 2 }}>
                                        {customCalculation.days} Days / {customCalculation.nights} Nights for {builderTravelers} Traveler{builderTravelers > 1 ? 's' : ''}
                                    </Typography>

                                    <Divider sx={{ my: 2, borderColor: cardBorderColor }} />

                                    {/* Cost Summary Breakdown */}
                                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                                {customCalculation.transportLabel}:
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                ₹{customCalculation.transportCost.toLocaleString()}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                                {customCalculation.stayLabel} ({customCalculation.nights} Nights, {customCalculation.roomCount} Rooms):
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                ₹{customCalculation.totalStayCost.toLocaleString()}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                                Selected Activities & Entry Tickets:
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                ₹{customCalculation.activitiesCost.toLocaleString()}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#FAF5FF', mb: 3 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                                                Total Group Price:
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#7C3AED' }}>
                                                ₹{customCalculation.totalCost.toLocaleString()}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', textAlign: 'right' }}>
                                            approx. <strong>₹{customCalculation.perPersonCost.toLocaleString()}</strong> / person
                                        </Typography>
                                    </Box>

                                    <Stack spacing={1.5}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={() => setModalOpen(true)}
                                            sx={{
                                                bgcolor: '#7C3AED',
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                py: 1.4,
                                                borderRadius: 2.5,
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: '#6D28D9' },
                                            }}
                                        >
                                            Book This Custom Trip
                                        </Button>

                                        <Button
                                            fullWidth
                                            component="a"
                                            href={`https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20configured%20a%20custom%20tour%3A%20${customCalculation.days}D%2F${customCalculation.nights}N%20for%20${builderTravelers}%20pax.%20Transport%3A%20${encodeURIComponent(customCalculation.transportLabel)}.%20Stay%3A%20${encodeURIComponent(customCalculation.stayLabel)}.%20Estimated%3A%20%E2%82%B9${customCalculation.totalCost}.`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="outlined"
                                            startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                            sx={{
                                                borderColor: '#25D366',
                                                color: isDark ? '#4ADE80' : '#15803D',
                                                fontWeight: 700,
                                                py: 1.2,
                                                borderRadius: 2.5,
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: isDark ? 'rgba(37, 211, 102, 0.1)' : 'rgba(37, 211, 102, 0.05)' },
                                            }}
                                        >
                                            Send Plan via WhatsApp
                                        </Button>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    4. CURATED FIXED ITINERARIES (PRE-PACKAGED TOURS)
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="HANDCRAFTED CIRCUITS"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.85rem', sm: '2.3rem', md: '2.6rem' },
                                    letterSpacing: '-0.02em',
                                    textAlign: 'center',
                                    mb: 1.5,
                                    lineHeight: 1.2,
                                }}
                            >
                                Signature Pre-Packaged Karnataka Vacations
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 720,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                Don't want to design from scratch? Choose one of our battle-tested, highly rated vacation circuits. Everything is pre-booked and managed end-to-end.
                            </Typography>
                        </Box>

                        <Grid container spacing={3.5}>
                            {CURATED_PACKAGES.map((pkg) => (
                                <Grid size={{ xs: 12, md: 6 }} key={pkg.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3.5,
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            overflow: 'hidden',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: isDark
                                                    ? '0 16px 36px rgba(0,0,0,0.6)'
                                                    : '0 16px 36px rgba(124, 58, 237, 0.08)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ position: 'relative', height: 230 }}>
                                            <Box
                                                component="img"
                                                src={pkg.image}
                                                alt={pkg.title}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)',
                                                }}
                                            />
                                            <Chip
                                                label={pkg.badge}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    left: 14,
                                                    bgcolor: pkg.badgeColor,
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    fontSize: '0.72rem',
                                                }}
                                            />
                                            <Chip
                                                label={pkg.duration}
                                                icon={<AccessTimeIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    right: 14,
                                                    bgcolor: 'rgba(0,0,0,0.7)',
                                                    color: '#FFFFFF',
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem',
                                                    backdropFilter: 'blur(6px)',
                                                }}
                                            />
                                            <Box sx={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                                                <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800, lineHeight: 1.2, mb: 0.4 }}>
                                                    {pkg.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#E9D5FF', fontWeight: 600 }}>
                                                    {pkg.subtitle}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', mb: 2.5, border: `1px dashed ${cardBorderColor}` }}>
                                                <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.4 }}>
                                                    Itinerary Trail:
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.86rem', lineHeight: 1.45 }}>
                                                    {pkg.itinerarySummary}
                                                </Typography>
                                            </Box>

                                            <Typography variant="caption" sx={{ fontWeight: 700, color: mutedTextColor, textTransform: 'uppercase', mb: 1 }}>
                                                Package Inclusions:
                                            </Typography>
                                            <Stack spacing={0.9} sx={{ mb: 3, flexGrow: 1 }}>
                                                {pkg.inclusions.map((inc, idx) => (
                                                    <Stack direction="row" spacing={1} alignItems="flex-start" key={idx}>
                                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#059669', mt: 0.2 }} />
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, lineHeight: 1.4 }}>
                                                            {inc}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>

                                            <Box sx={{ mt: 'auto', pt: 2.5, borderTop: `1px solid ${cardBorderColor}` }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                                            Starting From
                                                        </Typography>
                                                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>
                                                            ₹{pkg.startingPrice.toLocaleString()}
                                                            <Typography component="span" variant="body2" sx={{ color: mutedTextColor, fontWeight: 600, ml: 0.8 }}>
                                                                / {pkg.priceUnit}
                                                            </Typography>
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label="All-Inclusive"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
                                                            color: '#7C3AED',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem',
                                                        }}
                                                    />
                                                </Stack>

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    size="large"
                                                    onClick={() => setModalOpen(true)}
                                                    endIcon={<ArrowForwardIcon />}
                                                    sx={{
                                                        bgcolor: '#7C3AED',
                                                        color: '#FFFFFF',
                                                        fontWeight: 850,
                                                        py: 1.35,
                                                        borderRadius: 2.5,
                                                        fontSize: '0.95rem',
                                                        textTransform: 'none',
                                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                                        '&:hover': {
                                                            bgcolor: '#6D28D9',
                                                            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.45)',
                                                        },
                                                    }}
                                                >
                                                    Book This Package Now
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    5. DAY-BY-DAY INTERACTIVE TIMELINE (Deep Dive into 3D/2N Safari)
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="DAY-BY-DAY TIMELINE"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.85rem', sm: '2.3rem', md: '2.6rem' },
                                    letterSpacing: '-0.02em',
                                    textAlign: 'center',
                                    mb: 1.5,
                                    lineHeight: 1.2,
                                }}
                            >
                                How Your 3D/2N Coastal Safari Unfolds
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 680,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                A sample pacing guide of our most popular circuit, crafted so you experience both thrilling rainforest nature and serene beach sunsets with zero rushing.
                            </Typography>
                        </Box>

                        <Stack spacing={3.5}>
                            {DETAILED_TIMELINE_3D2N.map((item, idx) => (
                                <Paper
                                    key={idx}
                                    elevation={0}
                                    sx={{
                                        p: { xs: 2.5, sm: 3.5 },
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                    }}
                                >
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
                                        <Chip
                                            label={item.day}
                                            sx={{
                                                bgcolor: '#7C3AED',
                                                color: '#FFFFFF',
                                                fontWeight: 900,
                                                fontSize: '0.85rem',
                                                px: 1,
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                {item.title}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ mb: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

                                    <Grid container spacing={2}>
                                        {item.highlights.map((point, pi) => (
                                            <Grid size={{ xs: 12, md: 6 }} key={pi}>
                                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                                    <Box sx={{ p: 0.5, borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', mt: 0.2 }}>
                                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.5, fontSize: '0.9rem' }}>
                                                        {point}
                                                    </Typography>
                                                </Stack>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                </Box>

                {/* =========================================================================
                    6. ALL-INCLUSIVE PROMISE: INCLUSIONS VS EXCLUSIONS
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="TRANSPARENT GUARANTEE"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.85rem', sm: '2.3rem', md: '2.6rem' },
                                    letterSpacing: '-0.02em',
                                    textAlign: 'center',
                                    mb: 1.5,
                                    lineHeight: 1.2,
                                }}
                            >
                                What’s Included in Every Tour Package
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 680,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                We hate surprise costs as much as you do. Here is our 100% transparent coverage list.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3.5,
                                        height: '100%',
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 22 }} /> 100% COVERED & PRE-PAID:
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {[
                                            'Private, sanitized AC Cab throughout the tour (Sedan or Innova Crysta)',
                                            'All fuel charges, interstate taxes, highway tolls, and driver DA allowances',
                                            'Handpicked verified riverfront homestay or coastal resort with hot water',
                                            'Complimentary daily traditional coastal breakfast (Neer dosa, Idli, Upma)',
                                            'Sharavathi River Mangrove Boat Safari ticket included for all guests',
                                            'All state forest permits and monument entry tickets for mentioned spots',
                                            'Dedicated 24/7 travel concierge on WhatsApp for instant assistance',
                                        ].map((item, i) => (
                                            <Stack direction="row" spacing={1.2} alignItems="flex-start" key={i}>
                                                <DoneAllIcon sx={{ fontSize: 18, color: '#059669', mt: 0.2 }} />
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.5 }}>
                                                    {item}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3.5,
                                        height: '100%',
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#E11D48', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <InfoOutlinedIcon sx={{ fontSize: 22 }} /> NOT INCLUDED (FLEXIBLE DINING):
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {[
                                            'Lunch and Dinner (kept open so you can savor local seafood and authentic Karavali specialties without hotel buffet lock-in)',
                                            'Personal shopping, handicraft purchases, and personal laundry',
                                            'Optional watersports at Om Beach or Netrani Scuba (unless selected in custom builder)',
                                            'Train or flight tickets to/from Honnavar (we pick you up directly upon arrival)',
                                        ].map((item, i) => (
                                            <Stack direction="row" spacing={1.2} alignItems="flex-start" key={i}>
                                                <Box component="span" sx={{ color: '#E11D48', fontWeight: 900, fontSize: '0.9rem', mt: 0.1 }}>
                                                    ✕
                                                </Box>
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.5 }}>
                                                    {item}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    7. SIGHTSEEING DISTANCES & GATEWAY CONNECTIVITY MATRIX
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="TRANSIT & CONNECTIVITY"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.85rem', sm: '2.3rem', md: '2.6rem' },
                                    letterSpacing: '-0.02em',
                                    textAlign: 'center',
                                    mb: 1.5,
                                    lineHeight: 1.2,
                                }}
                            >
                                How to Reach Honnavar & Travel Matrix
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 680,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                Honnavar is the central gateway to Coastal Karnataka. We provide station pickups or coordinate airport cabs effortlessly.
                            </Typography>
                        </Box>

                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                borderRadius: 3.5,
                                bgcolor: cardBgColor,
                                border: `1px solid ${cardBorderColor}`,
                                overflow: 'hidden',
                            }}
                        >
                            <Table sx={{ minWidth: 650 }} aria-label="transit matrix">
                                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Gateway / Arrival Point</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Distance to Honnavar</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Travel Time</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>GK WhizWheels Pickup Support</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {TRANSIT_GATEWAYS.map((row, idx) => (
                                        <TableRow
                                            key={idx}
                                            sx={{
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA' },
                                            }}
                                        >
                                            <TableCell component="th" scope="row" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                {row.gateway}
                                            </TableCell>
                                            <TableCell sx={{ color: '#7C3AED', fontWeight: 800 }}>{row.dist}</TableCell>
                                            <TableCell sx={{ color: secondaryTextColor, fontWeight: 600 }}>{row.time}</TableCell>
                                            <TableCell sx={{ color: mutedTextColor }}>{row.note}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>

                {/* =========================================================================
                    8. FREQUENTLY ASKED QUESTIONS (FAQ)
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                    }}
                >
                    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Chip
                                label="GOT QUESTIONS?"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : '#E9D5FF',
                                }}
                            />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 950,
                                    color: primaryTextColor,
                                    fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.6rem' },
                                    letterSpacing: '-0.02em',
                                    textAlign: 'center',
                                    mb: 1.5,
                                    lineHeight: 1.2,
                                }}
                            >
                                Frequently Asked Questions
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 640,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                Have queries regarding custom itineraries, advance deposits, or driver allowances? We have answers.
                            </Typography>
                        </Box>

                        <Stack spacing={2}>
                            {TOURS_FAQS.map((faq, idx) => (
                                <Accordion
                                    key={idx}
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px !important',
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        '&:before': { display: 'none' },
                                        overflow: 'hidden',
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon sx={{ color: '#7C3AED' }} />}
                                        sx={{ px: 3, py: 1.5 }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: primaryTextColor, pr: 2 }}>
                                            {faq.q}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.65, fontSize: '0.92rem' }}>
                                            {faq.a}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    </Box>
                </Box>

                {/* =========================================================================
                    9. BOTTOM LUXURY CONCIERGE CTA BANNER
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'linear-gradient(135deg, #4C1D95 0%, #312E81 50%, #0F172A 100%)'
                            : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 60%, #4F46E5 100%)',
                        color: '#FFFFFF',
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                        <Chip
                            icon={<StarIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                            label="ALL-INCLUSIVE PEACE OF MIND"
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                mb: 2,
                            }}
                        />
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem' },
                                mb: 2,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Experience Coastal Karnataka Without the Hassle
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                mb: 4,
                                maxWidth: 680,
                                mx: 'auto',
                                lineHeight: 1.6,
                            }}
                        >
                            Private AC cabs, peaceful riverfront homestays, mangrove boat cruises, and verified native storytellers. Let us craft your dream getaway.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => setModalOpen(true)}
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    bgcolor: '#FFFFFF',
                                    color: '#7C3AED',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    '&:hover': {
                                        bgcolor: '#F8FAFC',
                                        color: '#6D28D9',
                                    },
                                }}
                            >
                                Book Tour Package Online
                            </Button>

                            <Button
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20am%20interested%20in%20a%20Karnataka%20Tour%20Package."
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="large"
                                startIcon={<WhatsAppIcon />}
                                sx={{
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    px: 3.5,
                                    py: 1.5,
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    backdropFilter: 'blur(8px)',
                                    '&:hover': {
                                        borderColor: '#FFFFFF',
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                WhatsApp Trip Planner
                            </Button>

                            <Button
                                component="a"
                                href="tel:+918660989586"
                                variant="outlined"
                                size="large"
                                startIcon={<PhoneIcon />}
                                sx={{
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    px: 3.5,
                                    py: 1.5,
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    backdropFilter: 'blur(8px)',
                                    '&:hover': {
                                        borderColor: '#FFFFFF',
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                Call +91 86609 89586
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* Dedicated Tour Booking Modal */}
            <TourBookingModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                initialPackageId="2d1n_karavali"
                availableItems={availableItems}
            />
        </AppLayout>
    );
}

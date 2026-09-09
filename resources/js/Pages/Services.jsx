import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import ServiceBookingModal from '../Components/ServiceBookingModal';
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
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DirectionsIcon from '@mui/icons-material/Directions';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShieldIcon from '@mui/icons-material/Shield';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TrainIcon from '@mui/icons-material/Train';
import EmailIcon from '@mui/icons-material/Email';

export default function Services() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [modalOpen, setModalOpen] = useState(false);
    const [activeServiceId, setActiveServiceId] = useState('two_wheelers');
    const [selectedHeroService, setSelectedHeroService] = useState('bikes');

    const heroServicePreviews = {
        bikes: {
            id: 'two_wheelers',
            title: 'Bike & Scooter Rentals',
            rate: 'From ₹350 / Day',
            image: '/images/services/two_wheelers.jpg',
            badge: 'Instant Handover',
            color: '#F59E0B',
            href: '/services/bikes',
            perks: ['Activa 6G, Classic 350 & CB350', '2 ISI Helmets & Phone Mount Free', 'Honnavar Rly Stn Delivery'],
        },
        cabs: {
            id: 'taxi',
            title: 'Coastal Cabs & Taxis',
            rate: 'Station ₹400 • Tour ₹2,400',
            image: '/images/services/taxi.jpg',
            badge: 'Zero Surge Pricing',
            color: '#0284C7',
            href: '/services/cabs',
            perks: ['Punctual Train & Airport Pickup', 'Swift Dzire, Ertiga & Innova Crysta', 'Experienced Local Chauffeurs'],
        },
        homestays: {
            id: 'homestay',
            title: 'Homestays & Coastal Rooms',
            rate: 'Starts ₹1,800 / Night',
            image: '/images/services/homestay.jpg',
            badge: 'Riverfront & Beach',
            color: '#E11D48',
            href: '/services/homestays',
            perks: ['Sharavathi Riverfront Wooden Cottages', 'Authentic Karavali Coastal Meals', 'Family & Couple Safe Verified'],
        },
        boating: {
            id: 'boating',
            title: 'Sharavathi Backwater Boating',
            rate: 'Starts ₹400 / Person',
            image: '/images/services/boating.jpg',
            badge: 'Certified Captains',
            color: '#059669',
            href: '/services/boating',
            perks: ['Tranquil Mangrove Corridor Cruise', '04:30 PM Golden Sunset Estuary Slot', 'Certified Lifejackets Provided'],
        },
        scuba: {
            id: 'scuba',
            title: 'Netrani Island Scuba Diving',
            rate: 'Starts ₹2,999 / Dive',
            image: '/images/services/scuba.jpg',
            badge: 'PADI Certified',
            color: '#6366F1',
            href: '/services/scuba',
            perks: ['Beginners & Non-Swimmers Welcome', 'Free 4K GoPro Underwater Footage', 'Daily Murudeshwar Harbor Departure'],
        },
        tours: {
            id: 'tours',
            title: 'Custom Karavali Vacation Combos',
            rate: 'Save 10% on Bundles',
            image: '/images/services/tour.jpg',
            badge: 'All-in-One Package',
            color: '#8B5CF6',
            href: '/services/tours',
            perks: ['Bikes/Cabs + Stays + Boating + Scuba', 'Dedicated Local Trip Coordinator', 'Custom Tailored Daily Itineraries'],
        },
    };

    const handleOpenBooking = (serviceId) => {
        // Map slug/card id to ServiceBookingModal id
        const serviceModalMap = {
            bikes: 'two_wheelers',
            cabs: 'taxi',
            homestays: 'homestay',
            boating: 'boating',
            scuba: 'scuba',
            guide: 'guide',
            tours: 'tours',
        };
        setActiveServiceId(serviceModalMap[serviceId] || serviceId);
        setModalOpen(true);
    };

    // 7 Core Services in exact requested order
    const services = [
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
            badgeText: 'Instant Handover',
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
            badgeText: 'Zero Surge Pricing',
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
            badgeText: 'Riverfront & Beach',
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
            badgeText: 'Certified Captains',
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
            badgeText: 'PADI Certified',
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
            badgeText: 'Local Insiders',
        },
    ];

    // Popular Combos
    const combos = [
        {
            title: 'Honnavar Estuary & Mangrove Explorer',
            badge: 'Most Popular Day Trip',
            price: '₹750 / person',
            duration: 'Half Day (4-5 Hours)',
            color: '#059669',
            items: ['Activa 6G Scooter Rental', '1-Hour Sharavathi Mangrove Cruise', 'Eco Beach Boardwalk Sunset'],
            description: 'The definitive Honnavar experience. Ride to the river jetty, cruise through emerald mangroves, and finish with sunset at Eco Beach.',
            serviceId: 'boating',
        },
        {
            title: 'Netrani Scuba & Murudeshwar Temple Expedition',
            badge: 'Adventure Special',
            price: '₹3,800 / person',
            duration: 'Full Day (06:00 AM - 04:00 PM)',
            color: '#6366F1',
            items: ['Chilled AC Taxi from Honnavar', 'PADI Netrani Scuba Dive with 4K Video', 'Murudeshwar Shiva Statue Visit'],
            description: 'Experience India’s top coral dive site followed by the majestic coastal Murudeshwar temple, with private cab pick-and-drop.',
            serviceId: 'scuba',
        },
        {
            title: 'Gokarna Beach Trail & Fort Heritage Ride',
            badge: 'Biker & Explorer Favorite',
            price: '₹1,200 / day',
            duration: 'Full Day (8-10 Hours)',
            color: '#F59E0B',
            items: ['Royal Enfield Classic 350 / Activa', 'Historic Mirjan Fort Walkthrough', 'Om Beach & Kudle Cliff Trail'],
            description: 'Feel the coastal breeze along NH66. Stop at Queen Chennabhairadevi’s 16th-century fortress, then hit Gokarna’s sacred beaches.',
            serviceId: 'two_wheelers',
        },
        {
            title: 'Karavali 3D/2N Complete Coastal Retreat',
            badge: 'All-Inclusive Vacation',
            price: '₹3,499 / person',
            duration: '3 Days / 2 Nights',
            color: '#8B5CF6',
            items: ['Sharavathi Riverfront Homestay', '2-Day Unlimited Two-Wheeler', 'Backwater Cruise & Station Transfer'],
            description: 'Zero stress, zero planning. We handle your stay, ride, cruise, and station handover with a dedicated local trip manager.',
            serviceId: 'tours',
        },
    ];

    // Distance matrix
    const distances = [
        { destination: 'Honnavar Railway Station', distance: '0 km', time: 'Direct Handover', mode: 'Bikes & Cabs Available' },
        { destination: 'Sharavathi River Boating Jetty', distance: '1.5 km', time: '5 Mins', mode: 'Scooter / Cab' },
        { destination: 'Honnavar Eco Beach & Boardwalk', distance: '4.2 km', time: '10 Mins', mode: 'Scooter / Bike' },
        { destination: 'Apsarakonda Falls & Marine Cliff', distance: '6.5 km', time: '15 Mins', mode: 'Scooter / Bike' },
        { destination: 'Historic Mirjan Fort', distance: '21 km', time: '25 Mins', mode: 'NH66 Coastal Highway' },
        { destination: 'Murudeshwar Shiva Temple & Beach', distance: '27 km', time: '35 Mins', mode: 'Direct Highway Cab / Bike' },
        { destination: 'Gokarna Om Beach & Mahabaleshwar', distance: '48 km', time: '55 Mins', mode: 'Scenic Coastal Ride' },
        { destination: 'Jog Falls (Highest Plunge Falls)', distance: '60 km', time: '1 Hr 20 Mins', mode: 'Ghat Highway Cab / Cruiser' },
    ];

    return (
        <AppLayout>
            <Head>
                <title>All Travel & Rental Services in Honnavar | Bikes, Cabs, Stays, Boating & Scuba - GK WhizWheel</title>
                <meta
                    name="description"
                    content="Complete coastal travel services in Honnavar: Two-wheeler and bike rentals from ₹350/day, AC taxis and station cabs, Sharavathi backwater boat cruises, Netrani scuba diving, riverside homestays, local guides, and tour packages. Dual pickup hubs at Honnavar Railway Station & Palya Main Rd."
                />
            </Head>

            {/* Accessibility: Skip to main content */}
            <Box
                component="a"
                href="#main-content"
                sx={{
                    position: 'absolute',
                    top: -100,
                    left: 16,
                    zIndex: 9999,
                    p: 1.5,
                    bgcolor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: 800,
                    borderRadius: 1,
                    textDecoration: 'none',
                    '&:focus': {
                        top: 16,
                    },
                }}
            >
                Skip to main content
            </Box>

            <Box component="main" id="main-content" sx={{ pb: 12 }}>
                {/* =========================================================================
                    1. HERO HEADER SECTION (2-Column Split: Value Proposition + Interactive Explorer Card)
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="services-hero-title"
                    sx={{
                        background: isDark
                            ? 'radial-gradient(ellipse 90% 60% at 50% -20%, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0) 75%), #090E17'
                            : 'radial-gradient(ellipse 90% 60% at 50% -20%, rgba(245, 158, 11, 0.14) 0%, rgba(255, 255, 255, 0) 75%), #F8FAFC',
                        pt: { xs: 4, md: 5.5 },
                        pb: { xs: 6, md: 8 },
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ maxWidth: '1280px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
                        {/* Top Breadcrumb & Live Hub Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                            <Breadcrumbs
                                separator={<NavigateNextIcon fontSize="small" sx={{ color: isDark ? '#64748B' : '#94A3B8' }} />}
                                aria-label="Breadcrumb navigation"
                            >
                                <Link href="/" style={{ textDecoration: 'none', color: isDark ? '#CBD5E1' : '#334155', fontWeight: 600 }}>
                                    Home
                                </Link>
                                <Typography sx={{ color: '#F59E0B', fontWeight: 800 }}>
                                    All Travel Services
                                </Typography>
                            </Breadcrumbs>

                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.6,
                                    py: 0.5,
                                    borderRadius: 9999,
                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                                    border: '1px solid rgba(16, 185, 129, 0.28)',
                                    color: isDark ? '#34D399' : '#047857',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                }}
                            >
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                                Dual Hubs Active • Honnavar Rly Stn & Palya Main Rd
                            </Box>
                        </Box>

                        {/* 2-Column Split: Left = Copy, Metrics & Actions, Right = Interactive Service Preview Card */}
                        <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
                            {/* Left Column */}
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ fontSize: '15px !important', color: '#F59E0B !important' }} />}
                                        label="HONNAVAR'S OFFICIAL ALL-IN-ONE TRAVEL FLEET"
                                        sx={{
                                            bgcolor: 'rgba(245, 158, 11, 0.12)',
                                            color: '#F59E0B',
                                            fontWeight: 850,
                                            letterSpacing: '0.04em',
                                            fontSize: '0.74rem',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                        }}
                                    />
                                </Box>

                                <Typography
                                    id="services-hero-title"
                                    variant="h1"
                                    sx={{
                                        fontWeight: 950,
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                        letterSpacing: '-0.035em',
                                        fontSize: { xs: '2.2rem', sm: '3rem', md: '3.4rem' },
                                        lineHeight: 1.15,
                                        mb: 2.5,
                                    }}
                                >
                                    Everything You Need to Explore{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        Honnavar & Coastal Karavali
                                    </Box>
                                </Typography>

                                <Typography
                                    variant="h6"
                                    component="p"
                                    sx={{
                                        color: isDark ? '#CBD5E1' : '#334155',
                                        fontWeight: 400,
                                        maxWidth: 680,
                                        lineHeight: 1.7,
                                        fontSize: { xs: '1rem', md: '1.12rem' },
                                        mb: 3.5,
                                    }}
                                >
                                    Skip coordinating with 5 separate middlemen. Book verified self-drive two-wheelers, AC station cabs, Sharavathi mangrove boat cruises, Netrani coral scuba diving, and authentic beachfront homestays under one trusted local roof with 5-minute express train pickup.
                                </Typography>

                                {/* 4 Feature Value Chips */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5, maxWidth: 660 }}>
                                    {[
                                        { icon: <TrainIcon sx={{ fontSize: 16 }} />, label: '5-Min Station Handover' },
                                        { icon: <ShieldIcon sx={{ fontSize: 16 }} />, label: 'Zero Deposit Options' },
                                        { icon: <StarIcon sx={{ fontSize: 16 }} />, label: '5.0 Google Rating (324+ Reviews)' },
                                        { icon: <SupportAgentIcon sx={{ fontSize: 16 }} />, label: '24/7 Roadside Assistance' },
                                    ].map((pill, pIdx) => (
                                        <Grid key={pIdx} size={{ xs: 6, sm: 6 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1.1,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                                    fontSize: '0.84rem',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <Box sx={{ color: '#F59E0B', display: 'flex' }}>{pill.icon}</Box>
                                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.82rem', color: isDark ? '#E2E8F0' : '#1E293B' }}>
                                                    {pill.label}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Hero Action Buttons */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 4 }}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        component="a"
                                        href="#service-catalog"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            fontWeight: 850,
                                            px: 3.5,
                                            py: 1.4,
                                            borderRadius: 2.5,
                                            fontSize: '0.96rem',
                                            boxShadow: '0 6px 20px -2px rgba(245, 158, 11, 0.4)',
                                            '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                        }}
                                    >
                                        Explore All 7 Services ↓
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheel%2C%20I%20want%20to%20inquire%20about%20your%20Honnavar%20travel%20services"
                                        target="_blank"
                                        rel="noreferrer"
                                        startIcon={<WhatsAppIcon sx={{ color: '#FFFFFF' }} />}
                                        sx={{
                                            bgcolor: '#16A34A',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            px: 3,
                                            py: 1.4,
                                            borderRadius: 2.5,
                                            fontSize: '0.96rem',
                                            '&:hover': { bgcolor: '#15803D' },
                                            '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                        }}
                                    >
                                        WhatsApp Desk
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        component="a"
                                        href="tel:+918660989586"
                                        startIcon={<PhoneIcon sx={{ color: '#F59E0B' }} />}
                                        sx={{
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            fontWeight: 700,
                                            px: 2.5,
                                            py: 1.4,
                                            borderRadius: 2.5,
                                            '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                            '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                        }}
                                    >
                                        Call 24/7 Desk
                                    </Button>
                                </Stack>

                                {/* Jump Direct to Service */}
                                <Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1.2 }}>
                                        Quick Service Directory:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                        {[
                                            { name: '🛵 Bikes (₹350)', href: '#service-bikes', color: '#F59E0B' },
                                            { name: '🚖 Cabs', href: '#service-cabs', color: '#0284C7' },
                                            { name: '🏡 Stays', href: '#service-homestays', color: '#E11D48' },
                                            { name: '🚤 Boating', href: '#service-boating', color: '#059669' },
                                            { name: '🤿 Scuba', href: '#service-scuba', color: '#6366F1' },
                                            { name: '🗺️ Guides', href: '#service-guide', color: '#D97706' },
                                            { name: '🌴 Combos', href: '#service-tours', color: '#8B5CF6' },
                                        ].map((pill, idx) => (
                                            <Button
                                                key={idx}
                                                component="a"
                                                href={pill.href}
                                                size="small"
                                                sx={{
                                                    py: 0.5,
                                                    px: 1.4,
                                                    borderRadius: 9999,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                    color: isDark ? '#F1F5F9' : '#1E293B',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                                    fontWeight: 700,
                                                    fontSize: '0.78rem',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                                        borderColor: pill.color,
                                                    },
                                                    '&:focus-visible': {
                                                        outline: '3px solid #F59E0B',
                                                        outlineOffset: '2px',
                                                    },
                                                }}
                                            >
                                                {pill.name}
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Right Column: Interactive Service Explorer Card */}
                            <Grid size={{ xs: 12, lg: 5 }}>
                                <Card
                                    sx={{
                                        borderRadius: 4.5,
                                        bgcolor: isDark ? 'rgba(26, 34, 53, 0.92)' : '#FFFFFF',
                                        backdropFilter: 'blur(20px)',
                                        border: isDark ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1.5px solid #FDE68A',
                                        boxShadow: isDark
                                            ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)'
                                            : '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 4px 16px -2px rgba(245, 158, 11, 0.1)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Card Top Title Bar */}
                                    <Box
                                        sx={{
                                            p: 2.5,
                                            pb: 2,
                                            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.2 }}>
                                                Quick Service Explorer
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>
                                                Select a service for instant rates & booking
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label="Live Desk"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(16, 185, 129, 0.15)',
                                                color: '#10B981',
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                            }}
                                        />
                                    </Box>

                                    {/* Interactive 6-Service Selector Tiles */}
                                    <Box sx={{ p: 2.5, pb: 1.5 }}>
                                        <Grid container spacing={1}>
                                            {[
                                                { key: 'bikes', label: 'Bikes & Scooters', icon: <TwoWheelerIcon sx={{ fontSize: 18 }} /> },
                                                { key: 'cabs', label: 'Coastal Cabs', icon: <LocalTaxiIcon sx={{ fontSize: 18 }} /> },
                                                { key: 'boating', label: 'River Boating', icon: <DirectionsBoatIcon sx={{ fontSize: 18 }} /> },
                                                { key: 'scuba', label: 'Netrani Scuba', icon: <ScubaDivingIcon sx={{ fontSize: 18 }} /> },
                                                { key: 'homestays', label: 'Coastal Stays', icon: <HomeWorkIcon sx={{ fontSize: 18 }} /> },
                                                { key: 'tours', label: 'Vacation Combos', icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} /> },
                                            ].map((tile) => {
                                                const isSelected = selectedHeroService === tile.key;
                                                return (
                                                    <Grid key={tile.key} size={{ xs: 4, sm: 4 }}>
                                                        <Button
                                                            fullWidth
                                                            onClick={() => setSelectedHeroService(tile.key)}
                                                            sx={{
                                                                p: 1.1,
                                                                borderRadius: 2.5,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                bgcolor: isSelected
                                                                    ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7')
                                                                    : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC'),
                                                                border: isSelected
                                                                    ? '1.5px solid #F59E0B'
                                                                    : (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'),
                                                                color: isSelected
                                                                    ? (isDark ? '#FBBF24' : '#B45309')
                                                                    : (isDark ? '#CBD5E1' : '#475569'),
                                                                textTransform: 'none',
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                                                                    borderColor: '#F59E0B',
                                                                },
                                                            }}
                                                        >
                                                            {tile.icon}
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontSize: '0.74rem',
                                                                    fontWeight: isSelected ? 850 : 600,
                                                                    lineHeight: 1.15,
                                                                    textAlign: 'center',
                                                                }}
                                                            >
                                                                {tile.label}
                                                            </Typography>
                                                        </Button>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>

                                    {/* Dynamic Active Service Preview Box */}
                                    {heroServicePreviews[selectedHeroService] && (() => {
                                        const active = heroServicePreviews[selectedHeroService];
                                        return (
                                            <Box sx={{ p: 2.5, pt: 1 }}>
                                                <Box
                                                    sx={{
                                                        borderRadius: 3,
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                        height: 150,
                                                        mb: 2,
                                                        border: `1.5px solid ${active.color}40`,
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={active.image}
                                                        alt={active.title}
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%)',
                                                        }}
                                                    />
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 10,
                                                            left: 12,
                                                            right: 12,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'flex-end',
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                {active.badge}
                                                            </Typography>
                                                            <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 900, lineHeight: 1.2 }}>
                                                                {active.title}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={active.rate}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'rgba(15, 23, 42, 0.9)',
                                                                backdropFilter: 'blur(10px)',
                                                                color: '#FFFFFF',
                                                                fontWeight: 900,
                                                                fontSize: '0.74rem',
                                                                border: `1px solid ${active.color}`,
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* Feature checklist */}
                                                <Stack spacing={0.7} sx={{ mb: 2.5 }}>
                                                    {active.perks.map((p, pIdx) => (
                                                        <Box key={pIdx} sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
                                                            <CheckCircleIcon sx={{ fontSize: 15, color: active.color, flexShrink: 0 }} />
                                                            <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600, fontSize: '0.8rem' }}>
                                                                {p}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>

                                                {/* Action Buttons for Selected Service */}
                                                <Stack direction="row" spacing={1.5}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        onClick={() => handleOpenBooking(selectedHeroService)}
                                                        sx={{
                                                            bgcolor: active.color,
                                                            color: active.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                                            fontWeight: 850,
                                                            py: 1.1,
                                                            borderRadius: 2,
                                                            fontSize: '0.88rem',
                                                            textTransform: 'none',
                                                            boxShadow: `0 6px 18px -2px ${active.color}45`,
                                                            '&:hover': {
                                                                bgcolor: active.color,
                                                                filter: 'brightness(0.92)',
                                                            },
                                                            '&:focus-visible': {
                                                                outline: '3px solid #F59E0B',
                                                                outlineOffset: '2px',
                                                            },
                                                        }}
                                                    >
                                                        Book / Inquire Slot
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        component={Link}
                                                        href={active.href}
                                                        sx={{
                                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                                            fontWeight: 700,
                                                            fontSize: '0.84rem',
                                                            px: 2,
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            whiteSpace: 'nowrap',
                                                            '&:hover': {
                                                                borderColor: active.color,
                                                                bgcolor: `${active.color}12`,
                                                            },
                                                            '&:focus-visible': {
                                                                outline: '3px solid #F59E0B',
                                                                outlineOffset: '2px',
                                                            },
                                                        }}
                                                    >
                                                        View Rates →
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        );
                                    })()}

                                    {/* Card Footer Trust Strip */}
                                    <Box
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                                            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 600, fontSize: '0.74rem' }}>
                                            ✓ Direct Operator Rates
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 600, fontSize: '0.74rem' }}>
                                            ✓ Free Station Delivery
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 600, fontSize: '0.74rem' }}>
                                            ✓ 24/7 Helpline
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Hero Stats & Local Reliability Bar */}
                        <Box
                            sx={{
                                mt: { xs: 5, md: 7 },
                                p: { xs: 2.5, md: 3 },
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                boxShadow: isDark ? 'none' : '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
                            }}
                        >
                            <Grid container spacing={3}>
                                {[
                                    { value: '19+ Fleet', title: 'Two-Wheelers & Cabs', desc: 'Activa 6G, Classic 350, Dzire & Ertiga ready' },
                                    { value: '< 5 Mins', title: 'Station Exit Handover', desc: 'Platform 1 delivery as your Konkan train arrives' },
                                    { value: '100% Certified', title: 'PADI & Boat Captains', desc: 'Lifejackets & certified gear on all water safaris' },
                                    { value: '10,000+', title: 'Happy Explorers', desc: '5.0★ Google rating with 324+ verified tourist reviews' },
                                ].map((stat, sIdx) => (
                                    <Grid key={sIdx} size={{ xs: 6, md: 3 }}>
                                        <Box
                                            sx={{
                                                textAlign: { xs: 'left', sm: 'center' },
                                                borderRight: { md: sIdx < 3 ? (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0') : 'none' },
                                                pr: { md: 2 },
                                            }}
                                        >
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    fontWeight: 950,
                                                    fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2rem' },
                                                    color: '#F59E0B',
                                                    lineHeight: 1.1,
                                                    mb: 0.5,
                                                }}
                                            >
                                                {stat.value}
                                            </Typography>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 800,
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                    fontSize: '0.88rem',
                                                    lineHeight: 1.2,
                                                    mb: 0.4,
                                                }}
                                            >
                                                {stat.title}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: isDark ? '#CBD5E1' : '#64748B',
                                                    fontWeight: 500,
                                                    fontSize: '0.76rem',
                                                    display: 'block',
                                                    lineHeight: 1.35,
                                                }}
                                            >
                                                {stat.desc}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. THE 7 SERVICES CATALOG (Exact Same Order & Modern 2026 Card Styling)
                       Order: Bikes -> Cabs -> Homestays -> Boating -> Scuba -> Guide -> Custom Tour Package
                ========================================================================== */}
                <Box
                    id="service-catalog"
                    component="section"
                    aria-labelledby="service-catalog-heading"
                    sx={{ maxWidth: '1240px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mt: { xs: 7, md: 10 } }}
                >
                    <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
                        <Chip
                            label="CURATED FOR COASTAL KARNATAKA"
                            sx={{
                                bgcolor: 'rgba(245, 158, 11, 0.12)',
                                color: '#F59E0B',
                                fontWeight: 850,
                                letterSpacing: '0.08em',
                                fontSize: '0.75rem',
                                mb: 1.5,
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                        />
                        <Typography
                            id="service-catalog-heading"
                            variant="h2"
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
                                maxWidth: 740,
                                mx: 'auto',
                                fontSize: { xs: '0.98rem', md: '1.1rem' },
                                lineHeight: 1.65,
                            }}
                        >
                            Explore dedicated live fleets, certified water activities, riverfront cottages, and local trail experts with zero deposit options and 100% transparent tariffs.
                        </Typography>
                    </Box>

                    {/* 7 Services Grid (Cards 1 to 6 in 3-column responsive grid, Card 7 as Flagship Widescreen Showcase) */}
                    <Grid container spacing={3.5}>
                        {services.map((srv) => (
                            <Grid key={srv.id} id={`service-${srv.id}`} size={{ xs: 12, sm: 6, lg: 4 }}>
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
                                                '&:focus-visible': {
                                                    outline: '3px solid #F59E0B',
                                                    outlineOffset: '2px',
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
                        <Grid id="service-tours" size={{ xs: 12 }}>
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
                                                alt="Custom Karavali Tour Packages in Honnavar"
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
                                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                                                color: isDark ? '#E2E8F0' : '#1E293B',
                                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                                                fontWeight: 700,
                                                                fontSize: '0.78rem',
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>

                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    component={Link}
                                                    href="/services/tours"
                                                    sx={{
                                                        bgcolor: '#8B5CF6',
                                                        color: '#FFFFFF',
                                                        fontWeight: 900,
                                                        px: 3.5,
                                                        py: 1.4,
                                                        borderRadius: 2.5,
                                                        fontSize: '0.96rem',
                                                        textTransform: 'none',
                                                        boxShadow: '0 8px 24px -3px rgba(139, 92, 246, 0.5)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        '&:hover': {
                                                            bgcolor: '#7C3AED',
                                                            boxShadow: '0 12px 28px -3px rgba(139, 92, 246, 0.7)',
                                                        },
                                                        '&:focus-visible': {
                                                            outline: '3px solid #F59E0B',
                                                            outlineOffset: '2px',
                                                        },
                                                    }}
                                                >
                                                    <span>View Packages & Customize Itinerary</span>
                                                    <ArrowForwardIcon className="tour-arrow" sx={{ fontSize: 18, transition: 'transform 0.3s ease' }} />
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleOpenBooking('tours')}
                                                    sx={{
                                                        py: 1.4,
                                                        px: 3,
                                                        borderRadius: 2.5,
                                                        borderColor: isDark ? 'rgba(139, 92, 246, 0.5)' : '#8B5CF6',
                                                        color: isDark ? '#DDD6FE' : '#6D28D9',
                                                        fontWeight: 800,
                                                        fontSize: '0.92rem',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(139, 92, 246, 0.1)',
                                                            borderColor: '#8B5CF6',
                                                        },
                                                        '&:focus-visible': {
                                                            outline: '3px solid #F59E0B',
                                                            outlineOffset: '2px',
                                                        },
                                                    }}
                                                >
                                                    Talk to Honnavar Trip Planner
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
                    3. WHY CHOOSE GK WHIZWHEEL (Core Differentiators)
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="why-choose-heading"
                    sx={{
                        maxWidth: '1240px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 9, md: 13 },
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Chip
                            label="THE GK WHIZWHEEL ADVANTAGE"
                            sx={{
                                bgcolor: 'rgba(16, 185, 129, 0.12)',
                                color: isDark ? '#34D399' : '#047857',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                fontSize: '0.75rem',
                                mb: 1.5,
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                        />
                        <Typography
                            id="why-choose-heading"
                            variant="h3"
                            component="h2"
                            sx={{ fontWeight: 950, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.025em', mb: 1.5 }}
                        >
                            Why Book All Your Services With GK WhizWheel?
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155', maxWidth: 680, mx: 'auto' }}>
                            We are not an anonymous aggregators platform. We own vehicles, coordinate directly with boat captains, and operate active physical hubs in Honnavar.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                icon: <TrainIcon sx={{ fontSize: 28 }} />,
                                color: '#F59E0B',
                                title: 'Dual Physical Pickup Hubs',
                                desc: 'Collect your rental bike or board your AC cab right at Honnavar Railway Station exit or our Palya Main Rd center in under 5 minutes.',
                            },
                            {
                                icon: <VerifiedUserIcon sx={{ fontSize: 28 }} />,
                                color: '#10B981',
                                title: '100% Verified Local Operators',
                                desc: 'PADI-certified scuba dive masters, licensed boat captains with lifejackets, and experienced commercial drivers who live locally.',
                            },
                            {
                                icon: <ShieldIcon sx={{ fontSize: 28 }} />,
                                color: '#0284C7',
                                title: 'Transparent Pricing Guarantee',
                                desc: 'Zero surge pricing, exact 24-hour block billing, transparent fuel terms, and security deposits returned within 2 hours of handover.',
                            },
                            {
                                icon: <SupportAgentIcon sx={{ fontSize: 28 }} />,
                                color: '#8B5CF6',
                                title: '24/7 Roadside & Trip Care',
                                desc: 'Flat tire or route change? Our local mobile team covers Honnavar, Kumta, Murudeshwar, and Gokarna around the clock.',
                            },
                        ].map((feature, fIdx) => (
                            <Grid key={fIdx} size={{ xs: 12, sm: 6, lg: 3 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3.5,
                                        height: '100%',
                                        borderRadius: 4,
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        transition: 'all 0.3s ease',
                                        boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            borderColor: feature.color,
                                            boxShadow: isDark ? `0 12px 30px -8px ${feature.color}25` : '0 12px 30px -8px rgba(15, 23, 42, 0.08)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 3,
                                            bgcolor: `${feature.color}15`,
                                            border: `1.5px solid ${feature.color}35`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: feature.color,
                                            mb: 2.5,
                                        }}
                                    >
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1, fontSize: '1.1rem' }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.65 }}>
                                        {feature.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    4. POPULAR KARAVALI DAY TRIPS & COMBO PACKAGES
                ========================================================================== */}
                <Box
                    id="combos"
                    component="section"
                    aria-labelledby="combos-heading"
                    sx={{
                        maxWidth: '1240px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 9, md: 13 },
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Chip
                            label="READY-MADE ITINERARY BUNDLES"
                            sx={{
                                bgcolor: 'rgba(139, 92, 246, 0.12)',
                                color: isDark ? '#C4B5FD' : '#6D28D9',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                fontSize: '0.75rem',
                                mb: 1.5,
                                border: '1px solid rgba(139, 92, 246, 0.25)',
                            }}
                        />
                        <Typography
                            id="combos-heading"
                            variant="h3"
                            component="h2"
                            sx={{ fontWeight: 950, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.025em', mb: 1.5 }}
                        >
                            Popular Day Trips & Combo Packages
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155', maxWidth: 680, mx: 'auto' }}>
                            Bundle vehicle rental with boating, scuba, or stays and enjoy an automatic 10% discount on combined bookings.
                        </Typography>
                    </Box>

                    <Grid container spacing={3.5}>
                        {combos.map((combo, cIdx) => (
                            <Grid key={cIdx} size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: { xs: 3, sm: 4 },
                                        height: '100%',
                                        borderRadius: 4,
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            borderColor: combo.color,
                                            boxShadow: isDark
                                                ? `0 16px 36px -8px ${combo.color}25`
                                                : '0 16px 36px -8px rgba(15, 23, 42, 0.08)',
                                            transform: 'translateY(-4px)',
                                        },
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                            <Chip
                                                label={combo.badge}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${combo.color}18`,
                                                    color: combo.color,
                                                    fontWeight: 800,
                                                    fontSize: '0.72rem',
                                                    border: `1px solid ${combo.color}35`,
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.4,
                                                    borderRadius: 9999,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                                    color: isDark ? '#CBD5E1' : '#334155',
                                                    fontWeight: 700,
                                                    fontSize: '0.76rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                }}
                                            >
                                                <AccessTimeIcon sx={{ fontSize: 14, color: combo.color }} />
                                                {combo.duration}
                                            </Box>
                                        </Box>

                                        <Typography variant="h5" component="h3" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1, lineHeight: 1.25 }}>
                                            {combo.title}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', mb: 2.5, lineHeight: 1.6 }}>
                                            {combo.description}
                                        </Typography>

                                        <Typography variant="caption" sx={{ color: combo.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
                                            Package Inclusions:
                                        </Typography>
                                        <Stack spacing={0.8} sx={{ mb: 3 }}>
                                            {combo.items.map((inc, iIdx) => (
                                                <Box key={iIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 16, color: combo.color, flexShrink: 0 }} />
                                                    <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600 }}>
                                                        {inc}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', display: 'block', fontWeight: 600 }}>
                                                Combo Rate (Save 10%)
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: combo.color, lineHeight: 1.1 }}>
                                                {combo.price}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleOpenBooking(combo.serviceId)}
                                            sx={{
                                                bgcolor: combo.color,
                                                color: combo.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                                fontWeight: 800,
                                                px: 3,
                                                py: 1,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: combo.color,
                                                    filter: 'brightness(0.9)',
                                                },
                                                '&:focus-visible': {
                                                    outline: '3px solid #F59E0B',
                                                    outlineOffset: '2px',
                                                },
                                            }}
                                        >
                                            Book This Combo
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    5. CREATIVE HOW BOOKING WORKS ROADMAP TIMELINE
                ========================================================================== */}
                <Box
                    id="how-it-works"
                    component="section"
                    aria-labelledby="how-it-works-heading"
                    sx={{
                        maxWidth: '1240px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 9, md: 13 },
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
                        <Chip
                            label="EFFORTLESS 4-STEP JOURNEY"
                            sx={{
                                bgcolor: 'rgba(245, 158, 11, 0.12)',
                                color: '#F59E0B',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                fontSize: '0.75rem',
                                mb: 1.5,
                            }}
                        />
                        <Typography
                            id="how-it-works-heading"
                            variant="h3"
                            component="h2"
                            sx={{ fontWeight: 950, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.025em', mb: 1.5 }}
                        >
                            How Booking Works Across All Services
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155', maxWidth: 640, mx: 'auto' }}>
                            A connected, transparent booking pipeline ensuring zero delays from the moment you plan until you return home.
                        </Typography>
                    </Box>

                    {/* Timeline Container */}
                    <Box sx={{ position: 'relative' }}>
                        {/* Desktop Connector Line */}
                        <Box
                            sx={{
                                display: { xs: 'none', md: 'block' },
                                position: 'absolute',
                                top: 56,
                                left: '12%',
                                right: '12%',
                                height: 3,
                                background: 'linear-gradient(90deg, #F59E0B 0%, #0284C7 33%, #059669 66%, #8B5CF6 100%)',
                                zIndex: 0,
                                opacity: 0.6,
                            }}
                        />

                        <Grid container spacing={3}>
                            {[
                                {
                                    step: '01',
                                    title: 'Choose Service or Combo',
                                    desc: 'Pick your preferred ride (Activa, Classic 350, AC Cab), river boat cruise, scuba dive, or custom vacation package.',
                                    color: '#F59E0B',
                                    badge: '⚡ Real-Time Fleet',
                                },
                                {
                                    step: '02',
                                    title: 'Digital KYC & Fair Quote',
                                    desc: 'Enter your travel dates, verify license or ID proof online in 60 seconds, and receive an itemized, upfront price breakdown.',
                                    color: '#0284C7',
                                    badge: '🔒 Confirmed < 60s',
                                },
                                {
                                    step: '03',
                                    title: 'Station or Jetty Meetup',
                                    desc: 'Our team greets you directly outside Honnavar Railway Station or at the boat jetty with pre-inspected keys and sanitised helmets.',
                                    color: '#059669',
                                    badge: '🚉 Dual Station Hub',
                                },
                                {
                                    step: '04',
                                    title: 'Explore with 24/7 Care',
                                    desc: 'Enjoy scenic coastal highways backed by our continuous roadside support, insider beach tips, and instant return inspection.',
                                    color: '#8B5CF6',
                                    badge: '🤝 Dedicated Care',
                                },
                            ].map((st, sIdx) => (
                                <Grid key={sIdx} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            position: 'relative',
                                            zIndex: 1,
                                            p: 3.5,
                                            height: '100%',
                                            borderRadius: 4,
                                            bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            transition: 'transform 0.3s ease, border-color 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                borderColor: st.color,
                                                boxShadow: isDark ? `0 14px 30px -6px ${st.color}30` : '0 12px 28px -6px rgba(15, 23, 42, 0.08)',
                                            },
                                        }}
                                    >
                                        {/* Floating Circular Step Orb */}
                                        <Box
                                            sx={{
                                                width: 58,
                                                height: 58,
                                                borderRadius: '50%',
                                                bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                                                border: `3px solid ${st.color}`,
                                                color: st.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 900,
                                                fontSize: '1.25rem',
                                                mb: 2,
                                                boxShadow: `0 0 20px ${st.color}40`,
                                            }}
                                        >
                                            {st.step}
                                        </Box>

                                        <Chip
                                            label={st.badge}
                                            size="small"
                                            sx={{
                                                bgcolor: `${st.color}15`,
                                                color: st.color,
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                mb: 1.5,
                                                border: `1px solid ${st.color}30`,
                                            }}
                                        />

                                        <Typography variant="h6" component="h3" sx={{ fontWeight: 850, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1.2, fontSize: '1.05rem', lineHeight: 1.3 }}>
                                            {st.title}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.6, fontSize: '0.86rem' }}>
                                            {st.desc}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    6. TRAVEL DISTANCE & COVERAGE MATRIX FROM HONNAVAR
                ========================================================================== */}
                <Box
                    id="coverage"
                    component="section"
                    aria-labelledby="coverage-heading"
                    sx={{
                        maxWidth: '1240px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 9, md: 13 },
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Chip
                            label="COASTAL KARNATAKA CONNECTIVITY"
                            sx={{
                                bgcolor: 'rgba(2, 132, 199, 0.12)',
                                color: '#0284C7',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                fontSize: '0.75rem',
                                mb: 1.5,
                                border: '1px solid rgba(2, 132, 199, 0.25)',
                            }}
                        />
                        <Typography
                            id="coverage-heading"
                            variant="h3"
                            component="h2"
                            sx={{ fontWeight: 950, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.025em', mb: 1.5 }}
                        >
                            Distances from GK WhizWheel Honnavar Hub
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155', maxWidth: 640, mx: 'auto' }}>
                            Honnavar is the central gateway to Uttara Kannada. Plan your travel easily with our quick transit guide.
                        </Typography>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.04)',
                        }}
                    >
                        <Grid container>
                            {distances.map((dst, dIdx) => (
                                <Grid
                                    key={dIdx}
                                    size={{ xs: 12, sm: 6, md: 3 }}
                                    sx={{
                                        p: 3,
                                        borderRight: { sm: dIdx % 2 !== 1 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9') : 'none', md: dIdx % 4 !== 3 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9') : 'none' },
                                        borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: dIdx < 4 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9') : 'none' },
                                        transition: 'background-color 0.2s ease',
                                        '&:hover': {
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.04)' : '#FFFBEB',
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            {dst.destination}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0284C7' }}>
                                            {dst.distance}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 600 }}>
                                            • {dst.time}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', display: 'block', fontWeight: 500 }}>
                                        {dst.mode}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Box>

                {/* =========================================================================
                    7. FREQUENTLY ASKED QUESTIONS (Complete Services FAQ)
                ========================================================================== */}
                <Box
                    id="faq"
                    component="section"
                    aria-labelledby="faq-heading"
                    sx={{
                        maxWidth: '920px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 9, md: 13 },
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Chip
                            label="CLARITY FIRST"
                            sx={{
                                bgcolor: 'rgba(245, 158, 11, 0.12)',
                                color: '#F59E0B',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                fontSize: '0.75rem',
                                mb: 1.5,
                            }}
                        />
                        <Typography
                            id="faq-heading"
                            variant="h3"
                            component="h2"
                            sx={{ fontWeight: 950, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.025em', mb: 1.5 }}
                        >
                            Frequently Asked Questions
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                            Everything you need to know about booking vehicles, private cabs, boat cruises, scuba diving, and stays in Honnavar.
                        </Typography>
                    </Box>

                    <Box>
                        {[
                            {
                                q: 'Can I pick up my rental bike or taxi at Honnavar Railway Station?',
                                a: 'Yes! We maintain an active Station Desk on Station Road. When you reserve online or via WhatsApp, simply provide your train number and arrival time. Our executive meets you right outside the platform with your vehicle keys and helmets in under 5 minutes.',
                            },
                            {
                                q: 'What documents are required for two-wheelers vs. cabs and activities?',
                                a: 'For two-wheeler self-drive rentals, you need an original valid Indian Driving License and one government ID proof (Aadhaar or Passport). For cabs, boat cruises, scuba diving, and homestays, only standard government ID verification is needed. Digital KYC can be completed in advance.',
                            },
                            {
                                q: 'Can I combine multiple services into an All-in-One Vacation Package?',
                                a: 'Yes! With our custom Karavali Vacation Packages, you can bundle bikes or cabs + riverfront homestay + Sharavathi sunset cruise + Netrani scuba diving into one seamless itinerary. All combo bookings receive a 10% package discount and a dedicated trip coordinator.',
                            },
                            {
                                q: 'Can beginners or non-swimmers participate in Netrani Scuba Diving?',
                                a: 'Absolutely! Our Netrani Island scuba expeditions are conducted 1:1 with certified PADI dive masters. Non-swimmers and first-time divers are fully welcome. Packages include safety briefing, complete gear, life jacket, boat transfer, and free underwater 4K GoPro videos.',
                            },
                            {
                                q: 'What are the timing options for Sharavathi Backwater Boating?',
                                a: 'Boats operate daily between 08:00 AM and 06:00 PM from our Honnavar jetty. The most popular cruise is the 04:30 PM Golden Sunset Estuary Cruise, where you can watch the sun sink into the Arabian Sea while gliding past mangrove islands. Prior booking is recommended on weekends.',
                            },
                            {
                                q: 'How are payments, security deposits, and refunds processed?',
                                a: 'We believe in 100% transparent pricing with zero surprise charges. Security deposits (for two-wheeler rentals) are refundable and credited directly back to your UPI or bank account within 2 hours of vehicle return following a quick inspection. All bookings can be initiated online.',
                            },
                        ].map((faqItem, qIdx) => (
                            <Accordion
                                key={qIdx}
                                defaultExpanded={qIdx === 0}
                                sx={{
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                    mb: 2,
                                    borderRadius: '14px !important',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                                        {faqItem.q}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7, fontSize: '0.92rem' }}>
                                        {faqItem.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Box>

                {/* =========================================================================
                    8. BOTTOM MASTER CTA PORTAL BANNER (All Services Portal)
                ========================================================================== */}
                <Box
                    id="cta-section"
                    component="section"
                    aria-labelledby="services-cta-heading"
                    sx={{
                        maxWidth: '1240px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        mt: { xs: 10, md: 14 },
                    }}
                >
                    <Box
                        sx={{
                            p: { xs: 4, sm: 6, md: 7 },
                            borderRadius: { xs: 4, md: 6 },
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.98) 55%, rgba(2, 132, 199, 0.18) 100%)'
                                : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 50%, #F0F9FF 100%)',
                            border: isDark ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1.5px solid #FDE68A',
                            boxShadow: isDark
                                ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                : '0 25px 60px -15px rgba(245, 158, 11, 0.15), 0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Status Chip */}
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                                icon={<VerifiedUserIcon sx={{ fontSize: '15px !important', color: '#10B981 !important' }} />}
                                label="Honnavar's Premier Multi-Service Travel Fleet"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                                    color: isDark ? '#34D399' : '#047857',
                                    fontWeight: 800,
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                            />
                        </Box>

                        {/* Title */}
                        <Typography
                            id="services-cta-heading"
                            variant="h3"
                            component="h2"
                            sx={{
                                fontWeight: 950,
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                letterSpacing: '-0.03em',
                                fontSize: { xs: '1.85rem', sm: '2.4rem', md: '2.9rem' },
                                mb: 2,
                                lineHeight: 1.2,
                            }}
                        >
                            Ready to Experience Honnavar & the Karavali Coast?
                        </Typography>

                        {/* Description */}
                        <Typography
                            variant="body1"
                            sx={{
                                color: isDark ? '#CBD5E1' : '#334155',
                                maxWidth: 760,
                                mx: 'auto',
                                mb: 3.5,
                                fontSize: { xs: '0.98rem', md: '1.1rem' },
                                lineHeight: 1.7,
                            }}
                        >
                            From self-drive bikes starting ₹350/day to airport taxi transfers, serene Sharavathi riverfront cottages, mangrove boating, and Netrani coral diving — we coordinate your entire holiday with zero hassle.
                        </Typography>

                        {/* Service Pills Quick Access */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: 1,
                                mb: 4,
                                maxWidth: 900,
                                mx: 'auto',
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
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B' }}>•</Typography>
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
                                    5.0★ Google Reviews
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
                                variant="contained"
                                size="large"
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20inquire%20about%20your%20Honnavar%20travel%20services%20(Bikes,%20Cabs,%20Stays,%20Boating,%20Scuba,%20Tours)."
                                target="_blank"
                                rel="noreferrer"
                                startIcon={<WhatsAppIcon sx={{ color: '#FFFFFF' }} />}
                                sx={{
                                    py: 1.6,
                                    px: 3.5,
                                    bgcolor: '#16A34A',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    borderRadius: 2.5,
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': { bgcolor: '#15803D' },
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
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
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
            </Box>

            {/* Universal Booking / Inquiry Modal */}
            <ServiceBookingModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                initialServiceId={activeServiceId}
            />
        </AppLayout>
    );
}

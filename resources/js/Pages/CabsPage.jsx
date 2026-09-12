import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@inertiajs/react';
import PageHead from '../Components/SEO/PageHead';
import AppLayout from '../Layouts/AppLayout';
import CabsBookingModal from '../Components/BookingModals/CabsBookingModal';
import ServiceGalleryModal, { getServiceItemMedia } from '../Components/ServiceGalleryModal';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
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
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import NavigationIcon from '@mui/icons-material/Navigation';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SecurityIcon from '@mui/icons-material/Security';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import TrainIcon from '@mui/icons-material/Train';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';
import WaterIcon from '@mui/icons-material/Water';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import AcUnitIcon from '@mui/icons-material/AcUnit';

// Preset standard popular cab tour routes with fixed transparent tariffs
const POPULAR_CAB_ROUTES = [
    {
        title: 'Jog Falls Day Trip & Sharavathi Valley',
        destination: 'Jog Falls (Gersoppa)',
        distance: '60 km each way (140 km round trip)',
        duration: 'Full Day (8 - 10 Hours)',
        sedanRate: '₹3,200',
        suvRate: '₹4,500',
        tempoRate: '₹7,500',
        highlights: 'Highest plunge falls in India, British era viewpoint, Sharavathi hanging bridge & lush Western Ghats vistas.',
        bestTime: 'Morning 8:00 AM Departure',
        tag: 'Most Popular Day Tour',
        icon: <WaterIcon sx={{ color: '#0284C7' }} />,
    },
    {
        title: 'Murudeshwar Shiva Temple & Scuba Jetty',
        destination: 'Murudeshwar Beach & Temple',
        distance: '27 km each way (60 km round trip)',
        duration: 'Half Day (4 - 5 Hours)',
        sedanRate: '₹2,200',
        suvRate: '₹3,200',
        tempoRate: '₹5,500',
        highlights: '123-ft colossal Shiva statue, 18-storey Raja Gopura with lift, beach water sports & morning Netrani scuba boat boarding.',
        bestTime: 'Early Morning / Evening Sunset',
        tag: 'Temple & Scuba Express',
        icon: <TempleHinduIcon sx={{ color: '#F59E0B' }} />,
    },
    {
        title: 'Gokarna Beach Circuit & Mirjan Fort',
        destination: 'Gokarna & Mirjan',
        distance: '48 km each way (110 km round trip)',
        duration: 'Full Day (8 Hours)',
        sedanRate: '₹2,800',
        suvRate: '₹4,000',
        tempoRate: '₹6,800',
        highlights: 'Om Beach, Kudle Beach cliff walks, Mahabaleshwar Temple Atmalinga & 16th-century laterite stone Mirjan Fort.',
        bestTime: 'Depart 9:00 AM',
        tag: 'Top Coastal Circuit',
        icon: <NavigationIcon sx={{ color: '#10B981' }} />,
    },
    {
        title: 'Yana Caves & Vibhooti Falls Safari',
        destination: 'Yana Rocks & Falls',
        distance: '50 km each way (120 km round trip)',
        duration: 'Full Day (7 - 9 Hours)',
        sedanRate: '₹3,200',
        suvRate: '₹4,400',
        tempoRate: '₹7,200',
        highlights: 'Massive Karst limestone black rock monoliths, shaded rainforest trek, and natural jungle plunge pool dipping.',
        bestTime: 'Morning 8:30 AM',
        tag: 'Adventure & Trekking',
        icon: <SpeedIcon sx={{ color: '#8B5CF6' }} />,
    },
    {
        title: 'Goa Airport (Dabolim / Mopa) Drop or Pickup',
        destination: 'Goa International Airports',
        distance: '165 - 195 km one-way',
        duration: '3.5 - 4.5 Hours on NH-66',
        sedanRate: '₹4,200',
        suvRate: '₹5,800',
        tempoRate: '₹9,500',
        highlights: 'Direct door-to-terminal highway transfer via scenic Karwar & South Goa NH-66 bypass with zero luggage stress.',
        bestTime: '24/7 Schedule Matching Flight',
        tag: 'Interstate Airport Transfer',
        icon: <FlightTakeoffIcon sx={{ color: '#0284C7' }} />,
    },
    {
        title: 'Mangalore International Airport (IXE) Drop',
        destination: 'Mangalore (Bajpe) Airport',
        distance: '175 km one-way',
        duration: '3.5 - 4 Hours on 4-Lane NH-66',
        sedanRate: '₹4,400',
        suvRate: '₹6,000',
        tempoRate: '₹9,800',
        highlights: 'Smooth 4-lane coastal highway cruise via Bhatkal, Kundapura & Udupi. Punctual airport terminal drop-off guaranteed.',
        bestTime: '24/7 Available for Flights',
        tag: 'Express Airport Link',
        icon: <FlightTakeoffIcon sx={{ color: '#EC4899' }} />,
    },
];

// Fare chart for per-km outstation trips
const OUTSTATION_FARE_MATRIX = [
    {
        vehicle: 'Maruti Suzuki Dzire AC',
        category: 'Sedan (4+1 Seater)',
        perKm: '₹12 / km',
        minKmPerDay: '250 km / day',
        driverBatta: '₹400 / day',
        tollParking: 'At Actuals',
        idealFor: 'Couples, solo executives & small families (up to 4 pax + 2 bags)',
    },
    {
        vehicle: 'Maruti Suzuki Ertiga AC',
        category: 'Compact MUV (6+1 Seater)',
        perKm: '₹15 / km',
        minKmPerDay: '250 km / day',
        driverBatta: '₹450 / day',
        tollParking: 'At Actuals',
        idealFor: 'Families of 5-6 pax seeking extra legroom and roof luggage space',
    },
    {
        vehicle: 'Toyota Innova Crysta AC',
        category: 'Premium SUV (7+1 Seater)',
        perKm: '₹18 / km',
        minKmPerDay: '300 km / day',
        driverBatta: '₹500 / day',
        tollParking: 'At Actuals',
        idealFor: 'VIP comfort, ghat road smoothness, executive groups & long tours',
    },
    {
        vehicle: 'Force Tempo Traveller AC',
        category: 'Group Van (12+1 Seater)',
        perKm: '₹24 / km',
        minKmPerDay: '300 km / day',
        driverBatta: '₹600 / day',
        tollParking: 'At Actuals',
        idealFor: 'Extended family reunions, college groups & wedding guest shuttles',
    },
];

// Distance Guide from Honnavar Hubs
const HONNAVAR_DISTANCES = [
    { destination: 'Honnavar Railway Station', distance: '0 km', time: 'Direct Platform Handover', mode: 'Dedicated Meet & Greet' },
    { destination: 'Sharavathi River Boating Jetty', distance: '1.5 km', time: '5 Mins', mode: 'Local City Transfer' },
    { destination: 'Kasarkod Eco Beach & Boardwalk', distance: '4.2 km', time: '10 Mins', mode: 'Short Coastal Hop' },
    { destination: 'Apsarakonda Falls & Hill View', distance: '6.5 km', time: '15 Mins', mode: 'Coastal Shortcut' },
    { destination: 'Mirjan Historic Fort', distance: '21 km', time: '22 Mins', mode: 'NH-66 Highway Cruise' },
    { destination: 'Murudeshwar Shiva Temple & Beach', distance: '27 km', time: '35 Mins', mode: 'NH-66 South Corridor' },
    { destination: 'Gokarna Om Beach & Mahabaleshwar', distance: '48 km', time: '50 Mins', mode: 'NH-66 North Corridor' },
];

const CAB_FAQS = [
    {
        q: 'How does the Honnavar Railway Station cab pickup work?',
        a: 'We have a dedicated dispatch hub at Honnavar Railway Station (Platform 1 exit). When your train arrives, your chauffeur waits right outside the exit gate holding a welcome name board. There is zero waiting time, and our team helps with your luggage.',
    },
    {
        q: 'Can I book a full-day cab to visit Jog Falls, Gerusoppa, and Sharavathi Valley?',
        a: 'Yes! Jog Falls is one of our most popular day excursions (60 km each way). Our fixed-rate round-trip package covers pickup from Honnavar, scenic stops at Gerusoppa & Sharavathi hanging bridge, all viewpoints at Jog Falls, and drop back in the evening.',
    },
    {
        q: 'Do you provide 7-seater vehicles like Toyota Innova Crysta or Maruti Ertiga?',
        a: 'Yes! We maintain an extensive fleet of Maruti Ertiga and luxury Toyota Innova Crysta vehicles, featuring dual chilled AC, captain seats, and generous luggage boot space ideal for family groups.',
    },
    {
        q: 'What if my train arrives late at night or early morning (e.g., 3:00 AM)?',
        a: 'Our Honnavar station cab desk operates 24x7. We track your Konkan Railway PNR or train status live to ensure your driver is on standby even if the train is delayed by several hours.',
    },
    {
        q: 'Are there any hidden charges, waiting fees, or peak surge pricing?',
        a: 'Never. At GK WhizWheels, all cab tariffs are fixed and transparent with zero dynamic surge pricing. You only pay the pre-agreed fare plus actual toll/parking receipts.',
    },
    {
        q: 'Can we book a cab for a drop to Goa Airport (Dabolim / Mopa) or Mangalore Airport?',
        a: 'Yes! We operate direct airport transfers to both Goa airports (Dabolim & Mopa) and Mangalore International Airport with verified highway drivers experienced in Konkan NH-66 travel.',
    },
    {
        q: 'How far are major tourist spots and transit hubs from Honnavar? (Distance & Travel Time Matrix)',
        a: 'Accurate driving times and distances by cab from Honnavar Railway Station and central town hubs:',
    },
];

const cabFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CAB_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
        },
    })),
};

export default function CabsPage({ availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [modalOpen, setModalOpen] = useState(false);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedVehicleForGallery, setSelectedVehicleForGallery] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [tripType, setTripType] = useState('outstation'); // 'station', 'daytrip', 'outstation', 'airport'
    const [showTariffTable, setShowTariffTable] = useState(false);

    // Interactive Instant Fare Estimator State
    const [calcServiceType, setCalcServiceType] = useState('outstation');
    const [calcVehicle, setCalcVehicle] = useState('sedan');
    const [calcTrip, setCalcTrip] = useState('round');
    const [calcDistance, setCalcDistance] = useState(150);
    const [calcDays, setCalcDays] = useState(1);

    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155';
    const mutedTextColor = isDark ? '#94A3B8' : '#64748B';
    const cardBgColor = isDark ? '#111827' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

    // Estimated fare calculation logic
    const estimatedFare = useMemo(() => {
        let ratePerKm = 12;
        let driverBattaPerDay = 400;

        if (calcVehicle === 'ertiga') {
            ratePerKm = 15;
            driverBattaPerDay = 450;
        } else if (calcVehicle === 'innova') {
            ratePerKm = 18;
            driverBattaPerDay = 500;
        } else if (calcVehicle === 'tempo') {
            ratePerKm = 24;
            driverBattaPerDay = 600;
        }

        const effectiveKm = calcTrip === 'round' ? Math.max(calcDistance * 2, calcDays * 250) : Math.max(calcDistance, 250);
        const kmCost = effectiveKm * ratePerKm;
        const driverCost = calcDays * driverBattaPerDay;
        const total = kmCost + driverCost;

        return {
            ratePerKm,
            effectiveKm,
            kmCost,
            driverCost,
            total,
        };
    }, [calcVehicle, calcTrip, calcDistance, calcDays]);

    // Filter available DB items
    const filteredVehicles = useMemo(() => {
        if (!availableItems || availableItems.length === 0) return [];
        if (selectedCategory === 'All') return availableItems;
        return availableItems.filter((item) => {
            if (selectedCategory === 'Sedan') return item.name.toLowerCase().includes('sedan') || item.name.toLowerCase().includes('dzire');
            if (selectedCategory === 'SUV') return item.name.toLowerCase().includes('innova') || item.name.toLowerCase().includes('suv') || item.name.toLowerCase().includes('ertiga');
            if (selectedCategory === 'Group') return item.name.toLowerCase().includes('tempo') || item.name.toLowerCase().includes('traveller');
            return true;
        });
    }, [availableItems, selectedCategory]);

    return (
        <AppLayout>
            <PageHead
                title="Honnavar Taxi Service & AC Cab Rentals | Station Pickup – GK WhizWheel"
                description="Hire verified AC cabs & taxis in Honnavar starting ₹12/km or ₹1,400/day. Station pickup, Innova Crysta, Dzire, outstation trips to Gokarna, Jog Falls & Goa."
                canonicalUrl="https://whizwheels.in/services/cabs"
                ogImage="/images/services/four_wheelers.jpg"
                ogType="website"
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: 'Honnavar AC Cab & Taxi Rental Service',
                        description: 'Reliable chauffeur-driven taxi service in Honnavar with railway station transfers, full-day sightseeing, and outstation trips across Karnataka and Goa.',
                        category: 'Taxi & Cab Rental',
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'INR',
                            lowPrice: '1400',
                            highPrice: '6000',
                            offerCount: '6',
                            price: '1400',
                        },
                        provider: {
                            '@type': 'LocalBusiness',
                            name: 'GK WhizWheel',
                            telephone: '+918660989586',
                            url: 'https://whizwheels.in',
                        },
                    },
                    cabFaqSchema,
                ]}
            />

            <Box component="main" id="main-content" sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    1. MODERN 2-COLUMN HERO SECTION
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="cabs-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E293B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 55%, #F0F9FF 100%)',
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
                            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.2) 0%, transparent 70%)',
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
                                                '&:hover': { color: '#0284C7' },
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
                                                '&:hover': { color: '#0284C7' },
                                            }}
                                        >
                                            Services
                                        </Typography>
                                        <Typography variant="caption" aria-current="page" sx={{ color: '#0284C7', fontWeight: 800 }}>
                                            Coastal Cabs & Taxis
                                        </Typography>
                                    </Breadcrumbs>

                                    <Chip
                                        icon={<StarIcon aria-hidden="true" sx={{ fontSize: '0.9rem !important', color: '#F59E0B' }} />}
                                        label="4.9 ★ Google Rated (180+ Reviews)"
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
                                    id="cabs-hero-heading"
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
                                    Coastal Cabs & AC Taxi Services in{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 50%, #F59E0B 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        Honnavar
                                    </Box>
                                </Typography>

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
                                    Whether arriving on early Konkan trains, holidaying with family, or planning all-day sightseeing to Jog Falls, Murudeshwar, and Gokarna, GK WhizWheels delivers sanitized, chilled AC cabs with verified local chauffeurs who know every scenic shortcut.
                                </Typography>

                                {/* 4 Clean Frosted Badges */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5, maxWidth: 640 }}>
                                    {[
                                        { title: 'Zero Surge Pricing', desc: 'Pre-fixed transparent rates with no hidden peak multipliers', icon: <ShieldIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
                                        { title: 'Platform 1 Pickup', desc: 'Driver waits right at Honnavar station exit with name placard', icon: <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
                                        { title: 'Verified Local Chauffeurs', desc: 'Courteous drivers born in Uttara Kannada with flawless safety record', icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
                                        { title: 'Spotless AC Fleet', desc: 'Daily sanitized Dzire sedans, Ertiga & Toyota Innova Crysta', icon: <LocalTaxiIcon sx={{ color: '#8B5CF6', fontSize: 18 }} /> },
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
                                                    '&:hover': { borderColor: '#0284C7' },
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
                                        href="#popular-routes"
                                        variant="contained"
                                        size="medium"
                                        endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                        sx={{
                                            fontWeight: 900,
                                            px: 3,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.92rem',
                                            bgcolor: '#0284C7',
                                            color: '#FFFFFF',
                                            boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.5)',
                                            '&:hover': { bgcolor: '#0369A1' },
                                        }}
                                    >
                                        View Popular Tour Rates ↓
                                    </Button>

                                    <Button
                                        component="a"
                                        href="tel:+918660989586"
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<PhoneIcon sx={{ color: '#0284C7' }} />}
                                        sx={{
                                            fontWeight: 750,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': {
                                                borderColor: '#0284C7',
                                                bgcolor: 'rgba(2, 132, 199, 0.08)',
                                            },
                                        }}
                                    >
                                        Call Cab Desk: +91 86609 89586
                                    </Button>

                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20an%20AC%20Cab%20in%20Honnavar."
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

                            {/* Right Column: Modern Showcase Card */}
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
                                            <LocationOnIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 850, letterSpacing: '0.06em', color: primaryTextColor, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                                Honnavar Verified Fleet
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label="Starting ₹12 / km"
                                            size="small"
                                            sx={{
                                                bgcolor: '#0284C7',
                                                color: '#FFFFFF',
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                height: 24,
                                            }}
                                        />
                                    </Box>

                                    {/* Cinematic Image Showcase */}
                                    <Box sx={{ position: 'relative', height: { xs: 240, sm: 280 } }}>
                                        <Box
                                            component="img"
                                            src="/images/services/taxi.jpg"
                                            alt="Honnavar AC Cabs & Taxi Services - Station Pickup and Coastal Sightseeing"
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
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label="AC Chauffeur Driven"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(2, 132, 199, 0.6)',
                                                    }}
                                                />
                                                <Chip
                                                    icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 13 }} />}
                                                    label="4.9 ★ Verified"
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

                                            <Box>
                                                <Typography variant="caption" component="span" sx={{ color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', display: 'block' }}>
                                                    HONNAVAR • GOKARNA • MURUDESHWAR • JOG FALLS • GOA
                                                </Typography>
                                                <Typography variant="h6" component="p" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mt: 0.3 }}>
                                                    Dzire Sedans, Ertiga (7-Seater) & Innova Crysta Fleet
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* 3 Metric Pillars Under Image */}
                                    <Grid container sx={{ p: 1.2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0' }}>
                                        {[
                                            { label: 'STATION TARIFF', val: 'Flat ₹300 - ₹600' },
                                            { label: 'OUTSTATION RATE', val: 'From ₹12 / Km' },
                                            { label: 'STATION PICKUP', val: '0-Min Punctual' },
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
                                                ⚡ 24/7 Live Cab Desks at Honnavar Station & Palya Main Road
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.6, mb: 2 }}>
                                            {['Swift Dzire AC', 'Maruti Ertiga (7-Seater)', 'Toyota Innova Crysta', 'Tempo (12-Seater)'].map((pill, mIdx) => (
                                                <Chip
                                                    key={mIdx}
                                                    label={pill}
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

                                        <Button
                                            onClick={() => setModalOpen(true)}
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
                                            Quick Reserve via WhatsApp / Online Form
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. INTERACTIVE FARE ESTIMATOR & OUTSTATION FARE CALCULATOR
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 5, md: 7 } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, md: 4.5 },
                            borderRadius: 4,
                            bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(2, 132, 199, 0.06)',
                        }}
                    >
                        <Box sx={{ mb: 3 }}>
                            <Chip
                                label="TRANSPARENT PRICING CALCULATOR"
                                size="small"
                                sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 900, mb: 1.2 }}
                            />
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em' }}>
                                Instant Honnavar Cab Fare Estimator
                            </Typography>
                            <Typography variant="body2" sx={{ color: secondaryTextColor, maxWidth: 650, mt: 0.5 }}>
                                Calculate your realistic cab fare with zero hidden surge multipliers. Driver allowance is calculated transparently.
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Inputs */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.8 }}>
                                            SELECT VEHICLE TYPE
                                        </Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            value={calcVehicle}
                                            onChange={(e) => setCalcVehicle(e.target.value)}
                                        >
                                            <MenuItem value="sedan">Maruti Dzire AC Sedan (4+1) - ₹12/km</MenuItem>
                                            <MenuItem value="ertiga">Maruti Ertiga AC (6+1) - ₹15/km</MenuItem>
                                            <MenuItem value="innova">Toyota Innova Crysta (7+1) - ₹18/km</MenuItem>
                                            <MenuItem value="tempo">Tempo Traveller AC (12+1) - ₹24/km</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.8 }}>
                                            TRIP ORIENTATION
                                        </Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            value={calcTrip}
                                            onChange={(e) => setCalcTrip(e.target.value)}
                                        >
                                            <MenuItem value="round">Round Trip (Honnavar & Return)</MenuItem>
                                            <MenuItem value="oneway">One-Way Drop (Airport / City)</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.8 }}>
                                            ONE-WAY DISTANCE (APPROX KM)
                                        </Typography>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={calcDistance}
                                            onChange={(e) => setCalcDistance(Math.max(10, Number(e.target.value)))}
                                            slotProps={{
                                                input: {
                                                    endAdornment: <InputAdornment position="end">KM</InputAdornment>,
                                                },
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.8 }}>
                                            NUMBER OF TRAVEL DAYS
                                        </Typography>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={calcDays}
                                            onChange={(e) => setCalcDays(Math.max(1, Number(e.target.value)))}
                                            slotProps={{
                                                input: {
                                                    endAdornment: <InputAdornment position="end">Days</InputAdornment>,
                                                },
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 2.5, p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 2.5, border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                                    <Typography variant="caption" sx={{ color: mutedTextColor, lineHeight: 1.5, display: 'block' }}>
                                        💡 <em>Note:</em> Standard outstation billing applies a minimum of 250 km/day (300 km for Innova/Tempo). Toll gates, state permits & monument parking charges are payable at actuals.
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Estimate Summary Output Card */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        borderRadius: 3,
                                        bgcolor: isDark ? '#0F172A' : '#F0F9FF',
                                        border: '1.5px solid #0284C7',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Estimated Total Tariff
                                        </Typography>
                                        <Typography variant="h3" component="p" sx={{ fontWeight: 950, color: primaryTextColor, my: 0.8 }}>
                                            ₹{estimatedFare.total.toLocaleString('en-IN')}
                                        </Typography>
                                        <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#BAE6FD' }} />

                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="caption" sx={{ color: secondaryTextColor }}>Billable Distance:</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor }}>{estimatedFare.effectiveKm} km (@ ₹{estimatedFare.ratePerKm}/km)</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="caption" sx={{ color: secondaryTextColor }}>Distance Charge:</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor }}>₹{estimatedFare.kmCost.toLocaleString('en-IN')}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="caption" sx={{ color: secondaryTextColor }}>Driver Batta ({calcDays} Day{calcDays > 1 ? 's' : ''}):</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor }}>₹{estimatedFare.driverCost.toLocaleString('en-IN')}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Button
                                        onClick={() => setModalOpen(true)}
                                        variant="contained"
                                        fullWidth
                                        startIcon={<WhatsAppIcon />}
                                        sx={{
                                            mt: 3,
                                            bgcolor: '#0284C7',
                                            color: '#FFFFFF',
                                            fontWeight: 850,
                                            py: 1.2,
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: '#0369A1' },
                                        }}
                                    >
                                        Book This Estimate
                                    </Button>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Merged Outstation Tariff Sheet Reference Toggle */}
                        <Box sx={{ mt: 3.5, pt: 2.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor }}>
                                        Looking for per-kilometer outstation reference tariffs?
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                        View complete vehicle tariff sheet with minimum daily km averages and driver batta.
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setShowTariffTable(!showTariffTable)}
                                    endIcon={<ExpandMoreIcon sx={{ transform: showTariffTable ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                                    sx={{
                                        borderColor: '#0284C7',
                                        color: '#0284C7',
                                        fontWeight: 800,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        '&:hover': { borderColor: '#0369A1', bgcolor: 'rgba(2, 132, 199, 0.05)' },
                                    }}
                                >
                                    {showTariffTable ? 'Hide Outstation Tariff Sheet' : 'View Outstation Tariff Sheet'}
                                </Button>
                            </Box>

                            {showTariffTable && (
                                <Box sx={{ mt: 2.5 }}>
                                    <TableContainer
                                        sx={{
                                            borderRadius: 2.5,
                                            border: `1px solid ${cardBorderColor}`,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Table size="small" sx={{ minWidth: 640 }}>
                                            <TableHead sx={{ bgcolor: isDark ? '#0F172A' : '#1E293B' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 850, py: 1.2 }}>Vehicle Model</TableCell>
                                                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 850, py: 1.2 }}>Category & Seating</TableCell>
                                                    <TableCell sx={{ color: '#38BDF8', fontWeight: 850, py: 1.2 }}>Per KM Rate</TableCell>
                                                    <TableCell sx={{ color: '#FBBF24', fontWeight: 850, py: 1.2 }}>Min Daily Avg</TableCell>
                                                    <TableCell sx={{ color: '#6EE7B7', fontWeight: 850, py: 1.2 }}>Driver Batta</TableCell>
                                                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 850, py: 1.2 }}>Ideal For</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {OUTSTATION_FARE_MATRIX.map((row, idx) => (
                                                    <TableRow
                                                        key={idx}
                                                        sx={{
                                                            '&:nth-of-type(even)': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' },
                                                            '&:hover': { bgcolor: isDark ? 'rgba(2, 132, 199, 0.06)' : '#F0F9FF' },
                                                        }}
                                                    >
                                                        <TableCell sx={{ fontWeight: 850, color: primaryTextColor, py: 1.2 }}>{row.vehicle}</TableCell>
                                                        <TableCell sx={{ color: secondaryTextColor, fontSize: '0.82rem', py: 1.2 }}>{row.category}</TableCell>
                                                        <TableCell sx={{ fontWeight: 900, color: '#0284C7', fontSize: '0.88rem', py: 1.2 }}>{row.perKm}</TableCell>
                                                        <TableCell sx={{ color: secondaryTextColor, fontSize: '0.82rem', py: 1.2 }}>{row.minKmPerDay}</TableCell>
                                                        <TableCell sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800, py: 1.2 }}>{row.driverBatta}</TableCell>
                                                        <TableCell sx={{ color: mutedTextColor, fontSize: '0.8rem', py: 1.2 }}>{row.idealFor}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* =========================================================================
                    3. POPULAR SIGHTSEEING CAB TOURS & DAY TRIPS (Fixed Transparent Rates)
                ========================================================================== */}
                <Box id="popular-routes" sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 6, md: 9 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Chip
                            label="FIXED-RATE SCENIC DAY TOURS"
                            sx={{
                                bgcolor: 'rgba(2, 132, 199, 0.12)',
                                color: '#0284C7',
                                fontWeight: 850,
                                fontSize: '0.75rem',
                                letterSpacing: '0.06em',
                                mb: 1.5,
                                border: '1px solid rgba(2, 132, 199, 0.3)',
                            }}
                        />
                        <Typography variant="h2" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' }, letterSpacing: '-0.02em', mb: 1.5 }}>
                            Popular Sightseeing Cab Packages from Honnavar
                        </Typography>
                        <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 680, mx: 'auto', lineHeight: 1.7 }}>
                            All-inclusive fixed fares with pickup right from Honnavar Railway Station, resorts, or local hotels. No meter anxiety.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {POPULAR_CAB_ROUTES.map((route, rIdx) => (
                            <Grid key={rIdx} size={{ xs: 12, md: 6, lg: 4 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            borderColor: '#0284C7',
                                            boxShadow: '0 12px 28px -6px rgba(2, 132, 199, 0.15)',
                                        },
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Chip
                                                label={route.tag}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', fontWeight: 850, fontSize: '0.7rem' }}
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 15, color: mutedTextColor }} />
                                                <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                    {route.duration}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Typography variant="h6" component="h3" sx={{ fontWeight: 900, color: primaryTextColor, lineHeight: 1.3, mb: 1 }}>
                                            {route.title}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.84rem', lineHeight: 1.6, mb: 2 }}>
                                            {route.highlights}
                                        </Typography>

                                        <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 2, border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0', mb: 2.5 }}>
                                            <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1, fontSize: '0.68rem' }}>
                                                Fixed Round-Trip Tariffs:
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem' }}>AC Sedan</Typography>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0284C7' }}>{route.sedanRate}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 4 }} sx={{ textAlign: 'center', borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem' }}>7-Seater Ertiga</Typography>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: primaryTextColor }}>{route.suvRate}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 4 }} sx={{ textAlign: 'center', borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem' }}>Innova Crysta</Typography>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F59E0B' }}>{route.suvRate === '₹4,500' ? '₹5,500' : '₹4,200'}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Box>

                                    <Button
                                        onClick={() => setModalOpen(true)}
                                        variant="outlined"
                                        fullWidth
                                        sx={{
                                            borderColor: '#0284C7',
                                            color: '#0284C7',
                                            fontWeight: 800,
                                            borderRadius: 2,
                                            py: 0.9,
                                            '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.08)', borderColor: '#0284C7' },
                                        }}
                                    >
                                        Book This Tour Route →
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    4. LIVE DB VEHICLES CATALOG (Toyota Innova Crysta, Dzire, Tempo)
                ========================================================================== */}
                {availableItems && availableItems.length > 0 && (
                    <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                            <Box>
                                <Chip label="FLEET SPECIFICATIONS" size="small" sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 850, mb: 1 }} />
                                <Typography variant="h3" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em' }}>
                                    Available Vehicles in Our Honnavar Fleet
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                {['All', 'Sedan', 'SUV', 'Group'].map((cat) => (
                                    <Chip
                                        key={cat}
                                        label={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        sx={{
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            bgcolor: selectedCategory === cat ? '#0284C7' : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                                            color: selectedCategory === cat ? '#FFFFFF' : primaryTextColor,
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        <Grid container spacing={3}>
                            {filteredVehicles.map((item) => {
                                const media = getServiceItemMedia(item, '/images/services/taxi.jpg');
                                return (
                                <Grid key={item.id} size={{ xs: 12, md: 4 }}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 3.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                                            border: `1px solid ${cardBorderColor}`,
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                borderColor: '#0284C7',
                                                boxShadow: '0 14px 28px -8px rgba(2, 132, 199, 0.25)',
                                            },
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                position: 'relative', 
                                                height: 200, 
                                                bgcolor: '#0F172A', 
                                                overflow: 'hidden',
                                                cursor: media.gallery.length > 0 ? 'pointer' : 'default',
                                            }}
                                            onClick={() => {
                                                if (media.gallery.length > 0) {
                                                    setSelectedVehicleForGallery(item);
                                                    setGalleryModalOpen(true);
                                                }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={media.primary}
                                                loading="lazy"
                                                alt={`${item.name} - Chauffeur-driven AC cab rental in Honnavar`}
                                                sx={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.4s ease',
                                                    '&:hover': media.gallery.length > 0 ? { transform: 'scale(1.05)' } : {},
                                                }}
                                            />
                                            {item.badge && (
                                                <Chip
                                                    size="small"
                                                    label={item.badge}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        left: 12,
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(2, 132, 199, 0.8)',
                                                    }}
                                                />
                                            )}
                                            {media.hasMultiple && (
                                                <Chip
                                                    icon={<PhotoLibraryIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                                                    size="small"
                                                    label={`${media.count} Photos`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedVehicleForGallery(item);
                                                        setGalleryModalOpen(true);
                                                    }}
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 12,
                                                        left: 12,
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        cursor: 'pointer',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.9)' },
                                                    }}
                                                />
                                            )}
                                            {item.capacity && (
                                                <Chip
                                                    size="small"
                                                    label={item.capacity}
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 12,
                                                        right: 12,
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 700,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <CardContent sx={{ p: 2.8, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: primaryTextColor, mb: 0.5 }}>
                                                    {item.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                    {item.category}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.84rem', lineHeight: 1.5, mb: 2 }}>
                                                    {item.description}
                                                </Typography>

                                                {item.features && Array.isArray(item.features) && item.features.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
                                                        {item.features.map((feat, fIdx) => (
                                                            <Chip
                                                                key={fIdx}
                                                                label={feat}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.7rem',
                                                                    height: 22,
                                                                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                                                    color: isDark ? '#CBD5E1' : '#475569',
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>

                                            <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontSize: '0.7rem' }}>
                                                            Base Tariff
                                                        </Typography>
                                                        <Typography variant="h6" component="span" sx={{ fontWeight: 900, color: '#0284C7', lineHeight: 1.1 }}>
                                                            ₹{Number(item.price_base).toLocaleString('en-IN')}
                                                            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.5 }}>
                                                                / {item.price_unit?.replace('per_', '')}
                                                            </Typography>
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={() => setModalOpen(true)}
                                                    sx={{
                                                        bgcolor: '#0284C7',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        py: 1,
                                                        borderRadius: 2,
                                                        '&:hover': { bgcolor: '#0369A1' },
                                                    }}
                                                >
                                                    Book This Cab →
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}

                {/* =========================================================================
                    5. HOW HONNAVAR CAB BOOKING WORKS (Step-by-Step Flow)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Chip
                            label="PUNCTUAL & CONVENIENT"
                            sx={{
                                bgcolor: 'rgba(2, 132, 199, 0.12)',
                                color: '#0284C7',
                                fontWeight: 850,
                                fontSize: '0.75rem',
                                letterSpacing: '0.06em',
                                mb: 1,
                            }}
                        />
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em' }}>
                            How Honnavar Cab Booking Works
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto', mt: 0.5 }}>
                            Zero waiting outside railway stations. Book online or on WhatsApp in under 2 minutes.
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {[
                            {
                                step: '01',
                                title: 'Share Travel Details',
                                desc: 'Tell us your pickup location (Honnavar Station, resort, or airport), date, time, and destination.',
                                color: '#0284C7',
                            },
                            {
                                step: '02',
                                title: 'Fixed Transparent Quote',
                                desc: 'Receive instant confirmation with driver details, car number, and fixed tariff. No hidden surge fees.',
                                color: '#F59E0B',
                            },
                            {
                                step: '03',
                                title: 'Punctual Doorstep Pickup',
                                desc: 'Your chauffeur arrives 10 minutes early at Honnavar Station Platform 1 exit or your hotel lobby.',
                                color: '#10B981',
                            },
                            {
                                step: '04',
                                title: 'Relax & Pay on Completion',
                                desc: 'Enjoy chilled AC travel with courteous driving. Pay securely via UPI, cash, or credit card upon trip end.',
                                color: '#8B5CF6',
                            },
                        ].map((item, idx) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.2,
                                        height: '100%',
                                        borderRadius: 2.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            bgcolor: `${item.color}15`,
                                            color: item.color,
                                            fontWeight: 950,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `1.5px solid ${item.color}`,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.step}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 800,
                                                color: primaryTextColor,
                                                fontSize: '0.92rem',
                                                mb: 0.3,
                                            }}
                                        >
                                            {item.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: secondaryTextColor,
                                                fontSize: '0.8rem',
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {item.desc}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    6. INCLUSIONS & POLICIES CHECKLIST
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
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        What's Included in Every Cab Booking
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {[
                                        'Chilled Air-Conditioned commercial cab maintained to showroom standards',
                                        'Verified, courteous chauffeur with deep local Uttara Kannada route expertise',
                                        'Fuel charges and routine maintenance included in fare calculation',
                                        'Punctual railway station platform exit pickup with name sign placard',
                                        'Complimentary bottled drinking water, umbrella, and phone charging points',
                                        '24x7 phone & WhatsApp live dispatch helpline assistance',
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
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        Transparent Guidelines & Exclusions
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {[
                                        'State border permits (applicable only when entering Goa boundary)',
                                        'Toll plazas and monument / beach parking fees (payable at actuals)',
                                        'Driver night allowance (₹300 applicable only for journeys running past 10:00 PM)',
                                        'Strict non-smoking and neat cleanliness policy maintained inside cabs',
                                        'Free cancellation up to 4 hours before scheduled railway station arrival',
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
                    7. HONNAVAR CAB FAQS (Detailed Accordion)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Typography variant="h3" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, mb: 1 }}>
                        Honnavar Cab Services — Frequently Asked Questions
                    </Typography>
                    <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 3.5 }}>
                        Clear answers regarding railway station pickups, sightseeing packages, and billing policies.
                    </Typography>

                    <Stack spacing={1.5}>
                        {CAB_FAQS.slice(0, 6).map((faq, fIdx) => (
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
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0284C7' }} />}>
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

                        {/* Embedded Distance & Travel Time Matrix Accordion */}
                        <Accordion
                            sx={{
                                bgcolor: cardBgColor,
                                border: `1px solid ${cardBorderColor}`,
                                borderRadius: '14px !important',
                                '&:before': { display: 'none' },
                                boxShadow: 'none',
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0284C7' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: primaryTextColor }}>
                                    How far are major tourist spots and transit hubs from Honnavar? (Distance & Travel Time Matrix)
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2 }}>
                                    Accurate driving times and distances by cab from Honnavar Railway Station and central town hubs:
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {HONNAVAR_DISTANCES.map((item, dIdx) => (
                                        <Grid key={dIdx} size={{ xs: 12, sm: 6, md: 3 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                                                    border: `1px solid ${cardBorderColor}`,
                                                    height: '100%',
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.82rem' }}>
                                                    {item.destination}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                                                    <Chip
                                                        size="small"
                                                        label={item.distance}
                                                        sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20, bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                        {item.time}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontSize: '0.72rem', lineHeight: 1.3 }}>
                                                    {item.mode}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Box>

                {/* =========================================================================
                    10. BOTTOM CALLOUT & 24/7 CONTACT PORTAL
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: 8 }}>
                    <Paper
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#F0F9FF',
                            border: '1.5px solid rgba(2, 132, 199, 0.4)',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <Box>
                            <Chip label="24x7 HONNAVAR CAB DESK" size="small" sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 900, mb: 1.5 }} />
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, mb: 1, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' } }}>
                                Need an AC Cab in Honnavar Right Now?
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 650 }}>
                                Call our 24/7 station dispatch desk or drop a quick WhatsApp message. We assign your vehicle, confirm driver details, and arrive on time.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20need%20an%20AC%20Cab%20in%20Honnavar."
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
                                WhatsApp Cab Booking
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

                {/* Dedicated Cabs Booking Modal */}
                <CabsBookingModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    initialTripType="local_transfer"
                    availableItems={availableItems}
                />

                {/* Multi-Image Vehicle Gallery Lightbox */}
                <ServiceGalleryModal
                    open={galleryModalOpen}
                    onClose={() => setGalleryModalOpen(false)}
                    item={selectedVehicleForGallery}
                    onBook={(item) => {
                        setGalleryModalOpen(false);
                        setModalOpen(true);
                    }}
                />
            </Box>
        </AppLayout>
    );
}

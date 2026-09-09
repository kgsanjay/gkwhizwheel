import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import HomestayBookingModal from '../Components/BookingModals/HomestayBookingModal';
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
    Rating,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BedIcon from '@mui/icons-material/Bed';
import WifiIcon from '@mui/icons-material/Wifi';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import BathtubIcon from '@mui/icons-material/Bathtub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import SecurityIcon from '@mui/icons-material/Security';
import WaterIcon from '@mui/icons-material/Water';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CoffeeIcon from '@mui/icons-material/Coffee';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import OutdoorGrillIcon from '@mui/icons-material/OutdoorGrill';
import BalconyIcon from '@mui/icons-material/Balcony';
import TvIcon from '@mui/icons-material/Tv';
import PowerIcon from '@mui/icons-material/Power';

// Standard property amenity icons mapping
const AMENITY_LIST = [
    { name: 'Authentic Malnad / Karavali Breakfast', icon: <CoffeeIcon sx={{ color: '#E11D48' }} />, desc: 'Fresh hot Neer Dosa, Idli-Vada, or Poori included daily' },
    { name: 'Silent Inverter AC & Power Backup', icon: <AcUnitIcon sx={{ color: '#0284C7' }} />, desc: 'Chilled air conditioning with 24/7 uninterrupted power' },
    { name: 'High-Speed Wi-Fi for Remote Work', icon: <WifiIcon sx={{ color: '#10B981' }} />, desc: 'Reliable fiber internet for workationers and digital nomads' },
    { name: 'Direct Sharavathi River / Beach Walk', icon: <WaterIcon sx={{ color: '#38BDF8' }} />, desc: 'Exclusive riverfront wooden deck or 2-min walk to Kasarkod beach' },
    { name: 'Safe Private Car & Bike Parking', icon: <LocalParkingIcon sx={{ color: '#F59E0B' }} />, desc: 'Gated parking premises with 24/7 CCTV surveillance' },
    { name: 'Authentic Coastal Seafood Kitchen', icon: <RestaurantIcon sx={{ color: '#E11D48' }} />, desc: 'Fresh catch pomfret, kingfish, prawns & veg home thalis' },
    { name: '24/7 Solar Hot Water Shower', icon: <BathtubIcon sx={{ color: '#8B5CF6' }} />, desc: 'Sanitized private attached bathroom with pressure shower' },
    { name: 'Campfire & BBQ Setup on Request', icon: <OutdoorGrillIcon sx={{ color: '#D97706' }} />, desc: 'Evening lawn barbecue and wooden campfire by the river' },
];

// Curated Room & Stay Tiers (Supplements DB items if needed)
const CURATED_ROOM_CATALOG = [
    {
        id: 'tier-1',
        name: 'Sharavathi Riverfront Wooden Cottage',
        type: 'Riverfront Wooden Cottage',
        location: 'Sharavathi Riverfront, Honnavar',
        badge: 'Top Guest Rated',
        rating: 4.95,
        reviewsCount: 142,
        pricePerNight: 1800,
        capacity: '2 - 3 Guests (1 King Bed + Extra Mattress)',
        bedType: '1 King Bed + Riverview Balcony',
        roomSize: '350 sq.ft',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
        highlights: [
            'Private wooden deck overlooking serene backwater estuary',
            'Complimentary traditional Malnad breakfast included',
            'Chilled silent Split AC & 24/7 hot water shower',
            'Direct private jetty for morning backwater boat pickup',
        ],
        idealFor: 'Couples, solo travelers, and nature lovers seeking tranquil sunset views.',
    },
    {
        id: 'tier-2',
        name: 'Kasarkod Eco Beach Wooden Canopy Suite',
        type: 'Beachside Villa Suite',
        location: 'Kasarkod Eco Beach (Blue Flag), Honnavar',
        badge: '2 Min Beach Walk',
        rating: 4.9,
        reviewsCount: 98,
        pricePerNight: 2200,
        capacity: '3 - 4 Guests (1 Queen Bed + 1 Single Bed)',
        bedType: '1 Queen Bed + Garden Patio',
        roomSize: '420 sq.ft',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
        highlights: [
            'Only 150 meters walking distance to Kasarkod Eco Beach boardwalk',
            'Surrounded by tall coconut palm grove gardens and seabreeze',
            'High-speed fiber Wi-Fi with comfortable work desk',
            'Family-friendly lawn sitting area with open hammocks',
        ],
        idealFor: 'Families with kids and beach lovers wanting to stroll to sunset waves.',
    },
    {
        id: 'tier-3',
        name: 'Karavali Heritage Courtyard Room',
        type: 'Traditional Coastal Homestay',
        location: 'Palya Heritage Belt, Honnavar Town',
        badge: 'Best Value',
        rating: 4.88,
        reviewsCount: 110,
        pricePerNight: 1400,
        capacity: '2 Guests (1 Queen Bed)',
        bedType: '1 Queen Teakwood Bed',
        roomSize: '280 sq.ft',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
        highlights: [
            'Authentic 70-year-old restored tiled roof Karavali ancestral home',
            'Veranda seating, wooden pillars, and brass antique decor',
            'Homecooked vegetarian & seafood thalis prepared by local host family',
            'Convenient 5-min proximity to Honnavar Railway Station',
        ],
        idealFor: 'Cultural travelers, backpackers, and transit visitors on Konkan railway.',
    },
    {
        id: 'tier-4',
        name: 'Private Entire Coconut Estate Villa',
        type: 'Exclusive 3-BHK Villa (Private)',
        location: 'Mavinkurve Island Road, Honnavar',
        badge: 'Exclusive Group Stay',
        rating: 5.0,
        reviewsCount: 45,
        pricePerNight: 6500,
        capacity: '8 - 12 Guests (3 Bedrooms + Hall + Kitchen)',
        bedType: '3 King Bedrooms + 2 Extra Beds',
        roomSize: '1,800 sq.ft Villa',
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
        highlights: [
            'Full privacy for your family or friends group — no other guests',
            'Fully equipped kitchen, private dining pavilion, and outdoor barbecue',
            'Expansive private lawn suitable for reunions and birthday celebrations',
            'Dedicated caretaker on premises for housekeeping and bonfire assistance',
        ],
        idealFor: 'Large families, corporate workations, and group gatherings.',
    },
];

// Distance matrix from Honnavar homestay zones
const DISTANCE_MATRIX = [
    { spot: 'Sharavathi Backwater Boating Point', dist: '1.2 km', time: '4 Mins', note: 'Can be picked up directly by boat at select cottages' },
    { spot: 'Honnavar Railway Station', dist: '3.5 km', time: '8 Mins', note: 'Station cab or bike delivery available on arrival' },
    { spot: 'Kasarkod Eco Beach & Boardwalk', dist: '4.0 km', time: '8 Mins', note: 'Karnataka’s premier Blue Flag eco-certified beach' },
    { spot: 'Apsarakonda Waterfalls & Ocean Cliff', dist: '6.5 km', time: '14 Mins', note: 'Freshwater pond dipping and sunset hill temple' },
    { spot: 'Historic Mirjan Fort', dist: '20 km', time: '22 Mins', note: '16th-century fortress surrounded by lush green lawns' },
    { spot: 'Murudeshwar Shiva Temple & Scuba Jetty', dist: '26 km', time: '32 Mins', note: 'Colossal Shiva statue and Netrani scuba speedboat harbor' },
    { spot: 'Gokarna Om Beach & Mahabaleshwar', dist: '48 km', time: '50 Mins', note: 'Scenic coastal highway drive along NH-66' },
    { spot: 'Jog Falls (Highest Plunge Falls)', dist: '60 km', time: '1 Hr 15 Mins', note: 'Spectacular day-trip through Sharavathi valley ghats' },
];

export default function HomestaysPage({ availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoomCategory, setSelectedRoomCategory] = useState('All');
    const [selectedRoomForDetail, setSelectedRoomForDetail] = useState(null);

    // Filter bar state
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [guestCount, setGuestCount] = useState('2 Guests');

    // UI Color tokens
    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155';
    const mutedTextColor = isDark ? '#94A3B8' : '#64748B';
    const cardBgColor = isDark ? '#111827' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

    // Merge DB items with curated catalog ensuring live DB items appear first
    const displayRooms = useMemo(() => {
        let list = [];

        // 1. Live database items
        if (availableItems && availableItems.length > 0) {
            const mappedDb = availableItems.map((item) => ({
                id: `db-${item.id}`,
                name: item.name,
                type: item.category || 'Curated Homestay',
                location: 'Honnavar Coastal Belt, Karnataka',
                badge: item.badge || 'Verified Stay',
                rating: 4.9,
                reviewsCount: 85,
                pricePerNight: Number(item.price_base) || 1500,
                capacity: item.capacity || '2 - 3 Guests',
                bedType: 'AC Room with Attached Bath',
                roomSize: '320 sq.ft',
                image: item.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
                highlights: item.features && Array.isArray(item.features) && item.features.length > 0
                    ? item.features
                    : [
                        'Clean sanitized AC room with attached private bath',
                        'Authentic coastal breakfast included',
                        'High-speed Wi-Fi and power backup',
                        'Host hospitality with local sightseeing assistance',
                    ],
                idealFor: item.description,
                isDb: true,
            }));
            list = [...mappedDb];
        }

        // 2. Curated standard rooms (supplementing database so users have rich choices)
        CURATED_ROOM_CATALOG.forEach((curated) => {
            const alreadyInList = list.some((x) => x.name.toLowerCase().includes(curated.name.toLowerCase().split(' ')[0]));
            if (!alreadyInList) {
                list.push(curated);
            }
        });

        // 3. Category filtering
        if (selectedRoomCategory === 'All') return list;
        if (selectedRoomCategory === 'Riverfront') return list.filter((r) => r.name.toLowerCase().includes('river') || r.type.toLowerCase().includes('river'));
        if (selectedRoomCategory === 'Beachside') return list.filter((r) => r.name.toLowerCase().includes('beach') || r.type.toLowerCase().includes('beach'));
        if (selectedRoomCategory === 'Heritage') return list.filter((r) => r.name.toLowerCase().includes('heritage') || r.type.toLowerCase().includes('heritage'));
        if (selectedRoomCategory === 'Villa') return list.filter((r) => r.name.toLowerCase().includes('villa') || r.name.toLowerCase().includes('estate') || r.type.toLowerCase().includes('villa'));

        return list;
    }, [availableItems, selectedRoomCategory]);

    return (
        <AppLayout noFooterMargin>
            <Head>
                <title>Riverside & Beachside Coastal Homestays in Honnavar | Rooms & Cottages | GK WhizWheels</title>
                <meta
                    name="description"
                    content="Book authentic coastal homestays, riverfront wooden cottages, and beach villas in Honnavar from ₹1,200/night. Verified host families, homemade Karavali breakfast, and Sharavathi sunset views."
                />
            </Head>

            <Box sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    1. MODERN 2-COLUMN HERO SECTION
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="homestays-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E293B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #FFF1F2 50%, #F8FAFC 100%)',
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
                            background: 'radial-gradient(circle, rgba(225, 29, 72, 0.2) 0%, transparent 70%)',
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
                                                '&:hover': { color: '#E11D48' },
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
                                                '&:hover': { color: '#E11D48' },
                                            }}
                                        >
                                            Services
                                        </Typography>
                                        <Typography variant="caption" aria-current="page" sx={{ color: '#E11D48', fontWeight: 800 }}>
                                            Coastal Homestays & Stays
                                        </Typography>
                                    </Breadcrumbs>

                                    <Chip
                                        icon={<StarIcon aria-hidden="true" sx={{ fontSize: '0.9rem !important', color: '#F59E0B' }} />}
                                        label="4.95 ★ Host Rated (195+ Reviews)"
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
                                    id="homestays-hero-heading"
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
                                    Riverside & Beachside Coastal Homestays in{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(90deg, #E11D48 0%, #F43F5E 50%, #F59E0B 100%)',
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
                                    Skip generic hotels and immerse yourself in genuine Karavali hospitality. We offer handpicked wooden cottages along the tranquil Sharavathi riverfront, private beach villas near Kasarkod Eco Beach, and peaceful family homestays featuring homecooked coastal seafood.
                                </Typography>

                                {/* 4 Modern Trust Features - Clean Frosted Badges */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5, maxWidth: 640 }}>
                                    {[
                                        { title: 'Verified Family Hosts', desc: '100% safe, verified peaceful residences away from highway noise', icon: <ShieldIcon sx={{ color: '#E11D48', fontSize: 18 }} /> },
                                        { title: 'Authentic Coastal Meals', desc: 'Fresh homecooked vegetarian thalis and Arabian Sea seafood specials', icon: <RestaurantIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
                                        { title: 'Inverter AC & Fast Wi-Fi', desc: 'Work-from-nature equipped with power backup and desk setup', icon: <WifiIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
                                        { title: 'Sharavathi Sunset Views', desc: 'Private wooden deck access with river backwater boat pickup', icon: <WaterIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
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
                                                    '&:hover': { borderColor: '#E11D48' },
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
                                        href="#rooms-catalog"
                                        variant="contained"
                                        size="medium"
                                        endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                        sx={{
                                            fontWeight: 900,
                                            px: 3,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.92rem',
                                            bgcolor: '#E11D48',
                                            color: '#FFFFFF',
                                            boxShadow: '0 8px 20px -4px rgba(225, 29, 72, 0.5)',
                                            '&:hover': { bgcolor: '#BE123C' },
                                        }}
                                    >
                                        Browse Rooms & Check Dates ↓
                                    </Button>

                                    <Button
                                        component="a"
                                        href="tel:+918660989586"
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<PhoneIcon sx={{ color: '#E11D48' }} />}
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
                                        Call Desk: +91 86609 89586
                                    </Button>

                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20inquire%20and%20book%20a%20Homestay%20in%20Honnavar."
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

                            {/* Right Column: Modern High-End Showcase Card */}
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
                                            <LocationOnIcon sx={{ fontSize: 18, color: '#E11D48' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 850, letterSpacing: '0.06em', color: primaryTextColor, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                                Honnavar Verified Stays
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label="From ₹1,200 / night"
                                            size="small"
                                            sx={{
                                                bgcolor: '#E11D48',
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
                                            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80"
                                            alt="Honnavar Riverside Homestays & Cottages"
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
                                                    label="Karavali Wooden Cottages"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(225, 29, 72, 0.6)',
                                                    }}
                                                />
                                                <Chip
                                                    icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 13 }} />}
                                                    label="4.95 ★ Verified"
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
                                                <Typography variant="caption" sx={{ color: '#FDA4AF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', display: 'block' }}>
                                                    SHARAVATHI RIVERFRONT • ECO BEACH • HONNAVAR TOWN
                                                </Typography>
                                                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mt: 0.3 }}>
                                                    Handpicked Karavali Wooden Cottages & Beach Villas
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* 3 Metric Pillars Under Image */}
                                    <Grid container sx={{ p: 1.2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0' }}>
                                        {[
                                            { label: 'ROOM STARTING', val: '₹1,200 / Night' },
                                            { label: 'RIVERFRONT COTTAGE', val: 'From ₹1,800' },
                                            { label: 'HOME BREAKFAST', val: '100% Included' },
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
                                                ⚡ Live Booking Desk • Flexible Konkan Train Check-In
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.6, mb: 2 }}>
                                            {['Riverfront Cottage', 'Eco Beach Villa', 'Heritage Karavali Stay', 'Private Family Estate'].map((pill, mIdx) => (
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
                                            Check Dates & Reserve Room
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. DATE & GUEST SEARCH DOCK
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 4, md: 5 } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: 3.5,
                            bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                            border: `1px solid ${cardBorderColor}`,
                            boxShadow: isDark ? '0 15px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(225, 29, 72, 0.05)',
                        }}
                    >
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.5 }}>
                                    CHECK-IN DATE
                                </Typography>
                                <TextField
                                    type="date"
                                    fullWidth
                                    size="small"
                                    value={checkInDate}
                                    onChange={(e) => setCheckInDate(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.5 }}>
                                    CHECK-OUT DATE
                                </Typography>
                                <TextField
                                    type="date"
                                    fullWidth
                                    size="small"
                                    value={checkOutDate}
                                    onChange={(e) => setCheckOutDate(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor, display: 'block', mb: 0.5 }}>
                                    ROOM GUESTS
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(e.target.value)}
                                >
                                    <MenuItem value="1 Guest">1 Solo Guest</MenuItem>
                                    <MenuItem value="2 Guests">2 Guests (Couple / Friends)</MenuItem>
                                    <MenuItem value="3 - 4 Guests">3 - 4 Guests (Small Family)</MenuItem>
                                    <MenuItem value="5 - 8 Guests">5 - 8 Guests (Large Family)</MenuItem>
                                    <MenuItem value="9+ Guests">9+ Guests (Entire Villa Group)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ pt: { xs: 1, md: 3 } }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => setModalOpen(true)}
                                    sx={{
                                        bgcolor: '#E11D48',
                                        color: '#FFFFFF',
                                        fontWeight: 850,
                                        height: 42,
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#BE123C' },
                                    }}
                                >
                                    Check Room Availability
                                </Button>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                                <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                    Standard Check-in: 12:00 PM • Express early morning Konkan train check-in readily accommodated
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 600 }}>
                                Dual Hub Support: Honnavar Railway Station Desk & Palya Main Road Office
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* =========================================================================
                    3. ROOMS & COTTAGES CATALOG (Live DB Items + Curated Tiers)
                ========================================================================== */}
                <Box id="rooms-catalog" sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                        <Box>
                            <Chip label="HANDPICKED COASTAL STAYS" size="small" sx={{ bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontWeight: 850, mb: 1 }} />
                            <Typography variant="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.6rem' } }}>
                                Available Rooms & Cottages in Honnavar
                            </Typography>
                            <Typography variant="body2" sx={{ color: secondaryTextColor, mt: 0.5 }}>
                                Showing verified active rooms with real-time host coordination and zero hidden resort fees.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8 }}>
                            {['All', 'Riverfront', 'Beachside', 'Heritage', 'Villa'].map((cat) => (
                                <Chip
                                    key={cat}
                                    label={cat}
                                    onClick={() => setSelectedRoomCategory(cat)}
                                    sx={{
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        bgcolor: selectedRoomCategory === cat ? '#E11D48' : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                                        color: selectedRoomCategory === cat ? '#FFFFFF' : primaryTextColor,
                                        '&:hover': { filter: 'brightness(0.95)' },
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Grid container spacing={3.5}>
                        {displayRooms.map((room) => (
                            <Grid key={room.id} size={{ xs: 12, md: 6, lg: 6 }}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        borderRadius: 4,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            borderColor: '#E11D48',
                                            boxShadow: '0 16px 32px -8px rgba(225, 29, 72, 0.2)',
                                        },
                                    }}
                                >
                                    {/* Room Image */}
                                    <Box sx={{ position: 'relative', width: { xs: '100%', sm: '42%' }, minHeight: { xs: 220, sm: 'auto' } }}>
                                        <Box
                                            component="img"
                                            src={room.image}
                                            alt={room.name}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />
                                        <Chip
                                            label={room.badge}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                color: '#FFFFFF',
                                                fontWeight: 850,
                                                fontSize: '0.72rem',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(225, 29, 72, 0.7)',
                                            }}
                                        />
                                        {room.isDb && (
                                            <Chip
                                                label="⚡ Live DB Verified"
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 12,
                                                    left: 12,
                                                    bgcolor: '#10B981',
                                                    color: '#FFFFFF',
                                                    fontWeight: 900,
                                                    fontSize: '0.68rem',
                                                }}
                                            />
                                        )}
                                    </Box>

                                    {/* Room Details */}
                                    <CardContent sx={{ p: 3, width: { xs: '100%', sm: '58%' }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                                                <Typography variant="caption" sx={{ color: '#E11D48', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    {room.type}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <StarIcon sx={{ color: '#F59E0B', fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 850, color: primaryTextColor }}>
                                                        {room.rating}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor }}>
                                                        ({room.reviewsCount})
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Typography variant="h6" sx={{ fontWeight: 900, color: primaryTextColor, lineHeight: 1.25, mb: 1 }}>
                                                {room.name}
                                            </Typography>

                                            <Typography variant="caption" sx={{ color: mutedTextColor, display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                                <LocationOnIcon sx={{ fontSize: 14, color: '#E11D48' }} />
                                                {room.location}
                                            </Typography>

                                            {/* Room Specs */}
                                            <Stack spacing={0.8} sx={{ mb: 2.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <GroupsIcon sx={{ fontSize: 16, color: '#0284C7' }} />
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                        {room.capacity}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <BedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                        {room.bedType}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            {/* Feature Chips */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
                                                {room.highlights.slice(0, 3).map((feat, fIdx) => (
                                                    <Chip
                                                        key={fIdx}
                                                        label={feat}
                                                        size="small"
                                                        sx={{
                                                            fontSize: '0.68rem',
                                                            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                                            color: secondaryTextColor,
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>

                                        {/* Pricing & CTA */}
                                        <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontSize: '0.68rem' }}>
                                                        Daily Tariff
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 950, color: '#E11D48' }}>
                                                        ₹{room.pricePerNight.toLocaleString('en-IN')}
                                                        <Box component="span" sx={{ fontSize: '0.75rem', color: secondaryTextColor, fontWeight: 600, ml: 0.5 }}>
                                                            / night
                                                        </Box>
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800 }}>
                                                    ✓ Breakfast Included
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    onClick={() => setSelectedRoomForDetail(room)}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                                        color: primaryTextColor,
                                                        fontWeight: 750,
                                                        fontSize: '0.78rem',
                                                        borderRadius: 2,
                                                        flexGrow: 1,
                                                    }}
                                                >
                                                    Details & Photos
                                                </Button>
                                                <Button
                                                    onClick={() => setModalOpen(true)}
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#E11D48',
                                                        color: '#FFFFFF',
                                                        fontWeight: 850,
                                                        fontSize: '0.78rem',
                                                        borderRadius: 2,
                                                        flexGrow: 1,
                                                        '&:hover': { bgcolor: '#BE123C' },
                                                    }}
                                                >
                                                    Book Now
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    4. COMPREHENSIVE HOMESTAY AMENITIES MATRIX
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Chip
                            label="COMFORT & HOSPITALITY STANDARDS"
                            sx={{ bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontWeight: 850, mb: 1.5 }}
                        />
                        <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1 }}>
                            Standard Homestay Amenities & Hospitality
                        </Typography>
                        <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 660, mx: 'auto' }}>
                            Every cottage and room listed with GK WhizWheels conforms to strict cleanliness, hygiene, and guest privacy standards.
                        </Typography>
                    </Box>

                    <Grid container spacing={2.5}>
                        {AMENITY_LIST.map((item, idx) => (
                            <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
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
                                        gap: 1.5,
                                    }}
                                >
                                    <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {item.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.94rem', lineHeight: 1.3 }}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.78rem', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                                            {item.desc}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    5. HOW HONNAVAR HOMESTAY BOOKING WORKS (Step-by-Step Flow)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Chip
                            label="TRANSPARENT WORKFLOW"
                            sx={{ bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontWeight: 850, mb: 1.5 }}
                        />
                        <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1.5 }}>
                            How Homestay Room Booking Works
                        </Typography>
                        <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto' }}>
                            Zero double-booking headaches. Fast confirmation with direct GPS navigation and host coordination.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                step: '01',
                                title: 'Select Room & Dates',
                                desc: 'Choose your desired riverfront wooden cottage, beach villa, or family estate with your exact travel dates.',
                                color: '#E11D48',
                                badge: '⚡ Real-time Availability',
                            },
                            {
                                step: '02',
                                title: 'Instant Confirmation',
                                desc: 'Our Honnavar coordinator locks the room, confirms bed layout, and shares photos and live GPS coordinates.',
                                color: '#0284C7',
                                badge: '📍 Exact GPS Coordinates',
                            },
                            {
                                step: '03',
                                title: 'Arrival & Station Pickup',
                                desc: 'Arriving on Konkan Railway? Pick up your rental bike/cab right at Station Platform 1 and ride to your stay.',
                                color: '#10B981',
                                badge: '🚉 Seamless Transit Link',
                            },
                            {
                                step: '04',
                                title: 'Relax & Savour Coastal Life',
                                desc: 'Enjoy homemade Karavali meals, sunset river balcony views, and private backwater boat cruises right from the dock.',
                                color: '#F59E0B',
                                badge: '☕ Fresh Breakfast Included',
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
                    6. DISTANCES FROM HONNAVAR HOMESTAY CLUSTERS
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Chip
                            label="PROXIMITY & SIGHTSEEING MATRIX"
                            sx={{ bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontWeight: 850, mb: 1.5 }}
                        />
                        <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor }}>
                            Distances from Honnavar Homestay Belts
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto', mt: 1 }}>
                            Convenient access to beaches, river cruises, and heritage landmarks in Uttara Kannada.
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
                            {DISTANCE_MATRIX.map((item, dIdx) => (
                                <Grid
                                    key={dIdx}
                                    size={{ xs: 12, sm: 6, md: 3 }}
                                    sx={{
                                        p: 2.5,
                                        borderRight: { sm: (dIdx + 1) % 2 !== 0 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0') : 'none', md: (dIdx + 1) % 4 !== 0 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0') : 'none' },
                                        borderBottom: dIdx < DISTANCE_MATRIX.length - 4 ? (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0') : { xs: '1px solid #E2E8F0', md: 'none' },
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.88rem' }}>
                                        {item.spot}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Chip
                                            size="small"
                                            label={item.dist}
                                            sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#E11D48' }}
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
                    7. INCLUSIONS & POLICIES CHECKLIST
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
                                        What's Included in Your Room Stay
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {[
                                        'Freshly cooked traditional coastal Karnataka breakfast included daily',
                                        'Clean sanitized bed linen, towels, and essential toiletries',
                                        'High-speed Wi-Fi internet and silent inverter power backup',
                                        'Safe private parking for two-wheelers and passenger cars',
                                        'Local host travel guidance for crowd-free hidden sightseeing spots',
                                        'Assistance with backwater boating and scuba dive activity bookings',
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
                                        House Rules & Exclusions
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {[
                                        'Government-issued Photo ID (Aadhaar/Passport) mandatory at check-in for all guests',
                                        'Home-cooked lunch & dinner available on pre-order at nominal home rates',
                                        'Standard check-in: 12:00 PM | Standard check-out: 11:00 AM (Early check-in subject to availability)',
                                        'Quiet hours observed post 10:30 PM to preserve peaceful village surroundings',
                                        'Bonfire / BBQ setups arranged with advance notice (nominal charge for firewood)',
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
                    8. FREQUENTLY ASKED QUESTIONS (Accordion)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, mb: 1 }}>
                        Honnavar Homestays — Frequently Asked Questions
                    </Typography>
                    <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 3.5 }}>
                        Everything you need to know about food, train arrivals, family safety, and booking rules.
                    </Typography>

                    <Stack spacing={1.5}>
                        {[
                            {
                                q: 'What is the check-in and check-out timing for homestays in Honnavar?',
                                a: 'Standard check-in is 12:00 PM and check-out is 11:00 AM. However, if you are arriving on early morning Konkan Railway trains (e.g., 4:00 AM to 7:00 AM), we provide flexible luggage drop and early room check-in subject to previous night occupancy.',
                            },
                            {
                                q: 'Is fresh homecooked food provided at the homestays?',
                                a: 'Yes! All room bookings include a complimentary authentic Karavali/Malnad breakfast (such as fresh Neer Dosa, Idlis, Chutney, and filter coffee). Lunch and dinner featuring vegetarian thalis and fresh Arabian Sea catch (fish curry/fry) can be pre-ordered from the host family at very reasonable home rates.',
                            },
                            {
                                q: 'Are these homestays suitable for unmarried couples and families with kids?',
                                a: 'Yes. All our listed properties are verified family residences that welcome respectful couples, solo travelers, and families. A valid government photo ID (Aadhaar or Passport) is required for each guest during check-in.',
                            },
                            {
                                q: 'Can we book a rental bike or cab directly to the homestay?',
                                a: 'Absolutely! GK WhizWheels operates an integrated mobility network. We can have your rental Honda Activa, Royal Enfield, or AC taxi waiting for you right at Honnavar Railway Station or delivered directly to your homestay doorstep.',
                            },
                            {
                                q: 'How far in advance should we book riverfront cottages in Honnavar?',
                                a: 'Riverfront cottages and Eco Beach suites have limited inventory and high demand on weekends and holiday months (October through March). We recommend reserving at least 1 to 2 weeks in advance.',
                            },
                        ].map((faq, fIdx) => (
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
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#E11D48' }} />}>
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
                    9. BOTTOM CALLOUT BANNER
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: 8 }}>
                    <Paper
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFF1F2',
                            border: '1.5px solid rgba(225, 29, 72, 0.4)',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <Box>
                            <Chip label="24x7 HONNAVAR STAYS ASSISTANCE" size="small" sx={{ bgcolor: '#E11D48', color: '#FFFFFF', fontWeight: 900, mb: 1.5 }} />
                            <Typography variant="h3" sx={{ fontWeight: 950, color: primaryTextColor, mb: 1, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' } }}>
                                Planning Your Stay in Honnavar?
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 650 }}>
                                Check live room availability, confirm family cottage dates, and request meal packages in minutes over WhatsApp or phone call.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20want%20to%20check%20availability%20for%20a%20Homestay%20in%20Honnavar."
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
                                WhatsApp Room Desk
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

                {/* Room Quick Detail Dialog */}
                {selectedRoomForDetail && (
                    <Dialog
                        open={Boolean(selectedRoomForDetail)}
                        onClose={() => setSelectedRoomForDetail(null)}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
                            {selectedRoomForDetail.name}
                            <Typography variant="caption" sx={{ color: '#E11D48', fontWeight: 800, display: 'block' }}>
                                {selectedRoomForDetail.type} • {selectedRoomForDetail.location}
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers sx={{ pt: 2 }}>
                            <Box component="img" src={selectedRoomForDetail.image} alt={selectedRoomForDetail.name} sx={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 2.5, mb: 2 }} />
                            <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2, lineHeight: 1.6 }}>
                                {selectedRoomForDetail.idealFor}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 1 }}>
                                Key Amenities & Features:
                            </Typography>
                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {selectedRoomForDetail.highlights.map((h, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                        <Typography variant="body2" sx={{ color: secondaryTextColor }}>{h}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                            <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block' }}>Tariff</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#E11D48' }}>₹{selectedRoomForDetail.pricePerNight} / night</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#10B981' }}>Breakfast Included</Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setSelectedRoomForDetail(null)} sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    setSelectedRoomForDetail(null);
                                    setModalOpen(true);
                                }}
                                variant="contained"
                                sx={{ bgcolor: '#E11D48', color: '#FFFFFF', fontWeight: 800, '&:hover': { bgcolor: '#BE123C' } }}
                            >
                                Proceed to Book
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}

                {/* Dedicated Homestay Booking Modal */}
                <HomestayBookingModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    initialRoomId={selectedRoomForDetail?.id || 'riverfront_cottage'}
                    availableItems={availableItems}
                />
            </Box>
        </AppLayout>
    );
}

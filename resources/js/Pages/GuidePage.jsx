import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@inertiajs/react';
import PageHead from '../Components/SEO/PageHead';
import AppLayout from '../Layouts/AppLayout';
import GuideBookingModal from '../Components/BookingModals/GuideBookingModal';
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
    Rating,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HikingIcon from '@mui/icons-material/Hiking';
import ParkIcon from '@mui/icons-material/Park';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
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
import TranslateIcon from '@mui/icons-material/Translate';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MapIcon from '@mui/icons-material/Map';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Guide Specializations Data
const GUIDE_SPECIALIZATIONS = [
    {
        id: 'heritage',
        title: 'Heritage & Temple Architecture Scholar',
        badge: 'HISTORY & CULTURE',
        color: '#D97706',
        icon: <AccountBalanceIcon sx={{ fontSize: 28, color: '#D97706' }} />,
        image: '/images/places/mirjan_fort.jpg',
        desc: 'Uncover the 16th-century fortress history of Queen Chennabhairadevi (The Pepper Queen), secret moats, and ancient Vedic temple legends across Gokarna, Idagunji, and Murudeshwar.',
        keyHighlights: [
            'Mirjan Fort double-bastion architecture & escape tunnels',
            'Gokarna Mahabaleshwar Atmalinga mythology & Vedic rituals',
            'Keladi Nayaka & Vijayanagara empire regional history',
            'Respectful temple custom & dress code navigation',
        ],
        languages: ['Kannada', 'English', 'Hindi', 'Konkani'],
        durationMatch: 'Half Day or Full Day',
        priceHint: 'From ₹800 (Half Day) / ₹1,500 (Full Day)',
    },
    {
        id: 'trekking',
        title: 'Western Ghats Trek & Waterfall Naturalist',
        badge: 'TREKKING & ADVENTURE',
        color: '#059669',
        icon: <HikingIcon sx={{ fontSize: 28, color: '#059669' }} />,
        image: '/images/places/apsarakonda_falls.jpg',
        desc: 'Trek through pristine Sahyadri rainforest trails to hidden seasonal waterfalls, secret forest natural dipping pools, and the massive volcanic limestone rock monoliths of Yana.',
        keyHighlights: [
            'Yana twin rock karst caves (Bhairaveshwara & Mohini)',
            'Hidden seasonal cascades away from crowded commercial spots',
            'Vibhooti Falls natural swimming pools & freshwater safety',
            'Certified first-aid trained & Forest Dept permit compliant',
        ],
        languages: ['Kannada', 'English', 'Hindi'],
        durationMatch: 'Full Day Recommended',
        priceHint: '₹1,500 (Full Day Trail)',
    },
    {
        id: 'mangroves',
        title: 'Sharavathi Mangrove & Wildlife Naturalist',
        badge: 'ECO-TOUR & BIRDING',
        color: '#0284C7',
        icon: <ParkIcon sx={{ fontSize: 28, color: '#0284C7' }} />,
        image: '/images/places/sharavathi_backwaters.jpg',
        desc: 'Learn about the delicate tidal backwater ecology of the Sharavathi River, mangrove boardwalks, endemic Malabar pied hornbills, kingfishers, and coastal flora.',
        keyHighlights: [
            'Guided walkway exploration of Honnavar mangrove forests',
            'Birdwatching: Kingfishers, sea eagles, egrets & hornbills',
            'Tidal estuary explanations & traditional fishing techniques',
            'Photographer golden hour angles & sunset viewpoints',
        ],
        languages: ['Kannada', 'English'],
        durationMatch: 'Half Day (Morning / Sunset)',
        priceHint: '₹800 (Half Day)',
    },
    {
        id: 'culinary',
        title: 'Coastal Culture, Village Life & Culinary Storyteller',
        badge: 'AUTHENTIC LIFESTYLE',
        color: '#7C3AED',
        icon: <RestaurantMenuIcon sx={{ fontSize: 28, color: '#7C3AED' }} />,
        image: '/images/places/eco_beach_boardwalk.jpg',
        desc: 'Immerse in native Uttara Kannada village life, authentic Karavali seafood spice traditions, Halakki Vokkaliga artisan folklore, and morning fish harbor auctions.',
        keyHighlights: [
            'Honnavar fishing harbor life & boat building traditions',
            'Indigenous Halakki Vokkaliga cultural storytelling',
            'Curated Karavali spice markets & local banana chips bakeries',
            'Insider recommendations for authentic non-commercial seafood',
        ],
        languages: ['Kannada', 'English', 'Konkani'],
        durationMatch: 'Half Day (3 - 4 Hours)',
        priceHint: '₹800 (Half Day)',
    },
];

// Curated Guided Circuits
const CURATED_CIRCUITS = [
    {
        id: 'mirjan-heritage',
        title: 'Mirjan Fort & Royal Pepper Queen Heritage Walk',
        subtitle: '16th Century Moated Citadel & Spice Empire Secrets',
        duration: '3.5 Hours',
        timing: 'Morning (8:30 AM) or Sunset (3:30 PM)',
        difficulty: 'Easy (Family & Senior Friendly)',
        distanceFromHonnavar: '21 km (25 Mins Drive)',
        price: '₹800',
        priceUnit: 'per group up to 6 pax',
        image: '/images/places/mirjan_fort.jpg',
        highlights: [
            'Discover Queen Chennabhairadevi who ruled for 54 years resisting Portuguese naval blockades',
            'Walk through secret watchtowers, water wells, and interlinked stone battlements',
            'Historical architectural explanations of laterite stone construction & moats',
            'Includes photography angles of moss-covered ramparts & ancient trees',
        ],
        includedPerks: ['Dedicated Native Historian', 'Historical Storytelling', 'Photo Spots Guidance', 'Kids & Senior Pacing'],
    },
    {
        id: 'honnavar-mangrove',
        title: 'Honnavar Mangroves, Apsarakonda & Sunset Trail',
        subtitle: 'Sacred Hilltop, Freshwater Cascade & Boardwalk Sanctuary',
        duration: '4.0 Hours',
        timing: '3:00 PM – 7:00 PM (Ideal Sunset Circuit)',
        difficulty: 'Easy to Moderate',
        distanceFromHonnavar: 'Starts within Honnavar (Town & Apsarakonda)',
        price: '₹800',
        priceUnit: 'per group up to 6 pax',
        image: '/images/places/apsarakonda_falls.jpg',
        highlights: [
            'Apsarakonda freshwater waterfall overlooking the Arabian Sea and historic Pandava cave',
            'Panoramic hilltop view from Colonel Hill British memorial tower',
            'Guided walk along the lush mangrove boardwalk of Sharavathi estuary',
            'Spectacular sunset conclusion at Kasarkod Blue Flag Eco Beach',
        ],
        includedPerks: ['Native Local Born Guide', 'Mangrove Ecosystem Lore', 'Sunset Point Timing', 'Secret Photo Angles'],
    },
    {
        id: 'yana-vibhooti',
        title: 'Yana Karst Monoliths & Vibhooti Waterfall Jungle Expedition',
        subtitle: 'Deep Western Ghats Rainforest Trek & Natural Spring Pools',
        duration: '7.0 Hours (Full Day)',
        timing: '8:00 AM – 3:30 PM',
        difficulty: 'Moderate (Forest Steps & Trails)',
        distanceFromHonnavar: '48 km (1 Hr 15 Mins Drive)',
        price: '₹1,500',
        priceUnit: 'per group up to 6 pax',
        image: '/images/places/gokarna_beaches.jpg',
        highlights: [
            'Ascent to the colossal Bhairaveshwara (120m) & Mohini (90m) crystalline black rock towers',
            'Self-manifested cave temple exploration and bat-sanctuary geological formations',
            'Canopy trek through dense evergreen Sahyadri forest with endemic bird calls',
            'Refreshing dip in the crystal-clear stepped pools of Vibhooti Falls',
        ],
        includedPerks: ['Forest Trail Leader', 'First-Aid Kit Carry', 'Swimming Safety Guidance', 'Local Lunch Spot Access'],
    },
    {
        id: 'gokarna-cliff',
        title: 'Gokarna Sacred Temples & 5-Beach Cliff Walk',
        subtitle: 'Ancient Atmalinga Lore & Arabian Sea Coastal Ridge Trek',
        duration: '8.0 Hours (Full Day)',
        timing: '7:30 AM – 4:30 PM',
        difficulty: 'Moderate (Coastal Rocky Ridge Hike)',
        distanceFromHonnavar: '52 km (1 Hr Drive)',
        price: '₹1,500',
        priceUnit: 'per group up to 6 pax',
        image: '/images/places/murudeshwar_temple.jpg',
        highlights: [
            'Detailed mythology of the Ravana Atmalinga legend at Sri Mahabaleshwar Temple',
            'Koti Teertha holy water tank rituals and centuries-old temple street architecture',
            'Spectacular cliff trek connecting Gokarna Main Beach, Kudle Beach & Om Beach',
            'Option to extend to secluded Half Moon & Paradise beaches via rocky coastal paths',
        ],
        includedPerks: ['Temple Scholar & Trek Lead', 'Vedic Custom Protocol Guidance', 'Cliff Path Safety', 'Best Beach Cafe Stops'],
    },
];

// Verified Lead Guide Profiles
const VERIFIED_GUIDES = [
    {
        name: 'Manjunath Naik',
        title: 'Senior Heritage & Temple Historian',
        experience: '12+ Years Guided Experience',
        hometown: 'Honnavar Native',
        languages: 'Kannada, English, Hindi',
        rating: 4.99,
        reviewsCount: 184,
        specialty: 'Mirjan Fort, Temple Architecture & Regional Royal Dynasties',
        quote: '“History is not just dates—it is the sound of cannons on the Aghanashini river and the courage of the Pepper Queen defending her homeland.”',
        badge: 'Govt. Tourism Badge #UK-018',
        avatarInitials: 'MN',
        avatarBg: '#D97706',
    },
    {
        name: 'Raghavendra Hegde',
        title: 'Sahyadri Rainforest & Waterfall Trek Leader',
        experience: '8+ Years Leading Forest Treks',
        hometown: 'Kumta / Yana Foothills',
        languages: 'Kannada, English',
        rating: 4.97,
        reviewsCount: 142,
        specialty: 'Yana Rock Monoliths, Vibhooti Cascades & Wild Flora',
        quote: '“When you step into the Sahyadri with someone who knows every stream, the forest reveals secret pools tourists drive right past.”',
        badge: 'Certified First Responder & Eco-Guide',
        avatarInitials: 'RH',
        avatarBg: '#059669',
    },
    {
        name: 'Shruti Bhat',
        title: 'Culture, Vedic Lore & Coastal Living Host',
        experience: '6+ Years Cultural Hospitality',
        hometown: 'Gokarna / Honnavar Coast',
        languages: 'Kannada, English, Konkani',
        rating: 4.98,
        reviewsCount: 118,
        specialty: 'Sacred Temple Customs, Halakki Traditions & Coastal Cuisine',
        quote: '“Visiting sacred coastal shrines with their authentic cultural context turns a sightseeing trip into a deeply memorable journey.”',
        badge: 'Cultural Ambassador #KA-304',
        avatarInitials: 'SB',
        avatarBg: '#7C3AED',
    },
    {
        name: 'Ganesh Gouda',
        title: 'Sharavathi Wetland & Birding Naturalist',
        experience: '9+ Years Estuary Guide',
        hometown: 'Gundbala, Honnavar',
        languages: 'Kannada, Hindi',
        rating: 4.96,
        reviewsCount: 96,
        specialty: 'Mangrove Forests, Kingfishers, River Ecology & Sunsets',
        quote: '“The Sharavathi mangroves are alive with kingfishers, mudskippers, and hornbills. You just have to know how to listen.”',
        badge: 'Wetland Conservation Associate',
        avatarInitials: 'GG',
        avatarBg: '#0284C7',
    },
];

// Distance Matrix from Honnavar Hubs
const SIGHTSEEING_DISTANCES = [
    { spot: 'Mirjan Fort (Aghanashini Basin)', dist: '21 km', time: '25 Mins', road: 'NH-66 Four-Lane Smooth', guideTime: '2 to 3.5 Hours' },
    { spot: 'Apsarakonda Waterfalls & Hilltop', dist: '8 km', time: '15 Mins', road: 'Coastal Scenic Drive', guideTime: '1.5 to 2.5 Hours' },
    { spot: 'Sharavathi Mangrove Boardwalk', dist: '3.5 km', time: '8 Mins', road: 'Town Road & Estuary Access', guideTime: '1.5 to 2.0 Hours' },
    { spot: 'Yana Karst Monolith Caves', dist: '48 km', time: '1 Hr 15 Mins', road: 'Western Ghats Winding Forest Road', guideTime: '3.5 to 4.5 Hours' },
    { spot: 'Vibhooti Freshwater Cascades', dist: '44 km', time: '1 Hr 10 Mins', road: 'Forest Ghat Road', guideTime: '2.5 to 3.5 Hours' },
    { spot: 'Gokarna Mahabaleshwar & Om Beach', dist: '52 km', time: '1 Hr 05 Mins', road: 'NH-66 + Beach Road', guideTime: '4 to 8 Hours' },
    { spot: 'Murudeshwar Shiva Temple & Beach', dist: '27 km', time: '35 Mins', road: 'NH-66 Coastal Highway', guideTime: '2.5 to 4 Hours' },
    { spot: 'Jog Falls (Gersoppa River Source)', dist: '60 km', time: '1 Hr 25 Mins', road: 'Ghat Ascent via NH-69', guideTime: '3.5 to 5 Hours' },
];

// FAQs Data (Guide-specific)
const GUIDE_FAQS = [
    {
        q: 'What languages do your local guides speak?',
        a: 'All our guides are fluent in Kannada and English. Many are also fluent in Hindi and Konkani. You can specify your preferred language when making your booking so we match the perfect companion for your family or group.',
    },
    {
        q: 'What is the maximum group size per guide?',
        a: 'To guarantee personal attention and safe trail navigation, our standard flat-rate tariff covers private groups up to 6–8 persons. For larger family reunions, bus tours, or corporate retreats, we can assign a second co-guide at a discounted rate.',
    },
    {
        q: 'What is your tipping expectation and hidden charge policy?',
        a: 'Zero hidden fees. Our upfront tariff (₹800 Half-Day / ₹1,500 Full-Day) is completely inclusive of the guide’s service. Tipping is 100% voluntary and never solicited. Furthermore, guides operate under a strict zero-commission policy—no detour into commercial kickback gift shops.',
    },
    {
        q: 'How does the guide accompany us during the tour?',
        a: 'Our guides can accompany you inside your own private vehicle, rental car, or taxi. If you rented two-wheelers through GK WhizWheels, your guide can either ride pillion with you or ride alongside on their own two-wheeler to lead the trail.',
    },
    {
        q: 'What happens in bad weather or forest trail closures?',
        a: 'If sudden rain or forest department advisories close a steep jungle trail (like Yana or Vibhooti), your guide immediately suggests safe alternate coastal heritage circuits (Mirjan Fort, Apsarakonda, or estuary temples), or we reschedule at no penalty.',
    },
];

const guideFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GUIDE_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
        },
    })),
};

export default function GuidePage({ availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [modalOpen, setModalOpen] = useState(false);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedItemForGallery, setSelectedItemForGallery] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState('half_day'); // 'half_day' | 'full_day'
    const [activeCircuitTab, setActiveCircuitTab] = useState('all'); // 'all', 'heritage', 'nature'

    const primaryGuideItem = availableItems.length > 0 ? availableItems[0] : null;
    const primaryGuideMedia = useMemo(() => {
        return getServiceItemMedia(primaryGuideItem, '/images/services/guide.jpg');
    }, [primaryGuideItem]);

    const displaySpecializations = useMemo(() => {
        return GUIDE_SPECIALIZATIONS.map((spec, idx) => {
            const matchedItem = availableItems.find(ai =>
                ai.id === spec.id ||
                ai.category?.toLowerCase() === spec.id ||
                ai.name?.toLowerCase().includes(spec.badge.toLowerCase().split(' ')[0])
            ) || availableItems[idx] || null;

            const media = getServiceItemMedia(matchedItem, spec.image);
            return {
                ...spec,
                item: matchedItem,
                media,
            };
        });
    }, [availableItems]);

    // UI Color tokens
    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155';
    const mutedTextColor = isDark ? '#94A3B8' : '#64748B';
    const cardBgColor = isDark ? '#111827' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

    const filteredCircuits = useMemo(() => {
        if (activeCircuitTab === 'all') return CURATED_CIRCUITS;
        if (activeCircuitTab === 'heritage') return CURATED_CIRCUITS.filter(c => c.id === 'mirjan-heritage' || c.id === 'gokarna-cliff');
        if (activeCircuitTab === 'nature') return CURATED_CIRCUITS.filter(c => c.id === 'honnavar-mangrove' || c.id === 'yana-vibhooti');
        return CURATED_CIRCUITS;
    }, [activeCircuitTab]);

    return (
        <AppLayout noFooterMargin>
            <PageHead
                title="Certified Local Tour Guides in Honnavar & Coastal Trails | GK WhizWheel"
                description="Hire verified native tour guides in Honnavar from ₹800/day. Discover Mirjan Fort, Yana Caves, Vibhooti Falls & secret trails with local storytellers."
                canonicalUrl="https://whizwheels.in/services/guide"
                ogImage="/images/services/guide.jpg"
                ogType="website"
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: 'Local Tour Guide Service Honnavar',
                        description: 'Certified multilingual local tour guides for heritage trails, waterfalls, temples, and coastal expeditions across Honnavar, Gokarna, and Yana.',
                        category: 'Travel Guide',
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'INR',
                            lowPrice: '800',
                            highPrice: '2500',
                            offerCount: '5',
                            price: '800',
                        },
                        provider: {
                            '@type': 'LocalBusiness',
                            name: 'GK WhizWheel',
                            telephone: '+918660989586',
                            url: 'https://whizwheels.in',
                        },
                    },
                    guideFaqSchema,
                ]}
            />

            <Box sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    2. MODERN 2-COLUMN HERO SECTION
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="guide-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E293B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 50%, #F8FAFC 100%)',
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
                                <Typography variant="caption" sx={{ color: mutedTextColor, '&:hover': { color: '#D97706' } }}>
                                    Home
                                </Typography>
                            </Link>
                            <Link href="/services" style={{ textDecoration: 'none' }}>
                                <Typography variant="caption" sx={{ color: mutedTextColor, '&:hover': { color: '#D97706' } }}>
                                    Services
                                </Typography>
                            </Link>
                            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>
                                Local Tour Guides & Storytellers
                            </Typography>
                        </Breadcrumbs>

                        <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
                            {/* Left Column: Hero Typography & Value Props */}
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <Chip
                                    icon={<AccountBalanceIcon sx={{ fontSize: '16px !important', color: '#D97706' }} />}
                                    label="GOVERNMENT BADGED & NATIVE STORYTELLERS"
                                    sx={{
                                        mb: 2,
                                        px: 1.5,
                                        py: 0.5,
                                        fontWeight: 800,
                                        fontSize: '0.78rem',
                                        letterSpacing: '0.04em',
                                        color: '#B45309',
                                        bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                        border: '1px solid',
                                        borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                    }}
                                />

                                <Typography
                                    id="guide-hero-heading"
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
                                    Uncover Coastal Karnataka with{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #92400E 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            display: 'inline',
                                        }}
                                    >
                                        Native Local Storytellers
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
                                    Forget rushed tour buses and tourist traps. From the 16th-century fortress bastions of Queen Chennabhairadevi (The Pepper Queen) to secret Sahyadri waterfalls, ancient Vedic temple lore, and untouched Sharavathi mangrove walkways—our born-and-raised local guides give you the authentic insider access standard maps never show.
                                </Typography>

                                {/* 4 Trust Pillars */}
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    {[
                                        { title: '100% Native Born', desc: 'Raised in Honnavar & Kumta with generational folklore', icon: <ExploreIcon sx={{ color: '#D97706', fontSize: 20 }} /> },
                                        { title: 'Multilingual Fluent', desc: 'Kannada, English, Hindi & Konkani speaking guides', icon: <TranslateIcon sx={{ color: '#059669', fontSize: 20 }} /> },
                                        { title: 'Women & Family Safe', desc: 'Police background verified with verified badge IDs', icon: <ShieldIcon sx={{ color: '#0284C7', fontSize: 20 }} /> },
                                        { title: 'Zero Commissions', desc: 'No forced souvenir shops or commercial kickback traps', icon: <VerifiedUserIcon sx={{ color: '#7C3AED', fontSize: 20 }} /> },
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

                                {/* Hero CTAs */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => setModalOpen(true)}
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: '#D97706',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            px: 3.5,
                                            py: 1.5,
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.35)',
                                            '&:hover': {
                                                bgcolor: '#B45309',
                                                boxShadow: '0 12px 28px rgba(217, 119, 6, 0.45)',
                                            },
                                        }}
                                    >
                                        Book a Local Guide (From ₹800)
                                    </Button>

                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20am%20looking%20for%20a%20local%20tour%20guide%20in%20Honnavar%20%2F%20Coastal%20Karnataka."
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
                                        WhatsApp Concierge
                                    </Button>
                                </Stack>

                                <Typography variant="caption" sx={{ color: mutedTextColor, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                    No advance cancellation penalty • Guide matches in 30 minutes • Instant telephone briefing
                                </Typography>
                            </Grid>

                            {/* Right Column: Interactive Featured Guide Showcase Card */}
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
                                            : '0 20px 40px rgba(217, 119, 6, 0.12)',
                                    }}
                                >
                                    {/* Image with overlay badge */}
                                    <Box 
                                        sx={{ 
                                            position: 'relative', 
                                            height: 260, 
                                            width: '100%', 
                                            overflow: 'hidden',
                                            cursor: primaryGuideMedia.gallery.length > 0 ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            if (primaryGuideMedia.gallery.length > 0) {
                                                setSelectedItemForGallery(primaryGuideItem);
                                                setGalleryModalOpen(true);
                                            }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={primaryGuideMedia.primary}
                                            alt="Certified local tour guide exploring heritage trails in Honnavar"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                                '&:hover': primaryGuideMedia.gallery.length > 0 ? { transform: 'scale(1.04)' } : {},
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)',
                                            }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Chip
                                                icon={<VerifiedUserIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                                label="VERIFIED LOCAL COMPANION"
                                                sx={{
                                                    bgcolor: 'rgba(217, 119, 6, 0.95)',
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    fontSize: '0.72rem',
                                                    backdropFilter: 'blur(8px)',
                                                }}
                                            />
                                            {primaryGuideMedia.hasMultiple && (
                                                <Chip
                                                    icon={<PhotoLibraryIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                                                    size="small"
                                                    label={`${primaryGuideMedia.count} Photos`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedItemForGallery(primaryGuideItem);
                                                        setGalleryModalOpen(true);
                                                    }}
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        cursor: 'pointer',
                                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                                        '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.9)' },
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                                                <Box>
                                                    <Typography variant="h6" component="p" sx={{ color: '#FFFFFF', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                        Dedicated Native Storyteller
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <LocationOnIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                                        Honnavar • Gokarna • Kumta • Yana
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
                                                        <StarIcon sx={{ fontSize: 14 }} /> 4.98 (340+ Tours)
                                                    </Typography>
                                                </Paper>
                                            </Stack>
                                        </Box>
                                    </Box>

                                    {/* Card Content & Interactive Tariff Selector */}
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="subtitle2" sx={{ color: mutedTextColor, fontWeight: 700, mb: 1.2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Select Tour Duration & Flat Tariff
                                        </Typography>

                                        {/* Duration Selector Buttons */}
                                        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                                            <Grid size={{ xs: 6 }}>
                                                <Paper
                                                    onClick={() => setSelectedDuration('half_day')}
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2.5,
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        border: selectedDuration === 'half_day' ? '2px solid #D97706' : `1px solid ${cardBorderColor}`,
                                                        bgcolor: selectedDuration === 'half_day'
                                                            ? isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB'
                                                            : 'transparent',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: selectedDuration === 'half_day' ? '#D97706' : primaryTextColor }}>
                                                        Half Day
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block' }}>
                                                        Up to 4 Hours
                                                    </Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#D97706', mt: 0.5 }}>
                                                        ₹800
                                                    </Typography>
                                                </Paper>
                                            </Grid>

                                            <Grid size={{ xs: 6 }}>
                                                <Paper
                                                    onClick={() => setSelectedDuration('full_day')}
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2.5,
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        border: selectedDuration === 'full_day' ? '2px solid #D97706' : `1px solid ${cardBorderColor}`,
                                                        bgcolor: selectedDuration === 'full_day'
                                                            ? isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB'
                                                            : 'transparent',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: selectedDuration === 'full_day' ? '#D97706' : primaryTextColor }}>
                                                        Full Day
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block' }}>
                                                        Up to 8 Hours
                                                    </Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#D97706', mt: 0.5 }}>
                                                        ₹1,500
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>

                                        {/* What's Included in this duration */}
                                        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC', mb: 2.5, border: `1px dashed ${cardBorderColor}` }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#D97706', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                {selectedDuration === 'half_day' ? 'Half-Day Inclusions (4 Hours):' : 'Full-Day Inclusions (8 Hours):'}
                                            </Typography>
                                            <Stack spacing={0.8}>
                                                {(selectedDuration === 'half_day' ? [
                                                    '1 Dedicated native guide for your private group (up to 6 pax)',
                                                    'Choice of Mirjan Fort, Apsarakonda, or Honnavar Mangroves',
                                                    'Historical storytelling & local secret photo spots',
                                                    'Can ride pillion or join in your private vehicle',
                                                ] : [
                                                    'Dedicated certified local companion for up to 8 full hours',
                                                    'Covers deep circuits: Yana Caves + Vibhooti Falls or Gokarna',
                                                    'Forest trail navigation, swimming spot safety & temple customs',
                                                    'Authentic non-commercial Karavali food recommendations',
                                                ]).map((item, idx) => (
                                                    <Stack direction="row" spacing={1} alignItems="flex-start" key={idx}>
                                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', mt: 0.2 }} />
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, lineHeight: 1.4 }}>
                                                            {item}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </Box>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={() => setModalOpen(true)}
                                            sx={{
                                                bgcolor: '#D97706',
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                py: 1.4,
                                                borderRadius: 2.5,
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: '#B45309' },
                                            }}
                                        >
                                            Reserve {selectedDuration === 'half_day' ? 'Half-Day Guide (₹800)' : 'Full-Day Guide (₹1,500)'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    3. GUIDE SPECIALIZATIONS & EXPERTISES
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="CHOOSE YOUR EXPERIENCE"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                    color: '#B45309',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h2"
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
                                Specialized Guides for Every Travel Style
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
                                Whether you are an archaeology enthusiast, a trekker hunting secret jungle pools, or a family seeking sacred Vedic temple lore, our guides possess verified domain specialization.
                            </Typography>
                        </Box>

                        <Grid container spacing={3.5}>
                            {displaySpecializations.map((spec) => (
                                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={spec.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 3.5,
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            overflow: 'hidden',
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                boxShadow: isDark
                                                    ? '0 16px 32px rgba(0, 0, 0, 0.5)'
                                                    : '0 16px 32px rgba(0, 0, 0, 0.08)',
                                            },
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                position: 'relative', 
                                                height: 180, 
                                                overflow: 'hidden',
                                                cursor: spec.media.gallery.length > 0 ? 'pointer' : 'default',
                                            }}
                                            onClick={() => {
                                                if (spec.media.gallery.length > 0) {
                                                    setSelectedItemForGallery(spec.item || { name: spec.title, primary_image_url: spec.media.primary, gallery_image_urls: spec.media.gallery });
                                                    setGalleryModalOpen(true);
                                                }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={spec.media.primary}
                                                alt={`${spec.title} - Certified local tour guide service in Honnavar`}
                                                loading="lazy"
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.4s ease',
                                                    '&:hover': spec.media.gallery.length > 0 ? { transform: 'scale(1.05)' } : {},
                                                }}
                                            />
                                            <Chip
                                                label={spec.badge}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    left: 12,
                                                    bgcolor: spec.color,
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    fontSize: '0.68rem',
                                                }}
                                            />
                                            {spec.media.hasMultiple && (
                                                <Chip
                                                    icon={<PhotoLibraryIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                                                    size="small"
                                                    label={`${spec.media.count} Photos`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedItemForGallery(spec.item || { name: spec.title, primary_image_url: spec.media.primary, gallery_image_urls: spec.media.gallery });
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
                                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                                        '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.9)' },
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <CardContent sx={{ p: 2.8, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                                                    {spec.icon}
                                                </Box>
                                                <Typography variant="h6" component="h3" sx={{ fontWeight: 800, fontSize: '1.05rem', color: primaryTextColor, lineHeight: 1.25 }}>
                                                    {spec.title}
                                                </Typography>
                                            </Stack>

                                            <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2, lineHeight: 1.55 }}>
                                                {spec.desc}
                                            </Typography>

                                            <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

                                            <Typography variant="caption" sx={{ fontWeight: 700, color: mutedTextColor, textTransform: 'uppercase', mb: 1 }}>
                                                Core Expertise:
                                            </Typography>
                                            <Stack spacing={0.8} sx={{ mb: 2.5, flexGrow: 1 }}>
                                                {spec.keyHighlights.map((item, i) => (
                                                    <Stack direction="row" spacing={1} alignItems="flex-start" key={i}>
                                                        <CheckCircleIcon sx={{ fontSize: 14, color: spec.color, mt: 0.3 }} />
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, lineHeight: 1.35 }}>
                                                            {item}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>

                                            <Box sx={{ mt: 'auto' }}>
                                                <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                                                    {spec.languages.map((lang, li) => (
                                                        <Chip
                                                            key={li}
                                                            label={lang}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                height: 20,
                                                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                                                color: secondaryTextColor,
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>

                                                <Typography variant="caption" sx={{ fontWeight: 800, color: spec.color, display: 'block', mb: 1.5 }}>
                                                    {spec.priceHint}
                                                </Typography>

                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setModalOpen(true)}
                                                    sx={{
                                                        borderColor: spec.color,
                                                        color: spec.color,
                                                        fontWeight: 700,
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                                                            borderColor: spec.color,
                                                        },
                                                    }}
                                                >
                                                    Request This Specialist
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
                    4. CURATED GUIDED TRAILS & CIRCUITS
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
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
                            <Chip
                                label="POPULAR GUIDED CIRCUITS"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                    color: '#B45309',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h2"
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
                                Curated Itineraries with Your Dedicated Guide
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 700,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                Don’t know where to start? Choose one of our signature coastal itineraries. Your guide handles pacing, secret access, and historical context.
                            </Typography>
                        </Box>

                        {/* Circuit Filter Pills */}
                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 5, flexWrap: 'wrap', gap: 1 }}>
                            {[
                                { id: 'all', label: 'All Curated Trails' },
                                { id: 'heritage', label: '🏰 Heritage & Temples' },
                                { id: 'nature', label: '🌿 Rainforest & Waterfalls' },
                            ].map((tab) => (
                                <Chip
                                    key={tab.id}
                                    label={tab.label}
                                    clickable
                                    onClick={() => setActiveCircuitTab(tab.id)}
                                    sx={{
                                        px: 1.5,
                                        py: 2.2,
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        borderRadius: 2.5,
                                        bgcolor: activeCircuitTab === tab.id
                                            ? '#D97706'
                                            : isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                        color: activeCircuitTab === tab.id ? '#FFFFFF' : secondaryTextColor,
                                        border: `1px solid ${activeCircuitTab === tab.id ? '#D97706' : cardBorderColor}`,
                                        '&:hover': {
                                            bgcolor: activeCircuitTab === tab.id ? '#B45309' : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                                        },
                                    }}
                                />
                            ))}
                        </Stack>

                        <Grid container spacing={4}>
                            {filteredCircuits.map((circuit) => (
                                <Grid size={{ xs: 12, md: 6 }} key={circuit.id}>
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
                                            transition: 'box-shadow 0.3s ease',
                                            '&:hover': {
                                                boxShadow: isDark
                                                    ? '0 18px 36px rgba(0,0,0,0.6)'
                                                    : '0 18px 36px rgba(217, 119, 6, 0.08)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ position: 'relative', height: 220 }}>
                                            <Box
                                                component="img"
                                                src={circuit.image}
                                                alt={`${circuit.title} - Guided sightseeing circuit trail in Coastal Karnataka`}
                                                loading="lazy"
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.3) 60%, transparent 100%)',
                                                }}
                                            />
                                            <Chip
                                                label={circuit.duration}
                                                icon={<AccessTimeIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    left: 14,
                                                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                                                    color: '#FFFFFF',
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem',
                                                    backdropFilter: 'blur(6px)',
                                                }}
                                            />
                                            <Chip
                                                label={circuit.difficulty}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    right: 14,
                                                    bgcolor: 'rgba(217, 119, 6, 0.9)',
                                                    color: '#FFFFFF',
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem',
                                                }}
                                            />
                                            <Box sx={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                                                <Typography variant="h5" component="h3" sx={{ color: '#FFFFFF', fontWeight: 800, lineHeight: 1.2, mb: 0.4 }}>
                                                    {circuit.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#FDE68A', fontWeight: 600 }}>
                                                    {circuit.subtitle}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontWeight: 600 }}>
                                                        RECOMMENDED TIMING
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                        {circuit.timing}
                                                    </Typography>
                                                </Grid>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontWeight: 600 }}>
                                                        LOCATION FROM HONNAVAR
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: primaryTextColor }}>
                                                        {circuit.distanceFromHonnavar}
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

                                            <Typography variant="caption" sx={{ fontWeight: 700, color: mutedTextColor, textTransform: 'uppercase', mb: 1 }}>
                                                Circuit Highlights:
                                            </Typography>
                                            <Stack spacing={1} sx={{ mb: 3, flexGrow: 1 }}>
                                                {circuit.highlights.map((h, i) => (
                                                    <Stack direction="row" spacing={1} alignItems="flex-start" key={i}>
                                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#059669', mt: 0.2 }} />
                                                        <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.45, fontSize: '0.88rem' }}>
                                                            {h}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>

                                            <Box sx={{ mt: 'auto', pt: 2.5, borderTop: `1px solid ${cardBorderColor}` }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                                            Guide Fee (Flat Rate)
                                                        </Typography>
                                                        <Typography variant="h4" component="span" sx={{ fontWeight: 900, color: '#D97706', lineHeight: 1 }}>
                                                            {circuit.price}{' '}
                                                            <Typography component="span" variant="body2" sx={{ color: mutedTextColor, fontWeight: 600, ml: 0.8 }}>
                                                                / {circuit.priceUnit}
                                                            </Typography>
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label="Govt Certified"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
                                                            color: '#D97706',
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
                                                        bgcolor: '#D97706',
                                                        color: '#FFFFFF',
                                                        fontWeight: 850,
                                                        py: 1.35,
                                                        borderRadius: 2.5,
                                                        fontSize: '0.95rem',
                                                        textTransform: 'none',
                                                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                                                        '&:hover': {
                                                            bgcolor: '#B45309',
                                                            boxShadow: '0 6px 20px rgba(217, 119, 6, 0.45)',
                                                        },
                                                    }}
                                                >
                                                    Book This Trail Now
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
                    5. MEET OUR LEAD CERTIFIED GUIDES
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
                                label="REAL PEOPLE • AUTHENTIC STORIES"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                    color: '#B45309',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h2"
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
                                Meet Our Senior Certified Guides
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
                                Every GK WhizWheels guide is an indigenous resident born in Uttara Kannada, possessing official badges, police verification, and a lifetime of regional wisdom.
                            </Typography>
                        </Box>

                        <Grid container spacing={3.5}>
                            {VERIFIED_GUIDES.map((guide, idx) => (
                                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3.5,
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            p: 3,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.3s ease',
                                            '&:hover': { transform: 'translateY(-5px)' },
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: guide.avatarBg,
                                                    width: 56,
                                                    height: 56,
                                                    fontWeight: 800,
                                                    fontSize: '1.2rem',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                }}
                                            >
                                                {guide.avatarInitials}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" component="h3" sx={{ fontWeight: 800, fontSize: '1.05rem', color: primaryTextColor, lineHeight: 1.2 }}>
                                                    {guide.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700, display: 'block' }}>
                                                    {guide.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: mutedTextColor }}>
                                                    {guide.experience}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Chip
                                            label={guide.badge}
                                            size="small"
                                            sx={{
                                                mb: 2,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                                color: secondaryTextColor,
                                                fontWeight: 700,
                                                fontSize: '0.68rem',
                                                height: 22,
                                                alignSelf: 'flex-start',
                                            }}
                                        />

                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 600, display: 'block', mb: 0.5 }}>
                                            SPECIALTY AREA:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: primaryTextColor, mb: 1.5, fontSize: '0.85rem' }}>
                                            {guide.specialty}
                                        </Typography>

                                        <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 600, display: 'block', mb: 0.5 }}>
                                            LANGUAGES:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2, fontSize: '0.85rem' }}>
                                            {guide.languages}
                                        </Typography>

                                        <Box
                                            sx={{
                                                p: 1.8,
                                                borderRadius: 2,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                                                borderLeft: `3px solid ${guide.avatarBg}`,
                                                mb: 2.5,
                                                flexGrow: 1,
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: secondaryTextColor, lineHeight: 1.45, display: 'block' }}>
                                                {guide.quote}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                    {guide.rating} ({guide.reviewsCount} reviews)
                                                </Typography>
                                            </Stack>
                                            <Button
                                                size="small"
                                                onClick={() => setModalOpen(true)}
                                                sx={{ color: '#D97706', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                Book Guide &rarr;
                                            </Button>
                                        </Stack>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    6. HOW GUIDE BOOKING WORKS (COMPACT STRIP)
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 4, sm: 5 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                            justifyContent="space-between"
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <Box>
                                <Typography
                                    variant="overline"
                                    sx={{
                                        color: '#B45309',
                                        fontWeight: 850,
                                        letterSpacing: '0.08em',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    EFFORTLESS RENDEZVOUS
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 900,
                                        color: primaryTextColor,
                                        fontSize: { xs: '1.3rem', sm: '1.5rem' },
                                    }}
                                >
                                    How Guide Booking & Meetup Works
                                </Typography>
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 540,
                                    fontSize: '0.88rem',
                                }}
                            >
                                Submit your trail preference, get matched with a verified storyteller in under 30 minutes, and meet right at your hotel or station.
                            </Typography>
                        </Stack>

                        <Grid container spacing={2}>
                            {[
                                {
                                    step: '01',
                                    title: 'Choose Trail & Date',
                                    desc: 'Select your preferred circuit or custom date. Half-Day (₹800) or Full-Day (₹1,500).',
                                    icon: <MapIcon sx={{ fontSize: 20, color: '#D97706' }} />,
                                },
                                {
                                    step: '02',
                                    title: 'Instant Guide Assignment',
                                    desc: 'Our concierge matches you with a verified guide fluent in your language within 30 mins.',
                                    icon: <SupportAgentIcon sx={{ fontSize: 20, color: '#059669' }} />,
                                },
                                {
                                    step: '03',
                                    title: 'Hotel or Trail Rendezvous',
                                    desc: 'Your guide meets you directly at your Honnavar homestay, the railway station, or trailhead.',
                                    icon: <DirectionsWalkIcon sx={{ fontSize: 20, color: '#0284C7' }} />,
                                },
                                {
                                    step: '04',
                                    title: 'Immersive Discovery',
                                    desc: 'Authentic folklore, hidden viewpoint access, photo assistance, and zero tourist-trap shopping.',
                                    icon: <AutoAwesomeIcon sx={{ fontSize: 20, color: '#7C3AED' }} />,
                                },
                            ].map((item, idx) => (
                                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
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
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.3 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 900,
                                                        color: '#D97706',
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    {item.step}
                                                </Typography>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: primaryTextColor,
                                                        fontSize: '0.92rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                            </Stack>
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
                </Box>

                {/* =========================================================================
                    7. TRANSPARENT TARIFF & INCLUSIONS / EXCLUSIONS
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8, md: 9 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                            <Chip
                                label="NO SURPRISES PRICING"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                    color: '#B45309',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h2"
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
                                Transparent Guide Tariffs & Inclusions
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
                                We believe in 100% upfront flat pricing. What you see is exactly what you pay—no hidden tip demands, no surprise surcharges.
                            </Typography>
                        </Box>

                        <Grid container spacing={4} alignItems="stretch">
                            {/* Tariff Options */}
                            <Grid size={{ xs: 12, lg: 6 }}>
                                <Stack spacing={2.5}>
                                    {[
                                        {
                                            name: 'Half-Day Local Trail Guide',
                                            duration: 'Up to 4 Hours Duration',
                                            price: '₹800',
                                            period: 'Flat Rate',
                                            capacity: 'Private Group up to 6 Persons',
                                            bestFor: 'Mirjan Fort, Apsarakonda Waterfall, Honnavar Mangroves & Town Heritage',
                                            highlight: false,
                                        },
                                        {
                                            name: 'Full-Day Expedition Guide',
                                            duration: 'Up to 8 Hours Duration',
                                            price: '₹1,500',
                                            period: 'Flat Rate',
                                            capacity: 'Private Group up to 6 Persons',
                                            bestFor: 'Yana Rock Caves & Vibhooti Falls, Gokarna 5-Beach Trek, or Murudeshwar + Idagunji combo',
                                            highlight: true,
                                        },
                                        {
                                            name: 'Multi-Day Coastal Expedition Companion',
                                            duration: '2 or More Consecutive Days',
                                            price: '₹1,400',
                                            period: 'Per Day',
                                            capacity: 'Private Group up to 8 Persons',
                                            bestFor: 'Complete Coastal Karnataka Vacation: Honnavar, Gokarna, Karwar, Murudeshwar & Jog Falls',
                                            highlight: false,
                                        },
                                    ].map((plan, idx) => (
                                        <Paper
                                            key={idx}
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: 3,
                                                bgcolor: cardBgColor,
                                                border: plan.highlight ? '2px solid #D97706' : `1px solid ${cardBorderColor}`,
                                                position: 'relative',
                                                boxShadow: plan.highlight ? '0 8px 24px rgba(217, 119, 6, 0.12)' : 'none',
                                            }}
                                        >
                                            {plan.highlight && (
                                                <Chip
                                                    label="MOST POPULAR FOR VACATIONS"
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: -12,
                                                        right: 20,
                                                        bgcolor: '#D97706',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.68rem',
                                                    }}
                                                />
                                            )}
                                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                                        {plan.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>
                                                        ⏱️ {plan.duration} • 👥 {plan.capacity}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                    <Typography variant="h4" component="span" sx={{ fontWeight: 900, color: '#D97706' }}>
                                                        {plan.price}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 600 }}>
                                                        {plan.period}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.88rem' }}>
                                                <strong>Best for:</strong> {plan.bestFor}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Grid>

                            {/* Inclusions vs Exclusions */}
                            <Grid size={{ xs: 12, lg: 6 }}>
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
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: primaryTextColor, mb: 2 }}>
                                        What is Included & What is Not
                                    </Typography>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#059669', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircleIcon sx={{ fontSize: 18 }} /> 100% INCLUDED WITH YOUR GUIDE:
                                        </Typography>
                                        <Stack spacing={1.2}>
                                            {[
                                                'Dedicated certified native local guide exclusively for your private group',
                                                'Customized route pacing tailored to seniors, children, or photography',
                                                'Deep historical, architectural, mythological and environmental storytelling',
                                                'Assistance with photography angles at scenic viewpoints and fort ramparts',
                                                'Guide can ride pillion on your rental scooter or accompany in your private cab',
                                                'Basic wilderness first-aid kit carried on forest and waterfall treks',
                                            ].map((item, i) => (
                                                <Stack direction="row" spacing={1} alignItems="flex-start" key={i}>
                                                    <DoneAllIcon sx={{ fontSize: 16, color: '#059669', mt: 0.2 }} />
                                                    <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.88rem', lineHeight: 1.4 }}>
                                                        {item}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#E11D48', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <InfoOutlinedIcon sx={{ fontSize: 18 }} /> NOT INCLUDED (PAYABLE AT ACTUALS):
                                        </Typography>
                                        <Stack spacing={1.2}>
                                            {[
                                                'Monument, fort, or eco-park ticket entries (nominal ₹10–₹30 where applicable)',
                                                'Personal food, drinks, and mineral water (guide will recommend authentic dining)',
                                                'Customer vehicle rental (rent your two-wheeler or private cab on GK WhizWheels)',
                                            ].map((item, i) => (
                                                <Stack direction="row" spacing={1} alignItems="flex-start" key={i}>
                                                    <Box component="span" sx={{ color: '#E11D48', fontWeight: 900, fontSize: '0.85rem', mt: 0.1 }}>
                                                        ✕
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.88rem', lineHeight: 1.4 }}>
                                                        {item}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={() => setModalOpen(true)}
                                        sx={{
                                            bgcolor: '#D97706',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            py: 1.4,
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#B45309' },
                                        }}
                                    >
                                        Request Guide Now
                                    </Button>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    8. SAFETY, ETHICS & GUIDE CODE OF CONDUCT
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
                                label="ETHICS & TRAVELER PROTECTION"
                                size="small"
                                sx={{
                                    display: 'inline-flex',
                                    width: 'auto',
                                    bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                    color: '#B45309',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h2"
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
                                Our Traveler Trust & Guide Code of Conduct
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: secondaryTextColor,
                                    maxWidth: 700,
                                    mx: 'auto',
                                    textAlign: 'center',
                                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                    lineHeight: 1.6,
                                }}
                            >
                                We operate with the highest ethical standards in Karnataka tourism to ensure your trip is safe, peaceful, and free of commercial exploitation.
                            </Typography>
                        </Box>

                        <Grid container spacing={3.5}>
                            {[
                                {
                                    title: 'Zero Shopping Commissions Policy',
                                    desc: 'Our guides are legally bonded by our strict zero-commission rule. You will never be led to overpriced emporiums, tourist-trap spice stores, or kickback handicraft shops.',
                                    icon: <VolunteerActivismIcon sx={{ fontSize: 32, color: '#D97706' }} />,
                                    badge: '100% UNBIASED',
                                },
                                {
                                    title: 'Solo Female Traveler Safety Protocol',
                                    desc: 'All guides carry verified photo ID badges, undergo strict local police verification, and have verified emergency contact protocols. Female cultural hosts are also available upon request.',
                                    icon: <ShieldIcon sx={{ fontSize: 32, color: '#0284C7' }} />,
                                    badge: 'POLICE VERIFIED',
                                },
                                {
                                    title: 'Forest Dept & Eco-Trail Compliance',
                                    desc: 'All trekking and waterfall routes strictly respect Western Ghats Forest Department regulations and Leave No Trace principles. No trespassing into fragile ecological zones.',
                                    icon: <ParkIcon sx={{ fontSize: 32, color: '#059669' }} />,
                                    badge: 'ECO-CERTIFIED',
                                },
                                {
                                    title: 'Sacred Temple Custom Respect',
                                    desc: 'Navigating ancient shrines like Gokarna Mahabaleshwar requires deep respect for temple dress codes, pooja schedules, and cultural etiquette. Our guides ensure you feel welcome.',
                                    icon: <AccountBalanceIcon sx={{ fontSize: 32, color: '#7C3AED' }} />,
                                    badge: 'CULTURAL RESPECT',
                                },
                            ].map((code, i) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            height: '100%',
                                            borderRadius: 3.5,
                                            bgcolor: cardBgColor,
                                            border: `1px solid ${cardBorderColor}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}>
                                                {code.icon}
                                            </Box>
                                            <Chip
                                                label={code.badge}
                                                size="small"
                                                sx={{
                                                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                                                    color: secondaryTextColor,
                                                    fontWeight: 800,
                                                    fontSize: '0.68rem',
                                                }}
                                            />
                                        </Stack>
                                        <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: primaryTextColor, mb: 1, fontSize: '1.1rem' }}>
                                            {code.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.6 }}>
                                            {code.desc}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    10. FREQUENTLY ASKED QUESTIONS (FAQ) WITH EMBEDDED DISTANCE MATRIX
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
                                    bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                    color: '#B45309',
                                    fontWeight: 850,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.04em',
                                    mb: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h2"
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
                                Everything you need to know about booking our native guides, transport logistics, and travel distances.
                            </Typography>
                        </Box>

                        <Stack spacing={2}>
                            {GUIDE_FAQS.map((faq, idx) => (
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
                                        expandIcon={<ExpandMoreIcon sx={{ color: '#D97706' }} />}
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

                            {/* Distance & Travel Time Matrix as Collapsed FAQ Accordion */}
                            <Accordion
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
                                    expandIcon={<ExpandMoreIcon sx={{ color: '#D97706' }} />}
                                    sx={{ px: 3, py: 1.5 }}
                                >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: primaryTextColor, pr: 2 }}>
                                        How far are popular guided trails and monuments from Honnavar? (Distance Matrix)
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 0 }}>
                                    <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2, fontSize: '0.92rem' }}>
                                        Distances, driving times, and guide time allocations from our Honnavar hub:
                                    </Typography>
                                    <TableContainer
                                        component={Paper}
                                        elevation={0}
                                        sx={{
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                                            border: `1px solid ${cardBorderColor}`,
                                            overflowX: 'auto',
                                        }}
                                    >
                                        <Table size="small" sx={{ minWidth: 550 }} aria-label="sightseeing distance matrix">
                                            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Sightseeing Spot</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Distance</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Driving Time</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, color: primaryTextColor }}>Guide Time</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {SIGHTSEEING_DISTANCES.map((row, idx) => (
                                                    <TableRow
                                                        key={idx}
                                                        sx={{
                                                            '&:last-child td, &:last-child th': { border: 0 },
                                                            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9' },
                                                        }}
                                                    >
                                                        <TableCell component="th" scope="row" sx={{ fontWeight: 700, color: primaryTextColor, fontSize: '0.85rem' }}>
                                                            {row.spot}
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#D97706', fontWeight: 800, fontSize: '0.85rem' }}>{row.dist}</TableCell>
                                                        <TableCell sx={{ color: secondaryTextColor, fontWeight: 600, fontSize: '0.85rem' }}>{row.time}</TableCell>
                                                        <TableCell sx={{ color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>{row.guideTime}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        </Stack>
                    </Box>
                </Box>

                {/* =========================================================================
                    11. BOTTOM LUXURY CONCIERGE CTA BANNER
                ========================================================================== */}
                <Box
                    component="section"
                    sx={{
                        py: { xs: 6, sm: 8 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'linear-gradient(135deg, #78350F 0%, #451A03 50%, #0F172A 100%)'
                            : 'linear-gradient(135deg, #D97706 0%, #B45309 60%, #92400E 100%)',
                        color: '#FFFFFF',
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                        <Chip
                            icon={<StarIcon sx={{ fontSize: '14px !important', color: '#FFFFFF' }} />}
                            label="UNRUSHED AUTHENTIC EXPERIENCES"
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
                            component="h2"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem' },
                                mb: 2,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Explore Coastal Karnataka Like an Insider
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
                            Whether you need a 3-hour Mirjan Fort architectural walk or a full-day Yana & Vibhooti rainforest trek, our certified native guides are ready to accompany you.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => setModalOpen(true)}
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    bgcolor: '#FFFFFF',
                                    color: '#B45309',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    '&:hover': {
                                        bgcolor: '#F8FAFC',
                                        color: '#92400E',
                                    },
                                }}
                            >
                                Book Local Guide Online
                            </Button>

                            <Button
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20would%20like%20to%20book%20a%20local%20tour%20guide%20for%20my%20trip."
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
                                Chat on WhatsApp
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

            {/* Dedicated Guide Booking Modal */}
            <GuideBookingModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                initialTrailId="mirjan_heritage"
                availableItems={availableItems}
            />

            {/* Multi-Image Guide Gallery Lightbox */}
            <ServiceGalleryModal
                open={galleryModalOpen}
                onClose={() => setGalleryModalOpen(false)}
                item={selectedItemForGallery}
                onBook={(item) => {
                    setGalleryModalOpen(false);
                    setModalOpen(true);
                }}
            />
        </AppLayout>
    );
}

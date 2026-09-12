import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@inertiajs/react';
import PageHead from '../Components/SEO/PageHead';
import AppLayout from '../Layouts/AppLayout';
import ScubaBookingModal from '../Components/BookingModals/ScubaBookingModal';
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
    LinearProgress,
} from '@mui/material';
import ScubaDivingIcon from '@mui/icons-material/ScubaDiving';
import WaterIcon from '@mui/icons-material/Water';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
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
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import VideocamIcon from '@mui/icons-material/Videocam';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FactCheckIcon from '@mui/icons-material/FactCheck';

// Government rules & regulations for Netrani Scuba Diving
const GOVT_RULES_CATEGORIES = [
    {
        title: 'Age & Health Limits',
        badge: 'MANDATORY SAFETY',
        color: '#E11D48',
        icon: <HealthAndSafetyIcon sx={{ fontSize: 24, color: '#E11D48' }} />,
        rules: [
            {
                label: 'Minimum Age: 10 Years Old',
                desc: '10 years is the strict legal minimum for Discover Scuba Diving (introductory dives) and PADI/SSI certification courses. Children under 10 cannot dive with oxygen cylinders due to lung capacity safety regulations, but may join on the boat for surface snorkeling with life vests.',
                important: true,
            },
            {
                label: 'Maximum Age & Senior Citizens',
                desc: 'No strict upper limit as long as the participant passes basic physical fitness. Participants over 50 or those with any medical history must submit a written fitness clearance certificate from a licensed physician.',
                important: false,
            },
            {
                label: 'Medical Restrictions (Disqualifying Conditions)',
                desc: 'Diving is strictly prohibited for individuals with a history of heart attacks or heart disease, asthma, chronic lung or respiratory ailments, serious back/spine problems, recent major surgical operations, or pregnancy.',
                important: true,
            },
            {
                label: '100% Zero Alcohol & Substance Policy',
                desc: 'Absolute zero tolerance. Anyone smelling of alcohol, under the influence of substances, or hungover is barred from boarding the speedboat immediately with zero refund under port authority maritime laws.',
                important: true,
            },
        ],
    },
    {
        title: 'Environmental & Island Protection',
        badge: 'WILDLIFE PROTECTION ACT',
        color: '#059669',
        icon: <NaturePeopleIcon sx={{ fontSize: 24, color: '#059669' }} />,
        rules: [
            {
                label: 'Strictly No Island Landing',
                desc: 'Divers and operators are legally prohibited from setting foot or stepping onto Netrani Island itself. The island is under Indian Navy and Forest Department protection. All diving and snorkeling occurs exclusively from registered boats anchored in the bay.',
                important: true,
            },
            {
                label: 'Marine Conservation & Coral Protection',
                desc: 'Touching fish, standing on, stepping on, or collecting coral reefs or shells is illegal under the Wildlife Protection Act. Throwing trash, plastics, or cigarette butts into the sea is strictly banned and heavily penalized.',
                important: true,
            },
            {
                label: 'Depth Limit: Maximum 12 Meters',
                desc: 'Recreational beginner/discovery dives are legally restricted to a maximum depth of 12 meters (40 feet) to guarantee safe nitrogen limits and diver comfort with dedicated 1-on-1 instructor guidance.',
                important: false,
            },
            {
                label: 'Reef-Safe Sunscreen Recommended',
                desc: 'Participants are encouraged to wear biodegradable reef-safe sunscreens or UV-protection rash guards to preserve the fragile marine ecosystem and living coral gardens.',
                important: false,
            },
        ],
    },
    {
        title: 'Documentation & Operations',
        badge: 'PORT & MARITIME CLEARANCES',
        color: '#0284C7',
        icon: <AssignmentLateIcon sx={{ fontSize: 24, color: '#0284C7' }} />,
        rules: [
            {
                label: 'Compulsory Valid Government Photo ID',
                desc: 'Submission of a valid government photo ID containing your residential address (Aadhaar Card, Passport, or Driver’s License) is mandatory before boarding the boat at Murudeshwar Harbor for Coast Guard clearance.',
                important: true,
            },
            {
                label: 'Seasonal Ban: Southwest Monsoon (June – Sept)',
                desc: 'All scuba diving and boat expeditions to Netrani Island are entirely suspended from June through September due to rough monsoon seas, strong underwater currents, and low visibility. Operations resume in October.',
                important: true,
            },
            {
                label: 'Registered Operators & Coast Guard Permits',
                desc: 'All trips must depart via registered dive operators from Murudeshwar Harbor after obtaining daily maritime, forest department, and adventure academy clearances.',
                important: false,
            },
            {
                label: 'Mandatory Medical Questionnaire Sign-off',
                desc: 'Before boarding, every diver must fill and sign the standard PADI/RSTC medical statement confirming good health and absence of contraindicating conditions.',
                important: false,
            },
        ],
    },
];

// Netrani Dive Spots
const NETRANI_DIVE_SPOTS = [
    {
        name: 'The Nursery (Coral Garden)',
        depth: '6 – 10 Meters',
        vis: '15 – 20 Meters',
        current: 'Mild / Gentle',
        level: 'Beginners & Non-Swimmers',
        desc: 'Vibrant staghorn and table corals surrounded by clownfish (Nemo), butterflyfish, parrotfish, and friendly damselfish. Perfect for first-time discovery divers.',
    },
    {
        name: 'Grand Central Station',
        depth: '10 – 18 Meters',
        vis: '18 – 25 Meters',
        current: 'Mild to Moderate',
        level: 'Beginners & Advanced',
        desc: 'A bustling underwater crossroads where massive schools of silver barracudas, yellowtail snappers, and trevally jackfish circle gracefully in open blue water.',
    },
    {
        name: "Alladin’s Cave & Rocky Outcrops",
        depth: '12 – 22 Meters',
        vis: '15 – 20 Meters',
        current: 'Moderate',
        level: 'Certified Divers',
        desc: 'Dramatic volcanic boulders, overhangs, and swim-throughs sheltering large honeycomb moray eels, blue-spotted stingrays, and seasonal green sea turtles.',
    },
    {
        name: 'The Abyss & Southern Drop-off',
        depth: '15 – 30 Meters',
        vis: '20+ Meters',
        current: 'Moderate to Strong',
        level: 'PADI Advanced Certified',
        desc: 'Deep oceanic drop-off into the Arabian Sea where pelagic species, groupers, cobias, and occasional gentle whale sharks are sighted between November and February.',
    },
];

// Distance matrix from Honnavar Hubs
const SIGHTSEEING_DISTANCES = [
    { spot: 'Murudeshwar Harbor (Scuba Departure Dock)', dist: '27 km', time: '35 Mins', note: 'Reporting harbor for Netrani speedboats (GK WhizWheels cab/bike pickup available)' },
    { spot: 'Honnavar Railway Station', dist: '28 km to dock', time: '40 Mins', note: 'Direct early morning station taxi pickup for 06:30 AM harbor batch' },
    { spot: 'Sharavathi Riverfront Homestays, Honnavar', dist: '29 km to dock', time: '42 Mins', note: 'Combine a peaceful Honnavar riverside stay with Netrani scuba' },
    { spot: 'Kasarkod Eco Beach & Boardwalk', dist: '32 km to dock', time: '45 Mins', note: 'Blue Flag eco beach along coastal highway NH-66' },
    { spot: 'Historic Mirjan Fort', dist: '48 km to dock', time: '1 Hr', note: '16th-century fortress on river Aghanashini' },
    { spot: 'Gokarna Om Beach & Mahabaleshwar Temple', dist: '78 km to dock', time: '1 Hr 35 Mins', note: 'Popular post-scuba pilgrimage & cliff-beach trail' },
];

const SCUBA_FAQS = [
    {
        q: 'Do I need to know swimming to do scuba diving at Netrani Island?',
        a: 'No, swimming is NOT required! Over 80% of our discovery divers are complete non-swimmers. For beginner discovery dives, each diver is paired with a dedicated 1-on-1 certified PADI/SSI divemaster who holds you and controls all buoyancy equipment underwater throughout the entire dive.',
    },
    {
        q: 'What is the government age limit for Netrani Island scuba diving?',
        a: 'The strict minimum age under Karnataka maritime regulations and PADI standards is 10 years old. There is no upper age limit provided you are physically active and healthy; participants over 50 or those with medical history require a fitness clearance from a registered physician.',
    },
    {
        q: 'What medical conditions disqualify me from scuba diving?',
        a: 'Diving is strictly contraindicated for individuals with heart conditions, high blood pressure, asthma, epilepsy, recent major surgeries, ear/sinus operations, severe back issues, or pregnancy. All participants must sign the standard PADI medical declaration before boarding.',
    },
    {
        q: 'What government ID and certification is required before boarding?',
        a: "Every diver must present an original Government Photo ID with address (Aadhaar, Passport, or Driver's License) for mandatory Indian Coast Guard vessel manifests. Prior dive certification is NOT required for beginner Discovery Scuba Dives; licensed divers booking deep wall dives must present their PADI/SSI C-card.",
    },
    {
        q: 'What happens if bad weather causes trip cancellation?',
        a: 'Safety is our highest priority. If the port authority or Coast Guard restricts vessel departures due to rough sea swells or adverse weather, you are entitled to a 100% free reschedule or an immediate, full refund without any cancellation fee or deduction.',
    },
    {
        q: 'Staying in Honnavar? How do transfers and travel times to Murudeshwar Harbor work?',
        a: 'Murudeshwar Harbor is just 27 km (35 minutes) south of Honnavar along 4-lane NH-66. GK WhizWheels arranges early morning cab pickups (or self-drive rental Activas from ₹450/day) delivered right to your Honnavar homestay or hotel so you arrive relaxed before the 06:30 AM harbor batch.',
    },
];

const scubaFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SCUBA_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
        },
    })),
};

export default function ScubaPage({ availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // State for booking modal
    const [modalOpen, setModalOpen] = useState(false);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedItemForGallery, setSelectedItemForGallery] = useState(null);

    const primaryScubaItem = availableItems.length > 0 ? availableItems[0] : null;
    const primaryScubaMedia = useMemo(() => {
        return getServiceItemMedia(primaryScubaItem, '/images/services/netrani_scuba_dive.jpg');
    }, [primaryScubaItem]);

    const scubaPackages = useMemo(() => {
        const defaultPkgs = [
            {
                id: 10,
                title: 'Netrani Island PADI Discovery Scuba',
                category: 'Most Popular • Non-Swimmers Welcome',
                rate: '₹2,999',
                originalRate: '₹3,499',
                badge: '🔥 BESTSELLER FOR BEGINNERS',
                isPopular: true,
                fallbackImage: '/images/services/netrani_scuba_dive.jpg',
                duration: 'Full Day (06:30 AM – 02:00 PM)',
                depth: 'Up to 12 Meters (Max Legal Depth)',
                equipment: ['🤿 Mask & Snorkel', '🦺 BCD Buoyancy Jacket', '🫁 12L O2 Cylinder', '👟 Scuba Fins', '📹 4K GoPro'],
                features: [
                    '1-on-1 Dedicated PADI/SSI Divemaster (holds your hand)',
                    'Free 4K GoPro Underwater Video & Photo Pack',
                    'Complete Scuba Gear, Wetsuit & Regulators',
                    'Speedboat Transit from Murudeshwar Harbor',
                    'Shallow Water Breathing Practice & Briefing',
                    'Fresh Fruits, Snacks & Drinking Water on Boat',
                ],
            },
            {
                id: 11,
                title: 'Netrani Snorkeling & Speedboat Safari',
                category: 'Surface Marine Safari • Non-Swimmers',
                rate: '₹1,499',
                originalRate: '₹1,799',
                badge: '👨‍👩‍👧‍👦 FAMILY & KIDS FAVORITE',
                isPopular: false,
                fallbackImage: '/images/services/netrani_boat_departure.jpg',
                duration: 'Full Day (06:30 AM – 01:30 PM)',
                depth: 'Surface & Shallow Reef (Floating Vest)',
                equipment: ['🤿 Snorkel Mask', '🦺 Floating Safety Vest', '🐬 Dolphin Watch Deck'],
                features: [
                    'High-buoyancy Safety Floating Vest & Snorkel',
                    'Speedboat Cruise to Netrani Island Bay & Back',
                    'Guided Surface Snorkeling over Living Coral Gardens',
                    'Playful Dolphin Pod Spotting along the Route',
                    'Safe for Children (10+) & Senior Family Members',
                    'Purified Drinking Water & Light Refreshments',
                ],
            },
            {
                id: 12,
                title: 'Certified Diver Fun Dive (2-Tank Dives)',
                category: 'For PADI / SSI / CMAS Card Holders',
                rate: '₹3,499',
                originalRate: '₹3,999',
                badge: '🏆 CERTIFIED DIVERS ONLY',
                isPopular: false,
                fallbackImage: '/images/services/scuba.jpg',
                duration: '2 Dives (Grand Central + Outcrops)',
                depth: '18 – 30 Meters (Based on Certification)',
                equipment: ['🫁 Twin 12L Tanks', '⚖️ Weight Belt', '🧭 Dive Computer Guide'],
                features: [
                    '2 Guided Deep Coral Reef & Pelagic Boat Dives',
                    'Twin 12L Aluminum Tanks & Weight Belts',
                    'Certified Dive Guide & Surface Marker Buoy',
                    'Speedboat Transit & Surface Interval with Snacks',
                    'Explore Barracuda Schools, Morays & Ray Caves',
                    'Official Dive Logbook Verification & Seal',
                ],
            },
        ];

        if (!availableItems || availableItems.length === 0) {
            return defaultPkgs.map(pkg => ({
                ...pkg,
                item: null,
                media: getServiceItemMedia(null, pkg.fallbackImage),
            }));
        }

        return defaultPkgs.map((pkg, idx) => {
            const matchedItem = availableItems.find(ai =>
                ai.id === pkg.id ||
                (ai.name?.toLowerCase().includes('scuba') && pkg.title.toLowerCase().includes('scuba')) ||
                (ai.name?.toLowerCase().includes('snorkel') && pkg.title.toLowerCase().includes('snorkel'))
            ) || availableItems[idx] || null;

            const media = getServiceItemMedia(matchedItem, pkg.fallbackImage);
            return {
                ...pkg,
                item: matchedItem,
                title: matchedItem?.name || pkg.title,
                rate: matchedItem?.price_base ? `₹${Number(matchedItem.price_base).toLocaleString('en-IN')}` : pkg.rate,
                media,
            };
        });
    }, [availableItems]);

    // State for interactive medical eligibility checker
    const [eligibility, setEligibility] = useState({
        age: true,
        health: true,
        sober: true,
        id: true,
    });

    const isFullyEligible = eligibility.age && eligibility.health && eligibility.sober && eligibility.id;

    // Theme tokens
    const primaryTextColor = isDark ? '#F8FAFC' : '#0F172A';
    const secondaryTextColor = isDark ? '#94A3B8' : '#475569';
    const mutedTextColor = isDark ? '#64748B' : '#64748B';
    const cardBgColor = isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF';
    const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';

    return (
        <AppLayout>
            <PageHead
                title="Netrani Island Scuba Diving from Honnavar | PADI Certified – GK WhizWheel"
                description="Book PADI-certified Netrani Island scuba diving & snorkeling from Murudeshwar/Honnavar starting ₹3,500. 1-on-1 divemaster, 4K GoPro video & gear included."
                canonicalUrl="https://whizwheels.in/services/scuba"
                ogImage="/images/services/scuba.jpg"
                ogType="website"
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'TouristTrip',
                        name: 'Netrani Island Scuba Diving & Snorkeling',
                        description: 'PADI certified scuba diving and snorkeling trip to Netrani Island from Murudeshwar and Honnavar with 1-on-1 divemaster supervision and 4K underwater video.',
                        touristType: 'Adventure Traveler',
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'INR',
                            lowPrice: '3500',
                            highPrice: '5500',
                            offerCount: '4',
                            price: '3500',
                        },
                        provider: {
                            '@type': 'LocalBusiness',
                            name: 'GK WhizWheel',
                            telephone: '+918660989586',
                            url: 'https://whizwheels.in',
                        },
                    },
                    scubaFaqSchema,
                ]}
            />

            <Box sx={{ bgcolor: isDark ? '#090D16' : '#F8FAFC', minHeight: '100vh', pb: 10 }}>
                {/* =========================================================================
                    1. HERO SECTION (2-Column Modern Grid + Live Marine Conditions Bar)
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="scuba-hero-heading"
                    sx={{
                        position: 'relative',
                        pt: { xs: 3, sm: 4, md: 5 },
                        pb: { xs: 6, md: 9 },
                        overflow: 'hidden',
                        background: isDark
                            ? 'radial-gradient(ellipse at top center, #0F172A 0%, #090D16 80%)'
                            : 'linear-gradient(180deg, #F0F9FF 0%, #EEF2FF 50%, #F8FAFC 100%)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    }}
                >
                    {/* Atmospheric water glows */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -120,
                            right: -100,
                            width: 650,
                            height: 650,
                            borderRadius: '50%',
                            background: isDark
                                ? 'radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(79, 70, 229, 0.12) 50%, transparent 75%)'
                                : 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 75%)',
                            filter: 'blur(70px)',
                            pointerEvents: 'none',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -50,
                            left: -100,
                            width: 500,
                            height: 500,
                            borderRadius: '50%',
                            background: isDark
                                ? 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                            filter: 'blur(60px)',
                            pointerEvents: 'none',
                        }}
                    />

                    <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 2 }}>
                        {/* Breadcrumbs & Live Conditions Bar */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                            <Breadcrumbs
                                aria-label="breadcrumb"
                                sx={{
                                    fontSize: '0.82rem',
                                    '& .MuiBreadcrumbs-separator': { color: mutedTextColor },
                                }}
                            >
                                <Link href="/" style={{ color: mutedTextColor, textDecoration: 'none', fontWeight: 600 }}>
                                    Home
                                </Link>
                                <Link href="/services" style={{ color: mutedTextColor, textDecoration: 'none', fontWeight: 600 }}>
                                    Services
                                </Link>
                                <Typography sx={{ color: '#0284C7', fontWeight: 800, fontSize: '0.82rem' }}>
                                    Netrani Island Scuba Diving
                                </Typography>
                            </Breadcrumbs>

                            {/* Live Marine Ticker Pill */}
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: { xs: 1.2, sm: 2 },
                                    py: 0.7,
                                    px: { xs: 1.5, sm: 2 },
                                    borderRadius: '50px',
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid #BAE6FD',
                                    boxShadow: '0 2px 12px -2px rgba(14, 165, 233, 0.18)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: '#10B981',
                                            boxShadow: '0 0 8px #10B981',
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ fontWeight: 850, color: '#0284C7', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        Sea State: Calm
                                    </Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ height: 14, my: 'auto', display: { xs: 'none', sm: 'block' } }} />
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                                    <VisibilityIcon sx={{ fontSize: 14, color: '#059669' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: primaryTextColor, fontSize: '0.72rem' }}>
                                        Visibility: 15–20M
                                    </Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ height: 14, my: 'auto', display: { xs: 'none', md: 'block' } }} />
                                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                                    <ThermostatIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: primaryTextColor, fontSize: '0.72rem' }}>
                                        Water: 28°C
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Grid container spacing={{ xs: 4, lg: 6 }} alignItems="center">
                            {/* Left Column: Headline, Trust Badges, CTAs */}
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <Box sx={{ maxWidth: 720 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2.2 }}>
                                        <Chip
                                            icon={<ScubaDivingIcon sx={{ fontSize: 16, color: '#0284C7 !important' }} />}
                                            label="NETRANI ISLAND • MURUDESHWAR HARBOR"
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE',
                                                color: isDark ? '#38BDF8' : '#0369A1',
                                                fontWeight: 850,
                                                fontSize: '0.74rem',
                                                letterSpacing: '0.04em',
                                                border: '1px solid rgba(14, 165, 233, 0.35)',
                                            }}
                                        />
                                        <Chip
                                            icon={<VerifiedUserIcon sx={{ fontSize: 15, color: '#059669 !important' }} />}
                                            label="PADI / SSI Certified Instructors"
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                                                color: isDark ? '#34D399' : '#047857',
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                            }}
                                        />
                                        <Chip
                                            icon={<WbSunnyIcon sx={{ fontSize: 14, color: '#D97706 !important' }} />}
                                            label="Season: Oct – May Open"
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                                                color: isDark ? '#FBBF24' : '#B45309',
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                            }}
                                        />
                                    </Box>

                                    <Typography
                                        variant="h1"
                                        component="h1"
                                        id="scuba-hero-heading"
                                        sx={{
                                            fontWeight: 950,
                                            color: primaryTextColor,
                                            letterSpacing: '-0.03em',
                                            lineHeight: { xs: 1.15, sm: 1.1 },
                                            fontSize: { xs: '2.2rem', sm: '3.1rem', md: '3.7rem' },
                                            mb: 2,
                                        }}
                                    >
                                        Scuba Diving at{' '}
                                        <Box
                                            component="span"
                                            sx={{
                                                background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 50%, #06B6D4 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                display: 'inline',
                                            }}
                                        >
                                            Netrani Island
                                        </Box>{' '}
                                        Murudeshwar
                                    </Typography>

                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: secondaryTextColor,
                                            fontSize: { xs: '1rem', sm: '1.14rem' },
                                            lineHeight: 1.65,
                                            mb: 3.5,
                                        }}
                                    >
                                        Immerse yourself in India’s most pristine Arabian Sea coral reef sanctuary. Crystal-clear turquoise visibility up to 20 meters, sea turtles, barracudas, and exotic marine life. <strong>100% safe for non-swimmers</strong> with 1-on-1 hand-held PADI divemaster guidance and <strong>free 4K GoPro video & photos</strong> transferred to your phone.
                                    </Typography>

                                    {/* 4 Feature Badges with Elevated Oceanic Cards */}
                                    <Grid container spacing={1.5} sx={{ mb: 4 }}>
                                        {[
                                            { icon: '🤿', title: 'Non-Swimmers Welcome', desc: '1-on-1 certified instructor holds your hand throughout' },
                                            { icon: '📹', title: '4K GoPro Video Included', desc: 'Full underwater video & photos for your Instagram reels' },
                                            { icon: '🦺', title: 'Complete Scuba Gear', desc: 'Wetsuit, fins, mask, regulator & oxygen cylinder' },
                                            { icon: '🛥️', title: 'Speedboat Expedition', desc: 'Scenic 75-min boat ferry from Murudeshwar Harbor' },
                                        ].map((item, idx) => (
                                            <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                                                <Box
                                                    sx={{
                                                        p: 1.6,
                                                        borderRadius: 2.5,
                                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: '#0284C7',
                                                            bgcolor: isDark ? 'rgba(14, 165, 233, 0.06)' : '#F0F9FF',
                                                        },
                                                    }}
                                                >
                                                    <Typography sx={{ fontSize: '1.4rem' }}>{item.icon}</Typography>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.86rem' }}>
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.74rem' }}>
                                                            {item.desc}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* CTA Row */}
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() => setModalOpen(true)}
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                bgcolor: '#0284C7',
                                                color: '#FFFFFF',
                                                fontWeight: 850,
                                                px: 3.5,
                                                py: 1.5,
                                                borderRadius: 2.5,
                                                fontSize: '0.98rem',
                                                boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.5)',
                                                '&:hover': { bgcolor: '#0369A1' },
                                            }}
                                        >
                                            Book Scuba Dive (₹2,999) ↓
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="large"
                                            component="a"
                                            href="#govt-rules"
                                            startIcon={<ShieldIcon sx={{ color: '#059669' }} />}
                                            sx={{
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                                color: primaryTextColor,
                                                fontWeight: 800,
                                                px: 2.5,
                                                py: 1.5,
                                                borderRadius: 2.5,
                                                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' },
                                            }}
                                        >
                                            Govt Rules & Eligibility
                                        </Button>

                                        <Button
                                            variant="text"
                                            size="large"
                                            component="a"
                                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20inquire%20about%20Netrani%20Island%20Scuba%20Diving."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                            sx={{
                                                color: isDark ? '#34D399' : '#059669',
                                                fontWeight: 800,
                                                px: 2,
                                                borderRadius: 2.5,
                                                '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)' },
                                            }}
                                        >
                                            WhatsApp
                                        </Button>
                                    </Stack>
                                </Box>
                            </Grid>

                            {/* Right Column: Hero Showcase Card */}
                            <Grid size={{ xs: 12, lg: 5 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
                                        border: `1px solid ${cardBorderColor}`,
                                        overflow: 'hidden',
                                        boxShadow: isDark
                                            ? '0 20px 40px -15px rgba(0, 0, 0, 0.6)'
                                            : '0 20px 45px -12px rgba(2, 132, 199, 0.18)',
                                        backdropFilter: 'blur(16px)',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Image Container with Badges */}
                                    <Box 
                                        sx={{ 
                                            position: 'relative', 
                                            height: { xs: 240, sm: 280 }, 
                                            overflow: 'hidden',
                                            cursor: primaryScubaMedia.gallery.length > 0 ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            if (primaryScubaMedia.gallery.length > 0) {
                                                setSelectedItemForGallery(primaryScubaItem);
                                                setGalleryModalOpen(true);
                                            }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={primaryScubaMedia.primary}
                                            alt="PADI certified scuba diving with coral reefs and marine life at Netrani Island near Murudeshwar & Honnavar"
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
                                                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                p: 2.2,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label="Netrani Island Marine Sanctuary"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(14, 165, 233, 0.6)',
                                                    }}
                                                />
                                                {primaryScubaMedia.hasMultiple ? (
                                                    <Chip
                                                        icon={<PhotoLibraryIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                                                        size="small"
                                                        label={`${primaryScubaMedia.count} Photos`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemForGallery(primaryScubaItem);
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
                                                            '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.9)' },
                                                        }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="⭐ 4.9/5 (1,240+ Dives)"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(245, 158, 11, 0.95)',
                                                            color: '#0F172A',
                                                            fontWeight: 900,
                                                            fontSize: '0.72rem',
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Chip
                                                        label="Depth: Max 12m"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: '#059669',
                                                            color: '#FFFFFF',
                                                            fontWeight: 900,
                                                            fontSize: '0.68rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                    <Chip
                                                        label="GoPro 4K Free"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: '#0284C7',
                                                            color: '#FFFFFF',
                                                            fontWeight: 900,
                                                            fontSize: '0.68rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="h6" component="p" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.2rem', lineHeight: 1.25 }}>
                                                    PADI Beginner Scuba + 4K GoPro Video
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Card Content & Features */}
                                    <Box sx={{ p: 2.8 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                            <Typography variant="h4" component="span" sx={{ fontWeight: 950, color: '#0284C7', lineHeight: 1 }}>
                                                ₹2,999.00
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                                                ₹3,499.00
                                            </Typography>
                                            <Chip
                                                label="Save ₹500"
                                                size="small"
                                                sx={{
                                                    bgcolor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE',
                                                    color: '#0284C7',
                                                    fontWeight: 900,
                                                    height: 22,
                                                    fontSize: '0.72rem',
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700, ml: 'auto' }}>
                                                Per Diver / Session
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.85rem', lineHeight: 1.45, mb: 2 }}>
                                            Full equipment, briefing, 1-on-1 PADI instructor, roundtrip speedboat ferry from Murudeshwar Harbor, and underwater 4K video. 🤿
                                        </Typography>

                                        {/* Inclusions List */}
                                        <Stack spacing={0.8} sx={{ mb: 2.5 }}>
                                            {[
                                                '1-on-1 Dedicated PADI/SSI Divemaster',
                                                '4K GoPro Underwater Photos & Video Clip Included',
                                                'Full Scuba Gear (Wetsuit, Mask, Fins, Cylinder, Regulator)',
                                                'Speedboat Transit from Murudeshwar Harbor to Netrani',
                                                'Light Refreshments & Fruit Platter on Boat',
                                                'Honnavar to Murudeshwar Transfer Available (+₹300)',
                                            ].map((feat, fIdx) => (
                                                <Box key={fIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 16, color: '#0284C7' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: primaryTextColor, fontSize: '0.8rem' }}>
                                                        {feat}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>

                                        {/* Action Buttons */}
                                        <Grid container spacing={1.5}>
                                            <Grid size={{ xs: 8 }}>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={() => setModalOpen(true)}
                                                    sx={{
                                                        bgcolor: '#0284C7',
                                                        color: '#FFFFFF',
                                                        fontWeight: 850,
                                                        py: 1.2,
                                                        borderRadius: 2,
                                                        fontSize: '0.88rem',
                                                        '&:hover': { bgcolor: '#0369A1' },
                                                    }}
                                                >
                                                    Book This Dive Now →
                                                </Button>
                                            </Grid>
                                            <Grid size={{ xs: 4 }}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    component="a"
                                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20Netrani%20Island%20Scuba%20Diving."
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{
                                                        borderColor: '#25D366',
                                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                                        fontWeight: 800,
                                                        py: 1.2,
                                                        borderRadius: 2,
                                                        fontSize: '0.82rem',
                                                        '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)' },
                                                    }}
                                                >
                                                    WhatsApp
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. MANDATORY GOVERNMENT RULES & REGULATIONS + INTERACTIVE SELF-CHECKER
                ========================================================================== */}
                <Box id="govt-rules" sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        {/* Official Compliance Seals */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                            <Chip
                                icon={<SecurityIcon sx={{ fontSize: 15, color: '#E11D48 !important' }} />}
                                label="KARNATAKA MARITIME & FOREST DEPT COMPLIANCE"
                                size="small"
                                sx={{ bgcolor: 'rgba(225, 29, 72, 0.1)', color: '#E11D48', fontWeight: 850, fontSize: '0.72rem' }}
                            />
                            <Chip
                                icon={<DirectionsBoatIcon sx={{ fontSize: 15, color: '#0284C7 !important' }} />}
                                label="INDIAN COAST GUARD CLEARED"
                                size="small"
                                sx={{ bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', fontWeight: 850, fontSize: '0.72rem' }}
                            />
                            <Chip
                                icon={<ShieldIcon sx={{ fontSize: 15, color: '#059669 !important' }} />}
                                label="RSTC / PADI MEDICAL STANDARDS"
                                size="small"
                                sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 850, fontSize: '0.72rem' }}
                            />
                        </Box>

                        <Typography variant="h2" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' }, mb: 1.5 }}>
                            Official Government Scuba Diving Rules for Netrani
                        </Typography>
                        <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 780, mx: 'auto' }}>
                            Mandatory maritime, environmental, and medical regulations under the Wildlife Protection Act and Karnataka Port Authority. Complete compliance is enforced for every diver.
                        </Typography>
                    </Box>

                    {/* Interactive Diver Eligibility Self-Checker */}
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 5,
                            p: { xs: 2.5, sm: 3.5 },
                            borderRadius: 3.5,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F0FDF4',
                            border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <FactCheckIcon sx={{ fontSize: 28, color: '#059669' }} />
                                <Box>
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 900, color: primaryTextColor, fontSize: '1.08rem' }}>
                                        Instant Diver Eligibility Self-Check
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.78rem' }}>
                                        Verify your readiness in 10 seconds before reserving your dive batch
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                icon={<DoneAllIcon sx={{ fontSize: 16, color: '#059669 !important' }} />}
                                label={isFullyEligible ? '100% Eligible to Dive' : 'Check Requirements Below'}
                                sx={{
                                    bgcolor: isFullyEligible ? '#059669' : '#E11D48',
                                    color: '#FFFFFF',
                                    fontWeight: 900,
                                    fontSize: '0.76rem',
                                }}
                            />
                        </Box>

                        <Grid container spacing={2}>
                            {[
                                {
                                    key: 'age',
                                    label: '1. Diver Age 10+ Years',
                                    desc: 'Strict legal minimum for cylinder dives (Under 10 may only do surface snorkeling)',
                                },
                                {
                                    key: 'health',
                                    label: '2. No Disqualifying Conditions',
                                    desc: 'Free of heart attack history, asthma, serious back issues, major surgery, or pregnancy',
                                },
                                {
                                    key: 'sober',
                                    label: '3. 100% Sober (Zero Alcohol)',
                                    desc: 'No alcohol/substances in past 24 hours (strictly enforced at harbor gate)',
                                },
                                {
                                    key: 'id',
                                    label: '4. Valid Govt Photo ID with Address',
                                    desc: 'Aadhaar Card, Passport, or Driver’s License ready for Coast Guard manifest',
                                },
                            ].map((item) => (
                                <Grid key={item.key} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box
                                        onClick={() => setEligibility((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        sx={{
                                            p: 1.8,
                                            borderRadius: 2.5,
                                            cursor: 'pointer',
                                            bgcolor: eligibility[item.key]
                                                ? isDark ? 'rgba(5, 150, 105, 0.15)' : '#DCFCE7'
                                                : isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                            border: eligibility[item.key]
                                                ? '1.5px solid #10B981'
                                                : isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.84rem' }}>
                                                {item.label}
                                            </Typography>
                                            <CheckCircleIcon sx={{ fontSize: 18, color: eligibility[item.key] ? '#059669' : '#94A3B8' }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.73rem', lineHeight: 1.4, display: 'block' }}>
                                            {item.desc}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* 3 Main Categories Grid */}
                    <Grid container spacing={3.5}>
                        {GOVT_RULES_CATEGORIES.map((cat, cIdx) => (
                            <Grid key={cIdx} size={{ xs: 12, md: 4 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        p: { xs: 2.5, sm: 3 },
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.4)' : '0 12px 30px -8px rgba(0,0,0,0.1)',
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                                            {cat.icon}
                                        </Box>
                                        <Chip
                                            label={cat.badge}
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                                                color: cat.color,
                                                fontWeight: 850,
                                                fontSize: '0.68rem',
                                                border: `1px solid ${cat.color}40`,
                                            }}
                                        />
                                    </Box>

                                    <Typography variant="h5" component="h3" sx={{ fontWeight: 900, color: primaryTextColor, mb: 2, fontSize: '1.25rem' }}>
                                        {cat.title}
                                    </Typography>

                                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                                        {cat.rules.map((rule, rIdx) => (
                                            <Paper
                                                key={rIdx}
                                                elevation={0}
                                                sx={{
                                                    p: 1.8,
                                                    borderRadius: 2.5,
                                                    bgcolor: rule.important
                                                        ? isDark ? 'rgba(225, 29, 72, 0.08)' : '#FFF1F2'
                                                        : isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                                                    border: rule.important
                                                        ? isDark ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid #FECDD3'
                                                        : isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.6 }}>
                                                    {rule.important && (
                                                        <Chip
                                                            label="Strict"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#E11D48',
                                                                color: '#FFFFFF',
                                                                fontWeight: 900,
                                                                height: 18,
                                                                fontSize: '0.65rem',
                                                            }}
                                                        />
                                                    )}
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.88rem' }}>
                                                        {rule.label}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.8rem', lineHeight: 1.55 }}>
                                                    {rule.desc}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Government Reference Notice */}
                    <Box
                        sx={{
                            mt: 4,
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#EFF6FF',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                        }}
                    >
                        <SecurityIcon sx={{ fontSize: 28, color: '#3B82F6' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor }}>
                                Strict Compliance Notice • Indian Coast Guard & Uttara Kannada District Administration
                            </Typography>
                            <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.78rem' }}>
                                All Netrani Island scuba expeditions operate under verified operator licenses approved by the Uttara Kannada District Tourism Department, Karnataka Forest Academy, and Murudeshwar Port Authority. ID verification and medical self-declarations are verified prior to vessel departure.
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setModalOpen(true)}
                            sx={{
                                borderColor: '#3B82F6',
                                color: '#3B82F6',
                                fontWeight: 800,
                                textTransform: 'none',
                                borderRadius: 2,
                            }}
                        >
                            Book With Verified Operators
                        </Button>
                    </Box>
                </Box>

                {/* =========================================================================
                    3. CURATED DIVING & SNORKELING PACKAGES
                ========================================================================== */}
                <Box id="scuba-packages" sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                        <Box>
                            <Chip label="TRANSPARENT TARIFFS • NO HIDDEN CHARGES" size="small" sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 850, mb: 1 }} />
                            <Typography variant="h2" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.6rem' } }}>
                                Netrani Scuba & Snorkeling Packages
                            </Typography>
                            <Typography variant="body2" sx={{ color: secondaryTextColor, mt: 0.5 }}>
                                Guaranteed spot reservation. All gear, speedboat transit, 1-on-1 PADI instructor & free 4K GoPro media included.
                            </Typography>
                        </Box>
                    </Box>

                    <Grid container spacing={3.5}>
                        {scubaPackages.map((pkg, pIdx) => (
                            <Grid key={pIdx} size={{ xs: 12, md: 4 }}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: pkg.isPopular ? '2px solid #0284C7' : `1px solid ${cardBorderColor}`,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: pkg.isPopular
                                            ? isDark ? '0 16px 36px -10px rgba(2, 132, 199, 0.4)' : '0 16px 36px -10px rgba(2, 132, 199, 0.25)'
                                            : 'none',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            borderColor: '#0284C7',
                                            boxShadow: '0 18px 36px -8px rgba(2, 132, 199, 0.3)',
                                        },
                                    }}
                                >
                                    {/* Popular Header Ribbon */}
                                    {pkg.isPopular && (
                                        <Box
                                            sx={{
                                                bgcolor: '#0284C7',
                                                color: '#FFFFFF',
                                                textAlign: 'center',
                                                py: 0.6,
                                                fontSize: '0.74rem',
                                                fontWeight: 900,
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            ⭐ MOST RECOMMENDED FOR FIRST-TIME DIVERS
                                        </Box>
                                    )}

                                    <Box 
                                        sx={{ 
                                            position: 'relative', 
                                            height: 210, 
                                            bgcolor: '#0F172A', 
                                            overflow: 'hidden',
                                            cursor: pkg.media.gallery.length > 0 ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            if (pkg.media.gallery.length > 0) {
                                                setSelectedItemForGallery(pkg.item || { name: pkg.title, primary_image_url: pkg.media.primary, gallery_image_urls: pkg.media.gallery });
                                                setGalleryModalOpen(true);
                                            }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={pkg.media.primary}
                                            loading="lazy"
                                            alt={`${pkg.title} - Netrani Island Scuba Diving Package from Honnavar`}
                                            sx={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'cover',
                                                transition: 'transform 0.4s ease',
                                                '&:hover': pkg.media.gallery.length > 0 ? { transform: 'scale(1.05)' } : {},
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={pkg.badge}
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                color: '#FFFFFF',
                                                fontWeight: 850,
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(14, 165, 233, 0.8)',
                                                fontSize: '0.68rem',
                                            }}
                                        />
                                        {pkg.media.hasMultiple && (
                                            <Chip
                                                icon={<PhotoLibraryIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
                                                size="small"
                                                label={`${pkg.media.count} Photos`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedItemForGallery(pkg.item || { name: pkg.title, primary_image_url: pkg.media.primary, gallery_image_urls: pkg.media.gallery });
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
                                        <Chip
                                            size="small"
                                            label={pkg.depth}
                                            sx={{
                                                position: 'absolute',
                                                bottom: 12,
                                                right: 12,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                color: '#FFFFFF',
                                                fontWeight: 750,
                                                fontSize: '0.72rem',
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        />
                                    </Box>

                                    <CardContent sx={{ p: 2.8, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 900, color: primaryTextColor, mb: 0.5, lineHeight: 1.3 }}>
                                                {pkg.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                                                {pkg.category}
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <AccessTimeIcon sx={{ fontSize: 16, color: mutedTextColor }} />
                                                <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                    {pkg.duration}
                                                </Typography>
                                            </Box>

                                            {/* Gear Included Pills */}
                                            {pkg.equipment && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
                                                    {pkg.equipment.map((eq, eqIdx) => (
                                                        <Chip
                                                            key={eqIdx}
                                                            label={eq}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                                                                color: primaryTextColor,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 700,
                                                                height: 22,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}

                                            <Stack spacing={0.8} sx={{ mb: 2.5 }}>
                                                {pkg.features.map((feat, fIdx) => (
                                                    <Box key={fIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                        <CheckCircleIcon sx={{ fontSize: 15, color: '#0284C7', mt: 0.2 }} />
                                                        <Typography variant="caption" sx={{ color: primaryTextColor, fontWeight: 650, fontSize: '0.78rem', lineHeight: 1.45 }}>
                                                            {feat}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>

                                        <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontSize: '0.7rem' }}>
                                                        All-Inclusive Tariff
                                                    </Typography>
                                                    <Typography variant="h6" component="span" sx={{ fontWeight: 950, color: '#0284C7', lineHeight: 1.1 }}>
                                                        {pkg.rate}
                                                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.5 }}>
                                                            / person
                                                        </Typography>
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: mutedTextColor, fontWeight: 700 }}>
                                                    {pkg.originalRate}
                                                </Typography>
                                            </Box>

                                            <Grid container spacing={1}>
                                                <Grid size={{ xs: 8 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        onClick={() => setModalOpen(true)}
                                                        sx={{
                                                            bgcolor: '#0284C7',
                                                            color: '#FFFFFF',
                                                            fontWeight: 850,
                                                            py: 1,
                                                            borderRadius: 2,
                                                            fontSize: '0.84rem',
                                                            '&:hover': { bgcolor: '#0369A1' },
                                                        }}
                                                    >
                                                        Book This Dive →
                                                    </Button>
                                                </Grid>
                                                <Grid size={{ xs: 4 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        component="a"
                                                        href={`https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20the%20${encodeURIComponent(pkg.title)}%20package.`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            borderColor: '#25D366',
                                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                                            fontWeight: 800,
                                                            py: 1,
                                                            borderRadius: 2,
                                                            fontSize: '0.78rem',
                                                            '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)' },
                                                        }}
                                                    >
                                                        WhatsApp
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    4. DIVE DAY TIMELINE: HOW NETRANI EXPEDITION WORKS (Compact Strip)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Chip
                            label="STEP-BY-STEP DIVE DAY SCHEDULE"
                            sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 850, mb: 1 }}
                        />
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em' }}>
                            What to Expect on Your Scuba Day
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto', mt: 0.5 }}>
                            A seamless, professionally guided maritime expedition from Murudeshwar Harbor to Netrani Island and back.
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {[
                            {
                                step: '01',
                                time: '06:30 AM',
                                title: 'Harbor Reporting & Briefing',
                                desc: 'Assemble at Murudeshwar Harbor. Verify Govt ID, complete PADI declaration, and suit up.',
                                color: '#0284C7',
                            },
                            {
                                step: '02',
                                time: '07:15 AM',
                                title: 'Speedboat Cruise to Island',
                                desc: 'Twin-engine registered vessel cruise into the Arabian Sea with playful dolphin pods.',
                                color: '#059669',
                            },
                            {
                                step: '03',
                                time: '09:30 AM',
                                title: '1-on-1 Guided Coral Dive',
                                desc: 'Dedicated certified divemaster guides your 30-40 min underwater dive up to 12 meters.',
                                color: '#4F46E5',
                            },
                            {
                                step: '04',
                                time: '01:30 PM',
                                title: 'Return & 4K Media Transfer',
                                desc: 'Enjoy fresh fruits on return. HD/4K underwater GoPro videos transferred to your phone.',
                                color: '#D97706',
                            },
                        ].map((step, sIdx) => (
                            <Grid key={sIdx} size={{ xs: 12, sm: 6, md: 3 }}>
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
                                            bgcolor: `${step.color}15`,
                                            color: step.color,
                                            fontWeight: 950,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `1.5px solid ${step.color}`,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {step.step}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                                            <Typography
                                                variant="subtitle2"
                                                component="h3"
                                                sx={{
                                                    fontWeight: 800,
                                                    color: primaryTextColor,
                                                    fontSize: '0.88rem',
                                                }}
                                            >
                                                {step.title}
                                            </Typography>
                                            <Chip
                                                label={step.time}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    bgcolor: `${step.color}18`,
                                                    color: step.color,
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: secondaryTextColor,
                                                fontSize: '0.8rem',
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {step.desc}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    5. NETRANI DIVE SITES & MARINE LIFE (Depth Meters & Biodiversity)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 7, md: 10 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Chip label="UNDERWATER BIODIVERSITY" size="small" sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', fontWeight: 850, mb: 1 }} />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1.5 }}>
                            Famous Dive Sites Around Netrani Island
                        </Typography>
                        <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 640, mx: 'auto' }}>
                            Known as "Pigeon Island", Netrani is ranked among India's top 3 scuba diving hotspots alongside the Andamans and Lakshadweep.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                name: 'The Nursery (Coral Garden)',
                                depth: '6 – 10 Meters',
                                depthPercent: 33,
                                vis: '15 – 20 Meters',
                                current: 'Mild / Gentle',
                                level: 'Beginners & Non-Swimmers',
                                species: ['🐠 Clownfish (Nemo)', '🪸 Brain Corals', '🐡 Parrotfish', '🦋 Butterflyfish'],
                                desc: 'Vibrant staghorn and table corals surrounded by clownfish, butterflyfish, parrotfish, and friendly damselfish. Perfect for first-time discovery divers.',
                            },
                            {
                                name: 'Grand Central Station',
                                depth: '10 – 18 Meters',
                                depthPercent: 60,
                                vis: '18 – 25 Meters',
                                current: 'Mild to Moderate',
                                level: 'Beginners & Advanced',
                                species: ['🐟 Silver Barracudas', '🐠 Yellowtail Snappers', '⚡ Jack Trevally', '🐢 Sea Turtles'],
                                desc: 'A bustling underwater crossroads where massive schools of silver barracudas, yellowtail snappers, and trevally jackfish circle gracefully in open blue water.',
                            },
                            {
                                name: "Alladin’s Cave & Rocky Outcrops",
                                depth: '12 – 22 Meters',
                                depthPercent: 73,
                                vis: '15 – 20 Meters',
                                current: 'Moderate',
                                level: 'Certified Divers',
                                species: ['🐍 Honeycomb Morays', '🔵 Blue-Spotted Rays', '🐢 Green Turtles', '🦀 Spiny Lobsters'],
                                desc: 'Dramatic volcanic boulders, overhangs, and swim-throughs sheltering large honeycomb moray eels, blue-spotted stingrays, and seasonal green sea turtles.',
                            },
                            {
                                name: 'The Abyss & Southern Drop-off',
                                depth: '15 – 30 Meters',
                                depthPercent: 100,
                                vis: '20+ Meters',
                                current: 'Moderate to Strong',
                                level: 'PADI Advanced Certified',
                                species: ['🦈 Whale Sharks (Seasonal)', '🐟 Cobias', '🐠 Giant Groupers', '🌊 Open Pelagics'],
                                desc: 'Deep oceanic drop-off into the Arabian Sea where pelagic species, groupers, cobias, and occasional gentle whale sharks are sighted between November and February.',
                            },
                        ].map((spot, spIdx) => (
                            <Grid key={spIdx} size={{ xs: 12, sm: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3.2,
                                        borderRadius: 3.5,
                                        bgcolor: cardBgColor,
                                        border: `1px solid ${cardBorderColor}`,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: '#0284C7',
                                            boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.4)' : '0 10px 24px rgba(2, 132, 199, 0.12)',
                                        },
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                            <Typography variant="h6" component="h3" sx={{ fontWeight: 900, color: primaryTextColor, fontSize: '1.1rem' }}>
                                                {spot.name}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={spot.level}
                                                sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 800, fontSize: '0.72rem' }}
                                            />
                                        </Box>

                                        <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.86rem', lineHeight: 1.6, mb: 2 }}>
                                            {spot.desc}
                                        </Typography>

                                        {/* Species Spotted Tags */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
                                            {spot.species.map((sp, sIdx) => (
                                                <Chip
                                                    key={sIdx}
                                                    label={sp}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ECFDF5',
                                                        color: isDark ? '#34D399' : '#047857',
                                                        fontWeight: 750,
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>

                                    <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                                        {/* Visual Depth Gauge */}
                                        <Box sx={{ mb: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 700, fontSize: '0.72rem' }}>
                                                    Depth Range: <strong style={{ color: primaryTextColor }}>{spot.depth}</strong>
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, fontSize: '0.72rem' }}>
                                                    Vis: {spot.vis}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={spot.depthPercent}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                    '& .MuiLinearProgress-bar': {
                                                        background: 'linear-gradient(90deg, #38BDF8 0%, #0284C7 50%, #4F46E5 100%)',
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 700 }}>
                                                Water Current: <strong style={{ color: primaryTextColor }}>{spot.current}</strong>
                                            </Typography>
                                            <Chip
                                                label="Boat Anchor Bay"
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.65rem', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}
                                            />
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* =========================================================================
                    6. SCUBA FAQS (Accordion)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1000px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, pb: { xs: 8, md: 12 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Chip label="FREQUENTLY ASKED QUESTIONS" size="small" sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 850, mb: 1 }} />
                        <Typography variant="h3" component="h2" sx={{ fontWeight: 950, color: primaryTextColor, letterSpacing: '-0.02em', mb: 1.5 }}>
                            Everything You Need to Know About Netrani Diving
                        </Typography>
                    </Box>

                    <Stack spacing={1.5}>
                        {SCUBA_FAQS.slice(0, 5).map((faq, fIdx) => (
                            <Accordion
                                key={fIdx}
                                defaultExpanded={fIdx === 0}
                                elevation={0}
                                sx={{
                                    borderRadius: '16px !important',
                                    bgcolor: cardBgColor,
                                    border: `1px solid ${cardBorderColor}`,
                                    '&:before': { display: 'none' },
                                    overflow: 'hidden',
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0284C7' }} />} sx={{ p: 2.2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.98rem' }}>
                                        {faq.q}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                                    <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.7, fontSize: '0.88rem' }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}

                        {/* Embedded Honnavar-Murudeshwar Transit & Distances Accordion */}
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
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0284C7' }} />} sx={{ p: 2.2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.98rem' }}>
                                    Staying in Honnavar? How do transfers and travel times to Murudeshwar Harbor work?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                                <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.7, fontSize: '0.88rem', mb: 2 }}>
                                    Murudeshwar Harbor is just <strong>27 km (35 minutes)</strong> south of Honnavar along 4-lane NH-66. GK WhizWheels arranges early morning cab pickups (or self-drive rental Activas from ₹450/day) delivered right to your Honnavar homestay or hotel so you arrive relaxed before the 06:30 AM harbor batch.
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {SIGHTSEEING_DISTANCES.map((dist, dIdx) => (
                                        <Grid key={dIdx} size={{ xs: 12, sm: 6 }}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                                                    border: `1px solid ${cardBorderColor}`,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    height: '100%',
                                                }}
                                            >
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, fontSize: '0.84rem' }}>
                                                        {dist.spot}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.72rem', display: 'block' }}>
                                                        {dist.note}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <Chip
                                                        size="small"
                                                        label={dist.dist}
                                                        sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', fontWeight: 850, fontSize: '0.7rem', height: 20 }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', mt: 0.3, fontSize: '0.7rem' }}>
                                                        {dist.time}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </Stack>
                </Box>

                {/* =========================================================================
                    8. BOTTOM CTA BANNER (Deep Ocean Gradient)
                ========================================================================== */}
                <Box sx={{ maxWidth: '1380px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: { xs: 4, sm: 5, md: 7 },
                            background: 'linear-gradient(135deg, #090D16 0%, #0F172A 50%, #0369A1 100%)',
                            border: '1px solid rgba(14, 165, 233, 0.3)',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
                        }}
                    >
                        {/* Glow orb */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -80,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 400,
                                height: 200,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)',
                                filter: 'blur(50px)',
                                pointerEvents: 'none',
                            }}
                        />

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Chip label="24x7 DIVE DESK ASSISTANCE" size="small" sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 900, mb: 1.5 }} />
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 950, color: '#FFFFFF', letterSpacing: '-0.02em', mb: 1.5 }}>
                                Ready to Explore the Magic of Netrani Island?
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto', mb: 3.5, fontSize: '1.05rem' }}>
                                Book your dive slot in advance. Early morning departure batches fill fast on weekends and holidays. Zero cancellation fee on weather reschedules.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => setModalOpen(true)}
                                    sx={{
                                        bgcolor: '#0284C7',
                                        color: '#FFFFFF',
                                        fontWeight: 850,
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2.5,
                                        fontSize: '0.98rem',
                                        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.5)',
                                        '&:hover': { bgcolor: '#0369A1' },
                                    }}
                                >
                                    Book Online Now (Zero Advance)
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20book%20Netrani%20Scuba%20Diving."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                    sx={{
                                        borderColor: '#25D366',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        px: 3,
                                        py: 1.5,
                                        borderRadius: 2.5,
                                        '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.15)', borderColor: '#25D366' },
                                    }}
                                >
                                    WhatsApp Divemaster
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>
                </Box>

                {/* Dedicated Scuba Booking Modal */}
                <ScubaBookingModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    initialProgramId="discovery_scuba"
                    availableItems={availableItems}
                />

                {/* Multi-Image Scuba Gallery Lightbox */}
                <ServiceGalleryModal
                    open={galleryModalOpen}
                    onClose={() => setGalleryModalOpen(false)}
                    item={selectedItemForGallery}
                    onBook={(item) => {
                        setGalleryModalOpen(false);
                        setModalOpen(true);
                    }}
                />
            </Box>
        </AppLayout>
    );
}

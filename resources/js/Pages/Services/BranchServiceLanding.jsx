import React, { useState, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Paper,
    Divider,
    TextField,
    MenuItem,
    Breadcrumbs,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    useTheme,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DirectionsIcon from '@mui/icons-material/Directions';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import ShieldIcon from '@mui/icons-material/Shield';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StarIcon from '@mui/icons-material/Star';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import VerifiedIcon from '@mui/icons-material/Verified';
import ElectricMopedIcon from '@mui/icons-material/ElectricMoped';
import NavigationIcon from '@mui/icons-material/Navigation';

import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';
import { useColorMode } from '../../theme/ColorModeContext';
import { getServicePlaceholder } from '../../utils/placeholder';

export default function BranchServiceLanding({
    branch = {},
    service = {},
    inventory = [],
    pickupPoints = [],
    otherBranches = [],
    availableServices = [],
    cabFareRules = [],
    cabVehicles = [],
    seo = {},
}) {
    const theme = useTheme();
    const { mode } = useColorMode();
    const isDark = mode === 'dark';
    const { siteSettings = {} } = usePage().props;

    // Formatting date helpers
    const getFormattedDate = (offsetDays = 0) => {
        const d = new Date(Date.now() + offsetDays * 86400000);
        return d.toISOString().split('T')[0];
    };

    const today = getFormattedDate(0);
    const tomorrow = getFormattedDate(1);
    const dayAfterTomorrow = getFormattedDate(2);
    const threeDaysLater = getFormattedDate(3);

    // Dynamic Booking Form State
    const [pickupDate, setPickupDate] = useState(today);
    const [returnDate, setReturnDate] = useState(tomorrow);
    const [pickupTime, setPickupTime] = useState('09:00');
    const [returnTime, setReturnTime] = useState('09:00');
    const [selectedPickupPointId, setSelectedPickupPointId] = useState(pickupPoints[0]?.id || '');
    const [selectedReturnPointId, setSelectedReturnPointId] = useState(pickupPoints[0]?.id || '');

    // Fleet Filtering & Search State
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [fuelFilter, setFuelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recommended');

    // Quick Spec Modal State
    const [selectedModelForModal, setSelectedModelForModal] = useState(null);

    // Rental Duration Calculation (Live Engine)
    const rentalDuration = useMemo(() => {
        try {
            const start = new Date(`${pickupDate}T${pickupTime}`);
            const end = new Date(`${returnDate}T${returnTime}`);
            const diffMs = end - start;

            if (diffMs <= 0) {
                const cur = new Date(`${pickupDate}T12:00:00`);
                const day = cur.getDay();
                const isWk = day === 0 || day === 5 || day === 6;
                return { days: 1, hours: 24, weekendDays: isWk ? 1 : 0, weekdayDays: isWk ? 0 : 1, label: '1 Day (Min)', isWeekendTrip: isWk };
            }

            const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
            const calculatedDays = Math.max(1, Math.ceil(totalHours / 24));

            // Determine weekend days (Fri=5, Sat=6, Sun=0 matching PricingService.php)
            let weekendDays = 0;
            let weekdayDays = 0;
            for (let i = 0; i < calculatedDays; i++) {
                const cur = new Date(`${pickupDate}T12:00:00`);
                cur.setDate(cur.getDate() + i);
                const day = cur.getDay();
                if (day === 0 || day === 5 || day === 6) {
                    weekendDays++;
                } else {
                    weekdayDays++;
                }
            }

            return {
                days: calculatedDays,
                hours: totalHours,
                weekendDays,
                weekdayDays,
                label: `${calculatedDays} Day${calculatedDays > 1 ? 's' : ''} (${totalHours}h)`,
                isWeekendTrip: weekendDays > 0,
            };
        } catch {
            return { days: 1, hours: 24, weekendDays: 0, weekdayDays: 1, label: '1 Day', isWeekendTrip: false };
        }
    }, [pickupDate, returnDate, pickupTime, returnTime]);

    // Directional Surcharge Calculation
    const selectedPickupPoint = useMemo(
        () => pickupPoints.find((p) => p.id === Number(selectedPickupPointId)) || pickupPoints[0],
        [pickupPoints, selectedPickupPointId]
    );

    const selectedReturnPoint = useMemo(
        () => pickupPoints.find((p) => p.id === Number(selectedReturnPointId)) || pickupPoints[0],
        [pickupPoints, selectedReturnPointId]
    );

    const totalLocationFee = useMemo(() => {
        const pFee = Number(selectedPickupPoint?.delivery_fee || selectedPickupPoint?.pickup_fee || 0);
        const rFee = Number(selectedReturnPoint?.return_fee || 0);
        return pFee + rFee;
    }, [selectedPickupPoint, selectedReturnPoint]);

    // Real-Time Dynamic Trip Cost Calculation per Vehicle Model
    const calculateModelTripTotal = (model) => {
        if (!model) {
            return {
                total: 0,
                totalWithGst: 0,
                gstAmount: 0,
                rentalCost: 0,
                locationFee: 0,
                days: 1,
                dailyRateToDisplay: 0,
                isWeekendApplied: false,
                isPureWeekend: false,
                isPureWeekday: true,
                rateTypeLabel: 'Weekday Tariff',
            };
        }

        const weekdayRate = Number(model.weekday_rate || model.indicative_daily_rate || model.price_base || 500);
        const weekendRate = Number(model.weekend_rate || weekdayRate * 1.2);

        const wDays = rentalDuration.weekdayDays ?? 1;
        const wkDays = rentalDuration.weekendDays ?? 0;
        const totalDays = rentalDuration.days || 1;

        const rentalCost = (wDays * weekdayRate) + (wkDays * weekendRate);
        const total = rentalCost + totalLocationFee;
        const gstAmount = Math.round(total * 0.18);
        const totalWithGst = total + gstAmount;

        const isWeekendApplied = wkDays > 0;
        const isPureWeekend = wkDays === totalDays;
        const isPureWeekday = wDays === totalDays;

        let dailyRateToDisplay = weekdayRate;
        let rateTypeLabel = 'Weekday Tariff';

        if (isPureWeekend) {
            dailyRateToDisplay = weekendRate;
            rateTypeLabel = 'Weekend Tariff';
        } else if (isPureWeekday) {
            dailyRateToDisplay = weekdayRate;
            rateTypeLabel = 'Weekday Tariff';
        } else {
            dailyRateToDisplay = Math.round(rentalCost / totalDays);
            rateTypeLabel = 'Avg. Daily Rate';
        }

        return {
            total,
            totalWithGst,
            gstAmount,
            rentalCost,
            locationFee: totalLocationFee,
            days: totalDays,
            hours: rentalDuration.hours,
            weekendDays: wkDays,
            weekdayDays: wDays,
            isWeekendApplied,
            isPureWeekend,
            isPureWeekday,
            dailyRateToDisplay,
            rateTypeLabel,
            weekdayRate,
            weekendRate,
            hasWeekendRate: wkDays > 0 && weekendRate > weekdayRate,
        };
    };

    // Category list with counts
    const categoryCounts = useMemo(() => {
        const counts = { all: inventory.length };
        inventory.forEach((item) => {
            const cat = item.category_name || 'Scooter';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [inventory]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(inventory.map((i) => i.category_name).filter(Boolean)));
        return ['all', ...cats];
    }, [inventory]);

    // Filtered & Sorted Inventory
    const filteredInventory = useMemo(() => {
        let result = [...inventory];

        // 1. Category Filter
        if (selectedCategory !== 'all') {
            result = result.filter(
                (item) => item.category_name?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // 2. Fuel Type Filter
        if (fuelFilter !== 'all') {
            result = result.filter(
                (item) => item.fuel_type?.toLowerCase() === fuelFilter.toLowerCase()
            );
        }

        // 3. Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (item) =>
                    item.name?.toLowerCase().includes(q) ||
                    item.brand?.toLowerCase().includes(q) ||
                    item.category_name?.toLowerCase().includes(q)
            );
        }

        // 4. Sorting
        result.sort((a, b) => {
            const aPrice = calculateModelTripTotal(a).dailyRateToDisplay;
            const bPrice = calculateModelTripTotal(b).dailyRateToDisplay;

            if (sortBy === 'price_asc') return aPrice - bPrice;
            if (sortBy === 'price_desc') return bPrice - aPrice;
            if (sortBy === 'availability') return (b.available_now || 0) - (a.available_now || 0);
            // Default: available first, then lower price
            if ((b.available_now || 0) !== (a.available_now || 0)) {
                return (b.available_now || 0) - (a.available_now || 0);
            }
            return aPrice - bPrice;
        });

        return result;
    }, [inventory, selectedCategory, fuelFilter, searchQuery, sortBy]);

    // Quick Date Presets
    const handlePresetSelection = (presetType) => {
        if (presetType === '24h') {
            setPickupDate(today);
            setReturnDate(tomorrow);
            setPickupTime('09:00');
            setReturnTime('09:00');
        } else if (presetType === '48h') {
            setPickupDate(today);
            setReturnDate(dayAfterTomorrow);
            setPickupTime('09:00');
            setReturnTime('09:00');
        } else if (presetType === 'weekend') {
            // Next Friday to Sunday or 3 days
            setPickupDate(today);
            setReturnDate(threeDaysLater);
            setPickupTime('08:00');
            setReturnTime('20:00');
        }
    };

    const scrollToFleet = () => {
        const el = document.getElementById('fleet-catalog');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleProceedToCheckout = (model) => {
        const queryParams = new URLSearchParams({
            bike_model_id: model.id,
            start_date: pickupDate,
            end_date: returnDate,
            pickup_store_id: branch.id,
            return_store_id: branch.id,
            pickup_point_id: selectedPickupPointId || '',
            return_point_id: selectedReturnPointId || '',
            pickup_time: pickupTime,
            return_time: returnTime,
        });
        router.visit(`/services/bikes/checkout?${queryParams.toString()}`);
    };

    const whatsappConciergeUrl = `https://wa.me/91${(branch.whatsapp || siteSettings.whatsapp_number || '8660989586').replace(/\D/g, '')}?text=Hi%20GK%20WhizWheel%20${encodeURIComponent(branch.city || branch.name)}%20Hub,%20I%20am%20looking%20to%20rent%20a%20bike%20from%20${pickupDate}%20to%20${returnDate}.%20Please%20assist%20me.`;

    // Local Scenic Destination Distance Matrix for Honnavar
    const localDestinations = [
        {
            name: 'Kasarkod Eco Beach & Boardwalk',
            distance: '4.2 km',
            duration: '10 mins',
            highlight: 'Blue Flag Beach, Golden Sand & Mangrove Boardwalk',
            tag: 'Top Sunset Ride',
        },
        {
            name: 'Sharavathi River Jetty & Backwaters',
            distance: '2.8 km',
            duration: '7 mins',
            highlight: 'Speedboat Boating, Kayaking & Estuary View',
            tag: 'Water Sports',
        },
        {
            name: 'Mirjan Fort (Historic Citadel)',
            distance: '21 km',
            duration: '25 mins',
            highlight: '16th-Century Laterite Architecture & Scenic NH66 Cruise',
            tag: 'Heritage Trail',
        },
        {
            name: 'Apsarakonda Waterfalls & Cliff View',
            distance: '7.5 km',
            duration: '15 mins',
            highlight: 'Natural Pond, Arabian Sea Cliff Panorama & Pandava Caves',
            tag: 'Nature Spot',
        },
        {
            name: 'Murudeshwar Shiva Temple & Netrani',
            distance: '26 km',
            duration: '35 mins',
            highlight: '123ft Shiva Statue, Netrani Scuba Jetty & Coastal Highway',
            tag: 'Iconic Pilgrimage',
        },
        {
            name: 'Gokarna Om Beach & Kudle Beach',
            distance: '52 km',
            duration: '1 hr 15m',
            highlight: 'Famous Beach Shacks, Trekking, Mahabaleshwar Temple',
            tag: 'Day Trip Cruise',
        },
    ];

    // Frequently Asked Questions
    const faqItems = [
        {
            q: 'What documents are required to rent a bike in Honnavar?',
            a: 'You only need a valid original Indian Driving License (for two-wheelers) and an Aadhaar Card / Passport / Voter ID for instant digital KYC. International tourists can present their Passport and International Driving Permit (IDP).',
        },
        {
            q: 'Is a security deposit mandatory?',
            a: 'No! GK WhizWheel offers Zero Security Deposit for riders with verified DigiLocker / Aadhaar verification. For standard bookings without digital KYC, a minimal refundable deposit applies.',
        },
        {
            q: 'Can I pick up the bike at Honnavar Railway Station or KSRTC Bus Stand?',
            a: 'Yes, absolutely. We offer doorstep and platform-side delivery to Honnavar Railway Station, KSRTC Bus Stand, and Sharavati Circle with zero hassle.',
        },
        {
            q: 'Can I ride the bike from Honnavar to Gokarna, Murudeshwar, or Jog Falls?',
            a: 'Yes! All GK WhizWheel bikes carry commercial yellow-board registration and comprehensive commercial insurance, making them 100% road-legal across Karnataka and inter-state border crossings without police interference.',
        },
        {
            q: 'What is included in the rental price?',
            a: 'Every rental includes: 2 Clean Sanitized ISI-marked Helmets, 24/7 Roadside Assistance, Comprehensive Insurance, Phone Mount, and 24-hour customer support.',
        },
        {
            q: 'What happens in case of a flat tire or mechanical breakdown?',
            a: 'Our local Honnavar rapid response road-rescue team is on standby 24/7. In the rare event of a puncture or mechanical failure, we dispatch a technician or a replacement bike directly to your location on the coastal highway.',
        },
    ];

    return (
        <AppLayout>
            <PageHead
                title={seo.title || `Bike & Scooter Rentals in ${branch.city || branch.name} | GK WhizWheel`}
                description={seo.description || `Rent verified bikes and scooters in ${branch.city || branch.name}. 100% yellow-board legal fleet, zero security deposit, 2 free helmets & 24/7 coastal road rescue.`}
            />

            {/* TOP BAR: Breadcrumbs & Coastal Hub Switcher */}
            <Box
                sx={{
                    width: '100%',
                    bgcolor: isDark ? 'rgba(11, 17, 32, 0.95)' : '#FFFFFF',
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    py: 1.5,
                    px: { xs: 2, sm: 3, md: 4 },
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1400,
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'flex-start', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                    }}
                >
                    {/* Breadcrumbs */}
                    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem' }}>
                        <Link href="/" style={{ color: isDark ? '#94A3B8' : '#64748B', textDecoration: 'none' }}>
                            Home
                        </Link>
                        <Typography sx={{ fontSize: '0.85rem', color: isDark ? '#CBD5E1' : '#334155', fontWeight: 600 }}>
                            {branch.city || branch.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: isDark ? '#38BDF8' : '#0D9488', fontWeight: 750 }}>
                            {service.short_title || 'Bike Rentals'}
                        </Typography>
                    </Breadcrumbs>

                    {/* Coastal Branch Switcher Pills */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                color: isDark ? '#94A3B8' : '#64748B',
                                mr: 0.5,
                            }}
                        >
                            Coastal Hub:
                        </Typography>
                        <Chip
                            icon={<LocationOnIcon sx={{ fontSize: '1rem !important', color: '#10B981 !important' }} />}
                            label={`${branch.city || branch.name} (Active Hub)`}
                            size="small"
                            sx={{
                                fontWeight: 800,
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                                color: isDark ? '#34D399' : '#047857',
                                border: 1,
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                            }}
                        />
                        {otherBranches.map((other) => (
                            <Button
                                key={other.id}
                                component={Link}
                                href={`/${other.slug}/services/${service.slug || 'bikes'}`}
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    py: 0.25,
                                    px: 1.5,
                                    borderRadius: 2,
                                    color: isDark ? '#CBD5E1' : '#475569',
                                    border: 1,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                                    '&:hover': {
                                        borderColor: isDark ? '#38BDF8' : '#0F766E',
                                        color: isDark ? '#38BDF8' : '#0F766E',
                                    },
                                }}
                            >
                                {other.city || other.name} Hub →
                            </Button>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* SERVICES TABS SUB-BAR */}
            <Box
                sx={{
                    width: '100%',
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box
                    sx={{
                        maxWidth: 1400,
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        overflowX: 'auto',
                        py: 1,
                        '::-webkit-scrollbar': { display: 'none' },
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: isDark ? '#64748B' : '#94A3B8',
                            whiteSpace: 'nowrap',
                            mr: 0.5,
                        }}
                    >
                        {branch.city || branch.name} Verticals:
                    </Typography>
                    {availableServices.filter((s) => s.is_enabled).map((s) => {
                        const isActive = s.slug === (service.slug || 'bikes');
                        return (
                            <Button
                                key={s.slug}
                                component={Link}
                                href={`/${branch.slug}/services/${s.slug}`}
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 850 : 650,
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: 2,
                                    whiteSpace: 'nowrap',
                                    color: isActive
                                        ? (isDark ? '#38BDF8' : '#0F766E')
                                        : (isDark ? '#94A3B8' : '#64748B'),
                                    bgcolor: isActive
                                        ? (isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 118, 110, 0.08)')
                                        : 'transparent',
                                    border: 1,
                                    borderColor: isActive
                                        ? (isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 118, 110, 0.25)')
                                        : 'transparent',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#EDF2F7',
                                    },
                                }}
                            >
                                {s.name}
                            </Button>
                        );
                    })}
                </Box>
            </Box>

            {/* HERO SECTION: 2-Column Responsive Layout */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: isDark
                        ? 'radial-gradient(ellipse at top left, rgba(15, 118, 110, 0.25), transparent 70%), #0B1120'
                        : 'radial-gradient(ellipse at top left, rgba(13, 148, 136, 0.08), transparent 70%), #F8FAFC',
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    py: { xs: 4, sm: 6, md: 8 },
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    <Grid container spacing={{ xs: 4, lg: 6 }} alignItems="flex-start">
                        {/* Left Column (7 cols): Local Brand Context & Trust Badges */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Hub Live Status Badge */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip
                                        icon={<TwoWheelerIcon sx={{ fontSize: '1.1rem !important' }} />}
                                        label={`${branch.city || branch.name} Fleet Hub • ${inventory.length} Models Ready`}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#F0FDFA',
                                            color: isDark ? '#38BDF8' : '#0F766E',
                                            border: 1,
                                            borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#99F6E4',
                                        }}
                                    />
                                    <Chip
                                        icon={<VerifiedIcon sx={{ fontSize: '1rem !important', color: '#10B981 !important' }} />}
                                        label="100% Commercial RTO Registered"
                                        size="small"
                                        sx={{
                                            fontWeight: 750,
                                            fontSize: '0.75rem',
                                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4',
                                            color: isDark ? '#34D399' : '#15803D',
                                            border: 1,
                                            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
                                        }}
                                    />
                                </Box>

                                {/* Main Headline */}
                                <Typography
                                    component="h1"
                                    variant="h2"
                                    sx={{
                                        fontWeight: 900,
                                        fontSize: { xs: '2.1rem', sm: '2.8rem', md: '3.4rem' },
                                        lineHeight: 1.12,
                                        letterSpacing: '-0.035em',
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                    }}
                                >
                                    Self-Drive Bike & Scooter Rentals in{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            color: isDark ? '#38BDF8' : '#0D9488',
                                            textDecoration: 'underline',
                                            textDecorationColor: '#F59E0B',
                                            textUnderlineOffset: '6px',
                                        }}
                                    >
                                        {branch.city || branch.name}
                                    </Box>
                                </Typography>

                                {/* Localized Subtitle */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: { xs: '1rem', md: '1.15rem' },
                                        lineHeight: 1.65,
                                        color: isDark ? '#CBD5E1' : '#475569',
                                        maxWidth: 680,
                                    }}
                                >
                                    Explore Kasarkod Eco Beach, Sharavathi backwaters, Mirjan Fort & the Gokarna coastal strip at your own pace. Clean sanitized scooters and cruisers with zero security deposit and platform-side railway delivery.
                                </Typography>

                                {/* 4 Core Pillars of Operational Trust (Grid v2) */}
                                <Grid container spacing={2} sx={{ my: 1.5 }}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: isDark ? 'rgba(19, 29, 47, 0.8)' : '#FFFFFF',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                display: 'flex',
                                                gap: 1.5,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <ShieldIcon sx={{ color: '#10B981', mt: 0.3 }} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                    100% Road-Legal Fleet
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.5 }}>
                                                    Commercial yellow-board plates. No private plate confiscation risks by RTO/police.
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: isDark ? 'rgba(19, 29, 47, 0.8)' : '#FFFFFF',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                display: 'flex',
                                                gap: 1.5,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <SecurityIcon sx={{ color: '#F59E0B', mt: 0.3 }} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                    Zero Security Deposit
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.5 }}>
                                                    Instant digital KYC verification. No cash blocked during your coastal vacation.
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: isDark ? 'rgba(19, 29, 47, 0.8)' : '#FFFFFF',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                display: 'flex',
                                                gap: 1.5,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <DirectionsBikeIcon sx={{ color: '#38BDF8', mt: 0.3 }} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                    2 Free ISI Helmets
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.5 }}>
                                                    Sanitized rider and pillion helmets with transparent visors for coastal night rides.
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: isDark ? 'rgba(19, 29, 47, 0.8)' : '#FFFFFF',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                display: 'flex',
                                                gap: 1.5,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <SpeedIcon sx={{ color: '#EC4899', mt: 0.3 }} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                    24/7 Roadside Rescue
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.5 }}>
                                                    On-demand breakdown support and replacement bike dispatch across Uttara Kannada.
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Direct Hub Contact Strip */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, pt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <PhoneIcon sx={{ fontSize: '1rem', color: isDark ? '#38BDF8' : '#0F766E' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 750, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                            Hub Desk: {branch.phone || '8660989586'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8' }}>•</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <AccessTimeIcon sx={{ fontSize: '1rem', color: '#10B981' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#475569' }}>
                                            {branch.operating_hours_label || 'Open 7:30 AM - 9:30 PM'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8' }}>•</Typography>
                                    <Button
                                        component="a"
                                        href={whatsappConciergeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        size="small"
                                        startIcon={<WhatsAppIcon sx={{ color: '#10B981 !important' }} />}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            color: '#10B981',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                        }}
                                    >
                                        WhatsApp Concierge →
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Right Column (5 cols): Dynamic Sticky Trip Planner Widget */}
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Paper
                                elevation={isDark ? 8 : 4}
                                sx={{
                                    p: { xs: 2.5, sm: 3.5 },
                                    borderRadius: 4,
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: 1,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                                    boxShadow: isDark
                                        ? '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
                                        : '0 20px 40px -15px rgba(15, 118, 110, 0.12)',
                                }}
                            >
                                {/* Widget Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2, borderBottom: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 850, letterSpacing: '0.06em', color: isDark ? '#38BDF8' : '#0D9488' }}>
                                            Trip Planner & Rate Engine
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 850, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                            {branch.city || branch.name} Hub Reservation
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${filteredInventory.length} Available`}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                                            color: isDark ? '#34D399' : '#059669',
                                        }}
                                    />
                                </Box>

                                {/* Location Selectors */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Pickup Location */}
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label={`Pickup Point (${branch.city || branch.name})`}
                                        value={selectedPickupPointId}
                                        onChange={(e) => setSelectedPickupPointId(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationOnIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E', fontSize: 20 }} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    >
                                        {pickupPoints.map((point) => {
                                            const pFee = Number(point.delivery_fee || point.pickup_fee || 0);
                                            return (
                                                <MenuItem key={point.id} value={point.id}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {point.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 750, color: pFee > 0 ? '#F59E0B' : '#10B981', ml: 1 }}>
                                                            {pFee > 0 ? `+₹${pFee}` : 'Free Hub Pickup'}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </TextField>

                                    {/* Return Location */}
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Return Point"
                                        value={selectedReturnPointId}
                                        onChange={(e) => setSelectedReturnPointId(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <NavigationIcon sx={{ color: isDark ? '#F59E0B' : '#D97706', fontSize: 18 }} />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    >
                                        {pickupPoints.map((point) => {
                                            const rFee = Number(point.return_fee || 0);
                                            return (
                                                <MenuItem key={point.id} value={point.id}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {point.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 750, color: rFee > 0 ? '#F59E0B' : '#10B981', ml: 1 }}>
                                                            {rFee > 0 ? `+₹${rFee}` : 'Standard Return'}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </TextField>

                                    {/* Dates: Pickup & Return */}
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                size="small"
                                                label="Pickup Date"
                                                value={pickupDate}
                                                onChange={(e) => setPickupDate(e.target.value)}
                                                inputProps={{ min: today }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                size="small"
                                                label="Return Date"
                                                value={returnDate}
                                                onChange={(e) => setReturnDate(e.target.value)}
                                                inputProps={{ min: pickupDate || today }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* Times: Pickup & Return */}
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                fullWidth
                                                type="time"
                                                size="small"
                                                label="Pickup Time"
                                                value={pickupTime}
                                                onChange={(e) => setPickupTime(e.target.value)}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <TextField
                                                fullWidth
                                                type="time"
                                                size="small"
                                                label="Return Time"
                                                value={returnTime}
                                                onChange={(e) => setReturnTime(e.target.value)}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* Quick Date Preset Chips */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 750, color: isDark ? '#94A3B8' : '#64748B' }}>
                                            Presets:
                                        </Typography>
                                        <Chip
                                            label="24h Day Trip"
                                            size="small"
                                            onClick={() => handlePresetSelection('24h')}
                                            clickable
                                            sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                                        />
                                        <Chip
                                            label="48h 2-Day Ride"
                                            size="small"
                                            onClick={() => handlePresetSelection('48h')}
                                            clickable
                                            sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                                        />
                                        <Chip
                                            label="3-Day Coastal Tour"
                                            size="small"
                                            onClick={() => handlePresetSelection('weekend')}
                                            clickable
                                            sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                                        />
                                    </Box>

                                    {/* Live Duration and Surcharge Summary Box */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(11, 17, 32, 0.6)' : '#F8FAFC',
                                            border: 1,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                Rental Duration:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 850, color: isDark ? '#38BDF8' : '#0F766E' }}>
                                                {rentalDuration.label}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                Delivery Surcharge:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 850, color: totalLocationFee > 0 ? '#F59E0B' : '#10B981' }}>
                                                {totalLocationFee > 0 ? `+₹${totalLocationFee}` : 'Free'}
                                            </Typography>
                                        </Box>
                                    </Paper>

                                    {/* Primary CTA Button */}
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={scrollToFleet}
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 3,
                                            fontWeight: 850,
                                            fontSize: '0.98rem',
                                            textTransform: 'none',
                                            bgcolor: '#F59E0B',
                                            color: '#0F172A',
                                            '&:hover': { bgcolor: '#D97706' },
                                            boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.4)',
                                        }}
                                    >
                                        Browse Available Bikes ({filteredInventory.length}) ↓
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* REAL-TIME DYNAMIC FLEET CATALOG SECTION */}
            <Box
                id="fleet-catalog"
                component="section"
                sx={{
                    width: '100%',
                    bgcolor: isDark ? '#0B1120' : '#FFFFFF',
                    py: { xs: 6, md: 9 },
                    px: { xs: 2, sm: 3, md: 4 },
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                }}
            >
                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    {/* Catalog Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: { xs: 'flex-start', md: 'flex-end' },
                            justifyContent: 'space-between',
                            gap: 2,
                            mb: 4,
                            pb: 3,
                            borderBottom: 1,
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        }}
                    >
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <DirectionsBikeIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E', fontSize: 24 }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: 'uppercase',
                                        fontWeight: 850,
                                        letterSpacing: '0.08em',
                                        color: isDark ? '#38BDF8' : '#0F766E',
                                    }}
                                >
                                    Real-Time Fleet Availability
                                </Typography>
                            </Box>
                            <Typography
                                variant="h4"
                                component="h2"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: '1.75rem', sm: '2.25rem' },
                                    color: isDark ? '#F8FAFC' : '#0F172A',
                                }}
                            >
                                Available Fleet at {branch.city || branch.name} Hub
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                                Live dynamic tariffs calculated for: <strong>{rentalDuration.label}</strong> (incl. 2 Helmets & Insurance)
                            </Typography>
                        </Box>

                        {/* Search & Sort Controls */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 1.5,
                                width: { xs: '100%', md: 'auto' },
                            }}
                        >
                            {/* Live Model Search */}
                            <TextField
                                size="small"
                                placeholder="Search model or brand..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ minWidth: { xs: '100%', sm: 220 } }}
                            />

                            {/* Sort Dropdown */}
                            <TextField
                                select
                                size="small"
                                label="Sort By"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                sx={{ minWidth: 150 }}
                            >
                                <MenuItem value="recommended">Recommended</MenuItem>
                                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                                <MenuItem value="availability">Most Units Available</MenuItem>
                            </TextField>
                        </Box>
                    </Box>

                    {/* Category Filter Chips Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            const count = categoryCounts[cat] || 0;
                            return (
                                <Chip
                                    key={cat}
                                    label={`${cat === 'all' ? 'All Fleet' : cat} (${count})`}
                                    onClick={() => setSelectedCategory(cat)}
                                    clickable
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        py: 2.2,
                                        px: 1,
                                        borderRadius: 2.5,
                                        bgcolor: isSelected
                                            ? (isDark ? '#38BDF8' : '#0F766E')
                                            : (isDark ? 'rgba(19, 29, 47, 0.6)' : '#F1F5F9'),
                                        color: isSelected
                                            ? (isDark ? '#0F172A' : '#FFFFFF')
                                            : (isDark ? '#CBD5E1' : '#475569'),
                                        border: 1,
                                        borderColor: isSelected
                                            ? (isDark ? '#38BDF8' : '#0F766E')
                                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'),
                                        '&:hover': {
                                            bgcolor: isSelected
                                                ? (isDark ? '#7DD3FC' : '#0D9488')
                                                : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'),
                                        },
                                    }}
                                />
                            );
                        })}

                        {/* Fuel Filter Chips */}
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                icon={<LocalGasStationIcon sx={{ fontSize: '1rem !important' }} />}
                                label="Petrol"
                                size="small"
                                onClick={() => setFuelFilter(fuelFilter === 'Petrol' ? 'all' : 'Petrol')}
                                clickable
                                sx={{
                                    fontWeight: 750,
                                    fontSize: '0.75rem',
                                    bgcolor: fuelFilter === 'Petrol'
                                        ? (isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7')
                                        : 'transparent',
                                    color: fuelFilter === 'Petrol' ? '#F59E0B' : (isDark ? '#94A3B8' : '#64748B'),
                                    border: 1,
                                    borderColor: fuelFilter === 'Petrol' ? '#F59E0B' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1'),
                                }}
                            />
                            <Chip
                                icon={<ElectricBoltIcon sx={{ fontSize: '1rem !important' }} />}
                                label="Electric"
                                size="small"
                                onClick={() => setFuelFilter(fuelFilter === 'Electric' ? 'all' : 'Electric')}
                                clickable
                                sx={{
                                    fontWeight: 750,
                                    fontSize: '0.75rem',
                                    bgcolor: fuelFilter === 'Electric'
                                        ? (isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5')
                                        : 'transparent',
                                    color: fuelFilter === 'Electric' ? '#10B981' : (isDark ? '#94A3B8' : '#64748B'),
                                    border: 1,
                                    borderColor: fuelFilter === 'Electric' ? '#10B981' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1'),
                                }}
                            />
                        </Box>
                    </Box>

                    {/* FLEET VEHICLE CARDS (Grid v2) */}
                    {filteredInventory.length > 0 ? (
                        <Grid container spacing={3.5}>
                            {filteredInventory.map((item) => {
                                const pricing = calculateModelTripTotal(item);
                                const isAvailable = (item.available_now || 0) > 0;

                                return (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                        <Card
                                            elevation={0}
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                boxShadow: isDark
                                                    ? '0 4px 20px rgba(0, 0, 0, 0.35)'
                                                    : '0 4px 20px rgba(15, 118, 110, 0.06)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    transform: 'translateY(-6px)',
                                                    borderColor: isDark ? '#38BDF8' : '#0F766E',
                                                    boxShadow: isDark
                                                        ? '0 20px 40px -8px rgba(0, 0, 0, 0.7)'
                                                        : '0 20px 35px -8px rgba(15, 118, 110, 0.18)',
                                                    '& .bike-card-img': {
                                                        transform: 'scale(1.06)',
                                                    },
                                                },
                                            }}
                                        >
                                            {/* Card Media Container (Showroom Showcase) */}
                                            <Box
                                                onClick={() => setSelectedModelForModal(item)}
                                                sx={{
                                                    position: 'relative',
                                                    height: { xs: 210, sm: 225 },
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    bgcolor: isDark ? '#0B1120' : '#E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderBottom: 1,
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    className="bike-card-img"
                                                    src={item.image_url || getServicePlaceholder('bikes')}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        objectPosition: 'center',
                                                        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    }}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = getServicePlaceholder('bikes');
                                                    }}
                                                />

                                                {/* Subtle gradient vignette to give depth & chip legibility */}
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        background: isDark
                                                            ? 'linear-gradient(180deg, rgba(11, 17, 32, 0.65) 0%, rgba(11, 17, 32, 0) 35%, rgba(11, 17, 32, 0) 65%, rgba(11, 17, 32, 0.6) 100%)'
                                                            : 'linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0) 35%, rgba(15, 23, 42, 0) 65%, rgba(15, 23, 42, 0.2) 100%)',
                                                        pointerEvents: 'none',
                                                    }}
                                                />

                                                {/* Top Left: Category Badge */}
                                                <Chip
                                                    label={item.category_name || 'Scooter'}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 14,
                                                        left: 14,
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                                                        backdropFilter: 'blur(8px)',
                                                        color: isDark ? '#38BDF8' : '#0F766E',
                                                        border: 1,
                                                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 118, 110, 0.25)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                                    }}
                                                />

                                                {/* Top Right: Availability Indicator */}
                                                <Chip
                                                    icon={
                                                        <Box
                                                            sx={{
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: '50%',
                                                                bgcolor: isAvailable ? '#10B981' : '#F59E0B',
                                                                boxShadow: isAvailable ? '0 0 8px #10B981' : 'none',
                                                            }}
                                                        />
                                                    }
                                                    label={isAvailable ? `${item.available_now} Available` : 'Waitlist Only'}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 14,
                                                        right: 14,
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                                                        backdropFilter: 'blur(8px)',
                                                        color: isAvailable ? (isDark ? '#34D399' : '#059669') : '#D97706',
                                                        border: 1,
                                                        borderColor: isAvailable
                                                            ? (isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(5, 150, 105, 0.25)')
                                                            : 'rgba(245, 158, 11, 0.3)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                                    }}
                                                />
                                            </Box>

                                            {/* Card Content */}
                                            <CardContent sx={{ p: 2.75, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <Box>
                                                    {/* Brand & Hub location header */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                textTransform: 'uppercase',
                                                                fontWeight: 850,
                                                                letterSpacing: '0.08em',
                                                                color: isDark ? '#38BDF8' : '#0F766E',
                                                                fontSize: '0.72rem',
                                                            }}
                                                        >
                                                            {item.brand || 'GK Fleet'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                            <LocationOnIcon sx={{ fontSize: '0.85rem', color: isDark ? '#94A3B8' : '#64748B' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.72rem' }}>
                                                                {branch.city || branch.name || 'Honnavar Hub'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Model Name */}
                                                    <Typography
                                                        variant="h5"
                                                        component="h3"
                                                        onClick={() => setSelectedModelForModal(item)}
                                                        sx={{
                                                            fontWeight: 850,
                                                            fontSize: '1.28rem',
                                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                                            letterSpacing: '-0.02em',
                                                            lineHeight: 1.25,
                                                            mb: 1.5,
                                                            cursor: 'pointer',
                                                            transition: 'color 0.2s ease',
                                                            '&:hover': {
                                                                color: isDark ? '#38BDF8' : '#0F766E',
                                                            },
                                                        }}
                                                    >
                                                        {item.name}
                                                    </Typography>

                                                    {/* Key Specs Pills */}
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                px: 1,
                                                                py: 0.4,
                                                                borderRadius: 1.5,
                                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                                                border: 1,
                                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                            }}
                                                        >
                                                            {item.fuel_type === 'Electric' ? (
                                                                <ElectricBoltIcon sx={{ fontSize: '0.92rem', color: '#10B981' }} />
                                                            ) : (
                                                                <LocalGasStationIcon sx={{ fontSize: '0.92rem', color: '#F59E0B' }} />
                                                            )}
                                                            <Typography variant="caption" sx={{ fontWeight: 750, fontSize: '0.72rem', color: isDark ? '#CBD5E1' : '#334155' }}>
                                                                {item.fuel_type || 'Petrol'}
                                                            </Typography>
                                                        </Paper>

                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                px: 1,
                                                                py: 0.4,
                                                                borderRadius: 1.5,
                                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                                                border: 1,
                                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                            }}
                                                        >
                                                            <SpeedIcon sx={{ fontSize: '0.92rem', color: isDark ? '#38BDF8' : '#0284C7' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 750, fontSize: '0.72rem', color: isDark ? '#CBD5E1' : '#334155' }}>
                                                                {item.transmission || 'Automatic'}
                                                            </Typography>
                                                        </Paper>

                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                px: 1,
                                                                py: 0.4,
                                                                borderRadius: 1.5,
                                                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                                                                border: 1,
                                                                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
                                                            }}
                                                        >
                                                            <CheckCircleIcon sx={{ fontSize: '0.92rem', color: '#10B981' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 750, fontSize: '0.72rem', color: isDark ? '#34D399' : '#065F46' }}>
                                                                2 Free Helmets
                                                            </Typography>
                                                        </Paper>
                                                    </Box>
                                                </Box>

                                                {/* Pricing & Booking Area */}
                                                <Box sx={{ pt: 2, borderTop: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }}>
                                                    {/* Daily Tariff and Trip Total Row */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: isDark ? '#94A3B8' : '#64748B',
                                                                        display: 'block',
                                                                        fontWeight: 750,
                                                                        fontSize: '0.72rem',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.04em',
                                                                    }}
                                                                >
                                                                    {pricing.rateTypeLabel}
                                                                </Typography>
                                                                <Chip
                                                                    label={pricing.isPureWeekend ? 'Fri–Sun' : pricing.isPureWeekday ? 'Mon–Thu' : 'Mixed'}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 18,
                                                                        fontSize: '0.62rem',
                                                                        fontWeight: 800,
                                                                        bgcolor: pricing.isWeekendApplied
                                                                            ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7')
                                                                            : (isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE'),
                                                                        color: pricing.isWeekendApplied
                                                                            ? (isDark ? '#F59E0B' : '#B45309')
                                                                            : (isDark ? '#38BDF8' : '#0369A1'),
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
                                                                <Typography
                                                                    variant="h4"
                                                                    component="span"
                                                                    sx={{
                                                                        fontWeight: 900,
                                                                        color: pricing.isWeekendApplied
                                                                            ? '#F59E0B'
                                                                            : (isDark ? '#38BDF8' : '#0F766E'),
                                                                        lineHeight: 1,
                                                                    }}
                                                                >
                                                                    ₹{pricing.dailyRateToDisplay.toLocaleString('en-IN')}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>
                                                                    / day
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Box sx={{ textAlign: 'right' }}>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: isDark ? '#94A3B8' : '#64748B',
                                                                    display: 'block',
                                                                    fontWeight: 750,
                                                                    fontSize: '0.72rem',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.04em',
                                                                }}
                                                            >
                                                                Trip Total ({pricing.days} Day{pricing.days > 1 ? 's' : ''})
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                <Typography
                                                                    variant="h6"
                                                                    component="span"
                                                                    sx={{
                                                                        fontWeight: 900,
                                                                        color: pricing.isWeekendApplied ? '#F59E0B' : (isDark ? '#38BDF8' : '#0F766E'),
                                                                        lineHeight: 1,
                                                                    }}
                                                                >
                                                                    ₹{pricing.totalWithGst.toLocaleString('en-IN')}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: isDark ? '#94A3B8' : '#64748B',
                                                                        fontSize: '0.66rem',
                                                                        fontWeight: 650,
                                                                        mt: 0.2,
                                                                    }}
                                                                >
                                                                    (₹{pricing.total.toLocaleString('en-IN')} + 18% GST)
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>

                                                    {/* Inclusions Micro-Pill */}
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            px: 1.25,
                                                            py: 0.7,
                                                            mb: 2,
                                                            borderRadius: 2,
                                                            bgcolor: isDark ? 'rgba(56, 189, 248, 0.06)' : '#F0FDFA',
                                                            border: 1,
                                                            borderColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#CCFBF1',
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ fontWeight: 750, color: isDark ? '#38BDF8' : '#0F766E', fontSize: '0.72rem' }}>
                                                            ✓ ₹0 Deposit • Free Cancellation
                                                        </Typography>
                                                        {item.weekend_rate && item.weekend_rate > item.weekday_rate && (
                                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.68rem', fontWeight: 600 }}>
                                                                {pricing.isWeekendApplied
                                                                    ? `W/D: ₹${Number(item.weekday_rate).toLocaleString('en-IN')}/d (Mon–Thu)`
                                                                    : `W/E: ₹${Number(item.weekend_rate).toLocaleString('en-IN')}/d (Fri–Sun)`}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {/* Action Buttons: Full-width Primary CTA + Specs Trigger */}
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            onClick={() => handleProceedToCheckout(item)}
                                                            endIcon={<ArrowForwardIcon />}
                                                            sx={{
                                                                py: 1.25,
                                                                borderRadius: 2.5,
                                                                fontWeight: 850,
                                                                fontSize: '0.88rem',
                                                                textTransform: 'none',
                                                                bgcolor: isDark ? '#38BDF8' : '#0F766E',
                                                                color: isDark ? '#0F172A' : '#FFFFFF',
                                                                boxShadow: isDark
                                                                    ? '0 4px 14px 0 rgba(56, 189, 248, 0.35)'
                                                                    : '0 4px 14px 0 rgba(15, 118, 110, 0.3)',
                                                                '&:hover': {
                                                                    bgcolor: isDark ? '#7DD3FC' : '#0D9488',
                                                                    boxShadow: isDark
                                                                        ? '0 6px 20px 0 rgba(56, 189, 248, 0.5)'
                                                                        : '0 6px 20px 0 rgba(15, 118, 110, 0.45)',
                                                                },
                                                            }}
                                                        >
                                                            Book This Bike
                                                        </Button>

                                                        <Button
                                                            fullWidth
                                                            variant="text"
                                                            size="small"
                                                            onClick={() => setSelectedModelForModal(item)}
                                                            startIcon={<InfoOutlinedIcon sx={{ fontSize: '0.95rem !important' }} />}
                                                            sx={{
                                                                py: 0.5,
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: '0.76rem',
                                                                textTransform: 'none',
                                                                color: isDark ? '#94A3B8' : '#64748B',
                                                                '&:hover': {
                                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                                                    color: isDark ? '#F8FAFC' : '#0F172A',
                                                                },
                                                            }}
                                                        >
                                                            View Specs & Gallery
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                textAlign: 'center',
                                borderRadius: 4,
                                bgcolor: isDark ? '#131D2F' : '#F8FAFC',
                                border: 1,
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                maxWidth: 600,
                                mx: 'auto',
                            }}
                        >
                            <TwoWheelerIcon sx={{ fontSize: 48, color: isDark ? '#64748B' : '#94A3B8', mb: 1.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 850, color: isDark ? '#F8FAFC' : '#0F172A', mb: 1 }}>
                                No vehicles match your current search criteria
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3 }}>
                                Try clearing your category filter or connect directly with our local Honnavar desk for live allocation.
                            </Typography>
                            <Button
                                variant="contained"
                                component="a"
                                href={whatsappConciergeUrl}
                                target="_blank"
                                rel="noreferrer"
                                startIcon={<WhatsAppIcon />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    bgcolor: '#10B981',
                                    color: '#FFFFFF',
                                    borderRadius: 3,
                                    px: 3,
                                }}
                            >
                                WhatsApp Floor Manager
                            </Button>
                        </Paper>
                    )}
                </Box>
            </Box>

            {/* HONNAVAR SCENIC RIDES & DISTANCE MATRIX SECTION */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    bgcolor: isDark ? '#0D1527' : '#F8FAFC',
                    py: { xs: 6, md: 9 },
                    px: { xs: 2, sm: 3, md: 4 },
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                }}
            >
                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    <Box sx={{ textAlign: 'center', mb: 5, maxWidth: 750, mx: 'auto' }}>
                        <Typography
                            variant="caption"
                            sx={{
                                textTransform: 'uppercase',
                                fontWeight: 850,
                                letterSpacing: '0.08em',
                                color: isDark ? '#38BDF8' : '#0F766E',
                                display: 'block',
                                mb: 0.5,
                            }}
                        >
                            Coastal Itinerary Guide
                        </Typography>
                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: '1.75rem', sm: '2.3rem' },
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                mb: 1.5,
                            }}
                        >
                            Top Scenic Bike Rides from {branch.city || branch.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                            Cruise the scenic Uttara Kannada coastline with absolute freedom. Here are the top destinations easily accessible on our rental fleet.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {localDestinations.map((dest, idx) => (
                            <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        borderRadius: 3.5,
                                        bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                        border: 1,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'border-color 0.2s ease',
                                        '&:hover': {
                                            borderColor: isDark ? '#38BDF8' : '#0F766E',
                                        },
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Chip
                                                label={dest.tag}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: '0.7rem',
                                                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF',
                                                    color: isDark ? '#38BDF8' : '#1D4ED8',
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                                                {dest.duration}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 850, fontSize: '1.05rem', color: isDark ? '#F8FAFC' : '#0F172A', mb: 1 }}>
                                            {dest.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.6, fontSize: '0.85rem' }}>
                                            {dest.highlight}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 750, color: isDark ? '#CBD5E1' : '#334155' }}>
                                            Distance: <strong>{dest.distance}</strong>
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#38BDF8' : '#0F766E' }}>
                                            NH66 Coastal Highway →
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>

            {/* PICKUP POINTS & INCLUSIONS SECTION */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    bgcolor: isDark ? '#0B1120' : '#FFFFFF',
                    py: { xs: 6, md: 9 },
                    px: { xs: 2, sm: 3, md: 4 },
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                }}
            >
                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    <Grid container spacing={{ xs: 4, lg: 6 }}>
                        {/* Left: Pickup Locations */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: 'uppercase',
                                        fontWeight: 850,
                                        letterSpacing: '0.08em',
                                        color: isDark ? '#38BDF8' : '#0F766E',
                                        display: 'block',
                                    }}
                                >
                                    Convenient Handover Hubs
                                </Typography>
                                <Typography variant="h5" component="h3" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A', mt: 0.5 }}>
                                    Pickup Points in {branch.city || branch.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                                    Select your preferred transit point for express vehicle delivery.
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {pickupPoints.map((point) => {
                                    const deliveryFee = Number(point.delivery_fee || point.pickup_fee || 0);
                                    const returnFee = Number(point.return_fee || 0);

                                    return (
                                        <Paper
                                            key={point.id}
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 3,
                                                bgcolor: isDark ? '#131D2F' : '#F8FAFC',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LocationOnIcon sx={{ color: isDark ? '#38BDF8' : '#0F766E', fontSize: 20 }} />
                                                    <Typography variant="body1" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                        {point.name}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', ml: 3.5, display: 'block', mt: 0.3 }}>
                                                    {point.address_line || point.landmark || branch.address_line || 'Honnavar Main Hub'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Chip
                                                    label={deliveryFee > 0 ? `+₹${deliveryFee} Delivery` : 'Free Hub Handover'}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        bgcolor: deliveryFee > 0
                                                            ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7')
                                                            : (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'),
                                                        color: deliveryFee > 0 ? '#F59E0B' : '#059669',
                                                    }}
                                                />
                                                {returnFee > 0 && (
                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mt: 0.5, fontSize: '0.68rem' }}>
                                                        Return Fee: +₹{returnFee}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        </Grid>

                        {/* Right: Transparent Commitments & Inclusions */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: 'uppercase',
                                        fontWeight: 850,
                                        letterSpacing: '0.08em',
                                        color: isDark ? '#38BDF8' : '#0F766E',
                                        display: 'block',
                                    }}
                                >
                                    Complete Peace of Mind
                                </Typography>
                                <Typography variant="h5" component="h3" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A', mt: 0.5 }}>
                                    What's 100% Included
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5 }}>
                                    No surprise checkout fees or unexpected deductions.
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                {(service.inclusions || [
                                    { title: '2 Clean ISI Helmets', desc: 'Sanitized helmets for rider and pillion included with every rental.' },
                                    { title: 'Comprehensive Insurance', desc: 'Covered under commercial fleet insurance policies.' },
                                    { title: '24/7 Roadside Assistance', desc: 'Instant dispatch across Uttara Kannada coastal highways.' },
                                    { title: 'Zero Hidden Charges', desc: 'Tariffs shown include all local maintenance and service taxes.' },
                                ]).map((inc, i) => (
                                    <Grid key={i} size={{ xs: 12, sm: 6 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 3,
                                                bgcolor: isDark ? '#131D2F' : '#F8FAFC',
                                                border: 1,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                                height: '100%',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                    {inc.title}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5, display: 'block' }}>
                                                {inc.desc}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Rental Safety Rules */}
                            <Paper
                                elevation={0}
                                sx={{
                                    mt: 3,
                                    p: 2.5,
                                    borderRadius: 3,
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                                    border: 1,
                                    borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 850, color: '#F59E0B', mb: 1 }}>
                                    Important Rider Compliance:
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#78350F', display: 'block', lineHeight: 1.6 }}>
                                    • Mandatory helmet wearing for both rider and pillion at all times on NH66.<br />
                                    • Speed limit capped at 60 km/h for your safety on coastal highway bends.<br />
                                    • Zero tolerance for driving under the influence. Please ride responsibly.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* FREQUENTLY ASKED QUESTIONS SECTION */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    bgcolor: isDark ? '#0D1527' : '#F8FAFC',
                    py: { xs: 6, md: 8 },
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                textTransform: 'uppercase',
                                fontWeight: 850,
                                letterSpacing: '0.08em',
                                color: isDark ? '#38BDF8' : '#0F766E',
                                display: 'block',
                                mb: 0.5,
                            }}
                        >
                            Got Questions?
                        </Typography>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                            Frequently Asked Questions
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {faqItems.map((faq, idx) => (
                            <Accordion
                                key={idx}
                                elevation={0}
                                sx={{
                                    borderRadius: '16px !important',
                                    bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                    border: 1,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#CBD5E1' : '#475569' }} />}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                        {faq.q}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 2.5 }}>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.65 }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* QUICK VEHICLE SPECS MODAL (Dialog) */}
            <Dialog
                open={Boolean(selectedModelForModal)}
                onClose={() => setSelectedModelForModal(null)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 4,
                            bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                            backgroundImage: 'none',
                            border: 1,
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                            overflowX: 'hidden',
                        },
                    },
                }}
            >
                {selectedModelForModal && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                            <Box>
                                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: isDark ? '#38BDF8' : '#0F766E' }}>
                                    {selectedModelForModal.brand}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                    {selectedModelForModal.name}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setSelectedModelForModal(null)} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ overflowX: 'hidden' }}>
                            {/* Modal Image */}
                            <Box
                                sx={{
                                    bgcolor: isDark ? '#0B1120' : '#E2E8F0',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 220,
                                    mb: 2.5,
                                    border: 1,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={selectedModelForModal.image_url || getServicePlaceholder('bikes')}
                                    alt={selectedModelForModal.name}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                />
                            </Box>

                            {/* Key Specs Breakdown */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 1, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                Technical Specifications & Perks:
                            </Typography>
                            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                                <Grid size={{ xs: 6 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Fuel Type:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            {selectedModelForModal.fuel_type || 'Petrol'}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Transmission:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            {selectedModelForModal.transmission || 'Automatic'}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Security Deposit:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#10B981' }}>
                                            ₹0 (Digital KYC)
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#1E293B' : '#F1F5F9' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Helmets Included:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            2 ISI Certified
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Estimated Total Breakdown */}
                            {(() => {
                                const pricing = calculateModelTripTotal(selectedModelForModal);
                                return (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0FDFA',
                                            border: 1,
                                            borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#CCFBF1',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                                                Tariff for {pricing.days} Day{pricing.days > 1 ? 's' : ''} ({pricing.rateTypeLabel}):
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                                ₹{pricing.rentalCost.toLocaleString('en-IN')}
                                            </Typography>
                                        </Box>
                                        {pricing.locationFee > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                                                    Delivery / Return Surcharge:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 750, color: '#F59E0B' }}>
                                                    +₹{pricing.locationFee.toLocaleString('en-IN')}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                                                GST (18% Statutory):
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 750, color: isDark ? '#94A3B8' : '#64748B' }}>
                                                +₹{pricing.gstAmount.toLocaleString('en-IN')}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                                                    Final Total (Incl. 18% GST):
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                    ₹{pricing.total.toLocaleString('en-IN')} base + ₹{pricing.gstAmount.toLocaleString('en-IN')} GST
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                                                ₹{pricing.totalWithGst.toLocaleString('en-IN')}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                );
                            })()}
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, pt: 1 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => {
                                    const m = selectedModelForModal;
                                    setSelectedModelForModal(null);
                                    handleProceedToCheckout(m);
                                }}
                                sx={{
                                    py: 1.2,
                                    borderRadius: 2.5,
                                    fontWeight: 850,
                                    bgcolor: isDark ? '#38BDF8' : '#0F766E',
                                    color: isDark ? '#0F172A' : '#FFFFFF',
                                    '&:hover': { bgcolor: isDark ? '#7DD3FC' : '#0D9488' },
                                }}
                            >
                                Proceed to Book {selectedModelForModal.name} →
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* STICKY BOTTOM DOCK (Mobile-Only Experience) */}
            <Box
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    bgcolor: isDark ? 'rgba(19, 29, 47, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderTop: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    py: 1.5,
                    px: 2,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.12)',
                }}
            >
                <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.7rem' }}>
                        Tariffs from <strong style={{ color: isDark ? '#38BDF8' : '#0F766E' }}>₹450/day</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 850, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        {rentalDuration.label}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="small"
                    onClick={scrollToFleet}
                    sx={{
                        py: 1,
                        px: 2.5,
                        borderRadius: 2.5,
                        fontWeight: 850,
                        fontSize: '0.82rem',
                        textTransform: 'none',
                        bgcolor: '#F59E0B',
                        color: '#0F172A',
                        '&:hover': { bgcolor: '#D97706' },
                    }}
                >
                    Select Bike ↓
                </Button>
            </Box>
        </AppLayout>
    );
}

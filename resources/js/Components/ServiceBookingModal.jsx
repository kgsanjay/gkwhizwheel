import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { router, usePage } from '@inertiajs/react';
import AuthModal from './Auth/AuthModal';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
    IconButton,
    Stack,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    InputAdornment,
    FormControlLabel,
    Checkbox,
    RadioGroup,
    Radio,
    Paper,
    Grid,
    Tabs,
    Tab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const SERVICES_LIST = [
    {
        id: 'two_wheelers',
        title: 'Two-Wheeler Rentals',
        shortName: 'Bikes & Scooters',
        icon: <TwoWheelerIcon />,
        color: '#F59E0B',
        desc: 'Honda Activa 6G, Royal Enfield 350, Honda H\'ness CB350, TVS Ntorq',
        category: 'Self-Drive',
        startingRate: 'From ₹350/day',
        defaultItemId: 1,
    },
    {
        id: 'taxi',
        title: 'Taxi & Cab Services',
        shortName: 'Coastal Cabs',
        icon: <LocalTaxiIcon />,
        color: '#0284C7',
        desc: 'Station pickups, local 8hr sightseeing, Jog Falls & Goa transfers',
        category: 'Cabs & Outstation',
        startingRate: 'From ₹12/km',
        defaultItemId: 4,
    },
    {
        id: 'boating',
        title: 'Honnavar Backwater Boating',
        shortName: 'Backwater Boating',
        icon: <DirectionsBoatIcon />,
        color: '#059669',
        desc: 'Explore Sharavathi Mangrove Forests • 1 - 1.5 Hour Scenic Ride',
        category: 'Sharavathi Backwaters',
        startingRate: 'Special Offer ₹1,500',
        defaultItemId: 7,
    },
    {
        id: 'scuba',
        title: 'Netrani Scuba Diving',
        shortName: 'Scuba Diving',
        icon: <ScubaDivingIcon />,
        color: '#4F46E5',
        desc: 'PADI dive master, coral reef dive, island boat ride & 4K GoPro video',
        category: 'Marine Adventure',
        startingRate: 'From ₹2,999/dive',
        defaultItemId: 10,
    },
    {
        id: 'homestay',
        title: 'Coastal Homestays',
        shortName: 'Homestays & Stays',
        icon: <HomeWorkIcon />,
        color: '#E11D48',
        desc: 'Sharavathi riverfront wooden cottages & beachside heritage rooms',
        category: 'Stays & Cottages',
        startingRate: 'From ₹1,500/night',
        defaultItemId: 12,
    },
    {
        id: 'guide',
        title: 'Local Travel Guide',
        shortName: 'Local Guide',
        icon: <ExploreIcon />,
        color: '#D97706',
        desc: 'Hidden seasonal waterfalls, secret forest trails & Mirjan Fort',
        category: 'Guided Trails',
        startingRate: 'From ₹800/trip',
        defaultItemId: 14,
    },
    {
        id: 'tours',
        title: 'Karnataka Tour Packages',
        shortName: 'Custom Full Package',
        icon: <LuggageIcon />,
        color: '#7C3AED',
        desc: 'All-inclusive 2D/1N & 3D/2N vacation bundles or build your custom trip',
        category: 'Vacation Bundles',
        startingRate: 'All-Inclusive',
        defaultItemId: 16,
    },
];

export default function ServiceBookingModal({ open, onClose, initialServiceId = 'boating', availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Normalize initial service id
    const normalizeServiceId = (id) => {
        if (!id) return 'boating';
        if (id === 'tour' || id === 'tours' || id === 'package' || id === 'custom_package') return 'tours';
        if (id === 'bikes' || id === 'bike' || id === 'two-wheelers') return 'two_wheelers';
        return id;
    };

    const [selectedService, setSelectedService] = useState(normalizeServiceId(initialServiceId));
    const { auth } = usePage().props;
    const [currentUser, setCurrentUser] = useState(auth?.user || null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [customerName, setCustomerName] = useState(auth?.user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(auth?.user?.phone || '');
    const [customerEmail, setCustomerEmail] = useState(auth?.user?.email || '');
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');

    useEffect(() => {
        if (auth?.user) {
            setCurrentUser(auth.user);
            if (auth.user.name && !customerName) setCustomerName(auth.user.name);
            if (auth.user.phone && !customerPhone) setCustomerPhone(auth.user.phone);
            if (auth.user.email && !customerEmail) setCustomerEmail(auth.user.email);
        }
    }, [auth?.user]);

    // Service-specific states
    // TAXI
    const [taxiTripType, setTaxiTripType] = useState('local_transfer'); // local_transfer, day_rental, outstation
    const [taxiRoute, setTaxiRoute] = useState('Honnavar Railway Station ➔ Eco Beach');
    const [taxiPickupCustom, setTaxiPickupCustom] = useState('Honnavar Railway Station');
    const [taxiDropCustom, setTaxiDropCustom] = useState('Eco Beach, Honnavar');
    const [taxiVehicle, setTaxiVehicle] = useState('Swift Dzire Sedan (4 Pax)');
    const [taxiPickupDatetime, setTaxiPickupDatetime] = useState(new Date().toISOString().slice(0, 16));

    // BOATING
    const [boatingType, setBoatingType] = useState('honnavar_backwater_boating');
    const [boatingSlot, setBoatingSlot] = useState('04:30 PM - Golden Hour Sunset (Recommended)');
    const [boatingDate, setBoatingDate] = useState(new Date().toISOString().slice(0, 10));
    const [boatingAdults, setBoatingAdults] = useState(2);
    const [boatingChildren, setBoatingChildren] = useState(0);

    // SCUBA
    const [scubaTier, setScubaTier] = useState('discovery_scuba'); // discovery_scuba, island_snorkeling, certified_dive
    const [scubaDate, setScubaDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    const [scubaPax, setScubaPax] = useState(2);
    const [scubaMedicalConfirmed, setScubaMedicalConfirmed] = useState(true);
    const [scubaPickupRequired, setScubaPickupRequired] = useState(false);

    // HOMESTAY
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
    const [stayCheckin, setStayCheckin] = useState(todayStr);
    const [stayCheckout, setStayCheckout] = useState(tomorrowStr);
    const [stayRoomType, setStayRoomType] = useState('riverfront_cottage'); // riverfront_cottage, beachside_room, private_villa
    const [stayGuests, setStayGuests] = useState(2);
    const [stayRooms, setStayRooms] = useState(1);
    const [stayMealPlan, setStayMealPlan] = useState('breakfast_included'); // room_only, breakfast_included, breakfast_dinner

    // GUIDE
    const [guideTrail, setGuideTrail] = useState('hidden_waterfalls'); // hidden_waterfalls, mirjan_heritage, sunset_photo
    const [guideDuration, setGuideDuration] = useState('half_day'); // half_day, full_day
    const [guideDate, setGuideDate] = useState(new Date().toISOString().slice(0, 10));
    const [guideLanguage, setGuideLanguage] = useState('Kannada & English');

    // TWO-WHEELERS (Direct rental shortcut)
    const [bikeCategory, setBikeCategory] = useState('Honda Activa 6G (Automatic)');
    const [bikePickupHub, setBikePickupHub] = useState('Palya Main Rd Hub, Honnavar');
    const [bikeDays, setBikeDays] = useState(2);

    // CUSTOM FULL VACATION PACKAGE PLANNER
    const [pkgDays, setPkgDays] = useState('3 Days / 2 Nights');
    const [pkgIncludeBikes, setPkgIncludeBikes] = useState(true);
    const [pkgBikeType, setPkgBikeType] = useState('Honda Activa 6G (2 Scooters)');
    const [pkgIncludeCab, setPkgIncludeCab] = useState(false);
    const [pkgCabType, setPkgCabType] = useState('Innova Crysta AC (Sightseeing & Transfers)');
    const [pkgIncludeStay, setPkgIncludeStay] = useState(true);
    const [pkgStayType, setPkgStayType] = useState('Sharavathi Riverfront Cottage');
    const [pkgIncludeBoating, setPkgIncludeBoating] = useState(true);
    const [pkgIncludeScuba, setPkgIncludeScuba] = useState(false);
    const [pkgIncludeGuide, setPkgIncludeGuide] = useState(true);
    const [pkgTravelers, setPkgTravelers] = useState(4);

    useEffect(() => {
        if (initialServiceId) {
            setSelectedService(normalizeServiceId(initialServiceId));
        }
    }, [initialServiceId, open]);

    const activeService = useMemo(
        () => SERVICES_LIST.find((s) => s.id === selectedService) || SERVICES_LIST[0],
        [selectedService]
    );

    // Homestay nights calculator
    const homestayNights = useMemo(() => {
        const start = new Date(stayCheckin);
        const end = new Date(stayCheckout);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
    }, [stayCheckin, stayCheckout]);

    // Dynamic Price Estimation per Service
    const estimatedCost = useMemo(() => {
        switch (selectedService) {
            case 'two_wheelers': {
                const daily = bikeCategory.includes('Activa') ? 450 : 1200;
                return daily * bikeDays;
            }
            case 'taxi': {
                if (taxiTripType === 'local_transfer') return taxiVehicle.includes('Innova') ? 600 : 350;
                if (taxiTripType === 'day_rental') return taxiVehicle.includes('Innova') ? 3600 : 2500;
                return taxiVehicle.includes('Innova') ? 4200 : 2800; // outstation
            }
            case 'boating': {
                return 1500;
            }
            case 'scuba': {
                let rate = 3499;
                if (scubaTier === 'island_snorkeling') rate = 1799;
                if (scubaTier === 'certified_dive') rate = 2999;
                return rate * scubaPax + (scubaPickupRequired ? 300 * scubaPax : 0);
            }
            case 'homestay': {
                let perNight = 2200;
                if (stayRoomType === 'beachside_room') perNight = 1500;
                if (stayRoomType === 'private_villa') perNight = 5500;

                let mealAddon = 0;
                if (stayMealPlan === 'breakfast_included') mealAddon = 150 * stayGuests * homestayNights;
                if (stayMealPlan === 'breakfast_dinner') mealAddon = 550 * stayGuests * homestayNights;

                return perNight * stayRooms * homestayNights + mealAddon;
            }
            case 'guide': {
                return guideDuration === 'full_day' ? 1500 : 800;
            }
            case 'tours': {
                let total = 0;
                const days = pkgDays.includes('3') ? 3 : (pkgDays.includes('4') ? 4 : 2);
                const nights = days - 1;

                if (pkgIncludeBikes) total += 500 * (Math.ceil(pkgTravelers / 2)) * days;
                if (pkgIncludeCab) total += (pkgCabType.includes('Innova') ? 3600 : 2500) * days;
                if (pkgIncludeStay) total += (pkgStayType.includes('Villa') ? 5500 : 2200) * (Math.ceil(pkgTravelers / 2)) * nights;
                if (pkgIncludeBoating) total += 600 * pkgTravelers;
                if (pkgIncludeScuba) total += 3499 * pkgTravelers;
                if (pkgIncludeGuide) total += 1500 * (days - 1);

                return Math.max(total, 4999);
            }
            default:
                return 1000;
        }
    }, [
        selectedService,
        bikeCategory,
        bikeDays,
        taxiTripType,
        taxiVehicle,
        boatingType,
        boatingAdults,
        boatingChildren,
        scubaTier,
        scubaPax,
        scubaPickupRequired,
        stayRoomType,
        stayRooms,
        stayGuests,
        stayMealPlan,
        homestayNights,
        guideDuration,
        pkgDays,
        pkgIncludeBikes,
        pkgIncludeCab,
        pkgIncludeStay,
        pkgIncludeBoating,
        pkgIncludeScuba,
        pkgIncludeGuide,
        pkgTravelers,
        pkgCabType,
        pkgStayType,
    ]);

    // Compute active start datetime for live dynamic quote calculation
    const currentStartDatetime = useMemo(() => {
        if (selectedService === 'taxi') return taxiPickupDatetime || new Date().toISOString().slice(0, 16);
        if (selectedService === 'boating') return `${boatingDate}T${boatingSlot.slice(0, 5)}:00`;
        if (selectedService === 'scuba') return `${scubaDate}T06:30:00`;
        if (selectedService === 'homestay') return `${stayCheckin}T12:00:00`;
        if (selectedService === 'guide') return `${guideDate}T09:00:00`;
        return new Date().toISOString().slice(0, 16);
    }, [selectedService, taxiPickupDatetime, boatingDate, boatingSlot, scubaDate, stayCheckin, guideDate]);

    // Live Dynamic Pricing & Surge Quote
    const [dynamicQuote, setDynamicQuote] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(false);

    useEffect(() => {
        if (!open) return;

        let isMounted = true;
        setLoadingQuote(true);

        const timer = setTimeout(async () => {
            try {
                const res = await window.axios.post('/services/quote', {
                    service_type: selectedService,
                    start_datetime: currentStartDatetime,
                    quantity: 1,
                    base_price: estimatedCost,
                });
                if (isMounted && res.data?.quote) {
                    setDynamicQuote(res.data.quote);
                }
            } catch (e) {
                if (isMounted) {
                    setDynamicQuote(null);
                }
            } finally {
                if (isMounted) {
                    setLoadingQuote(false);
                }
            }
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [open, selectedService, currentStartDatetime, estimatedCost]);

    // Build rich formatted notes and payload
    const getBookingPayload = () => {
        let details = {};
        let pickupLoc = 'Palya Main Rd Hub, Honnavar';
        let dropLoc = null;
        let startDt = new Date().toISOString().slice(0, 16);
        let endDt = null;
        let qty = 1;

        if (selectedService === 'two_wheelers') {
            pickupLoc = bikePickupHub;
            startDt = new Date().toISOString().slice(0, 16);
            qty = bikeDays;
            details = { model: bikeCategory, days: bikeDays, hub: bikePickupHub };
        } else if (selectedService === 'taxi') {
            pickupLoc = taxiTripType === 'local_transfer' ? taxiRoute.split('➔')[0].trim() : taxiPickupCustom;
            dropLoc = taxiTripType === 'local_transfer' ? (taxiRoute.split('➔')[1] || '').trim() : taxiDropCustom;
            startDt = taxiPickupDatetime;
            qty = 1;
            details = { tripType: taxiTripType, vehicle: taxiVehicle, route: `${pickupLoc} ➔ ${dropLoc}` };
        } else if (selectedService === 'boating') {
            pickupLoc = 'Honnavar Sharavathi River Jetty';
            startDt = `${boatingDate}T${boatingSlot.slice(0, 5)}:00`;
            qty = 1;
            details = {
                serviceName: 'Honnavar Backwater Boating',
                location: 'Sharavathi Backwaters, Honnavar',
                slot: boatingSlot,
                adults: boatingAdults,
                children: boatingChildren,
                duration: '1 to 1.5 Hour Ride',
                rate: '₹1,500 Flat',
            };
        } else if (selectedService === 'scuba') {
            pickupLoc = scubaPickupRequired ? 'Honnavar Hotel / Station (Transfer Required)' : 'Murudeshwar / Honnavar Dock (Direct Arrival)';
            startDt = `${scubaDate}T06:30:00`;
            qty = scubaPax;
            details = {
                tier: scubaTier,
                pax: scubaPax,
                departure: '06:30 AM Harbor Batch',
                transferIncluded: scubaPickupRequired,
                nonSwimmerMedicalConfirmed: scubaMedicalConfirmed,
            };
        } else if (selectedService === 'homestay') {
            pickupLoc = 'Honnavar (Check-in)';
            startDt = `${stayCheckin}T12:00:00`;
            endDt = `${stayCheckout}T10:00:00`;
            qty = stayRooms;
            details = {
                roomType: stayRoomType,
                checkin: stayCheckin,
                checkout: stayCheckout,
                nights: homestayNights,
                rooms: stayRooms,
                guests: stayGuests,
                mealPlan: stayMealPlan,
            };
        } else if (selectedService === 'guide') {
            pickupLoc = 'Honnavar Local Hub';
            startDt = `${guideDate}T09:00:00`;
            qty = 1;
            details = { trail: guideTrail, duration: guideDuration, language: guideLanguage };
        } else if (selectedService === 'tours') {
            pickupLoc = 'Honnavar Railway Station (All-Inclusive)';
            startDt = new Date().toISOString().slice(0, 16);
            qty = pkgTravelers;
            details = {
                bundleDuration: pkgDays,
                travelers: pkgTravelers,
                includes: {
                    bikes: pkgIncludeBikes ? pkgBikeType : false,
                    cab: pkgIncludeCab ? pkgCabType : false,
                    stay: pkgIncludeStay ? pkgStayType : false,
                    boating: pkgIncludeBoating,
                    scuba: pkgIncludeScuba,
                    guide: pkgIncludeGuide,
                },
            };
        }

        const finalAmount = dynamicQuote ? dynamicQuote.total : estimatedCost;

        const notesSummary = [
            `Service: ${activeService.title}`,
            `Estimate: ₹${finalAmount.toLocaleString('en-IN')}`,
            dynamicQuote?.breakdown?.has_surge && dynamicQuote.breakdown.applied_rule_names?.length
                ? `Dynamic Surge Applied: ${dynamicQuote.breakdown.applied_rule_names.join(', ')}`
                : null,
            `Details: ${JSON.stringify(details)}`,
            specialNotes ? `User Note: ${specialNotes}` : null,
        ].filter(Boolean).join('\n');

        return {
            service_type: selectedService,
            service_item_id: null,
            customer_name: customerName,
            customer_phone: customerPhone.replace(/\D/g, ''),
            customer_email: customerEmail || null,
            start_datetime: startDt,
            end_datetime: endDt,
            pickup_location: pickupLoc,
            drop_location: dropLoc,
            quantity: Math.max(1, qty),
            payment_method: 'pay_on_arrival',
            customer_notes: notesSummary,
            custom_amount: finalAmount,
        };
    };

    // Submit payload to server
    const submitBookingNow = (loggedInUser = null) => {
        setSubmitting(true);
        const payload = getBookingPayload();
        if (loggedInUser) {
            if (loggedInUser.name && !payload.customer_name) payload.customer_name = loggedInUser.name;
            if (loggedInUser.phone && !payload.customer_phone) payload.customer_phone = loggedInUser.phone;
            if (loggedInUser.email && !payload.customer_email) payload.customer_email = loggedInUser.email;
        }

        router.post('/services/book', payload, {
            onError: (errs) => {
                setSubmitting(false);
                const firstErr = Object.values(errs)[0];
                setErrorMessage(firstErr || 'Failed to submit booking. Please verify your inputs.');
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    // Online Booking handler with MANDATORY AUTH GATE
    const handleOnlineBooking = (e) => {
        if (e) e.preventDefault();
        setErrorMessage('');

        if (!customerName.trim()) {
            setErrorMessage('Please enter your full name as lead traveler.');
            return;
        }

        const phoneClean = customerPhone.replace(/\D/g, '');
        if (phoneClean.length !== 10 || !/^[6-9]/.test(phoneClean)) {
            setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9845123456).');
            return;
        }

        // STRICT RULE: Customer must be logged in before booking
        const hasToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const isUserLoggedIn = Boolean(currentUser || auth?.user || hasToken);

        if (!isUserLoggedIn) {
            setAuthModalOpen(true);
            return;
        }

        submitBookingNow();
    };

    const handleAuthSuccess = (user) => {
        setCurrentUser(user);
        setAuthModalOpen(false);
        if (user?.name) setCustomerName(user.name);
        if (user?.phone) setCustomerPhone(user.phone);
        if (user?.email) setCustomerEmail(user.email);
        submitBookingNow(user);
    };

    // WhatsApp Inquiry handler
    const handleWhatsAppSubmit = (e) => {
        if (e) e.preventDefault();

        let detailsString = '';
        if (selectedService === 'taxi') {
            detailsString = `*Trip Type:* ${taxiTripType}\n*Route:* ${taxiRoute}\n*Vehicle:* ${taxiVehicle}\n*Pickup Time:* ${taxiPickupDatetime}`;
        } else if (selectedService === 'boating') {
            detailsString = `*Service:* Honnavar Backwater Boating (Sharavathi Backwaters)\n*Rate:* ₹1,500 Flat (1 to 1.5 Hour Ride)\n*Date:* ${boatingDate}\n*Slot:* ${boatingSlot}\n*Guests:* ${boatingAdults} Adults, ${boatingChildren} Children`;
        } else if (selectedService === 'scuba') {
            detailsString = `*Package:* ${scubaTier}\n*Date:* ${scubaDate} (06:30 AM)\n*Pax:* ${scubaPax} Divers\n*Pickup Transfer:* ${scubaPickupRequired ? 'Yes' : 'Direct dock arrival'}`;
        } else if (selectedService === 'homestay') {
            detailsString = `*Stay:* ${stayRoomType}\n*Check-in:* ${stayCheckin}\n*Check-out:* ${stayCheckout} (${homestayNights} Nights)\n*Guests:* ${stayGuests} Pax (${stayRooms} Rooms)\n*Meal Plan:* ${stayMealPlan}`;
        } else if (selectedService === 'guide') {
            detailsString = `*Trail:* ${guideTrail}\n*Duration:* ${guideDuration}\n*Date:* ${guideDate}\n*Language:* ${guideLanguage}`;
        } else if (selectedService === 'tours') {
            detailsString = `*All-in-One Vacation Plan:* ${pkgDays} for ${pkgTravelers} Pax\n- Two-Wheelers: ${pkgIncludeBikes ? pkgBikeType : 'No'}\n- Private Cab: ${pkgIncludeCab ? pkgCabType : 'No'}\n- Homestay: ${pkgIncludeStay ? pkgStayType : 'No'}\n- Mangrove Boating: ${pkgIncludeBoating ? 'Yes' : 'No'}\n- Netrani Scuba: ${pkgIncludeScuba ? 'Yes' : 'No'}\n- Local Guide: ${pkgIncludeGuide ? 'Yes' : 'No'}`;
        } else {
            detailsString = `*Bike:* ${bikeCategory}\n*Duration:* ${bikeDays} Days\n*Pickup Hub:* ${bikePickupHub}`;
        }

        const finalCost = dynamicQuote ? dynamicQuote.total : estimatedCost;
        const message = `*G.K. WhizWheel - Service Booking / Vacation Request*
---------------------------------------
*Service:* ${activeService.title}
*Customer:* ${customerName || 'Guest'} (${customerPhone || 'Phone pending'})
*Estimated Cost:* ₹${finalCost.toLocaleString('en-IN')}${dynamicQuote?.breakdown?.has_surge ? ' (Surge applied)' : ''}

${detailsString}
${specialNotes ? `\n*Special Notes:* ${specialNotes}` : ''}
---------------------------------------
_Sent via gkwhizwheel.in - Zero Deposit & 24x7 Honnavar Support_`;

        const whatsappUrl = `https://wa.me/918660989586?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        if (onClose) onClose();
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3.5,
                    bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                    backgroundImage: 'none',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                    p: 0,
                    overflow: 'hidden',
                },
            }}
        >
            {/* Modal Header */}
            <DialogTitle
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    pb: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                            size="small"
                            icon={<FlashOnIcon sx={{ fontSize: 13 }} />}
                            label="Instant Booking • Zero Deposit"
                            sx={{
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                color: '#D97706',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                            }}
                        />
                        <Chip
                            size="small"
                            icon={<CheckCircleIcon sx={{ fontSize: 13 }} />}
                            label="Verified Local Operators"
                            sx={{
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
                                color: isDark ? '#34D399' : '#047857',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                            }}
                        />
                    </Box>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            fontWeight: 900,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.25rem', sm: '1.45rem' },
                        }}
                    >
                        {selectedService === 'tours' ? 'Plan All-in-One Vacation Package' : `Book ${activeService.title}`}
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    size="small"
                    sx={{
                        width: 36,
                        height: 36,
                        minWidth: 36,
                        maxWidth: 36,
                        minHeight: 36,
                        maxHeight: 36,
                        p: 0,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#94A3B8' : '#64748B',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        '&:hover': {
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>

            {/* Quick Service Switcher Tabs */}
            <Box
                sx={{
                    px: { xs: 1.5, sm: 2.5 },
                    pt: 1,
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#F8FAFC',
                }}
            >
                <Tabs
                    value={selectedService}
                    onChange={(e, val) => setSelectedService(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 44,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            py: 0.5,
                            px: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            textTransform: 'none',
                            color: isDark ? '#94A3B8' : '#64748B',
                            mr: 0.5,
                            '&.Mui-selected': {
                                color: '#FFFFFF',
                                bgcolor: activeService.color,
                            },
                        },
                        '& .MuiTabs-indicator': { display: 'none' },
                    }}
                >
                    {SERVICES_LIST.map((srv) => (
                        <Tab
                            key={srv.id}
                            value={srv.id}
                            label={srv.shortName}
                            icon={srv.icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            </Box>

            <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: '16px !important' }}>
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleOnlineBooking}>
                    {/* 1. TAXI / CABS CONTEXTUAL FORM */}
                    {selectedService === 'taxi' && (
                        <Stack spacing={2.2}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Select Trip Category
                                </Typography>
                                <RadioGroup
                                    row
                                    value={taxiTripType}
                                    onChange={(e) => setTaxiTripType(e.target.value)}
                                    sx={{ mt: 0.5 }}
                                >
                                    <FormControlLabel value="local_transfer" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Station / Local Transfer</Typography>} />
                                    <FormControlLabel value="day_rental" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>8-Hour Sightseeing</Typography>} />
                                    <FormControlLabel value="outstation" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Outstation / Airport</Typography>} />
                                </RadioGroup>
                            </Box>

                            {taxiTripType === 'local_transfer' ? (
                                <TextField
                                    select
                                    fullWidth
                                    label="Popular Fixed-Fare Route"
                                    value={taxiRoute}
                                    onChange={(e) => setTaxiRoute(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                >
                                    {[
                                        'Honnavar Railway Station ➔ Eco Beach (₹350)',
                                        'Honnavar Railway Station ➔ Sharavathi Jetty (₹300)',
                                        'Honnavar Town ➔ Murudeshwar Temple (₹1,200)',
                                        'Honnavar ➔ Gokarna Om Beach / Kudle (₹1,600)',
                                        'Honnavar ➔ Jog Falls Scenic Day Drop (₹2,500)',
                                        'Honnavar ➔ Goa Airport Mopa / Dabolim (₹3,800)',
                                    ].map((r) => (
                                        <MenuItem key={r} value={r}>{r}</MenuItem>
                                    ))}
                                </TextField>
                            ) : (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Pickup Address / Hotel"
                                            value={taxiPickupCustom}
                                            onChange={(e) => setTaxiPickupCustom(e.target.value)}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Destination / Sightseeing Spots"
                                            value={taxiDropCustom}
                                            onChange={(e) => setTaxiDropCustom(e.target.value)}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Vehicle Class"
                                        value={taxiVehicle}
                                        onChange={(e) => setTaxiVehicle(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="Swift Dzire Sedan (4 Pax)">Swift Dzire AC Sedan (1-4 Pax)</MenuItem>
                                        <MenuItem value="Innova Crysta AC (7 Pax)">Toyota Innova Crysta AC (5-7 Pax)</MenuItem>
                                        <MenuItem value="Ertiga Smart Hybrid (6 Pax)">Maruti Ertiga AC (6 Pax)</MenuItem>
                                        <MenuItem value="Tempo Traveller (12 Pax)">Force Tempo Traveller (12 Pax)</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="datetime-local"
                                        label="Pickup Date & Time"
                                        value={taxiPickupDatetime}
                                        onChange={(e) => setTaxiPickupDatetime(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>
                        </Stack>
                    )}

                    {/* 2. SHARAVATHI BOATING CONTEXTUAL FORM */}
                    {selectedService === 'boating' && (
                        <Stack spacing={2.2}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Boating Service"
                                        value="Honnavar Backwater Boating (Sharavathi Backwaters)"
                                        slotProps={{
                                            input: {
                                                readOnly: true,
                                            },
                                            inputLabel: { shrink: true },
                                        }}
                                        helperText="Sharavathi Mangrove Forests • ₹1,500 Flat (1 to 1.5 Hour Ride)"
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Departure Slot"
                                        value={boatingSlot}
                                        onChange={(e) => setBoatingSlot(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="04:30 PM - Golden Hour Sunset (Recommended)">04:30 PM - Golden Hour Sunset (Recommended)</MenuItem>
                                        <MenuItem value="08:30 AM - Morning Calm & Mangroves">08:30 AM - Morning Calm & Mangroves</MenuItem>
                                        <MenuItem value="10:30 AM - Mangrove Forest Safari">10:30 AM - Mangrove Forest Safari</MenuItem>
                                        <MenuItem value="02:30 PM - Afternoon River Run">02:30 PM - Afternoon River Run</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Cruise Date"
                                        value={boatingDate}
                                        onChange={(e) => setBoatingDate(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Adults"
                                        value={boatingAdults}
                                        onChange={(e) => setBoatingAdults(Math.max(1, parseInt(e.target.value) || 1))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Children"
                                        value={boatingChildren}
                                        onChange={(e) => setBoatingChildren(Math.max(0, parseInt(e.target.value) || 0))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>

                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ECFDF5', border: '1px solid rgba(5, 150, 105, 0.3)' }}>
                                <Typography variant="caption" sx={{ color: isDark ? '#6EE7B7' : '#065F46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                                    Boarding Jetty: Sharavathi Riverfront Boat Point, Honnavar. 100% Certified life jackets for all passengers included.
                                </Typography>
                            </Paper>
                        </Stack>
                    )}

                    {/* 3. SCUBA DIVING CONTEXTUAL FORM */}
                    {selectedService === 'scuba' && (
                        <Stack spacing={2.2}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Diving Package Tier"
                                        value={scubaTier}
                                        onChange={(e) => setScubaTier(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="discovery_scuba">Beginner Discovery Scuba Dive + 4K GoPro Video (₹3,499)</MenuItem>
                                        <MenuItem value="island_snorkeling">Netrani Snorkeling & Speedboat Safari (₹1,799)</MenuItem>
                                        <MenuItem value="certified_dive">Certified Diver Fun Dive (2 Tank Dives) (₹2,999)</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 5 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Dive Date"
                                        value={scubaDate}
                                        onChange={(e) => setScubaDate(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Number of Divers / Persons"
                                        value={scubaPax}
                                        onChange={(e) => setScubaPax(Math.max(1, parseInt(e.target.value) || 1))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(79, 70, 229, 0.12)' : '#EEF2FF', border: '1px solid rgba(79, 70, 229, 0.25)', height: '100%', display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#A5B4FC' : '#3730A3', fontWeight: 700 }}>
                                            ⏰ Departure: Strictly 06:30 AM from Murudeshwar Harbor due to ocean conditions.
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            <Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={scubaPickupRequired}
                                            onChange={(e) => setScubaPickupRequired(e.target.checked)}
                                            size="small"
                                            sx={{ color: '#4F46E5', '&.Mui-checked': { color: '#4F46E5' } }}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            Add Roundtrip Transfer from Honnavar Hotel to Murudeshwar Dock (+₹300/person)
                                        </Typography>
                                    }
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={scubaMedicalConfirmed}
                                            onChange={(e) => setScubaMedicalConfirmed(e.target.checked)}
                                            size="small"
                                            sx={{ color: '#10B981', '&.Mui-checked': { color: '#10B981' } }}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.8rem' }}>
                                            I confirm no major cardiac/respiratory illness. (Swimming skills NOT required for Discovery Dive).
                                        </Typography>
                                    }
                                />
                            </Box>
                        </Stack>
                    )}

                    {/* 4. COASTAL HOMESTAYS CONTEXTUAL FORM */}
                    {selectedService === 'homestay' && (
                        <Stack spacing={2.2}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Check-in Date"
                                        value={stayCheckin}
                                        onChange={(e) => setStayCheckin(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label={`Check-out Date (${homestayNights} Nights)`}
                                        value={stayCheckout}
                                        onChange={(e) => setStayCheckout(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Property & Room Type"
                                        value={stayRoomType}
                                        onChange={(e) => setStayRoomType(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="riverfront_cottage">Sharavathi Riverfront Wooden Cottage (₹2,200/night)</MenuItem>
                                        <MenuItem value="beachside_room">Coastal Beachside AC Room (₹1,500/night)</MenuItem>
                                        <MenuItem value="private_villa">Heritage 3-BHK Family Villa (₹5,500/night)</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Rooms"
                                        value={stayRooms}
                                        onChange={(e) => setStayRooms(Math.max(1, parseInt(e.target.value) || 1))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 3 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Guests"
                                        value={stayGuests}
                                        onChange={(e) => setStayGuests(Math.max(1, parseInt(e.target.value) || 1))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                select
                                fullWidth
                                label="Meal Preference"
                                value={stayMealPlan}
                                onChange={(e) => setStayMealPlan(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                            >
                                <MenuItem value="room_only">Room Only (No Meals)</MenuItem>
                                <MenuItem value="breakfast_included">Complimentary South Indian Breakfast (+₹150/pax/day)</MenuItem>
                                <MenuItem value="breakfast_dinner">Breakfast + Traditional Karavali Seafood Dinner (+₹550/pax/day)</MenuItem>
                            </TextField>
                        </Stack>
                    )}

                    {/* 5. LOCAL TRAVEL GUIDE CONTEXTUAL FORM */}
                    {selectedService === 'guide' && (
                        <Stack spacing={2.2}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Trail / Sightseeing Theme"
                                        value={guideTrail}
                                        onChange={(e) => setGuideTrail(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="hidden_waterfalls">Hidden Seasonal Waterfalls & Forest Treks</MenuItem>
                                        <MenuItem value="mirjan_heritage">Mirjan Fort, Temple Heritage & Coastal Ruins</MenuItem>
                                        <MenuItem value="sunset_photo">Photographer's Golden Hour & Island Boardwalks</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Duration"
                                        value={guideDuration}
                                        onChange={(e) => setGuideDuration(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="half_day">Half Day (4 Hours - ₹800)</MenuItem>
                                        <MenuItem value="full_day">Full Day (8 Hours - ₹1,500)</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Tour Date"
                                        value={guideDate}
                                        onChange={(e) => setGuideDate(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Language Preference"
                                        value={guideLanguage}
                                        onChange={(e) => setGuideLanguage(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="Kannada & English">Kannada & English</MenuItem>
                                        <MenuItem value="Hindi & English">Hindi & English</MenuItem>
                                        <MenuItem value="Kannada Only">Kannada Only</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Stack>
                    )}

                    {/* 6. TWO-WHEELERS FORM */}
                    {selectedService === 'two_wheelers' && (
                        <Stack spacing={2.2}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Two-Wheeler Model"
                                        value={bikeCategory}
                                        onChange={(e) => setBikeCategory(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="Honda Activa 6G (Automatic)">Honda Activa 6G - Gearless (₹450/day)</MenuItem>
                                        <MenuItem value="Suzuki Access 125">Suzuki Access 125 (₹500/day)</MenuItem>
                                        <MenuItem value="Royal Enfield Classic 350">Royal Enfield Classic 350 (₹1,200/day)</MenuItem>
                                        <MenuItem value="Honda H'ness CB350">Honda H'ness CB350 Cruiser (₹1,300/day)</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Rental Days"
                                        value={bikeDays}
                                        onChange={(e) => setBikeDays(Math.max(1, parseInt(e.target.value) || 1))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                select
                                fullWidth
                                label="Pickup Hub"
                                value={bikePickupHub}
                                onChange={(e) => setBikePickupHub(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                            >
                                <MenuItem value="Palya Main Rd Hub, Honnavar">Palya Main Rd Hub, Honnavar</MenuItem>
                                <MenuItem value="Honnavar Railway Station Hub">Honnavar Railway Station Hub (Direct Train Pickup)</MenuItem>
                            </TextField>
                        </Stack>
                    )}

                    {/* 7. ALL-IN-ONE CUSTOM KARAVALI VACATION BUILDER (REQUESTED FEATURE) */}
                    {selectedService === 'tours' && (
                        <Stack spacing={2.2}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(124, 58, 237, 0.12)' : '#F5F3FF', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
                                <Typography variant="subtitle2" sx={{ color: isDark ? '#C4B5FD' : '#6D28D9', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                                    Build Your Custom Karavali Vacation Bundle
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mt: 0.3 }}>
                                    Select the pieces of your trip below. We bundle everything with one bill, transparent pricing, and 24/7 on-ground assistance.
                                </Typography>
                            </Paper>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Vacation Duration"
                                        value={pkgDays}
                                        onChange={(e) => setPkgDays(e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    >
                                        <MenuItem value="2 Days / 1 Night">2 Days / 1 Night (Weekend Escape)</MenuItem>
                                        <MenuItem value="3 Days / 2 Nights">3 Days / 2 Nights (Classic Karavali)</MenuItem>
                                        <MenuItem value="4 Days / 3 Nights">4 Days / 3 Nights (Grand Coastal Circuit)</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Group Size (Total Travelers)"
                                        value={pkgTravelers}
                                        onChange={(e) => setPkgTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Bundle Checkboxes */}
                            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                                    Included Services in Bundle:
                                </Typography>

                                <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={pkgIncludeBikes} onChange={(e) => setPkgIncludeBikes(e.target.checked)} sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>🛵 Self-Drive Bikes / Scooters</Typography>}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={pkgIncludeCab} onChange={(e) => setPkgIncludeCab(e.target.checked)} sx={{ color: '#0284C7', '&.Mui-checked': { color: '#0284C7' } }} />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>🚖 Private AC Cab Transfers</Typography>}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={pkgIncludeStay} onChange={(e) => setPkgIncludeStay(e.target.checked)} sx={{ color: '#E11D48', '&.Mui-checked': { color: '#E11D48' } }} />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>🏡 Riverfront / Beach Cottage Stay</Typography>}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={pkgIncludeBoating} onChange={(e) => setPkgIncludeBoating(e.target.checked)} sx={{ color: '#059669', '&.Mui-checked': { color: '#059669' } }} />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>🚤 Honnavar Backwater Boating (Sharavathi)</Typography>}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={pkgIncludeScuba} onChange={(e) => setPkgIncludeScuba(e.target.checked)} sx={{ color: '#4F46E5', '&.Mui-checked': { color: '#4F46E5' } }} />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>🤿 Netrani Island Scuba Diving</Typography>}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={pkgIncludeGuide} onChange={(e) => setPkgIncludeGuide(e.target.checked)} sx={{ color: '#D97706', '&.Mui-checked': { color: '#D97706' } }} />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>🧭 Local Waterfall & Fort Guide</Typography>}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Stack>
                    )}

                    {/* Shared Lead Traveler Contact Details */}
                    <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

                    <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                        Lead Traveler Contact Details
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                label="Full Name"
                                placeholder="e.g. Ramesh Kumar"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                label="10-Digit WhatsApp / Mobile"
                                placeholder="9845123456"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                slotProps={{ inputLabel: { shrink: true } }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                                }}
                                sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Special Requests / Arrival Details (Optional)"
                                placeholder="e.g. Arriving on Matsyagandha Express at 6:45 AM, need station pickup"
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC' }}
                            />
                        </Grid>
                    </Grid>

                    {/* Price Estimate Strip */}
                    <Box
                        sx={{
                            mt: 2.5,
                            p: 2,
                            borderRadius: 2.5,
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#F8FAFC',
                            border: `1px solid ${activeService.color}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1.5,
                        }}
                    >
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, display: 'block' }}>
                                    Estimated Package Total • Zero Hidden Charges
                                </Typography>
                                {loadingQuote && <CircularProgress size={12} sx={{ color: activeService.color }} />}
                            </Stack>
                            <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap">
                                <Typography variant="h5" sx={{ fontWeight: 900, color: activeService.color }}>
                                    ₹{(dynamicQuote ? dynamicQuote.total : estimatedCost).toLocaleString('en-IN')}{' '}
                                </Typography>
                                {dynamicQuote?.breakdown?.has_surge && dynamicQuote.total !== estimatedCost && (
                                    <Typography variant="body2" sx={{ textDecoration: 'line-through', color: isDark ? '#64748B' : '#94A3B8', fontWeight: 700 }}>
                                        ₹{estimatedCost.toLocaleString('en-IN')}
                                    </Typography>
                                )}
                                <Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                                    (Pay on Arrival / Zero Advance)
                                </Typography>
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            {dynamicQuote?.breakdown?.has_surge && (
                                <Chip
                                    icon={<FlashOnIcon sx={{ fontSize: '14px !important', color: '#F59E0B !important' }} />}
                                    label={dynamicQuote.breakdown.applied_rule_names.join(' • ')}
                                    size="small"
                                    sx={{
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                        color: isDark ? '#FCD34D' : '#B45309',
                                        fontWeight: 800,
                                        fontSize: '0.72rem',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                />
                            )}
                            <Chip
                                icon={<VerifiedUserIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                                label="Pay On Arrival Accepted"
                                sx={{
                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                                    color: isDark ? '#6EE7B7' : '#15803D',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                }}
                            />
                        </Stack>
                    </Box>
                </Box>
            </DialogContent>

            <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

            <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleWhatsAppSubmit}
                    startIcon={<WhatsAppIcon />}
                    sx={{
                        order: { xs: 2, sm: 1 },
                        borderColor: '#25D366',
                        color: '#25D366',
                        fontWeight: 700,
                        py: 1.2,
                        textTransform: 'none',
                        '&:hover': {
                            borderColor: '#1EBE5D',
                            bgcolor: 'rgba(37, 211, 102, 0.08)',
                        },
                    }}
                >
                    Inquire via WhatsApp
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    onClick={handleOnlineBooking}
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <FlashOnIcon />}
                    sx={{
                        order: { xs: 1, sm: 2 },
                        bgcolor: activeService.color,
                        color: '#FFFFFF',
                        fontWeight: 900,
                        py: 1.3,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: `0 4px 14px ${activeService.color}45`,
                        '&:hover': {
                            bgcolor: activeService.color,
                            filter: 'brightness(0.9)',
                        },
                    }}
                >
                    {submitting ? 'Confirming Reservation...' : 'Confirm Reservation (Pay on Arrival)'}
                </Button>
            </DialogActions>
        </Dialog>

        {/* Mandatory Authentication Modal for unauthenticated guests */}
        <AuthModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
        />
        </>
    );
}


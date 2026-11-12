import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useTheme } from '@mui/material/styles';
import { Link, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import PageHead from '../Components/SEO/PageHead';
import blogArticles from '../data/blogArticles.json';
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
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LuggageIcon from '@mui/icons-material/Luggage';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ServiceBookingModal from '../Components/ServiceBookingModal';

const HERO_SLIDES = [
    {
        id: 'bikes',
        badge: '01 • Two-Wheelers',
        shortLabel: 'Bikes & Scooters',
        title: 'Bikes & Scooters on Rent',
        subtitle: 'Browse available bikes from live inventory • No online security deposit',
        image: null,
        href: '/services/bikes',
        cta: 'Browse Live Fleet',
        accent: '#F59E0B',
    },
    {
        id: 'boating',
        badge: '02 • Backwaters',
        shortLabel: 'Backwater Boating',
        title: 'Sharavathi Backwater Boating',
        subtitle: 'Mangrove boardwalk safaris, island cruises & sunset Shikara rides',
        image: '/images/services/honnavar-backwater-boating.webp',
        href: '/services/boating',
        cta: 'Explore Boating',
        accent: '#38BDF8',
    },
    {
        id: 'cabs',
        badge: '03 • Coastal Cabs',
        shortLabel: 'Private AC Cabs',
        title: 'Private AC Cabs & Station Taxis',
        subtitle: 'Punctual railway station pickups, Murudeshwar & Gokarna day tours',
        image: '/images/services/taxi.webp',
        href: '/services/cabs',
        cta: 'Book AC Cab',
        accent: '#0EA5E9',
    },
    {
        id: 'scuba',
        badge: '04 • Water Adventures',
        shortLabel: 'Netrani Scuba',
        title: 'Netrani Island Scuba Diving',
        subtitle: 'PADI certified coral reef dives, GoPro footage & boat transfers',
        image: '/images/services/netrani_scuba_dive.webp',
        href: '/services/scuba',
        cta: 'Dive Netrani',
        accent: '#14B8A6',
    },
    {
        id: 'homestays',
        badge: '05 • Coastal Stays',
        shortLabel: 'Homestays',
        title: 'Riverfront Homestays & Villas',
        subtitle: 'Handpicked Sharavathi cottages & beach rooms with Karavali meals',
        image: '/images/services/homestay.webp',
        href: '/services/homestays',
        cta: 'View Homestays',
        accent: '#10B981',
    },
    {
        id: 'tours',
        badge: '06 • Packages & Guides',
        shortLabel: 'Tours & Guides',
        title: 'Custom Tours & Local Guides',
        subtitle: 'Mirjan Fort, Apsarakonda Falls & Gokarna all-in-one itineraries',
        image: '/images/services/tour.webp',
        href: '/services/tours',
        cta: 'Plan Custom Tour',
        accent: '#A78BFA',
    },
];

const QUICK_BOOK_SERVICES = [
    {
        id: 'two_wheelers',
        tabKey: 'bikes',
        label: 'Bikes & Scooters',
        href: '/services/bikes',
        icon: <TwoWheelerIcon sx={{ fontSize: 18 }} />,
        accent: '#F59E0B',
        note: 'Zero Security Deposit • Reserve online with ₹100 advance',
        usesReturnDate: true,
    },
    {
        id: 'taxi',
        tabKey: 'cabs',
        label: 'Cabs & Taxis',
        href: '/services/cabs',
        icon: <LocalTaxiIcon sx={{ fontSize: 18 }} />,
        accent: '#0284C7',
        note: 'AC Station Pickups, Murudeshwar, Gokarna & Outstation Transfers',
        usesReturnDate: false,
    },
    {
        id: 'homestay',
        tabKey: 'homestays',
        label: 'Homestays',
        href: '/services/homestays',
        icon: <HomeWorkIcon sx={{ fontSize: 18 }} />,
        accent: '#059669',
        note: 'Sharavathi Riverfront Cottages & Beachside Coastal Stays',
        usesReturnDate: true,
    },
    {
        id: 'boating',
        tabKey: 'boating',
        label: 'Boating',
        href: '/services/boating',
        icon: <DirectionsBoatIcon sx={{ fontSize: 18 }} />,
        accent: '#2563EB',
        note: 'Mangrove Backwater Safaris & Sunset Island Cruises in Honnavar',
        usesReturnDate: false,
    },
    {
        id: 'scuba',
        tabKey: 'scuba',
        label: 'Scuba Diving',
        href: '/services/scuba',
        icon: <ScubaDivingIcon sx={{ fontSize: 18 }} />,
        accent: '#0D9488',
        note: 'Netrani Island PADI Guided Dives, Boat Transfer & Underwater Video',
        usesReturnDate: false,
    },
    {
        id: 'guide',
        tabKey: 'guide',
        label: 'Local Guides',
        href: '/services/guide',
        icon: <ExploreIcon sx={{ fontSize: 18 }} />,
        accent: '#D97706',
        note: 'Native Guides for Waterfalls, Mirjan Fort & Coastal Trails',
        usesReturnDate: false,
    },
    {
        id: 'tours',
        tabKey: 'tours',
        label: 'Tour Packages',
        href: '/services/tours',
        icon: <LuggageIcon sx={{ fontSize: 18 }} />,
        accent: '#7C3AED',
        note: 'All-in-One Custom Karavali Bundles (Stay + Ride + Activities)',
        usesReturnDate: true,
    },
];

export default function Welcome({ categories = [], stores = [] , availableItems = [] }) {
    const { data: bikeCatalogResponse } = useQuery({
        queryKey: ['public-bikes-home'],
        queryFn: () => apiClient.get('/bikes'),
        retry: false,
    });
    const { data: publicServicesResponse } = useQuery({
        queryKey: ['public-services-home'],
        queryFn: () => apiClient.get('/services'),
        retry: false,
    });
    const publishedServices = publicServicesResponse?.data ?? availableItems;
    const featuredTour = publishedServices.find((item) => item.service_type === 'tours') || null;
    const featuredTourImage = featuredTour?.primary_image_url || featuredTour?.image_url || null;
    const enhanceHomeService = (source) => {
        const isBike = source.id === 'bikes';
        const serviceType = ({ bikes: 'two_wheelers', cabs: 'taxi', homestays: 'homestay' })[source.id] || source.id;
        const item = publishedServices.find((record) => record.service_type === serviceType);
        const dailyRates = apiBikes.map((bike) => Number(bike.weekday_rate ?? bike.daily_rate))
            .filter((rate) => Number.isFinite(rate) && rate > 0);
        return {
            ...source,
            image: isBike
                ? featuredBikeImage
                : item?.primary_image_url || item?.image_url || null,
            tagline: isBike
                ? `Browse ${apiBikes.length} listed bikes and check live rental dates and rates.`
                : item?.description || 'View published service details and confirm availability before booking.',
            rate: isBike
                ? (dailyRates.length
                    ? `From ₹${Math.min(...dailyRates).toLocaleString('en-IN')} / day`
                    : 'Check Live Rates')
                : item?.price_base != null && Number(item.price_base) > 0
                    ? `From ₹${Number(item.price_base).toLocaleString('en-IN')}${item.price_unit ? ` / ${item.price_unit}` : ''}`
                    : 'Check Published Rates',
            highlights: isBike
                ? [`${apiBikes.length} listed bikes`, 'Select pickup and return branches', 'Review the server-calculated price']
                : Array.isArray(item?.features) && item.features.length
                    ? item.features.slice(0, 3)
                    : ['View published service details', 'Confirm availability before booking'],
            tag: item?.badge || (isBike ? 'Live Bike Inventory' : 'Service Information'),
        };
    };
    const { data: publicReviewResponse } = useQuery({
        queryKey: ['approved-public-bike-reviews'],
        queryFn: () => apiClient.get('/reviews'),
        retry: false,
    });
    const publicReviews = publicReviewResponse?.data || [];
    const reviewMeta = publicReviewResponse?.meta || { total: 0, average_rating: null };
    const apiBikes = bikeCatalogResponse?.data || [];
    const featuredBike = apiBikes.find((bike) => bike.primary_image_url || bike.images?.[0]?.image_url) || null;
    const featuredBikeImage = featuredBike?.primary_image_url || featuredBike?.images?.[0]?.image_url || null;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Quick search form state
    const today = new Date().toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const [searchStore, setSearchStore] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [activeBookingTab, setActiveBookingTab] = useState('two_wheelers');
    const [selectedServiceOption, setSelectedServiceOption] = useState('');
    const [guestCount, setGuestCount] = useState('2 Guests');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(dayAfter);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [serviceModalId, setServiceModalId] = useState('boating');
    const [bookingFlowTab, setBookingFlowTab] = useState('bikes');
    const [reviewFilter, setReviewFilter] = useState('all');
    const [selectedHubIndex, setSelectedHubIndex] = useState(0);
    const [faqCategory, setFaqCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState('faq-docs');
    const [activeGuideTab, setActiveGuideTab] = useState('all');

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [isPaused]);

    const handlePrevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
    };

    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    };

    const currentHeroSlide = HERO_SLIDES[currentSlide % HERO_SLIDES.length];
    const activeSlide = currentHeroSlide.id === 'bikes'
        ? {
            ...currentHeroSlide,
            image: featuredBikeImage,
            subtitle: apiBikes.length > 0
                ? `Browse ${apiBikes.length} listed bike(s) from our live inventory. Choose dates for exact rates.`
                : 'Check the live bike catalog for current availability and pricing.',
        }
        : currentHeroSlide;
    const publishedBranches = stores.filter((s) => s.publication_status === 'published');
    const branchList = (publishedBranches.length > 0 ? publishedBranches : stores)
        .slice()
        .sort((a, b) => a.id - b.id);
    const branchCities = [...new Set(branchList.map((s) => s.city).filter(Boolean))];
    const branchCitiesLabel = branchCities.length ? branchCities.join(' & ') : 'Coastal Karnataka';
    const primaryBranch = branchList[0] || null;
    const getBranchMapUrl = (store) => (
        store?.google_maps_url
        || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            [store?.address_line, store?.city, store?.state, store?.pincode].filter(Boolean).join(', ') || branchCitiesLabel,
        )}`
    );
    const getBranchEmbedUrl = (store) => {
        const lat = Number(store?.latitude);
        const lng = Number(store?.longitude);
        const query = (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0)
            ? `${lat},${lng}`
            : [store?.address_line, store?.city, store?.state, store?.pincode].filter(Boolean).join(', ') || branchCitiesLabel;
        return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
    };
    const getBranchPhone = (store) => store?.phone || '+918660989586';
    const formatBranchPhone = (raw) => {
        const digits = String(raw || '').replace(/\D/g, '');
        return digits.length === 12 && digits.startsWith('91')
            ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
            : raw;
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
        "name": "GK WhizWheel - Travel, Rentals & Coastal Experiences",
        "alternateName": ["GK WhizWheels", "G.K. WhizWheel", "Whizwheels Honnavar"],
        "sameAs": ["https://share.google/GoM4iOgiuUIa7ZfwV"],
        "description": "Travel and rental services across coastal Karnataka, including scooters, motorcycles, cabs, boating, scuba diving, homestays, local guides and tour packages.",
        "image": "https://whizwheels.in/images/logo.png",
        "telephone": "+918660989586",
        "email": "contact@whizwheels.in",
        "url": "https://whizwheels.in/",
        "priceRange": "Contact for current rates",
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
                        "description": "Self-drive scooter and motorcycle rentals with live model availability and deposit-free online booking for exploring the Karnataka coast"
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

    const branchHelplineText = branchList
        .map((s) => `${s.city || s.name} (${formatBranchPhone(getBranchPhone(s))})`)
        .join(' and ');

    const faqItems = [
        {
            id: 'faq-docs',
            category: 'rentals',
            categoryLabel: 'KYC & Docs',
            accent: '#F59E0B',
            icon: VerifiedUserIcon,
            question: 'What documents are required to rent a bike or scooter?',
            answer: 'Bring your original, valid Indian Driving License (two-wheeler) and one government ID proof (Aadhaar Card, Voter ID, or Passport). Digital KYC can be completed online in advance or in 3 minutes at pickup.',
        },
        {
            id: 'faq-deposit',
            category: 'rentals',
            categoryLabel: 'Zero Deposit',
            accent: '#10B981',
            icon: CurrencyRupeeIcon,
            question: 'Is a security deposit required for online bike bookings?',
            answer: 'No refundable security deposit is charged on online bike rental bookings. Confirm your slot with a ₹100 advance or pay online in full, with any remaining rental balance settled at vehicle handover.',
        },
        {
            id: 'faq-payment',
            category: 'rentals',
            categoryLabel: 'PhonePe & UPI',
            accent: '#8B5CF6',
            icon: AccountBalanceWalletIcon,
            question: 'Which payment methods are accepted for bookings?',
            answer: 'We accept PhonePe, Google Pay, Paytm, all UPI apps, Visa, MasterCard, RuPay cards, and Net Banking. You can lock any bike with just ₹100 advance or pay in full online. For travel services (cabs, scuba, boating, stays), pay via PhonePe/UPI or pay on arrival per service policy.',
        },
        {
            id: 'faq-account',
            category: 'services',
            categoryLabel: 'Zero Friction',
            accent: '#10B981',
            icon: VerifiedUserIcon,
            question: 'Do I need to create an account or remember a password to book?',
            answer: 'No password required! Book instantly using Google 1-Tap login or by entering your WhatsApp phone number. Our system auto-provisions your verified account in the background and sends your confirmed voucher with QR code straight to your WhatsApp.',
        },
        {
            id: 'faq-cancel',
            category: 'rentals',
            categoryLabel: 'Cancellation',
            accent: '#0EA5E9',
            icon: AccessTimeIcon,
            question: 'What is your cancellation and rescheduling policy?',
            answer: 'Cancel up to 12 hours before your scheduled pickup for a full refund. Rescheduling dates or shifting pickup timings is free of charge, subject to fleet and slot availability.',
        },
        {
            id: 'faq-roadside',
            category: 'rentals',
            categoryLabel: '24/7 Support',
            accent: '#8B5CF6',
            icon: BuildCircleIcon,
            question: 'What happens if a bike breaks down or gets a flat tire?',
            answer: 'Every vehicle completes a pre-ride mechanical check before handover. In case of a puncture or breakdown along the coastal circuit, our 24/7 mobile roadside team arranges on-site repair or an immediate replacement.',
        },
        {
            id: 'faq-branches',
            category: 'services',
            categoryLabel: '24/7 Branches',
            accent: '#F59E0B',
            icon: LocationOnIcon,
            question: `Where are your ${branchCitiesLabel} branches located, and are you open 24/7?`,
            answer: `We operate 24/7 across ${branchHelplineText || branchCitiesLabel}. Pick up directly at our Honnavar or Murudeshwar hubs, request railway station or bus stand handovers, and select cross-branch returns while booking.`,
        },
        {
            id: 'faq-services',
            category: 'services',
            categoryLabel: 'All 7 Services',
            accent: '#0284C7',
            icon: ExploreIcon,
            question: 'Can I book AC cabs, boating, Netrani scuba, homestays, or tours here?',
            answer: 'Yes. Use the Quick Search & Booking Hub above or contact our 24/7 desk to combine two-wheeler rentals, private AC cabs, Sharavathi backwater boating, Netrani Island scuba diving, riverfront homestays, local guides, and custom tours.',
        },
    ];

    const welcomeFaqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <AppLayout>
            <PageHead
                title="GK WhizWheel | Bike Rentals, Cabs, Boating, Stays & Tours"
                description="Explore coastal Karnataka with GK WhizWheel: bike rentals, cabs, backwater boating, scuba diving, homestays, guides and customizable tour packages."
                canonicalUrl="https://whizwheels.in/"
                ogImage="/images/logo.png"
                ogType="website"
                structuredData={[structuredData, welcomeFaqSchema]}
            />

            {/* =========================================================================
                1. MASTER HERO SECTION (COASTAL KARNATAKA TRAVEL & MOBILITY HUB)
            ========================================================================== */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    position: 'relative',
                    pt: { xs: 4, sm: 5.5, md: 7 },
                    pb: { xs: 6.5, sm: 8, md: 10 },
                    mb: 0,
                    background: isDark
                        ? 'radial-gradient(125% 115% at 88% 12%, #132238 0%, #09101D 58%, #050912 100%)'
                        : 'linear-gradient(135deg, #FFFDF7 0%, #F8FAFC 52%, #E0F2FE 100%)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? '0 24px 48px -12px rgba(0, 0, 0, 0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
                    overflow: 'hidden',
                }}
            >
                        {/* Ambient Coastal Glows */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -140,
                                right: -120,
                                width: 560,
                                height: 560,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0) 70%)',
                                pointerEvents: 'none',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: -160,
                                left: -120,
                                width: 520,
                                height: 520,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.14) 0%, rgba(14, 165, 233, 0) 70%)',
                                pointerEvents: 'none',
                            }}
                        />

                        <Box sx={{ maxWidth: '1440px', mx: 'auto', width: '100%', px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={{ xs: 3.5, md: 5 }} alignItems="center">
                                {/* Left Hero Column — Brand Promise, Multi-Service Positioning & Action Controls */}
                                <Grid size={{ xs: 12, lg: 6.5 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 2.25 }}>
                                        <Chip
                                            icon={<AccessTimeIcon sx={{ color: isDark ? '#34D399 !important' : '#059669 !important', fontSize: 15 }} />}
                                            label={`Open 24/7 • ${branchCitiesLabel}`}
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
                                                color: isDark ? '#34D399' : '#047857',
                                                fontWeight: 700,
                                                fontSize: { xs: '0.72rem', sm: '0.78rem' },
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                height: 30,
                                            }}
                                        />
                                        <Box
                                            component="a"
                                            href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                            target="_blank"
                                            rel="noreferrer"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.6,
                                                px: 1.4,
                                                height: 30,
                                                borderRadius: 9999,
                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                                                border: '1px solid rgba(245, 158, 11, 0.32)',
                                                color: isDark ? '#FBBF24' : '#B45309',
                                                textDecoration: 'none',
                                                fontSize: { xs: '0.72rem', sm: '0.78rem' },
                                                fontWeight: 800,
                                                '&:hover': { filter: 'brightness(0.96)' },
                                            }}
                                        >
                                            <StarIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                                            5.0 Google Rated (324+)
                                        </Box>
                                    </Stack>

                                    <Typography
                                        variant="h1"
                                        component="h1"
                                        sx={{
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            fontSize: { xs: '2.15rem', sm: '2.9rem', md: '3.45rem' },
                                            fontWeight: 950,
                                            lineHeight: 1.12,
                                            letterSpacing: '-0.03em',
                                            mb: 2,
                                        }}
                                    >
                                        Explore Coastal Karnataka{' '}
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'block',
                                                background: 'linear-gradient(90deg, #F59E0B 0%, #FB923C 32%, #0284C7 72%, #10B981 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}
                                        >
                                            Rides, Stays &amp; Experiences.
                                        </Box>
                                    </Typography>

                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#334155',
                                            fontSize: { xs: '0.96rem', md: '1.08rem' },
                                            lineHeight: 1.7,
                                            mb: 3,
                                            maxWidth: 640,
                                        }}
                                    >
                                        One trusted local platform for <strong>two-wheeler rentals</strong>, <strong>private AC cabs</strong>, <strong>Sharavathi backwater boating</strong>, <strong>riverfront homestays</strong>, <strong>Netrani scuba diving</strong>, <strong>trail guides</strong>, and <strong>custom tours</strong> — with transparent pricing and zero hidden fees.
                                    </Typography>

                                    {/* Quick Service Pill Selector — syncs live with the showcase stage */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.9, mb: 3.25 }}>
                                        {HERO_SLIDES.map((slide, idx) => {
                                            const isSelected = currentSlide % HERO_SLIDES.length === idx;
                                            return (
                                                <Chip
                                                    key={slide.id}
                                                    label={slide.shortLabel}
                                                    size="small"
                                                    clickable
                                                    onClick={() => {
                                                        setCurrentSlide(idx);
                                                        setIsPaused(true);
                                                    }}
                                                    sx={{
                                                        fontWeight: isSelected ? 800 : 600,
                                                        fontSize: '0.76rem',
                                                        height: 30,
                                                        bgcolor: isSelected
                                                            ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#0F172A')
                                                            : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF'),
                                                        color: isSelected
                                                            ? (isDark ? '#FBBF24' : '#FFFFFF')
                                                            : (isDark ? '#CBD5E1' : '#334155'),
                                                        border: isSelected
                                                            ? `1px solid ${isDark ? '#F59E0B' : '#0F172A'}`
                                                            : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'),
                                                        '&:hover': {
                                                            borderColor: '#F59E0B',
                                                        },
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>

                                    {/* Hero Primary Action Buttons */}
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3.5 }}>
                                        <Button
                                            variant="contained"
                                            component="a"
                                            href="#service-offerings"
                                            size="large"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                bgcolor: '#F59E0B',
                                                color: '#0F172A',
                                                fontWeight: 800,
                                                py: 1.4,
                                                px: 3.2,
                                                borderRadius: 2.5,
                                                fontSize: '0.96rem',
                                                boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.42)',
                                                '&:hover': { bgcolor: '#D97706' },
                                            }}
                                        >
                                            Explore All 7 Services
                                        </Button>
                                        <Button
                                            variant="contained"
                                            component={Link}
                                            href="/services/bikes"
                                            size="large"
                                            startIcon={<TwoWheelerIcon />}
                                            sx={{
                                                bgcolor: isDark ? '#1E293B' : '#0F172A',
                                                color: '#FFFFFF',
                                                fontWeight: 700,
                                                py: 1.4,
                                                px: 3,
                                                borderRadius: 2.5,
                                                fontSize: '0.96rem',
                                                border: isDark ? '1px solid rgba(255,255,255,0.14)' : 'none',
                                                '&:hover': { bgcolor: isDark ? '#334155' : '#1E293B' },
                                            }}
                                        >
                                            Rent a Bike
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleOpenServiceModal(activeSlide.id === 'bikes' ? 'tours' : activeSlide.id)}
                                            size="large"
                                            startIcon={<ExploreIcon />}
                                            sx={{
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#CBD5E1',
                                                color: isDark ? '#F8FAFC' : '#0F172A',
                                                fontWeight: 700,
                                                py: 1.4,
                                                px: 2.6,
                                                borderRadius: 2.5,
                                                fontSize: '0.94rem',
                                                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                            }}
                                        >
                                            Quick Enquiry
                                        </Button>
                                    </Stack>

                                    {/* Compact Coastal Key Facts Bar */}
                                    <Grid container spacing={1.5}>
                                        {[
                                            { label: 'Zero Security Deposit', sub: 'Book bikes with ₹100 advance', color: '#10B981' },
                                            { label: '7 Travel Services', sub: 'Bikes, Cabs, Stays, Water & Tours', color: '#F59E0B' },
                                            { label: '24/7 Local Desk', sub: 'Call or WhatsApp +91 8660989586', color: '#38BDF8' },
                                        ].map((item, i) => (
                                            <Grid key={i} size={{ xs: 12, sm: 4 }}>
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2.5,
                                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.85)',
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.35 }}>
                                                        <CheckCircleIcon sx={{ color: item.color, fontSize: 16 }} />
                                                        <Typography variant="subtitle2" sx={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 800, fontSize: '0.82rem' }}>
                                                            {item.label}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#475569', fontSize: '0.73rem', display: 'block' }}>
                                                        {item.sub}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>

                                {/* Right Hero Column — Interactive Coastal Experience Showcase + Direct Contact Dock */}
                                <Grid size={{ xs: 12, lg: 5.5 }}>
                                    <Paper
                                        elevation={0}
                                        onMouseEnter={() => setIsPaused(true)}
                                        onMouseLeave={() => setIsPaused(false)}
                                        sx={{
                                            p: { xs: 1.5, sm: 2 },
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
                                            backdropFilter: 'blur(16px)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                                            boxShadow: isDark
                                                ? '0 24px 48px -15px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                                                : '0 24px 48px -15px rgba(15, 23, 42, 0.12)',
                                            borderRadius: 4,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1.5,
                                        }}
                                    >
                                        {/* Interactive Photo Stage */}
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                                height: { xs: 280, sm: 330, md: 360 },
                                                bgcolor: '#0F172A',
                                            }}
                                        >
                                            {activeSlide.image ? (
                                                <Box component="img" key={activeSlide.image} src={activeSlide.image}
                                                    alt={`${activeSlide.title} — GK WhizWheel`}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
                                                />
                                            ) : (
                                                <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                                    <TwoWheelerIcon sx={{ fontSize: 110, color: '#94A3B8' }} aria-hidden="true" />
                                                </Box>
                                            )}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(180deg, rgba(6, 11, 22, 0.25) 0%, rgba(6, 11, 22, 0.15) 40%, rgba(6, 11, 22, 0.92) 100%)',
                                                }}
                                            />

                                            {/* Top Bar inside Photo Stage */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 14,
                                                    left: 14,
                                                    right: 14,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 1,
                                                }}
                                            >
                                                <Chip
                                                    size="small"
                                                    label={activeSlide.badge}
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                        backdropFilter: 'blur(8px)',
                                                        color: '#FFFFFF',
                                                        border: `1px solid ${activeSlide.accent}`,
                                                        fontWeight: 800,
                                                        fontSize: '0.73rem',
                                                    }}
                                                />
                                                <Stack direction="row" spacing={0.75}>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Previous featured service"
                                                        onClick={handlePrevSlide}
                                                        sx={{
                                                            bgcolor: 'rgba(15, 23, 42, 0.7)',
                                                            color: '#FFFFFF',
                                                            backdropFilter: 'blur(8px)',
                                                            border: '1px solid rgba(255,255,255,0.18)',
                                                            '&:hover': { bgcolor: '#F59E0B', color: '#0F172A' },
                                                        }}
                                                    >
                                                        <ChevronLeftIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Next featured service"
                                                        onClick={handleNextSlide}
                                                        sx={{
                                                            bgcolor: 'rgba(15, 23, 42, 0.7)',
                                                            color: '#FFFFFF',
                                                            backdropFilter: 'blur(8px)',
                                                            border: '1px solid rgba(255,255,255,0.18)',
                                                            '&:hover': { bgcolor: '#F59E0B', color: '#0F172A' },
                                                        }}
                                                    >
                                                        <ChevronRightIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </Box>

                                            {/* Bottom Caption & Direct Service Link inside Photo Stage */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    p: { xs: 2, sm: 2.5 },
                                                    display: 'flex',
                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                    alignItems: { xs: 'flex-start', sm: 'flex-end' },
                                                    justifyContent: 'space-between',
                                                    gap: 1.5,
                                                }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.2, mb: 0.4 }}>
                                                        {activeSlide.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.8rem', display: 'block', lineHeight: 1.4 }}>
                                                        {activeSlide.subtitle}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    component={Link}
                                                    href={activeSlide.href}
                                                    size="small"
                                                    variant="contained"
                                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                                    sx={{
                                                        bgcolor: '#F59E0B',
                                                        color: '#0F172A',
                                                        fontWeight: 800,
                                                        fontSize: '0.78rem',
                                                        px: 1.8,
                                                        py: 0.75,
                                                        borderRadius: 2,
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        '&:hover': { bgcolor: '#FBBF24' },
                                                    }}
                                                >
                                                    {activeSlide.cta}
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Compact Contact & Directions Dock */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1.25,
                                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#F8FAFC',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                px: 1.75,
                                                py: 1.35,
                                                borderRadius: 2.5,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
                                                <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18, flexShrink: 0 }} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: 700, fontSize: '0.77rem', display: 'block' }}>
                                                        {branchList.length > 0
                                                            ? `${branchList.length} Active ${branchList.length === 1 ? 'Branch' : 'Branches'}: ${branchCitiesLabel}`
                                                            : branchCitiesLabel}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.72rem', display: 'block' }}>
                                                        24/7 Helpline: +91 8660989586
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                                                <Button
                                                    component="a"
                                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20enquire%20about%20your%20coastal%20travel%20services."
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    size="small"
                                                    startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                                                    sx={{
                                                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                                                        color: isDark ? '#34D399' : '#047857',
                                                        border: '1px solid rgba(16, 185, 129, 0.35)',
                                                        fontWeight: 800,
                                                        fontSize: '0.74rem',
                                                        px: 1.25,
                                                        py: 0.45,
                                                        borderRadius: 1.5,
                                                    }}
                                                >
                                                    WhatsApp
                                                </Button>
                                                <Box
                                                    component="a"
                                                    href={getBranchMapUrl(primaryBranch)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.3,
                                                        color: isDark ? '#38BDF8' : '#0284C7',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        textDecoration: 'none',
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    <DirectionsIcon sx={{ fontSize: 14 }} /> Map ↗
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

            {/* =========================================================================
                1.5 ALL-IN-ONE SEARCH & INSTANT BOOKING HUB (Directly Bridging Hero)
            ========================================================================== */}
            {(() => {
                const activeServiceTab = QUICK_BOOK_SERVICES.find((s) => s.id === activeBookingTab) || QUICK_BOOK_SERVICES[0];
                const isBikeTab = activeServiceTab.id === 'two_wheelers';
                const tabItems = publishedServices.filter((item) => item.service_type === activeServiceTab.id);

                const handleUnifiedSubmit = (e) => {
                    e.preventDefault();
                    if (isBikeTab) {
                        handleSearch(e);
                        return;
                    }
                    handleOpenServiceModal(activeServiceTab.id);
                };

                return (
                    <Box
                        id="quick-search"
                        component="section"
                        aria-label="All-in-One Search and Booking Hub"
                        sx={{
                            maxWidth: '1440px',
                            width: '100%',
                            mx: 'auto',
                            px: { xs: 2, sm: 3, md: 4 },
                            mt: { xs: -3.5, md: -5 },
                            mb: { xs: 5, md: 7.5 },
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#FFFFFF',
                                backdropFilter: 'blur(16px)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #CBD5E1',
                                boxShadow: isDark
                                    ? '0 24px 48px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                                    : '0 22px 48px -14px rgba(15, 23, 42, 0.14)',
                            }}
                        >
                            {/* Top Coastal Accent Bar */}
                            <Box
                                sx={{
                                    height: 4,
                                    width: '100%',
                                    background: 'linear-gradient(90deg, #F59E0B 0%, #FB923C 32%, #0284C7 68%, #10B981 100%)',
                                }}
                            />

                            {/* Row 1: All 7 Services Selector Tabs */}
                            <Box
                                sx={{
                                    px: { xs: 1.5, sm: 2.5, md: 3 },
                                    py: 1.4,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    bgcolor: isDark ? 'rgba(7, 13, 25, 0.55)' : '#F8FAFC',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    role="tablist"
                                    aria-label="Choose a service to search or book"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.85,
                                        overflowX: 'auto',
                                        WebkitOverflowScrolling: 'touch',
                                        scrollbarWidth: 'none',
                                        '&::-webkit-scrollbar': { display: 'none' },
                                        flex: 1,
                                    }}
                                >
                                    {QUICK_BOOK_SERVICES.map((svc) => {
                                        const active = activeServiceTab.id === svc.id;
                                        return (
                                            <Button
                                                key={svc.id}
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() => {
                                                    setActiveBookingTab(svc.id);
                                                    setSelectedServiceOption('');
                                                }}
                                                startIcon={svc.icon}
                                                size="small"
                                                sx={{
                                                    flexShrink: 0,
                                                    whiteSpace: 'nowrap',
                                                    borderRadius: 9999,
                                                    px: 1.6,
                                                    py: 0.75,
                                                    fontSize: '0.8rem',
                                                    fontWeight: active ? 800 : 600,
                                                    textTransform: 'none',
                                                    bgcolor: active
                                                        ? (isDark ? 'rgba(245, 158, 11, 0.18)' : '#0F172A')
                                                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF'),
                                                    color: active
                                                        ? (isDark ? '#FBBF24' : '#FFFFFF')
                                                        : (isDark ? '#CBD5E1' : '#334155'),
                                                    border: active
                                                        ? `1px solid ${isDark ? '#F59E0B' : '#0F172A'}`
                                                        : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'),
                                                    '& .MuiButton-startIcon': {
                                                        color: active ? (isDark ? '#FBBF24' : '#F59E0B') : svc.accent,
                                                        mr: 0.75,
                                                    },
                                                    '&:hover': {
                                                        borderColor: '#F59E0B',
                                                        bgcolor: active
                                                            ? (isDark ? 'rgba(245, 158, 11, 0.24)' : '#1E293B')
                                                            : (isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB'),
                                                    },
                                                }}
                                            >
                                                {svc.label}
                                            </Button>
                                        );
                                    })}
                                </Box>

                                <Chip
                                    icon={<StarIcon sx={{ fontSize: '15px !important', color: '#F59E0B !important' }} />}
                                    label="5.0 ★ (324+)"
                                    size="small"
                                    component="a"
                                    href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                    target="_blank"
                                    rel="noreferrer"
                                    clickable
                                    sx={{
                                        display: { xs: 'none', xl: 'inline-flex' },
                                        flexShrink: 0,
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                                        color: isDark ? '#FBBF24' : '#B45309',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                />
                            </Box>

                            {/* Row 2: Dynamic All-in-One Search & Book Form */}
                            <Box
                                component="form"
                                onSubmit={handleUnifiedSubmit}
                                sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}
                            >
                                <Grid container spacing={1.75} alignItems="center">
                                    {/* Field 1: Branch / Pickup Hub */}
                                    <Grid size={{ xs: 12, sm: 6, lg: 2.75 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label={isBikeTab ? 'Pickup Branch' : 'Location / Hub'}
                                            value={searchStore}
                                            onChange={(e) => setSearchStore(e.target.value)}
                                        >
                                            <MenuItem value="">All Branches ({branchCitiesLabel})</MenuItem>
                                            {branchList.map((store) => (
                                                <MenuItem key={store.id} value={store.id}>
                                                    {store.public_name || store.name}{store.city ? ` · ${store.city}` : ''}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    {/* Field 2: Vehicle Category (Bikes) OR Package / Option (Other Services) */}
                                    <Grid size={{ xs: 12, sm: 6, lg: 2.75 }}>
                                        {isBikeTab ? (
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Scooter / Bike Type"
                                                value={searchCategory}
                                                onChange={(e) => setSearchCategory(e.target.value)}
                                            >
                                                <MenuItem value="">All Scooters &amp; Bikes</MenuItem>
                                                {categories.map((cat) => (
                                                    <MenuItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        ) : (
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label={`${activeServiceTab.label} Option`}
                                                value={selectedServiceOption}
                                                onChange={(e) => setSelectedServiceOption(e.target.value)}
                                            >
                                                <MenuItem value="">All {activeServiceTab.label} Options</MenuItem>
                                                {tabItems.map((item) => (
                                                    <MenuItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    </Grid>

                                    {/* Field 3: Start / Trip Date */}
                                    <Grid size={{ xs: 6, lg: 2 }}>
                                        <TextField
                                            type="date"
                                            fullWidth
                                            size="small"
                                            label={isBikeTab ? 'Pickup Date' : (activeServiceTab.id === 'homestay' ? 'Check-In' : 'Preferred Date')}
                                            value={startDate}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setStartDate(next);
                                                if (endDate && next > endDate) {
                                                    setEndDate(next);
                                                }
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: today }}
                                        />
                                    </Grid>

                                    {/* Field 4: Return Date (Bikes/Stays/Tours) OR Group Size (Day Experiences) */}
                                    <Grid size={{ xs: 6, lg: 2 }}>
                                        {activeServiceTab.usesReturnDate ? (
                                            <TextField
                                                type="date"
                                                fullWidth
                                                size="small"
                                                label={activeServiceTab.id === 'homestay' ? 'Check-Out' : 'Return Date'}
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: startDate || today }}
                                            />
                                        ) : (
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Travelers"
                                                value={guestCount}
                                                onChange={(e) => setGuestCount(e.target.value)}
                                            >
                                                {['1 Guest', '2 Guests', '3–4 Guests', '5–8 Group', '9+ Group'].map((opt) => (
                                                    <MenuItem key={opt} value={opt}>
                                                        {opt}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    </Grid>

                                    {/* Field 5: Submit / Action CTAs */}
                                    <Grid size={{ xs: 12, lg: 2.5 }}>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                type="submit"
                                                fullWidth
                                                variant="contained"
                                                startIcon={isBikeTab ? <SearchIcon /> : <CalendarMonthIcon />}
                                                sx={{
                                                    py: 1.05,
                                                    px: 2,
                                                    fontWeight: 800,
                                                    fontSize: '0.88rem',
                                                    borderRadius: 2,
                                                    bgcolor: '#F59E0B',
                                                    color: '#0F172A',
                                                    boxShadow: '0 6px 18px -4px rgba(245, 158, 11, 0.45)',
                                                    whiteSpace: 'nowrap',
                                                    '&:hover': { bgcolor: '#D97706' },
                                                }}
                                            >
                                                {isBikeTab ? 'Search Bikes' : 'Book Now'}
                                            </Button>
                                            {!isBikeTab && (
                                                <Button
                                                    component={Link}
                                                    href={activeServiceTab.href}
                                                    variant="outlined"
                                                    sx={{
                                                        py: 1.05,
                                                        px: 1.6,
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        borderRadius: 2,
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        borderColor: isDark ? 'rgba(255,255,255,0.22)' : '#CBD5E1',
                                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                                        '&:hover': { borderColor: '#F59E0B' },
                                                    }}
                                                >
                                                    Explore
                                                </Button>
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Row 3: Compact Dynamic Highlight & Direct Desk Strip */}
                            <Box
                                sx={{
                                    px: { xs: 2, sm: 3 },
                                    py: 1.15,
                                    bgcolor: isDark ? 'rgba(7, 13, 25, 0.65)' : '#F8FAFC',
                                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1.25,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
                                    <VerifiedUserIcon sx={{ fontSize: 16, color: '#10B981', flexShrink: 0 }} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#334155',
                                            fontWeight: 600,
                                            fontSize: { xs: '0.73rem', sm: '0.78rem' },
                                        }}
                                    >
                                        {activeServiceTab.note}
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={1.75} alignItems="center" sx={{ flexShrink: 0 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: isDark ? '#34D399' : '#047857',
                                            fontWeight: 800,
                                            fontSize: '0.74rem',
                                        }}
                                    >
                                        ● Open 24/7
                                    </Typography>
                                    <Box
                                        component="a"
                                        href="tel:+918660989586"
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.45,
                                            color: isDark ? '#FBBF24' : '#B45309',
                                            fontSize: '0.76rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        <PhoneIcon sx={{ fontSize: 13.5 }} />
                                        +91 8660989586
                                    </Box>
                                    <Box
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20help%20booking%20a%20coastal%20service."
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.45,
                                            color: isDark ? '#34D399' : '#047857',
                                            fontSize: '0.76rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        <WhatsAppIcon sx={{ fontSize: 14 }} />
                                        WhatsApp Desk
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Box>
                );
            })()}

            {/* =========================================================================
                2. DEDICATED SERVICE OFFERINGS SHOWCASE (7 CURATED SERVICES)
                   ORDER: 1. Bike Rentals, 2. Cab, 3. Homestay/Rooms, 4. Boating, 5. Scuba, 6. Guide, 7. Custom Tour Package
            ========================================================================== */}
            <Box id="service-offerings" sx={{ maxWidth: '1440px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mb: 9 }}>
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
                        7 Curated Services For Your {branchCitiesLabel} Trip
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
                            tagline: 'Browse bikes and scooters available in our live fleet. Confirm dates and rental prices before payment.',
                            rate: 'Check Live Rates',
                            image: featuredBikeImage,
                            color: '#F59E0B',
                            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            href: '/services/bikes',
                            guideHref: '/blog/honnavar-murudeshwar-bike-rental-complete-guide',
                            cta: 'Explore Bikes & Rent',
                            icon: <TwoWheelerIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                'Browse available models by branch',
                                '2 Sanitized ISI Helmets & Phone Mount Free',
                                'Honnavar & Murudeshwar Station Delivery',
                            ],
                        },
                        {
                            id: 'cabs',
                            order: '02',
                            title: 'Coastal Cabs & Taxis',
                            tag: 'AC Chauffeur Fleet',
                            tagline: 'Chilled AC Swift Dzire, Ertiga & Innova Crysta with courteous, punctual local drivers who know every scenic shortcut.',
                            rate: 'Get a Trip Quote',
                            image: '/images/services/taxi.jpg',
                            color: '#0284C7',
                            gradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                            href: '/services/cabs',
                            guideHref: '/blog/coastal-karnataka-cab-hire-transfers-itinerary',
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
                            rate: 'Check Availability',
                            image: '/images/services/homestay.jpg',
                            color: '#E11D48',
                            gradient: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                            href: '/services/homestays',
                            guideHref: '/blog/sharavathi-riverfront-homestays-coastal-stays-guide',
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
                            rate: 'View Experiences',
                            image: '/images/services/boating.jpg',
                            color: '#059669',
                            gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            href: '/services/boating',
                            guideHref: '/blog/sharavathi-backwater-mangrove-boating-guide',
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
                            rate: 'View Dive Packages',
                            image: '/images/services/scuba.jpg',
                            color: '#6366F1',
                            gradient: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
                            href: '/services/scuba',
                            guideHref: '/blog/netrani-island-scuba-diving-beginners-guide',
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
                            rate: 'Request Guide Rates',
                            image: '/images/services/guide.jpg',
                            color: '#D97706',
                            gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                            href: '/services/guide',
                            guideHref: '/blog/hidden-honnavar-waterfalls-mirjan-fort-local-guide',
                            cta: 'View Guided Trails & Tours',
                            icon: <ExploreIcon sx={{ fontSize: 20 }} />,
                            highlights: [
                                'Secret Apsarakonda Freshwater Waterfall Trek',
                                'Mirjan Fort Queen Heritage & History Walk',
                                'Curated Sunset Clifftops & Photography Spots',
                            ],
                        },
                    ].map(enhanceHomeService).map((srv) => (
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
                                    {srv.image ? (
                                        <Box component="img" className="card-img" src={srv.image}
                                            alt={`${srv.title} in Honnavar - GK WhizWheel`}
                                            loading="lazy"
                                            sx={{
                                                width: '100%', height: '100%', objectFit: 'cover',
                                                transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                            {srv.icon}
                                        </Box>
                                    )}
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
                                            {srv.id === 'bikes' && reviewMeta.total > 0 ? `${reviewMeta.average_rating} / 5 (${reviewMeta.total})` : 'View service details'}
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

                                    {srv.guideHref && (
                                        <Box sx={{ textAlign: 'center', mt: 1.2 }}>
                                            <Typography
                                                component={Link}
                                                href={srv.guideHref}
                                                variant="caption"
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    fontWeight: 750,
                                                    color: isDark ? '#CBD5E1' : '#475569',
                                                    textDecoration: 'none',
                                                    '&:hover': { color: srv.color, textDecoration: 'underline' },
                                                }}
                                            >
                                                <AutoStoriesIcon sx={{ fontSize: 14, color: srv.color }} />
                                                Read Complete Guide →
                                            </Typography>
                                        </Box>
                                    )}
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
                                        {featuredTourImage ? (
                                            <Box component="img" className="tour-img"
                                                src={featuredTourImage}
                                                alt={featuredTour?.name || 'Published tour package'}
                                                loading="lazy"
                                                sx={{
                                                    width: '100%', height: '100%', objectFit: 'cover',
                                                    transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                                }}
                                            />
                                        ) : (
                                            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                                <AutoAwesomeIcon sx={{ fontSize: 90, color: '#A78BFA' }} aria-hidden="true" />
                                            </Box>
                                        )}
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
                                                {featuredTour?.price_base != null && Number(featuredTour.price_base) > 0
                                                    ? `From ₹${Number(featuredTour.price_base).toLocaleString('en-IN')}`
                                                    : 'Explore Published Packages'}
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
                                                Explore Packages
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
                                                    label="CHECK AVAILABLE PACKAGE RATES"
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
                                                    • {featuredTour ? 'Published Package' : 'Packages on Request'}
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
                                                {featuredTour?.name || 'Custom Tour Packages & Karavali Combos'}
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
                                                {featuredTour?.description || 'Browse published tour packages and confirm their prices and inclusions before booking.'}
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
                                                {(Array.isArray(featuredTour?.features) && featuredTour.features.length
                                                    ? featuredTour.features.slice(0, 3)
                                                    : ['View published tour packages', 'Confirm inclusions and prices before booking']
                                                ).map((text, i) => (
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
                                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheel%2C%20I%20want%20to%20plan%20a%20custom%20tour%20package%20across%20Honnavar%20%26%20Murudeshwar"
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

                                            <Button
                                                variant="text"
                                                component={Link}
                                                href="/blog/3-day-karavali-coastal-tour-package-blueprint"
                                                size="large"
                                                startIcon={<AutoStoriesIcon sx={{ color: '#8B5CF6' }} />}
                                                sx={{
                                                    color: isDark ? '#C4B5FD' : '#6D28D9',
                                                    fontWeight: 800,
                                                    px: 2,
                                                    textTransform: 'none',
                                                    fontSize: '0.92rem',
                                                    '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.08)' },
                                                }}
                                            >
                                                Read 3-Day Combo Guide →
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
                REST OF ALL SECTIONS (1440px CONTAINER)
            ========================================================================== */}
            <Box sx={{ maxWidth: '1440px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>

                {/* =========================================================================
                    4. HOW BOOKING WORKS (Split Editorial Container + Connected Vertical Stepper)
                ========================================================================== */}
                {(() => {
                    const isBikeFlow = bookingFlowTab === 'bikes';
                    const bookingSteps = isBikeFlow
                        ? [
                            {
                                num: '1',
                                accent: '#F59E0B',
                                title: 'Select Branch & Dates',
                                desc: `Choose ${branchCitiesLabel} hub, pickup dates, and compare live scooter or motorcycle models.`,
                                tag: 'Live Fleet Stock',
                            },
                            {
                                num: '2',
                                accent: '#0284C7',
                                title: 'Lock via PhonePe, UPI or ₹100 Advance',
                                desc: 'Google 1-tap or instant auto-account with zero password friction. Pay ₹100 hold or full rental via PhonePe & UPI.',
                                tag: 'PhonePe & Zero Deposit',
                            },
                            {
                                num: '3',
                                accent: '#10B981',
                                title: '3-Min Station or Hub Handover',
                                desc: `Quick DL & Aadhaar verification at our ${branchCitiesLabel} desk with 2 sanitized ISI helmets.`,
                                tag: 'Fast Digital KYC',
                            },
                            {
                                num: '4',
                                accent: '#8B5CF6',
                                title: 'Ride & Hassle-Free Return',
                                desc: 'Cruise NH66 with 24/7 roadside backup and return smoothly at your selected branch.',
                                tag: '24/7 Roadside Help',
                            },
                        ]
                        : [
                            {
                                num: '1',
                                accent: '#F59E0B',
                                title: 'Pick Your Experience',
                                desc: 'Choose AC cabs, Sharavathi boating, Netrani scuba, homestays, local guides or custom tours.',
                                tag: '6 Coastal Services',
                            },
                            {
                                num: '2',
                                accent: '#0284C7',
                                title: 'Instant 1-Tap & Guest Details',
                                desc: '1-tap Google login or enter phone number — account auto-provisions instantly with zero password friction.',
                                tag: 'Instant Auto-Account',
                            },
                            {
                                num: '3',
                                accent: '#10B981',
                                title: 'Instant WhatsApp Voucher & PhonePe',
                                desc: 'Get booking voucher on WhatsApp instantly. Pay securely via PhonePe, UPI or on arrival as per service policy.',
                                tag: 'PhonePe & WhatsApp',
                            },
                            {
                                num: '4',
                                accent: '#8B5CF6',
                                title: 'Punctual Pickup & Trip',
                                desc: 'Meet on time at your railway station, jetty or hotel with 24/7 coordinator assistance.',
                                tag: 'On-Time Guarantee',
                            },
                        ];

                    return (
                        <Box
                            component="section"
                            id="how-it-works"
                            aria-labelledby="process-title"
                            sx={{
                                mb: { xs: 7, md: 10 },
                                p: { xs: 2.5, sm: 4, md: 5 },
                                borderRadius: 5,
                                background: isDark
                                    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(17, 28, 48, 0.92) 100%)'
                                    : 'linear-gradient(135deg, #FFFDF7 0%, #F8FAFC 58%, #F0F9FF 100%)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            }}
                        >
                            <Grid container spacing={{ xs: 3.5, md: 6 }} alignItems="center">
                                {/* Left Sticky Editorial Column */}
                                <Grid size={{ xs: 12, lg: 5 }}>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            display: 'block',
                                            fontWeight: 800,
                                            letterSpacing: '0.12em',
                                            color: isDark ? '#FBBF24' : '#D97706',
                                            mb: 1,
                                        }}
                                    >
                                        BOOK IN UNDER 60 SECONDS • OPEN 24/7
                                    </Typography>
                                    <Typography
                                        id="process-title"
                                        variant="h3"
                                        component="h2"
                                        sx={{
                                            fontWeight: 950,
                                            fontSize: { xs: '1.85rem', md: '2.4rem' },
                                            lineHeight: 1.12,
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            letterSpacing: '-0.03em',
                                            mb: 1.5,
                                        }}
                                    >
                                        How Booking Works
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.7, mb: 3 }}>
                                        Transparent 24-hour tariffs and punctual coastal handovers across {branchCitiesLabel}. Switch modes to preview your exact booking flow.
                                    </Typography>

                                    {/* Flow Switcher Pills */}
                                    <Box
                                        role="tablist"
                                        aria-label="Booking process type"
                                        sx={{
                                            display: 'inline-flex',
                                            p: 0.5,
                                            borderRadius: 9999,
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                                            mb: 3,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {[
                                            { id: 'bikes', label: 'Bikes & Scooters', icon: <TwoWheelerIcon sx={{ fontSize: 16 }} /> },
                                            { id: 'experiences', label: 'Cabs, Stays & Tours', icon: <DirectionsBoatIcon sx={{ fontSize: 16 }} /> },
                                        ].map((tab) => {
                                            const active = bookingFlowTab === tab.id;
                                            return (
                                                <Button
                                                    key={tab.id}
                                                    role="tab"
                                                    aria-selected={active}
                                                    size="small"
                                                    startIcon={tab.icon}
                                                    onClick={() => setBookingFlowTab(tab.id)}
                                                    sx={{
                                                        px: 2,
                                                        py: 0.75,
                                                        borderRadius: 9999,
                                                        textTransform: 'none',
                                                        fontWeight: active ? 800 : 600,
                                                        fontSize: '0.8rem',
                                                        bgcolor: active ? (isDark ? '#F59E0B' : '#0F172A') : 'transparent',
                                                        color: active ? (isDark ? '#0F172A' : '#FFFFFF') : (isDark ? '#CBD5E1' : '#334155'),
                                                        '&:hover': {
                                                            bgcolor: active ? (isDark ? '#F59E0B' : '#0F172A') : 'rgba(148, 163, 184, 0.16)',
                                                        },
                                                    }}
                                                >
                                                    {tab.label}
                                                </Button>
                                            );
                                        })}
                                    </Box>

                                    {/* Compact Readiness Checklist */}
                                    <Stack spacing={1} sx={{ mb: 3.25 }}>
                                        {(isBikeFlow
                                            ? ['Keep ready: Original Driving License + Aadhaar / Govt ID', 'Free cancellation or rescheduling up to 12 hours prior']
                                            : ['Zero KYC paperwork needed for cabs, boats, scuba & stays', 'Direct 24/7 local coordinator updates on WhatsApp']
                                        ).map((note) => (
                                            <Box key={note} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', flexShrink: 0 }} />
                                                <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontSize: '0.86rem', fontWeight: 500 }}>
                                                    {note}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                                        <Button
                                            variant="contained"
                                            component={isBikeFlow ? Link : 'a'}
                                            href={isBikeFlow ? '/services/bikes' : '#quick-search'}
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                bgcolor: '#F59E0B',
                                                color: '#0F172A',
                                                fontWeight: 800,
                                                textTransform: 'none',
                                                px: 2.75,
                                                py: 1.15,
                                                borderRadius: 2.5,
                                                '&:hover': { bgcolor: '#D97706' },
                                            }}
                                        >
                                            {isBikeFlow ? 'Check Live Bike Fleet' : 'Open Quick Search'}
                                        </Button>
                                        <Button
                                            variant="text"
                                            component="a"
                                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20need%20help%20with%20a%20booking."
                                            target="_blank"
                                            rel="noreferrer"
                                            startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                            sx={{
                                                color: isDark ? '#F8FAFC' : '#0F172A',
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                px: 1.5,
                                            }}
                                        >
                                            WhatsApp Support
                                        </Button>
                                    </Stack>
                                </Grid>

                                {/* Right Connected Stepper Track (No Card Grid!) */}
                                <Grid size={{ xs: 12, lg: 7 }}>
                                    <Box sx={{ position: 'relative', pl: { xs: 0, sm: 1 } }}>
                                        {/* Vertical Connecting Spine */}
                                        <Box
                                            aria-hidden="true"
                                            sx={{
                                                position: 'absolute',
                                                left: { xs: 19, sm: 27 },
                                                top: 28,
                                                bottom: 28,
                                                width: 2,
                                                background: 'linear-gradient(180deg, #F59E0B 0%, #0284C7 35%, #10B981 70%, #8B5CF6 100%)',
                                                opacity: 0.35,
                                            }}
                                        />

                                        <Stack spacing={2}>
                                            {bookingSteps.map((step) => (
                                                <Box
                                                    key={step.num}
                                                    sx={{
                                                        position: 'relative',
                                                        display: 'flex',
                                                        alignItems: { xs: 'flex-start', sm: 'center' },
                                                        gap: { xs: 2, sm: 2.5 },
                                                        p: { xs: 1.5, sm: 2 },
                                                        borderRadius: 3,
                                                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                                                        '&:hover': {
                                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.9)',
                                                            transform: 'translateX(4px)',
                                                        },
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            position: 'relative',
                                                            zIndex: 1,
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            flexShrink: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: step.accent,
                                                            color: '#0F172A',
                                                            fontWeight: 900,
                                                            fontSize: '0.95rem',
                                                            boxShadow: `0 0 0 6px ${isDark ? '#0D1628' : '#FAFBFD'}`,
                                                        }}
                                                    >
                                                        {step.num}
                                                    </Box>

                                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 0.35 }}>
                                                            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: '1rem' }}>
                                                                {step.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: '0.72rem',
                                                                    color: step.accent,
                                                                    bgcolor: `${step.accent}18`,
                                                                    px: 1.15,
                                                                    py: 0.3,
                                                                    borderRadius: 9999,
                                                                }}
                                                            >
                                                                {step.tag}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: '0.88rem', lineHeight: 1.55 }}>
                                                            {step.desc}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    );
                })()}

                {/* =========================================================================
                    7. CUSTOMER REVIEWS & EXPERIENCES (3x2 Verified Google Reviews Wall)
                ========================================================================== */}
                {(() => {
                    // Display only approved reviews from the public Reviews API.
                    const allReviews = publicReviews.map((review) => ({
                        id: review.id,
                        category: 'bikes',
                        serviceLabel: 'Bike Rental',
                        accent: '#F59E0B',
                        headline: review.bike_name || 'Customer bike rental experience',
                        name: review.customer_name || 'Verified customer',
                        location: 'Customer',
                        trip: review.bike_name || 'Bike rental',
                        timeAgo: review.created_at
                            ? new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })
                            : 'Review',
                        review: review.comment,
                        rating: Number(review.rating) || 0,
                    }));

                    const displayedReviews = reviewFilter === 'all'
                        ? allReviews
                        : allReviews.filter((r) => r.category === reviewFilter);

                    const reviewFilters = [
                        { id: 'all', label: `All Stories (${allReviews.length})` },
                        { id: 'bikes', label: 'Bikes & Scooters' },
                        { id: 'water', label: 'Boating & Scuba' },
                        { id: 'stays_cabs', label: 'Cabs & Stays' },
                    ];

                    return (
                        <Box component="section" id="reviews" aria-labelledby="reviews-title" sx={{ mb: { xs: 7, md: 10 } }}>
                            {/* Top Google Trust Bar + Filters */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', lg: 'row' },
                                    alignItems: { xs: 'flex-start', lg: 'center' },
                                    justifyContent: 'space-between',
                                    gap: 2.5,
                                    mb: 3.5,
                                }}
                            >
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.75 }}>
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.75,
                                                px: 1.25,
                                                py: 0.35,
                                                borderRadius: 1.5,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                                            }}
                                        >
                                            <Box component="svg" viewBox="0 0 24 24" sx={{ width: 15, height: 15, flexShrink: 0 }}>
                                                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                                                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                                                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                                                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                                            </Box>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                {reviewMeta.average_rating ?? '—'}
                                            </Typography>
                                            <Stack direction="row" spacing={0.1}>
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} sx={{
                                                        fontSize: 13,
                                                        color: i < Math.round(Number(reviewMeta.average_rating || 0)) ? '#F59E0B' : '#CBD5E1',
                                                    }} />
                                                ))}
                                            </Stack>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                                                ({reviewMeta.total} published bike reviews)
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Typography
                                        id="reviews-title"
                                        variant="h3"
                                        component="h2"
                                        sx={{
                                            fontWeight: 950,
                                            fontSize: { xs: '1.85rem', md: '2.35rem' },
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            letterSpacing: '-0.03em',
                                        }}
                                    >
                                        Customer Experiences
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    {reviewFilters.map((f) => {
                                        const active = reviewFilter === f.id;
                                        return (
                                            <Button
                                                key={f.id}
                                                size="small"
                                                onClick={() => setReviewFilter(f.id)}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 9999,
                                                    px: 1.85,
                                                    py: 0.6,
                                                    fontSize: '0.8rem',
                                                    fontWeight: active ? 800 : 600,
                                                    bgcolor: active ? (isDark ? '#F59E0B' : '#0F172A') : 'transparent',
                                                    color: active ? (isDark ? '#0F172A' : '#FFFFFF') : (isDark ? '#CBD5E1' : '#475569'),
                                                    border: active ? '1px solid transparent' : (isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid #CBD5E1'),
                                                    '&:hover': {
                                                        bgcolor: active ? (isDark ? '#F59E0B' : '#0F172A') : 'rgba(245, 158, 11, 0.1)',
                                                    },
                                                }}
                                            >
                                                {f.label}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        component="a"
                                        href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                        target="_blank"
                                        rel="noreferrer"
                                        size="small"
                                        endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: isDark ? '#FBBF24' : '#B45309',
                                            px: 1,
                                        }}
                                    >
                                        Google Profile
                                    </Button>
                                </Stack>
                            </Box>

                            {/* Approved customer reviews from database */}
                            <Grid container spacing={2.5}>
                                {displayedReviews.length === 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3.5, textAlign: 'center' }}>
                                            <Typography color="text.secondary">
                                                No published customer reviews in this category yet.
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                                {displayedReviews.map((rev) => (
                                    <Grid size={{ xs: 12, sm: 6, lg: displayedReviews.length <= 2 ? 6 : 4 }} key={rev.id}>
                                        <Box
                                            sx={{
                                                height: '100%',
                                                p: 2.75,
                                                borderRadius: 3.5,
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                boxShadow: isDark ? 'none' : '0 4px 18px -6px rgba(15, 23, 42, 0.06)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                gap: 2,
                                                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    borderColor: isDark ? 'rgba(245, 158, 11, 0.45)' : '#CBD5E1',
                                                    boxShadow: isDark
                                                        ? '0 14px 28px -12px rgba(0, 0, 0, 0.55)'
                                                        : '0 14px 28px -12px rgba(15, 23, 42, 0.1)',
                                                },
                                            }}
                                        >
                                            <Box>
                                                {/* Author & Rating Row */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.75 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 38,
                                                                height: 38,
                                                                bgcolor: `${rev.accent}22`,
                                                                color: rev.accent,
                                                                fontWeight: 900,
                                                                fontSize: '0.9rem',
                                                                border: `1px solid ${rev.accent}44`,
                                                            }}
                                                        >
                                                            {rev.name.charAt(0)}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.2 }}>
                                                                {rev.name}
                                                            </Typography>
                                                            <Typography variant="caption" noWrap sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                                {rev.location} • {rev.timeAgo}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Stack direction="row" spacing={0.15} sx={{ flexShrink: 0 }}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <StarIcon key={i} sx={{
                                                                fontSize: 15,
                                                                color: i < rev.rating ? '#F59E0B' : '#CBD5E1',
                                                            }} />
                                                        ))}
                                                    </Stack>
                                                </Box>

                                                <Typography
                                                    variant="subtitle2"
                                                    component="h3"
                                                    sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', mb: 0.75, fontSize: '0.95rem' }}
                                                >
                                                    {rev.headline}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.62, fontSize: '0.86rem' }}
                                                >
                                                    {rev.review}
                                                </Typography>
                                            </Box>

                                            {/* Service & Trip Footer */}
                                            <Box
                                                sx={{
                                                    pt: 1.5,
                                                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 1,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.74rem' }}>
                                                    {rev.trip}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        color: rev.accent,
                                                        bgcolor: `${rev.accent}15`,
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    {rev.serviceLabel}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    );
                })()}

                {/* =========================================================================
                    8. DYNAMIC BRANCH HUBS (Interactive Branch Directory + Focal Hub Console)
                ========================================================================== */}
                {(() => {
                    const activeHub = branchList[selectedHubIndex] || branchList[0];
                    if (!activeHub) return null;
                    const activeAddress = [activeHub.address_line, activeHub.city, activeHub.state, activeHub.pincode].filter(Boolean).join(', ');
                    const activeSlug = activeHub.slug || (activeHub.city || activeHub.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const activeLabel = activeHub.public_name || activeHub.name;
                    const activePhone = getBranchPhone(activeHub);
                    const activeWaText = encodeURIComponent(`Hi GK WhizWheels, I would like to book pickup from ${activeLabel}.`);

                    return (
                        <Box component="section" id="hubs" aria-labelledby="hubs-title" sx={{ mb: { xs: 7, md: 10 } }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3.5 }}>
                                <Box>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            display: 'block',
                                            fontWeight: 800,
                                            letterSpacing: '0.12em',
                                            color: isDark ? '#38BDF8' : '#0284C7',
                                            mb: 0.75,
                                        }}
                                    >
                                        {branchList.length} ACTIVE COASTAL {branchList.length === 1 ? 'BRANCH' : 'BRANCHES'} • ONE-WAY RETURN READY
                                    </Typography>
                                    <Typography
                                        id="hubs-title"
                                        variant="h3"
                                        component="h2"
                                        sx={{
                                            fontWeight: 950,
                                            fontSize: { xs: '1.85rem', md: '2.35rem' },
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            letterSpacing: '-0.03em',
                                        }}
                                    >
                                        {branchCitiesLabel} Pickup &amp; Return Branches
                                    </Typography>
                                </Box>

                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', maxWidth: 420 }}>
                                    Select a branch to inspect exact address, pickup instructions, coordinates, and live vehicle stock.
                                </Typography>
                            </Box>

                            <Grid container spacing={3} alignItems="stretch">
                                {/* Left Column: Dynamic Branch Cards (Honnavar & Murudeshwar) */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Stack spacing={2} sx={{ height: '100%' }}>
                                        {branchList.map((hub, idx) => {
                                            const safeHubIdx = selectedHubIndex < branchList.length ? selectedHubIndex : 0;
                                            const isSelected = idx === safeHubIdx;
                                            const branchAddress = [hub.address_line, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ');
                                            const branchSlug = hub.slug || (hub.city || hub.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                            const label = hub.public_name || hub.name;
                                            const hubPhone = getBranchPhone(hub);
                                            const hubPhoneDigits = hubPhone.replace(/\D/g, '');
                                            const hubWaText = encodeURIComponent(`Hi GK WhizWheels, I would like to book pickup from ${label}.`);

                                            return (
                                                <Box
                                                    key={hub.id}
                                                    onClick={() => setSelectedHubIndex(idx)}
                                                    sx={{
                                                        flex: 1,
                                                        cursor: 'pointer',
                                                        p: { xs: 2.25, sm: 2.75 },
                                                        borderRadius: 3.5,
                                                        bgcolor: isSelected
                                                            ? (isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB')
                                                            : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF'),
                                                        border: isSelected
                                                            ? '2px solid #F59E0B'
                                                            : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'),
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        gap: 1.5,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: '#F59E0B',
                                                        },
                                                    }}
                                                >
                                                    <Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <Box
                                                                    sx={{
                                                                        width: 28,
                                                                        height: 28,
                                                                        borderRadius: 1.5,
                                                                        bgcolor: isSelected ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
                                                                        color: isSelected ? '#0F172A' : (isDark ? '#CBD5E1' : '#334155'),
                                                                        fontWeight: 900,
                                                                        fontSize: '0.76rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    0{idx + 1}
                                                                </Box>
                                                                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                                    {label}
                                                                </Typography>
                                                            </Stack>

                                                            <Chip
                                                                size="small"
                                                                label={hub.bikes_count > 0 ? `${hub.bikes_count} Units` : 'Open 24/7'}
                                                                sx={{
                                                                    height: 22,
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 800,
                                                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
                                                                    color: isDark ? '#34D399' : '#047857',
                                                                }}
                                                            />
                                                        </Box>

                                                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', fontSize: '0.84rem', lineHeight: 1.5, mb: 0.75 }}>
                                                            <LocationOnIcon sx={{ fontSize: 15, color: '#F59E0B', verticalAlign: 'text-bottom', mr: 0.5 }} />
                                                            {branchAddress}
                                                        </Typography>

                                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.45 }}>
                                                            Open 24/7 • Desk:{' '}
                                                            <Box
                                                                component="a"
                                                                href={`tel:${hubPhone}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                sx={{ color: isDark ? '#FBBF24' : '#B45309', fontWeight: 700, textDecoration: 'none' }}
                                                            >
                                                                {formatBranchPhone(hubPhone)}
                                                            </Box>
                                                            {hub.pickup_instructions ? ` • ${hub.pickup_instructions}` : ''}
                                                        </Typography>
                                                    </Box>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        flexWrap="wrap"
                                                        useFlexGap
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            component={Link}
                                                            href={`/bike-rentals/branches/${hub.id}/${branchSlug}`}
                                                            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                                                            sx={{
                                                                bgcolor: '#F59E0B',
                                                                color: '#0F172A',
                                                                fontWeight: 800,
                                                                fontSize: '0.76rem',
                                                                textTransform: 'none',
                                                                borderRadius: 1.75,
                                                                px: 1.5,
                                                                '&:hover': { bgcolor: '#D97706' },
                                                            }}
                                                        >
                                                            View {hub.city || 'Branch'} Fleet
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            component="a"
                                                            href={getBranchMapUrl(hub)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            startIcon={<DirectionsIcon sx={{ fontSize: 14 }} />}
                                                            sx={{
                                                                borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#CBD5E1',
                                                                color: isDark ? '#E2E8F0' : '#0F172A',
                                                                fontWeight: 700,
                                                                fontSize: '0.76rem',
                                                                textTransform: 'none',
                                                                borderRadius: 1.75,
                                                            }}
                                                        >
                                                            Directions
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            component="a"
                                                            href={`https://wa.me/${hubPhoneDigits}?text=${hubWaText}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            startIcon={<WhatsAppIcon sx={{ fontSize: 14, color: '#10B981' }} />}
                                                            sx={{
                                                                borderColor: 'rgba(16, 185, 129, 0.35)',
                                                                color: isDark ? '#34D399' : '#047857',
                                                                fontWeight: 700,
                                                                fontSize: '0.76rem',
                                                                textTransform: 'none',
                                                                borderRadius: 1.75,
                                                            }}
                                                        >
                                                            WhatsApp
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Grid>

                                {/* Right Column: Live Embedded Google Map + Selected Hub Info Strip */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                height: { xs: 340, md: 430 },
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                                bgcolor: isDark ? '#0F172A' : '#E2E8F0',
                                            }}
                                        >
                                            <Box
                                                key={activeHub.id}
                                                component="iframe"
                                                title={`Google Map - ${activeLabel}`}
                                                src={getBranchEmbedUrl(activeHub)}
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                allowFullScreen
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 0,
                                                    display: 'block',
                                                }}
                                            />
                                        </Box>

                                        {/* Compact Map Info & Quick Call Dock */}
                                        <Box
                                            sx={{
                                                px: 2.25,
                                                py: 1.5,
                                                borderRadius: 3,
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                flexWrap: 'wrap',
                                                gap: 1.5,
                                            }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {activeLabel}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                    {activeAddress} • Open 24/7
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                <Button
                                                    size="small"
                                                    component="a"
                                                    href={`tel:${activePhone}`}
                                                    startIcon={<PhoneIcon sx={{ fontSize: 15 }} />}
                                                    sx={{
                                                        fontWeight: 800,
                                                        fontSize: '0.78rem',
                                                        textTransform: 'none',
                                                        color: isDark ? '#FBBF24' : '#B45309',
                                                    }}
                                                >
                                                    {formatBranchPhone(activePhone)}
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    component="a"
                                                    href={getBranchMapUrl(activeHub)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    startIcon={<DirectionsIcon sx={{ fontSize: 15 }} />}
                                                    sx={{
                                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                                        fontWeight: 700,
                                                        fontSize: '0.78rem',
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    Navigate in Google Maps
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    );
                })()}

                {/* =========================================================================
                    IN-DEPTH TRAVEL BLOGS & GUIDES ACROSS ALL 7 SERVICES
                ========================================================================== */}
                {(() => {
                    const guideTabs = [
                        { id: 'all', label: 'All 7 Guides' },
                        { id: 'bikes', label: 'Bikes & Scooters' },
                        { id: 'cabs', label: 'AC Cabs' },
                        { id: 'homestays', label: 'Homestays' },
                        { id: 'boating', label: 'Boating' },
                        { id: 'scuba', label: 'Scuba' },
                        { id: 'guide', label: 'Local Guides' },
                        { id: 'tours', label: 'Tour Packages' },
                    ];

                    const filteredGuides = activeGuideTab === 'all'
                        ? blogArticles
                        : blogArticles.filter((a) => a.serviceKey === activeGuideTab);

                    const leadGuide = filteredGuides[0];
                    const sideGuides = filteredGuides.slice(1);

                    return (
                        <Box
                            component="section"
                            id="travel-guides"
                            aria-labelledby="travel-guides-title"
                            sx={{ mb: { xs: 7, md: 10 } }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'flex-start', md: 'flex-end' },
                                    gap: 2.5,
                                    mb: 3.5,
                                }}
                            >
                                <Box>
                                    <Chip
                                        icon={<AutoStoriesIcon sx={{ fontSize: 15 }} />}
                                        label="Karavali Travel Journal • 7 Service Deep Dives"
                                        size="small"
                                        sx={{
                                            mb: 1.2,
                                            fontWeight: 800,
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                                            color: isDark ? '#FBBF24' : '#B45309',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                        }}
                                    />
                                    <Typography
                                        id="travel-guides-title"
                                        variant="h3"
                                        sx={{
                                            fontWeight: 950,
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            letterSpacing: '-0.025em',
                                            fontSize: { xs: '1.75rem', md: '2.35rem' },
                                            mb: 0.75,
                                        }}
                                    >
                                        Detailed Guides For Every Coastal Service
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#475569',
                                            maxWidth: 740,
                                            fontSize: '0.96rem',
                                            lineHeight: 1.65,
                                        }}
                                    >
                                        Plan smarter across Honnavar &amp; Murudeshwar with our coordinator-written guides covering self-drive routes, station transfers, riverfront homestays, sunset boating, Netrani scuba diving, local waterfall trails, and 3-day itineraries.
                                    </Typography>
                                </Box>

                                <Button
                                    component={Link}
                                    href="/blog"
                                    variant="outlined"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
                                    sx={{
                                        borderRadius: 2.5,
                                        fontWeight: 850,
                                        px: 2.8,
                                        py: 1.1,
                                        textTransform: 'none',
                                        whiteSpace: 'nowrap',
                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                        '&:hover': { borderColor: '#F59E0B', color: '#F59E0B' },
                                    }}
                                >
                                    Open Full Blog Hub ({blogArticles.length})
                                </Button>
                            </Box>

                            {/* Filter Pills across all 7 Services */}
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3.5 }}>
                                {guideTabs.map((tab) => {
                                    const active = activeGuideTab === tab.id;
                                    return (
                                        <Chip
                                            key={tab.id}
                                            label={tab.label}
                                            clickable
                                            onClick={() => setActiveGuideTab(tab.id)}
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.8rem',
                                                bgcolor: active ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                                                color: active ? '#0F172A' : (isDark ? '#E2E8F0' : '#334155'),
                                                border: active ? '1px solid #F59E0B' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'),
                                                '&:hover': {
                                                    bgcolor: active ? '#D97706' : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                                                },
                                            }}
                                        />
                                    );
                                })}
                            </Stack>

                            {leadGuide && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        mb: sideGuides.length > 0 ? 3 : 0,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : '#FFFFFF',
                                        border: `1.5px solid ${isDark ? `${leadGuide.color}45` : '#E2E8F0'}`,
                                        boxShadow: isDark
                                            ? '0 16px 40px -14px rgba(0,0,0,0.55)'
                                            : '0 16px 40px -14px rgba(15,23,42,0.08)',
                                    }}
                                >
                                    <Grid container>
                                        <Grid size={{ xs: 12, md: 5 }}>
                                            <Box sx={{ position: 'relative', height: { xs: 220, md: '100%' }, minHeight: { md: 280 }, bgcolor: '#0F172A' }}>
                                                <Box
                                                    component="img"
                                                    src={leadGuide.image}
                                                    alt={leadGuide.title}
                                                    loading="lazy"
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                                <Chip
                                                    label={leadGuide.badge}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 14,
                                                        left: 14,
                                                        fontWeight: 850,
                                                        bgcolor: 'rgba(15, 23, 42, 0.86)',
                                                        color: '#FBBF24',
                                                    }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 7 }}>
                                            <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Stack direction="row" flexWrap="wrap" gap={1.2} alignItems="center" sx={{ mb: 1.2 }}>
                                                        <Chip label={leadGuide.serviceLabel} size="small" sx={{ fontWeight: 800, bgcolor: `${leadGuide.color}18`, color: leadGuide.color }} />
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>
                                                            {leadGuide.readTime} • {leadGuide.locationScope}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1.2, lineHeight: 1.25 }}>
                                                        {leadGuide.title}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.65, mb: 2 }}>
                                                        {leadGuide.excerpt}
                                                    </Typography>

                                                    <Grid container spacing={1} sx={{ mb: 2.5 }}>
                                                        {(leadGuide.highlights || []).map((hl, i) => (
                                                            <Grid key={i} size={{ xs: 12, sm: 6 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
                                                                    <CheckCircleIcon sx={{ fontSize: 16, color: leadGuide.color, mt: '2px', flexShrink: 0 }} />
                                                                    <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600, lineHeight: 1.45 }}>
                                                                        {hl}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>

                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                                    <Button
                                                        component={Link}
                                                        href={`/blog/${leadGuide.slug}`}
                                                        variant="contained"
                                                        endIcon={<ArrowForwardIcon />}
                                                        sx={{
                                                            bgcolor: leadGuide.color,
                                                            color: leadGuide.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                                            fontWeight: 850,
                                                            borderRadius: 2.5,
                                                            px: 3,
                                                            textTransform: 'none',
                                                            '&:hover': { bgcolor: leadGuide.color, filter: 'brightness(0.92)' },
                                                        }}
                                                    >
                                                        Read Detailed Guide
                                                    </Button>
                                                    <Button
                                                        component={Link}
                                                        href={leadGuide.serviceUrl}
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 2.5,
                                                            fontWeight: 800,
                                                            px: 2.5,
                                                            textTransform: 'none',
                                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                                        }}
                                                    >
                                                        {leadGuide.ctaLabel}
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}

                            {sideGuides.length > 0 && (
                                <Grid container spacing={2.5}>
                                    {sideGuides.map((g) => (
                                        <Grid key={g.slug} size={{ xs: 12, sm: 6, lg: 4 }}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    borderRadius: 3.5,
                                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : '#FFFFFF',
                                                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                                                    overflow: 'hidden',
                                                    transition: 'transform 0.25s ease, border-color 0.25s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        borderColor: g.color,
                                                    },
                                                }}
                                            >
                                                <Box sx={{ position: 'relative', height: 155, bgcolor: '#0F172A' }}>
                                                    <Box
                                                        component="img"
                                                        src={g.image}
                                                        alt={g.title}
                                                        loading="lazy"
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    />
                                                    <Chip
                                                        label={g.serviceLabel}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 10,
                                                            left: 10,
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem',
                                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                            color: '#FFFFFF',
                                                            border: `1px solid ${g.color}80`,
                                                        }}
                                                    />
                                                </Box>
                                                <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, display: 'block', mb: 0.6 }}>
                                                            {g.readTime} • {g.locationScope}
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.3, mb: 0.8 }}>
                                                            {g.title}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: '0.84rem', lineHeight: 1.55, mb: 1.5 }}>
                                                            {g.excerpt}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1.2, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9' }}>
                                                        <Button
                                                            component={Link}
                                                            href={`/blog/${g.slug}`}
                                                            size="small"
                                                            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                                                            sx={{ fontWeight: 850, color: g.color, textTransform: 'none', px: 0 }}
                                                        >
                                                            Read Full Blog
                                                        </Button>
                                                        <Typography
                                                            component={Link}
                                                            href={g.serviceUrl}
                                                            variant="caption"
                                                            sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, textDecoration: 'none', '&:hover': { color: g.color } }}
                                                        >
                                                            Book Service →
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    );
                })()}

                {/* =========================================================================
                    FAQ SECTION (Framed Stage + Segmented Tabs + 2-Column Card Accordions)
                ========================================================================== */}
                {(() => {
                    const faqCategories = [
                        { id: 'all', label: `All Topics (${faqItems.length})` },
                        { id: 'rentals', label: 'Bikes & Policies' },
                        { id: 'services', label: 'Branches & Services' },
                    ];

                    const visibleFaqs = faqCategory === 'all'
                        ? faqItems
                        : faqItems.filter((item) => item.category === faqCategory);

                    const leftFaqs = visibleFaqs.filter((_, idx) => idx % 2 === 0);
                    const rightFaqs = visibleFaqs.filter((_, idx) => idx % 2 === 1);
                    const primaryWaPhone = branchList.length > 0
                        ? getBranchPhone(branchList[0]).replace(/\D/g, '')
                        : '918660989586';

                    const renderFaqCard = (item) => {
                        const isOpen = expandedFaq === item.id;
                        const TopicIcon = item.icon;

                        return (
                            <Accordion
                                key={item.id}
                                expanded={isOpen}
                                onChange={(_, expanded) => setExpandedFaq(expanded ? item.id : false)}
                                elevation={0}
                                disableGutters
                                sx={{
                                    bgcolor: isDark
                                        ? (isOpen ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.56)')
                                        : '#FFFFFF',
                                    borderRadius: '16px !important',
                                    border: isOpen
                                        ? `1.5px solid ${item.accent}`
                                        : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'),
                                    boxShadow: isOpen
                                        ? (isDark ? '0 14px 32px rgba(0, 0, 0, 0.35)' : '0 12px 28px rgba(15, 23, 42, 0.06)')
                                        : (isDark ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.02)'),
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                                    overflow: 'hidden',
                                    '&:before': { display: 'none' },
                                    '&:hover': {
                                        borderColor: isOpen ? item.accent : (isDark ? 'rgba(255, 255, 255, 0.22)' : '#CBD5E1'),
                                    },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={
                                        <ExpandMoreIcon
                                            sx={{
                                                fontSize: 21,
                                                color: isOpen ? item.accent : (isDark ? '#94A3B8' : '#64748B'),
                                            }}
                                        />
                                    }
                                    sx={{
                                        px: { xs: 2, sm: 2.5 },
                                        py: 1.35,
                                        '& .MuiAccordionSummary-content': {
                                            my: 0.5,
                                            alignItems: 'center',
                                            gap: 1.75,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2.5,
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: isOpen ? item.accent : `${item.accent}16`,
                                            color: isOpen ? '#FFFFFF' : item.accent,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <TopicIcon sx={{ fontSize: 20 }} />
                                    </Box>

                                    <Box sx={{ flexGrow: 1, minWidth: 0, pr: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                fontWeight: 800,
                                                fontSize: '0.68rem',
                                                letterSpacing: '0.07em',
                                                textTransform: 'uppercase',
                                                color: item.accent,
                                                mb: 0.25,
                                            }}
                                        >
                                            {item.categoryLabel}
                                        </Typography>
                                        <Typography
                                            variant="subtitle1"
                                            component="h3"
                                            sx={{
                                                fontWeight: isOpen ? 800 : 700,
                                                fontSize: { xs: '0.95rem', sm: '1.02rem' },
                                                color: isDark ? '#F8FAFC' : '#0F172A',
                                                lineHeight: 1.35,
                                            }}
                                        >
                                            {item.question}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails
                                    sx={{
                                        pt: 0,
                                        pb: 2.5,
                                        px: { xs: 2, sm: 2.5 },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            pt: 1.5,
                                            pl: { xs: 0, sm: 7.25 },
                                            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isDark ? '#CBD5E1' : '#475569',
                                                lineHeight: 1.7,
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {item.answer}
                                        </Typography>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    };

                    return (
                        <Box
                            component="section"
                            id="faq"
                            aria-labelledby="faq-title"
                            sx={{
                                mb: { xs: 7, md: 10 },
                                p: { xs: 2.5, sm: 4, md: 5.5 },
                                borderRadius: 5,
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            }}
                        >
                            {/* Centered Header + Segmented Pill Filter Dock */}
                            <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: { xs: 3.5, md: 4.5 } }}>
                                <Typography
                                    variant="overline"
                                    sx={{
                                        display: 'inline-block',
                                        fontWeight: 800,
                                        letterSpacing: '0.12em',
                                        color: isDark ? '#FBBF24' : '#D97706',
                                        mb: 0.75,
                                    }}
                                >
                                    FREQUENTLY ASKED QUESTIONS
                                </Typography>
                                <Typography
                                    id="faq-title"
                                    variant="h3"
                                    component="h2"
                                    sx={{
                                        fontWeight: 950,
                                        fontSize: { xs: '1.8rem', md: '2.3rem' },
                                        lineHeight: 1.15,
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                        letterSpacing: '-0.03em',
                                        mb: 1.25,
                                    }}
                                >
                                    Quick Answers Before You Book
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#475569', fontSize: '0.96rem', lineHeight: 1.6, mb: 3 }}>
                                    Transparent rules on KYC documents, zero-deposit holds, 24/7 {branchCitiesLabel} pickups, and multi-service trips.
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        gap: 0.75,
                                        p: 0.65,
                                        borderRadius: 9999,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                    }}
                                >
                                    {faqCategories.map((cat) => {
                                        const active = faqCategory === cat.id;
                                        return (
                                            <Button
                                                key={cat.id}
                                                size="small"
                                                onClick={() => {
                                                    setFaqCategory(cat.id);
                                                    const firstMatch = cat.id === 'all'
                                                        ? faqItems[0]
                                                        : faqItems.find((i) => i.category === cat.id);
                                                    if (firstMatch) setExpandedFaq(firstMatch.id);
                                                }}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 9999,
                                                    px: 2.1,
                                                    py: 0.65,
                                                    fontSize: '0.82rem',
                                                    fontWeight: active ? 800 : 600,
                                                    bgcolor: active ? (isDark ? '#F59E0B' : '#0F172A') : 'transparent',
                                                    color: active ? (isDark ? '#0F172A' : '#FFFFFF') : (isDark ? '#CBD5E1' : '#475569'),
                                                    '&:hover': {
                                                        bgcolor: active ? (isDark ? '#F59E0B' : '#0F172A') : 'rgba(245, 158, 11, 0.08)',
                                                    },
                                                }}
                                            >
                                                {cat.label}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Balanced 2-Column Interactive FAQ Cards */}
                            <Grid container spacing={2.25} alignItems="flex-start">
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Stack spacing={2}>
                                        {leftFaqs.map(renderFaqCard)}
                                    </Stack>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Stack spacing={2}>
                                        {rightFaqs.map(renderFaqCard)}
                                    </Stack>
                                </Grid>
                            </Grid>

                            {/* Integrated 24/7 Branch Concierge Strip */}
                            <Box
                                sx={{
                                    mt: { xs: 3.5, md: 4 },
                                    px: { xs: 2.25, sm: 3 },
                                    py: 2,
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                    display: 'flex',
                                    flexDirection: { xs: 'column', lg: 'row' },
                                    alignItems: { xs: 'flex-start', lg: 'center' },
                                    justifyContent: 'space-between',
                                    gap: 2,
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            bgcolor: '#10B981',
                                            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.18)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            Still have questions? Our coastal desks are open 24/7.
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Instant help for custom pickup times, station transfers, and multi-day coastal itineraries.
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.1}>
                                    {branchList.map((hub) => {
                                        const phone = getBranchPhone(hub);
                                        return (
                                            <Button
                                                key={hub.id}
                                                size="small"
                                                variant="outlined"
                                                component="a"
                                                href={`tel:${phone}`}
                                                startIcon={<PhoneIcon sx={{ fontSize: 15, color: '#F59E0B' }} />}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 9999,
                                                    px: 1.75,
                                                    py: 0.6,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    borderColor: isDark ? 'rgba(255,255,255,0.16)' : '#CBD5E1',
                                                    color: isDark ? '#F8FAFC' : '#0F172A',
                                                    '&:hover': {
                                                        borderColor: '#F59E0B',
                                                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                                                    },
                                                }}
                                            >
                                                {hub.city || hub.name}: {formatBranchPhone(phone)}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        size="small"
                                        variant="contained"
                                        component="a"
                                        href={`https://wa.me/${primaryWaPhone}?text=Hi%20GK%20WhizWheels,%20I%20have%20a%20question%20before%20booking.`}
                                        target="_blank"
                                        rel="noreferrer"
                                        startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 9999,
                                            px: 2.1,
                                            py: 0.65,
                                            fontSize: '0.82rem',
                                            fontWeight: 800,
                                            bgcolor: '#10B981',
                                            color: '#06281E',
                                            boxShadow: 'none',
                                            '&:hover': { bgcolor: '#34D399', boxShadow: 'none' },
                                        }}
                                    >
                                        WhatsApp 24/7
                                    </Button>
                                </Stack>
                            </Box>
                        </Box>
                    );
                })()}

                {/* =========================================================================
                    9. BOTTOM CTA BANNER (SUNLIT COASTAL CLOSER + 24/7 HELPLINE DOCK)
                ========================================================================== */}
                {(() => {
                    const ctaWaPhone = branchList.length > 0
                        ? getBranchPhone(branchList[0]).replace(/\D/g, '')
                        : '918660989586';

                    const quickServiceLinks = [
                        { label: 'Bikes', href: '/services/bikes' },
                        { label: 'AC Cabs', href: '/services/cabs' },
                        { label: 'Boating', href: '/services/boating' },
                        { label: 'Scuba Diving', href: '/services/scuba' },
                        { label: 'Homestays', href: '/services/homestays' },
                        { label: 'Local Guides', href: '/services/guide' },
                        { label: 'Custom Tours', href: '/services/tours' },
                    ];

                    return (
                        <Box
                            component="section"
                            id="cta"
                            aria-labelledby="cta-heading"
                            sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: 5,
                                p: { xs: 3, sm: 4.5, md: 6 },
                                mb: 4,
                                background: isDark
                                    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(23, 37, 61, 0.94) 100%)'
                                    : 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 55%, #F8FAFC 100%)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                                boxShadow: isDark
                                    ? '0 20px 50px rgba(0, 0, 0, 0.45)'
                                    : '0 18px 45px rgba(15, 23, 42, 0.06)',
                            }}
                        >
                            <Grid container spacing={{ xs: 3.5, lg: 5 }} alignItems="center">
                                {/* Left Column: Clean Editorial Pitch & Focused CTAs */}
                                <Grid size={{ xs: 12, lg: 7 }}>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            display: 'inline-block',
                                            fontWeight: 800,
                                            letterSpacing: '0.12em',
                                            color: isDark ? '#FBBF24' : '#D97706',
                                            mb: 1,
                                        }}
                                    >
                                        READY FOR COASTAL KARNATAKA
                                    </Typography>

                                    <Typography
                                        id="cta-heading"
                                        variant="h2"
                                        component="h2"
                                        sx={{
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            fontWeight: 950,
                                            fontSize: { xs: '1.85rem', sm: '2.45rem', md: '2.85rem' },
                                            letterSpacing: '-0.03em',
                                            lineHeight: 1.15,
                                            mb: 1.75,
                                            maxWidth: 620,
                                        }}
                                    >
                                        Explore{' '}
                                        <Box component="span" sx={{ color: isDark ? '#FBBF24' : '#D97706' }}>
                                            {branchCitiesLabel}
                                        </Box>{' '}
                                        on Your Schedule.
                                    </Typography>

                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#475569',
                                            maxWidth: 560,
                                            mb: 3.25,
                                            lineHeight: 1.65,
                                            fontSize: { xs: '0.96rem', md: '1.04rem' },
                                        }}
                                    >
                                        Book two-wheelers, private AC cabs, Sharavathi boating, Netrani scuba diving, homestays, or custom coastal itineraries with transparent tariffs and instant confirmation.
                                    </Typography>

                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={1.5}
                                        alignItems={{ xs: 'stretch', sm: 'center' }}
                                        sx={{ mb: 3 }}
                                    >
                                        <Button
                                            variant="contained"
                                            size="large"
                                            component={Link}
                                            href="/services/bikes"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                py: 1.45,
                                                px: 3.5,
                                                borderRadius: 2.5,
                                                bgcolor: isDark ? '#F59E0B' : '#0F172A',
                                                color: isDark ? '#0F172A' : '#FFFFFF',
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                textTransform: 'none',
                                                whiteSpace: 'nowrap',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    bgcolor: isDark ? '#FBBF24' : '#1E293B',
                                                    boxShadow: 'none',
                                                },
                                            }}
                                        >
                                            Book Bikes &amp; Experiences
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="large"
                                            component="a"
                                            href={`https://wa.me/${ctaWaPhone}?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20plan%20a%20coastal%20trip%20(Bikes,%20Cabs,%20Stays,%20Boating,%20Scuba,%20Tours).`}
                                            target="_blank"
                                            rel="noreferrer"
                                            startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                            sx={{
                                                py: 1.45,
                                                px: 3,
                                                borderRadius: 2.5,
                                                borderColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#10B981',
                                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5',
                                                color: isDark ? '#34D399' : '#065F46',
                                                fontWeight: 800,
                                                fontSize: '0.94rem',
                                                textTransform: 'none',
                                                whiteSpace: 'nowrap',
                                                '&:hover': {
                                                    borderColor: '#10B981',
                                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5',
                                                },
                                            }}
                                        >
                                            WhatsApp 24/7 Desk
                                        </Button>
                                    </Stack>

                                    <Stack direction="row" flexWrap="wrap" alignItems="center" gap={{ xs: 1.5, sm: 2.5 }}>
                                        {[
                                            'Zero deposit online',
                                            'Free 12h cancellation',
                                            '5.0★ Google Rated (324+)',
                                        ].map((perk) => (
                                            <Stack key={perk} direction="row" alignItems="center" spacing={0.65}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: isDark ? '#94A3B8' : '#475569',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {perk}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Grid>

                                {/* Right Column: Structured 24/7 Branch Desk & Quick Services Card */}
                                <Grid size={{ xs: 12, lg: 5 }}>
                                    <Box
                                        sx={{
                                            p: { xs: 2.5, sm: 3 },
                                            borderRadius: 4,
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                            boxShadow: isDark ? 'none' : '0 8px 24px rgba(15, 23, 42, 0.04)',
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                24/7 Direct Coastal Desk
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label="Open 24/7"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                                                    color: isDark ? '#34D399' : '#047857',
                                                }}
                                            />
                                        </Stack>

                                        <Stack spacing={1.25} sx={{ mb: 2.25 }}>
                                            {branchList.map((hub) => {
                                                const phone = getBranchPhone(hub);
                                                return (
                                                    <Box
                                                        key={hub.id}
                                                        component="a"
                                                        href={`tel:${phone}`}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: 1.5,
                                                            px: 1.75,
                                                            py: 1.15,
                                                            borderRadius: 2.5,
                                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                            textDecoration: 'none',
                                                            transition: 'border-color 0.2s ease',
                                                            '&:hover': { borderColor: '#F59E0B' },
                                                        }}
                                                    >
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <PhoneIcon sx={{ fontSize: 16, color: '#F59E0B', flexShrink: 0 }} />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: isDark ? '#E2E8F0' : '#334155',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {hub.city || hub.name}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 800,
                                                                color: isDark ? '#FBBF24' : '#0F172A',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {formatBranchPhone(phone)}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>

                                        <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 2 }} />

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                fontWeight: 800,
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                color: isDark ? '#94A3B8' : '#64748B',
                                                mb: 1.15,
                                            }}
                                        >
                                            Browse Services
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.85 }}>
                                            {quickServiceLinks.map((srv) => (
                                                <Button
                                                    key={srv.href}
                                                    size="small"
                                                    component={Link}
                                                    href={srv.href}
                                                    sx={{
                                                        minWidth: 'auto',
                                                        px: 1.5,
                                                        py: 0.45,
                                                        borderRadius: 9999,
                                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                                        color: isDark ? '#E2E8F0' : '#334155',
                                                        fontSize: '0.76rem',
                                                        fontWeight: 700,
                                                        textTransform: 'none',
                                                        whiteSpace: 'nowrap',
                                                        '&:hover': {
                                                            borderColor: '#F59E0B',
                                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                                        },
                                                    }}
                                                >
                                                    {srv.label}
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    );
                })()}
            </Box>

            {/* Universal Service Booking & Inquiry Modal */}
            <ServiceBookingModal
                key={serviceModalId}
                open={serviceModalOpen}
                onClose={() => setServiceModalOpen(false)}
                initialServiceId={serviceModalId}
                availableItems={publishedServices}
            />
        </AppLayout>
    );
}

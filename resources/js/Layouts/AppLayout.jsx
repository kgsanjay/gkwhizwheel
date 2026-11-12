import React, { useState, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Chip,
    Alert,
    Grid,
    Divider,
    Stack,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    Paper,
    Collapse,
    Popover,
} from '@mui/material';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DirectionsIcon from '@mui/icons-material/Directions';
import LoginIcon from '@mui/icons-material/Login';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ExploreIcon from '@mui/icons-material/Explore';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HouseIcon from '@mui/icons-material/House';
import SailingIcon from '@mui/icons-material/Sailing';
import ScubaDivingIcon from '@mui/icons-material/ScubaDiving';
import HikingIcon from '@mui/icons-material/Hiking';
import CardTravelIcon from '@mui/icons-material/CardTravel';
import StarIcon from '@mui/icons-material/Star';
import { useColorMode } from '../theme/ColorModeContext';

// Unified 1440px container matching hero and page content sections
const SITE_CONTAINER_SX = {
    maxWidth: '1440px',
    width: '100%',
    mx: 'auto',
    px: { xs: 2, sm: 3, md: 4 },
};

const servicesList = [
    {
        title: 'Bike & Scooter Rentals',
        shortTitle: 'Bike Rentals',
        desc: 'Browse listed scooters and motorcycles',
        href: '/services/bikes',
        matchPrefixes: ['/services/bikes', '/bikes', '/bike-rentals'],
        icon: <TwoWheelerIcon sx={{ color: '#F59E0B', fontSize: 22 }} />,
        badge: 'Browse Fleet',
    },
    {
        title: 'Coastal Cabs & Taxis',
        shortTitle: 'Cabs & Taxis',
        desc: 'Sedan, SUV & tempo for Gokarna, Murudeshwar & airport',
        href: '/services/cabs',
        matchPrefixes: ['/services/cabs'],
        icon: <DirectionsCarIcon sx={{ color: '#0284C7', fontSize: 22 }} />,
        badge: 'AC Cabs',
    },
    {
        title: 'Homestays & Coastal Rooms',
        shortTitle: 'Homestays',
        desc: 'Verified riverside cottages & beachfront villas',
        href: '/services/homestays',
        matchPrefixes: ['/services/homestays'],
        icon: <HouseIcon sx={{ color: '#059669', fontSize: 22 }} />,
        badge: 'Verified',
    },
    {
        title: 'Sharavathi Backwater Boating',
        shortTitle: 'Boating',
        desc: 'Island cruises, mangrove safari & sunset rides',
        href: '/services/boating',
        matchPrefixes: ['/services/boating'],
        icon: <SailingIcon sx={{ color: '#2563EB', fontSize: 22 }} />,
        badge: 'Popular',
    },
    {
        title: 'Netrani Island Scuba Diving',
        shortTitle: 'Scuba Diving',
        desc: 'PADI certified guides & clear coral reef diving',
        href: '/services/scuba',
        matchPrefixes: ['/services/scuba'],
        icon: <ScubaDivingIcon sx={{ color: '#0D9488', fontSize: 22 }} />,
        badge: 'PADI Cert',
    },
    {
        title: 'Local Travel Guides & Trails',
        shortTitle: 'Local Guides',
        desc: 'Native experts for waterfall treks & temple heritage',
        href: '/services/guide',
        matchPrefixes: ['/services/guide'],
        icon: <HikingIcon sx={{ color: '#D97706', fontSize: 22 }} />,
        badge: 'Native Guides',
    },
    {
        title: 'Custom Tour Packages',
        shortTitle: 'Tour Packages',
        desc: 'All-inclusive Karavali coastal combos & customized itineraries',
        href: '/services/tours',
        matchPrefixes: ['/services/tours'],
        icon: <CardTravelIcon sx={{ color: '#7C3AED', fontSize: 22 }} />,
        badge: 'Best Value',
    },
];

export default function AppLayout({ children, fullWidth = false, noFooterMargin = false }) {
    const { auth, flash, public_branches: publicBranches = [] } = usePage().props;
    const { url = '/' } = usePage();
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';
    const activeCities = [...new Set(publicBranches.map((branch) => branch.city).filter(Boolean))];
    const locationLabel = activeCities.length ? activeCities.join(' & ') : 'Coastal Karnataka';
    const formatBranchPhone = (raw) => {
        const digits = String(raw || '+918660989586').replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) {
            return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
        }
        return raw || '+91 86609 89586';
    };
    const primaryBranchPhone = publicBranches[0]?.phone || '+918660989586';
    const primaryWhatsappDigits = primaryBranchPhone.replace(/\D/g, '') || '918660989586';
    const getBranchDirectionsUrl = (branch) => (
        branch?.google_maps_url
        || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            [branch?.address_line, branch?.city, branch?.state, branch?.pincode].filter(Boolean).join(', ') || locationLabel,
        )}`
    );
    const whatsappGeneralUrl = `https://wa.me/${primaryWhatsappDigits}?text=`
        + encodeURIComponent('Hi GK WhizWheel, I would like to enquire about your travel and rental services.');

    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const isUserMenuOpen = Boolean(userMenuAnchor);

    const [servicesAnchorEl, setServicesAnchorEl] = useState(null);
    const isServicesOpen = Boolean(servicesAnchorEl);

    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setIsScrolled((prev) => {
                if (y > 80) return true;
                if (y < 24) return false;
                return prev;
            });
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleOpenServicesMenu = (event) => {
        setServicesAnchorEl(event.currentTarget);
    };

    const handleCloseServicesMenu = () => {
        setServicesAnchorEl(null);
    };

    const handleOpenUserMenu = (event) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setUserMenuAnchor(null);
    };

    const handleToggleMobileDrawer = () => {
        setMobileDrawerOpen((prev) => !prev);
    };

    const handleCloseMobileDrawer = () => {
        setMobileDrawerOpen(false);
    };

    const handleToggleMobileServices = () => {
        setMobileServicesOpen((prev) => !prev);
    };


    const isServiceLinkActive = (svc) => (
        svc.matchPrefixes.some((prefix) => url === prefix || url.startsWith(`${prefix}/`))
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: isDark ? '#0B1120' : '#F8FAFC', color: isDark ? '#F8FAFC' : '#0F172A', width: '100%', overflowX: 'clip' }}>
            {/* WCAG 2.2 Level A/AA Skip to Main Content Link */}
            <Box
                component="a"
                href="#main-content"
                sx={{
                    position: 'absolute',
                    top: -100,
                    left: 16,
                    bgcolor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    zIndex: 999999,
                    textDecoration: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    transition: 'top 0.2s ease',
                    '&:focus': {
                        top: 16,
                        outline: '3px solid #0F172A',
                        outlineOffset: '2px',
                    },
                }}
            >
                Skip to main content
            </Box>

            {/* Tier 1: Top Utility Bar (1440px Container — Multi-service Coastal Travel Hub) */}
            <Box
                sx={{
                    background: 'linear-gradient(90deg, #050914 0%, #0B1528 50%, #050914 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    py: { xs: 0.65, md: 0.75 },
                    width: '100%',
                }}
            >
                <Box sx={{ ...SITE_CONTAINER_SX, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Stack direction="row" spacing={{ xs: 1, md: 1.75 }} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
                            <LocationOnIcon sx={{ fontSize: 15, color: '#F59E0B', flexShrink: 0 }} />
                            <Typography variant="caption" noWrap sx={{ color: '#E2E8F0', fontWeight: 600, fontSize: { xs: '0.72rem', md: '0.76rem' } }}>
                                {locationLabel}
                            </Typography>
                            <Box
                                component={Link}
                                href="/explore"
                                sx={{
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    alignItems: 'center',
                                    gap: 0.35,
                                    color: '#38BDF8',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    ml: 0.5,
                                    whiteSpace: 'nowrap',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                <ExploreIcon sx={{ fontSize: 13.5 }} /> Explore
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: { xs: 'none', md: 'inline-flex' },
                                alignItems: 'center',
                                gap: 0.6,
                                px: 1.1,
                                py: 0.2,
                                borderRadius: 9999,
                                bgcolor: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                            }}
                        >
                            <VerifiedUserIcon sx={{ fontSize: 13.5, color: '#10B981', flexShrink: 0 }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    display: { xs: 'none', md: 'inline', lg: 'none' },
                                    color: '#FBBF24',
                                    fontWeight: 700,
                                    fontSize: '0.73rem',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Trusted Coastal Travel Hub
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: { xs: 'none', lg: 'inline' },
                                    color: '#FBBF24',
                                    fontWeight: 700,
                                    fontSize: '0.74rem',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Coastal Travel Hub • Rides, Stays & Experiences
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={{ xs: 1.25, md: 2 }} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Box
                            sx={{
                                display: { xs: 'none', lg: 'flex' },
                                alignItems: 'center',
                                gap: 0.45,
                                color: '#34D399',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <AccessTimeIcon sx={{ fontSize: 13.5, color: '#34D399' }} />
                            Open 24/7
                        </Box>
                        <Box
                            component="a"
                            href="tel:+918660989586"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#E2E8F0',
                                textDecoration: 'none',
                                fontSize: { xs: '0.72rem', md: '0.76rem' },
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            <PhoneIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                            +91 8660989586
                        </Box>
                        <Box
                            component="a"
                            href="mailto:contact@whizwheels.in"
                            sx={{
                                display: { xs: 'none', xl: 'flex' },
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#E2E8F0',
                                textDecoration: 'none',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            <EmailIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                            contact@whizwheels.in
                        </Box>
                        <Box
                            component="a"
                            href={whatsappGeneralUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.45,
                                px: { xs: 0.9, md: 1.1 },
                                py: 0.25,
                                borderRadius: 1.5,
                                bgcolor: 'rgba(16, 185, 129, 0.14)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                color: '#34D399',
                                textDecoration: 'none',
                                fontSize: { xs: '0.7rem', md: '0.74rem' },
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.24)' },
                            }}
                        >
                            <WhatsAppIcon sx={{ fontSize: 14 }} />
                            WhatsApp
                        </Box>
                        <Box
                            component={Link}
                            href="/admin/login"
                            sx={{
                                display: { xs: 'none', md: 'inline-flex' },
                                color: '#94A3B8',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            Staff Portal →
                        </Box>
                    </Stack>
                </Box>
            </Box>

            {/* Tier 2 & 3: Sticky Navbar + Service Navigation Bar (1440px Container) */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    width: '100%',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                }}
            >
                <Box sx={SITE_CONTAINER_SX}>
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: { xs: 0.4, md: 0.35 }, minHeight: { xs: 52, md: 58 }, gap: 1 }}>
                        {/* Brand Logo Only */}
                        <Box
                            component={Link}
                            href="/"
                            aria-label="G.K. WhizWheel Home"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                                flexShrink: 0,
                            }}
                        >
                            <Box
                                component="img"
                                src="/images/whizwheel-logo.png"
                                alt="G.K. WhizWheel"
                                sx={{
                                    width: { xs: 175, sm: 200, md: 220 },
                                    maxWidth: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    objectFit: 'contain',
                                    filter: isDark ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))',
                                    transition: 'transform 0.2s ease',
                                    '&:hover': { transform: 'scale(1.02)' },
                                }}
                            />
                        </Box>

                        {/* Desktop Navigation Links & Action Buttons (md and up) */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                            <Button
                                component={Link}
                                href="/"
                                sx={{
                                    color: url === '/' ? '#F59E0B' : (isDark ? '#E2E8F0' : '#1E293B'),
                                    bgcolor: url === '/' ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)') : 'transparent',
                                    fontWeight: url === '/' ? 700 : 600,
                                    fontSize: '0.875rem',
                                    px: 1.6,
                                    py: 0.6,
                                    borderRadius: 2,
                                    '&:hover': { color: '#F59E0B', bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Home
                            </Button>

                            <Button
                                component={Link}
                                href="/about"
                                sx={{
                                    color: url.startsWith('/about') ? '#F59E0B' : (isDark ? '#E2E8F0' : '#1E293B'),
                                    bgcolor: url.startsWith('/about') ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)') : 'transparent',
                                    fontWeight: url.startsWith('/about') ? 700 : 600,
                                    fontSize: '0.875rem',
                                    px: 1.6,
                                    py: 0.6,
                                    borderRadius: 2,
                                    '&:hover': { color: '#F59E0B', bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                About
                            </Button>

                            {/* Desktop 2-Column Services Mega Menu Dropdown */}
                            <Button
                                id="desktop-services-mega-menu-btn"
                                aria-controls={isServicesOpen ? 'desktop-services-popover' : undefined}
                                aria-haspopup="true"
                                aria-expanded={isServicesOpen ? 'true' : undefined}
                                onClick={handleOpenServicesMenu}
                                endIcon={
                                    <KeyboardArrowDownIcon
                                        sx={{
                                            fontSize: 18,
                                            transition: 'transform 0.2s ease',
                                            transform: isServicesOpen ? 'rotate(180deg)' : 'none',
                                        }}
                                    />
                                }
                                sx={{
                                    color: (url.startsWith('/services') || url.startsWith('/bikes')) ? '#F59E0B' : (isDark ? '#E2E8F0' : '#1E293B'),
                                    bgcolor: (url.startsWith('/services') || url.startsWith('/bikes')) ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)') : 'transparent',
                                    fontWeight: (url.startsWith('/services') || url.startsWith('/bikes')) ? 750 : 600,
                                    fontSize: '0.875rem',
                                    px: 1.6,
                                    py: 0.6,
                                    borderRadius: 2,
                                    '&:hover': { color: '#F59E0B', bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)' },
                                    '&:focus-visible': { outline: '2px solid #F59E0B' },
                                }}
                            >
                                Services
                            </Button>

                            <Button
                                component={Link}
                                href="/blog"
                                sx={{
                                    color: url.startsWith('/blog') ? '#F59E0B' : (isDark ? '#E2E8F0' : '#1E293B'),
                                    bgcolor: url.startsWith('/blog') ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)') : 'transparent',
                                    fontWeight: url.startsWith('/blog') ? 700 : 600,
                                    fontSize: '0.875rem',
                                    px: 1.6,
                                    py: 0.6,
                                    borderRadius: 2,
                                    '&:hover': { color: '#F59E0B', bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Guides
                            </Button>

                            <Button
                                component={Link}
                                href="/contact"
                                sx={{
                                    color: url.startsWith('/contact') ? '#F59E0B' : (isDark ? '#E2E8F0' : '#1E293B'),
                                    bgcolor: url.startsWith('/contact') ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)') : 'transparent',
                                    fontWeight: url.startsWith('/contact') ? 700 : 600,
                                    fontSize: '0.875rem',
                                    px: 1.6,
                                    py: 0.6,
                                    borderRadius: 2,
                                    '&:hover': { color: '#F59E0B', bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Contact
                            </Button>

                            {/* Dark / Light Theme Toggle Switch */}
                            <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                                <IconButton
                                    onClick={toggleColorMode}
                                    aria-label="Toggle dark or light theme"
                                    size="small"
                                    sx={{
                                        p: 0.9,
                                        borderRadius: 2,
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                        color: isDark ? '#FBBF24' : '#0F172A',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                                            transform: 'scale(1.06)',
                                        },
                                    }}
                                >
                                    {isDark ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
                                </IconButton>
                            </Tooltip>

                            {auth?.user ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Button
                                        onClick={handleOpenUserMenu}
                                        aria-controls={isUserMenuOpen ? 'user-account-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={isUserMenuOpen ? 'true' : undefined}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            textTransform: 'none',
                                            py: 0.6,
                                            px: 1.5,
                                            borderRadius: 2.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                                            color: isDark ? '#F8FAFC' : '#0F172A',
                                            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                                borderColor: '#F59E0B',
                                            },
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: '#F59E0B',
                                                color: '#0F172A',
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
                                            }}
                                        >
                                            {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                                        </Avatar>
                                        <Box sx={{ textAlign: 'left', mr: 0.25 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.875rem',
                                                    lineHeight: 1.2,
                                                    maxWidth: 130,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                                }}
                                            >
                                                {auth.user.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'block',
                                                    fontSize: '0.7rem',
                                                    color: isDark ? '#94A3B8' : '#64748B',
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {auth.user.role === 'customer' ? 'Customer Account' : 'Staff / Admin'}
                                            </Typography>
                                        </Box>
                                        <KeyboardArrowDownIcon
                                            sx={{
                                                fontSize: 18,
                                                color: isDark ? '#94A3B8' : '#64748B',
                                                transition: 'transform 0.2s ease',
                                                transform: isUserMenuOpen ? 'rotate(180deg)' : 'none',
                                            }}
                                        />
                                    </Button>

                                    {/* User Account Dropdown Menu */}
                                    <Menu
                                        id="user-account-menu"
                                        anchorEl={userMenuAnchor}
                                        open={isUserMenuOpen}
                                        onClose={handleCloseUserMenu}
                                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                        PaperProps={{
                                            elevation: 8,
                                            sx: {
                                                minWidth: 250,
                                                maxWidth: 290,
                                                borderRadius: 3,
                                                mt: 1.2,
                                                p: 0.5,
                                                bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                                                backgroundImage: 'none',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                                boxShadow: isDark
                                                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)'
                                                    : '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
                                            },
                                        }}
                                    >
                                        {/* User Summary Header */}
                                        <Box sx={{ px: 2, py: 1.5 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
                                                {auth.user.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mt: 0.3, wordBreak: 'break-all' }}>
                                                {auth.user.email || auth.user.phone}
                                            </Typography>
                                            <Box sx={{ mt: 0.8 }}>
                                                <Chip
                                                    size="small"
                                                    label={auth.user.role === 'customer' ? 'Verified Customer' : 'Staff / Admin'}
                                                    color={auth.user.role === 'customer' ? 'warning' : 'primary'}
                                                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 0.8, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

                                        {/* My Bookings */}
                                        <MenuItem
                                            component={Link}
                                            href="/account"
                                            sx={{
                                                borderRadius: 2,
                                                py: 1,
                                                px: 1.5,
                                                gap: 1.5,
                                                color: isDark ? '#E2E8F0' : '#1E293B',
                                                '&:hover': {
                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                                    color: '#F59E0B',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 28, color: '#F59E0B' }}>
                                                <ReceiptLongIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="My Bookings"
                                                secondary="View reservations & RC"
                                                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8' }}
                                            />
                                        </MenuItem>

                                        {/* KYC Documents */}
                                        <MenuItem
                                            component={Link}
                                            href="/account/kyc"
                                            sx={{
                                                borderRadius: 2,
                                                py: 1,
                                                px: 1.5,
                                                gap: 1.5,
                                                color: isDark ? '#E2E8F0' : '#1E293B',
                                                '&:hover': {
                                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                                                    color: '#10B981',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 28, color: '#10B981' }}>
                                                <VerifiedUserIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="KYC Documents"
                                                secondary="Driving License & Aadhaar"
                                                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8' }}
                                            />
                                        </MenuItem>

                                        {/* Staff Console if admin or staff */}
                                        {auth.user.role !== 'customer' && (
                                            <MenuItem
                                                component={Link}
                                                href="/admin/dashboard"
                                                sx={{
                                                    borderRadius: 2,
                                                    py: 1,
                                                    px: 1.5,
                                                    gap: 1.5,
                                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                                    '&:hover': {
                                                        bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                                        color: '#3B82F6',
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 28, color: '#3B82F6' }}>
                                                    <AdminPanelSettingsIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Staff Console"
                                                    secondary="Manage fleet & stores"
                                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }}
                                                    secondaryTypographyProps={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8' }}
                                                />
                                            </MenuItem>
                                        )}

                                        <Divider sx={{ my: 0.8, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }} />

                                        {/* Logout */}
                                        <MenuItem
                                            onClick={() => {
                                                handleCloseUserMenu();
                                                router.post('/logout', {}, {
                                                    onFinish: () => {
                                                        window.location.href = '/';
                                                    },
                                                });
                                            }}
                                            sx={{
                                                width: '100%',
                                                borderRadius: 2,
                                                py: 1,
                                                px: 1.5,
                                                gap: 1.5,
                                                color: '#EF4444',
                                                '&:hover': {
                                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#DC2626',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 28, color: '#EF4444' }}>
                                                <LogoutIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Sign Out"
                                                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }}
                                            />
                                        </MenuItem>
                                    </Menu>

                                    {/* Rent a Bike quick action button */}
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="medium"
                                        component={Link}
                                        href="/services/bikes"
                                        sx={{
                                            fontWeight: 800,
                                            px: 2.5,
                                            py: 0.8,
                                            boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
                                            borderRadius: 2.5,
                                        }}
                                    >
                                        Rent a Bike
                                    </Button>
                                </Box>
                            ) : (
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Button
                                        component="a"
                                        href="tel:+918660989586"
                                        size="small"
                                        startIcon={<PhoneIcon />}
                                        sx={{
                                            display: { xs: 'none', lg: 'inline-flex' },
                                            color: isDark ? '#FBBF24' : '#D97706',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        Call Now
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/login"
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                                        sx={{
                                            color: isDark ? '#F1F5F9' : '#0F172A',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            px: 2,
                                            py: 0.8,
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: '#F59E0B',
                                                color: '#F59E0B',
                                                bgcolor: 'rgba(245, 158, 11, 0.08)',
                                            },
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="medium"
                                        component={Link}
                                        href="/services/bikes"
                                        sx={{
                                            fontWeight: 800,
                                            px: 2.75,
                                            py: 0.9,
                                            boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
                                            borderRadius: 2,
                                        }}
                                    >
                                        Rent a Bike
                                    </Button>
                                </Stack>
                            )}
                        </Box>

                        {/* Mobile Header Controls (xs and sm, below md) - ONLY Menu Button per user requirement */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                            <IconButton
                                onClick={handleToggleMobileDrawer}
                                aria-label="Open mobile navigation menu"
                                aria-expanded={mobileDrawerOpen}
                                sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    border: isDark ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #CBD5E1',
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                    color: isDark ? '#FBBF24' : '#B45309',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.16)',
                                    },
                                    '&:focus-visible': { outline: '3px solid #F59E0B', outlineOffset: '2px' },
                                }}
                            >
                                <MenuIcon sx={{ fontSize: 26 }} />
                            </IconButton>
                        </Box>
                    </Toolbar>
                </Box>

                {/* Tier 3: Service Bar below Navbar (hidden once page scrolls so sticky header stays compact) */}
                <Collapse in={!isScrolled} timeout={200}>
                    <Box
                        component="nav"
                        aria-label="Services navigation"
                        sx={{
                            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            bgcolor: isDark ? 'rgba(7, 13, 25, 0.65)' : '#F8FAFC',
                        }}
                    >
                        <Box
                            sx={{
                                ...SITE_CONTAINER_SX,
                                py: 0.75,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: { xs: 'flex-start', lg: 'space-between' },
                                gap: { xs: 0.75, lg: 1 },
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' },
                            }}
                        >
                            <Link
                                href="/services"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '9999px',
                                    fontSize: '13px',
                                    fontWeight: url === '/services' ? 800 : 600,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    textDecoration: 'none',
                                    color: url === '/services' ? '#D97706' : (isDark ? '#E2E8F0' : '#334155'),
                                    backgroundColor: url === '/services'
                                        ? (isDark ? 'rgba(217, 119, 6, 0.16)' : '#FEF3C7')
                                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF'),
                                    border: `1px solid ${url === '/services' ? 'rgba(217, 119, 6, 0.45)' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0')}`,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ExploreIcon sx={{ fontSize: 17 }} />
                                <span>All Services</span>
                            </Link>
                            {servicesList.map((svc) => {
                                const active = isServiceLinkActive(svc);
                                return (
                                    <Link
                                        key={svc.href}
                                        href={svc.href}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '9999px',
                                            fontSize: '13px',
                                            fontWeight: active ? 800 : 600,
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                            textDecoration: 'none',
                                            color: active ? '#D97706' : (isDark ? '#CBD5E1' : '#334155'),
                                            backgroundColor: active
                                                ? (isDark ? 'rgba(217, 119, 6, 0.16)' : '#FEF3C7')
                                                : 'transparent',
                                            border: `1px solid ${active ? 'rgba(217, 119, 6, 0.45)' : 'transparent'}`,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: active ? '#D97706' : (isDark ? '#94A3B8' : '#64748B'),
                                                '& svg': { fontSize: 17 },
                                            }}
                                        >
                                            {svc.icon}
                                        </Box>
                                        <span>{svc.shortTitle}</span>
                                    </Link>
                                );
                            })}
                        </Box>
                    </Box>
                </Collapse>
            </AppBar>

            {/* Desktop 2-Column Services Mega Menu Popover */}
            <Popover
                id="desktop-services-popover"
                open={isServicesOpen}
                anchorEl={servicesAnchorEl}
                onClose={handleCloseServicesMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1.5,
                            width: 720,
                            maxWidth: '92vw',
                            p: 2.5,
                            borderRadius: 3.5,
                            bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                            boxShadow: isDark
                                ? '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)'
                                : '0 25px 50px -12px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(0,0,0,0.05)',
                            backgroundImage: 'none',
                        },
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, mb: 2, borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 850, color: isDark ? '#FBBF24' : '#B45309', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.76rem' }}>
                            Coastal Karnataka Travel & Rental Services
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: '0.82rem', mt: 0.2 }}>
                            Verified local fleet, stay accommodations & water adventure packages
                        </Typography>
                    </Box>
                    <Chip
                        label={`${servicesList.length} Services`}
                        size="small"
                        sx={{
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            color: isDark ? '#34D399' : '#047857',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                    />
                </Box>

                {/* 2-Column Desktop Grid */}
                <Grid container spacing={1.5}>
                    {servicesList.map((svc, idx) => (
                        <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                            <Box
                                component={Link}
                                href={svc.href}
                                onClick={handleCloseServicesMenu}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                    p: 1.4,
                                    borderRadius: 2.5,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    transition: 'all 0.18s ease',
                                    border: '1px solid transparent',
                                    bgcolor: url.startsWith(svc.href)
                                        ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.07)')
                                        : 'transparent',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F8FAFC',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:focus-visible': {
                                        outline: '2px solid #F59E0B',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {svc.icon}
                                </Box>
                                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem', color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.25 }}>
                                            {svc.title}
                                        </Typography>
                                        {svc.badge && (
                                            <Chip
                                                label={svc.badge}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: isDark ? '#FBBF24' : '#92400E',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mt: 0.3, lineHeight: 1.35 }}>
                                        {svc.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Mega Menu Footer Banner */}
                <Box
                    sx={{
                        mt: 2,
                        pt: 1.5,
                        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                    }}
                >
                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 600 }}>
                        ⚡ 24/7 On-Demand Booking • Honnavar (Palya Main Rd) &amp; Murudeshwar (Temple Main Rd)
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            component={Link}
                            href="/blog"
                            onClick={handleCloseServicesMenu}
                            size="small"
                            sx={{
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                color: isDark ? '#38BDF8' : '#0284C7',
                                textTransform: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            Travel Guides &amp; Blogs →
                        </Button>
                        <Button
                            component={Link}
                            href="/services"
                            onClick={handleCloseServicesMenu}
                            size="small"
                            sx={{
                                fontWeight: 850,
                                fontSize: '0.8rem',
                                color: isDark ? '#FBBF24' : '#B45309',
                                textTransform: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            Explore All 7 Services Hub →
                        </Button>
                    </Stack>
                </Box>
            </Popover>

            {/* Right-Side Mobile Drawer Menu Window */}
            <Drawer
                anchor="right"
                open={mobileDrawerOpen}
                onClose={handleCloseMobileDrawer}
                PaperProps={{
                    sx: {
                        width: { xs: '86vw', sm: 380 },
                        maxWidth: 400,
                        bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        backgroundImage: 'none',
                        borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                        boxShadow: isDark
                            ? '-10px 0 30px rgba(0,0,0,0.7)'
                            : '-10px 0 30px rgba(15, 23, 42, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Drawer Header */}
                <Box
                    sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box
                        component={Link}
                        href="/"
                        onClick={handleCloseMobileDrawer}
                        aria-label="G.K. WhizWheel Home"
                        sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <Box
                            component="img"
                            src="/images/whizwheel-logo.png"
                            alt="G.K. WhizWheel"
                            sx={{ width: 200, maxWidth: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                        />
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                            onClick={toggleColorMode}
                            aria-label="Toggle dark or light theme"
                            size="small"
                            sx={{
                                p: 0.8,
                                borderRadius: 2,
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                color: isDark ? '#FBBF24' : '#0F172A',
                            }}
                        >
                            {isDark ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
                        </IconButton>
                        <IconButton
                            onClick={handleCloseMobileDrawer}
                            aria-label="Close navigation menu"
                            size="small"
                            sx={{
                                p: 0.8,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                color: isDark ? '#CBD5E1' : '#475569',
                                '&:hover': {
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                },
                                '&:focus-visible': { outline: '2px solid #F59E0B' },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Stack>
                </Box>

                {/* Drawer Scrollable Content */}
                <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>
                    {/* User Profile / Quick Auth Bar */}
                    {auth?.user ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: 2.5,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#F8FAFC',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                borderRadius: 3,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#F59E0B',
                                        color: '#0F172A',
                                        fontWeight: 900,
                                    }}
                                >
                                    {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', noWrap: true }}>
                                        {auth.user.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', noWrap: true }}>
                                        {auth.user.email || auth.user.phone}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={auth.user.role === 'customer' ? 'Verified' : 'Staff'}
                                    size="small"
                                    color={auth.user.role === 'customer' ? 'warning' : 'primary'}
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                                />
                            </Box>

                            <Stack spacing={1}>
                                <Button
                                    component={Link}
                                    href="/account"
                                    onClick={handleCloseMobileDrawer}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ReceiptLongIcon sx={{ color: '#F59E0B' }} />}
                                    fullWidth
                                    sx={{
                                        justifyContent: 'flex-start',
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                        color: isDark ? '#E2E8F0' : '#1E293B',
                                        fontWeight: 700,
                                    }}
                                >
                                    My Bookings
                                </Button>
                                <Button
                                    component={Link}
                                    href="/account/kyc"
                                    onClick={handleCloseMobileDrawer}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<VerifiedUserIcon sx={{ color: '#10B981' }} />}
                                    fullWidth
                                    sx={{
                                        justifyContent: 'flex-start',
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                        color: isDark ? '#E2E8F0' : '#1E293B',
                                        fontWeight: 700,
                                    }}
                                >
                                    KYC Verification
                                </Button>
                                {auth.user.role !== 'customer' && (
                                    <Button
                                        component={Link}
                                        href="/admin/dashboard"
                                        onClick={handleCloseMobileDrawer}
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AdminPanelSettingsIcon sx={{ color: '#3B82F6' }} />}
                                        fullWidth
                                        sx={{
                                            justifyContent: 'flex-start',
                                            borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                            color: isDark ? '#E2E8F0' : '#1E293B',
                                            fontWeight: 700,
                                        }}
                                    >
                                        Staff Console
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        handleCloseMobileDrawer();
                                        router.post('/logout', {}, {
                                            onFinish: () => { window.location.href = '/'; },
                                        });
                                    }}
                                    size="small"
                                    startIcon={<LogoutIcon sx={{ color: '#EF4444' }} />}
                                    fullWidth
                                    sx={{
                                        justifyContent: 'flex-start',
                                        color: '#EF4444',
                                        fontWeight: 700,
                                    }}
                                >
                                    Sign Out
                                </Button>
                            </Stack>
                        </Paper>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: 2.5,
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FDE68A',
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 850, color: isDark ? '#FBBF24' : '#92400E', mb: 0.5 }}>
                                Explore and book our services
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                                Sign in to manage bookings, or browse bikes, cabs, activities and stays.
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    component={Link}
                                    href="/login"
                                    onClick={handleCloseMobileDrawer}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    sx={{
                                        fontWeight: 800,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                    }}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    component={Link}
                                    href="/services/bikes"
                                    onClick={handleCloseMobileDrawer}
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    fullWidth
                                    sx={{
                                        fontWeight: 850,
                                        bgcolor: '#F59E0B',
                                        color: '#0F172A',
                                        '&:hover': { bgcolor: '#D97706' },
                                    }}
                                >
                                    Rent a Bike
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                    {/* Navigation Menu List */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: isDark ? '#94A3B8' : '#64748B',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            px: 1,
                            mb: 1,
                            display: 'block',
                        }}
                    >
                        Navigation
                    </Typography>

                    <List disablePadding sx={{ mb: 2.5 }}>
                        {/* Home Link */}
                        <ListItem disablePadding sx={{ mb: 0.6 }}>
                            <ListItemButton
                                component={Link}
                                href="/"
                                onClick={handleCloseMobileDrawer}
                                sx={{
                                    py: 1.1,
                                    px: 1.5,
                                    borderRadius: 2.5,
                                    bgcolor: url === '/'
                                        ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                                        : 'transparent',
                                    border: url === '/'
                                        ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)')
                                        : '1px solid transparent',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <HomeIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Home"
                                    primaryTypographyProps={{
                                        fontWeight: url === '/' ? 850 : 650,
                                        fontSize: '0.92rem',
                                        color: url === '/' ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#E2E8F0' : '#1E293B'),
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* About Link */}
                        <ListItem disablePadding sx={{ mb: 0.6 }}>
                            <ListItemButton
                                component={Link}
                                href="/about"
                                onClick={handleCloseMobileDrawer}
                                sx={{
                                    py: 1.1,
                                    px: 1.5,
                                    borderRadius: 2.5,
                                    bgcolor: url.startsWith('/about')
                                        ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                                        : 'transparent',
                                    border: url.startsWith('/about')
                                        ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)')
                                        : '1px solid transparent',
                                    '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <InfoIcon fontSize="small" sx={{ color: '#10B981' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="About"
                                    primaryTypographyProps={{
                                        fontWeight: url.startsWith('/about') ? 850 : 650,
                                        fontSize: '0.92rem',
                                        color: url.startsWith('/about') ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#E2E8F0' : '#1E293B'),
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* Services Collapsible Group */}
                        <ListItem disablePadding sx={{ mb: 0.6 }}>
                            <ListItemButton
                                onClick={handleToggleMobileServices}
                                sx={{
                                    py: 1.1,
                                    px: 1.5,
                                    borderRadius: 2.5,
                                    bgcolor: (url.startsWith('/services') || url.startsWith('/bikes'))
                                        ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                                        : 'transparent',
                                    border: (url.startsWith('/services') || url.startsWith('/bikes'))
                                        ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)')
                                        : '1px solid transparent',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <ExploreIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Services"
                                    primaryTypographyProps={{
                                        fontWeight: (url.startsWith('/services') || url.startsWith('/bikes')) ? 850 : 650,
                                        fontSize: '0.92rem',
                                        color: (url.startsWith('/services') || url.startsWith('/bikes'))
                                            ? (isDark ? '#FBBF24' : '#B45309')
                                            : (isDark ? '#E2E8F0' : '#1E293B'),
                                    }}
                                />
                                <Chip
                                    label={`${servicesList.length} Services`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        mr: 1,
                                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                        color: isDark ? '#34D399' : '#047857',
                                    }}
                                />
                                <KeyboardArrowDownIcon
                                    sx={{
                                        fontSize: 20,
                                        color: isDark ? '#94A3B8' : '#64748B',
                                        transition: 'transform 0.2s ease',
                                        transform: mobileServicesOpen ? 'rotate(180deg)' : 'none',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* Collapsible 7 Services List */}
                        <Collapse in={mobileServicesOpen} timeout="auto" unmountOnExit>
                            <Box
                                sx={{
                                    pl: 2,
                                    pr: 0.5,
                                    py: 0.5,
                                    mb: 1,
                                    ml: 2,
                                    borderLeft: isDark ? '2px solid rgba(245, 158, 11, 0.3)' : '2px solid rgba(217, 119, 6, 0.3)',
                                }}
                            >
                                {servicesList.map((svc, sIdx) => (
                                    <ListItemButton
                                        key={sIdx}
                                        component={Link}
                                        href={svc.href}
                                        onClick={handleCloseMobileDrawer}
                                        sx={{
                                            py: 0.8,
                                            px: 1.2,
                                            mb: 0.3,
                                            borderRadius: 2,
                                            bgcolor: url.startsWith(svc.href)
                                                ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)')
                                                : 'transparent',
                                            '&:hover': {
                                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            {svc.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={svc.title}
                                            secondary={svc.badge}
                                            primaryTypographyProps={{
                                                fontWeight: url.startsWith(svc.href) ? 800 : 600,
                                                fontSize: '0.84rem',
                                                color: url.startsWith(svc.href)
                                                    ? (isDark ? '#FBBF24' : '#B45309')
                                                    : (isDark ? '#F1F5F9' : '#1E293B'),
                                            }}
                                            secondaryTypographyProps={{
                                                fontSize: '0.7rem',
                                                color: isDark ? '#94A3B8' : '#64748B',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </ListItemButton>
                                ))}
                            </Box>
                        </Collapse>

                        {/* Travel Guides Link */}
                        <ListItem disablePadding sx={{ mb: 0.6 }}>
                            <ListItemButton
                                component={Link}
                                href="/blog"
                                onClick={handleCloseMobileDrawer}
                                sx={{
                                    py: 1.1,
                                    px: 1.5,
                                    borderRadius: 2.5,
                                    bgcolor: url.startsWith('/blog')
                                        ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                                        : 'transparent',
                                    border: url.startsWith('/blog')
                                        ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)')
                                        : '1px solid transparent',
                                    '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <ExploreIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Travel Guides & Blogs"
                                    primaryTypographyProps={{
                                        fontWeight: url.startsWith('/blog') ? 850 : 650,
                                        fontSize: '0.92rem',
                                        color: url.startsWith('/blog')
                                            ? (isDark ? '#FBBF24' : '#B45309')
                                            : (isDark ? '#E2E8F0' : '#1E293B'),
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* Contact Link */}
                        <ListItem disablePadding sx={{ mb: 0.6 }}>
                            <ListItemButton
                                component={Link}
                                href="/contact"
                                onClick={handleCloseMobileDrawer}
                                sx={{
                                    py: 1.1,
                                    px: 1.5,
                                    borderRadius: 2.5,
                                    bgcolor: url.startsWith('/contact')
                                        ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)')
                                        : 'transparent',
                                    border: url.startsWith('/contact')
                                        ? (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)')
                                        : '1px solid transparent',
                                    '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <LocationOnIcon fontSize="small" sx={{ color: '#EF4444' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Contact"
                                    primaryTypographyProps={{
                                        fontWeight: url.startsWith('/contact') ? 850 : 650,
                                        fontSize: '0.92rem',
                                        color: url.startsWith('/contact') ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#E2E8F0' : '#1E293B'),
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    </List>

                    {/* 24/7 Desk Hotline Box */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                            border: isDark ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #BBF7D0',
                        }}
                    >
                        <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#15803D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.5 }}>
                            Our active service branches
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 700, mb: 1.5, fontSize: '0.84rem' }}>
                            {locationLabel} · Contact us to arrange pickup and services.
                        </Typography>

                        <Stack spacing={1}>
                            <Button
                                component="a"
                                href="tel:+918660989586"
                                variant="contained"
                                color="warning"
                                size="small"
                                startIcon={<PhoneIcon />}
                                fullWidth
                                sx={{
                                    fontWeight: 850,
                                    bgcolor: '#F59E0B',
                                    color: '#0F172A',
                                    '&:hover': { bgcolor: '#D97706' },
                                }}
                            >
                                Call +91 8660989586
                            </Button>
                            <Button
                                component="a"
                                href={whatsappGeneralUrl}
                                target="_blank"
                                rel="noreferrer"
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<WhatsAppIcon />}
                                fullWidth
                                sx={{
                                    fontWeight: 850,
                                    bgcolor: '#16A34A',
                                    '&:hover': { bgcolor: '#15803D' },
                                }}
                            >
                                WhatsApp Booking
                            </Button>
                        </Stack>
                    </Box>
                </Box>

                {/* Drawer Footer Theme Switcher */}
                <Box
                    sx={{
                        p: 2,
                        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isDark ? <DarkModeIcon sx={{ fontSize: 18, color: '#FBBF24' }} /> : <LightModeIcon sx={{ fontSize: 18, color: '#F59E0B' }} />}
                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#E2E8F0' : '#1E293B', fontSize: '0.85rem' }}>
                            {isDark ? 'Dark Theme' : 'Light Theme'}
                        </Typography>
                    </Box>
                    <Button
                        onClick={toggleColorMode}
                        variant="outlined"
                        size="small"
                        sx={{
                            fontWeight: 750,
                            fontSize: '0.75rem',
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                            color: isDark ? '#FBBF24' : '#0F172A',
                        }}
                    >
                        Switch to {isDark ? 'Light' : 'Dark'}
                    </Button>
                </Box>
            </Drawer>

            {/* Flash notification banner */}
            {flash?.success && (
                <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mt: 2, width: '100%' }}>
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                        {flash.success}
                    </Alert>
                </Box>
            )}
            {flash?.error && (
                <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mt: 2, width: '100%' }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {flash.error}
                    </Alert>
                </Box>
            )}

            {/* Main Content Area — Page controls internal container widths */}
            <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, width: '100%', outline: 'none', pb: noFooterMargin ? 0 : { xs: 8, md: 0 } }}>
                {children}
            </Box>

            {/* Clean Editorial Coastal Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: '#0A0F1C',
                    color: '#CBD5E1',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: { xs: 5.5, md: 7 },
                    pb: { xs: 11, md: 4.5 },
                    mt: noFooterMargin ? 0 : { xs: 5, md: 6 },
                    width: '100%',
                }}
            >
                <Box sx={SITE_CONTAINER_SX}>
                    <Grid container spacing={{ xs: 4, md: 4.5 }} sx={{ mb: { xs: 4.5, md: 5.5 } }}>
                        {/* Brand Overview & Direct Support */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Box
                                component={Link}
                                href="/"
                                aria-label="G.K. WhizWheel Home"
                                sx={{ display: 'inline-block', textDecoration: 'none', mb: 2 }}
                            >
                                <Box
                                    component="img"
                                    src="/images/whizwheel-logo.png"
                                    alt="G.K. WhizWheel"
                                    sx={{ height: { xs: 78, sm: 88, md: 96 }, width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' }}
                                />
                            </Box>

                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, mb: 2.25, maxWidth: 350, fontSize: '0.88rem' }}>
                                Coastal Karnataka’s 24/7 travel desk for rental scooters, private AC cabs, Sharavathi boating, Netrani scuba diving, and riverfront homestays across {locationLabel}.
                            </Typography>

                            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mb: 2.75 }}>
                                <Box
                                    component="a"
                                    href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.6,
                                        color: '#FBBF24',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' },
                                    }}
                                >
                                    <StarIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                                    5.0 on Google (324+ Reviews)
                                </Box>
                                <Box component="span" sx={{ color: '#334155' }}>•</Box>
                                <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700, fontSize: '0.78rem' }}>
                                    Zero Deposit Online
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                                <Button
                                    variant="contained"
                                    size="small"
                                    component="a"
                                    href={whatsappGeneralUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        bgcolor: '#10B981',
                                        color: '#052E16',
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        fontSize: '0.82rem',
                                        borderRadius: 2,
                                        px: 2.1,
                                        py: 0.75,
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: '#34D399', boxShadow: 'none' },
                                    }}
                                >
                                    WhatsApp 24/7
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={`tel:${primaryBranchPhone}`}
                                    startIcon={<PhoneIcon sx={{ fontSize: 15, color: '#F59E0B' }} />}
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.18)',
                                        color: '#F8FAFC',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontSize: '0.82rem',
                                        borderRadius: 2,
                                        px: 2.1,
                                        py: 0.75,
                                        '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                    }}
                                >
                                    Call Desk
                                </Button>
                            </Stack>
                        </Grid>

                        {/* Services Navigation */}
                        <Grid size={{ xs: 6, sm: 3, lg: 2 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.04em', mb: 2 }}
                            >
                                Services
                            </Typography>
                            <Stack spacing={1.2}>
                                {[
                                    { label: 'Bikes & Scooters', href: '/services/bikes' },
                                    { label: 'Coastal AC Cabs', href: '/services/cabs' },
                                    { label: 'Homestays', href: '/services/homestays' },
                                    { label: 'Sharavathi Boating', href: '/services/boating' },
                                    { label: 'Netrani Scuba', href: '/services/scuba' },
                                    { label: 'Local Guides', href: '/services/guide' },
                                    { label: 'Custom Tours', href: '/services/tours' },
                                ].map((item) => (
                                    <Typography
                                        key={item.href}
                                        component={Link}
                                        href={item.href}
                                        variant="body2"
                                        sx={{
                                            color: '#94A3B8',
                                            textDecoration: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            transition: 'color 0.15s ease',
                                            '&:hover': { color: '#FBBF24' },
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                ))}
                            </Stack>
                        </Grid>

                        {/* Explore & Customer Portal */}
                        <Grid size={{ xs: 6, sm: 3, lg: 2 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.04em', mb: 2 }}
                            >
                                Company
                            </Typography>
                            <Stack spacing={1.2}>
                                {[
                                    { label: 'All Services Hub', href: '/services' },
                                    { label: 'Travel Guides & Blogs', href: '/blog' },
                                    { label: 'Explore Places', href: '/explore' },
                                    { label: 'How It Works', href: '/how-it-works' },
                                    { label: 'My Bookings', href: '/account' },
                                    { label: 'Digital KYC', href: '/account/kyc' },
                                    { label: 'About Us', href: '/about' },
                                    { label: 'Contact Us', href: '/contact' },
                                ].map((item) => (
                                    <Typography
                                        key={item.href}
                                        component={Link}
                                        href={item.href}
                                        variant="body2"
                                        sx={{
                                            color: '#94A3B8',
                                            textDecoration: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            transition: 'color 0.15s ease',
                                            '&:hover': { color: '#FBBF24' },
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                ))}
                            </Stack>
                        </Grid>

                        {/* Unified 2-Branch Dock */}
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.04em' }}
                                >
                                    Pickup &amp; Return Branches
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700, fontSize: '0.74rem' }}>
                                    ● Open 24/7
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    overflow: 'hidden',
                                }}
                            >
                                {publicBranches.slice(0, 2).map((branch, idx) => {
                                    const branchPhone = branch.phone || '+918660989586';
                                    const branchAddress = [branch.address_line, branch.city, branch.pincode].filter(Boolean).join(', ');
                                    const accentColor = idx === 0 ? '#F59E0B' : '#10B981';

                                    return (
                                        <Box
                                            key={branch.id}
                                            sx={{
                                                p: 2,
                                                borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.07)' : 'none',
                                                borderLeft: `3px solid ${accentColor}`,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.45 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem' }}>
                                                    {branch.city || branch.name} Branch
                                                </Typography>
                                                <Typography
                                                    component={Link}
                                                    href={`/bike-rentals/branches/${branch.id}/${branch.slug}`}
                                                    variant="caption"
                                                    sx={{
                                                        color: '#FBBF24',
                                                        fontWeight: 700,
                                                        textDecoration: 'none',
                                                        whiteSpace: 'nowrap',
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    View Fleet →
                                                </Typography>
                                            </Box>

                                            {branchAddress && (
                                                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.45, mb: 0.85 }}>
                                                    {branchAddress}
                                                </Typography>
                                            )}

                                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} flexWrap="wrap">
                                                <Typography
                                                    component="a"
                                                    href={`tel:${branchPhone}`}
                                                    variant="caption"
                                                    sx={{
                                                        color: '#E2E8F0',
                                                        fontWeight: 700,
                                                        textDecoration: 'none',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.55,
                                                        whiteSpace: 'nowrap',
                                                        '&:hover': { color: '#FBBF24' },
                                                    }}
                                                >
                                                    <PhoneIcon sx={{ fontSize: 13, color: accentColor }} />
                                                    {formatBranchPhone(branchPhone)}
                                                </Typography>
                                                <Typography
                                                    component="a"
                                                    href={getBranchDirectionsUrl(branch)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    variant="caption"
                                                    sx={{
                                                        color: '#38BDF8',
                                                        fontWeight: 700,
                                                        textDecoration: 'none',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.35,
                                                        whiteSpace: 'nowrap',
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    <DirectionsIcon sx={{ fontSize: 13 }} />
                                                    Google Maps ↗
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Grounded Bottom Legal & Email Bar */}
                    <Box
                        sx={{
                            pt: 3,
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: { xs: 'center', md: 'left' } }}>
                            © {new Date().getFullYear()} GK WhizWheels · {locationLabel}, Karnataka
                        </Typography>

                        <Stack direction="row" spacing={{ xs: 2, sm: 3 }} flexWrap="wrap" justifyContent="center" alignItems="center">
                            <Typography
                                component="a"
                                href="mailto:contact@whizwheels.in"
                                variant="caption"
                                sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                            >
                                contact@whizwheels.in
                            </Typography>
                            <Typography component={Link} href="/terms" variant="caption" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FBBF24' } }}>
                                Terms &amp; Policies
                            </Typography>
                            <Typography component={Link} href="/privacy" variant="caption" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FBBF24' } }}>
                                Privacy Policy
                            </Typography>
                            <Typography component={Link} href="/admin/login" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#FBBF24' } }}>
                                Staff Login
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* Mobile Fixed Quick-Action Bottom Dock */}
            <Box
                component="nav"
                aria-label="Mobile Quick Actions"
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1200,
                    bgcolor: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(16px)',
                    borderTop: '1px solid rgba(245, 158, 11, 0.3)',
                    boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
                    py: 0.8,
                    px: 1,
                    justifyContent: 'space-around',
                    alignItems: 'center',
                }}
            >
                <Button
                    component="a"
                    href={`tel:${primaryBranchPhone}`}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: '#E2E8F0',
                        minWidth: 64,
                        py: 0.5,
                        px: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { color: '#F59E0B', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    }}
                >
                    <PhoneIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 800, mt: 0.2 }}>
                        Call 24/7
                    </Typography>
                </Button>

                <Button
                    component="a"
                    href={whatsappGeneralUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: '#E2E8F0',
                        minWidth: 64,
                        py: 0.5,
                        px: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { color: '#10B981', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    }}
                >
                    <WhatsAppIcon sx={{ fontSize: 20, color: '#10B981' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 800, mt: 0.2 }}>
                        WhatsApp
                    </Typography>
                </Button>

                <Button
                    component={Link}
                    href="/services"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: '#E2E8F0',
                        minWidth: 64,
                        py: 0.5,
                        px: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { color: '#38BDF8', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    }}
                >
                    <ExploreIcon sx={{ fontSize: 20, color: '#38BDF8' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 800, mt: 0.2 }}>
                        {servicesList.length} Services
                    </Typography>
                </Button>

                <Button
                    component={Link}
                    href="/services/bikes"
                    variant="contained"
                    size="small"
                    sx={{
                        bgcolor: '#F59E0B',
                        color: '#0F172A',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        py: 0.8,
                        px: 1.8,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        '&:hover': { bgcolor: '#D97706' },
                    }}
                >
                    <ExploreIcon sx={{ fontSize: 18 }} />
                    Book Now
                </Button>
            </Box>
        </Box>
    );
}

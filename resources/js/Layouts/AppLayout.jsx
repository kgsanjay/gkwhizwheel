import React, { useState } from 'react';
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

const servicesList = [
    {
        title: 'Bike & Scooter Rentals',
        desc: 'Activa, Dio, Classic 350 & EV fleet from ₹350/day',
        href: '/services/bikes',
        icon: <TwoWheelerIcon sx={{ color: '#F59E0B', fontSize: 22 }} />,
        badge: 'Starts ₹350',
    },
    {
        title: 'Coastal Cabs & Taxis',
        desc: 'Sedan, SUV & tempo for Gokarna, Murudeshwar & airport',
        href: '/services/cabs',
        icon: <DirectionsCarIcon sx={{ color: '#0284C7', fontSize: 22 }} />,
        badge: 'AC Cabs',
    },
    {
        title: 'Homestays & Coastal Rooms',
        desc: 'Verified riverside cottages & beachfront villas',
        href: '/services/homestays',
        icon: <HouseIcon sx={{ color: '#059669', fontSize: 22 }} />,
        badge: 'Verified',
    },
    {
        title: 'Sharavathi Backwater Boating',
        desc: 'Island cruises, mangrove safari & sunset rides',
        href: '/services/boating',
        icon: <SailingIcon sx={{ color: '#2563EB', fontSize: 22 }} />,
        badge: 'Popular',
    },
    {
        title: 'Netrani Island Scuba Diving',
        desc: 'PADI certified guides & clear coral reef diving',
        href: '/services/scuba',
        icon: <ScubaDivingIcon sx={{ color: '#0D9488', fontSize: 22 }} />,
        badge: 'PADI Cert',
    },
    {
        title: 'Local Travel Guides & Trails',
        desc: 'Native experts for waterfall treks & temple heritage',
        href: '/services/guide',
        icon: <HikingIcon sx={{ color: '#D97706', fontSize: 22 }} />,
        badge: 'Native Guides',
    },
    {
        title: 'Custom Tour Packages',
        desc: 'All-inclusive Karavali coastal combos & customized itineraries',
        href: '/services/tours',
        icon: <CardTravelIcon sx={{ color: '#7C3AED', fontSize: 22 }} />,
        badge: 'Best Value',
    },
];

export default function AppLayout({ children, fullWidth = false, noFooterMargin = false }) {
    const { auth, flash } = usePage().props;
    const { url = '/' } = usePage();
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';

    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const isUserMenuOpen = Boolean(userMenuAnchor);

    const [servicesAnchorEl, setServicesAnchorEl] = useState(null);
    const isServicesOpen = Boolean(servicesAnchorEl);

    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

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


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: isDark ? '#0B1120' : '#F8FAFC', color: isDark ? '#F8FAFC' : '#0F172A', width: '100%', overflowX: 'hidden' }}>
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

            {/* Top Announcement Bar (1920px Container-Fluid) */}
            <Box
                sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.98)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    py: 0.8,
                    width: '100%',
                    display: { xs: 'none', md: 'block' },
                }}
            >
                <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 6 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <LocationOnIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                                Palya Main Rd, Honnavar, Karnataka 581334
                            </Typography>
                            <Box
                                component="a"
                                href="https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334"
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.4,
                                    color: '#38BDF8',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    ml: 0.5,
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                <DirectionsIcon sx={{ fontSize: 13 }} /> Get Directions
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <VerifiedUserIcon sx={{ fontSize: 14, color: '#10B981' }} />
                            <Typography variant="caption" sx={{ color: '#FBBF24', fontWeight: 700 }}>
                                5.0 ★★★★★ (324 Google Reviews) • Open 24 Hours
                            </Typography>
                        </Box>
                        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Ride Freely. Explore More.
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <Box
                            component="a"
                            href="tel:+918660989586"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.6,
                                color: '#E2E8F0',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            <PhoneIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                            +91 8660989586
                        </Box>
                        <Box
                            component="a"
                            href="tel:09731699125"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.6,
                                color: '#E2E8F0',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            <PhoneIcon sx={{ fontSize: 13, color: '#10B981' }} />
                            097316 99125
                        </Box>
                        <Box
                            component="a"
                            href="mailto:contact@whizwheels.in"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.6,
                                color: '#E2E8F0',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            <EmailIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                            contact@whizwheels.in
                        </Box>
                        <Box
                            component="a"
                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20am%20looking%20for%20a%20bike%20rental%20in%20Honnavar."
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#10B981',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            <WhatsAppIcon sx={{ fontSize: 15 }} />
                            WhatsApp Booking
                        </Box>
                        <Box
                            component={Link}
                            href="/admin/login"
                            sx={{
                                color: '#64748B',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '&:hover': { color: '#F59E0B' },
                            }}
                        >
                            Staff Portal →
                        </Box>
                    </Stack>
                </Box>
            </Box>

            {/* Top Navigation Bar (1920px Container-Fluid) */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    width: '100%',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                }}
            >
                <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
                        {/* Brand Logo & Name */}
                        <Box
                            component={Link}
                            href="/"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                                color: 'inherit',
                                gap: 1.5,
                            }}
                        >
                            <Box
                                component="img"
                                src="/images/logo.png"
                                alt="GK WhizWheels — Bike Rental in Honnavar"
                                sx={{
                                    height: { xs: 44, sm: 52 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                    borderRadius: 1.5,
                                    filter: isDark ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))',
                                    transition: 'transform 0.2s ease',
                                    '&:hover': { transform: 'scale(1.04)' },
                                }}
                            />
                            <Box>
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{
                                        fontWeight: 900,
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.1,
                                        fontSize: { xs: '1.02rem', sm: '1.25rem' },
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                    }}
                                >
                                    GK WhizWheels
                                </Typography>
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                                    <ElectricBoltIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontWeight: 600, letterSpacing: '0.02em' }}>
                                        Honnavar, Karnataka
                                    </Typography>
                                </Box>
                            </Box>
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
                            Honnavar & Karavali Coastal Services
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: '0.82rem', mt: 0.2 }}>
                            Verified local fleet, stay accommodations & water adventure packages
                        </Typography>
                    </Box>
                    <Chip
                        label="7 Services"
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
                        ⚡ 24/7 On-Demand Booking • Station Platform 1 Exit Counter & Home/Resort Delivery
                    </Typography>
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
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit' }}
                    >
                        <Box
                            component="img"
                            src="/images/logo.png"
                            alt="GK WhizWheels Logo"
                            sx={{ height: 38, width: 'auto', borderRadius: 1 }}
                        />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                GK WhizWheels
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#F59E0B' : '#B45309', fontWeight: 700 }}>
                                Honnavar, Karnataka
                            </Typography>
                        </Box>
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
                                Rent Instantly in Honnavar
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                                Sign in to track bookings, or start by picking your favorite bike.
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
                                    label="7 Services"
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
                            24/7 Honnavar Desk & Hubs
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 700, mb: 1.5, fontSize: '0.84rem' }}>
                            Express Station Desk (Platform 1 Exit) & Palya Main Rd Head Office.
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
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20am%20looking%20for%20a%20bike%20rental%20in%20Honnavar."
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
                <Box sx={{ maxWidth: '1240px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mt: 2, width: '100%' }}>
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                        {flash.success}
                    </Alert>
                </Box>
            )}
            {flash?.error && (
                <Box sx={{ maxWidth: '1240px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, mt: 2, width: '100%' }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {flash.error}
                    </Alert>
                </Box>
            )}

            {/* Main Content Area — Page controls internal container widths */}
            <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, width: '100%', outline: 'none', pb: noFooterMargin ? 0 : { xs: 8, md: 0 } }}>
                {children}
            </Box>

            {/* Comprehensive Enhanced Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: '#070D19',
                    color: '#CBD5E1',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: { xs: 5, md: 7 },
                    pb: { xs: 12, md: 5 },
                    mt: noFooterMargin ? 0 : { xs: 6, md: 10 },
                    width: '100%',
                }}
            >
                <Box sx={{ width: '100%', px: { xs: 2.5, sm: 4, md: 6, lg: 8, xl: 10 } }}>
                    {/* Top Trust & Highlight Strip */}
                    <Box
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: { xs: 4, md: 6 },
                            borderRadius: 3.5,
                            bgcolor: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                            gap: { xs: 1.8, md: 2 },
                        }}
                    >
                        {[
                            {
                                icon: <VerifiedUserIcon sx={{ color: '#10B981', fontSize: 22 }} />,
                                title: 'Govt. Approved Fleet',
                                desc: '100% Commercial permits, valid insurance & PUC',
                            },
                            {
                                icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 22 }} />,
                                title: '5.0 ★ Google Rated',
                                desc: '324+ Verified traveler & tourist reviews',
                            },
                            {
                                icon: <LocationOnIcon sx={{ color: '#38BDF8', fontSize: 22 }} />,
                                title: 'Dual Honnavar Hubs',
                                desc: 'Palya Main Rd Head Office & Railway Station Hub',
                            },
                            {
                                icon: <ElectricBoltIcon sx={{ color: '#F59E0B', fontSize: 22 }} />,
                                title: 'Zero Deposit Options',
                                desc: 'Paperless digital KYC & instant confirmation',
                            },
                        ].map((badge, bIdx) => (
                            <Box key={bIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {badge.icon}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>
                                        {badge.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>
                                        {badge.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Main Footer Columns */}
                    <Grid container spacing={{ xs: 3.5, sm: 3, md: 4 }} sx={{ mb: 5 }}>
                        {/* Column 1: Brand & Office Details */}
                        <Grid size={{ xs: 12, md: 3.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box
                                    component="img"
                                    src="/images/logo.png"
                                    alt="GK WhizWheels — Honnavar Bike Rentals & Travel Hub"
                                    sx={{ height: 48, width: 'auto', borderRadius: 1.5 }}
                                />
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, lineHeight: 1.1 }}>
                                        GK WhizWheels
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800, letterSpacing: '0.02em' }}>
                                        #1 Travel & Rental Hub in Honnavar
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.65, mb: 2.5, maxWidth: 360, fontSize: '0.86rem' }}>
                                Your all-in-one coastal Karnataka travel partner. Explore Sharavathi Backwaters, Honnavar Eco Beach, Apsarakonda Falls, Mirjan Fort, Murudeshwar, and Gokarna with reliable rental two-wheelers, AC cabs, boating cruises, homestays, and scuba diving.
                            </Typography>

                            <Stack spacing={1.2} sx={{ mb: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18, mt: '2px', flexShrink: 0 }} />
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.84rem' }}>
                                            Palya Main Rd, Honnavar, Karnataka 581334
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                                            Plus Railway Station Hub (Platform 1 Exit)
                                        </Typography>
                                        <Box
                                            component="a"
                                            href="https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334"
                                            target="_blank"
                                            rel="noreferrer"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                color: '#38BDF8',
                                                fontSize: '0.78rem',
                                                fontWeight: 750,
                                                textDecoration: 'none',
                                                mt: 0.3,
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                        >
                                            <DirectionsIcon sx={{ fontSize: 13 }} /> Get Directions on Google Maps ↗
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon sx={{ color: '#10B981', fontSize: 17, flexShrink: 0 }} />
                                    <Typography
                                        component="a"
                                        href="tel:+918660989586"
                                        variant="body2"
                                        sx={{ color: '#F1F5F9', fontWeight: 700, textDecoration: 'none', fontSize: '0.84rem', '&:hover': { color: '#F59E0B' } }}
                                    >
                                        +91 8660989586
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748B' }}>•</Typography>
                                    <Typography
                                        component="a"
                                        href="tel:09731699125"
                                        variant="body2"
                                        sx={{ color: '#F1F5F9', fontWeight: 700, textDecoration: 'none', fontSize: '0.84rem', '&:hover': { color: '#F59E0B' } }}
                                    >
                                        097316 99125
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon sx={{ color: '#F59E0B', fontSize: 17, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 800, fontSize: '0.84rem' }}>
                                        Open 24 Hours Daily • Instant Support
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmailIcon sx={{ color: '#38BDF8', fontSize: 17, flexShrink: 0 }} />
                                    <Typography
                                        component="a"
                                        href="mailto:contact@whizwheels.in"
                                        variant="body2"
                                        sx={{ color: '#F1F5F9', fontWeight: 600, textDecoration: 'none', fontSize: '0.84rem', '&:hover': { color: '#F59E0B' } }}
                                    >
                                        contact@whizwheels.in
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20want%20to%20inquire%20about%20travel%20and%20rental%20services%20in%20Honnavar."
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<WhatsAppIcon />}
                                    sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.82rem', py: 0.7, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                                >
                                    WhatsApp Now
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href="tel:+918660989586"
                                    startIcon={<PhoneIcon />}
                                    sx={{ borderColor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF', textTransform: 'none', fontSize: '0.82rem', py: 0.7, '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.1)' } }}
                                >
                                    Call 24/7 Desk
                                </Button>
                            </Stack>
                        </Grid>

                        {/* Column 2: Rental Bikes & Scooters */}
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 850, mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.84rem' }}>
                                Two-Wheeler Fleet
                            </Typography>
                            <Stack spacing={1.3}>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#F59E0B', fontWeight: 750, textDecoration: 'none', fontSize: '0.86rem', '&:hover': { textDecoration: 'underline' } }}>
                                    All Rental Bikes →
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Honda Activa 6G
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Suzuki Access 125
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Royal Enfield Classic 350
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Honda H'ness CB350
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Honda Shine 125 & Pulsar
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Smart Electric Scooters (EV)
                                </Typography>
                                <Typography component={Link} href="/how-it-works" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#F59E0B' } }}>
                                    Tariffs & Booking Terms
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Column 3: Complete Travel Services (All 7 Services) */}
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 850, mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.84rem' }}>
                                All 7 Services
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography component={Link} href="/services" variant="body2" sx={{ color: '#F59E0B', fontWeight: 750, textDecoration: 'none', fontSize: '0.86rem', '&:hover': { textDecoration: 'underline' } }}>
                                    Explore All 7 Services Hub →
                                </Typography>
                                <Typography component={Link} href="/services/bikes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    🏍️ 1. Bike & Scooter Rentals
                                </Typography>
                                <Typography component={Link} href="/services/cabs" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    🚗 2. Coastal Cabs & Taxis
                                </Typography>
                                <Typography component={Link} href="/services/homestays" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    🏡 3. Homestays & Coastal Rooms
                                </Typography>
                                <Typography component={Link} href="/services/boating" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    🚤 4. Backwater Boating
                                </Typography>
                                <Typography component={Link} href="/services/scuba" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    🤿 5. Netrani Island Scuba
                                </Typography>
                                <Typography component={Link} href="/services/guide" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    📍 6. Local Guides & Trails
                                </Typography>
                                <Typography component={Link} href="/services/tours" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    🧳 7. Custom Tour Packages
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Column 4: Popular Honnavar Destinations */}
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 850, mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.84rem' }}>
                                Scenic Attractions
                            </Typography>
                            <Stack spacing={1.3}>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Sharavathi Backwaters
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Honnavar Eco Beach
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Apsarakonda Falls
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Mirjan Fort Citadel
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Murudeshwar Shiva Temple
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.86rem', '&:hover': { color: '#F59E0B' } }}>
                                    Gokarna Om Beach
                                </Typography>
                                <Typography component={Link} href="/services/cabs" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#F59E0B' } }}>
                                    Jog Falls Sightseeing Trip
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Column 5: Hubs & Customer Portal */}
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 850, mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.84rem' }}>
                                Hubs & Portals
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.84rem' }}>
                                    Hub 1: Palya Main Rd
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.84rem' }}>
                                    Hub 2: Railway Station Hub
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 800, display: 'block' }}>
                                    ● 24/7 Dispatch & Road Rescue
                                </Typography>
                                <Typography
                                    component="a"
                                    href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="caption"
                                    sx={{ color: '#38BDF8', fontWeight: 750, textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, display: 'inline-block' }}
                                >
                                    ★ 5.0 on Google (324 Reviews) →
                                </Typography>
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 0.5 }} />
                                <Typography component={Link} href="/account" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.84rem', '&:hover': { color: '#F59E0B' } }}>
                                    Booking History
                                </Typography>
                                <Typography component={Link} href="/account/kyc" variant="body2" sx={{ color: '#CBD5E1', textDecoration: 'none', fontSize: '0.84rem', '&:hover': { color: '#F59E0B' } }}>
                                    Upload KYC Documents
                                </Typography>
                                <Typography component={Link} href="/admin/login" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#F59E0B' } }}>
                                    Staff & Admin Login
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>

                    {/* Payment Methods & Security Strip */}
                    <Box
                        sx={{
                            pt: 3,
                            pb: 3,
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            mb: 3,
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', md: 'center' },
                            gap: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Secure Payment Accepted:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {['UPI (GPay / PhonePe / Paytm)', 'Credit & Debit Cards', 'Net Banking', 'Cash at Pickup'].map((payMethod, pIdx) => (
                                    <Chip
                                        key={pIdx}
                                        label={payMethod}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#E2E8F0',
                                            fontSize: '0.74rem',
                                            fontWeight: 650,
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 750 }}>
                                🔒 256-Bit SSL Encrypted
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>•</Typography>
                            <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 750 }}>
                                ⚡ Zero Security Deposit Option
                            </Typography>
                        </Box>
                    </Box>

                    {/* SEO Footnote & Copyright */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', textAlign: { xs: 'center', sm: 'left' } }}>
                            © {new Date().getFullYear()} GK WhizWheels. All rights reserved. Palya Main Rd, Honnavar, Karnataka 581334.
                        </Typography>
                        <Stack direction="row" spacing={2.5} flexWrap="wrap" justifyContent="center">
                            <Typography component={Link} href="/about" variant="caption" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                About Us
                            </Typography>
                            <Typography component={Link} href="/how-it-works" variant="caption" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                How It Works
                            </Typography>
                            <Typography component={Link} href="/terms" variant="caption" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                Rental Terms & Policies
                            </Typography>
                            <Typography component={Link} href="/contact" variant="caption" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                Contact Us
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
                    href="tel:+918660989586"
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
                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20want%20to%20book%20a%20bike%20or%20service%20in%20Honnavar."
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
                        7 Services
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
                    <TwoWheelerIcon sx={{ fontSize: 18 }} />
                    Book Ride
                </Button>
            </Box>
        </Box>
    );
}

import React from 'react';
import { usePage, Link } from '@inertiajs/react';
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
import { useColorMode } from '../theme/ColorModeContext';

export default function AppLayout({ children, fullWidth = false }) {
    const { auth, flash } = usePage().props;
    const { mode, toggleColorMode } = useColorMode();
    const isDark = mode === 'dark';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: isDark ? '#0B1120' : '#F8FAFC', color: isDark ? '#F8FAFC' : '#0F172A', width: '100%', overflowX: 'hidden' }}>
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
                <Box sx={{ maxWidth: '1920px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <Box sx={{ maxWidth: '1920px', width: '100%', mx: 'auto', px: { xs: 2, sm: 4, md: 6 } }}>
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
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{
                                        fontWeight: 900,
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.1,
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                    }}
                                >
                                    GK WhizWheels
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                                    <ElectricBoltIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, letterSpacing: '0.02em' }}>
                                        Bike Rental in Honnavar, Karnataka
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Navigation Links */}
                        <Stack direction="row" spacing={{ xs: 1, md: 1.5 }} alignItems="center">
                            <Button
                                component={Link}
                                href="/bikes"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Rental Bikes
                            </Button>
                            <Button
                                component={Link}
                                href="/#pricing"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Rates & Prices
                            </Button>
                            <Button
                                component={Link}
                                href="/#hubs"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', md: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Honnavar Hubs
                            </Button>
                            <Button
                                component={Link}
                                href="/#routes"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', lg: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Places to Visit
                            </Button>
                            <Button
                                component={Link}
                                href="/#faq"
                                sx={{
                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', md: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                FAQs
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                        component={Link}
                                        href="/account"
                                        size="small"
                                        sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600 }}
                                    >
                                        My Bookings
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/account/kyc"
                                        size="small"
                                        sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
                                    >
                                        KYC Docs
                                    </Button>
                                    <Chip
                                        component={Link}
                                        href="/account"
                                        clickable
                                        icon={<PersonIcon sx={{ color: '#F59E0B !important' }} />}
                                        label={auth.user.name}
                                        color="secondary"
                                        size="small"
                                        variant="outlined"
                                        sx={{ color: isDark ? '#FFFFFF' : '#0F172A', borderColor: '#F59E0B', fontWeight: 600 }}
                                    />
                                    <Button
                                        component={Link}
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        size="small"
                                        variant="text"
                                        sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                    >
                                        Logout
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
                                            display: { xs: 'none', md: 'inline-flex' },
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
                                            px: { xs: 1.5, sm: 2 },
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
                                        href="/bikes"
                                        sx={{
                                            fontWeight: 800,
                                            px: { xs: 2, sm: 2.75 },
                                            py: 0.9,
                                            boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
                                            borderRadius: 2,
                                        }}
                                    >
                                        Rent a Bike
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Toolbar>
                </Box>
            </AppBar>

            {/* Flash notification banner */}
            {flash?.success && (
                <Box sx={{ maxWidth: '1410px', mx: 'auto', px: { xs: 2, sm: 3 }, mt: 2, width: '100%' }}>
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                        {flash.success}
                    </Alert>
                </Box>
            )}
            {flash?.error && (
                <Box sx={{ maxWidth: '1410px', mx: 'auto', px: { xs: 2, sm: 3 }, mt: 2, width: '100%' }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {flash.error}
                    </Alert>
                </Box>
            )}

            {/* Main Content Area — Page controls internal container widths */}
            <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
                {children}
            </Box>

            {/* Comprehensive Footer (1920px Container-Fluid) */}
            <Box
                component="footer"
                sx={{
                    bgcolor: '#070D19',
                    color: '#94A3B8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: { xs: 6, md: 8 },
                    pb: 4,
                    mt: 10,
                    width: '100%',
                }}
            >
                <Box sx={{ maxWidth: '1920px', width: '100%', mx: 'auto', px: { xs: 2, sm: 4, md: 6 } }}>
                    <Grid container spacing={4} sx={{ mb: 6 }}>
                        {/* Brand & Office Details */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box
                                    component="img"
                                    src="/images/logo.png"
                                    alt="GK WhizWheels — Honnavar Bike Rentals"
                                    sx={{ height: 50, width: 'auto', borderRadius: 1.5 }}
                                />
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, lineHeight: 1.1 }}>
                                        GK WhizWheels
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                        #1 Bike Rental in Honnavar, Karnataka
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, mb: 2.5, maxWidth: 360 }}>
                                The most trusted name for rental bikes in Honnavar. Explore Sharavathi Backwaters, Eco Beach, Apsarakonda, Mirjan Fort, Murudeshwar, and Gokarna with reliable, sanitized two-wheelers.
                            </Typography>

                            <Stack spacing={1.2} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                                        Palya Main Rd, Honnavar, Karnataka 581334
                                    </Typography>
                                </Box>
                                <Box sx={{ pl: 3.25 }}>
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
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        <DirectionsIcon sx={{ fontSize: 14 }} /> Get Directions on Google Maps ↗
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                    <Typography
                                        component="a"
                                        href="tel:+918660989586"
                                        variant="body2"
                                        sx={{ color: '#E2E8F0', fontWeight: 600, textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                                    >
                                        +91 8660989586
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748B' }}>•</Typography>
                                    <Typography
                                        component="a"
                                        href="tel:09731699125"
                                        variant="body2"
                                        sx={{ color: '#E2E8F0', fontWeight: 600, textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                                    >
                                        097316 99125
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>
                                        Open 24 Hours • Daily Service
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmailIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                                    <Typography
                                        component="a"
                                        href="mailto:contact@whizwheels.in"
                                        variant="body2"
                                        sx={{ color: '#E2E8F0', fontWeight: 600, textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}
                                    >
                                        contact@whizwheels.in
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="secondary"
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20want%20to%20inquire%20about%20honnavar%20bike%20rent."
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<WhatsAppIcon />}
                                    sx={{ fontWeight: 800, textTransform: 'none' }}
                                >
                                    WhatsApp Now
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href="tel:+918660989586"
                                    startIcon={<PhoneIcon />}
                                    sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', textTransform: 'none' }}
                                >
                                    Call Us
                                </Button>
                            </Stack>
                        </Grid>

                        {/* Rental Bikes in Honnavar */}
                        <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Rental Bikes in Honnavar
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography component={Link} href="/bikes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    All Honnavar Rental Bikes
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=1" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Honda Activa 6G Rent
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=2" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Royal Enfield Classic 350
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=3" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Honda Shine 125 Commuter
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=4" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Electric Scooter Rental
                                </Typography>
                                <Typography component={Link} href="/#pricing" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Honnavar Bike Rental Price
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Popular Honnavar Destinations */}
                        <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Honnavar Attractions
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Sharavathi Backwaters & Boating
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Honnavar Eco Beach & Boardwalk
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Apsarakonda Waterfalls
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Mirjan Fort Historical Ride
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Murudeshwar Temple & Beach
                                </Typography>
                                <Typography component={Link} href="/#routes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Gokarna Coastal Highway Ride
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Customer & Staff Portal */}
                        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Hub Locations & Support
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                                    Hub 1: Palya Main Rd (Head Office)
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                                    Hub 2: Honnavar Railway Station Hub
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, display: 'block' }}>
                                    Open 24 Hours Daily • Round-the-clock Pickup
                                </Typography>
                                <Typography
                                    component="a"
                                    href="https://share.google/GoM4iOgiuUIa7ZfwV"
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="caption"
                                    sx={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, display: 'inline-block' }}
                                >
                                    ★ 5.0 Rated (324 Reviews on Google) →
                                </Typography>
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 1 }} />
                                <Typography component={Link} href="/account" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Customer Booking History
                                </Typography>
                                <Typography component={Link} href="/account/kyc" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Upload KYC Documents
                                </Typography>
                                <Typography component={Link} href="/admin/login" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Staff & Store Manager Login
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }} />

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
                        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                            © {new Date().getFullYear()} GK WhizWheels. All rights reserved. Palya Main Rd, Honnavar, Karnataka 581334.
                        </Typography>
                        <Stack direction="row" spacing={2.5}>
                            <Typography component={Link} href="/#pricing" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#94A3B8' } }}>
                                Honnavar Bike Rent Terms
                            </Typography>
                            <Typography component={Link} href="/#faq" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#94A3B8' } }}>
                                Cancellation & Deposit Refund
                            </Typography>
                            <Typography component={Link} href="/bikes" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#94A3B8' } }}>
                                Honnavar Bike Rentals Fleet
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

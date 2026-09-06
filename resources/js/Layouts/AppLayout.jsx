import React from 'react';
import { usePage, Link } from '@inertiajs/react';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Button,
    Chip,
    Alert,
    Grid,
    Divider,
    Stack,
} from '@mui/material';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PhoneIcon from '@mui/icons-material/Phone';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

export default function AppLayout({ children, title }) {
    const { auth, flash } = usePage().props;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0B1120', color: '#F8FAFC' }}>
            {/* Announcement / Support Bar */}
            <Box
                sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.95)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    py: 0.75,
                    px: 2,
                    display: { xs: 'none', md: 'block' },
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <LocationOnIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                                    Active Hubs: Koramangala & Indiranagar, Bengaluru
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <VerifiedUserIcon sx={{ fontSize: 14, color: '#10B981' }} />
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                                    100% Insured Fleet • Zero Hidden Charges
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={2.5} alignItems="center">
                            <Box
                                component="a"
                                href="https://wa.me/919999900001?text=Hi%20GK%20WhizWheel%20Team,%20I%20have%20an%20inquiry%20about%20bike%20rentals."
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    color: '#10B981',
                                    textDecoration: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                <WhatsAppIcon sx={{ fontSize: 14 }} />
                                WhatsApp Support: +91 99999 00001
                            </Box>
                            <Box
                                component={Link}
                                href="/admin/login"
                                sx={{
                                    color: '#94A3B8',
                                    textDecoration: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    '&:hover': { color: '#F59E0B' },
                                }}
                            >
                                Staff / Admin Portal →
                            </Box>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            {/* Top Navigation Bar */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1.2 }}>
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
                                alt="GK WhizWheel Brand Logo"
                                sx={{
                                    height: { xs: 46, sm: 54 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                    borderRadius: 1.5,
                                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
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
                                        color: '#FFFFFF',
                                    }}
                                >
                                    GK WhizWheel
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                    <ElectricBoltIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: '0.02em' }}>
                                        Bengaluru Mobility & Rentals
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
                                    color: '#E2E8F0',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Browse Fleet
                            </Button>
                            <Button
                                component={Link}
                                href="/#hubs"
                                sx={{
                                    color: '#E2E8F0',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Hubs
                            </Button>
                            <Button
                                component={Link}
                                href="/#pricing"
                                sx={{
                                    color: '#E2E8F0',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', md: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                Pricing
                            </Button>
                            <Button
                                component={Link}
                                href="/#how-it-works"
                                sx={{
                                    color: '#E2E8F0',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    px: 1.5,
                                    display: { xs: 'none', md: 'inline-flex' },
                                    '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                }}
                            >
                                How It Works
                            </Button>

                            {auth?.user ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                        component={Link}
                                        href="/account"
                                        size="small"
                                        sx={{ color: '#E2E8F0', fontWeight: 600 }}
                                    >
                                        My Bookings
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/account/kyc"
                                        size="small"
                                        sx={{ color: '#E2E8F0', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
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
                                        sx={{ color: '#FFFFFF', borderColor: '#F59E0B', fontWeight: 600 }}
                                    />
                                    <Button
                                        component={Link}
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        size="small"
                                        variant="text"
                                        sx={{ color: '#94A3B8' }}
                                    >
                                        Logout
                                    </Button>
                                </Box>
                            ) : (
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Button
                                        component={Link}
                                        href="/admin/login"
                                        size="small"
                                        sx={{
                                            color: '#94A3B8',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            display: { xs: 'none', sm: 'inline-flex' },
                                            '&:hover': { color: '#FFFFFF' },
                                        }}
                                    >
                                        Staff Login
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="medium"
                                        component={Link}
                                        href="/bikes"
                                        sx={{
                                            fontWeight: 800,
                                            px: { xs: 2, sm: 3 },
                                            py: 1,
                                            boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
                                            borderRadius: 2,
                                        }}
                                    >
                                        Book a Bike
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Flash notification banner */}
            {flash?.success && (
                <Container maxWidth="lg" sx={{ mt: 2 }}>
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                        {flash.success}
                    </Alert>
                </Container>
            )}
            {flash?.error && (
                <Container maxWidth="lg" sx={{ mt: 2 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {flash.error}
                    </Alert>
                </Container>
            )}

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>

            {/* Comprehensive Modern Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: '#070D19',
                    color: '#94A3B8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: { xs: 6, md: 8 },
                    pb: 4,
                    mt: 10,
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} sx={{ mb: 6 }}>
                        {/* Brand Col */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box
                                    component="img"
                                    src="/images/logo.png"
                                    alt="GK WhizWheel"
                                    sx={{ height: 48, width: 'auto', borderRadius: 1.5 }}
                                />
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 900, lineHeight: 1.1 }}>
                                        GK WhizWheel
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                                        Two-Wheeler Rental Platform
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, mb: 3, maxWidth: 320 }}>
                                Hassle-free scooter and bike rentals across Bengaluru with transparent dynamic pricing, instant digital KYC, and flexible multi-hub returns.
                            </Typography>
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href="https://wa.me/919999900001"
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                        color: '#E2E8F0',
                                        fontSize: '0.8rem',
                                        textTransform: 'none',
                                        '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                                    }}
                                >
                                    WhatsApp Helpline
                                </Button>
                            </Stack>
                        </Grid>

                        {/* Quick Links */}
                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Explore Fleet
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography component={Link} href="/bikes" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    All Available Bikes
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=1" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    City Scooters (Activa, Jupiter)
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=2" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Cruisers (Royal Enfield)
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=3" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Daily Commuters
                                </Typography>
                                <Typography component={Link} href="/bikes?category_id=4" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Electric Scooters (EV)
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Rental Hubs */}
                        <Grid item xs={6} sm={4} md={2.5}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Store Hubs
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography component={Link} href="/#hubs" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Koramangala 5th Block Hub
                                </Typography>
                                <Typography component={Link} href="/#hubs" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Indiranagar Metro Station
                                </Typography>
                                <Typography component={Link} href="/#pricing" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    One-Way Drop Policy
                                </Typography>
                                <Typography component={Link} href="/#faq" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Security Deposit & Refund
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Customer & Staff Portal */}
                        <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Account & Portals
                            </Typography>
                            <Stack spacing={1.2}>
                                <Typography component={Link} href="/account" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Customer Booking History
                                </Typography>
                                <Typography component={Link} href="/account/kyc" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Upload KYC Documents
                                </Typography>
                                <Typography component={Link} href="/admin/login" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Store Staff & Admin Login
                                </Typography>
                                <Box sx={{ pt: 1 }}>
                                    <Chip
                                        label="Operating 08:00 AM - 09:00 PM"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#CBD5E1', fontSize: '0.75rem' }}
                                    />
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }} />

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                            © {new Date().getFullYear()} GK WhizWheel. All rights reserved. Commercial & Proprietary.
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Typography component={Link} href="/#pricing" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#94A3B8' } }}>
                                Pricing Policy
                            </Typography>
                            <Typography component={Link} href="/#faq" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#94A3B8' } }}>
                                Cancellation & Refund
                            </Typography>
                            <Typography component={Link} href="/admin/login" variant="caption" sx={{ color: '#64748B', textDecoration: 'none', '&:hover': { color: '#94A3B8' } }}>
                                Staff App (APK v1.2)
                            </Typography>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}

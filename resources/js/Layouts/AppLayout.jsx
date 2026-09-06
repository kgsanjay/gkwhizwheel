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
    IconButton,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PersonIcon from '@mui/icons-material/Person';

export default function AppLayout({ children, title }) {
    const { auth, flash } = usePage().props;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Top Navigation Bar */}
            <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid #1E293B' }}>
                <Container maxWidth="lg">
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
                                sx={{
                                    bgcolor: 'secondary.main',
                                    color: 'secondary.contrastText',
                                    p: 0.8,
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <TwoWheelerIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{
                                        fontWeight: 800,
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    GK WhizWheel
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ElectricBoltIcon sx={{ fontSize: 12, color: 'secondary.main' }} />
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                        Bengaluru Mobility
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Navigation Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Button
                                component={Link}
                                href="/#fleet"
                                sx={{ color: '#E2E8F0', display: { xs: 'none', sm: 'inline-flex' } }}
                            >
                                Fleet
                            </Button>
                            <Button
                                component={Link}
                                href="/#pricing"
                                sx={{ color: '#E2E8F0', display: { xs: 'none', sm: 'inline-flex' } }}
                            >
                                Pricing
                            </Button>
                            <Button
                                component={Link}
                                href="/#stores"
                                sx={{ color: '#E2E8F0', display: { xs: 'none', md: 'inline-flex' } }}
                            >
                                Hubs
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
                                        icon={<PersonIcon />}
                                        label={auth.user.name}
                                        color="secondary"
                                        size="small"
                                        variant="outlined"
                                        sx={{ color: '#FFFFFF', borderColor: '#F59E0B' }}
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
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    component={Link}
                                    href="/#book"
                                    sx={{ fontWeight: 700 }}
                                >
                                    Book a Bike
                                </Button>
                            )}
                        </Box>
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
            <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
                <Container maxWidth="lg">
                    {children}
                </Container>
            </Box>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 4,
                    px: 2,
                    mt: 'auto',
                    backgroundColor: '#0F172A',
                    color: '#94A3B8',
                    borderTop: '1px solid #1E293B',
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Typography variant="body2">
                            © {new Date().getFullYear()} GK WhizWheel. Two-Wheeler Mobility & Bike Rentals.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                Instant KYC Handover
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                Digital RC & Insurance
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                One-Way Drop Permitted
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    Paper,
    Divider,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpeedIcon from '@mui/icons-material/Speed';

export default function Welcome({ bikes = [], categories = [] }) {
    return (
        <AppLayout>
            <Head title="Premium Two-Wheeler Rentals in Bengaluru" />

            {/* Hero Section */}
            <Box
                sx={{
                    py: { xs: 6, md: 10 },
                    px: { xs: 3, md: 6 },
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: '#FFFFFF',
                    mb: 6,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative electric accent glow */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -80,
                        right: -80,
                        width: 260,
                        height: 260,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Chip
                            icon={<ElectricBoltIcon sx={{ color: '#F59E0B !important' }} />}
                            label="Instant Online Booking & Walk-in Hubs in Bengaluru"
                            sx={{
                                bgcolor: 'rgba(245, 158, 11, 0.15)',
                                color: '#F59E0B',
                                fontWeight: 700,
                                mb: 2,
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                        />
                        <Typography
                            variant="h1"
                            component="h1"
                            sx={{
                                color: '#FFFFFF',
                                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                                fontWeight: 800,
                                lineHeight: 1.15,
                                mb: 2,
                            }}
                        >
                            Ride Free with GK WhizWheel.
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#94A3B8',
                                fontWeight: 400,
                                maxWidth: 620,
                                mb: 4,
                                lineHeight: 1.6,
                            }}
                        >
                            Rent high-performance electric and petrol two-wheelers with transparent daily pricing,
                            instant WhatsApp booking updates, and zero-paperwork digital KYC handover.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                sx={{
                                    py: 1.5,
                                    px: 4,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)',
                                }}
                            >
                                Explore Available Bikes
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                sx={{
                                    py: 1.5,
                                    px: 3,
                                    color: '#E2E8F0',
                                    borderColor: '#475569',
                                    '&:hover': {
                                        borderColor: '#F59E0B',
                                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                    },
                                }}
                            >
                                View Pricing & Deposit Rules
                            </Button>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <TwoWheelerIcon sx={{ fontSize: 72, color: 'secondary.main', mb: 1 }} />
                            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                100% Verified Fleet
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 1 }}>
                                Valid Insurance, Emission PUC, and digital RC attached with one-tap deep link.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Key Advantages Grid */}
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 800 }}>
                Why GK WhizWheel?
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 4 }}>
                Engineered for hassle-free mobility across Bengaluru.
            </Typography>

            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(15, 23, 42, 0.06)', borderRadius: 2, display: 'inline-flex', mb: 2 }}>
                                <SpeedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Fast Digital Booking
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Lock in your ride with 15-minute concurrency-safe holds, combined advance, and security deposit checkout.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.12)', borderRadius: 2, display: 'inline-flex', mb: 2 }}>
                                <WhatsAppIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                WhatsApp & Email Alerts
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Direct booking confirmation, pickup reminder with vehicle document deep-links, and automated return alerts.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.12)', borderRadius: 2, display: 'inline-flex', mb: 2 }}>
                                <VerifiedUserIcon sx={{ color: '#10B981', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Compliant & Insured
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Scheduled compliance audits monitor insurance and PUC certificates with automatic inventory protection.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.12)', borderRadius: 2, display: 'inline-flex', mb: 2 }}>
                                <LocationOnIcon sx={{ color: '#3B82F6', fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Multi-Hub Returns
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pick up at one hub, return at another across Bengaluru with automated store inventory sync and late fee calculations.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </AppLayout>
    );
}

import React from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import PageHead from '../Components/SEO/PageHead';
import { useColorMode } from '../theme/ColorModeContext';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Paper,
    Stack,
    Divider,
    Breadcrumbs,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import StarIcon from '@mui/icons-material/Star';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import CleanHandsIcon from '@mui/icons-material/CleanHands';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DirectionsIcon from '@mui/icons-material/Directions';
import ExploreIcon from '@mui/icons-material/Explore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function About() {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const stats = [
        { label: 'Happy Coastal Riders', value: '5,000+', icon: <TwoWheelerIcon sx={{ color: '#F59E0B', fontSize: 30 }} />, detail: 'Across Karnataka & Goa travelers' },
        { label: 'Google Rating', value: '5.0 ★', icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 30 }} />, detail: '324+ Verified rider reviews' },
        { label: 'Active Honnavar Hubs', value: '2 Hubs', icon: <LocationOnIcon sx={{ color: '#10B981', fontSize: 30 }} />, detail: 'Railway Station & Palya Main Rd' },
        { label: 'On-Road Support', value: '24/7 Live', icon: <SupportAgentIcon sx={{ color: '#38BDF8', fontSize: 30 }} />, detail: 'Real-time rescue & backup bike' },
    ];

    const pillars = [
        {
            title: '100% Road-Legal & Verified Fleet',
            desc: 'Every two-wheeler is equipped with commercial rental insurance, valid registration certificate (RC), and emission PUC. Access digital verified copies directly on your smartphone.',
            icon: <ShieldIcon sx={{ fontSize: 34, color: '#10B981' }} />,
            highlight: 'Zero Police Hassle',
        },
        {
            title: 'Zero Deposit Option for Verified Riders',
            desc: 'We trust our travelers. Complete digital KYC verification in under 5 minutes and rent without locking your travel funds in bulky security deposits.',
            icon: <VerifiedUserIcon sx={{ fontSize: 34, color: '#F59E0B' }} />,
            highlight: 'Zero Travel Friction',
        },
        {
            title: 'Dual Hubs with One-Way Drops',
            desc: 'Arriving by train? Pick up your ride immediately outside Honnavar Railway Station. Returning to town? Drop off at our central Palya Main Rd store.',
            icon: <LocationOnIcon sx={{ fontSize: 34, color: '#38BDF8' }} />,
            highlight: 'Complete Flexibility',
        },
        {
            title: '25-Point Mechanical Pre-Flight Check',
            desc: 'Brakes, tires, chain lubrication, battery, and engine oil are inspected before every single trip. Complimentary sanitized helmets provided for rider and pillion.',
            icon: <CleanHandsIcon sx={{ fontSize: 34, color: '#A855F7' }} />,
            highlight: 'Maximum Safety',
        },
    ];

    const coastalDestinations = [
        { name: 'Sharavathi River Backwaters', distance: '6 km from Hub', rideTime: '15 mins', desc: 'Mangrove boardwalks, boating cruise, and sunset viewpoints.' },
        { name: 'Apsarakonda Falls & Hilltop Park', distance: '9 km from Hub', rideTime: '20 mins', desc: 'Natural cascading waterfall overlooking panoramic Arabian Sea vistas.' },
        { name: 'Historic Mirjan Fort', distance: '16 km from Hub', rideTime: '30 mins', desc: '16th-century laterite stone fortress on the historic pepper trade route.' },
        { name: 'Murudeshwar Temple & Beach', distance: '26 km from Hub', rideTime: '40 mins', desc: 'World’s second tallest Shiva statue along scenic NH-66 coastal four-lane.' },
    ];

    return (
        <AppLayout>
            <PageHead
                title="About GK WhizWheels | Premier Bike Rental in Honnavar"
                description="Discover GK WhizWheels, Honnavar's trusted two-wheeler rental agency. Verified legal fleet, zero deposit options, and 24/7 coastal Karnataka road support."
                canonicalUrl="https://whizwheels.in/about"
                ogImage="/images/logo.png"
                ogType="website"
            />

            {/* Standardized Hero Banner (Full Width with Ambient Glow) */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    position: 'relative',
                    py: { xs: 6, md: 8 },
                    px: { xs: 2, sm: 4, md: 6, lg: 8 },
                    background: isDark
                        ? 'radial-gradient(130% 120% at 90% 10%, #1E293B 0%, #0F172A 60%, #090E17 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #EFF6FF 100%)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
                    overflow: 'hidden',
                }}
            >
                {/* Background Ambient Glows */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -120,
                        right: -100,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -120,
                        left: -100,
                        width: 450,
                        height: 450,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.14) 0%, rgba(14, 165, 233, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Box sx={{ maxWidth: '1440px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={{ xs: 4, lg: 6 }} alignItems="center">
                        {/* Left Column: Story & Hero Copy */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            {/* Breadcrumbs */}
                            <Breadcrumbs sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                                <Typography component={Link} href="/" variant="caption" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Home
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                    About Us
                                </Typography>
                            </Breadcrumbs>

                            <Chip
                                icon={<TwoWheelerIcon sx={{ fontSize: '1rem !important', color: '#F59E0B' }} />}
                                label="Honnavar's #1 Rated Bike Rental Service"
                                sx={{
                                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#FBBF24',
                                    fontWeight: 700,
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    mb: 2.5,
                                    py: 0.5,
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            />

                            <Typography
                                variant="h1"
                                component="h1"
                                sx={{
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                    fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
                                    fontWeight: 900,
                                    lineHeight: 1.15,
                                    letterSpacing: '-0.03em',
                                    mb: 2,
                                }}
                            >
                                Pioneering Two-Wheeled Freedom in{' '}
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Coastal Karnataka
                                </Box>
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: isDark ? '#94A3B8' : '#475569',
                                    fontSize: { xs: '1rem', md: '1.15rem' },
                                    lineHeight: 1.7,
                                    mb: 3.5,
                                    maxWidth: 640,
                                }}
                            >
                                GK WhizWheels was founded with a singular purpose: to make exploring Honnavar, Gokarna, and Murudeshwar effortless, transparent, and completely free from paperwork delays or hidden charges.
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                                <Button
                                    component={Link}
                                    href="/services/bikes"
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{ fontWeight: 800, px: 3.5, py: 1.3, borderRadius: 2 }}
                                >
                                    Explore Fleet Inventory
                                </Button>
                                <Button
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20know%20more%20about%20your%20bike%20rental%20services."
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="outlined"
                                    size="large"
                                    startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                    sx={{
                                        fontWeight: 700,
                                        px: 3,
                                        py: 1.3,
                                        borderRadius: 2,
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                        color: isDark ? '#F1F5F9' : '#0F172A',
                                        '&:hover': { borderColor: '#10B981', color: '#10B981' },
                                    }}
                                >
                                    Chat on WhatsApp
                                </Button>
                            </Stack>

                            {/* Trust Highlight Chips */}
                            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                                {[
                                    'Zero Security Deposit Option',
                                    'Express Station Counter Pickup',
                                    '24/7 Coastal Roadside Rescue',
                                ].map((item, idx) => (
                                    <Chip
                                        key={idx}
                                        icon={<CheckCircleIcon sx={{ color: '#10B981 !important', fontSize: 16 }} />}
                                        label={item}
                                        size="small"
                                        sx={{
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
                                            color: isDark ? '#CBD5E1' : '#475569',
                                            fontWeight: 600,
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Grid>

                        {/* Right Column: Operations & Trust Showcase Card */}
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 3, sm: 4 },
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                    backdropFilter: 'blur(16px)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                                    boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 12px 35px -5px rgba(15, 23, 42, 0.08)',
                                    borderRadius: 4,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 16 }} />}
                                            label="5.0 ★ Google Rating"
                                            size="small"
                                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', fontWeight: 800 }}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                        ● Live in Honnavar
                                    </Typography>
                                </Box>

                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5 }}>
                                    Coastal Travel Made Simple
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3 }}>
                                    Serving solo adventurers, couples, and road-trippers across Karnataka’s coastline.
                                </Typography>

                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        {
                                            icon: <TwoWheelerIcon sx={{ color: '#38BDF8', fontSize: 20 }} />,
                                            title: 'Ready-to-Ride Two-Wheeler Fleet',
                                            desc: 'Honda Activas, Dio 125, Royal Enfield Classic 350, Honda Shine 125.',
                                        },
                                        {
                                            icon: <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 20 }} />,
                                            title: 'Dual Convenient Hubs',
                                            desc: 'Palya Main Rd Head Office & Honnavar Railway Station Counter.',
                                        },
                                        {
                                            icon: <ShieldIcon sx={{ color: '#10B981', fontSize: 20 }} />,
                                            title: '100% Commercial RTO Registered',
                                            desc: 'Official yellow plates, comprehensive insurance, sanitized ISI helmets.',
                                        },
                                    ].map((feat, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            <Box
                                                sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {feat.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {feat.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.4 }}>
                                                    {feat.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>

                                <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 2 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Need quick answers?
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                                            Call +91 8660989586
                                        </Typography>
                                    </Box>
                                    <Button
                                        component="a"
                                        href="tel:09731699125"
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                        }}
                                    >
                                        Call Station Desk
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                {/* Stats Ribbon */}
                <Grid container spacing={3} sx={{ mb: 8 }}>
                    {stats.map((stat, i) => (
                        <Grid size={{ xs: 6, md: 3 }} key={i}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    borderRadius: 3,
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                    backdropFilter: 'blur(16px)',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: '#F59E0B',
                                        transform: 'translateY(-3px)',
                                        boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.06)',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'inline-flex', p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', mb: 1.5 }}>
                                    {stat.icon}
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A', mb: 0.5 }}>
                                    {stat.value}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 700, mb: 0.5 }}>
                                    {stat.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    {stat.detail}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Our Story Card */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3.5, sm: 5 },
                        mb: 8,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                        backdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    }}
                >
                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Chip label="Coastal Heritage & Mission" color="primary" size="small" sx={{ fontWeight: 700, mb: 2 }} />
                            <Typography variant="h3" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 2, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                                Born to Unlock the Magic of Honnavar
                            </Typography>
                            <Typography variant="body1" sx={{ color: isDark ? '#94A3B8' : '#475569', lineHeight: 1.8, mb: 2 }}>
                                Honnavar is one of coastal Karnataka's crown jewels — home to the peaceful Sharavathi mangrove delta, uncommercialized eco beaches, tranquil backwater boat cruises, and ancient fortresses. Yet travelers arriving by the Konkan Railway often faced unreliable local transport, inflated rates, or poorly maintained rental scooters.
                            </Typography>
                            <Typography variant="body1" sx={{ color: isDark ? '#94A3B8' : '#475569', lineHeight: 1.8, mb: 3 }}>
                                We started GK WhizWheels to establish a modern standard: instant digital booking, commercial regulatory compliance, fully verified safety helmets, transparent hourly & daily pricing, and prompt on-road mechanical assistance anywhere between Murudeshwar and Kumta.
                            </Typography>

                            <Stack direction="row" spacing={3} sx={{ pt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#E2E8F0' : '#1E293B' }}>
                                        Commercial RTO Permit
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#E2E8F0' : '#1E293B' }}>
                                        Instant QR Handover
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0' }}>
                                <Box
                                    component="img"
                                    src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"
                                    loading="lazy"
                                    alt="GK WhizWheels Fleet"
                                    sx={{
                                        width: '100%',
                                        height: 340,
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 12,
                                        left: 12,
                                        right: 12,
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                        backdropFilter: 'blur(8px)',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#F59E0B', display: 'block' }}>
                                        Honnavar Head Office Fleet
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                                        Ready for immediate departure at Palya Main Rd & Railway Station Hub
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Core Pillars */}
                <Box sx={{ mb: 8 }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Chip label="Why Riders Choose Us" size="small" sx={{ fontWeight: 700, mb: 1.5, bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', color: '#D97706' }} />
                        <Typography variant="h3" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                            The GK WhizWheels Standard
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#94A3B8' : '#64748B', maxWidth: 650, mx: 'auto' }}>
                            Every booking includes our standard guarantees so you can focus on making memories.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {pillars.map((pillar, i) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        p: 1,
                                        borderRadius: 3.5,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                        backdropFilter: 'blur(16px)',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: '#F59E0B',
                                            transform: 'translateY(-3px)',
                                            boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.06)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}>
                                                {pillar.icon}
                                            </Box>
                                            <Chip label={pillar.highlight} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            {pillar.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.7 }}>
                                            {pillar.desc}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Local Coastal Rides Guide */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3.5, sm: 5 },
                        mb: 8,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <ExploreIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            Top Coastal Excursions from our Hubs
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5 }}>
                        Take your rental bike on these handpicked, scenic routes across the Uttara Kannada coastline.
                    </Typography>

                    <Grid container spacing={2.5}>
                        {coastalDestinations.map((dest, i) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            {dest.name}
                                        </Typography>
                                        <Chip label={dest.distance} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                        ⚡ ~{dest.rideTime} ride time
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>
                                        {dest.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Standardized Bottom CTA Banner */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        borderRadius: 4,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)'
                            : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
                        border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                    }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1.5, textAlign: 'center', maxWidth: 750, mx: 'auto' }}>
                        Ready to Explore Honnavar on Two Wheels?
                    </Typography>
                    <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#475569', maxWidth: 640, mx: 'auto', mb: 3.5, lineHeight: 1.7, textAlign: 'center' }}>
                        Lock in your bike reservation in under 60 seconds with digital KYC and zero-deposit options for verified travelers.
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        alignItems="center"
                        sx={{ mx: 'auto', width: { xs: '100%', sm: 'auto' } }}
                    >
                        <Button
                            component={Link}
                            href="/services/bikes"
                            variant="contained"
                            color="secondary"
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            sx={{ fontWeight: 800, px: 4, py: 1.3, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                        >
                            Browse Available Fleet
                        </Button>
                        <Button
                            component={Link}
                            href="/contact"
                            variant="outlined"
                            size="large"
                            startIcon={<DirectionsIcon />}
                            sx={{
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.3,
                                borderRadius: 2,
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                color: isDark ? '#F1F5F9' : '#0F172A',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': {
                                    borderColor: '#F59E0B',
                                    color: '#F59E0B',
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
                                },
                            }}
                        >
                            Find Our Store Hubs
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </AppLayout>
    );
}

import React, { useState } from 'react';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import BadgeIcon from '@mui/icons-material/Badge';
import KeyIcon from '@mui/icons-material/Key';
import NavigationIcon from '@mui/icons-material/Navigation';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import ShieldIcon from '@mui/icons-material/Shield';

export default function HowItWorks() {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const steps = [
        {
            num: '01',
            title: 'Select Vehicle & Travel Dates',
            desc: 'Explore our fleet of Honda Activa 6G, Royal Enfield Classic 350, Honda Shine 125, and high-efficiency electric scooters. Choose your pickup and drop-off hubs in Honnavar.',
            icon: <TwoWheelerIcon sx={{ fontSize: 30, color: '#F59E0B' }} />,
            tag: 'Step 1 • Selection',
            time: 'Takes ~60 seconds',
            tip: 'Tip: Booking 24 hours in advance guarantees your preferred bike model and helmet size.',
        },
        {
            num: '02',
            title: 'Complete 2-Minute Digital KYC',
            desc: 'Upload a clear photo of your valid driving license and government photo ID (Aadhaar or Passport). Our automated verification validates documents in under 5 minutes.',
            icon: <BadgeIcon sx={{ fontSize: 30, color: '#10B981' }} />,
            tag: 'Step 2 • Digital Verification',
            time: 'Instant approval',
            tip: 'Tip: Verified riders qualify for zero security deposit checkout on standard commuter bikes.',
        },
        {
            num: '03',
            title: 'Express Hub Pickup & 360° Walkthrough',
            desc: 'Arrive at our Palya Main Rd store or Honnavar Railway Station counter. Verify the digital condition log with our staff, collect sanitized helmets, and receive the keys.',
            icon: <KeyIcon sx={{ fontSize: 30, color: '#38BDF8' }} />,
            tag: 'Step 3 • Vehicle Handover',
            time: 'Under 3 minutes',
            tip: 'Tip: Arriving by Konkan Railway? We coordinate with train schedules right outside platform exit.',
        },
        {
            num: '04',
            title: 'Ride Freely with Digital Documents',
            desc: 'Your signed RC, commercial insurance, and PUC documents are instantly accessible on your phone via your customer portal. Enjoy 24/7 on-road recovery support anywhere along the coast.',
            icon: <NavigationIcon sx={{ fontSize: 30, color: '#A855F7' }} />,
            tag: 'Step 4 • On The Road',
            time: '24/7 Roadside Support',
            tip: 'Tip: Helmets are provided for both rider and pillion in compliance with Karnataka traffic laws.',
        },
        {
            num: '05',
            title: 'Hassle-Free Return & Instant Deposit Refund',
            desc: 'Drop the bike off at the agreed hub (or alternate hub for one-way rentals). A quick 60-second fuel and odometer check is completed, and refundable deposits are released instantly.',
            icon: <CurrencyRupeeIcon sx={{ fontSize: 30, color: '#10B981' }} />,
            tag: 'Step 5 • Return & Settle',
            time: 'Instant refund release',
            tip: 'Tip: One-way drops between Honnavar Railway Station and Palya Main Rd are supported seamlessly.',
        },
    ];

    const checklist = [
        { title: 'Original Driving License', desc: 'Valid Indian DL or International Driving Permit (Learner licenses not accepted).' },
        { title: 'Government Photo ID', desc: 'Aadhaar Card, Passport, or Voter ID for proof of identity.' },
        { title: 'Smartphone', desc: 'To access your digital RC, booking receipt, and insurance documents on the go.' },
        { title: 'Payment Method', desc: 'UPI, Credit/Debit Card, or Net Banking for instant automated checkout.' },
    ];

    const faqs = [
        {
            q: 'Can I pick up at Honnavar Railway Station and return at Palya Main Rd?',
            a: 'Yes! One-way store rentals are fully supported between our two Honnavar hubs with zero friction. Select your desired pickup and return locations during checkout.',
        },
        {
            q: 'What is the fuel and kilometer policy?',
            a: 'All bikes are handed over with sufficient fuel to reach nearby fuel pumps on NH-66. Return with equivalent fuel level, or opt for a convenient prepaid fuel package.',
        },
        {
            q: 'Are helmets provided free of cost?',
            a: 'Yes! Sanitized, ISI-certified safety helmets are provided complimentary with every rental booking. Pillion helmets and mobile mounts are also available at the hub counter.',
        },
        {
            q: 'What happens if I experience a flat tire or mechanical breakdown?',
            a: 'We operate 24/7 roadside assistance across Honnavar, Apsarakonda, Mirjan, Kumta, and Murudeshwar. If an issue cannot be resolved on-site within 45 minutes, a replacement bike is dispatched.',
        },
        {
            q: 'Can I extend my rental while traveling?',
            a: 'Yes! You can extend your active rental directly from your online account dashboard if there are no conflicting reservations for your vehicle.',
        },
    ];

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
            },
        })),
    };

    return (
        <AppLayout>
            <PageHead
                title="How It Works – 4 Simple Steps to Rent a Bike in Honnavar"
                description="Rent bikes in Honnavar in 4 easy steps: select fleet, complete 2-minute digital KYC, pick up at Railway Station or Palya Main Rd, and ride Karavali coast."
                canonicalUrl="https://whizwheels.in/how-it-works"
                ogImage="/images/logo.png"
                ogType="website"
                structuredData={faqSchema}
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
                        {/* Left Column: Process Overview & CTAs */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            {/* Breadcrumbs */}
                            <Breadcrumbs sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                                <Typography component={Link} href="/" variant="caption" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Home
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                    How It Works
                                </Typography>
                            </Breadcrumbs>

                            <Chip
                                icon={<KeyIcon sx={{ fontSize: '1rem !important', color: '#F59E0B' }} />}
                                label="Simple & Transparent • 5-Step Process"
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
                                How Bike Rental Works in{' '}
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Honnavar
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
                                Rent a two-wheeler in Honnavar in just a few clicks. No paperwork delays, zero hidden charges, and transparent instant key handovers right at your arrival point.
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
                                    Browse Fleet & Book
                                </Button>
                                <Button
                                    component={Link}
                                    href="/terms"
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        fontWeight: 700,
                                        px: 3,
                                        py: 1.3,
                                        borderRadius: 2,
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                        color: isDark ? '#F1F5F9' : '#0F172A',
                                        '&:hover': { borderColor: '#F59E0B', color: '#F59E0B' },
                                    }}
                                >
                                    Read Rental Terms
                                </Button>
                            </Stack>

                            {/* Trust Highlight Chips */}
                            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                                {[
                                    'Takes Under 5 Minutes',
                                    '100% Digital Document Verification',
                                    'Free ISI Helmet Included',
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

                        {/* Right Column: Express Pickup Timeline Showcase Card */}
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
                                    <Chip
                                        label="⚡ Express Handover Guarantee"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(14, 165, 233, 0.12)', color: '#38BDF8', fontWeight: 800 }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                        ● Quick & Hassle-Free
                                    </Typography>
                                </Box>

                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5 }}>
                                    From Train to Road in 5 Mins
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3 }}>
                                    Arriving at Honnavar Railway Station? Our staff greets you with vehicle keys ready.
                                </Typography>

                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        {
                                            step: '1',
                                            title: 'Instant Online Reservation',
                                            desc: 'Lock in your Activa or Enfield in 60 seconds with clear pricing.',
                                        },
                                        {
                                            step: '2',
                                            title: 'Digital KYC in 2 Minutes',
                                            desc: 'Upload Driving License & Govt ID on your phone before arrival.',
                                        },
                                        {
                                            step: '3',
                                            title: 'Inspect & Ride Away',
                                            desc: 'Quick 2-minute vehicle walkthrough, helmet handover, and off you go.',
                                        },
                                    ].map((s, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                                                    color: '#F59E0B',
                                                    fontWeight: 900,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                {s.step}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {s.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.4 }}>
                                                    {s.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>

                                <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 2 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Have questions on documents?
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                                            WhatsApp +91 8660989586
                                        </Typography>
                                    </Box>
                                    <Button
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20what%20documents%20do%20I%20need%20to%20rent%20a%20bike?"
                                        target="_blank"
                                        rel="noreferrer"
                                        size="small"
                                        variant="outlined"
                                        color="success"
                                        startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                    >
                                        Ask on WhatsApp
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                {/* 5-Stage Step Ribbon */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 7,
                        borderRadius: 3.5,
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                        backdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        overflowX: 'auto',
                    }}
                >
                    <Grid container spacing={2} sx={{ minWidth: { xs: 650, md: 'auto' } }}>
                        {steps.map((s, idx) => (
                            <Grid size={{ xs: 2.4 }} key={idx}>
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                            color: '#D97706',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 900,
                                            fontSize: '0.9rem',
                                            mx: 'auto',
                                            mb: 1,
                                        }}
                                    >
                                        {s.num}
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', display: 'block', lineHeight: 1.2 }}>
                                        {s.title.split('&')[0]}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600, fontSize: '0.68rem' }}>
                                        {s.time}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Detailed Steps List */}
                <Stack spacing={3.5} sx={{ mb: 8 }}>
                    {steps.map((step, index) => (
                        <Paper
                            key={index}
                            elevation={0}
                            sx={{
                                p: { xs: 3, sm: 4 },
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                backdropFilter: 'blur(16px)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#F59E0B',
                                    transform: 'translateY(-2px)',
                                    boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.06)',
                                },
                            }}
                        >
                            <Grid container spacing={3} alignItems="center">
                                <Grid size={{ xs: 12, sm: 2, md: 1.5 }} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 900,
                                            color: '#F59E0B',
                                            lineHeight: 1,
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {step.num}
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 7, md: 8 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC' }}>
                                            {step.icon}
                                        </Box>
                                        <Box>
                                            <Chip label={step.tag} size="small" sx={{ fontWeight: 700, height: 20, mb: 0.5, fontSize: '0.7rem', bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }} />
                                            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                {step.title}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.7, mb: 1.5 }}>
                                        {step.desc}
                                    </Typography>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB', border: '1px dashed', borderColor: '#FDE68A' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#FBBF24' : '#B45309', fontWeight: 600 }}>
                                            {step.tip}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 3, md: 2.5 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <Chip
                                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                        label={step.time}
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Stack>

                {/* What You Need to Bring Section */}
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
                        <AssignmentTurnedInIcon sx={{ color: '#10B981', fontSize: 26 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                            What You Need to Bring for Pickup
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5 }}>
                        Ensure you have the following essentials ready when you arrive at our Honnavar hub counters.
                    </Typography>

                    <Grid container spacing={2.5}>
                        {checklist.map((item, idx) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        height: '100%',
                                        borderRadius: 3,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                    }}
                                >
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22, mt: 0.2, flexShrink: 0 }} />
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5 }}>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>
                                            {item.desc}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Rental FAQ Section */}
                <Box sx={{ mb: 8 }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Chip label="Rental Queries Solved" size="small" sx={{ fontWeight: 700, mb: 1.5, bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', color: '#D97706' }} />
                        <Typography variant="h3" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1, fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                            Frequently Asked Rental Questions
                        </Typography>
                        <Typography variant="body1" sx={{ color: isDark ? '#94A3B8' : '#64748B', maxWidth: 650, mx: 'auto' }}>
                            Everything you need to know about our rental process, fuel, helmets, and roadside assistance.
                        </Typography>
                    </Box>

                    <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
                        {faqs.map((faq, i) => (
                            <Accordion
                                key={i}
                                defaultExpanded={i === 0}
                                sx={{
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                                    borderRadius: '16px !important',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    '&:before': { display: 'none' },
                                    overflow: 'hidden',
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#94A3B8' : '#64748B' }} />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <HelpOutlineIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            {faq.q}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 2.5, px: { xs: 2, sm: 3 } }}>
                                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.7, pl: 4.25 }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Box>

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
                        Ready to Begin Your Honnavar Journey?
                    </Typography>
                    <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#475569', maxWidth: 640, mx: 'auto', mb: 3.5, lineHeight: 1.7, textAlign: 'center' }}>
                        Choose your bike model, pick your dates, and experience coastal Karnataka on two wheels.
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
                            Select Your Bike Now
                        </Button>
                        <Button
                            component="a"
                            href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20have%20a%20question%20about%20how%20rentals%20work."
                            target="_blank"
                            rel="noreferrer"
                            variant="outlined"
                            size="large"
                            startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                            sx={{
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.3,
                                borderRadius: 2,
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                color: isDark ? '#F1F5F9' : '#0F172A',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { borderColor: '#10B981', color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                            }}
                        >
                            Ask on WhatsApp
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </AppLayout>
    );
}

import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Breadcrumbs,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';
import BadgeIcon from '@mui/icons-material/Badge';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HandymanIcon from '@mui/icons-material/Handyman';
import BlockIcon from '@mui/icons-material/Block';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Terms() {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const [selectedCategory, setSelectedCategory] = useState('all');

    const termSections = [
        {
            id: 'eligibility',
            category: 'eligibility',
            icon: <BadgeIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '1. Rider Eligibility & KYC Verification',
            summary: 'Age 18+ with original valid Driving License for Two-Wheelers with Gear / Without Gear.',
            badge: 'Mandatory',
            badgeColor: 'warning',
            details: [
                'The primary rider must be at least 18 years of age at the time of vehicle handover.',
                'A valid Indian Driving License (or International Driving Permit for foreign nationals) is strictly mandatory. Learner licenses (LLR) are not accepted.',
                'Government-issued photo identity proof (Aadhaar Card, Passport, or Voter ID) must be uploaded digitally through your customer portal or presented at the store counter.',
                'The vehicle must only be operated by the registered and verified rider. Subletting or permitting unverified individuals to ride is strictly prohibited.',
            ],
        },
        {
            id: 'deposit',
            category: 'deposit',
            icon: <MonetizationOnIcon sx={{ color: '#10B981', fontSize: 26 }} />,
            title: '2. Security Deposit & Pricing Transparency',
            summary: 'Transparent hourly & daily rates with zero hidden charges. Zero-deposit available for verified riders.',
            badge: 'Zero Hidden Fees',
            badgeColor: 'success',
            details: [
                'All rentals feature zero hidden charges. Prices shown during booking include GST and standard commercial third-party insurance.',
                'Zero security deposit is applicable for riders with fully verified digital KYC. In select premium categories (e.g. Royal Enfield 350), a refundable deposit of ₹500–₹1,500 may apply.',
                'Refundable security deposits are credited back to the original payment source or UPI within 2 to 4 hours of vehicle return inspection.',
                'Late returns exceeding a 30-minute grace period will be billed at regular hourly rates plus a nominal late fee.',
            ],
        },
        {
            id: 'fuel',
            category: 'fuel',
            icon: <LocalGasStationIcon sx={{ color: '#38BDF8', fontSize: 26 }} />,
            title: '3. Fuel Policy & Speed Guidelines',
            summary: 'Delivered with sufficient fuel to reach the nearest pump; return with equivalent fuel level.',
            badge: 'Fair Policy',
            badgeColor: 'info',
            details: [
                'Vehicles are dispatched with sufficient fuel to reach any of the nearby petrol bunks on NH-66 in Honnavar.',
                'Riders are requested to return the bike with an equivalent fuel gauge level. Surplus fuel left in the tank is non-refundable.',
                'For safety and engine longevity, maximum recommended highway speed is 70 km/h for scooters and 80 km/h for motorcycles. Rash or negligent driving reported by GPS or traffic authorities may result in immediate trip termination.',
            ],
        },
        {
            id: 'helmets',
            category: 'safety',
            icon: <SportsMotorsportsIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '4. Helmets & Road Safety Compliance',
            summary: 'Complimentary ISI-certified helmets provided for primary rider and pillion.',
            badge: 'Safety First',
            badgeColor: 'primary',
            details: [
                'One sanitized, ISI-certified safety helmet is provided free of cost with every vehicle.',
                'An extra pillion helmet is available upon request at the store counter.',
                'Riders must wear helmets at all times in compliance with Karnataka Motor Vehicles Rules. Any traffic fines or challans incurred during the rental tenure are the sole responsibility of the renter.',
            ],
        },
        {
            id: 'cancellation',
            category: 'cancellation',
            icon: <EventBusyIcon sx={{ color: '#EC4899', fontSize: 26 }} />,
            title: '5. Cancellation, Modifications & Refunds',
            summary: '100% instant refund if cancelled at least 2 hours before scheduled pickup time.',
            badge: '100% Refundable',
            badgeColor: 'success',
            details: [
                'Free Cancellation: Cancel your reservation up to 2 hours prior to scheduled pickup for a 100% full refund.',
                'Cancellations made within 2 hours of pickup may attract a nominal one-hour rental charge.',
                'Booking rescheduling (date, time, or bike model upgrade) is permitted at zero additional charge subject to fleet availability.',
                'Early returns do not qualify for prorated refunds once the rental tenure has commenced.',
            ],
        },
        {
            id: 'breakdown',
            category: 'breakdown',
            icon: <HandymanIcon sx={{ color: '#8B5CF6', fontSize: 26 }} />,
            title: '6. Roadside Assistance & Breakdown Support',
            summary: '24/7 on-call roadside assistance across Honnavar, Apsarakonda, Mirjan, and Kumta stretch.',
            badge: '24/7 Recovery',
            badgeColor: 'secondary',
            details: [
                'GK WhizWheels offers 24x7 breakdown response. In the rare event of a mechanical malfunction or flat tire, contact our dedicated helpline immediately.',
                'If a vehicle cannot be repaired on-site within 45 minutes, a replacement bike of equivalent or higher category will be dispatched to your location free of cost.',
                'Accidental damage caused by rider negligence, driving under the influence of alcohol, or off-road excursions will be assessed at authorized dealership repair cost.',
            ],
        },
        {
            id: 'prohibited',
            category: 'prohibited',
            icon: <BlockIcon sx={{ color: '#EF4444', fontSize: 26 }} />,
            title: '7. Prohibited Uses & Territory Restrictions',
            summary: 'Strictly for personal tourist exploration. No commercial delivery, stunts, or beach riding.',
            badge: 'Strict Policy',
            badgeColor: 'error',
            details: [
                'Riding on sea beaches, tidal mudflats, or waterlogged backwater terrain is strictly prohibited due to salt corrosion and safety laws.',
                'Using rental vehicles for commercial goods delivery, parcel courier, or racing competitions is prohibited and voids all insurance protections.',
                'Renting under false identity or letting an unlicensed companion ride constitutes a criminal breach of contract.',
            ],
        },
    ];

    const filterCategories = [
        { id: 'all', label: 'All Policies' },
        { id: 'eligibility', label: 'KYC & Eligibility' },
        { id: 'deposit', label: 'Deposit & Pricing' },
        { id: 'fuel', label: 'Fuel & Speed' },
        { id: 'safety', label: 'Helmets & Safety' },
        { id: 'cancellation', label: 'Cancellations' },
        { id: 'breakdown', label: '24/7 Breakdown' },
        { id: 'prohibited', label: 'Restrictions' },
    ];

    const filteredSections = selectedCategory === 'all'
        ? termSections
        : termSections.filter((s) => s.category === selectedCategory);

    return (
        <AppLayout>
            <Head title="Rental Terms & Conditions - GK WhizWheels Honnavar" />

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
                        {/* Left Column: Guidelines Overview & CTAs */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            {/* Breadcrumbs */}
                            <Breadcrumbs sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                                <Typography component={Link} href="/" variant="caption" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Home
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                    Rental Terms & Guidelines
                                </Typography>
                            </Breadcrumbs>

                            <Chip
                                icon={<GavelIcon sx={{ fontSize: '1rem !important', color: '#F59E0B' }} />}
                                label="Transparent & Fair Policies • Zero Hidden Fees"
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
                                Rental Terms &{' '}
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Customer Guidelines
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
                                We keep our rental guidelines transparent, straightforward, and fair to travelers. Read our policies regarding eligibility, zero-deposit checkout, safety, and 24/7 roadside assistance before hitting the road.
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
                                    Browse Available Fleet
                                </Button>
                                <Button
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20have%20a%20question%20regarding%20rental%20terms."
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
                                    Inquire on WhatsApp
                                </Button>
                            </Stack>

                            {/* Trust Highlight Chips */}
                            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                                {[
                                    '100% Upfront Pricing',
                                    'Zero Deposit with KYC',
                                    'Free ISI Helmet Provided',
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

                        {/* Right Column: Rider Protection Showcase Card */}
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
                                        icon={<ShieldIcon sx={{ fontSize: 16, color: '#10B981 !important' }} />}
                                        label="Rider Protection Guarantee"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 800 }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700 }}>
                                        Honnavar Standard
                                    </Typography>
                                </Box>

                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5 }}>
                                    Clear & Fair Policies
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3 }}>
                                    Everything you need to know before taking your two-wheeler on Karnataka’s scenic coastal roads.
                                </Typography>

                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        {
                                            icon: <MonetizationOnIcon sx={{ color: '#10B981', fontSize: 20 }} />,
                                            title: 'Zero Hidden Charges',
                                            desc: 'Rental rates are all-inclusive with maintenance and routine wear covered.',
                                        },
                                        {
                                            icon: <BadgeIcon sx={{ color: '#F59E0B', fontSize: 20 }} />,
                                            title: 'Zero Deposit Eligibility',
                                            desc: 'Available for travelers with verified original Aadhaar/Govt ID & Driving License.',
                                        },
                                        {
                                            icon: <SportsMotorsportsIcon sx={{ color: '#38BDF8', fontSize: 20 }} />,
                                            title: 'Sanitized ISI Helmets Included',
                                            desc: 'Every ride includes clean, certified helmets for rider and pillion.',
                                        },
                                    ].map((item, idx) => (
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
                                                {item.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {item.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1.4 }}>
                                                    {item.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>

                                <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 2 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                            Roadside helpline
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F59E0B' }}>
                                            +91 8660989586
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
                                        Station Desk
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                {/* Category Filter Chips */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, color: 'text.secondary' }}>
                        <FilterListIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                            Filter:
                        </Typography>
                    </Box>
                    {filterCategories.map((cat) => (
                        <Chip
                            key={cat.id}
                            label={cat.label}
                            clickable
                            color={selectedCategory === cat.id ? 'secondary' : 'default'}
                            variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                            onClick={() => setSelectedCategory(cat.id)}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                borderRadius: 2,
                            }}
                        />
                    ))}
                </Box>

                <Grid container spacing={4}>
                    {/* Left: Detailed Accordion Rules */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={2.5}>
                            {filteredSections.map((section) => (
                                <Accordion
                                    key={section.id}
                                    defaultExpanded={true}
                                    sx={{
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                        borderRadius: '16px !important',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                                        overflow: 'hidden',
                                        '&:before': { display: 'none' },
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#94A3B8' : '#64748B' }} />}
                                        sx={{
                                            p: { xs: 2, sm: 2.5 },
                                            '& .MuiAccordionSummary-content': { my: 0.5 },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <Box
                                                sx={{
                                                    p: 1.2,
                                                    borderRadius: 2.5,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {section.icon}
                                            </Box>
                                            <Box sx={{ flexGrow: 1, pr: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                        {section.title}
                                                    </Typography>
                                                    <Chip label={section.badge} color={section.badgeColor} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                                                </Box>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                    {section.summary}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }} />
                                    <AccordionDetails sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(248, 250, 252, 0.6)' }}>
                                        <Stack spacing={1.8}>
                                            {section.details.map((item, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            bgcolor: '#F59E0B',
                                                            mt: 1,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.7 }}>
                                                        {item}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Right: Summary Card & Quick Help */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3} sx={{ position: { md: 'sticky' }, top: { md: 90 } }}>
                            <Card
                                elevation={0}
                                sx={{
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
                                    borderRadius: 3.5,
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)',
                                    p: 3,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1 }}>
                                    Ready to Book Your Ride?
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3, lineHeight: 1.6 }}>
                                    Browse our fleet of Honda Activas, Royal Enfields, and commuters ready for instant pickup in Honnavar.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    size="large"
                                    component={Link}
                                    href="/services/bikes"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        py: 1.3,
                                        fontWeight: 800,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                        mb: 1.5,
                                    }}
                                >
                                    Browse Bikes
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="large"
                                    component={Link}
                                    href="/how-it-works"
                                    sx={{
                                        py: 1.2,
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        color: isDark ? '#F1F5F9' : '#0F172A',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                    }}
                                >
                                    How It Works
                                </Button>
                            </Card>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1 }}>
                                    Have Questions or Special Needs?
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 2.5 }}>
                                    Our local support desk is reachable 24/7 on WhatsApp or direct telephone.
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        fullWidth
                                        startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                        component="a"
                                        href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20have%20a%20question%20regarding%20rental%20terms."
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{
                                            justifyContent: 'flex-start',
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                                            color: isDark ? '#F1F5F9' : '#0F172A',
                                            '&:hover': { borderColor: '#10B981', color: '#10B981' },
                                        }}
                                    >
                                        WhatsApp: +91 8660989586
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        fullWidth
                                        startIcon={<PhoneIcon sx={{ color: '#F59E0B' }} />}
                                        component="a"
                                        href="tel:09731699125"
                                        sx={{
                                            justifyContent: 'flex-start',
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                                            color: isDark ? '#F1F5F9' : '#0F172A',
                                            '&:hover': { borderColor: '#F59E0B', color: '#F59E0B' },
                                        }}
                                    >
                                        Call Desk: 097316 99125
                                    </Button>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>

                {/* Standardized Bottom CTA Banner */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        mt: 8,
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
                        Clear Terms, Premium Rides, Zero Friction.
                    </Typography>
                    <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#475569', maxWidth: 640, mx: 'auto', mb: 3.5, lineHeight: 1.7, textAlign: 'center' }}>
                        Explore the coastal beauty of Honnavar on your own terms with 100% road-legal commercial bikes and verified safety helmets.
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
                            Select Your Bike
                        </Button>
                        <Button
                            component={Link}
                            href="/contact"
                            variant="outlined"
                            size="large"
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
                            Talk to Store Manager
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </AppLayout>
    );
}

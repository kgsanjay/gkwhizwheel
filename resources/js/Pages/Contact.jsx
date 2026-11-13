import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import { marketingHeroBackground } from '../Components/Marketing/MarketingPageHero';
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
    TextField,
    Alert,
    Divider,
    Breadcrumbs,
    MenuItem,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsIcon from '@mui/icons-material/Directions';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function Contact() {
    const { public_branches: publicBranches = [] } = usePage().props;
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const contactBranches = publicBranches.length > 0
        ? publicBranches
        : [
            {
                id: 1,
                public_name: 'GK WhizWheels Honnavar Hub',
                city: 'Honnavar',
                address_line: 'Palya Main Rd, Honnavar',
                state: 'Karnataka',
                pincode: '581334',
                phone: '+918660989586',
                latitude: '14.2800000',
                longitude: '74.4500000',
                slug: 'honnavar',
            },
            {
                id: 52,
                public_name: 'GK WhizWheels Murudeshwar Hub',
                city: 'Murudeshwar',
                address_line: 'Temple Main Road, near KSRTC Bus Stand',
                state: 'Karnataka',
                pincode: '581350',
                phone: '+917892094155',
                latitude: '14.0946201',
                longitude: '74.4892104',
                google_maps_url: 'https://maps.app.goo.gl/y94Ap38BbZGWGSDdA',
                slug: 'murudeshwar',
            },
        ];

    const formatPhone = (raw) => {
        const digits = String(raw || '').replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) {
            return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
        }
        return raw || '+91 86609 89586';
    };

    const honnavarBranch = contactBranches[0];
    const murudeshwarBranch = contactBranches[1] || contactBranches[0];
    const honnavarPhone = honnavarBranch?.phone || '+918660989586';
    const murudeshwarPhone = murudeshwarBranch?.phone || '+917892094155';

    const [formSubmitted, setFormSubmitted] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        dates: '',
        category: 'Any Category',
        message: '',
    });

    const handleCopyPhone = (number) => {
        navigator.clipboard.writeText(number);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);
    };

    const handleSendViaWhatsApp = () => {
        const text = encodeURIComponent(
            `*New Rental Inquiry - GK WhizWheels*\n` +
            `*Name:* ${formData.name || 'Not provided'}\n` +
            `*Phone:* ${formData.phone || 'Not provided'}\n` +
            `*Dates:* ${formData.dates || 'Flexible'}\n` +
            `*Category:* ${formData.category}\n` +
            `*Message:* ${formData.message || 'I would like to inquire about bike availability.'}`
        );
        window.open(`https://wa.me/918660989586?text=${text}`, '_blank');
    };

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'GK WhizWheel - Bike Rental & Travel Services Honnavar',
        alternateName: ['GK WhizWheels', 'G.K. WhizWheel', 'Whizwheels Honnavar'],
        url: 'https://whizwheels.in/contact',
        logo: 'https://whizwheels.in/images/logo.png',
        image: 'https://whizwheels.in/images/logo.png',
        description: 'Contact GK WhizWheels for verified bike rentals, taxi cabs, backwater boating, and coastal homestays in Honnavar, Karavali coast.',
        telephone: '+918660989586',
        email: 'contact@whizwheels.in',
        priceRange: '₹350 - ₹5000',
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: '+918660989586',
                contactType: 'customer service',
                areaServed: ['Honnavar', 'Karavali coast', 'Uttara Kannada district'],
                availableLanguage: ['en', 'kn', 'hi', 'kok'],
            },
            {
                '@type': 'ContactPoint',
                telephone: '+917892094155',
                contactType: 'reservations',
                areaServed: ['Murudeshwar', 'Honnavar', 'Karavali coast'],
                availableLanguage: ['en', 'kn', 'hi', 'kok'],
            },
        ],
        areaServed: [
            { '@type': 'City', name: 'Honnavar' },
            { '@type': 'City', name: 'Murudeshwar' },
            { '@type': 'AdministrativeArea', name: 'Karavali coast' },
            { '@type': 'AdministrativeArea', name: 'Uttara Kannada district' },
        ],
        sameAs: [
            'https://share.google/GoM4iOgiuUIa7ZfwV',
            'https://maps.app.goo.gl/y94Ap38BbZGWGSDdA',
            'https://wa.me/918660989586',
        ],
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Palya Main Rd, Honnavar & Temple Main Road, Murudeshwar',
            addressLocality: 'Honnavar & Murudeshwar',
            addressRegion: 'Karnataka',
            postalCode: '581334',
            addressCountry: 'IN',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 14.2802,
            longitude: 74.4437,
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '00:00',
                closes: '23:59',
            },
        ],
    };

    return (
        <AppLayout>
            <PageHead
                title="Contact GK WhizWheel | 24/7 Honnavar & Murudeshwar Hubs"
                description="Contact GK WhizWheels across Honnavar (+91 86609 89586) and Murudeshwar (+91 78920 94155). Open 24/7 for two-wheeler rentals, cabs, boating & scuba."
                canonicalUrl="https://whizwheels.in/contact"
                ogImage="/images/logo.png"
                ogType="website"
                structuredData={structuredData}
            />

            {/* Standardized Hero Banner (Full Width with Ambient Glow) */}
            <Box
                component="section"
                sx={{
                    width: '100%',
                    position: 'relative',
                    py: { xs: 6, md: 8 },
                    px: { xs: 2, sm: 4, md: 6, lg: 8 },
                    background: marketingHeroBackground(isDark),
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
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Box sx={{ maxWidth: '1440px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={{ xs: 4, lg: 6 }} alignItems="center">
                        {/* Left Column: Contact Headings & Direct CTAs */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            {/* Breadcrumbs */}
                            <Breadcrumbs sx={{ mb: 2.5, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
                                <Typography component={Link} href="/" variant="caption" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#F59E0B' } }}>
                                    Home
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                    Contact Us
                                </Typography>
                            </Breadcrumbs>

                            <Chip
                                icon={<SupportAgentIcon sx={{ fontSize: '1rem !important', color: '#10B981' }} />}
                                label="Open 24 Hours • 7 Days a Week in Honnavar"
                                sx={{
                                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                                    color: '#10B981',
                                    fontWeight: 700,
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    mb: 2.5,
                                    py: 0.5,
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
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
                                Get in Touch with{' '}
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    GK WhizWheels
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
                                Whether you need an instant rate estimate, Railway Station pickup coordination, or 24/7 on-road recovery, our local Honnavar operations desk is always available.
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                                <Button
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20would%20like%20to%20rent%20a%20bike%20in%20Honnavar."
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    startIcon={<WhatsAppIcon />}
                                    sx={{ fontWeight: 800, px: 3.5, py: 1.3, borderRadius: 2 }}
                                >
                                    WhatsApp Booking (+91 8660989586)
                                </Button>
                                <Button
                                    component="a"
                                    href={`tel:${murudeshwarPhone}`}
                                    variant="outlined"
                                    size="large"
                                    startIcon={<PhoneIcon sx={{ color: '#F59E0B' }} />}
                                    sx={{
                                        fontWeight: 700,
                                        px: 3,
                                        py: 1.3,
                                        borderRadius: 2,
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                        color: isDark ? '#F1F5F9' : '#0F172A',
                                        '&:hover': { borderColor: '#F59E0B' },
                                    }}
                                >
                                    Murudeshwar: {formatPhone(murudeshwarPhone)}
                                </Button>
                            </Stack>

                            {/* Trust Highlight Chips */}
                            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
                                {[
                                    'Average Response: < 2 Minutes',
                                    'Direct Station Pickup Counter',
                                    '24/7 Breakdown Assistance',
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

                        {/* Right Column: Direct Helpline Showcase Card */}
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
                                        icon={<SupportAgentIcon sx={{ fontSize: 16, color: '#10B981 !important' }} />}
                                        label="Live Coastal Desks • 24/7"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 800 }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                        ● Online &amp; Taking Calls
                                    </Typography>
                                </Box>

                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5 }}>
                                    Branch Helplines
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3 }}>
                                    Call or WhatsApp our Honnavar or Murudeshwar desks for instant pickups, station transfers, and custom tours.
                                </Typography>

                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {contactBranches.map((hub, idx) => {
                                        const hubPhone = hub.phone || '+918660989586';
                                        const isPrimary = idx === 0;
                                        return (
                                            <Box
                                                key={hub.id}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2.5,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 1.5,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <PhoneIcon sx={{ color: isPrimary ? '#F59E0B' : '#10B981' }} />
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block' }}>
                                                            {hub.city || hub.name} 24/7 Desk
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                            {formatPhone(hubPhone)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Button
                                                    component="a"
                                                    href={`tel:${hubPhone}`}
                                                    size="small"
                                                    variant={isPrimary ? 'contained' : 'outlined'}
                                                    color={isPrimary ? 'secondary' : 'primary'}
                                                    sx={{
                                                        fontWeight: 700,
                                                        borderRadius: 2,
                                                        ...(isPrimary ? {} : {
                                                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                                        }),
                                                    }}
                                                >
                                                    Call
                                                </Button>
                                            </Box>
                                        );
                                    })}
                                </Stack>

                                <Divider sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', mb: 2 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmailIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                            contact@whizwheels.in
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                                        Honnavar & Murudeshwar, Karnataka
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Main Content */}
            <Container maxWidth={false} sx={{ maxWidth: '1440px', py: { xs: 6, md: 8 } }}>
                {/* Dual Store Hubs Section */}
                <Box sx={{ mb: 8 }}>
                    <Box sx={{ mb: 4 }}>
                        <Chip label="Visit Our Operational Hubs" size="small" sx={{ fontWeight: 700, mb: 1, bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', color: '#D97706' }} />
                        <Typography variant="h3" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                            Two Live Branches Across Honnavar & Murudeshwar
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Direct 24/7 key handover, verified commercial yellow-plate bikes, and local support at both coastal hubs.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {contactBranches.map((hub, idx) => {
                            const isPrimary = idx === 0;
                            const accent = isPrimary ? '#F59E0B' : '#10B981';
                            const hubCity = hub.city || hub.name || (isPrimary ? 'Honnavar' : 'Murudeshwar');
                            const hubTitle = hub.public_name || `${hubCity} Hub`;
                            const hubPhone = hub.phone || (isPrimary ? '+918660989586' : '+917892094155');
                            const hubAddress = [hub.address_line, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ');
                            const mapQuery = hub.latitude && hub.longitude
                                ? `${hub.latitude},${hub.longitude}`
                                : encodeURIComponent(hubAddress || `${hubCity}, Karnataka`);
                            const directionsUrl = hub.google_maps_url
                                || `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
                            const branchSlug = hub.slug || hubCity.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                            return (
                                <Grid key={hub.id || hubCity} size={{ xs: 12, md: 6 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 3, sm: 4 },
                                            height: '100%',
                                            borderRadius: 3.5,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                            backdropFilter: 'blur(16px)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: accent,
                                                boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.06)',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: isPrimary ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: accent }}>
                                                <LocationOnIcon fontSize="medium" />
                                            </Box>
                                            <Box>
                                                <Chip
                                                    label={isPrimary ? 'Headquarters & Main Fleet' : 'Temple & Beach Corridor Hub'}
                                                    size="small"
                                                    color={isPrimary ? 'secondary' : 'success'}
                                                    sx={{ fontWeight: 700, height: 20, mb: 0.5, fontSize: '0.7rem' }}
                                                />
                                                <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {hubTitle}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 2.5, lineHeight: 1.7 }}>
                                            {hubAddress}
                                        </Typography>

                                        <Box
                                            sx={{
                                                mb: 2.5,
                                                borderRadius: 2.5,
                                                overflow: 'hidden',
                                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                                                height: 200,
                                                bgcolor: isDark ? '#0B1120' : '#F8FAFC',
                                            }}
                                        >
                                            <iframe
                                                title={`${hubTitle} Location Map`}
                                                src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        </Box>

                                        <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                <AccessTimeIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                                <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600 }}>
                                                    Open 24 Hours • Every Day of the Week
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                <PhoneIcon sx={{ fontSize: 18, color: '#38BDF8' }} />
                                                <Typography
                                                    component="a"
                                                    href={`tel:${hubPhone}`}
                                                    variant="body2"
                                                    sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 700, textDecoration: 'none', '&:hover': { color: accent } }}
                                                >
                                                    {formatPhone(hubPhone)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                <EmailIcon sx={{ fontSize: 18, color: '#A855F7' }} />
                                                <Typography
                                                    component="a"
                                                    href="mailto:contact@whizwheels.in"
                                                    variant="body2"
                                                    sx={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 600, textDecoration: 'none', '&:hover': { color: accent } }}
                                                >
                                                    contact@whizwheels.in
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                            <Button
                                                component={Link}
                                                href={`/bike-rentals/branches/${hub.id}/${branchSlug}`}
                                                variant="contained"
                                                color={isPrimary ? 'secondary' : 'success'}
                                                sx={{ fontWeight: 800, borderRadius: 2, py: 1, flex: 1 }}
                                            >
                                                View {hubCity} Fleet →
                                            </Button>
                                            <Button
                                                component="a"
                                                href={directionsUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                variant="outlined"
                                                color={isPrimary ? 'primary' : 'success'}
                                                startIcon={<DirectionsIcon />}
                                                sx={{ fontWeight: 800, borderRadius: 2, py: 1, flex: 1 }}
                                            >
                                                Get Directions
                                            </Button>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>

                {/* Instant Connect & Message Form */}
                <Grid container spacing={4} sx={{ mb: 8 }}>
                    {/* Left: Quick Channels */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3.5, sm: 4 },
                                height: '100%',
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                backdropFilter: 'blur(16px)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1.5 }}>
                                Need Immediate Assistance?
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3, lineHeight: 1.7 }}>
                                Planning a weekend trip or arriving by night train? Chat directly with our hub manager for instant bike reservation or roadside assistance.
                            </Typography>

                            <Stack spacing={2} sx={{ mb: 3.5 }}>
                                <Button
                                    component="a"
                                    href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20am%20looking%20to%20rent%20a%20bike%20in%20Honnavar."
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    startIcon={<WhatsAppIcon />}
                                    sx={{ fontWeight: 800, py: 1.3, borderRadius: 2 }}
                                >
                                    Chat on WhatsApp (+91 8660989586)
                                </Button>
                                <Button
                                    component="a"
                                    href={`tel:${murudeshwarPhone}`}
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    startIcon={<PhoneIcon />}
                                    sx={{ fontWeight: 800, py: 1.3, borderRadius: 2 }}
                                >
                                    Murudeshwar Desk ({formatPhone(murudeshwarPhone)})
                                </Button>
                            </Stack>

                            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC', border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                        Quick Copy Numbers
                                    </Typography>
                                    {copiedPhone && <Chip label="Copied!" color="success" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
                                        onClick={() => handleCopyPhone('+918660989586')}
                                        sx={{ textTransform: 'none', fontSize: '0.78rem', borderRadius: 1.5 }}
                                    >
                                        +91 8660989586
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
                                        onClick={() => handleCopyPhone(murudeshwarPhone)}
                                        sx={{ textTransform: 'none', fontSize: '0.78rem', borderRadius: 1.5 }}
                                    >
                                        {formatPhone(murudeshwarPhone)}
                                    </Button>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right: Message Form */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3.5, sm: 4 },
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                backdropFilter: 'blur(16px)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1 }}>
                                Send Us a Rental Inquiry
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 3 }}>
                                Tell us about your planned travel dates and preferred vehicle. Our operations manager will respond within 15 minutes.
                            </Typography>

                            {formSubmitted && (
                                <Alert
                                    severity="success"
                                    icon={<CheckCircleIcon />}
                                    sx={{ mb: 3, borderRadius: 2 }}
                                    action={
                                        <Button color="inherit" size="small" onClick={handleSendViaWhatsApp} sx={{ fontWeight: 700 }}>
                                            Open WhatsApp
                                        </Button>
                                    }
                                >
                                    Thank you! Your inquiry has been logged. Want instant priority? Click "Open WhatsApp" to connect right now.
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            required
                                            label="Your Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            required
                                            label="Phone Number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Email (Optional)"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Travel Dates"
                                            placeholder="e.g. 15 Oct to 18 Oct"
                                            value={formData.dates}
                                            onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Preferred Vehicle Category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        >
                                            <MenuItem value="Any Category">Any Category (Best Available)</MenuItem>
                                            <MenuItem value="Scooter (Activa / Jupiter)">Scooter (Honda Activa / TVS Jupiter)</MenuItem>
                                            <MenuItem value="Cruiser (Royal Enfield 350)">Cruiser (Royal Enfield Classic 350)</MenuItem>
                                            <MenuItem value="Commuter (Honda Shine / Splendor)">Commuter (Honda Shine 125 / Hero)</MenuItem>
                                            <MenuItem value="Electric Scooter">Electric Scooter (EV Green)</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Your Message or Special Request"
                                            placeholder="Mention helmet requirements, station train arrival time, or itinerary questions..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="secondary"
                                                size="large"
                                                endIcon={<SendIcon />}
                                                sx={{ fontWeight: 800, px: 4, py: 1.2, borderRadius: 2 }}
                                            >
                                                Submit Inquiry
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                color="success"
                                                size="large"
                                                startIcon={<WhatsAppIcon />}
                                                onClick={handleSendViaWhatsApp}
                                                sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
                                            >
                                                Send Directly to WhatsApp
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

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
                        Check live fleet availability, lock your dates in 60 seconds, and get ready for an unforgettable coastal ride.
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
                            href="/how-it-works"
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
                            View Rental Process
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </AppLayout>
    );
}

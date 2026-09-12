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
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import ShieldIcon from '@mui/icons-material/Shield';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';

export default function Privacy() {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const [selectedCategory, setSelectedCategory] = useState('all');

    const privacySections = [
        {
            id: 'info-collected',
            category: 'collection',
            icon: <BadgeIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '1. Information We Collect',
            summary: 'Personal identification, KYC credentials, location telemetry, and booking history.',
            badge: 'Essential',
            badgeColor: 'warning',
            details: [
                'Account Information: Full name, mobile phone number, email address, and authentication credentials.',
                'KYC & Government ID Verification: Digital photographs or scans of your Indian Driving License (DL) and Proof of Identity (Aadhaar Card or Passport). This is mandated under Indian Motor Vehicles Act for self-drive commercial vehicle rentals.',
                'Location & GPS Telemetry: Precise and approximate geolocation data collected when you use our mobile application to locate nearby rental stations, calculate route distances, and provide 24/7 roadside emergency breakdown assistance across coastal Karnataka.',
                'Transaction & Payment Records: Booking details, rental duration, transaction reference identifiers, and payment gateway responses. We do NOT store credit/debit card numbers or UPI PINs on our servers (payments are handled securely via PCI-DSS certified Razorpay and PhonePe).',
                'Device & Diagnostic Telemetry: Mobile operating system version, device hardware model, crash logs, and screen view analytics to guarantee app stability and customer experience.',
            ],
        },
        {
            id: 'purpose',
            category: 'usage',
            icon: <VerifiedUserIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '2. How We Use Your Information',
            summary: 'Identity verification, vehicle dispatch, roadside safety, and statutory compliance.',
            badge: 'Legitimate Use',
            badgeColor: 'info',
            details: [
                'Fulfilling vehicle reservations, station platform handover, and return check-in processing.',
                'Verifying that the operator possesses an active, valid driving license and meets minimum age requirements.',
                'Dispatching roadside assistance and mechanics in the event of an emergency or breakdown along the coastal belt (Honnavar, Gokarna, Murudeshwar, Jog Falls).',
                'Sending transactional notifications, reservation confirmations, invoice receipts, and vehicle return reminders via SMS, WhatsApp, and Push Notifications.',
                'Complying with statutory reporting requirements under the Karnataka State Motor Vehicles Department and law enforcement inquiries.',
            ],
        },
        {
            id: 'sharing',
            category: 'sharing',
            icon: <SecurityIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '3. Data Sharing & Third-Party Disclosures',
            summary: 'Strict zero-sale policy; sharing strictly restricted to certified service partners.',
            badge: 'Zero Data Sale',
            badgeColor: 'success',
            details: [
                'We NEVER sell, trade, or rent your personal information to third-party data brokers or advertisers.',
                'Payment Processors: Transaction details are transmitted securely to RBI-authorized, PCI-DSS Level 1 payment gateways (Razorpay, PhonePe).',
                'Cloud Infrastructure & Storage: Encrypted KYC images and database records are hosted on secure enterprise cloud servers with strict firewall and role-based access policies.',
                'Legal & Law Enforcement: In the event of a traffic violation, accident, or official police investigation involving a rental vehicle, relevant booking and KYC records may be provided to competent authorities as required by Indian law.',
            ],
        },
        {
            id: 'security',
            category: 'security',
            icon: <LockIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '4. Data Storage & Security Measures',
            summary: 'TLS 1.3 encryption in transit, AES-256 encryption at rest, and role-based staff access.',
            badge: 'Encrypted',
            badgeColor: 'primary',
            details: [
                'All network communications between mobile apps, web browsers, and our API servers use TLS 1.3 encryption with HTTPS.',
                'Sensitive customer credentials and authentication tokens are stored securely using device keychain storage (iOS Keychain and Android Keystore) via Expo Secure Store.',
                'KYC documents are held in restricted private cloud buckets with pre-signed temporary access URLs accessible only to authorized verification officers.',
                'Routine security audits and vulnerability scanning are executed to protect systems against unauthorized access.',
            ],
        },
        {
            id: 'deletion',
            category: 'rights',
            icon: <DeleteForeverIcon sx={{ color: '#EF4444', fontSize: 26 }} />,
            title: '5. Account & Data Deletion (App Store Guideline 5.1.1v)',
            summary: 'Your right to access, rectify, or permanently delete your account and personal records.',
            badge: 'User Rights',
            badgeColor: 'error',
            details: [
                'You have the right to request access to your personal data or request permanent deletion of your customer account at any time.',
                'How to request account deletion in the mobile app: Navigate to Profile > Settings > Account Security > Request Account Deletion, or email our Data Privacy Officer directly at privacy@gkwhizwheel.com with your registered mobile number.',
                'Upon receiving an account deletion request, your profile, authentication tokens, and personal credentials will be permanently erased within 14 business days, subject only to statutory accounting and tax retention obligations under Indian law.',
            ],
        },
        {
            id: 'contact',
            category: 'contact',
            icon: <ContactSupportIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
            title: '6. Grievance Redressal & Privacy Contact',
            summary: 'Official Grievance Officer details in accordance with Information Technology Act, 2000.',
            badge: 'Official',
            badgeColor: 'default',
            details: [
                'Grievance Officer: Sanjay Bhat / Customer Operations Lead',
                'Entity: GK WhizWheel Mobility Solutions LLP',
                'Office Address: Station Road Hub, Near Exit Platform 1, Honnavar, Uttara Kannada, Karnataka - 581334, India',
                'Email: privacy@gkwhizwheel.com / support@gkwhizwheel.com',
                'Helpline: +91 94801 23456 (9:00 AM to 7:00 PM IST, Monday through Saturday)',
            ],
        },
    ];

    const categories = [
        { id: 'all', label: 'All Clauses' },
        { id: 'collection', label: 'Data Collection' },
        { id: 'usage', label: 'Data Usage' },
        { id: 'sharing', label: 'Sharing & Disclosure' },
        { id: 'security', label: 'Security' },
        { id: 'rights', label: 'Account Deletion' },
        { id: 'contact', label: 'Grievance Contact' },
    ];

    const filteredSections = selectedCategory === 'all'
        ? privacySections
        : privacySections.filter((s) => s.category === selectedCategory);

    return (
        <AppLayout>
            <Head>
                <title>Privacy Policy | GK WhizWheel Mobile & Web</title>
                <meta
                    name="description"
                    content="Privacy Policy for GK WhizWheel self-drive bike rentals and travel services in Honnavar, Karnataka. Learn how we collect, protect, and handle your data and KYC records."
                />
            </Head>

            {/* Hero Header */}
            <Box
                sx={{
                    bgcolor: isDark ? '#0B1120' : '#0F172A',
                    color: '#FFFFFF',
                    pt: { xs: 5, md: 8 },
                    pb: { xs: 6, md: 9 },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Container maxWidth="lg">
                    <Breadcrumbs
                        separator="›"
                        sx={{
                            mb: 3,
                            '& .MuiBreadcrumbs-separator': { color: '#94A3B8' },
                            '& a': { color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem' },
                            '& a:hover': { color: '#F59E0B' },
                        }}
                    >
                        <Link href="/">Home</Link>
                        <Typography sx={{ color: '#F59E0B', fontSize: '0.85rem', fontWeight: 600 }}>
                            Privacy Policy
                        </Typography>
                    </Breadcrumbs>

                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Chip
                                icon={<ShieldIcon sx={{ fontSize: '1rem !important', color: '#F59E0B !important' }} />}
                                label="Data Protection & User Privacy"
                                sx={{
                                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#F59E0B',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    mb: 2,
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            />
                            <Typography
                                variant="h2"
                                component="h1"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: '2rem', md: '2.8rem' },
                                    lineHeight: 1.2,
                                    mb: 2,
                                }}
                            >
                                Privacy Policy
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#94A3B8',
                                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                                    maxWidth: 680,
                                    lineHeight: 1.6,
                                }}
                            >
                                At GK WhizWheel, we value your trust and are committed to protecting your personal
                                information, KYC records, and device privacy. This policy outlines our transparency
                                practices for both our mobile application and web platform.
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: 'rgba(30, 41, 59, 0.7)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                                    Last Updated
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2 }}>
                                    September 12, 2026
                                </Typography>

                                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                                    App Store Compliance
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    ✓ Apple Guideline 5.1.1 & Google Play Verified
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Filter Pills */}
            <Box sx={{ bgcolor: isDark ? '#1E293B' : '#F8FAFC', py: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <Container maxWidth="lg">
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5 }}>
                        {categories.map((c) => (
                            <Chip
                                key={c.id}
                                label={c.label}
                                onClick={() => setSelectedCategory(c.id)}
                                variant={selectedCategory === c.id ? 'filled' : 'outlined'}
                                sx={{
                                    fontWeight: selectedCategory === c.id ? 700 : 500,
                                    bgcolor: selectedCategory === c.id ? '#F59E0B' : 'transparent',
                                    color: selectedCategory === c.id ? '#0F172A' : (isDark ? '#94A3B8' : '#64748B'),
                                    borderColor: selectedCategory === c.id ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                                    '&:hover': {
                                        bgcolor: selectedCategory === c.id ? '#D97706' : 'rgba(245, 158, 11, 0.08)',
                                    },
                                }}
                            />
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Policy Clauses Body */}
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Stack spacing={3}>
                    {filteredSections.map((sec) => (
                        <Card
                            key={sec.id}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.03)',
                            }}
                        >
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" mb={2}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        {sec.icon}
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                            {sec.title}
                                        </Typography>
                                    </Stack>
                                    <Chip label={sec.badge} color={sec.badgeColor} size="small" sx={{ fontWeight: 700 }} />
                                </Stack>

                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 2, fontWeight: 500 }}>
                                    {sec.summary}
                                </Typography>

                                <Divider sx={{ my: 2, opacity: 0.5 }} />

                                <Stack spacing={1.5}>
                                    {sec.details.map((detail, idx) => (
                                        <Typography
                                            key={idx}
                                            variant="body2"
                                            sx={{
                                                color: isDark ? '#CBD5E1' : '#334155',
                                                lineHeight: 1.7,
                                                display: 'flex',
                                                gap: 1.5,
                                            }}
                                        >
                                            <Box component="span" sx={{ color: '#F59E0B', fontWeight: 700 }}>•</Box>
                                            <Box component="span">{detail}</Box>
                                        </Typography>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>

                {/* Quick Help Card */}
                <Paper
                    sx={{
                        mt: 6,
                        p: { xs: 3, md: 4 },
                        borderRadius: 3,
                        bgcolor: isDark ? '#1E293B' : '#EFF6FF',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#BFDBFE',
                    }}
                >
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#1E3A8A', mb: 0.5 }}>
                                Have questions regarding your privacy or KYC records?
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#475569' }}>
                                Reach out directly to our customer support desk or submit an account data deletion inquiry.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Button
                                component={Link}
                                href="/contact"
                                variant="contained"
                                startIcon={<EmailIcon />}
                                sx={{
                                    bgcolor: '#F59E0B',
                                    color: '#0F172A',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1,
                                    '&:hover': { bgcolor: '#D97706' },
                                }}
                            >
                                Contact Support
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </AppLayout>
    );
}

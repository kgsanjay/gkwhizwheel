import React from 'react';
import { Link } from '@inertiajs/react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Breadcrumbs,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';
import RelatedGuidesStrip from '../../Components/Blog/RelatedGuidesStrip';

export default function BlogShow({ article }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    if (!article) return null;

    const slugUrl = `https://whizwheels.in/blog/${article.slug}`;
    const faqEntities = (article.faqs || []).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
    }));

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.excerpt,
            image: `https://whizwheels.in${article.image}`,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            mainEntityOfPage: slugUrl,
            author: { '@type': 'Organization', name: 'GK WhizWheels Local Desk' },
            publisher: { '@type': 'Organization', name: 'GK WhizWheel', url: 'https://whizwheels.in' },
        },
        ...(faqEntities.length > 0
            ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqEntities }]
            : []),
    ];

    const waMessage = encodeURIComponent(
        `Hi GK WhizWheels, I was reading your guide "${article.title}" and want to book ${article.serviceLabel}.`
    );

    return (
        <AppLayout>
            <PageHead
                title={`${article.title} | GK WhizWheels Travel Blog`}
                description={article.excerpt}
                canonicalUrl={slugUrl}
                ogImage={article.image}
                ogType="article"
                structuredData={structuredData}
            />

            {/* Article Hero */}
            <Box
                sx={{
                    background: isDark
                        ? 'linear-gradient(135deg, #070B14 0%, #0F172A 60%, #111C33 100%)'
                        : 'linear-gradient(135deg, #0B1120 0%, #162238 100%)',
                    color: '#FFFFFF',
                    pt: { xs: 5, md: 7 },
                    pb: { xs: 5, md: 7 },
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Container maxWidth={false} sx={{ maxWidth: '1440px' }}>
                    <Breadcrumbs sx={{ mb: 2.5, color: '#94A3B8', fontSize: '0.84rem' }} aria-label="breadcrumb">
                        <Typography component={Link} href="/" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FBBF24' } }}>
                            Home
                        </Typography>
                        <Typography component={Link} href="/blog" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FBBF24' } }}>
                            Travel Guides
                        </Typography>
                        <Typography sx={{ color: '#FBBF24', fontWeight: 700 }} variant="caption">
                            {article.serviceLabel}
                        </Typography>
                    </Breadcrumbs>

                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <Stack direction="row" flexWrap="wrap" gap={1.2} alignItems="center" sx={{ mb: 2 }}>
                                <Chip
                                    label={article.badge}
                                    size="small"
                                    sx={{
                                        fontWeight: 850,
                                        bgcolor: `${article.color}25`,
                                        color: '#FFFFFF',
                                        border: `1px solid ${article.color}`,
                                    }}
                                />
                                <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#CBD5E1', fontWeight: 700 }}>
                                    <ScheduleIcon sx={{ fontSize: 15, color: '#FBBF24' }} /> {article.readTime}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#CBD5E1', fontWeight: 600 }}>
                                    <LocationOnIcon sx={{ fontSize: 15, color: '#34D399' }} /> {article.locationScope}
                                </Typography>
                            </Stack>

                            <Typography
                                variant="h1"
                                sx={{
                                    fontWeight: 950,
                                    fontSize: { xs: '1.9rem', sm: '2.5rem', md: '3rem' },
                                    lineHeight: 1.15,
                                    letterSpacing: '-0.025em',
                                    mb: 2,
                                }}
                            >
                                {article.title}
                            </Typography>

                            <Typography variant="body1" sx={{ color: '#CBD5E1', fontSize: { xs: '0.98rem', md: '1.08rem' }, lineHeight: 1.75, mb: 3 }}>
                                {article.excerpt}
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                <Button
                                    component={Link}
                                    href={article.serviceUrl}
                                    variant="contained"
                                    size="large"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        bgcolor: article.color,
                                        color: article.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                        fontWeight: 850,
                                        borderRadius: 2.5,
                                        px: 3,
                                        textTransform: 'none',
                                    }}
                                >
                                    {article.ctaLabel}
                                </Button>
                                <Button
                                    component={Link}
                                    href="/blog"
                                    variant="outlined"
                                    size="large"
                                    startIcon={<ArrowBackIcon />}
                                    sx={{
                                        borderColor: 'rgba(255,255,255,0.24)',
                                        color: '#F8FAFC',
                                        fontWeight: 700,
                                        borderRadius: 2.5,
                                        px: 2.5,
                                        textTransform: 'none',
                                    }}
                                >
                                    All Travel Guides
                                </Button>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Box
                                sx={{
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.16)',
                                    boxShadow: '0 24px 50px rgba(0,0,0,0.45)',
                                    height: { xs: 230, sm: 310 },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={article.image}
                                    alt={article.title}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Article Body + Sticky Booking Sidebar */}
            <Container maxWidth={false} sx={{ maxWidth: '1440px', pt: { xs: 5, md: 7 }, pb: 3 }}>
                <Grid container spacing={4}>
                    {/* Left: Full Long-Form Sections */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, sm: 3.5 },
                                mb: 4,
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : '#F8FAFC',
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                Key Takeaways From This Guide
                            </Typography>
                            <Grid container spacing={1.25}>
                                {(article.highlights || []).map((hl, idx) => (
                                    <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <CheckCircleIcon sx={{ fontSize: 18, color: article.color, mt: '2px', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600, lineHeight: 1.5 }}>
                                                {hl}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>

                        <Stack spacing={4.5}>
                            {(article.sections || []).map((section, idx) => (
                                <Box
                                    key={idx}
                                    id={`section-${idx}`}
                                    sx={{
                                        pb: 4,
                                        borderBottom: idx < article.sections.length - 1
                                            ? (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0')
                                            : 'none',
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 900,
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            fontSize: { xs: '1.35rem', sm: '1.65rem' },
                                            mb: 2,
                                        }}
                                    >
                                        {section.heading}
                                    </Typography>

                                    {(section.paragraphs || []).map((p, pIdx) => (
                                        <Typography
                                            key={pIdx}
                                            variant="body1"
                                            sx={{
                                                color: isDark ? '#CBD5E1' : '#334155',
                                                lineHeight: 1.8,
                                                mb: 2,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {p}
                                        </Typography>
                                    ))}

                                    {(section.bullets || []).length > 0 && (
                                        <Stack spacing={1.25} sx={{ mt: 2, mb: 2.5, pl: 0.5 }}>
                                            {section.bullets.map((b, bIdx) => (
                                                <Box key={bIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 18, color: article.color, mt: '3px', flexShrink: 0 }} />
                                                    <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#1E293B', lineHeight: 1.7, fontWeight: 500, fontSize: '0.95rem' }}>
                                                        {b}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}

                                    {section.proTip && (
                                        <Box
                                            sx={{
                                                mt: 2.5,
                                                p: 2.25,
                                                borderRadius: 3,
                                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                                                borderLeft: `4px solid ${article.color}`,
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.5,
                                            }}
                                        >
                                            <LightbulbIcon sx={{ color: '#F59E0B', fontSize: 22, mt: '2px', flexShrink: 0 }} />
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 900, color: '#D97706', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                                    Local Coordinator Tip
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: isDark ? '#FDE68A' : '#78350F', fontWeight: 600, lineHeight: 1.6 }}>
                                                    {section.proTip}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Stack>

                        {/* Guide FAQs */}
                        {(article.faqs || []).length > 0 && (
                            <Box sx={{ mt: 5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 2 }}>
                                    Frequently Asked Questions
                                </Typography>
                                <Stack spacing={1.5}>
                                    {article.faqs.map((faq, fIdx) => (
                                        <Accordion
                                            key={fIdx}
                                            defaultExpanded={fIdx === 0}
                                            elevation={0}
                                            sx={{
                                                borderRadius: '14px !important',
                                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : '#FFFFFF',
                                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                                                '&:before': { display: 'none' },
                                            }}
                                        >
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {faq.q}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.7 }}>
                                                    {faq.a}
                                                </Typography>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Grid>

                    {/* Right: Quick Facts & Instant Booking Box */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                position: { lg: 'sticky' },
                                top: { lg: 100 },
                                p: 3.5,
                                borderRadius: 4,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                                boxShadow: isDark
                                    ? '0 20px 45px -15px rgba(0,0,0,0.6)'
                                    : '0 20px 45px -15px rgba(15,23,42,0.08)',
                            }}
                        >
                            <Chip label="Quick Trip Snapshot" size="small" sx={{ fontWeight: 800, mb: 2, bgcolor: `${article.color}18`, color: article.color }} />

                            <Stack spacing={2} sx={{ mb: 3 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                        <CalendarMonthIcon sx={{ fontSize: 15, color: article.color }} /> Best Season
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.3 }}>
                                        {article.bestSeason}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                        <ScheduleIcon sx={{ fontSize: 15, color: article.color }} /> Ideal Duration
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.3 }}>
                                        {article.idealDuration}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                        <LocationOnIcon sx={{ fontSize: 15, color: article.color }} /> Branch Pickup
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.3 }}>
                                        {article.startingHub}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider sx={{ my: 2.5 }} />

                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.2 }}>
                                In This Guide
                            </Typography>
                            <Stack spacing={0.8} sx={{ mb: 3 }}>
                                {(article.sections || []).map((sec, idx) => (
                                    <Typography
                                        key={idx}
                                        component="a"
                                        href={`#section-${idx}`}
                                        variant="caption"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#475569',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            '&:hover': { color: article.color, textDecoration: 'underline' },
                                        }}
                                    >
                                        {sec.heading}
                                    </Typography>
                                ))}
                            </Stack>

                            <Stack spacing={1.5}>
                                <Button
                                    component={Link}
                                    href={article.serviceUrl}
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        bgcolor: article.color,
                                        color: article.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                        fontWeight: 850,
                                        borderRadius: 2.5,
                                        py: 1.35,
                                        textTransform: 'none',
                                    }}
                                >
                                    {article.ctaLabel}
                                </Button>
                                <Button
                                    component="a"
                                    href={`https://wa.me/918660989586?text=${waMessage}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: 2.5,
                                        py: 1.2,
                                        textTransform: 'none',
                                        borderColor: 'rgba(16, 185, 129, 0.4)',
                                        color: isDark ? '#34D399' : '#047857',
                                    }}
                                >
                                    Ask Local Desk on WhatsApp
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Related Service Guides */}
            <RelatedGuidesStrip
                excludeSlug={article.slug}
                title="Explore More Coastal Travel Guides"
                subtitle="Combine bikes, riverfront homestays, sunset boating, scuba diving & custom tour packages effortlessly."
            />
        </AppLayout>
    );
}


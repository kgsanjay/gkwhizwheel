import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AppLayout from '../../Layouts/AppLayout';
import { marketingHeroBackground } from '../../Components/Marketing/MarketingPageHero';
import PageHead from '../../Components/SEO/PageHead';

const SERVICE_FILTERS = [
    { key: 'all', label: 'All 7 Services' },
    { key: 'bikes', label: 'Bikes & Scooters' },
    { key: 'cabs', label: 'AC Cabs' },
    { key: 'homestays', label: 'Homestays' },
    { key: 'boating', label: 'Boating' },
    { key: 'scuba', label: 'Netrani Scuba' },
    { key: 'guide', label: 'Local Guides' },
    { key: 'tours', label: 'Tour Packages' },
];

export default function BlogIndex({ articles = [], initialService = 'all' }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const validKeys = SERVICE_FILTERS.map((f) => f.key);
    const [activeFilter, setActiveFilter] = useState(validKeys.includes(initialService) ? initialService : 'all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredArticles = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return articles.filter((a) => {
            const matchesService = activeFilter === 'all' || a.serviceKey === activeFilter;
            if (!matchesService) return false;
            if (!q) return true;
            return (
                a.title.toLowerCase().includes(q)
                || a.excerpt.toLowerCase().includes(q)
                || a.serviceLabel.toLowerCase().includes(q)
                || a.locationScope.toLowerCase().includes(q)
            );
        });
    }, [articles, activeFilter, searchQuery]);

    const featuredArticle = activeFilter === 'all' && !searchQuery.trim()
        ? articles.find((a) => a.serviceKey === 'tours') || articles[0]
        : null;

    const gridArticles = featuredArticle
        ? filteredArticles.filter((a) => a.slug !== featuredArticle.slug)
        : filteredArticles;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'GK WhizWheels Coastal Karnataka Travel Guides & Blog',
        description: 'In-depth local travel guides covering Honnavar & Murudeshwar bike rentals, AC cabs, Sharavathi boating, Netrani scuba diving, homestays, local trails & custom tour itineraries.',
        url: 'https://whizwheels.in/blog',
        blogPost: articles.map((a) => ({
            '@type': 'BlogPosting',
            headline: a.title,
            description: a.excerpt,
            url: `https://whizwheels.in/blog/${a.slug}`,
            datePublished: a.publishedAt,
            image: `https://whizwheels.in${a.image}`,
        })),
    };

    return (
        <AppLayout>
            <PageHead
                title="Travel Guides & Blogs — Honnavar & Murudeshwar | GK WhizWheels"
                description="Detailed travel blogs and trip-planning guides covering all 7 GK WhizWheels services: bike rentals, AC cabs, Sharavathi riverfront homestays, backwater boating, Netrani scuba diving, local guides & 3-day packages."
                canonicalUrl="https://whizwheels.in/blog"
                structuredData={structuredData}
            />

            {/* Hero Banner */}
            <Box
                sx={{
                    background: marketingHeroBackground(true),
                    color: '#FFFFFF',
                    pt: { xs: 7, md: 9 },
                    pb: { xs: 6, md: 8 },
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Container maxWidth={false} sx={{ maxWidth: '1440px' }}>
                    <Chip
                        icon={<AutoStoriesIcon sx={{ fontSize: 16, color: '#FBBF24 !important' }} />}
                        label="Honnavar & Murudeshwar Travel Journal"
                        size="small"
                        sx={{
                            mb: 2,
                            fontWeight: 800,
                            bgcolor: 'rgba(245, 158, 11, 0.16)',
                            color: '#FBBF24',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                        }}
                    />
                    <Typography
                        variant="h1"
                        sx={{
                            fontWeight: 950,
                            fontSize: { xs: '2.1rem', sm: '2.85rem', md: '3.4rem' },
                            lineHeight: 1.12,
                            letterSpacing: '-0.03em',
                            mb: 2,
                            maxWidth: 880,
                        }}
                    >
                        Detailed Guides Across All 7{' '}
                        <Box component="span" sx={{ color: '#F59E0B' }}>
                            Coastal Services
                        </Box>
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#CBD5E1',
                            fontSize: { xs: '1rem', md: '1.12rem' },
                            lineHeight: 1.7,
                            maxWidth: 740,
                            mb: 4,
                        }}
                    >
                        Practical local advice written by our Honnavar &amp; Murudeshwar branch coordinators—covering NH-66 self-drive bike routes, 6:30 AM Netrani scuba schedules, sunset mangrove boating timings, riverfront homestays, and ready-to-book itineraries.
                    </Typography>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {SERVICE_FILTERS.map((f) => {
                                const selected = activeFilter === f.key;
                                return (
                                    <Chip
                                        key={f.key}
                                        label={f.label}
                                        clickable
                                        onClick={() => setActiveFilter(f.key)}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            bgcolor: selected ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                                            color: selected ? '#0F172A' : '#E2E8F0',
                                            border: selected ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.14)',
                                            '&:hover': {
                                                bgcolor: selected ? '#D97706' : 'rgba(255,255,255,0.16)',
                                            },
                                        }}
                                    />
                                );
                            })}
                        </Box>

                        <TextField
                            size="small"
                            placeholder="Search guides, routes, scuba..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                minWidth: { xs: '100%', md: 280 },
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    color: '#FFFFFF',
                                    borderRadius: 2.5,
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&:hover fieldset': { borderColor: '#F59E0B' },
                                },
                                '& input::placeholder': { color: '#94A3B8', opacity: 1 },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ maxWidth: '1440px', py: { xs: 5, md: 7 } }}>
                {/* Featured Blueprint Story */}
                {featuredArticle && (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 5,
                            borderRadius: 4.5,
                            overflow: 'hidden',
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.78)' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #DDD6FE',
                            boxShadow: isDark
                                ? '0 20px 50px -16px rgba(0, 0, 0, 0.6)'
                                : '0 20px 45px -16px rgba(15, 23, 42, 0.08)',
                        }}
                    >
                        <Grid container>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box sx={{ position: 'relative', height: { xs: 240, md: '100%' }, minHeight: { md: 340 }, bgcolor: '#0F172A' }}>
                                    <Box
                                        component="img"
                                        src={featuredArticle.image}
                                        alt={featuredArticle.title}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                    <Chip
                                        label="Featured Complete Blueprint"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            left: 16,
                                            fontWeight: 850,
                                            bgcolor: 'rgba(15, 23, 42, 0.88)',
                                            color: '#FBBF24',
                                        }}
                                    />
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Box sx={{ p: { xs: 3, sm: 4.5 }, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                            <Chip label={featuredArticle.serviceLabel} size="small" sx={{ fontWeight: 800, bgcolor: `${featuredArticle.color}18`, color: featuredArticle.color }} />
                                            <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 700 }}>
                                                <ScheduleIcon sx={{ fontSize: 14 }} /> {featuredArticle.readTime}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                                <LocationOnIcon sx={{ fontSize: 14, color: featuredArticle.color }} /> {featuredArticle.locationScope}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="h4" sx={{ fontWeight: 950, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1.5, lineHeight: 1.2 }}>
                                            {featuredArticle.title}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#475569', mb: 2.5, lineHeight: 1.7 }}>
                                            {featuredArticle.excerpt}
                                        </Typography>

                                        <Stack spacing={1} sx={{ mb: 3 }}>
                                            {featuredArticle.highlights.map((h, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 17, color: featuredArticle.color }} />
                                                    <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                                        {h}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                        <Button
                                            component={Link}
                                            href={`/blog/${featuredArticle.slug}`}
                                            variant="contained"
                                            size="large"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                bgcolor: featuredArticle.color,
                                                fontWeight: 850,
                                                borderRadius: 2.5,
                                                px: 3,
                                                textTransform: 'none',
                                            }}
                                        >
                                            Read 3-Day Blueprint
                                        </Button>
                                        <Button
                                            component={Link}
                                            href={featuredArticle.serviceUrl}
                                            variant="outlined"
                                            size="large"
                                            sx={{
                                                fontWeight: 800,
                                                borderRadius: 2.5,
                                                px: 3,
                                                textTransform: 'none',
                                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                                color: isDark ? '#FFFFFF' : '#0F172A',
                                            }}
                                        >
                                            {featuredArticle.ctaLabel}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Articles Grid */}
                {gridArticles.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 5,
                            textAlign: 'center',
                            borderRadius: 4,
                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                            No matching travel guides found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Try clearing your search or switching back to All 7 Services.
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                setActiveFilter('all');
                                setSearchQuery('');
                            }}
                        >
                            Show All Travel Guides
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {gridArticles.map((article) => (
                            <Grid key={article.slug} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 4,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.78)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                                        overflow: 'hidden',
                                        transition: 'all 0.25s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            borderColor: article.color,
                                            boxShadow: isDark
                                                ? `0 18px 40px -12px ${article.color}30`
                                                : `0 18px 40px -12px ${article.color}22`,
                                        },
                                    }}
                                >
                                    <Box sx={{ position: 'relative', height: 205, bgcolor: '#0F172A' }}>
                                        <Box
                                            component="img"
                                            src={article.image}
                                            alt={article.title}
                                            loading="lazy"
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />
                                        <Chip
                                            label={article.badge}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                fontWeight: 800,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                color: '#FFFFFF',
                                                border: `1px solid ${article.color}80`,
                                            }}
                                        />
                                    </Box>
                                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                                        <Box>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: article.color }}>
                                                    {article.serviceLabel}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                    • {article.readTime}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.3, mb: 1.2 }}>
                                                {article.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.65, mb: 2 }}>
                                                {article.excerpt}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9' }}>
                                            <Button
                                                component={Link}
                                                href={`/blog/${article.slug}`}
                                                size="small"
                                                endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                                                sx={{
                                                    fontWeight: 850,
                                                    color: article.color,
                                                    textTransform: 'none',
                                                    px: 0,
                                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                                }}
                                            >
                                                Read Detailed Blog
                                            </Button>
                                            <Button
                                                component={Link}
                                                href={article.serviceUrl}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.74rem',
                                                    textTransform: 'none',
                                                    borderRadius: 2,
                                                    borderColor: isDark ? 'rgba(255,255,255,0.16)' : '#CBD5E1',
                                                    color: isDark ? '#E2E8F0' : '#334155',
                                                }}
                                            >
                                                Book Service
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </AppLayout>
    );
}


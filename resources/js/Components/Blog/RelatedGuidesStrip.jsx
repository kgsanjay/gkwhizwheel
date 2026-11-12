import React from 'react';
import { Link } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Paper,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import blogArticles from '../../data/blogArticles.json';

/**
 * Reusable contextual travel-guide showcase for service pages and articles.
 */
export default function RelatedGuidesStrip({
    serviceKey = null,
    excludeSlug = null,
    title = 'Detailed Coastal Travel Guides',
    subtitle = 'Insider planning tips, routes, timings, and booking checklists across Honnavar & Murudeshwar.',
    maxSecondary = 2,
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const available = blogArticles.filter((a) => a.slug !== excludeSlug);
    const primaryGuide = serviceKey
        ? available.find((a) => a.serviceKey === serviceKey) || null
        : null;
    const secondaryGuides = available
        .filter((a) => !primaryGuide || a.slug !== primaryGuide.slug)
        .slice(0, primaryGuide ? maxSecondary : 3);

    return (
        <Box
            component="section"
            aria-label={title}
            sx={{
                maxWidth: '1440px',
                width: '100%',
                mx: 'auto',
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 5, md: 7 },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'flex-end' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3.5,
                }}
            >
                <Box>
                    <Chip
                        icon={<AutoStoriesIcon sx={{ fontSize: 15 }} />}
                        label="Travel Guides & Blogs"
                        size="small"
                        sx={{
                            mb: 1,
                            fontWeight: 800,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                            color: isDark ? '#FBBF24' : '#B45309',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                    />
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 900,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.55rem', md: '2rem' },
                            mb: 0.6,
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: isDark ? '#94A3B8' : '#475569',
                            maxWidth: 680,
                            lineHeight: 1.6,
                        }}
                    >
                        {subtitle}
                    </Typography>
                </Box>

                <Button
                    component={Link}
                    href="/blog"
                    variant="outlined"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                        borderRadius: 2.5,
                        fontWeight: 800,
                        textTransform: 'none',
                        px: 2.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                            borderColor: '#F59E0B',
                            color: '#F59E0B',
                        },
                    }}
                >
                    Browse All 7 Guides
                </Button>
            </Box>

            {primaryGuide && (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : '#FFFFFF',
                        border: `1.5px solid ${isDark ? `${primaryGuide.color}45` : `${primaryGuide.color}35`}`,
                        boxShadow: isDark
                            ? '0 14px 36px -12px rgba(0, 0, 0, 0.55)'
                            : '0 12px 30px -12px rgba(15, 23, 42, 0.08)',
                    }}
                >
                    <Grid container>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ position: 'relative', height: { xs: 210, md: '100%' }, minHeight: { md: 250 }, bgcolor: '#0F172A' }}>
                                <Box
                                    component="img"
                                    src={primaryGuide.image}
                                    alt={primaryGuide.title}
                                    loading="lazy"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <Chip
                                    label={primaryGuide.badge}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 14,
                                        left: 14,
                                        fontWeight: 800,
                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                        color: '#FBBF24',
                                        border: '1px solid rgba(255,255,255,0.16)',
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                <Box>
                                    <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 1.25 }}>
                                        <Chip
                                            label={primaryGuide.serviceLabel}
                                            size="small"
                                            sx={{ fontWeight: 800, bgcolor: `${primaryGuide.color}18`, color: primaryGuide.color }}
                                        />
                                        <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>
                                            <ScheduleIcon sx={{ fontSize: 14 }} /> {primaryGuide.readTime}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                                            <LocationOnIcon sx={{ fontSize: 14, color: primaryGuide.color }} /> {primaryGuide.locationScope}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 900,
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            mb: 1.2,
                                            lineHeight: 1.25,
                                            fontSize: { xs: '1.2rem', sm: '1.45rem' },
                                        }}
                                    >
                                        {primaryGuide.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#475569',
                                            mb: 2,
                                            lineHeight: 1.65,
                                        }}
                                    >
                                        {primaryGuide.excerpt}
                                    </Typography>

                                    <Grid container spacing={1} sx={{ mb: 2.5 }}>
                                        {(primaryGuide.highlights || []).slice(0, 4).map((hl, i) => (
                                            <Grid key={i} size={{ xs: 12, sm: 6 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.9 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 16, color: primaryGuide.color, mt: '2px', flexShrink: 0 }} />
                                                    <Typography variant="caption" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600, lineHeight: 1.45 }}>
                                                        {hl}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <Button
                                        component={Link}
                                        href={`/blog/${primaryGuide.slug}`}
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: primaryGuide.color,
                                            color: primaryGuide.color === '#F59E0B' ? '#0F172A' : '#FFFFFF',
                                            fontWeight: 850,
                                            borderRadius: 2.5,
                                            px: 3,
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: primaryGuide.color, filter: 'brightness(0.92)' },
                                        }}
                                    >
                                        Read Full Detailed Guide
                                    </Button>
                                    <Button
                                        component={Link}
                                        href={`/blog?service=${primaryGuide.serviceKey}`}
                                        variant="text"
                                        sx={{
                                            color: isDark ? '#94A3B8' : '#475569',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                        }}
                                    >
                                        See All Trip Guides
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Grid container spacing={2.5}>
                {secondaryGuides.map((article) => (
                    <Grid key={article.slug} size={{ xs: 12, md: primaryGuide ? 6 : 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3.5,
                                bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : '#FFFFFF',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                overflow: 'hidden',
                                transition: 'transform 0.25s ease, border-color 0.25s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    borderColor: article.color,
                                },
                            }}
                        >
                            <Box sx={{ position: 'relative', height: 170, bgcolor: '#0F172A' }}>
                                <Box
                                    component="img"
                                    src={article.image}
                                    alt={article.title}
                                    loading="lazy"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <Chip
                                    label={article.serviceLabel}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        left: 12,
                                        fontWeight: 800,
                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                        color: '#FFFFFF',
                                        border: `1px solid ${article.color}70`,
                                    }}
                                />
                            </Box>
                            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700, display: 'block', mb: 0.8 }}>
                                        {article.readTime} • {article.locationScope}
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 850,
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            fontSize: '1.05rem',
                                            lineHeight: 1.32,
                                            mb: 1,
                                        }}
                                    >
                                        {article.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDark ? '#CBD5E1' : '#475569',
                                            fontSize: '0.86rem',
                                            lineHeight: 1.55,
                                            mb: 2,
                                        }}
                                    >
                                        {article.excerpt}
                                    </Typography>
                                </Box>
                                <Button
                                    component={Link}
                                    href={`/blog/${article.slug}`}
                                    size="small"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                                    sx={{
                                        alignSelf: 'flex-start',
                                        px: 0,
                                        fontWeight: 850,
                                        color: article.color,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                                    }}
                                >
                                    Read Complete Guide
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}


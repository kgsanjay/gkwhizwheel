import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Container, Typography, Button, Grid, Card, Stack } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';

const palette = {
    ink: '#123E43',
    teal: '#14565B',
    orange: '#C45D2C',
    muted: '#536366',
    line: '#E3E8E3',
    image: '#EDF0EB',
};

const formatPrice = (rate) => Number(rate).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function FeaturedFleet({ bikes = [] }) {
    // Only the bikes supplied by the backend are shown. Never invent availability or rates.
    const featured = bikes.slice(0, 3);

    return (
        <Box component="section" aria-labelledby="featured-fleet-heading" sx={{ bgcolor: '#FFFFFF', py: { xs: 7, md: 11 } }}>
            <Container maxWidth="lg">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} justifyContent="space-between" sx={{ mb: { xs: 4, md: 5 } }}>
                    <Box sx={{ maxWidth: 690 }}>
                        <Typography sx={{ fontSize: 12, color: palette.orange, textTransform: 'uppercase', letterSpacing: '.15em', fontWeight: 800, mb: 1.5 }}>
                            The fleet
                        </Typography>
                        <Typography id="featured-fleet-heading" component="h2" sx={{
                            color: palette.ink,
                            fontSize: { xs: '2rem', sm: '2.45rem', md: '3rem' },
                            lineHeight: 1.13, letterSpacing: '-.05em', fontWeight: 750,
                        }}>
                            The right bike for every kind of ride.
                        </Typography>
                        <Typography sx={{ color: palette.muted, mt: 1.5, fontSize: { xs: 15, md: 16 }, lineHeight: 1.75 }}>
                            Explore our current fleet. Select your dates and pickup location to confirm availability and see your final rental price.
                        </Typography>
                    </Box>
                    <Button component={Link} href="/services/bikes" endIcon={<ArrowForwardRoundedIcon />}
                        sx={{ color: palette.teal, textTransform: 'none', fontWeight: 750, fontSize: 14.5, px: 0, whiteSpace: 'nowrap', '&:hover': { color: palette.orange, bgcolor: 'transparent' } }}>
                        Browse the full fleet
                    </Button>
                </Stack>

                {featured.length > 0 ? (
                    <Grid container spacing={3}>
                        {featured.map((bike) => {
                            const title = [bike.brand, bike.model_name].filter(Boolean).join(' ') || 'Rental bike';
                            const location = bike.current_store?.public_name || bike.current_store?.name || bike.current_store?.city;
                            const hasRate = bike.daily_rate !== null && bike.daily_rate !== undefined && bike.daily_rate !== '' && Number(bike.daily_rate) > 0;
                            return (
                                <Grid key={bike.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Card sx={{
                                        height: '100%', display: 'flex', flexDirection: 'column',
                                        bgcolor: '#fff', border: '1px solid ' + palette.line, borderRadius: 2,
                                        boxShadow: 'none', overflow: 'hidden',
                                        transition: 'border-color .2s ease, transform .2s ease',
                                        '&:hover': { borderColor: '#AEBEB7', transform: 'translateY(-3px)' },
                                        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                                    }}>
                                        <Box sx={{
                                            position: 'relative', height: { xs: 225, md: 240 },
                                            bgcolor: palette.image, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
                                        }}>
                                            {bike.primary_image_url ? (
                                                <Box component="img" src={bike.primary_image_url} loading="lazy" alt={title + ' rental bike'}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 2.5 }} />
                                            ) : (
                                                <TwoWheelerOutlinedIcon aria-hidden="true" sx={{ color: '#A0ADA6', fontSize: 64 }} />
                                            )}
                                        </Box>
                                        <Box sx={{ p: { xs: 2.5, md: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            {bike.transmission && (
                                                <Typography sx={{ fontSize: 12, color: palette.orange, letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 750, mb: 1 }}>
                                                    {bike.transmission}
                                                </Typography>
                                            )}
                                            <Typography component="h3" sx={{ fontSize: 22, color: palette.ink, fontWeight: 750, letterSpacing: '-.03em', lineHeight: 1.25 }}>
                                                {title}
                                            </Typography>
                                            {location && (
                                                <Stack direction="row" spacing={.55} alignItems="center" sx={{ mt: 1.25 }}>
                                                    <PlaceOutlinedIcon sx={{ fontSize: 17, color: '#81918B' }} />
                                                    <Typography sx={{ color: palette.muted, fontSize: 13.5 }}>{location}</Typography>
                                                </Stack>
                                            )}
                                            <Box sx={{ mt: 'auto', pt: 3 }}>
                                                <Box sx={{ borderTop: '1px solid ' + palette.line, pt: 2.25, mb: 2.25 }}>
                                                    <Typography sx={{ fontSize: 12, color: palette.muted, mb: .4 }}>Starting rate</Typography>
                                                    {hasRate ? (
                                                        <Typography sx={{ color: palette.ink, fontSize: 24, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-.035em' }}>
                                                            ₹{formatPrice(bike.daily_rate)}
                                                            <Box component="span" sx={{ fontSize: 13, color: palette.muted, fontWeight: 500, letterSpacing: 0 }}> / day</Box>
                                                        </Typography>
                                                    ) : (
                                                        <Typography sx={{ color: palette.ink, fontSize: 17, fontWeight: 750 }}>Check pricing</Typography>
                                                    )}
                                                </Box>
                                                <Button component={Link} href={`/services/bikes/${bike.id}`} variant="contained" fullWidth
                                                    endIcon={<ArrowForwardRoundedIcon />}
                                                    sx={{ bgcolor: palette.teal, color: '#fff', boxShadow: 'none', textTransform: 'none', borderRadius: 1,
                                                        fontWeight: 750, fontSize: 14.5, py: 1.35,
                                                        '&:hover': { bgcolor: palette.ink, boxShadow: 'none' } }}>
                                                    Check dates & price
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : (
                    <Box role="status" sx={{ bgcolor: '#F9FAF7', border: '1px solid ' + palette.line, borderRadius: 2, p: { xs: 4, md: 5 } }}>
                        <Typography component="h3" sx={{ color: palette.ink, fontSize: 21, fontWeight: 750, mb: 1 }}>
                            No featured bikes listed right now.
                        </Typography>
                        <Typography sx={{ color: palette.muted, fontSize: 15, lineHeight: 1.7, mb: 2 }}>
                            Availability changes with rentals and branch transfers. Get in touch with our team for upcoming options.
                        </Typography>
                        <Button component={Link} href="/contact" variant="outlined" sx={{ color: palette.teal, borderColor: palette.teal, textTransform: 'none', fontWeight: 700 }}>
                            Contact our team
                        </Button>
                    </Box>
                )}
            </Container>
        </Box>
    );
}

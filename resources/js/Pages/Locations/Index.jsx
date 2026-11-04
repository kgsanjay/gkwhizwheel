import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button, Stack, Chip } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';

const ink = '#172326';
const muted = '#5D686A';
const accent = '#C65D30';
const surface = '#F7F7F4';

export default function LocationsIndex({ branches = [], canonicalUrl }) {
    return (
        <AppLayout>
            <PageHead
                title="Our Locations | G.K. WhizWheel Bike Rentals"
                description="Find G.K. WhizWheel pickup branches, discover local bike rentals, and choose where your coastal journey begins."
                canonicalUrl={canonicalUrl}
            />
            <Box component="main" id="main-content" sx={{ bgcolor: surface, minHeight: '70vh', color: ink }}>
                <Box sx={{ py: { xs: 7, md: 11 }, borderBottom: '1px solid #E4E6E1', bgcolor: '#FFFFFF' }}>
                    <Container maxWidth="lg">
                        <Typography sx={{ color: accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', mb: 2, textTransform: 'uppercase' }}>
                            The Karnataka coast, your way
                        </Typography>
                        <Typography component="h1" sx={{ fontSize: { xs: '2.65rem', md: '4.6rem' }, fontWeight: 750, letterSpacing: '-0.055em', lineHeight: 1.06, maxWidth: 770 }}>
                            Your ride starts here.
                        </Typography>
                        <Typography sx={{ mt: 3, maxWidth: 590, fontSize: { xs: 16, md: 18 }, lineHeight: 1.75, color: muted }}>
                            Choose a pickup location, browse the bikes based there, and plan a ride that works for your trip.
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 4, color: muted }}>
                            <PlaceOutlinedIcon sx={{ color: accent, fontSize: 20 }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Coastal Karnataka</Typography>
                            <Box sx={{ width: 4, height: 4, bgcolor: '#A1AAA8', borderRadius: '50%' }} />
                            <Typography sx={{ fontSize: 14 }}>{branches.length} {branches.length === 1 ? 'published location' : 'published locations'}</Typography>
                        </Stack>
                    </Container>
                </Box>
                <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'end' }} spacing={2} sx={{ mb: 4 }}>
                        <Box>
                            <Typography component="h2" sx={{ fontSize: { xs: 25, md: 32 }, fontWeight: 750, letterSpacing: '-0.035em' }}>
                                Explore our branches
                            </Typography>
                            <Typography sx={{ color: muted, mt: 0.75, fontSize: 15 }}>
                                Local pickup points, real inventory, and straightforward booking.
                            </Typography>
                        </Box>
                        <Button component={Link} href="/services/bikes" endIcon={<ArrowForwardRoundedIcon />} sx={{ color: ink, fontWeight: 750, textTransform: 'none', px: 0, '&:hover': { bgcolor: 'transparent', color: accent } }}>
                            Browse all bikes
                        </Button>
                    </Stack>
                    {branches.length ? (
                        <Grid container spacing={3}>
                            {branches.map((branch) => (
                                <Grid key={branch.id} size={{ xs: 12, md: 6 }}>
                                    <Card sx={{ height: '100%', border: '1px solid #E2E5E0', bgcolor: '#FFFFFF', borderRadius: 2, boxShadow: 'none', overflow: 'hidden', transition: 'border-color .2s, transform .2s', '&:hover': { borderColor: '#B9C3BD', transform: 'translateY(-3px)' } }}>
                                        <Box sx={{ position: 'relative', height: { xs: 220, sm: 285 }, bgcolor: '#E5E9E5', overflow: 'hidden' }}>
                                            {branch.hero_image_url ? (
                                                <CardMedia component="img" image={branch.hero_image_url} alt={`G.K. WhizWheel rental branch in ${branch.city}`} loading="lazy"
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Stack justifyContent="center" alignItems="center" sx={{ height: '100%', background: 'linear-gradient(140deg, #E7EBE4, #D8E0DA)' }}>
                                                    <TwoWheelerOutlinedIcon sx={{ fontSize: 64, color: '#8D9E94' }} />
                                                </Stack>
                                            )}
                                            <Chip label="Pickup location" size="small" sx={{ position: 'absolute', top: 18, left: 18, borderRadius: 1, bgcolor: '#FFFFFF', color: ink, fontWeight: 700, fontSize: 12 }} />
                                        </Box>
                                        <CardContent sx={{ p: { xs: 3, md: 3.5 }, '&:last-child': { pb: { xs: 3, md: 3.5 } } }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ color: accent, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', mb: 0.7 }}>
                                                        {branch.city}, Karnataka
                                                    </Typography>
                                                    <Typography component="h3" sx={{ fontSize: { xs: 23, md: 27 }, fontWeight: 750, lineHeight: 1.2, letterSpacing: '-.035em' }}>
                                                        {branch.public_name || branch.name}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flexShrink: 0, border: '1px solid #E2E5E0', borderRadius: 1, px: 1.4, py: 0.9, textAlign: 'center' }}>
                                                    <Typography sx={{ fontWeight: 800, lineHeight: 1, fontSize: 20 }}>{branch.current_bikes_count ?? 0}</Typography>
                                                    <Typography sx={{ color: muted, fontSize: 11, mt: 0.4 }}>Listed bikes</Typography>
                                                </Box>
                                            </Stack>
                                            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 2, mb: 3, minHeight: 40 }}>
                                                <PlaceOutlinedIcon sx={{ color: '#8A9790', fontSize: 19, mt: '2px' }} />
                                                <Typography sx={{ color: muted, fontSize: 14, lineHeight: 1.55 }}>
                                                    {[branch.address_line, branch.city].filter(Boolean).join(', ')}
                                                </Typography>
                                            </Stack>
                                            <Button component={Link} href={`/locations/${branch.slug}`} fullWidth variant="contained" endIcon={<ArrowForwardRoundedIcon />}
                                                sx={{ bgcolor: ink, color: '#fff', borderRadius: 1.2, boxShadow: 'none', py: 1.55, fontWeight: 750, textTransform: 'none', fontSize: 15, '&:hover': { bgcolor: '#304143', boxShadow: 'none' } }}>
                                                Explore {branch.city} branch
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box role="status" sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E5E0', borderRadius: 2, p: { xs: 4, md: 6 }, textAlign: 'center' }}>
                            <Typography component="h3" sx={{ fontWeight: 750, fontSize: 23 }}>Our location pages are being prepared.</Typography>
                            <Typography sx={{ color: muted, mt: 1, mb: 3 }}>You can still get in touch to ask about current pickup options.</Typography>
                            <Button component={Link} href="/contact" variant="outlined" sx={{ textTransform: 'none', color: ink, borderColor: '#BBC5BE' }}>Contact us</Button>
                        </Box>
                    )}
                </Container>
            </Box>
        </AppLayout>
    );
}

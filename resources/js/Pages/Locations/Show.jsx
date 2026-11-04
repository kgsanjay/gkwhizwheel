import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button, Stack, Chip, Breadcrumbs } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';

const ink = '#172326';
const muted = '#5D686A';
const accent = '#C65D30';
const surface = '#F7F7F4';

export default function LocationsShow({ branch, bikes = [], canonicalUrl }) {
    const displayName = branch.public_name || branch.name;
    const title = branch.seo_title || `Bike Rentals in ${branch.city} | G.K. WhizWheel`;
    const description = branch.seo_description || (branch.public_description || `Rent a bike in ${branch.city} with G.K. WhizWheel.`).slice(0, 155);
    const address = [branch.address_line, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ');
    const hasCoordinates = branch.latitude != null && branch.longitude != null;
    const directionsQuery = hasCoordinates ? `${branch.latitude},${branch.longitude}` : address;
    const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`;
    const browseHref = `/services/bikes?store_id=${branch.id}&return_store_id=${branch.id}`;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: branch.name,
        url: canonicalUrl,
        description,
        address: {
            '@type': 'PostalAddress',
            streetAddress: branch.address_line,
            addressLocality: branch.city,
            addressRegion: branch.state,
            postalCode: branch.pincode,
            addressCountry: 'IN',
        },
        ...(hasCoordinates ? { geo: { '@type': 'GeoCoordinates', latitude: branch.latitude, longitude: branch.longitude } } : {}),
        ...(branch.phone ? { telephone: branch.phone } : {}),
    };

    return (
        <AppLayout>
            <PageHead title={title} description={description} canonicalUrl={canonicalUrl}
                ogImage={branch.hero_image_url || undefined} structuredData={structuredData} />
            <Box component="main" id="main-content" sx={{ minHeight: '70vh', bgcolor: surface, color: ink }}>
                <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5E8E3' }}>
                    <Container maxWidth="lg" sx={{ pt: { xs: 3.5, md: 5 }, pb: { xs: 5, md: 7 } }}>
                        <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: { xs: 3, md: 4 }, '& .MuiBreadcrumbs-separator': { color: '#9DA9A1' } }}>
                            <Typography component={Link} href="/" sx={{ color: muted, textDecoration: 'none', fontSize: 13, '&:hover': { color: accent } }}>Home</Typography>
                            <Typography component={Link} href="/locations" sx={{ color: muted, textDecoration: 'none', fontSize: 13, '&:hover': { color: accent } }}>Locations</Typography>
                            <Typography sx={{ color: ink, fontSize: 13, fontWeight: 700 }}>{branch.city}</Typography>
                        </Breadcrumbs>
                        <Grid container spacing={{ xs: 3, md: 5 }} alignItems="end">
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Typography sx={{ color: accent, fontSize: 12, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '.14em', mb: 1.5 }}>
                                    G.K. WhizWheel · {branch.city}
                                </Typography>
                                <Typography component="h1" sx={{ fontSize: { xs: '2.55rem', sm: '3.5rem', md: '4.4rem' }, fontWeight: 750, lineHeight: 1.05, letterSpacing: '-.055em', maxWidth: 760 }}>
                                    Explore {branch.city} on two wheels.
                                </Typography>
                                {branch.public_description && (
                                    <Typography sx={{ mt: 2.5, color: muted, fontSize: { xs: 15, md: 17 }, lineHeight: 1.75, maxWidth: 680, whiteSpace: 'pre-line' }}>
                                        {branch.public_description}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Stack spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                                    <Button component={Link} href={browseHref} variant="contained" endIcon={<ArrowForwardRoundedIcon />}
                                        sx={{ bgcolor: ink, color: '#fff', fontSize: 15, textTransform: 'none', fontWeight: 750, py: 1.6, px: 3, borderRadius: 1.2, boxShadow: 'none', '&:hover': { bgcolor: '#304143', boxShadow: 'none' } }}>
                                        Find a bike in {branch.city}
                                    </Button>
                                    <Button href={directionsUrl} target="_blank" rel="noopener noreferrer" startIcon={<DirectionsOutlinedIcon />}
                                        sx={{ textTransform: 'none', color: ink, fontWeight: 700, px: 2, '&:hover': { color: accent } }}>
                                        Get directions
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
                <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
                    {branch.hero_image_url && (
                        <Box component="img" src={branch.hero_image_url} alt={`G.K. WhizWheel rental branch in ${branch.city}`}
                            sx={{ display: 'block', width: '100%', height: { xs: 250, sm: 350, md: 455 }, objectFit: 'cover', borderRadius: 2, mb: { xs: 5, md: 7 } }} />
                    )}
                    <Grid container spacing={{ xs: 4, md: 6 }} sx={{ mb: { xs: 7, md: 10 } }}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Typography sx={{ color: accent, fontWeight: 800, letterSpacing: '.13em', fontSize: 12, textTransform: 'uppercase', mb: 1.5 }}>
                                Visiting the branch
                            </Typography>
                            <Typography component="h2" sx={{ fontSize: { xs: 26, md: 35 }, fontWeight: 750, lineHeight: 1.2, letterSpacing: '-.04em', mb: 2 }}>
                                Everything you need for pickup.
                            </Typography>
                            <Typography sx={{ fontSize: 15.5, lineHeight: 1.85, color: muted, maxWidth: 620 }}>
                                Find us at the address below. Choose your rental dates to see live availability and the correct price for your chosen return location.
                            </Typography>
                            {branch.pickup_instructions && (
                                <Box sx={{ mt: 3, pl: 2.5, borderLeft: `3px solid ${accent}` }}>
                                    <Typography sx={{ color: ink, fontWeight: 750, fontSize: 14, mb: 0.75 }}>Pickup instructions</Typography>
                                    <Typography sx={{ whiteSpace: 'pre-line', color: muted, lineHeight: 1.8, fontSize: 14.5 }}>{branch.pickup_instructions}</Typography>
                                </Box>
                            )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E6E0', borderRadius: 2, p: { xs: 3, md: 3.5 } }}>
                                <Typography sx={{ fontWeight: 750, fontSize: 18, mb: 3 }}>{displayName}</Typography>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <PlaceOutlinedIcon sx={{ color: accent, fontSize: 21, mt: 0.2 }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 12, color: muted, fontWeight: 700, mb: 0.5 }}>BRANCH ADDRESS</Typography>
                                        <Typography sx={{ fontSize: 14.5, lineHeight: 1.7 }}>{address}</Typography>
                                    </Box>
                                </Stack>
                                {branch.phone && (
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 3 }}>
                                        <CallOutlinedIcon sx={{ color: accent, fontSize: 20, mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontSize: 12, color: muted, fontWeight: 700, mb: 0.5 }}>CONTACT</Typography>
                                            <Typography component="a" href={`tel:${branch.phone}`} sx={{ fontSize: 14.5, color: ink, textDecoration: 'none', '&:hover': { color: accent } }}>{branch.phone}</Typography>
                                        </Box>
                                    </Stack>
                                )}
                                <Button href={directionsUrl} target="_blank" rel="noopener noreferrer" fullWidth endIcon={<ArrowForwardRoundedIcon />}
                                    variant="outlined" sx={{ mt: 3.5, py: 1.4, textTransform: 'none', borderColor: '#BBC5BE', borderRadius: 1, color: ink, fontWeight: 750, '&:hover': { borderColor: ink, bgcolor: '#F7F7F4' } }}>
                                    Open in Google Maps
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                    <Box component="section" aria-labelledby="branch-fleet-title">
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'end' }} justifyContent="space-between" sx={{ mb: 3.5 }}>
                            <Box>
                                <Typography sx={{ color: accent, fontSize: 12, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1.2 }}>Choose your ride</Typography>
                                <Typography id="branch-fleet-title" component="h2" sx={{ fontSize: { xs: 27, md: 36 }, fontWeight: 750, letterSpacing: '-.04em', lineHeight: 1.15 }}>
                                    Bikes in {branch.city}
                                </Typography>
                                <Typography sx={{ mt: 1, color: muted, fontSize: 14.5, lineHeight: 1.65 }}>
                                    Currently listed at this branch. Check dates and return location for confirmed availability.
                                </Typography>
                            </Box>
                            <Button component={Link} href={browseHref} endIcon={<ArrowForwardRoundedIcon />}
                                sx={{ color: ink, px: 0, fontWeight: 750, textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { color: accent, bgcolor: 'transparent' } }}>
                                View all available bikes
                            </Button>
                        </Stack>
                        {bikes.length ? (
                            <Grid container spacing={3}>
                                {bikes.map((bike) => (
                                    <Grid key={bike.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Card sx={{ bgcolor: '#fff', height: '100%', border: '1px solid #E2E6E0', boxShadow: 'none', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ height: 215, bgcolor: '#E9EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {bike.primary_image_url ? (
                                                    <CardMedia component="img" image={bike.primary_image_url} alt={`${bike.brand} ${bike.model_name}`} loading="lazy"
                                                        sx={{ height: '100%', width: '100%', objectFit: 'contain', p: 2 }} />
                                                ) : <TwoWheelerOutlinedIcon sx={{ color: '#91A29A', fontSize: 60 }} />}
                                            </Box>
                                            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 3 } }}>
                                                <Typography component="h3" sx={{ fontSize: 21, fontWeight: 750, letterSpacing: '-.025em', lineHeight: 1.25 }}>
                                                    {bike.brand} {bike.model_name}
                                                </Typography>
                                                <Typography sx={{ mt: 1.5, mb: 3, color: muted, fontSize: 14 }}>
                                                    {Number(bike.daily_rate) > 0 ? (
                                                        <>From <Box component="span" sx={{ color: ink, fontSize: 21, fontWeight: 800 }}>₹{Number(bike.daily_rate).toLocaleString('en-IN')}</Box> / day</>
                                                    ) : 'Request a quote'}
                                                </Typography>
                                                <Button component={Link} href={`/services/bikes/${bike.id}?pickup_store_id=${branch.id}&return_store_id=${branch.id}`}
                                                    fullWidth variant="contained" endIcon={<ArrowForwardRoundedIcon />}
                                                    sx={{ mt: 'auto', bgcolor: ink, color: '#fff', py: 1.35, borderRadius: 1, boxShadow: 'none', textTransform: 'none', fontWeight: 750, '&:hover': { bgcolor: '#304143', boxShadow: 'none' } }}>
                                                    Check dates & price
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box role="status" sx={{ borderRadius: 2, border: '1px solid #E2E6E0', bgcolor: '#fff', p: { xs: 3, md: 5 } }}>
                                <Typography sx={{ fontSize: 19, fontWeight: 750 }}>No bikes are listed here right now.</Typography>
                                <Typography sx={{ mt: 1, color: muted, lineHeight: 1.7 }}>Check back soon or contact the branch about upcoming availability.</Typography>
                            </Box>
                        )}
                    </Box>
                    <Button component={Link} href="/locations" startIcon={<ArrowBackRoundedIcon />}
                        sx={{ mt: { xs: 5, md: 7 }, px: 0, color: muted, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: accent } }}>
                        See all pickup locations
                    </Button>
                </Container>
            </Box>
        </AppLayout>
    );
}

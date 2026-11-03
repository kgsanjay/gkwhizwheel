import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button, Stack, Paper } from '@mui/material';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';

export default function LocationsShow({ branch, bikes = [], canonicalUrl }) {
    const title = branch.seo_title || `Bike Rentals in ${branch.city} | G.K. WhizWheel`;
    const description = branch.seo_description || branch.public_description.slice(0, 155);
    const address = [branch.address_line, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ');
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
        geo: { '@type': 'GeoCoordinates', latitude: branch.latitude, longitude: branch.longitude },
        ...(branch.phone ? { telephone: branch.phone } : {}),
    };

    return (
        <AppLayout>
            <PageHead title={title} description={description} canonicalUrl={canonicalUrl}
                ogImage={branch.hero_image_url || undefined} structuredData={structuredData} />
            <Box component="main" sx={{ minHeight: '65vh', py: { xs: 4, md: 7 }, bgcolor: '#0B1120' }}>
                <Container maxWidth="lg">
                    <Stack spacing={3}>
                        <Button component={Link} href="/locations" sx={{ alignSelf: 'flex-start', color: '#FBBF24' }}>
                            All Pickup Locations
                        </Button>
                        <Box>
                            <Typography component="h1" variant="h3" sx={{ color: '#FFFFFF', fontWeight: 900 }}>
                                {branch.name}
                            </Typography>
                            <Typography sx={{ color: '#CBD5E1', mt: 1, maxWidth: 850, whiteSpace: 'pre-line' }}>
                                {branch.public_description}
                            </Typography>
                        </Box>
                        {branch.hero_image_url && (
                            <Box component="img" src={branch.hero_image_url} alt={`G.K. WhizWheel ${branch.city} branch`}
                                sx={{ width: '100%', maxHeight: 390, objectFit: 'cover', borderRadius: 3 }} />
                        )}
                        <Paper sx={{ bgcolor: '#1E293B', p: 3, borderRadius: 3 }}>
                            <Typography component="h2" variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>Pickup and Return Information</Typography>
                            <Typography sx={{ color: '#CBD5E1' }}>{address}</Typography>
                            {branch.phone && <Typography sx={{ color: '#CBD5E1', mt: 1 }}>Phone: {branch.phone}</Typography>}
                            {branch.pickup_instructions && (
                                <Typography sx={{ whiteSpace: 'pre-line', color: '#CBD5E1', mt: 2 }}>
                                    {branch.pickup_instructions}
                                </Typography>
                            )}
                            <Button sx={{ mt: 2, color: '#FBBF24' }}
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.latitude + ',' + branch.longitude)}`}
                                target="_blank" rel="noopener noreferrer">
                                Get Directions
                            </Button>
                        </Paper>
                        <Box>
                            <Button component={Link} href={`/services/bikes?store_id=${branch.id}&return_store_id=${branch.id}`}
                                variant="outlined" sx={{ mb: 2, color: '#FBBF24', borderColor: '#F59E0B', fontWeight: 700 }}>
                                Search Bikes at This Branch
                            </Button>
                            <Typography component="h2" variant="h4" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Bikes at {branch.city}
                            </Typography>
                            <Typography sx={{ color: '#CBD5E1', mb: 3 }}>
                                These bikes are currently located at this branch. Select rental dates and a return branch to confirm availability and the final price.
                            </Typography>
                            {bikes.length ? (
                                <Grid container spacing={3}>
                                    {bikes.map((bike) => (
                                        <Grid key={bike.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Card sx={{ height: '100%', bgcolor: '#1E293B', color: '#FFFFFF', borderRadius: 3 }}>
                                                {bike.primary_image_url && (
                                                    <CardMedia component="img" image={bike.primary_image_url} height="190"
                                                        alt={`${bike.brand} ${bike.model_name}`} loading="lazy" />
                                                )}
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        <Typography component="h3" variant="h6" sx={{ fontWeight: 800 }}>
                                                            {bike.brand} {bike.model_name}
                                                        </Typography>
                                                        <Typography sx={{ color: '#FBBF24', fontWeight: 800 }}>
                                                            {Number(bike.daily_rate) > 0 ? `From ₹${Number(bike.daily_rate).toLocaleString('en-IN')} / day` : 'Request a quote'}
                                                        </Typography>
                                                        <Button component={Link} href={`/services/bikes/${bike.id}?pickup_store_id=${branch.id}&return_store_id=${branch.id}`}
                                                            variant="contained" sx={{ bgcolor: '#F59E0B', color: '#111827', fontWeight: 800 }}>
                                                            Check Dates and Price
                                                        </Button>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper sx={{ p: 3, bgcolor: '#1E293B', color: '#CBD5E1' }} role="status">
                                    No bikes are currently listed here. Contact the branch about upcoming availability.
                                </Paper>
                            )}
                        </Box>
                    </Stack>
                </Container>
            </Box>
        </AppLayout>
    );
}

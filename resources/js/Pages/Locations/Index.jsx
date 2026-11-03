import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button, Stack, Chip } from '@mui/material';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';

export default function LocationsIndex({ branches = [], canonicalUrl }) {
    return (
        <AppLayout>
            <PageHead
                title="G.K. WhizWheel Branches | Bike Rental Pickup Locations"
                description="Explore G.K. WhizWheel's published bike rental branches, pickup details and available vehicles."
                canonicalUrl={canonicalUrl}
            />
            <Box component="main" sx={{ minHeight: '65vh', py: { xs: 5, md: 9 }, bgcolor: '#0B1120' }}>
                <Container maxWidth="lg">
                    <Typography component="h1" variant="h3" sx={{ color: '#FFFFFF', fontWeight: 900, mb: 1 }}>
                        Choose Your Pickup Location
                    </Typography>
                    <Typography sx={{ color: '#CBD5E1', mb: 5 }}>
                        Select a branch to explore its location details and currently listed bikes.
                    </Typography>
                    {branches.length ? (
                        <Grid container spacing={3}>
                            {branches.map((branch) => (
                                <Grid key={branch.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Card sx={{ height: '100%', bgcolor: '#1E293B', color: '#FFFFFF', borderRadius: 3 }}>
                                        {branch.hero_image_url && <CardMedia component="img" height="195" image={branch.hero_image_url} alt={`G.K. WhizWheel ${branch.city} branch`} loading="lazy" />}
                                        <CardContent>
                                            <Stack spacing={1.5}>
                                                <Typography component="h2" variant="h5" sx={{ fontWeight: 800 }}>
                                                    {branch.public_name || branch.name}
                                                </Typography>
                                                <Typography sx={{ color: '#CBD5E1' }}>{branch.address_line}, {branch.city}</Typography>
                                                <Chip label={`${branch.current_bikes_count ?? 0} bikes currently listed`} sx={{ alignSelf: 'flex-start', color: '#FBBF24' }} />
                                                <Button component={Link} href={`/locations/${branch.slug}`} variant="contained" sx={{ bgcolor: '#F59E0B', color: '#111827', fontWeight: 800 }}>
                                                    Explore Branch
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography role="status" sx={{ color: '#CBD5E1' }}>
                            Branch details are being prepared. Contact our team for current pickup availability.
                        </Typography>
                    )}
                </Container>
            </Box>
        </AppLayout>
    );
}

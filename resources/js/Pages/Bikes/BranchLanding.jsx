import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@inertiajs/react';
import {
    Box, Grid, Stack, Card, CardContent, Typography, Button, Chip, Divider,
    Alert, Breadcrumbs,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';
import { marketingHeroBackground, marketingPanelSx } from '../../Components/Marketing/MarketingPageHero';

export default function BranchLanding({ branch, models = [], unlinked_count = 0, otherBranches = [] }) {
    const isDark = useTheme().palette.mode === 'dark';
    const place = branch.city || branch.name;
    const canonical = `https://whizwheels.in${branch.canonical_path}`;
    const title = `Bike & Scooter Rentals in ${place} | GK WhizWheel`;
    const description = `Browse bike and scooter models at the GK WhizWheel ${place} branch. Compare rental options, select dates and check live availability before booking.`;
    const physicalUnits = models.reduce((sum, model) => sum + model.physical_units, 0);

    return (
        <AppLayout>
            <PageHead
                title={title} description={description} canonicalUrl={canonical}
                ogImage={models.find((model) => model.image_url)?.image_url || undefined}
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whizwheels.in/' },
                            { '@type': 'ListItem', position: 2, name: 'Bike Rentals', item: 'https://whizwheels.in/services/bikes' },
                            { '@type': 'ListItem', position: 3, name: `${place} Bike Rentals`, item: canonical },
                        ],
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'CollectionPage',
                        name: title,
                        url: canonical,
                        description,
                        about: { '@type': 'Service', name: `Bike rental in ${place}` },
                    },
                ]}
            />
            <Box component="main" id="main-content" sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 5 } }}>
                <Breadcrumbs aria-label="Breadcrumbs" sx={{ mb: 3 }}>
                    <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
                    <Link href="/services/bikes" style={{ color: 'inherit', textDecoration: 'none' }}>Bike Rentals</Link>
                    <Typography color="text.primary">{place}</Typography>
                </Breadcrumbs>
                <Grid container spacing={{ xs: 3, md: 5 }} alignItems="center" sx={{
                    ...marketingPanelSx(isDark),
                    background: marketingHeroBackground(isDark),
                    p: { xs: 3, md: 4.5 },
                    mb: { xs: 5, md: 7 },
                }}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Chip icon={<LocationOnIcon />} label={`${place}, ${branch.state || 'Karnataka'}`} sx={{ mb: 2 }} />
                        <Typography component="h1" variant="h2" fontWeight={850}
                            sx={{ fontSize: { xs: '2.1rem', md: '3.3rem' }, letterSpacing: '-0.035em', lineHeight: 1.13, mb: 2 }}>
                            Bike & Scooter Rentals in {place}
                        </Typography>
                        <Typography color="text.secondary" variant="body1" sx={{ maxWidth: 620, mb: 3, lineHeight: 1.75 }}>
                            Choose a bike model from our {place} branch, check the dates you need,
                            and view the exact price before payment. You can also select a different
                            return branch when booking.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
                            <Button component={Link} href="#branch-models" variant="contained" color="secondary" endIcon={<ArrowForwardIcon />}>
                                Browse {place} bikes
                            </Button>
                            <Button component={Link} href="/services/bikes" variant="outlined" startIcon={<ArrowBackIcon />}>
                                All rental locations
                            </Button>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card variant="outlined" sx={marketingPanelSx(isDark)}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="overline" color="text.secondary">Branch details</Typography>
                                <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>{branch.name}</Typography>
                                <Stack spacing={1.5}>
                                    <Typography variant="body2">
                                        <LocationOnIcon sx={{ fontSize: 17, verticalAlign: 'middle', mr: 1 }} />
                                        {[branch.address_line, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ')}
                                    </Typography>
                                    {branch.phone && <Typography variant="body2">
                                        Contact: <a href={`tel:${branch.phone}`}>{branch.phone}</a>
                                    </Typography>}
                                    {branch.google_maps_url && <Typography variant="body2">
                                        <a href={branch.google_maps_url} target="_blank" rel="noopener noreferrer">View branch on Google Maps</a>
                                    </Typography>}
                                    {branch.whatsapp_enquiry_number && <Button size="small" variant="outlined"
                                        component="a" target="_blank" rel="noopener noreferrer"
                                        href={`https://wa.me/${branch.whatsapp_enquiry_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello G.K. WhizWheel, I have an enquiry about your ${branch.city} branch.`)}`}>
                                        WhatsApp enquiry
                                    </Button>}
                                    {(branch.pickup_points || []).length > 0 && <Box>
                                        <Typography variant="subtitle2" fontWeight={700}>Pickup and return points</Typography>
                                        <Stack spacing={0.5}>
                                            {branch.pickup_points.map((point) => <Typography key={point.id} variant="body2">
                                                {point.name}
                                            </Typography>)}
                                        </Stack>
                                    </Box>}
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="h4" fontWeight={850}>{models.length}</Typography>
                                        <Typography variant="caption" color="text.secondary">Bike models here</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="h4" fontWeight={850}>{physicalUnits + unlinked_count}</Typography>
                                        <Typography variant="caption" color="text.secondary">Vehicles currently at this branch</Typography>
                                    </Grid>
                                </Grid>
                                <Typography variant="caption" color="text.secondary">
                                    Physical stock is not a guarantee of availability for future dates.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box id="branch-models" component="section" aria-labelledby="branch-models-title" sx={{ scrollMarginTop: 95 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 3 }}>
                        <Box>
                            <Typography id="branch-models-title" component="h2" variant="h4" fontWeight={850}>
                                Explore bike models in {place}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Every model can include multiple individually registered bikes.
                                Select a model to check dates and reserve an eligible vehicle.
                            </Typography>
                        </Box>
                    </Stack>
                    {models.length === 0 && <Alert severity="info" sx={{ mb: 3 }}>
                        No linked bike models are currently listed for this branch. You can view other locations or the complete bike catalog.
                    </Alert>}
                    <Grid container spacing={2.5}>
                        {models.map((model) => (
                            <Grid key={model.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <Card variant="outlined" sx={{
                                ...marketingPanelSx(isDark),
                                height: '100%', display: 'flex', flexDirection: 'column',
                                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                '&:hover': { transform: 'translateY(-4px)' },
                            }}>
                                    <Box sx={{
                                    height: 200, display: 'grid', placeItems: 'center',
                                    background: isDark
                                        ? 'linear-gradient(130deg, #1E293B, #0F172A)'
                                        : 'linear-gradient(130deg, #F1F5F9, #E0F2FE)',
                                }}>
                                        {model.image_url
                                            ? <Box component="img" src={model.image_url}
                                                alt={`${model.brand} ${model.name}`} loading="lazy"
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <TwoWheelerIcon aria-label="Bike" sx={{ color: 'text.disabled', fontSize: 80 }} />}
                                    </Box>
                                    <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.3 }}>
                                        <Typography component="h3" variant="h6" fontWeight={800}>{model.brand} {model.name}</Typography>
                                        <Stack direction="row" gap={0.8} flexWrap="wrap">
                                            <Chip size="small" variant="outlined" label={model.category_name || 'Two-wheeler'} />
                                            <Chip size="small" variant="outlined" label={model.transmission} />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {model.physical_units} registered here · {model.physically_available_now} currently marked available
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Select dates on the model page for actual bookable inventory.
                                        </Typography>
                                        {model.indicative_daily_rate !== null && (
                                            <Typography fontWeight={750}>
                                                Indicative ₹{Number(model.indicative_daily_rate).toLocaleString('en-IN')}/day
                                            </Typography>
                                        )}
                                        <Button variant="contained" color="secondary" fullWidth sx={{ mt: 'auto' }}
                                            component={Link}
                                            href={`/services/bikes/models/${model.id}/${model.slug}?pickup_store_id=${branch.id}&return_store_id=${branch.id}`}>
                                            Check dates & book
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {unlinked_count > 0 && (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            {unlinked_count} individual vehicle(s) at this branch have not yet been linked to a shared model.
                            <Button component={Link} href={`/services/bikes?store_id=${branch.id}`} size="small">
                                Browse individual bikes
                            </Button>
                        </Alert>
                    )}
                </Box>

                {otherBranches.length > 0 && (
                    <Box component="nav" aria-label="Other rental branches" sx={{ mt: { xs: 6, md: 9 } }}>
                        <Typography component="h2" variant="h5" fontWeight={800} sx={{ mb: 2 }}>Explore other rental branches</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1.5}>
                            {otherBranches.map((other) => (
                                <Button key={other.id} component={Link} href={other.path} variant="outlined" endIcon={<ArrowForwardIcon />}>
                                    {other.city || other.name}
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Box>
        </AppLayout>
    );
}

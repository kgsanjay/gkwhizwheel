import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Paper,
    Stack,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

export default function ExplorePage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const destinations = [
        {
            title: 'Sharavathi Backwaters & Boating',
            distance: '8 km from Hub',
            transport: '🛵 Bike / 🚤 Boat',
            image: '/images/places/sharavathi_backwaters.jpg',
            alt: 'Scenic Sharavathi backwaters and mangrove estuary at sunset in Honnavar with wooden boat',
            color: '#059669',
            tags: ['Mangrove Estuary', 'Sunset Cruise', 'Kayaking'],
            desc: 'Cruising across the Sharavathi bridges and mangrove channels offers calm water reflections, estuary sunsets where the river meets the sea, and serene Shikara rides.',
            linkHref: '/services/boating',
            linkText: 'Explore Boating & Cruises →',
        },
        {
            title: 'Honnavar Eco Beach & Boardwalk',
            distance: '4 km from Hub',
            transport: '🛵 Bike / 🚖 Cab',
            image: '/images/places/eco_beach_boardwalk.jpg',
            alt: 'Honnavar Eco Beach wooden boardwalk trail curving through rich coastal mangrove trees towards the sea',
            color: '#0284C7',
            tags: ['Blue Flag Beach', 'Wooden Promenade', 'Sunset Walk'],
            desc: 'Certified eco-beach featuring a picturesque wooden promenade winding through rich coastal mangroves. Ideal for gentle evening rides, nature photography, and sea breezes.',
            linkHref: '/services/bikes',
            linkText: 'Rent Bike for Beach Ride →',
        },
        {
            title: 'Apsarakonda Waterfalls & Hill',
            distance: '7 km South (NH66)',
            transport: '🛵 Bike / 🚖 Cab',
            image: '/images/places/apsarakonda_falls.jpg',
            alt: 'Apsarakonda freshwater waterfall cascading into a natural pool surrounded by tropical palm trees',
            color: '#D97706',
            tags: ['Freshwater Cascade', 'Natural Lagoon', 'Cliff View'],
            desc: 'A natural freshwater cascade flowing into a natural pond with ancient Pandava caves, accompanied by a panoramic hill-garden viewpoint over the Arabian Sea.',
            linkHref: '/services/guide',
            linkText: 'View Guided Waterfall Tour →',
        },
        {
            title: 'Mirjan Fort Historic Ramparts',
            distance: '22 km North (NH66)',
            transport: '🛵 Bike / 🚖 Cab',
            image: '/images/places/mirjan_fort.jpg',
            alt: 'Historic 16th century Mirjan Fort with ancient laterite stone ramparts and moss-covered royal watchtowers',
            color: '#7C3AED',
            tags: ['16th Century Queen', 'Laterite Architecture', 'Highway Ride'],
            desc: 'Built in the 16th century by Queen Chennabhairadevi (the Pepper Queen), this fortress features mossy laterite watchtowers and serene green grounds along NH66.',
            linkHref: '/services/guide',
            linkText: 'Explore Heritage Fort Tour →',
        },
        {
            title: 'Murudeshwar Shiva Temple & Sea',
            distance: '27 km South (NH66)',
            transport: '🚖 Cab / 🛵 Bike',
            image: '/images/places/murudeshwar_temple.jpg',
            alt: 'Colossal Lord Shiva statue and Raja Gopuram overlooking the Arabian Sea at Murudeshwar temple',
            color: '#E11D48',
            tags: ['World Tallest Shiva', 'Raja Gopuram', 'Netrani Base'],
            desc: 'Home to the world’s 2nd tallest Shiva statue seated on Kanduka hill overlooking the ocean, 20-storey Raja Gopuram, and gateway to Netrani scuba diving.',
            linkHref: '/services/cabs',
            linkText: 'Book AC Cab to Murudeshwar →',
        },
        {
            title: 'Gokarna Om & Kudle Beaches',
            distance: '48 km North (NH66)',
            transport: '🚖 Cab / 🛵 Bike',
            image: '/images/places/gokarna_beaches.jpg',
            alt: 'Aerial view of Om Beach with crescent-shaped golden sands and turquoise sea in Gokarna',
            color: '#2563EB',
            tags: ['Om Beach', 'Kudle Coastline', 'Temple Town'],
            desc: 'The quintessential Karnataka coastal highway road trip. Cruise on a Royal Enfield or hire an AC taxi from Honnavar to Om Beach, cafe hopping, and sacred temples.',
            linkHref: '/services/cabs',
            linkText: 'Book Gokarna Day Trip Cab →',
        },
    ];

    const tourismFaqs = [
        {
            q: 'What travel and rental services does GK WhizWheel offer in Honnavar?',
            a: 'We are Honnavar’s complete coastal travel partner offering: (1) Two-Wheeler & Bike Rentals (Activa, Classic 350, CB350, electric scooters starting ₹350/day), (2) Private AC Cabs & Taxis (Swift Dzire, Innova Crysta, Tempo Travellers for station pickups and sightseeing), (3) Sharavathi River Backwater Boating & mangrove island cruises, (4) Netrani Island Scuba Diving with certified PADI dive masters, (5) Coastal Homestays & Riverfront Cottages, and (6) All-in-One Vacation Packages bundling stay, ride, and cruise.',
        },
        {
            q: 'Can we travel with your rental vehicles to Gokarna, Murudeshwar, or Jog Falls?',
            a: 'Yes! All GK WhizWheel rental bikes and cabs have full Karnataka permits to travel anywhere along the coastal circuit including Murudeshwar (27 km), Gokarna (48 km), Kumta (20 km), Yana Caves, Jog Falls (60 km), and Goa.',
        },
        {
            q: 'Can I bundle multiple services into an All-in-One Vacation Package?',
            a: 'Yes! With our custom Karavali Vacation Packages, you can bundle Bikes or Cabs + Riverfront Homestay + Sharavathi Boat Cruise + Netrani Scuba into a single itinerary. Combo bookings receive an automatic 10% package discount and a dedicated local Honnavar trip coordinator who handles all logistics.',
        },
        {
            q: 'Can I get vehicle pickup or drop right at Honnavar Railway Station?',
            a: 'Yes! We maintain an active Honnavar Railway Station Hub on Station Road. Our executive meets you right outside the station on your arrival for a swift 5-minute handover.',
        },
    ];

    return (
        <AppLayout>
            <Head>
                <title>Explore Honnavar & Coastal Karnataka Attractions — GK WhizWheels</title>
                <meta
                    name="description"
                    content="Discover scenic routes, Sharavathi backwaters, Honnavar Eco Beach, Apsarakonda Falls, Mirjan Fort, Murudeshwar, and Gokarna. Rent a bike or book a cab with GK WhizWheels."
                />
            </Head>

            <Box sx={{ maxWidth: '1240px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 4, md: 6 }, pb: 10 }}>
                {/* Hero Header */}
                <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.8,
                            px: 2,
                            py: 0.6,
                            borderRadius: 9999,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: isDark ? '#FBBF24' : '#B45309',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            mb: 2,
                        }}
                    >
                        <ExploreIcon sx={{ fontSize: 17 }} />
                        Coastal Karnataka Travel Guide
                    </Box>
                    <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                            fontWeight: 950,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
                            mb: 2,
                        }}
                    >
                        Explore Honnavar & Scenic Coastal Routes
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: isDark ? '#CBD5E1' : '#475569',
                            maxWidth: 760,
                            mx: 'auto',
                            fontSize: { xs: '1rem', md: '1.12rem' },
                            lineHeight: 1.7,
                        }}
                    >
                        Honnavar is Karnataka’s pristine coastal haven. From cruising mangrove waterways and historic fort trails to breezy coastal highway rides towards Gokarna and Murudeshwar — discover the top places to visit with GK WhizWheels.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3.5 }}>
                        <Button
                            variant="contained"
                            component={Link}
                            href="/services/bikes"
                            startIcon={<TwoWheelerIcon />}
                            sx={{
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                fontWeight: 800,
                                px: 3,
                                py: 1.2,
                                borderRadius: 2.5,
                                '&:hover': { bgcolor: '#D97706' },
                            }}
                        >
                            Book Your Bike for Exploring
                        </Button>
                        <Button
                            variant="outlined"
                            component={Link}
                            href="/services/cabs"
                            startIcon={<DirectionsCarIcon />}
                            sx={{
                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                fontWeight: 700,
                                px: 3,
                                py: 1.2,
                                borderRadius: 2.5,
                            }}
                        >
                            Book Coastal Cabs
                        </Button>
                    </Stack>
                </Box>

                {/* Destinations Grid */}
                <Grid container spacing={3.5} sx={{ mb: 10 }}>
                    {destinations.map((place, idx) => (
                        <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 4,
                                    bgcolor: isDark ? 'rgba(26, 34, 53, 0.85)' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    boxShadow: isDark
                                        ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                                        : '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
                                    overflow: 'hidden',
                                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        borderColor: place.color,
                                        boxShadow: isDark
                                            ? `0 20px 40px -10px ${place.color}35`
                                            : `0 20px 40px -10px ${place.color}25`,
                                        '& .place-img': {
                                            transform: 'scale(1.08)',
                                        },
                                    },
                                }}
                            >
                                <Box sx={{ position: 'relative', height: 215, bgcolor: '#0F172A', overflow: 'hidden' }}>
                                    <Box
                                        component="img"
                                        className="place-img"
                                        src={place.image}
                                        loading="lazy"
                                        alt={place.alt}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.1) 40%, rgba(15,23,42,0.9) 100%)',
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            left: 12,
                                            right: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                px: 1.4,
                                                py: 0.45,
                                                borderRadius: 9999,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                fontSize: '0.74rem',
                                            }}
                                        >
                                            📍 {place.distance}
                                        </Box>
                                        <Box
                                            sx={{
                                                px: 1.4,
                                                py: 0.45,
                                                borderRadius: 9999,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                backdropFilter: 'blur(10px)',
                                                border: `1.5px solid ${place.color}`,
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                fontSize: '0.74rem',
                                            }}
                                        >
                                            {place.transport}
                                        </Box>
                                    </Box>
                                </Box>

                                <CardContent
                                    sx={{
                                        p: 3,
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h5"
                                            component="h2"
                                            sx={{
                                                fontWeight: 900,
                                                color: isDark ? '#FFFFFF' : '#0F172A',
                                                letterSpacing: '-0.02em',
                                                lineHeight: 1.25,
                                                fontSize: '1.2rem',
                                                mb: 1.2,
                                            }}
                                        >
                                            {place.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isDark ? '#CBD5E1' : '#334155',
                                                fontSize: '0.88rem',
                                                lineHeight: 1.6,
                                                mb: 2,
                                            }}
                                        >
                                            {place.desc}
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
                                            {place.tags.map((tag, tIdx) => (
                                                <Chip
                                                    key={tIdx}
                                                    label={tag}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                                                        color: isDark ? '#E2E8F0' : '#1E293B',
                                                        fontWeight: 700,
                                                        fontSize: '0.74rem',
                                                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>

                                    <Button
                                        component={Link}
                                        href={place.linkHref}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            p: 0,
                                            color: isDark ? '#38BDF8' : '#0284C7',
                                            fontWeight: 800,
                                            fontSize: '0.88rem',
                                            textTransform: 'none',
                                            textDecoration: 'none',
                                            '&:hover': {
                                                bgcolor: 'transparent',
                                                textDecoration: 'underline',
                                                color: place.color,
                                            },
                                        }}
                                    >
                                        {place.linkText}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Tourism FAQs Section */}
                <Box sx={{ maxWidth: 860, mx: 'auto', mb: 8 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Chip
                            label="Trip Planning & Travel FAQ"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1 }}
                        />
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
                            Honnavar Travel Questions & Answers
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                            Everything you need to know about sightseeing, permits, routes, and bundled vacation packages.
                        </Typography>
                    </Box>

                    {tourismFaqs.map((faq, fIdx) => (
                        <Accordion
                            key={fIdx}
                            defaultExpanded={fIdx === 0}
                            sx={{
                                bgcolor: isDark ? '#131D2F' : '#FFFFFF',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                mb: 2,
                                borderRadius: '12px !important',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {faq.q}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.7 }}>
                                    {faq.a}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                {/* Ready to Explore CTA Box */}
                <Paper
                    sx={{
                        p: { xs: 4, md: 6 },
                        borderRadius: 4,
                        textAlign: 'center',
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFBEB',
                        border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                    }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1.5 }}>
                        Ready to Explore Honnavar on Two Wheels?
                    </Typography>
                    <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#475569', maxWidth: 640, mx: 'auto', mb: 3 }}>
                        Pick up your sanitized rental bike right outside Honnavar Railway Station or at our Palya Main Rd Hub and hit the coastal highway.
                    </Typography>
                    <Button
                        variant="contained"
                        component={Link}
                        href="/services/bikes"
                        size="large"
                        startIcon={<TwoWheelerIcon />}
                        sx={{
                            bgcolor: '#F59E0B',
                            color: '#0F172A',
                            fontWeight: 800,
                            px: 4,
                            py: 1.4,
                            borderRadius: 2.5,
                            fontSize: '1rem',
                            '&:hover': { bgcolor: '#D97706' },
                        }}
                    >
                        Book Your Bike Now →
                    </Button>
                </Paper>
            </Box>
        </AppLayout>
    );
}

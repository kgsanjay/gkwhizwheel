import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    Paper,
    Divider,
    TextField,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Container,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Welcome({ featuredBikes = [], categories = [], stores = [] }) {
    // Quick search form state
    const today = new Date().toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const [searchStore, setSearchStore] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(dayAfter);
    const [activeTab, setActiveTab] = useState('all');

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchStore) params.append('store_id', searchStore);
        if (searchCategory) params.append('category_id', searchCategory);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        router.visit(`/bikes?${params.toString()}`);
    };

    const filteredBikes = activeTab === 'all'
        ? featuredBikes
        : featuredBikes.filter((b) => b.category?.name?.toLowerCase().includes(activeTab) || b.category_id === Number(activeTab));

    return (
        <AppLayout>
            <Head title="GK WhizWheel — Premier Bike & Scooter Rentals in Bengaluru" />

            {/* =========================================================================
                1. HERO SECTION
            ========================================================================== */}
            <Box
                sx={{
                    position: 'relative',
                    py: { xs: 5, md: 8 },
                    px: { xs: 2, sm: 4, md: 6 },
                    borderRadius: 4,
                    background: 'radial-gradient(130% 120% at 90% 10%, #1E293B 0%, #0F172A 60%, #090E17 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    mb: 8,
                }}
            >
                {/* Background Ambient Glows */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -120,
                        right: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -150,
                        left: -100,
                        width: 350,
                        height: 350,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Grid container spacing={5} alignItems="center">
                    {/* Left Hero Content & Quick Booking Widget */}
                    <Grid item xs={12} lg={7}>
                        <Chip
                            icon={<ElectricBoltIcon sx={{ color: '#F59E0B !important', fontSize: 16 }} />}
                            label="Bengaluru's Premier Two-Wheeler Rental Platform"
                            sx={{
                                bgcolor: 'rgba(245, 158, 11, 0.12)',
                                color: '#FBBF24',
                                fontWeight: 700,
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                mb: 2.5,
                                py: 0.5,
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                        />

                        <Typography
                            variant="h1"
                            component="h1"
                            sx={{
                                color: '#FFFFFF',
                                fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
                                fontWeight: 900,
                                lineHeight: 1.12,
                                letterSpacing: '-0.03em',
                                mb: 2,
                            }}
                        >
                            Ride Bengaluru <br />
                            <Box
                                component="span"
                                sx={{
                                    background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                On Your Own Terms.
                            </Box>
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: '#94A3B8',
                                fontSize: { xs: '1rem', md: '1.125rem' },
                                lineHeight: 1.6,
                                mb: 4,
                                maxWidth: 620,
                            }}
                        >
                            Rent sanitized Honda Activas, Royal Enfields, and high-performance EVs with transparent 24h block rates,
                            instant digital KYC, and flexible one-way returns across Koramangala & Indiranagar hubs.
                        </Typography>

                        {/* Interactive Quick Search Bar */}
                        <Paper
                            elevation={0}
                            component="form"
                            onSubmit={handleSearch}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: 3,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                mb: 3,
                            }}
                        >
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Pickup & Return Hub"
                                        value={searchStore}
                                        onChange={(e) => setSearchStore(e.target.value)}
                                        InputLabelProps={{ sx: { color: '#94A3B8' } }}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            borderRadius: 1.5,
                                            '& .MuiOutlinedInput-root': {
                                                color: '#FFFFFF',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                                                '&:hover fieldset': { borderColor: '#F59E0B' },
                                            },
                                        }}
                                    >
                                        <MenuItem value="">All Bengaluru Hubs</MenuItem>
                                        {stores.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.name} ({s.bikes_count || 0} bikes)
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Bike Category"
                                        value={searchCategory}
                                        onChange={(e) => setSearchCategory(e.target.value)}
                                        InputLabelProps={{ sx: { color: '#94A3B8' } }}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            borderRadius: 1.5,
                                            '& .MuiOutlinedInput-root': {
                                                color: '#FFFFFF',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                                                '&:hover fieldset': { borderColor: '#F59E0B' },
                                            },
                                        }}
                                    >
                                        <MenuItem value="">All Categories (Scooters, Cruisers, EV)</MenuItem>
                                        {categories.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {c.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={4.5}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        size="small"
                                        label="Pickup Date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        InputLabelProps={{ shrink: true, sx: { color: '#94A3B8' } }}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            borderRadius: 1.5,
                                            '& .MuiOutlinedInput-root': {
                                                color: '#FFFFFF',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                                                '&:hover fieldset': { borderColor: '#F59E0B' },
                                            },
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4.5}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        size="small"
                                        label="Drop-off Date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        InputLabelProps={{ shrink: true, sx: { color: '#94A3B8' } }}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            borderRadius: 1.5,
                                            '& .MuiOutlinedInput-root': {
                                                color: '#FFFFFF',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                                                '&:hover fieldset': { borderColor: '#F59E0B' },
                                            },
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        color="secondary"
                                        size="medium"
                                        startIcon={<SearchIcon />}
                                        sx={{
                                            py: 1,
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            borderRadius: 1.5,
                                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                        }}
                                    >
                                        Search
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Quick Trust Checks */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                                    Free ISI Helmets
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                                    Instant Deposit Return
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                                    15-Min Hold Protection
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Right Hero Showcase — Official Logo Badge & Live Stats Card */}
                    <Grid item xs={12} lg={5}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 3, sm: 4 },
                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: 4,
                                textAlign: 'center',
                                position: 'relative',
                            }}
                        >
                            {/* Official Brand Logo Badge */}
                            <Box
                                component="img"
                                src="/images/logo.png"
                                alt="GK WhizWheel Official Emblem"
                                sx={{
                                    width: '100%',
                                    maxWidth: 320,
                                    height: 'auto',
                                    mx: 'auto',
                                    mb: 3,
                                    borderRadius: 3,
                                    filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.45))',
                                    transition: 'transform 0.3s ease',
                                    '&:hover': { transform: 'scale(1.02)' },
                                }}
                            />

                            <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mb: 1 }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <StarIcon key={s} sx={{ color: '#F59E0B', fontSize: 22 }} />
                                ))}
                            </Stack>

                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                                4.9 / 5 Rating from 1,200+ Bengaluru Riders
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5, mb: 3 }}>
                                Certified compliant fleet with digital RC, active insurance, and emission PUC directly in your booking dashboard.
                            </Typography>

                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="h5" sx={{ color: '#F59E0B', fontWeight: 900 }}>
                                        ₹399
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                        Rates From/Day
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="h5" sx={{ color: '#38BDF8', fontWeight: 900 }}>
                                        2 Hubs
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                        City Coverage
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 900 }}>
                                        15 Min
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                        Fast Handover
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* =========================================================================
                2. CATEGORY SELECTOR TABS
            ========================================================================== */}
            <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                            Choose Your Ride Style
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#94A3B8', mt: 0.5 }}>
                            Select a category to filter available bikes or view complete rates.
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        href="/bikes"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'none' }}
                    >
                        View All Bikes
                    </Button>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                    <Chip
                        label="All Fleet Models"
                        clickable
                        onClick={() => setActiveTab('all')}
                        color={activeTab === 'all' ? 'secondary' : 'default'}
                        variant={activeTab === 'all' ? 'filled' : 'outlined'}
                        sx={{
                            fontWeight: 700,
                            px: 1.5,
                            py: 2.2,
                            borderRadius: 2,
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: activeTab === 'all' ? '#000000' : '#E2E8F0',
                        }}
                    />
                    {categories.map((c) => (
                        <Chip
                            key={c.id}
                            label={`${c.name} (${c.bikes_count || 0})`}
                            clickable
                            onClick={() => setActiveTab(c.name.toLowerCase())}
                            color={activeTab === c.name.toLowerCase() ? 'secondary' : 'default'}
                            variant={activeTab === c.name.toLowerCase() ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                px: 1.5,
                                py: 2.2,
                                borderRadius: 2,
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                color: activeTab === c.name.toLowerCase() ? '#000000' : '#E2E8F0',
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* =========================================================================
                3. FEATURED FLEET CARDS
            ========================================================================== */}
            <Box id="fleet" sx={{ mb: 10 }}>
                <Grid container spacing={3.5}>
                    {filteredBikes.map((bike) => (
                        <Grid item xs={12} sm={6} lg={4} key={bike.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: '#131D2F',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: 3.5,
                                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        borderColor: 'rgba(245, 158, 11, 0.4)',
                                        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
                                    },
                                }}
                            >
                                {/* Bike Image */}
                                <Box sx={{ position: 'relative', bgcolor: '#0B1120', pt: 2, pb: 1, px: 2, textAlign: 'center' }}>
                                    <Box
                                        component="img"
                                        src={bike.images?.[0]?.image_path || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80'}
                                        alt={bike.model_name}
                                        sx={{
                                            width: '100%',
                                            height: 190,
                                            objectFit: 'contain',
                                            borderRadius: 2,
                                        }}
                                    />
                                    <Chip
                                        label={bike.category?.name || 'Two Wheeler'}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 14,
                                            left: 14,
                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                            backdropFilter: 'blur(8px)',
                                            color: '#F59E0B',
                                            fontWeight: 700,
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                        }}
                                    />
                                    <Chip
                                        icon={<LocationOnIcon sx={{ fontSize: 14, color: '#38BDF8 !important' }} />}
                                        label={bike.current_store?.name || 'Koramangala Hub'}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 14,
                                            right: 14,
                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                            backdropFilter: 'blur(8px)',
                                            color: '#E2E8F0',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                        }}
                                    />
                                </Box>

                                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 0.5 }}>
                                        {bike.brand} {bike.model_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mb: 2, textTransform: 'uppercase' }}>
                                        Registration: {bike.registration_number}
                                    </Typography>

                                    {/* Specs Pills */}
                                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)', px: 1, py: 0.4, borderRadius: 1.5 }}>
                                            <LocalGasStationIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                                            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                                                {bike.fuel_type || 'Petrol'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)', px: 1, py: 0.4, borderRadius: 1.5 }}>
                                            <SpeedIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                                            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 600 }}>
                                                {bike.engine_capacity_cc ? `${bike.engine_capacity_cc}cc` : 'Electric'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)', px: 1, py: 0.4, borderRadius: 1.5 }}>
                                            <VerifiedUserIcon sx={{ fontSize: 14, color: '#10B981' }} />
                                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                                Insured
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Box sx={{ mt: 'auto' }}>
                                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 2 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2.5 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                                    Daily Rental
                                                </Typography>
                                                <Typography variant="h5" sx={{ color: '#F59E0B', fontWeight: 900, lineHeight: 1.1 }}>
                                                    ₹{bike.daily_rate}
                                                    <Typography component="span" variant="caption" sx={{ color: '#94A3B8', ml: 0.5 }}>
                                                        / day
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                    Refundable Deposit
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 700 }}>
                                                    ₹{bike.deposit_amount || 1500}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Stack direction="row" spacing={1.5}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="secondary"
                                                component={Link}
                                                href={`/bikes/${bike.id}`}
                                                sx={{
                                                    fontWeight: 800,
                                                    py: 1,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                Book Now
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                component={Link}
                                                href={`/bikes/${bike.id}`}
                                                sx={{
                                                    borderColor: 'rgba(255, 255, 255, 0.15)',
                                                    color: '#E2E8F0',
                                                    px: 2,
                                                    '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.05)' },
                                                }}
                                            >
                                                Details
                                            </Button>
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* View All Fleet Action */}
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        component={Link}
                        href="/bikes"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            bgcolor: '#1E293B',
                            color: '#FFFFFF',
                            py: 1.75,
                            px: 5,
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            borderRadius: 2.5,
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.4)',
                            '&:hover': {
                                bgcolor: '#334155',
                                borderColor: '#F59E0B',
                            },
                        }}
                    >
                        Explore All Available Bikes in Bengaluru
                    </Button>
                </Box>
            </Box>

            {/* =========================================================================
                4. DURATION DISCOUNT TIERS & TRANSPARENT PRICING
            ========================================================================== */}
            <Box id="pricing" sx={{ mb: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Chip
                        label="Transparent & Tiered Rates"
                        sx={{ bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontWeight: 700, mb: 1.5 }}
                    />
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', mb: 1 }}>
                        Rent Longer, Save More.
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 640, mx: 'auto' }}>
                        No hidden surge fees. Transparent 24-hour block billing with automated volume discounts and guaranteed security deposit refunds.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3.5,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                Daily Commute
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 900, my: 1 }}>
                                1 – 2 Days
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                                Perfect for quick meetings, errands, or local day trips.
                            </Typography>
                            <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Standard Daily Tariff</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>1 ISI Certified Helmet Free</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>24h Exact Billing Window</Typography>
                                </Box>
                            </Stack>
                            <Button variant="outlined" component={Link} href="/bikes" fullWidth sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                                Select Ride
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3.5,
                                height: '100%',
                                bgcolor: 'rgba(245, 158, 11, 0.06)',
                                border: '2px solid #F59E0B',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                            }}
                        >
                            <Chip
                                label="POPULAR"
                                size="small"
                                color="secondary"
                                sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 800, fontSize: '0.65rem' }}
                            />
                            <Typography variant="subtitle2" sx={{ color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                                Weekend Getaway
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 900, my: 1 }}>
                                3 – 6 Days
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
                                Great for Nandi Hills, Coorg, or Mysore weekend escapes.
                            </Typography>
                            <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#F59E0B', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>10% Tiered Discount</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Dual Helmets (Rider + Pillion)</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Flexible Return Grace Period</Typography>
                                </Box>
                            </Stack>
                            <Button variant="contained" color="secondary" component={Link} href="/bikes" fullWidth sx={{ fontWeight: 800 }}>
                                Book Weekend
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3.5,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                Weekly Explorer
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 900, my: 1 }}>
                                7 – 29 Days
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                                Preferred by remote workers, project consultants, and tourists.
                            </Typography>
                            <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>15% Volume Discount</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>One-Way Drop Across Hubs</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Free 24/7 Breakdown Assistance</Typography>
                                </Box>
                            </Stack>
                            <Button variant="outlined" component={Link} href="/bikes" fullWidth sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                                View Weekly
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3.5,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                Monthly Commute
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 900, my: 1 }}>
                                30+ Days
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                                Long term leasing without maintenance or insurance hassles.
                            </Typography>
                            <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Up to 25% Maximum Savings</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Free Scheduled Servicing</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>Dedicated Account Coordinator</Typography>
                                </Box>
                            </Stack>
                            <Button variant="outlined" component={Link} href="/bikes" fullWidth sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                                Contact Sales
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* =========================================================================
                5. HOW IT WORKS TIMELINE
            ========================================================================== */}
            <Box id="how-it-works" sx={{ mb: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', mb: 1 }}>
                        How It Works
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                        From discovery to handover in 4 straightforward steps.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 3,
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontWeight: 900, mb: 2 }}>
                                01
                            </Box>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Select Bike & Dates
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                Choose from verified scooters, commuters, or cruisers with real-time live availability at our Bengaluru hubs.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 3,
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontWeight: 900, mb: 2 }}>
                                02
                            </Box>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Instant Hold & Pay
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                Your bike is locked with a 15-minute concurrency guard. Checkout securely using UPI, Cards, or NetBanking.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 3,
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: 900, mb: 2 }}>
                                03
                            </Box>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Digital KYC Handover
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                Present your Driving License at the hub. Our staff snaps odometer + condition photos and completes digital signoff.
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                height: '100%',
                                bgcolor: '#131D2F',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 3,
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', fontWeight: 900, mb: 2 }}>
                                04
                            </Box>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Drop Hub & Refund
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                Return at your chosen hub (one-way drops allowed). Your security deposit is refunded directly within 2 hours.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* =========================================================================
                6. BENGALURU STORE HUBS
            ========================================================================== */}
            <Box id="hubs" sx={{ mb: 10 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
                    <Box>
                        <Chip
                            label="Convenient Pickup & Return Locations"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 700, mb: 1 }}
                        />
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                            Our Bengaluru Rental Hubs
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={4}>
                    {stores.map((store) => (
                        <Grid item xs={12} md={6} key={store.id}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    bgcolor: '#131D2F',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 3.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                                                {store.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                                                ● Active Hub • {store.bikes_count || 0} Bikes Ready for Pickup
                                            </Typography>
                                        </Box>
                                        <Chip
                                            icon={<AccessTimeIcon sx={{ fontSize: 14, color: '#F59E0B !important' }} />}
                                            label="08:00 AM – 09:00 PM"
                                            size="small"
                                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontWeight: 600 }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
                                        <LocationOnIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
                                        <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                                            {store.address || 'Bengaluru, Karnataka'}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                                        <Chip label="One-Way Drop Supported" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0' }} />
                                        <Chip label="On-Ground Staff Handover" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0' }} />
                                    </Stack>
                                </Box>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        component={Link}
                                        href={`/bikes?store_id=${store.id}`}
                                        fullWidth
                                        sx={{ fontWeight: 800 }}
                                    >
                                        View Bikes at this Hub
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        component="a"
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + store.address)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        fullWidth
                                        sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}
                                    >
                                        Get Directions
                                    </Button>
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* =========================================================================
                7. FREQUENTLY ASKED QUESTIONS (ACCORDION)
            ========================================================================== */}
            <Box id="faq" sx={{ mb: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', mb: 1 }}>
                        Frequently Asked Questions
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94A3B8' }}>
                        Everything you need to know about our rental guidelines, deposits, and policies.
                    </Typography>
                </Box>

                <Box sx={{ maxWidth: 840, mx: 'auto' }}>
                    <Accordion
                        defaultExpanded
                        sx={{
                            bgcolor: '#131D2F',
                            color: '#FFFFFF',
                            mb: 2,
                            borderRadius: '12px !important',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                What documents do I need to rent a bike?
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                You only need an original, valid Indian Driving License (for two-wheelers) and one government identity proof (Aadhaar Card or Passport). You can upload them digitally ahead of time via your Customer KYC dashboard or present them to staff at the hub during vehicle handover.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        sx={{
                            bgcolor: '#131D2F',
                            color: '#FFFFFF',
                            mb: 2,
                            borderRadius: '12px !important',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                How and when is the security deposit refunded?
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                Once the bike is returned and inspected by our hub staff, the deposit refund is initiated immediately. For UPI and card payments, the refund settles back to your source account within 2 hours. If paid in cash during a walk-in, the deposit is handed back in cash upon return.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        sx={{
                            bgcolor: '#131D2F',
                            color: '#FFFFFF',
                            mb: 2,
                            borderRadius: '12px !important',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Can I pick up a bike in Koramangala and return it in Indiranagar?
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                Yes! GK WhizWheel supports one-way inter-hub rentals. Simply select different pickup and return hubs during checkout. A nominal one-way rebalancing fee (typically ₹100–₹150) is itemized transparently in your price quote.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        sx={{
                            bgcolor: '#131D2F',
                            color: '#FFFFFF',
                            mb: 2,
                            borderRadius: '12px !important',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Are helmets included with the rental?
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                Yes, one sanitized, ISI-certified rider helmet is provided complimentary with every booking. A second pillion helmet can be added during online booking for a nominal fee of ₹50/day.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        sx={{
                            bgcolor: '#131D2F',
                            color: '#FFFFFF',
                            mb: 2,
                            borderRadius: '12px !important',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F59E0B' }} />}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                What is the cancellation policy?
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7 }}>
                                Cancellations made more than 24 hours before your scheduled pickup receive a 100% full refund of both advance rental and security deposit. Cancellations within 24 hours receive a 50% rental refund plus 100% security deposit return.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Box>

            {/* =========================================================================
                8. BOTTOM CTA BANNER
            ========================================================================== */}
            <Box
                sx={{
                    p: { xs: 4, md: 6 },
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 900, mb: 2 }}>
                    Ready to Explore Bengaluru?
                </Typography>
                <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 600, mx: 'auto', mb: 4 }}>
                    Lock your preferred bike in under 2 minutes. Receive instant WhatsApp confirmation and vehicle document deep links.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        component={Link}
                        href="/bikes"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            py: 1.6,
                            px: 4.5,
                            fontWeight: 800,
                            fontSize: '1rem',
                            borderRadius: 2,
                            boxShadow: '0 8px 20px -3px rgba(245, 158, 11, 0.4)',
                        }}
                    >
                        Browse All Bikes
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        component="a"
                        href="https://wa.me/919999900001?text=Hi%20GK%20WhizWheel,%20I%20want%20to%20rent%20a%20bike%20in%20Bengaluru."
                        target="_blank"
                        rel="noreferrer"
                        startIcon={<WhatsAppIcon sx={{ color: '#10B981' }} />}
                        sx={{
                            py: 1.6,
                            px: 3.5,
                            color: '#FFFFFF',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            fontWeight: 700,
                            '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                        }}
                    >
                        Chat on WhatsApp
                    </Button>
                </Stack>
            </Box>
        </AppLayout>
    );
}

import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Tabs,
    Tab,
    Paper,
    Stack,
    Divider,
    Alert,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import DescriptionIcon from '@mui/icons-material/Description';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';

export default function AccountBookings({ bookings = [], stats = {} }) {
    const [activeTab, setActiveTab] = useState('all');

    const handleTabChange = (e, val) => {
        setActiveTab(val);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'handed_over':
                return 'primary';
            case 'returned':
                return 'default';
            case 'held':
            case 'pending_payment':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const activeStatuses = ['held', 'pending_payment', 'confirmed', 'handed_over'];

    const filteredBookings = bookings.filter((b) => {
        if (activeTab === 'active') return activeStatuses.includes(b.status);
        if (activeTab === 'completed') return b.status === 'returned';
        if (activeTab === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    return (
        <AppLayout>
            <Head title="My Bookings - Customer Portal - GK WhizWheel" />

            {/* Portal Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                        My Rental Bookings
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#64748B' }}>
                        Track your upcoming trips, download vehicle RC/Insurance legal documents, and manage reservations.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <Button
                        component={Link}
                        href="/account/kyc"
                        variant="outlined"
                        color="secondary"
                        startIcon={<ShieldIcon />}
                        sx={{ fontWeight: 600 }}
                    >
                        KYC Verification
                    </Button>
                    <Button
                        component={Link}
                        href="/bikes"
                        variant="contained"
                        color="primary"
                        startIcon={<TwoWheelerIcon />}
                        sx={{ fontWeight: 700 }}
                    >
                        Rent a Bike
                    </Button>
                </Stack>
            </Box>

            {/* Filter Tabs */}
            <Paper elevation={0} sx={{ mb: 4, border: '1px solid #E2E8F0', borderRadius: 3, bgcolor: '#FFFFFF' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ px: 2 }}
                >
                    <Tab label={`All Bookings (${stats.total_count || bookings.length})`} value="all" sx={{ fontWeight: 700 }} />
                    <Tab label={`Active & Upcoming (${stats.active_count || 0})`} value="active" sx={{ fontWeight: 700 }} />
                    <Tab label={`Completed (${stats.completed_count || 0})`} value="completed" sx={{ fontWeight: 700 }} />
                    <Tab label={`Cancelled (${stats.cancelled_count || 0})`} value="cancelled" sx={{ fontWeight: 700 }} />
                </Tabs>
            </Paper>

            {/* Empty State */}
            {filteredBookings.length === 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        py: 8,
                        px: 3,
                        textAlign: 'center',
                        border: '1px dashed #CBD5E1',
                        borderRadius: 3,
                        bgcolor: '#FFFFFF',
                    }}
                >
                    <TwoWheelerIcon sx={{ fontSize: 60, color: '#94A3B8', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        No bookings found in this view
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
                        {activeTab === 'all'
                            ? "You haven't made any bike reservations yet. Explore our Bengaluru fleet to book your next ride!"
                            : `There are no ${activeTab} bookings to display at the moment.`}
                    </Typography>
                    <Button component={Link} href="/bikes" variant="contained" color="secondary" sx={{ fontWeight: 700 }}>
                        Browse Fleet & Book
                    </Button>
                </Paper>
            )}

            {/* Bookings List */}
            {filteredBookings.length > 0 && (
                <Stack spacing={3}>
                    {filteredBookings.map((b) => {
                        const bike = b.bike || {};
                        const isElectric = bike.fuel_type === 'electric';
                        const pickupStore = b.pickup_store || {};
                        const returnStore = b.return_store || {};
                        const isOneWay = pickupStore.id !== returnStore.id;

                        return (
                            <Card
                                key={b.id}
                                sx={{
                                    borderRadius: 3,
                                    border: '1px solid #E2E8F0',
                                    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                    '&:hover': {
                                        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Grid container spacing={3} alignItems="center">
                                        {/* Vehicle Header & Thumbnail */}
                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 72,
                                                        height: 72,
                                                        borderRadius: 2.5,
                                                        bgcolor: isElectric ? '#1E3A5F' : '#0F172A',
                                                        color: '#FFFFFF',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <TwoWheelerIcon sx={{ fontSize: 40 }} />
                                                </Box>

                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748B' }}>
                                                            {b.booking_reference}
                                                        </Typography>
                                                        <Chip
                                                            label={b.status?.toUpperCase()}
                                                            color={getStatusColor(b.status)}
                                                            size="small"
                                                            sx={{ fontWeight: 700, height: 20, fontSize: '0.6875rem' }}
                                                        />
                                                    </Box>

                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                                                        {bike.brand} {bike.model_name}
                                                    </Typography>

                                                    <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        {isElectric ? <ElectricBoltIcon sx={{ fontSize: 13, color: '#F59E0B' }} /> : <LocalGasStationIcon sx={{ fontSize: 13 }} />}
                                                        {bike.registration_number} • {bike.transmission}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {/* Schedule & Stores */}
                                        <Grid item xs={12} sm={6} md={5}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                        <LocationOnIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.2 }} />
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                                                Pick-up ({b.start_date})
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {pickupStore.name || 'Bengaluru Hub'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                        <LocationOnIcon sx={{ color: '#EA580C', fontSize: 18, mt: 0.2 }} />
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                                                Drop-off {isOneWay && '(One-way)'} ({b.end_date})
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {returnStore.name || 'Bengaluru Hub'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        {/* Pricing & Actions */}
                                        <Grid item xs={12} sm={6} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                                Total Advance + Deposit
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
                                                ₹{Number(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Typography>

                                            <Button
                                                component={Link}
                                                href={`/account/bookings/${b.id}`}
                                                variant="contained"
                                                color="secondary"
                                                size="small"
                                                endIcon={<ArrowForwardIcon />}
                                                sx={{ fontWeight: 700 }}
                                            >
                                                View Trip & Docs
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </AppLayout>
    );
}

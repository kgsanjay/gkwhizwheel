import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useColorMode } from '../../theme/ColorModeContext';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Paper,
    Stack,
    Divider,
    Container,
    Avatar,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';

export default function AccountBookings({ bookings = [], serviceBookings = [], stats = {}, user = null, featuredBikes = [] }) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const [activeTab, setActiveTab] = useState('all');

    const getServiceDetails = (type) => {
        switch (type) {
            case 'taxi':
                return { label: 'Taxi & Cab', icon: <LocalTaxiIcon sx={{ fontSize: 16 }} />, color: '#38BDF8' };
            case 'boating':
                return { label: 'Backwater Boating', icon: <DirectionsBoatIcon sx={{ fontSize: 16 }} />, color: '#10B981' };
            case 'scuba':
                return { label: 'Netrani Scuba Diving', icon: <ScubaDivingIcon sx={{ fontSize: 16 }} />, color: '#06B6D4' };
            case 'homestay':
                return { label: 'Coastal Homestay', icon: <HomeWorkIcon sx={{ fontSize: 16 }} />, color: '#EC4899' };
            case 'guide':
                return { label: 'Local Travel Guide', icon: <ExploreIcon sx={{ fontSize: 16 }} />, color: '#8B5CF6' };
            case 'tours':
                return { label: 'Tour Packages', icon: <LuggageIcon sx={{ fontSize: 16 }} />, color: '#F97316' };
            default:
                return { label: 'Two-Wheeler Rental', icon: <TwoWheelerIcon sx={{ fontSize: 16 }} />, color: '#F59E0B' };
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return { label: 'CONFIRMED', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', dotColor: '#10B981' };
            case 'handed_over':
                return { label: 'RIDE IN PROGRESS', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', dotColor: '#3B82F6' };
            case 'returned':
            case 'completed':
                return { label: 'COMPLETED', bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9', color: isDark ? '#94A3B8' : '#475569', dotColor: '#10B981' };
            case 'held':
            case 'pending_payment':
                return { label: 'PENDING PAYMENT', bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', dotColor: '#F59E0B' };
            case 'cancelled':
                return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', dotColor: '#EF4444' };
            default:
                return { label: (status || 'UNKNOWN').toUpperCase(), bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', dotColor: '#94A3B8' };
        }
    };

    const activeStatuses = ['held', 'pending_payment', 'confirmed', 'handed_over'];

    const filteredBookings = bookings.filter((b) => {
        if (activeTab === 'active') return activeStatuses.includes(b.status);
        if (activeTab === 'completed') return b.status === 'returned' || b.status === 'completed';
        if (activeTab === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    const filteredServiceBookings = serviceBookings.filter((sb) => {
        if (activeTab === 'active') return sb.status === 'confirmed' || sb.status === 'in_progress';
        if (activeTab === 'completed') return sb.status === 'completed';
        if (activeTab === 'cancelled') return sb.status === 'cancelled';
        return true;
    });

    const totalCount = stats.total_count ?? (bookings.length + serviceBookings.length);
    const activeCount = stats.active_count ?? (bookings.filter((b) => activeStatuses.includes(b.status)).length + serviceBookings.filter((sb) => sb.status === 'confirmed' || sb.status === 'in_progress').length);
    const completedCount = stats.completed_count ?? (bookings.filter((b) => b.status === 'returned' || b.status === 'completed').length + serviceBookings.filter((sb) => sb.status === 'completed').length);
    const cancelledCount = stats.cancelled_count ?? (bookings.filter((b) => b.status === 'cancelled').length + serviceBookings.filter((sb) => sb.status === 'cancelled').length);

    const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

    const filterMetrics = [
        {
            id: 'all',
            label: 'All Bookings',
            count: totalCount,
            icon: <ReceiptLongIcon sx={{ fontSize: 22 }} />,
            color: '#F59E0B',
            bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
        },
        {
            id: 'active',
            label: 'Active & Upcoming',
            count: activeCount,
            icon: <TwoWheelerIcon sx={{ fontSize: 22 }} />,
            color: '#3B82F6',
            bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
        },
        {
            id: 'completed',
            label: 'Completed Trips',
            count: completedCount,
            icon: <CheckCircleOutlinedIcon sx={{ fontSize: 22 }} />,
            color: '#10B981',
            bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        },
        {
            id: 'cancelled',
            label: 'Cancelled',
            count: cancelledCount,
            icon: <CancelOutlinedIcon sx={{ fontSize: 22 }} />,
            color: '#EF4444',
            bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
        },
    ];

    return (
        <AppLayout>
            <Head title="My Rental Bookings - Customer Portal - GK WhizWheel" />

            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4.5 } }}>
                {/* Header Banner Section */}
                <Box
                    sx={{
                        mb: 3,
                        p: { xs: 2.5, sm: 3.5 },
                        borderRadius: { xs: 3, sm: 3.5 },
                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                        backdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2.5,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative subtle gradient accent top line */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3.5,
                            background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 50%, #10B981 100%)',
                        }}
                    />

                    <Box sx={{ maxWidth: 700 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                size="small"
                                label="Customer Portal"
                                sx={{
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                                    color: '#F59E0B',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    borderRadius: 1.5,
                                }}
                            />
                            <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                                Honnavar Two-Wheeler Rentals & Booking Hub
                            </Typography>
                        </Stack>

                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                mb: 0.75,
                                fontSize: { xs: '1.65rem', sm: '2rem' },
                            }}
                        >
                            My Rental Bookings
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: isDark ? '#94A3B8' : '#64748B',
                                lineHeight: 1.6,
                                fontSize: { xs: '0.875rem', sm: '0.925rem' },
                            }}
                        >
                            Track active reservations, review vehicle handovers at Palya Main Rd or Honnavar Railway Station, and access official vehicle documents.
                        </Typography>

                        {/* Authenticated Rider Profile Chip */}
                        {user && (
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    mt: 2,
                                    p: 1.2,
                                    px: 1.75,
                                    borderRadius: 2.5,
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#F8FAFC',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: '#F59E0B',
                                        color: '#0F172A',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {userInitial}
                                </Avatar>

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                            {user.name}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            icon={<VerifiedUserIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
                                            label="Verified Rider"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10B981',
                                                borderRadius: 1,
                                            }}
                                        />
                                    </Stack>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.2, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                            <EmailOutlinedIcon sx={{ fontSize: 13 }} />
                                            {user.email}
                                        </Typography>
                                        {user.phone && (
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                <PhoneIphoneIcon sx={{ fontSize: 13 }} />
                                                +91 {user.phone}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Quick CTA Actions */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                        <Button
                            component={Link}
                            href="/account/kyc"
                            variant="outlined"
                            startIcon={<ShieldIcon sx={{ color: '#10B981' }} />}
                            sx={{
                                fontWeight: 700,
                                borderRadius: 2.5,
                                py: 1,
                                px: 2,
                                color: isDark ? '#E2E8F0' : '#1E293B',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#10B981',
                                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.06)',
                                    color: '#10B981',
                                },
                            }}
                        >
                            KYC Verification
                        </Button>
                        <Button
                            component={Link}
                            href="/services/bikes"
                            variant="contained"
                            startIcon={<TwoWheelerIcon />}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 2.5,
                                py: 1,
                                px: 2.5,
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                '&:hover': {
                                    bgcolor: '#D97706',
                                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
                                },
                            }}
                        >
                            Rent a Bike
                        </Button>
                    </Stack>
                </Box>

                {/* Guest Warning if not logged in */}
                {!user && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            mb: 3,
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FCD34D',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LockOutlinedIcon sx={{ color: '#F59E0B', fontSize: 24, flexShrink: 0 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FDE68A' : '#92400E' }}>
                                    Sign in to view your personalized booking history
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#78350F' }}>
                                    You are currently viewing in guest mode. Sign in to view your active bike reservations and download legal documents.
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            component={Link}
                            href="/login"
                            variant="contained"
                            size="small"
                            sx={{
                                bgcolor: '#F59E0B',
                                color: '#0F172A',
                                fontWeight: 800,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2.5,
                                py: 0.8,
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                                '&:hover': { bgcolor: '#D97706' },
                            }}
                        >
                            Sign In Now
                        </Button>
                    </Paper>
                )}

                {/* 4 Sleek Integrated Filter Cards (Replaces bulky cards & redundant tabs) */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {filterMetrics.map((m) => {
                        const isSelected = activeTab === m.id;
                        return (
                            <Grid size={{ xs: 6, sm: 6, md: 3 }} key={m.id}>
                                <Card
                                    onClick={() => setActiveTab(m.id)}
                                    elevation={0}
                                    sx={{
                                        p: { xs: 1.75, sm: 2 },
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        bgcolor: isSelected
                                            ? isDark
                                                ? 'rgba(30, 41, 59, 0.9)'
                                                : '#FFFFFF'
                                            : isDark
                                            ? 'rgba(15, 23, 42, 0.65)'
                                            : '#F8FAFC',
                                        backdropFilter: 'blur(12px)',
                                        border: isSelected
                                            ? `1.5px solid ${m.color}`
                                            : isDark
                                            ? '1px solid rgba(255, 255, 255, 0.08)'
                                            : '1px solid #E2E8F0',
                                        boxShadow: isSelected
                                            ? `0 6px 20px ${m.color}28`
                                            : isDark
                                            ? '0 2px 8px rgba(0,0,0,0.2)'
                                            : '0 2px 6px rgba(15, 23, 42, 0.03)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: { xs: 1.25, sm: 1.75 },
                                        '&:hover': {
                                            borderColor: m.color,
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 8px 24px ${m.color}22`,
                                        },
                                    }}
                                >
                                    {/* Bottom indicator accent */}
                                    {isSelected && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: 3,
                                                bgcolor: m.color,
                                            }}
                                        />
                                    )}

                                    <Box
                                        sx={{
                                            width: { xs: 40, sm: 46 },
                                            height: { xs: 40, sm: 46 },
                                            borderRadius: 2.2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: m.bg,
                                            color: m.color,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {m.icon}
                                    </Box>

                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: { xs: '1.35rem', sm: '1.55rem' },
                                                lineHeight: 1.1,
                                                color: isDark ? '#F8FAFC' : '#0F172A',
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            {m.count}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: isSelected ? 800 : 600,
                                                fontSize: { xs: '0.75rem', sm: '0.825rem' },
                                                color: isSelected
                                                    ? isDark ? '#F8FAFC' : '#0F172A'
                                                    : isDark ? '#94A3B8' : '#64748B',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {m.label}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Filter Status Summary Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.95rem' }}>
                            {activeTab === 'all'
                                ? 'All Reservations'
                                : activeTab === 'active'
                                ? 'Active & Upcoming Trips'
                                : activeTab === 'completed'
                                ? 'Completed Trips'
                                : 'Cancelled Bookings'}
                        </Typography>
                        <Chip
                            label={`${filteredBookings.length} ${filteredBookings.length === 1 ? 'trip' : 'trips'}`}
                            size="small"
                            sx={{
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                                color: '#F59E0B',
                                borderRadius: 1.5,
                                height: 22,
                            }}
                        />
                    </Stack>

                    <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                        Need help? Call <Box component="a" href="tel:+918660989586" sx={{ color: '#F59E0B', textDecoration: 'none', fontWeight: 700 }}>+91 8660989586</Box>
                    </Typography>
                </Box>

                {/* Bookings List Cards */}
                {filteredBookings.length > 0 ? (
                    <Stack spacing={2.5}>
                        {filteredBookings.map((b) => {
                            const bike = b.bike || {};
                            const isElectric = bike.fuel_type === 'electric';
                            const pickupStore = b.pickup_store || {};
                            const returnStore = b.return_store || {};
                            const isOneWay = pickupStore.id !== returnStore.id;
                            const statusBadge = getStatusBadge(b.status);

                            return (
                                <Card
                                    key={b.id}
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3.5,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                        backdropFilter: 'blur(12px)',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 3px 12px rgba(15, 23, 42, 0.04)',
                                        transition: 'all 0.2s ease',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            borderColor: '#F59E0B',
                                            transform: 'translateY(-2px)',
                                            boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15, 23, 42, 0.08)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                        <Grid container spacing={3} alignItems="center">
                                            {/* Vehicle Info & Authentic Indian Registration Plate */}
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: { xs: 74, sm: 86 },
                                                            height: { xs: 74, sm: 86 },
                                                            borderRadius: 2.5,
                                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9',
                                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {bike.primary_image_path ? (
                                                            <Box
                                                                component="img"
                                                                src={`/storage/${bike.primary_image_path}`}
                                                                alt={bike.model_name}
                                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <TwoWheelerIcon sx={{ fontSize: 44, color: '#F59E0B' }} />
                                                        )}
                                                    </Box>

                                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontFamily: 'monospace',
                                                                    fontWeight: 800,
                                                                    color: isDark ? '#94A3B8' : '#64748B',
                                                                    fontSize: '0.8rem',
                                                                    letterSpacing: '0.04em',
                                                                }}
                                                            >
                                                                #{b.booking_reference}
                                                            </Typography>
                                                            <Chip
                                                                label={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusBadge.dotColor }} />
                                                                        <span>{statusBadge.label}</span>
                                                                    </Box>
                                                                }
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: statusBadge.bg,
                                                                    color: statusBadge.color,
                                                                    fontWeight: 800,
                                                                    height: 22,
                                                                    fontSize: '0.68rem',
                                                                    borderRadius: 1.5,
                                                                }}
                                                            />
                                                        </Stack>

                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight: 900,
                                                                color: isDark ? '#F8FAFC' : '#0F172A',
                                                                lineHeight: 1.25,
                                                                fontSize: '1.1rem',
                                                            }}
                                                        >
                                                            {bike.brand} {bike.model_name}
                                                        </Typography>

                                                        {/* Karnataka / Indian Vehicle Number Plate Styling */}
                                                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                                                            <Box
                                                                sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    borderRadius: 1,
                                                                    overflow: 'hidden',
                                                                    border: '1.5px solid #0F172A',
                                                                    bgcolor: '#FFFFFF',
                                                                    color: '#0F172A',
                                                                    fontFamily: 'monospace',
                                                                    fontWeight: 900,
                                                                    fontSize: '0.74rem',
                                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                                                }}
                                                            >
                                                                <Box sx={{ bgcolor: '#1E3A8A', color: '#FFFFFF', px: 0.6, py: 0.2, fontSize: '0.6rem', fontWeight: 900 }}>
                                                                    IND
                                                                </Box>
                                                                <Box sx={{ px: 0.85, py: 0.2, letterSpacing: '0.05em' }}>
                                                                    {bike.registration_number || 'KA 47 REG'}
                                                                </Box>
                                                            </Box>

                                                            <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#CBD5E1' }}>•</Typography>

                                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                                {isElectric ? (
                                                                    <ElectricBoltIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                                                                ) : (
                                                                    <LocalGasStationIcon sx={{ fontSize: 13, color: '#64748B' }} />
                                                                )}
                                                                {bike.transmission || 'Automatic'}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Schedule & Pick / Drop Hubs */}
                                            <Grid size={{ xs: 12, sm: 7, md: 5 }}>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2.5,
                                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                                                    }}
                                                >
                                                    <Grid container spacing={1.5}>
                                                        <Grid size={{ xs: 6 }}>
                                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                <LocationOnIcon sx={{ color: '#10B981', fontSize: 18, mt: 0.2 }} />
                                                                <Box>
                                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                                                                        Pickup Hub
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem' }}>
                                                                        {pickupStore.name || 'Honnavar Hub'}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
                                                                        <CalendarMonthIcon sx={{ fontSize: 12 }} />
                                                                        {b.start_date}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Grid>

                                                        <Grid size={{ xs: 6 }}>
                                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18, mt: 0.2 }} />
                                                                <Box>
                                                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                                                                        Drop-off {isOneWay ? '(One-way)' : 'Hub'}
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem' }}>
                                                                        {returnStore.name || 'Honnavar Hub'}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
                                                                        <CalendarMonthIcon sx={{ fontSize: 12 }} />
                                                                        {b.end_date}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </Grid>

                                            {/* Price & Action Button */}
                                            <Grid size={{ xs: 12, sm: 5, md: 3 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    Advance + Deposit
                                                </Typography>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        fontWeight: 900,
                                                        color: '#F59E0B',
                                                        fontSize: '1.4rem',
                                                        mb: 1.25,
                                                    }}
                                                >
                                                    ₹{Number(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Typography>

                                                <Stack direction="column" spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                                                    <Button
                                                        component={Link}
                                                        href={`/account/bookings/${b.id}`}
                                                        variant="contained"
                                                        size="small"
                                                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                                        sx={{
                                                            fontWeight: 800,
                                                            borderRadius: 2,
                                                            px: 2.2,
                                                            py: 0.85,
                                                            bgcolor: '#F59E0B',
                                                            color: '#0F172A',
                                                            textTransform: 'none',
                                                            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                                                            '&:hover': {
                                                                bgcolor: '#D97706',
                                                            },
                                                        }}
                                                    >
                                                        View Trip & Docs
                                                    </Button>
                                                    <Stack direction="row" spacing={0.8}>
                                                        <Button
                                                            component="a"
                                                            href={`/bookings/${b.id}/print`}
                                                            target="_blank"
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<PrintIcon sx={{ fontSize: 13 }} />}
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                textTransform: 'none',
                                                                borderRadius: 1.5,
                                                                py: 0.3,
                                                                px: 1,
                                                                color: isDark ? '#CBD5E1' : '#475569',
                                                                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                                            }}
                                                        >
                                                            Print
                                                        </Button>
                                                        <Button
                                                            component="a"
                                                            href={`/bookings/${b.id}/voucher`}
                                                            target="_blank"
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                textTransform: 'none',
                                                                borderRadius: 1.5,
                                                                py: 0.3,
                                                                px: 1,
                                                                color: isDark ? '#CBD5E1' : '#475569',
                                                                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                                            }}
                                                        >
                                                            PDF Pass
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                ) : (
                    /* Empty State when zero bookings in active filter */
                    <Paper
                        elevation={0}
                        sx={{
                            py: { xs: 5, sm: 6 },
                            px: 3,
                            textAlign: 'center',
                            border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #CBD5E1',
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF',
                            backdropFilter: 'blur(12px)',
                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(15, 23, 42, 0.03)',
                            mb: 4,
                        }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                mx: 'auto',
                                mb: 2,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
                            }}
                        >
                            <TwoWheelerIcon sx={{ fontSize: 36, color: '#F59E0B' }} />
                        </Box>

                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 900,
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                mb: 1,
                            }}
                        >
                            {activeTab === 'all'
                                ? 'No bookings found in your account yet'
                                : `No ${activeTab} reservations found`}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                maxWidth: 520,
                                mx: 'auto',
                                mb: 3,
                                color: isDark ? '#94A3B8' : '#64748B',
                                lineHeight: 1.6,
                            }}
                        >
                            {activeTab === 'all'
                                ? 'Ready to explore Honnavar Backwaters, Eco Beach, and Apsarakonda? Reserve your verified two-wheeler today with instant online confirmation!'
                                : `You currently have no bookings matching the "${activeTab}" filter. Switch back to "All Bookings" to view your trip records.`}
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
                            <Button
                                component={Link}
                                href="/services/bikes"
                                variant="contained"
                                startIcon={<TwoWheelerIcon />}
                                sx={{
                                    py: 1.2,
                                    px: 3,
                                    fontWeight: 800,
                                    borderRadius: 2.5,
                                    bgcolor: '#F59E0B',
                                    color: '#0F172A',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                    '&:hover': {
                                        bgcolor: '#D97706',
                                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
                                    },
                                }}
                            >
                                Browse Fleet & Rent a Bike
                            </Button>

                            <Button
                                component="a"
                                href="https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20am%20looking%20to%20book%20a%20bike%20in%20Honnavar."
                                target="_blank"
                                rel="noreferrer"
                                variant="outlined"
                                startIcon={<WhatsAppIcon sx={{ color: '#22C55E' }} />}
                                sx={{
                                    py: 1.2,
                                    px: 2.5,
                                    fontWeight: 700,
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    color: isDark ? '#F8FAFC' : '#0F172A',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                                    '&:hover': {
                                        borderColor: '#22C55E',
                                        bgcolor: 'rgba(34, 197, 94, 0.08)',
                                    },
                                }}
                            >
                                WhatsApp Booking Support
                            </Button>
                        </Stack>

                        {/* Customer Trust Highlights */}
                        <Divider sx={{ my: 3.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0', maxWidth: 600, mx: 'auto' }} />

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={3}
                            justifyContent="center"
                            alignItems="center"
                            sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <VerifiedUserIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                    Zero Security Deposit Option
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TwoWheelerIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                    2 Sanitized Helmets Free
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <ShieldIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                    24/7 Roadside Assistance
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                )}

                {/* Other Travel Services Section (Taxis, Boating, Scuba, Stays, Guides, Tours) */}
                {filteredServiceBookings && filteredServiceBookings.length > 0 && (
                    <Box sx={{ mt: 5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 900,
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                        fontSize: '1.25rem',
                                    }}
                                >
                                    My Service Bookings {activeTab !== 'all' && `(${filteredServiceBookings.length})`}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                    Cab rides, boat cruises, scuba dives, homestays, and tour packages
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/services"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    fontWeight: 700,
                                    color: '#F59E0B',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Browse All Services
                            </Button>
                        </Box>

                        <Stack spacing={2}>
                            {filteredServiceBookings.map((sb) => {
                                const svc = getServiceDetails(sb.service_type);
                                const item = sb.service_item || {};
                                return (
                                    <Card
                                        key={sb.id}
                                        elevation={0}
                                        sx={{
                                            p: { xs: 2, sm: 2.5 },
                                            borderRadius: 3,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.2)' : '0 2px 8px rgba(15, 23, 42, 0.03)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: svc.color,
                                            },
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid size={{ xs: 12, md: 5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                    <Chip
                                                        icon={svc.icon}
                                                        label={svc.label}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem',
                                                            bgcolor: `${svc.color}22`,
                                                            color: svc.color,
                                                        }}
                                                    />
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                        {sb.booking_number}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', mb: 0.5 }}>
                                                    {item.name || `${svc.label} Reservation`}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocationOnIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                                    {sb.pickup_location || 'Honnavar'}
                                                </Typography>
                                                {sb.customer_notes && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            color: isDark ? '#94A3B8' : '#64748B',
                                                            mt: 0.8,
                                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                                            p: 0.8,
                                                            borderRadius: 1,
                                                            lineHeight: 1.4,
                                                        }}
                                                    >
                                                        {sb.customer_notes.replace(/\n/g, ' • ')}
                                                    </Typography>
                                                )}
                                                {sb.coordinator && (
                                                    <Box sx={{ mt: 1, p: 0.8, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#E2E8F0' : '#1E293B', fontSize: '0.72rem' }}>
                                                                Desk: {sb.coordinator.name} ({sb.coordinator.phone})
                                                            </Typography>
                                                        </Box>
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            startIcon={<WhatsAppIcon sx={{ fontSize: '13px !important', color: '#22C55E' }} />}
                                                            component="a"
                                                            href={`https://wa.me/${sb.coordinator.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi GK WhizWheels, I am inquiring about my booking #${sb.booking_number}.`)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0, px: 0.8, minWidth: 'auto', color: '#22C55E', fontWeight: 700 }}
                                                        >
                                                            WhatsApp
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Travel Date & Time
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A', mb: 0.5 }}>
                                                    {new Date(sb.start_datetime).toLocaleDateString('en-IN', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        label={(sb.status || 'confirmed').toUpperCase()}
                                                        size="small"
                                                        color={sb.status === 'confirmed' ? 'success' : sb.status === 'in_progress' ? 'info' : 'default'}
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                                                    />
                                                    <Chip
                                                        label={
                                                            sb.payment_status === 'paid' || parseFloat(sb.balance_due || 0) <= 0
                                                                ? 'PAID'
                                                                : parseFloat(sb.advance_paid || 0) > 0
                                                                ? `BAL: ₹${parseFloat(sb.balance_due)}`
                                                                : 'PAY ON ARRIVAL'
                                                        }
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.68rem',
                                                            fontWeight: 800,
                                                            bgcolor:
                                                                sb.payment_status === 'paid' || parseFloat(sb.balance_due || 0) <= 0
                                                                    ? 'rgba(16, 185, 129, 0.15)'
                                                                    : 'rgba(245, 158, 11, 0.15)',
                                                            color:
                                                                sb.payment_status === 'paid' || parseFloat(sb.balance_due || 0) <= 0
                                                                    ? '#10B981'
                                                                    : '#F59E0B',
                                                        }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {sb.quantity > 1 ? `${sb.quantity} Units / Persons` : '1 Unit'}
                                                    </Typography>
                                                </Stack>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Total / Payable
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#F59E0B', mb: 0.5 }}>
                                                    ₹{Number(sb.total_amount).toLocaleString('en-IN')}
                                                </Typography>
                                                {parseFloat(sb.balance_due || 0) > 0 && (
                                                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, display: 'block', mb: 1 }}>
                                                        Pending: ₹{parseFloat(sb.balance_due).toLocaleString('en-IN')}
                                                    </Typography>
                                                )}
                                                <Stack direction="row" spacing={0.8} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} flexWrap="wrap">
                                                    {parseFloat(sb.balance_due || 0) > 0 ? (
                                                        <Button
                                                            component={Link}
                                                            href={`/services/bookings/${sb.booking_number}/confirmation`}
                                                            variant="contained"
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                borderRadius: 2,
                                                                textTransform: 'none',
                                                                fontSize: '0.72rem',
                                                                bgcolor: '#F59E0B',
                                                                color: '#0F172A',
                                                                '&:hover': { bgcolor: '#D97706' },
                                                            }}
                                                        >
                                                            Pay Balance
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            component="a"
                                                            href={`/services/bookings/${sb.booking_number}/print`}
                                                            target="_blank"
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<PrintIcon sx={{ fontSize: 13 }} />}
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                textTransform: 'none',
                                                                borderRadius: 1.5,
                                                                py: 0.3,
                                                                px: 1,
                                                                color: isDark ? '#CBD5E1' : '#475569',
                                                                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                                                            }}
                                                        >
                                                            Print
                                                        </Button>
                                                    )}
                                                    <Button
                                                        component="a"
                                                        href={`/services/bookings/${sb.booking_number}/voucher`}
                                                        target="_blank"
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            textTransform: 'none',
                                                            borderRadius: 1.5,
                                                            py: 0.3,
                                                            px: 1,
                                                            bgcolor: '#0F172A',
                                                            color: '#FFF',
                                                            '&:hover': { bgcolor: '#1E293B' },
                                                        }}
                                                    >
                                                        PDF Pass
                                                    </Button>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Card>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* Popular Fleet Recommendations Section */}
                {featuredBikes && featuredBikes.length > 0 && (
                    <Box sx={{ mt: 5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 900,
                                        color: isDark ? '#F8FAFC' : '#0F172A',
                                        fontSize: '1.25rem',
                                    }}
                                >
                                    Popular Fleet in Honnavar
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                    Top-rated scooters and bikes available for immediate handover
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/services/bikes"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    fontWeight: 700,
                                    color: '#F59E0B',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                }}
                            >
                                View All Fleet
                            </Button>
                        </Box>

                        <Grid container spacing={2.5}>
                            {featuredBikes.map((fb) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fb.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.2)' : '0 2px 8px rgba(15, 23, 42, 0.03)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            height: '100%',
                                            '&:hover': {
                                                borderColor: '#F59E0B',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        <Box>
                                            <Box
                                                sx={{
                                                    height: 140,
                                                    borderRadius: 2,
                                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F1F5F9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 1.5,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {fb.primary_image_path ? (
                                                    <Box
                                                        component="img"
                                                        src={`/storage/${fb.primary_image_path}`}
                                                        alt={fb.model_name}
                                                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <TwoWheelerIcon sx={{ fontSize: 56, color: '#F59E0B' }} />
                                                )}
                                            </Box>

                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
                                                {fb.brand} {fb.model_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                                {fb.category?.name || 'Commuter'} • {fb.transmission || 'Automatic'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.7rem' }}>
                                                    Daily Rental Rate
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                                                    ₹{fb.base_daily_rate_override || fb.price_per_day || '350'}<Typography component="span" variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>/day</Typography>
                                                </Typography>
                                            </Box>
                                            <Button
                                                component={Link}
                                                href={`/bikes/${fb.id}`}
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    bgcolor: '#F59E0B',
                                                    color: '#0F172A',
                                                    fontWeight: 800,
                                                    borderRadius: 1.5,
                                                    textTransform: 'none',
                                                    px: 2,
                                                    '&:hover': { bgcolor: '#D97706' },
                                                }}
                                            >
                                                Book Now
                                            </Button>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>
        </AppLayout>
    );
}

import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useTheme } from '@mui/material/styles';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    Divider,
    IconButton,
    Tooltip,
    LinearProgress,
    Avatar,
    Tabs,
    Tab,
    Menu,
    MenuItem,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import SwapHorizontalCircleIcon from '@mui/icons-material/SwapHorizontalCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import StoreIcon from '@mui/icons-material/Store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import PoolIcon from '@mui/icons-material/Pool';
import HotelIcon from '@mui/icons-material/Hotel';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export default function AdminDashboard({
    metrics = {},
    service_metrics = [],
    recent_service_bookings = [],
    assigned_services = [],
    recent_bookings = [],
    current_store = null,
    stores = [],
}) {
    const { auth } = usePage().props;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const user = auth?.user;
    const userRole = user?.role || 'staff';
    const isSuperAdmin = userRole === 'super_admin';
    const isStoreManager = userRole === 'store_manager';

    const [activeTab, setActiveTab] = useState(0); // 0: Integrated Pipeline, 1: Bike Fleet, 2: Travel Services
    const [statusFilter, setStatusFilter] = useState('all');
    const [copiedRef, setCopiedRef] = useState(null);
    const [storeAnchorEl, setStoreAnchorEl] = useState(null);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(text);
        setTimeout(() => setCopiedRef(null), 2000);
    };

    const getServiceIcon = (type) => {
        switch (type) {
            case 'taxi': return <DirectionsCarIcon sx={{ fontSize: 18 }} />;
            case 'boating': return <DirectionsBoatIcon sx={{ fontSize: 18 }} />;
            case 'scuba': return <PoolIcon sx={{ fontSize: 18 }} />;
            case 'homestay': return <HotelIcon sx={{ fontSize: 18 }} />;
            case 'guide': return <PersonPinIcon sx={{ fontSize: 18 }} />;
            case 'tours': return <ExploreIcon sx={{ fontSize: 18 }} />;
            default: return <TwoWheelerIcon sx={{ fontSize: 18 }} />;
        }
    };

    const getServiceMeta = (type) => {
        switch (type) {
            case 'two_wheelers': return { label: 'Two Wheelers', color: '#0284C7', bg: isDark ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE', border: isDark ? 'rgba(2, 132, 199, 0.35)' : '#BAE6FD' };
            case 'taxi': return { label: 'Cab & Taxi', color: '#D97706', bg: isDark ? 'rgba(217, 119, 6, 0.16)' : '#FEF3C7', border: isDark ? 'rgba(217, 119, 6, 0.35)' : '#FDE68A' };
            case 'boating': return { label: 'Boating', color: '#0284C7', bg: isDark ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE', border: isDark ? 'rgba(2, 132, 199, 0.35)' : '#BAE6FD' };
            case 'scuba': return { label: 'Scuba Diving', color: '#0D9488', bg: isDark ? 'rgba(13, 148, 136, 0.16)' : '#CCFBF1', border: isDark ? 'rgba(13, 148, 136, 0.35)' : '#99F6E4' };
            case 'homestay': return { label: 'Homestay', color: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE', border: isDark ? 'rgba(139, 92, 246, 0.35)' : '#DDD6FE' };
            case 'guide': return { label: 'Tour Guide', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5', border: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0' };
            case 'tours': return { label: 'Tour Package', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFEDD5', border: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FED7AA' };
            default: return { label: 'Two Wheeler', color: '#38BDF8', bg: isDark ? 'rgba(56, 189, 248, 0.16)' : '#DBEAFE', border: isDark ? 'rgba(56, 189, 248, 0.35)' : '#BFDBFE' };
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#EFF6FF', border: '1px solid', borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#BFDBFE', color: isDark ? '#7DD3FC' : '#1D4ED8', fontSize: '0.72rem', fontWeight: 700 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: isDark ? '#38BDF8' : '#2563EB' }} />
                        Confirmed
                    </Box>
                );
            case 'handed_over':
            case 'in_progress':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5', border: '1px solid', borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0', color: isDark ? '#6EE7B7' : '#047857', fontSize: '0.72rem', fontWeight: 700 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: 'success.main', animation: 'pulse 1.8s infinite' }} />
                        Active / On Trip
                    </Box>
                );
            case 'returned':
            case 'completed':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F8FAFC', border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0', color: isDark ? '#94A3B8' : '#475569', fontSize: '0.72rem', fontWeight: 700 }}>
                        <CheckCircleIcon sx={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }} />
                        Completed
                    </Box>
                );
            case 'pending':
            case 'held':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FFFBEB', border: '1px solid', borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A', color: isDark ? '#FCD34D' : '#B45309', fontSize: '0.72rem', fontWeight: 700 }}>
                        <AccessTimeIcon sx={{ fontSize: 10, color: 'warning.main' }} />
                        Pending Hold
                    </Box>
                );
            case 'cancelled':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEF2F2', border: '1px solid', borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA', color: isDark ? '#FCA5A5' : '#B91C1C', fontSize: '0.72rem', fontWeight: 700 }}>
                        Cancelled
                    </Box>
                );
            default:
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', border: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.72rem', fontWeight: 700 }}>
                        {status}
                    </Box>
                );
        }
    };

    // Calculate aggregated metrics
    const totalServiceActive = service_metrics.reduce((acc, curr) => acc + (curr.active_bookings || 0), 0);
    const totalTripsActive = (metrics.active_rentals || 0) + totalServiceActive;
    const fleetPercent = metrics.fleet_total > 0
        ? Math.round((metrics.fleet_available / metrics.fleet_total) * 100)
        : 0;

    const totalServiceMonthRevenue = service_metrics.reduce((acc, curr) => acc + (curr.month_revenue || 0), 0);
    const combinedMonthRevenue = (metrics.month_revenue || 0) + totalServiceMonthRevenue;

    // Filter recent service bookings
    const filteredServiceBookings = useMemo(() => {
        if (statusFilter === 'all') return recent_service_bookings;
        return recent_service_bookings.filter(b => b.status === statusFilter);
    }, [recent_service_bookings, statusFilter]);

    // Filter recent bike bookings
    const filteredBikeBookings = useMemo(() => {
        if (statusFilter === 'all') return recent_bookings;
        return recent_bookings.filter(b => b.status === statusFilter);
    }, [recent_bookings, statusFilter]);

    return (
        <AdminLayout title="Operational Dashboard" currentStore={current_store}>
            <Head title="Operations Console - GK WhizWheels" />

            {/* Top Toolbar / Ops Header */}
            <Box
                sx={{
                    mb: 3,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { md: 'center' },
                    gap: 2,
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                            Operations Console
                        </Typography>
                        <Chip
                            label="PRO HUB"
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#0F172A',
                                color: isDark ? '#FBBF24' : '#FFFFFF',
                                border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : 'none',
                                borderRadius: 1,
                                letterSpacing: '0.04em',
                            }}
                        />
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.25, borderRadius: 10, bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', border: '1px solid', borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>
                                Cluster Healthy · 7 Services Active
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {isSuperAdmin
                            ? 'All-store system overview and operational metrics across Karnataka hubs.'
                            : `Operational console for ${current_store?.name || 'Assigned Hub'}.`}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    {/* Store Hub Switcher if multiple */}
                    {stores.length > 1 && isSuperAdmin && (
                        <>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => setStoreAnchorEl(e.currentTarget)}
                                endIcon={<KeyboardArrowDownIcon />}
                                startIcon={<StoreIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: 'text.primary',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    fontSize: '0.8rem',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                }}
                            >
                                {current_store ? current_store.name : 'All Hubs & Stores'}
                            </Button>
                            <Menu
                                anchorEl={storeAnchorEl}
                                open={Boolean(storeAnchorEl)}
                                onClose={() => setStoreAnchorEl(null)}
                                PaperProps={{ sx: { borderRadius: 2, mt: 0.5, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' } }}
                            >
                                <MenuItem
                                    onClick={() => {
                                        setStoreAnchorEl(null);
                                        router.get('/admin/dashboard');
                                    }}
                                    selected={!current_store}
                                    sx={{ fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    All Hubs & Stores
                                </MenuItem>
                                <Divider />
                                {stores.map((s) => (
                                    <MenuItem
                                        key={s.id}
                                        onClick={() => {
                                            setStoreAnchorEl(null);
                                            router.get(`/admin/dashboard?store_id=${s.id}`);
                                        }}
                                        selected={current_store?.id === s.id}
                                        sx={{ fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        {s.name} ({s.city})
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    )}

                    <Button
                        component={Link}
                        href="/admin/check-in"
                        variant="outlined"
                        size="small"
                        startIcon={<QrCodeScannerIcon />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            py: 0.8,
                            color: isDark ? '#34D399' : '#059669',
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                            '&:hover': {
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5',
                                borderColor: 'success.main',
                            },
                            fontSize: '0.82rem',
                        }}
                    >
                        Ground Scanner
                    </Button>

                    <Button
                        component={Link}
                        href="/admin/services/bookings/create"
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            py: 0.8,
                            bgcolor: isDark ? '#F59E0B' : '#0F172A',
                            color: isDark ? '#0F172A' : '#FFFFFF',
                            '&:hover': { bgcolor: isDark ? '#D97706' : '#1E293B' },
                            fontSize: '0.82rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                    >
                        + Walk-In Booking
                    </Button>
                </Stack>
            </Box>

            {/* High-Density KPI Metrics Deck */}
            <Grid container spacing={2} sx={{ mb: 3.5 }}>
                {/* 1. Active Rentals / Trips */}
                <Grid size={{ xs: 12, sm: 6, md: isSuperAdmin || isStoreManager ? 2.4 : 3 }}>
                    <Card
                        sx={{
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                        }}
                    >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Active Trips / On Road
                                </Typography>
                                <Box sx={{ p: 0.6, bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF', color: isDark ? '#60A5FA' : '#2563EB', borderRadius: 1.5, display: 'flex' }}>
                                    <TwoWheelerIcon sx={{ fontSize: 16 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.03em' }}>
                                {totalTripsActive}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#34D399' : '#10B981', fontWeight: 600 }}>
                                    ● {metrics.active_rentals ?? 0} Bikes · {totalServiceActive} Services
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 2. Today's Pickups / Launches */}
                <Grid size={{ xs: 12, sm: 6, md: isSuperAdmin || isStoreManager ? 2.4 : 3 }}>
                    <Card
                        sx={{
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                        }}
                    >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pickups Due Today
                                </Typography>
                                <Box sx={{ p: 0.6, bgcolor: isDark ? 'rgba(245,158,11,0.18)' : '#FFFBEB', color: isDark ? '#FBBF24' : '#D97706', borderRadius: 1.5, display: 'flex' }}>
                                    <SwapHorizontalCircleIcon sx={{ fontSize: 16 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.03em' }}>
                                {metrics.pending_handovers ?? 0}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#FBBF24' : '#D97706', fontWeight: 600, mt: 1 }}>
                                Awaiting key handover
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 3. Today's Returns / Check-Ins */}
                <Grid size={{ xs: 12, sm: 6, md: isSuperAdmin || isStoreManager ? 2.4 : 3 }}>
                    <Card
                        sx={{
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                        }}
                    >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Returns Due Today
                                </Typography>
                                <Box sx={{ p: 0.6, bgcolor: isDark ? 'rgba(16,185,129,0.18)' : '#F0FDF4', color: isDark ? '#34D399' : '#16A34A', borderRadius: 1.5, display: 'flex' }}>
                                    <AssignmentTurnedInIcon sx={{ fontSize: 16 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.03em' }}>
                                {metrics.expected_returns ?? 0}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#34D399' : '#16A34A', fontWeight: 600, mt: 1 }}>
                                Scheduled for check-in
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 4. Fleet Availability Gauge */}
                <Grid size={{ xs: 12, sm: 6, md: isSuperAdmin || isStoreManager ? 2.4 : 3 }}>
                    <Card
                        sx={{
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                        }}
                    >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Available Fleet
                                </Typography>
                                <Box sx={{ p: 0.6, bgcolor: isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5', color: isDark ? '#34D399' : '#059669', borderRadius: 1.5, display: 'flex' }}>
                                    <ElectricBoltIcon sx={{ fontSize: 16 }} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.03em' }}>
                                    {metrics.fleet_available ?? 0}
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 600 }}>
                                    / {metrics.fleet_total ?? 0} total ({fleetPercent}%)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.6, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#34D399' : '#059669', fontWeight: 700 }}>
                                    ● {metrics.fleet_available ?? 0} Avail
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#60A5FA' : '#2563EB', fontWeight: 600 }}>
                                    · {metrics.fleet_booked ?? 0} On Rent
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#F87171' : '#DC2626', fontWeight: 600 }}>
                                    · {metrics.fleet_maintenance ?? 0} Maint
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 1.2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={fleetPercent}
                                    sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            bgcolor: fleetPercent > 30 ? '#10B981' : '#EF4444',
                                        },
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 5. Month Revenue Processed */}
                {(isSuperAdmin || isStoreManager) && (
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card
                            sx={{
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                transition: 'all 0.15s ease',
                                '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                            }}
                        >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Month Revenue
                                    </Typography>
                                    <Box sx={{ p: 0.6, bgcolor: isDark ? 'rgba(16,185,129,0.18)' : '#ECFDF5', color: isDark ? '#34D399' : '#059669', borderRadius: 1.5, display: 'flex' }}>
                                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                                    ₹{Number(combinedMonthRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#34D399' : '#059669', fontWeight: 600, mt: 1 }}>
                                    Bikes: ₹{Number(metrics.month_revenue || 0).toLocaleString('en-IN')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* 7 Multi-Service Summary & Operations Deck */}
            {service_metrics.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Multi-Service Operations & Fleet Capacity
                            </Typography>
                            <Chip
                                label={`${service_metrics.length} Service Lines Active`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', color: 'text.secondary' }}
                            />
                        </Box>
                        <Button
                            component={Link}
                            href="/admin/services/bookings"
                            size="small"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: isDark ? '#60A5FA' : '#2563EB' }}
                        >
                            All Service Bookings
                        </Button>
                    </Box>

                    <Grid container spacing={2}>
                        {service_metrics.map((sm) => {
                            const meta = getServiceMeta(sm.type);
                            const isTwoWheeler = sm.type === 'two_wheelers';
                            const availPct = sm.items_count > 0
                                ? Math.round(((sm.available_items ?? 0) / sm.items_count) * 100)
                                : 0;

                            const walkInUrl = isTwoWheeler
                                ? '/admin/bookings/create'
                                : `/admin/services/${sm.type}/bookings/create`;
                            const bookingsUrl = isTwoWheeler
                                ? '/admin/bookings'
                                : `/admin/services/${sm.type}/bookings`;
                            const itemsUrl = isTwoWheeler
                                ? '/admin/bikes'
                                : `/admin/services/${sm.type}/items`;

                            return (
                                <Grid key={sm.type} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                    <Card
                                        sx={{
                                            borderRadius: 2.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                            transition: 'all 0.15s ease',
                                            '&:hover': { borderColor: meta.color, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%',
                                        }}
                                    >
                                        <Box sx={{ height: 3, bgcolor: meta.color }} />
                                        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            {/* Header: Service Name & Availability Pill */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ p: 0.6, bgcolor: meta.bg, color: meta.color, borderRadius: 1.5, display: 'flex' }}>
                                                        {getServiceIcon(sm.type)}
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                                                        {sm.label}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={`${sm.available_items ?? 0}/${sm.items_count ?? 0} Avail`}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.68rem',
                                                        fontWeight: 700,
                                                        bgcolor: (sm.available_items ?? 0) > 0
                                                            ? (isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5')
                                                            : (isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2'),
                                                        color: (sm.available_items ?? 0) > 0
                                                            ? (isDark ? '#34D399' : '#059669')
                                                            : (isDark ? '#F87171' : '#DC2626'),
                                                        border: '1px solid',
                                                        borderColor: (sm.available_items ?? 0) > 0
                                                            ? (isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0')
                                                            : (isDark ? 'rgba(239,68,68,0.3)' : '#FECACA'),
                                                    }}
                                                />
                                            </Box>

                                            {/* 3 Core Summary Stats: Available Items, Active Bookings, Today's Check-ins */}
                                            <Grid container spacing={1} sx={{ mb: 1.5 }}>
                                                {/* 1. Available Items */}
                                                <Grid size={{ xs: 4 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 2,
                                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                            Available
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 900, color: (sm.available_items ?? 0) > 0 ? (isDark ? '#34D399' : '#059669') : 'text.disabled', lineHeight: 1.2, my: 0.3 }}>
                                                            {sm.available_items ?? 0}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontWeight: 600 }}>
                                                            / {sm.items_count ?? 0} items
                                                        </Typography>
                                                    </Box>
                                                </Grid>

                                                {/* 2. Active Bookings */}
                                                <Grid size={{ xs: 4 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 2,
                                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                            Active
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 900, color: (sm.active_bookings ?? 0) > 0 ? (isDark ? '#60A5FA' : '#2563EB') : 'text.disabled', lineHeight: 1.2, my: 0.3 }}>
                                                            {sm.active_bookings ?? 0}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontWeight: 600 }}>
                                                            on trip/run
                                                        </Typography>
                                                    </Box>
                                                </Grid>

                                                {/* 3. Today's Service Check-ins */}
                                                <Grid size={{ xs: 4 }}>
                                                    <Box
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 2,
                                                            bgcolor: (sm.today_check_ins ?? 0) > 0
                                                                ? (isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB')
                                                                : (isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
                                                            border: '1px solid',
                                                            borderColor: (sm.today_check_ins ?? 0) > 0
                                                                ? (isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A')
                                                                : 'divider',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: (sm.today_check_ins ?? 0) > 0 ? (isDark ? '#FBBF24' : '#D97706') : 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                            Today's In
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 900, color: (sm.today_check_ins ?? 0) > 0 ? (isDark ? '#FBBF24' : '#D97706') : 'text.disabled', lineHeight: 1.2, my: 0.3 }}>
                                                            {sm.today_check_ins ?? 0}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: (sm.today_check_ins ?? 0) > 0 ? (isDark ? '#FBBF24' : '#D97706') : 'text.disabled', fontWeight: 600 }}>
                                                            check-ins
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            {/* Capacity Utilization Progress Bar */}
                                            <Box sx={{ mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600 }}>
                                                        Capacity Ready
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: availPct > 30 ? (isDark ? '#34D399' : '#059669') : '#EF4444' }}>
                                                        {availPct}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={availPct}
                                                    sx={{
                                                        height: 5,
                                                        borderRadius: 2.5,
                                                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                                        '& .MuiLinearProgress-bar': {
                                                            borderRadius: 2.5,
                                                            bgcolor: availPct > 30 ? meta.color : '#EF4444',
                                                        },
                                                    }}
                                                />
                                            </Box>

                                            {/* Detailed Fleet Status & Revenue Row */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
                                                    ● {sm.booked_items || 0} Booked · {sm.maintenance_items || 0} Maint
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? '#34D399' : '#059669' }}>
                                                    ₹{Number(sm.month_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ my: 0.5 }} />

                                            {/* Action Buttons */}
                                            <Stack direction="row" spacing={0.8} sx={{ mt: 'auto', pt: 1.2 }}>
                                                <Button
                                                    component={Link}
                                                    href={walkInUrl}
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        borderRadius: 1.5,
                                                        fontSize: '0.72rem',
                                                        py: 0.4,
                                                        px: 1,
                                                        flexGrow: 1,
                                                        bgcolor: isDark ? '#2563EB' : '#0F172A',
                                                        color: 'common.white',
                                                        '&:hover': { bgcolor: isDark ? '#1D4ED8' : '#1E293B' },
                                                    }}
                                                >
                                                    + Walk-In
                                                </Button>
                                                <Button
                                                    component={Link}
                                                    href={bookingsUrl}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        borderRadius: 1.5,
                                                        fontSize: '0.72rem',
                                                        py: 0.4,
                                                        px: 1,
                                                        color: 'text.primary',
                                                        borderColor: 'divider',
                                                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' },
                                                    }}
                                                >
                                                    Bookings
                                                </Button>
                                                <Button
                                                    component={Link}
                                                    href={itemsUrl}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        borderRadius: 1.5,
                                                        fontSize: '0.72rem',
                                                        py: 0.4,
                                                        px: 1,
                                                        color: 'text.primary',
                                                        borderColor: 'divider',
                                                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' },
                                                    }}
                                                >
                                                    Items
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            )}

            {/* Operations Live Stream Section (Tabbed Segmented Control) */}
            <Paper
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    bgcolor: 'background.paper',
                }}
            >
                {/* Deck Controls Header */}
                <Box
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { md: 'center' },
                        gap: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, val) => setActiveTab(val)}
                            sx={{
                                minHeight: 36,
                                '& .MuiTab-root': {
                                    minHeight: 36,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    px: 2,
                                    borderRadius: 2,
                                    color: 'text.secondary',
                                    '&.Mui-selected': {
                                        color: 'text.primary',
                                        bgcolor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
                                    },
                                },
                                '& .MuiTabs-indicator': { display: 'none' },
                            }}
                        >
                            <Tab label={`⚡ All Services Pipeline (${recent_service_bookings.length})`} />
                            <Tab label={`🛵 Bike Fleet Rentals (${recent_bookings.length})`} />
                        </Tabs>
                    </Box>

                    {/* Quick Filter Pills */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.disabled' }}>
                            Status:
                        </Typography>
                        {['all', 'confirmed', 'in_progress', 'returned', 'completed'].map((st) => (
                            <Chip
                                key={st}
                                label={st === 'all' ? 'All' : st.replace('_', ' ')}
                                size="small"
                                onClick={() => setStatusFilter(st)}
                                sx={{
                                    height: 24,
                                    fontSize: '0.72rem',
                                    fontWeight: statusFilter === st ? 800 : 600,
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    bgcolor: statusFilter === st ? (isDark ? '#3B82F6' : '#0F172A') : (isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'),
                                    color: statusFilter === st ? '#FFFFFF' : 'text.secondary',
                                    border: '1px solid',
                                    borderColor: statusFilter === st ? (isDark ? '#3B82F6' : '#0F172A') : 'divider',
                                    '&:hover': { bgcolor: statusFilter === st ? (isDark ? '#2563EB' : '#1E293B') : (isDark ? 'rgba(255,255,255,0.09)' : '#F1F5F9') },
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* TAB 0: Multi-Service Bookings Table */}
                {activeTab === 0 && (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 920 }} size="small">
                            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Reference #</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Service / Item</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Schedule</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Channel</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Financials</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredServiceBookings.length > 0 ? (
                                    filteredServiceBookings.map((b) => {
                                        const meta = getServiceMeta(b.service_type);
                                        return (
                                            <TableRow key={b.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                {/* Ref */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <Typography
                                                            sx={{
                                                                fontFamily: 'monospace',
                                                                fontWeight: 700,
                                                                fontSize: '0.8rem',
                                                                color: 'text.primary',
                                                                bgcolor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
                                                                px: 0.8,
                                                                py: 0.3,
                                                                borderRadius: 1.5,
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            {b.booking_number}
                                                        </Typography>
                                                        <Tooltip title={copiedRef === b.booking_number ? 'Copied!' : 'Copy Reference'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCopy(b.booking_number)}
                                                                sx={{ p: 0.3, color: copiedRef === b.booking_number ? '#10B981' : '#94A3B8' }}
                                                            >
                                                                {copiedRef === b.booking_number ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>

                                                {/* Service / Item */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ p: 0.5, bgcolor: meta.bg, color: meta.color, borderRadius: 1.5, display: 'flex' }}>
                                                            {getServiceIcon(b.service_type)}
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary' }}>
                                                                {b.service_name}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                                                                {meta.label}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Customer */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <Avatar
                                                            sx={{
                                                                width: 28,
                                                                height: 28,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 800,
                                                                bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                                                                color: 'text.primary',
                                                            }}
                                                        >
                                                            {(b.customer_name || 'U').charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                                                                {b.customer_name}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
                                                                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                                                                    {b.customer_phone}
                                                                </Typography>
                                                                {b.customer_phone && (
                                                                    <Tooltip title="Chat on WhatsApp">
                                                                        <IconButton
                                                                            size="small"
                                                                            component="a"
                                                                            href={`https://wa.me/91${b.customer_phone.replace(/\D/g, '')}`}
                                                                            target="_blank"
                                                                            sx={{ p: 0.2, color: 'success.main' }}
                                                                        >
                                                                            <WhatsAppIcon sx={{ fontSize: 13 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Schedule */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>
                                                        {b.start_datetime}
                                                    </Typography>
                                                </TableCell>

                                                {/* Channel */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Chip
                                                        label={b.booking_channel === 'walk_in' ? 'Counter Walk-In' : 'Online Booking'}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.68rem',
                                                            fontWeight: 700,
                                                            bgcolor: b.booking_channel === 'walk_in' ? (isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9') : (isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF'),
                                                            color: b.booking_channel === 'walk_in' ? 'text.secondary' : (isDark ? '#60A5FA' : '#1D4ED8'),
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Financials */}
                                                <TableCell align="right" sx={{ py: 1.5 }}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                                                        ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700,
                                                            color: b.balance_due > 0 ? 'warning.main' : 'success.main',
                                                        }}
                                                    >
                                                        {b.balance_due > 0 ? `Due: ₹${b.balance_due}` : 'Paid in Full'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    {getStatusBadge(b.status)}
                                                </TableCell>

                                                {/* Action */}
                                                <TableCell align="right" sx={{ py: 1.5 }}>
                                                    <Button
                                                        component={Link}
                                                        href={`/admin/services/${b.service_type}/bookings/${b.id}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: 1.5,
                                                            fontWeight: 700,
                                                            py: 0.4,
                                                            px: 1.5,
                                                            fontSize: '0.75rem',
                                                            color: 'text.primary',
                                                            borderColor: 'divider',
                                                            '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
                                                        }}
                                                    >
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.disabled' }}>
                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                No service bookings matching "{statusFilter}".
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* TAB 1: Bike Fleet Bookings Table */}
                {activeTab === 1 && (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 920 }} size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Booking Reference</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Vehicle Assigned</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Pickup Hub</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Trip Window</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Gross Fare</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBikeBookings.length > 0 ? (
                                    filteredBikeBookings.map((b) => (
                                        <TableRow key={b.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                            {/* Ref */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            fontWeight: 700,
                                                            fontSize: '0.8rem',
                                                            color: 'text.primary',
                                                            bgcolor: 'action.hover',
                                                            px: 0.8,
                                                            py: 0.3,
                                                            borderRadius: 1.5,
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                        }}
                                                    >
                                                        {b.booking_reference}
                                                    </Typography>
                                                    <Tooltip title={copiedRef === b.booking_reference ? 'Copied!' : 'Copy Reference'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopy(b.booking_reference)}
                                                            sx={{ p: 0.3, color: copiedRef === b.booking_reference ? 'success.main' : 'text.disabled' }}
                                                        >
                                                            {copiedRef === b.booking_reference ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>

                                            {/* Customer */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 800,
                                                            bgcolor: 'action.selected',
                                                            color: 'text.primary',
                                                        }}
                                                    >
                                                        {(b.user?.name || 'W').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                                                            {b.user?.name || 'Walk-in Customer'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                                                            {b.user?.phone}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Vehicle */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                                                    {b.bike?.brand} {b.bike?.model_name}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {b.bike?.registration_number}
                                                </Typography>
                                            </TableCell>

                                            {/* Hub */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
                                                    {b.pickup_store?.name || 'Gokarna Hub'}
                                                </Typography>
                                            </TableCell>

                                            {/* Schedule */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>
                                                    {b.start_date} → {b.end_date}
                                                </Typography>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                {getStatusBadge(b.status)}
                                            </TableCell>

                                            {/* Amount */}
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                                                    ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <Button
                                                    component={Link}
                                                    href={`/admin/bookings/${b.id}/edit`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: 1.5,
                                                        fontWeight: 700,
                                                        py: 0.4,
                                                        px: 1.5,
                                                        fontSize: '0.75rem',
                                                        color: 'text.primary',
                                                        borderColor: 'divider',
                                                        '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' },
                                                    }}
                                                >
                                                    Manage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                No bike bookings found matching "{statusFilter}".
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </AdminLayout>
    );
}

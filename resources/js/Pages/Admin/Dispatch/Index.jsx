import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    ButtonGroup,
    Chip,
    Grid,
    Paper,
    Stack,
    IconButton,
    Tooltip,
    Divider,
    Drawer,
    Avatar,
    Menu,
    MenuItem,
    useTheme,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import PoolIcon from '@mui/icons-material/Pool';
import HotelIcon from '@mui/icons-material/Hotel';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StoreIcon from '@mui/icons-material/Store';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function DispatchIndex({
    resources = [],
    events = [],
    stats = {},
    current_window = {},
    filters = {},
    allowed_services = [],
    stores = [],
    current_store = null,
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [viewMode, setViewMode] = useState(current_window.view_mode || 'timeline');
    const [selectedService, setSelectedService] = useState(filters.service_type || 'all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [copiedRef, setCopiedRef] = useState(null);
    const [storeAnchorEl, setStoreAnchorEl] = useState(null);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(text);
        setTimeout(() => setCopiedRef(null), 2000);
    };

    // Calculate dates array for 7-day timeline window
    const timelineDays = useMemo(() => {
        const days = [];
        if (!current_window.start_date) return days;
        const current = new Date(current_window.start_date);
        for (let i = 0; i < 7; i++) {
            const d = new Date(current);
            d.setDate(current.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            days.push({
                date: iso,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
                isToday: iso === new Date().toISOString().split('T')[0],
            });
        }
        return days;
    }, [current_window.start_date]);

    // Service meta helpers
    const getServiceMeta = (type) => {
        switch (type) {
            case 'taxi': return { label: 'Cab & Taxi', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
            case 'boating': return { label: 'Boating', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' };
            case 'scuba': return { label: 'Scuba Diving', color: '#0D9488', bg: '#CCFBF1', border: '#99F6E4' };
            case 'homestay': return { label: 'Homestay', color: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE' };
            case 'guide': return { label: 'Tour Guide', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' };
            case 'tours': return { label: 'Tour Package', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
            default: return { label: 'Two-Wheeler', color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE' };
        }
    };

    const getServiceIcon = (type) => {
        switch (type) {
            case 'taxi': return <DirectionsCarIcon sx={{ fontSize: 16 }} />;
            case 'boating': return <DirectionsBoatIcon sx={{ fontSize: 16 }} />;
            case 'scuba': return <PoolIcon sx={{ fontSize: 16 }} />;
            case 'homestay': return <HotelIcon sx={{ fontSize: 16 }} />;
            case 'guide': return <PersonPinIcon sx={{ fontSize: 16 }} />;
            case 'tours': return <ExploreIcon sx={{ fontSize: 16 }} />;
            default: return <TwoWheelerIcon sx={{ fontSize: 16 }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', dot: '#2563EB' };
            case 'handed_over':
            case 'in_progress': return { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', dot: '#10B981' };
            case 'returned':
            case 'completed': return { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', dot: '#64748B' };
            default: return { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', dot: '#D97706' };
        }
    };

    // Filter resources and events based on selected service
    const filteredResources = useMemo(() => {
        if (selectedService === 'all') return resources;
        return resources.filter(r => r.service_type === selectedService);
    }, [resources, selectedService]);

    // Fast mapping of events per resource and date
    const isEventOnDate = (event, dateStr) => {
        const startStr = event.start_date || (event.start ? event.start.split(' ')[0] : '');
        const endStr = event.end_date || (event.end ? event.end.split(' ')[0] : startStr);
        return dateStr >= startStr && dateStr <= endStr;
    };

    // Navigation functions
    const shiftWindow = (days) => {
        const cur = new Date(current_window.start_date || new Date().toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + days);
        const nextStart = cur.toISOString().split('T')[0];
        router.get('/admin/dispatch', {
            start_date: nextStart,
            service_type: selectedService,
            view_mode: viewMode,
            store_id: filters.store_id,
        }, { preserveState: true });
    };

    const jumpToToday = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        router.get('/admin/dispatch', {
            start_date: todayStr,
            service_type: selectedService,
            view_mode: viewMode,
            store_id: filters.store_id,
        }, { preserveState: true });
    };

    const handleServiceFilter = (slug) => {
        setSelectedService(slug);
        router.get('/admin/dispatch', {
            start_date: current_window.start_date,
            service_type: slug,
            view_mode: viewMode,
            store_id: filters.store_id,
        }, { preserveState: true });
    };

    const handleViewModeToggle = (mode) => {
        setViewMode(mode);
        router.get('/admin/dispatch', {
            start_date: current_window.start_date,
            service_type: selectedService,
            view_mode: mode,
            store_id: filters.store_id,
        }, { preserveState: true });
    };

    return (
        <AdminLayout title="Visual Dispatch & Schedule Board" currentStore={current_store}>
            <Head title="Visual Dispatch Board - GK WhizWheels" />

            {/* Top Toolbar / Ops Header */}
            <Box
                sx={{
                    mb: 3,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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
                            Visual Dispatch & Schedule Board
                        </Typography>
                        <Chip
                            label="GANTT DISPATCH"
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: isDark ? '#3B82F6' : '#0F172A',
                                color: 'common.white',
                                borderRadius: 1,
                                letterSpacing: '0.04em',
                            }}
                        />
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.25, borderRadius: 10, bgcolor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0' }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>
                                Multi-Modal Fleet Sync
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        Real-time timeline schedules across two-wheelers, cabs, boating safaris, scuba diving, homestays, and guides.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    {/* View Switcher ButtonGroup */}
                    <ButtonGroup size="small" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Button
                            onClick={() => handleViewModeToggle('timeline')}
                            variant={viewMode === 'timeline' ? 'contained' : 'text'}
                            startIcon={<ViewTimelineIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                px: 1.8,
                                bgcolor: viewMode === 'timeline' ? (isDark ? '#3B82F6' : '#0F172A') : 'transparent',
                                color: viewMode === 'timeline' ? '#FFFFFF' : 'text.secondary',
                                '&:hover': { bgcolor: viewMode === 'timeline' ? (isDark ? '#2563EB' : '#1E293B') : 'action.hover' },
                            }}
                        >
                            Timeline Lanes
                        </Button>
                        <Button
                            onClick={() => handleViewModeToggle('month')}
                            variant={viewMode === 'month' ? 'contained' : 'text'}
                            startIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                px: 1.8,
                                bgcolor: viewMode === 'month' ? (isDark ? '#3B82F6' : '#0F172A') : 'transparent',
                                color: viewMode === 'month' ? '#FFFFFF' : 'text.secondary',
                                '&:hover': { bgcolor: viewMode === 'month' ? (isDark ? '#2563EB' : '#1E293B') : 'action.hover' },
                            }}
                        >
                            Month Grid
                        </Button>
                    </ButtonGroup>

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
                            bgcolor: isDark ? '#3B82F6' : '#0F172A',
                            '&:hover': { bgcolor: isDark ? '#2563EB' : '#1E293B' },
                            fontSize: '0.82rem',
                        }}
                    >
                        + New Booking
                    </Button>
                </Stack>
            </Box>

            {/* KPI Telemetry Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Resources
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.total_resources || filteredResources.length}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                                Active fleet & catalog assets
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Active Dispatches
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.active_dispatches || 0}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'primary.main', fontWeight: 600, mt: 0.5 }}>
                                Confirmed / In-Trip
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Pickups Today
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'warning.main', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.pending_pickups_today || 0}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'warning.main', fontWeight: 600, mt: 0.5 }}>
                                Awaiting departure / dispatch
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Returns Due Today
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.returns_today || 0}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'success.main', fontWeight: 600, mt: 0.5 }}>
                                Scheduled check-in
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Schedule Container */}
            <Paper
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    bgcolor: 'background.paper',
                    mb: 4,
                }}
            >
                {/* Controls Bar: Window Navigation & Service Filters */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { md: 'center' },
                        gap: 2,
                    }}
                >
                    {/* Window Controls */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                            size="small"
                            onClick={() => shiftWindow(viewMode === 'timeline' ? -7 : -30)}
                            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                        >
                            <ChevronLeftIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Button
                            size="small"
                            onClick={jumpToToday}
                            startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                color: 'text.primary',
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                px: 1.5,
                            }}
                        >
                            Today
                        </Button>
                        <IconButton
                            size="small"
                            onClick={() => shiftWindow(viewMode === 'timeline' ? 7 : 30)}
                            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                        >
                            <ChevronRightIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary', ml: 1 }}>
                            {current_window.start_date} → {current_window.end_date}
                        </Typography>
                    </Stack>

                    {/* Service Category Filter Chips */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                            label="All Domains"
                            size="small"
                            onClick={() => handleServiceFilter('all')}
                            sx={{
                                height: 26,
                                fontSize: '0.75rem',
                                fontWeight: selectedService === 'all' ? 800 : 600,
                                bgcolor: selectedService === 'all' ? (isDark ? '#3B82F6' : '#0F172A') : (isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'),
                                color: selectedService === 'all' ? '#FFFFFF' : 'text.secondary',
                                border: '1px solid',
                                borderColor: selectedService === 'all' ? (isDark ? '#3B82F6' : '#0F172A') : 'divider',
                                cursor: 'pointer',
                            }}
                        />
                        {allowed_services.map((svc) => {
                            const meta = getServiceMeta(svc);
                            const isSel = selectedService === svc;
                            return (
                                <Chip
                                    key={svc}
                                    icon={getServiceIcon(svc)}
                                    label={meta.label}
                                    size="small"
                                    onClick={() => handleServiceFilter(svc)}
                                    sx={{
                                        height: 26,
                                        fontSize: '0.75rem',
                                        fontWeight: isSel ? 800 : 600,
                                        bgcolor: isSel ? meta.color : (isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'),
                                        color: isSel ? '#FFFFFF' : 'text.secondary',
                                        border: '1px solid',
                                        borderColor: isSel ? meta.color : 'divider',
                                        cursor: 'pointer',
                                        '& .MuiChip-icon': {
                                            color: isSel ? '#FFFFFF' : meta.color,
                                        },
                                    }}
                                />
                            );
                        })}
                    </Stack>
                </Box>

                {/* TIMELINE GANTT VIEW */}
                {viewMode === 'timeline' && (
                    <Box sx={{ overflowX: 'auto', width: '100%' }}>
                        <Box sx={{ minWidth: 980 }}>
                            {/* Days Header Row */}
                            <Box sx={{ display: 'flex', borderBottom: '2px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                                {/* Resource lane header */}
                                <Box sx={{ width: 280, minWidth: 280, p: 1.5, borderRight: '1px solid', borderColor: 'divider', fontWeight: 800, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Asset / Resource Lane
                                </Box>
                                {/* 7 Day Columns */}
                                {timelineDays.map((day) => (
                                    <Box
                                        key={day.date}
                                        sx={{
                                            flex: 1,
                                            minWidth: 100,
                                            p: 1.2,
                                            textAlign: 'center',
                                            borderRight: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: day.isToday ? (isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF') : 'transparent',
                                            borderTop: day.isToday ? '3px solid #2563EB' : 'none',
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: day.isToday ? '#2563EB' : 'text.secondary', textTransform: 'uppercase' }}>
                                            {day.dayName}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: day.isToday ? (isDark ? '#60A5FA' : '#1D4ED8') : 'text.primary', lineHeight: 1.2 }}>
                                            {day.dayNum} {day.monthName}
                                        </Typography>
                                        {day.isToday && (
                                            <Chip label="TODAY" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'primary.main', color: 'common.white', mt: 0.3 }} />
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            {/* Resource Rows */}
                            {filteredResources.length > 0 ? (
                                filteredResources.map((res) => {
                                    const meta = getServiceMeta(res.service_type);
                                    return (
                                        <Box
                                            key={res.id}
                                            sx={{
                                                display: 'flex',
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                minHeight: 64,
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            {/* Resource Left Identity Column */}
                                            <Box
                                                sx={{
                                                    width: 280,
                                                    minWidth: 280,
                                                    p: 1.5,
                                                    borderRight: '1px solid',
                                                    borderColor: 'divider',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.2,
                                                    bgcolor: 'background.paper',
                                                }}
                                            >
                                                <Box sx={{ p: 0.6, bgcolor: meta.bg, color: meta.color, borderRadius: 1.5, display: 'flex', flexShrink: 0 }}>
                                                    {getServiceIcon(res.service_type)}
                                                </Box>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary' }}>
                                                        {res.name}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.2 }}>
                                                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600 }}>
                                                            {res.identifier}
                                                        </Typography>
                                                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
                                                        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                                                            {res.store_name}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Box>

                                            {/* 7 Days Cells */}
                                            {timelineDays.map((day) => {
                                                // Find events for this resource on this day
                                                const dayEvents = events.filter(e => {
                                                    const matchResource = e.resource_id === res.id || (!e.resource_id && e.service_type === res.service_type);
                                                    return matchResource && isEventOnDate(e, day.date);
                                                });

                                                return (
                                                    <Box
                                                        key={`${res.id}-${day.date}`}
                                                        sx={{
                                                            flex: 1,
                                                            minWidth: 100,
                                                            p: 0.8,
                                                            borderRight: '1px solid',
                                                            borderColor: 'divider',
                                                            bgcolor: day.isToday ? (isDark ? 'rgba(59,130,246,0.08)' : 'rgba(239,246,255,0.4)') : 'transparent',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 0.5,
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {dayEvents.map((evt) => {
                                                            const stCol = getStatusColor(evt.status);
                                                            return (
                                                                <Box
                                                                    key={evt.id}
                                                                    onClick={() => setSelectedEvent(evt)}
                                                                    sx={{
                                                                        px: 1,
                                                                        py: 0.4,
                                                                        borderRadius: 1.5,
                                                                        bgcolor: stCol.bg,
                                                                        border: `1px solid ${stCol.border}`,
                                                                        color: stCol.text,
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.72rem',
                                                                        fontWeight: 700,
                                                                        transition: 'all 0.12s ease',
                                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                                                        '&:hover': {
                                                                            transform: 'translateY(-1px)',
                                                                            boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
                                                                        },
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <FiberManualRecordIcon sx={{ fontSize: 6, color: stCol.dot }} />
                                                                        <Typography noWrap sx={{ fontSize: '0.7rem', fontWeight: 800 }}>
                                                                            {evt.customer_name}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography noWrap sx={{ fontSize: '0.65rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                                                                        {evt.reference}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    );
                                })
                            ) : (
                                <Box sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                        No resources registered under this filter.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                {/* MONTH CALENDAR GRID VIEW */}
                {viewMode === 'month' && (
                    <Box sx={{ p: 2.5 }}>
                        <Grid container spacing={1.5}>
                            {Array.from({ length: 30 }).map((_, idx) => {
                                const dayNum = idx + 1;
                                const dateStr = `${current_window.month}-${String(dayNum).padStart(2, '0')}`;
                                const dayEvents = events.filter(e => isEventOnDate(e, dateStr));
                                const isToday = dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <Grid key={dateStr} size={{ xs: 12, sm: 4, md: 2.4 }}>
                                        <Card
                                            sx={{
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: isToday ? '#2563EB' : 'divider',
                                                bgcolor: isToday ? (isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF') : 'background.paper',
                                                p: 1.5,
                                                minHeight: 110,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: isToday ? (isDark ? '#60A5FA' : '#1D4ED8') : 'text.primary' }}>
                                                    {dayNum}
                                                </Typography>
                                                {dayEvents.length > 0 && (
                                                    <Chip
                                                        label={`${dayEvents.length} Bookings`}
                                                        size="small"
                                                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: isDark ? 'primary.main' : 'grey.900', color: 'common.white' }}
                                                    />
                                                )}
                                            </Box>
                                            <Stack spacing={0.5}>
                                                {dayEvents.slice(0, 3).map((evt) => {
                                                    const stCol = getStatusColor(evt.status);
                                                    return (
                                                        <Box
                                                            key={evt.id}
                                                            onClick={() => setSelectedEvent(evt)}
                                                            sx={{
                                                                px: 0.8,
                                                                py: 0.3,
                                                                borderRadius: 1,
                                                                bgcolor: stCol.bg,
                                                                border: `1px solid ${stCol.border}`,
                                                                cursor: 'pointer',
                                                                '&:hover': { opacity: 0.85 },
                                                            }}
                                                        >
                                                            <Typography noWrap sx={{ fontSize: '0.68rem', fontWeight: 700, color: stCol.text }}>
                                                                {evt.customer_name} ({evt.reference})
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })}
                                                {dayEvents.length > 3 && (
                                                    <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#60A5FA' : '#2563EB', fontWeight: 700, textAlign: 'center' }}>
                                                        +{dayEvents.length - 3} more
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* SIDE INSPECTION DRAWER */}
            <Drawer
                anchor="right"
                open={Boolean(selectedEvent)}
                onClose={() => setSelectedEvent(null)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 420 },
                        p: 3,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                {selectedEvent && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Drawer Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Dispatch Inspection
                                </Typography>
                                <Chip
                                    label={selectedEvent.service_type.replace('_', ' ')}
                                    size="small"
                                    sx={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                                />
                            </Box>
                            <IconButton size="small" onClick={() => setSelectedEvent(null)}>
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>

                        <Divider sx={{ mb: 2.5 }} />

                        {/* Booking Ref Pill */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 800,
                                        fontSize: '1.15rem',
                                        color: 'text.primary',
                                        bgcolor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
                                        px: 1.2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {selectedEvent.reference}
                                </Typography>
                                <Tooltip title={copiedRef === selectedEvent.reference ? 'Copied!' : 'Copy Reference'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(selectedEvent.reference)}
                                        sx={{ color: copiedRef === selectedEvent.reference ? 'success.main' : 'text.secondary' }}
                                    >
                                        {copiedRef === selectedEvent.reference ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: getStatusColor(selectedEvent.status).bg, border: `1px solid ${getStatusColor(selectedEvent.status).border}`, color: getStatusColor(selectedEvent.status).text, fontSize: '0.75rem', fontWeight: 700 }}>
                                <FiberManualRecordIcon sx={{ fontSize: 8, color: getStatusColor(selectedEvent.status).dot }} />
                                Status: {selectedEvent.status.replace('_', ' ').toUpperCase()}
                            </Box>
                        </Box>

                        {/* Customer Profile Card */}
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', mb: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5 }}>
                                    Customer & Contact
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ bgcolor: isDark ? 'primary.main' : 'grey.900', color: 'common.white', fontWeight: 800 }}>
                                        {selectedEvent.customer_name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                                            {selectedEvent.customer_name}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                                            {selectedEvent.customer_phone || 'No phone recorded'}
                                        </Typography>
                                    </Box>
                                    {selectedEvent.customer_phone && (
                                        <Tooltip title="Chat on WhatsApp">
                                            <IconButton
                                                component="a"
                                                href={`https://wa.me/91${selectedEvent.customer_phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(selectedEvent.customer_name)},%20this%20is%20GK%20WhizWheels%20regarding%20booking%20#${selectedEvent.reference}.`}
                                                target="_blank"
                                                sx={{ bgcolor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', color: isDark ? '#34D399' : '#16A34A', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0' }}
                                            >
                                                <WhatsAppIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Schedule & Transit Locations */}
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', mb: 2.5, bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5 }}>
                                    Trip Window & Transit Point
                                </Typography>
                                <Stack spacing={1.2}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>Departure Schedule</Typography>
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
                                                {selectedEvent.start}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>Return / Completion</Typography>
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
                                                {selectedEvent.end}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>Station / Hub Point</Typography>
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
                                                {selectedEvent.location}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Financials & Channel */}
                        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary' }}>Gross Fare</Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: 'text.primary' }}>
                                    ₹{Number(selectedEvent.total_amount).toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            {selectedEvent.balance_due > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'warning.main' }}>Balance Due at Hub</Typography>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: 'warning.main' }}>
                                        ₹{Number(selectedEvent.balance_due).toLocaleString('en-IN')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Action Footer */}
                        <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Button
                                component={Link}
                                href={selectedEvent.details_url}
                                fullWidth
                                variant="contained"
                                sx={{
                                    py: 1.2,
                                    borderRadius: 2,
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    bgcolor: isDark ? '#3B82F6' : '#0F172A',
                                    '&:hover': { bgcolor: isDark ? '#2563EB' : '#1E293B' },
                                }}
                            >
                                Open Booking Management →
                            </Button>
                        </Box>
                    </Box>
                )}
            </Drawer>
        </AdminLayout>
    );
}

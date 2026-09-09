import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    IconButton,
    InputAdornment,
    Tabs,
    Tab,
    Tooltip,
    Avatar,
    Pagination,
    Grid,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import StoreIcon from '@mui/icons-material/Store';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PublicIcon from '@mui/icons-material/Public';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ClearIcon from '@mui/icons-material/Clear';

export default function ServiceBookingsIndex({
    serviceConfig = {},
    bookings = { data: [], links: [], current_page: 1, last_page: 1 },
    filters = {},
    stats = {},
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [search, setSearch] = useState(filters.search || '');
    const [statusTab, setStatusTab] = useState(filters.status || 'all');
    const [channel, setChannel] = useState(filters.channel || 'all');
    const [copiedRef, setCopiedRef] = useState(null);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(text);
        setTimeout(() => setCopiedRef(null), 2000);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            `/admin/services/${serviceConfig.slug}/bookings`,
            { search, status: statusTab, channel },
            { preserveState: true, replace: true }
        );
    };

    const handleClearSearch = () => {
        setSearch('');
        router.get(
            `/admin/services/${serviceConfig.slug}/bookings`,
            { search: '', status: statusTab, channel },
            { preserveState: true, replace: true }
        );
    };

    const handleTabChange = (event, newStatus) => {
        setStatusTab(newStatus);
        router.get(
            `/admin/services/${serviceConfig.slug}/bookings`,
            { search, status: newStatus, channel },
            { preserveState: true, replace: true }
        );
    };

    const handleChannelFilter = (newChannel) => {
        setChannel(newChannel);
        router.get(
            `/admin/services/${serviceConfig.slug}/bookings`,
            { search, status: statusTab, channel: newChannel },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = (event, page) => {
        router.get(
            `/admin/services/${serviceConfig.slug}/bookings`,
            { search, status: statusTab, channel, page },
            { preserveState: true }
        );
    };

    const getStatusBadge = (st) => {
        switch (st) {
            case 'confirmed':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF', border: '1px solid', borderColor: isDark ? 'rgba(59,130,246,0.4)' : '#BFDBFE', color: isDark ? '#60A5FA' : '#1D4ED8', fontSize: '0.72rem', fontWeight: 700 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                        Confirmed
                    </Box>
                );
            case 'in_progress':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0', color: isDark ? '#34D399' : '#047857', fontSize: '0.72rem', fontWeight: 700 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: 'success.main', animation: 'pulse 1.8s infinite' }} />
                        Active / In-Trip
                    </Box>
                );
            case 'completed':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC', border: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.72rem', fontWeight: 700 }}>
                        <CheckCircleIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                        Completed
                    </Box>
                );
            case 'cancelled':
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', border: '1px solid', borderColor: isDark ? 'rgba(239,68,68,0.4)' : '#FECACA', color: isDark ? '#F87171' : '#B91C1C', fontSize: '0.72rem', fontWeight: 700 }}>
                        Cancelled
                    </Box>
                );
            default:
                return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', border: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.72rem', fontWeight: 700 }}>
                        {st}
                    </Box>
                );
        }
    };

    const getPaymentBadge = (pst, bal) => {
        if (pst === 'paid' || parseFloat(bal) <= 0) {
            return (
                <Chip
                    size="small"
                    label="Paid in Full"
                    sx={{
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        bgcolor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                        color: isDark ? '#34D399' : '#047857',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0',
                        height: 20,
                    }}
                />
            );
        }
        if (pst === 'partial') {
            return (
                <Chip
                    size="small"
                    label="Advance Paid"
                    sx={{
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        bgcolor: isDark ? 'rgba(251,191,36,0.15)' : '#FFFBEB',
                        color: isDark ? '#FCD34D' : '#B45309',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(251,191,36,0.4)' : '#FDE68A',
                        height: 20,
                    }}
                />
            );
        }
        return (
            <Chip
                size="small"
                label="Payment Pending"
                sx={{
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    bgcolor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
                    color: isDark ? '#F87171' : '#B91C1C',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(239,68,68,0.4)' : '#FECACA',
                    height: 20,
                }}
            />
        );
    };

    const getChannelBadge = (ch) => {
        switch (ch) {
            case 'offline_walkin':
                return (
                    <Chip
                        size="small"
                        icon={<StoreIcon sx={{ fontSize: '12px !important' }} />}
                        label="Walk-in Hub"
                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9', color: 'text.secondary', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                );
            case 'offline_phone':
                return (
                    <Chip
                        size="small"
                        icon={<PhoneInTalkIcon sx={{ fontSize: '12px !important' }} />}
                        label="Phone Desk"
                        sx={{ bgcolor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: isDark ? '#60A5FA' : '#1D4ED8', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                );
            default:
                return (
                    <Chip
                        size="small"
                        icon={<PublicIcon sx={{ fontSize: '12px !important' }} />}
                        label="Online Web"
                        sx={{ bgcolor: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', color: isDark ? '#4ADE80' : '#16A34A', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                );
        }
    };

    const formatDate = (dt) => {
        if (!dt) return '—';
        try {
            return new Date(dt).toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dt;
        }
    };

    return (
        <AdminLayout title={`${serviceConfig.title} - Bookings`}>
            <Head title={`${serviceConfig.title} Bookings - Operations Console`} />

            {/* Header Deck */}
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
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { sm: 'center' },
                    gap: 2,
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                            {serviceConfig.title} Bookings
                        </Typography>
                        <Chip
                            label="LIVE PIPELINE"
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
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        Manage reservations, counter walk-ins, schedule dispatch, and payments for {serviceConfig.title}.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                        variant="outlined"
                        component={Link}
                        href={`/admin/services/${serviceConfig.slug}/items`}
                        sx={{
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 2,
                            fontSize: '0.8rem',
                            color: 'text.secondary',
                            borderColor: 'divider',
                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                            '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled' },
                        }}
                    >
                        Manage {serviceConfig.item_label}s
                    </Button>
                    <Button
                        variant="contained"
                        component={Link}
                        href={`/admin/services/${serviceConfig.slug}/bookings/create`}
                        startIcon={<AddIcon />}
                        sx={{
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 2,
                            fontSize: '0.82rem',
                            px: 2,
                            bgcolor: isDark ? '#3B82F6' : '#0F172A',
                            '&:hover': { bgcolor: isDark ? '#2563EB' : '#1E293B' },
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                    >
                        + Walk-In Booking
                    </Button>
                </Stack>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Bookings
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.total || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Confirmed / Upcoming
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.confirmed || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Currently Active
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'warning.main', mt: 0.5, letterSpacing: '-0.02em' }}>
                                {stats.in_progress || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Realized Revenue
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5, letterSpacing: '-0.02em' }}>
                                ₹{parseFloat(stats.revenue || 0).toLocaleString('en-IN')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter Deck and Data Table */}
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
                {/* Tabs & Search Bar */}
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ px: 2, pt: 1 }}>
                        <Tabs
                            value={statusTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                minHeight: 38,
                                '& .MuiTab-root': {
                                    minHeight: 38,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    px: 2,
                                    borderRadius: 2,
                                    color: 'text.secondary',
                                    '&.Mui-selected': {
                                        color: 'text.primary',
                                        bgcolor: 'action.selected',
                                    },
                                },
                                '& .MuiTabs-indicator': { display: 'none' },
                            }}
                        >
                            <Tab label="All Bookings" value="all" />
                            <Tab label="Confirmed" value="confirmed" />
                            <Tab label="In Progress" value="in_progress" />
                            <Tab label="Completed" value="completed" />
                            <Tab label="Cancelled" value="cancelled" />
                        </Tabs>
                    </Box>

                    <Box component="form" onSubmit={handleSearch} sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderTop: '1px solid', borderColor: 'divider' }}>
                        <TextField
                            size="small"
                            placeholder="Search customer, phone, ref..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{
                                flex: { xs: '1 1 100%', sm: 1 },
                                minWidth: 260,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: search ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleClearSearch} sx={{ p: 0.5 }}>
                                            <ClearIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />

                        <TextField
                            select
                            size="small"
                            value={channel}
                            onChange={(e) => handleChannelFilter(e.target.value)}
                            sx={{
                                width: { xs: '100%', sm: 180 },
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                        >
                            <MenuItem value="all">All Channels</MenuItem>
                            <MenuItem value="online">Online Web</MenuItem>
                            <MenuItem value="offline_walkin">Walk-in Hub</MenuItem>
                            <MenuItem value="offline_phone">Phone Inquiries</MenuItem>
                        </TextField>

                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 2.5,
                                borderRadius: 2,
                                bgcolor: isDark ? '#3B82F6' : '#0F172A',
                                '&:hover': { bgcolor: isDark ? '#2563EB' : '#1E293B' },
                            }}
                        >
                            Search
                        </Button>
                    </Box>
                </Box>

                {/* Table */}
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 920 }}>
                        <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Booking Ref</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Item / Package</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Schedule & Location</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Financials</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', py: 1.5 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.data && bookings.data.length > 0 ? (
                                bookings.data.map((b) => (
                                    <TableRow key={b.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        {/* Booking Ref & Channel */}
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
                                                        sx={{ p: 0.3, color: copiedRef === b.booking_number ? 'success.main' : 'text.disabled' }}
                                                    >
                                                        {copiedRef === b.booking_number ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            <Box sx={{ mt: 0.6 }}>
                                                {getChannelBadge(b.booking_channel)}
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

                                        {/* Package / Item */}
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                                                {b.service_item?.name || 'Custom Package'}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                                                Qty / Pax: {b.quantity}
                                            </Typography>
                                        </TableCell>

                                        {/* Schedule */}
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>
                                                {formatDate(b.start_datetime)}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                                                {b.pickup_location || 'Palya Main Rd Hub'}
                                            </Typography>
                                        </TableCell>

                                        {/* Financials */}
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                                                ₹{parseFloat(b.total_amount).toLocaleString('en-IN')}
                                            </Typography>
                                            <Box sx={{ mt: 0.4, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                {getPaymentBadge(b.payment_status, b.balance_due)}
                                                {parseFloat(b.balance_due) > 0 && (
                                                    <Typography sx={{ fontSize: '0.72rem', color: 'warning.main', fontWeight: 700 }}>
                                                        Due: ₹{parseFloat(b.balance_due).toLocaleString('en-IN')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell sx={{ py: 1.5 }}>
                                            {getStatusBadge(b.status)}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell align="right" sx={{ py: 1.5 }}>
                                            <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center">
                                                <Tooltip title="Direct WhatsApp">
                                                    <IconButton
                                                        size="small"
                                                        component="a"
                                                        href={`https://wa.me/91${b.customer_phone}?text=Hello%20${encodeURIComponent(b.customer_name)},%20this%20is%20GK%20WhizWheels%20regarding%20your%20${encodeURIComponent(serviceConfig.title)}%20booking%20#${b.booking_number}.`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        sx={{ p: 0.4, color: isDark ? '#4ADE80' : '#16A34A', bgcolor: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4', borderRadius: 1.5 }}
                                                    >
                                                        <WhatsAppIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Button
                                                    component={Link}
                                                    href={`/admin/services/${serviceConfig.slug}/bookings/${b.id}`}
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
                                                        '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled' },
                                                    }}
                                                >
                                                    Details
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.9rem' }}>
                                            No bookings found matching current filters.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            component={Link}
                                            href={`/admin/services/${serviceConfig.slug}/bookings/create`}
                                            startIcon={<AddIcon />}
                                            sx={{ mt: 2, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                                        >
                                            Create First Offline Booking
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {bookings.last_page > 1 && (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Pagination
                            count={bookings.last_page}
                            page={bookings.current_page}
                            onChange={handlePageChange}
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                )}
            </Paper>
        </AdminLayout>
    );
}

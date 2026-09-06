import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    ButtonGroup,
    TextField,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination,
    Stack,
    Tooltip,
    Divider,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CancelIcon from '@mui/icons-material/Cancel';
import LanguageIcon from '@mui/icons-material/Language';
import StorefrontIcon from '@mui/icons-material/Storefront';

export default function BookingsIndex({
    bookings = { data: [], links: [], current_page: 1, last_page: 1, total: 0 },
    calendar_events = [],
    stats = {},
    stores = [],
    statuses = [],
    channels = [],
    filters = {},
}) {
    const [viewMode, setViewMode] = useState(filters.view_mode || 'list');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStore, setSelectedStore] = useState(filters.store_id || '');
    const [selectedChannel, setSelectedChannel] = useState(filters.channel || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(filters.month || new Date().toISOString().slice(0, 7));
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleFilterChange = (overrides = {}) => {
        const queryParams = {
            search: searchTerm,
            store_id: selectedStore,
            channel: selectedChannel,
            status: selectedStatus,
            date_from: dateFrom,
            date_to: dateTo,
            view_mode: viewMode,
            month: currentMonth,
            ...overrides,
        };

        Object.keys(queryParams).forEach((k) => {
            if (!queryParams[k]) delete queryParams[k];
        });

        router.get('/admin/bookings', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStore('');
        setSelectedChannel('');
        setSelectedStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/admin/bookings', { view_mode: viewMode, month: currentMonth });
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        handleFilterChange({ view_mode: mode });
    };

    // Month navigation
    const handlePrevMonth = () => {
        const [y, m] = currentMonth.split('-').map(Number);
        const d = new Date(y, m - 2, 1);
        const newM = d.toISOString().slice(0, 7);
        setCurrentMonth(newM);
        handleFilterChange({ month: newM });
    };

    const handleNextMonth = () => {
        const [y, m] = currentMonth.split('-').map(Number);
        const d = new Date(y, m, 1);
        const newM = d.toISOString().slice(0, 7);
        setCurrentMonth(newM);
        handleFilterChange({ month: newM });
    };

    const handleTodayMonth = () => {
        const newM = new Date().toISOString().slice(0, 7);
        setCurrentMonth(newM);
        handleFilterChange({ month: newM });
    };

    // Build Calendar Grid (42 cells: 6 weeks x 7 days)
    const calendarDays = useMemo(() => {
        const [year, month] = currentMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month, 0).getDate();

        const cells = [];
        // Previous month padding
        const prevMonthDays = new Date(year, month - 1, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const pMonth = month - 1 === 0 ? 12 : month - 1;
            const pYear = month - 1 === 0 ? year - 1 : year;
            const dateStr = `${pYear}-${String(pMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cells.push({ date: dateStr, day: dayNum, isCurrentMonth: false });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({ date: dateStr, day: d, isCurrentMonth: true });
        }

        // Next month padding to reach 35 or 42
        const totalNeeded = cells.length > 35 ? 42 : 35;
        let nextDay = 1;
        while (cells.length < totalNeeded) {
            const nMonth = month + 1 === 13 ? 1 : month + 1;
            const nYear = month + 1 === 13 ? year + 1 : year;
            const dateStr = `${nYear}-${String(nMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
            cells.push({ date: dateStr, day: nextDay, isCurrentMonth: false });
            nextDay++;
        }

        return cells;
    }, [currentMonth]);

    // Map events into days
    const eventsByDate = useMemo(() => {
        const map = {};
        calendar_events.forEach((evt) => {
            const start = evt.start;
            const end = evt.end;
            calendarDays.forEach((cd) => {
                if (cd.date >= start && cd.date <= end) {
                    if (!map[cd.date]) map[cd.date] = [];
                    map[cd.date].push(evt);
                }
            });
        });
        return map;
    }, [calendar_events, calendarDays]);

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'confirmed':
                return { label: 'Confirmed', color: 'primary' };
            case 'handed_over':
                return { label: 'Active Rental', color: 'warning' };
            case 'returned':
            case 'completed':
                return { label: 'Returned', color: 'success' };
            case 'cancelled':
                return { label: 'Cancelled', color: 'error' };
            case 'held':
                return { label: 'Held', color: 'secondary' };
            case 'pending_payment':
                return { label: 'Payment Due', color: 'info' };
            default:
                return { label: status, color: 'default' };
        }
    };

    const monthLabel = useMemo(() => {
        const [y, m] = currentMonth.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [currentMonth]);

    return (
        <AdminLayout title="Unified Bookings & Calendar">
            <Head title="Bookings & Calendar - Admin" />

            {/* Top Metrics Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        TOTAL BOOKINGS
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="text.primary">
                                        {stats.total ?? 0}
                                    </Typography>
                                </Box>
                                <PendingActionsIcon sx={{ color: 'primary.main', fontSize: 36 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="warning.main" fontWeight={600}>
                                        ACTIVE ON-ROAD
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="warning.main">
                                        {stats.active_rentals ?? 0}
                                    </Typography>
                                </Box>
                                <TwoWheelerIcon sx={{ color: 'warning.main', fontSize: 36 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="info.main" fontWeight={600}>
                                        TODAY'S PICKUPS
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="info.main">
                                        {stats.today_handovers ?? 0}
                                    </Typography>
                                </Box>
                                <CheckCircleIcon sx={{ color: 'info.main', fontSize: 36 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="success.main" fontWeight={600}>
                                        TODAY'S RETURNS
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                        {stats.today_returns ?? 0}
                                    </Typography>
                                </Box>
                                <AssignmentReturnIcon sx={{ color: 'success.main', fontSize: 36 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter & View Switcher Bar */}
            <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* View Mode Toggle */}
                    <Grid item xs={12} md={3}>
                        <ButtonGroup variant="outlined" size="small" fullWidth>
                            <Button
                                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                                startIcon={<ViewListIcon />}
                                onClick={() => handleViewModeChange('list')}
                            >
                                List View
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                                startIcon={<CalendarMonthIcon />}
                                onClick={() => handleViewModeChange('calendar')}
                            >
                                Calendar
                            </Button>
                        </ButtonGroup>
                    </Grid>

                    {/* Search Field */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Search Ref, Customer, Bike..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
                            }}
                        />
                    </Grid>

                    {/* Store Filter */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Store Hub"
                            value={selectedStore}
                            onChange={(e) => {
                                setSelectedStore(e.target.value);
                                handleFilterChange({ store_id: e.target.value });
                            }}
                        >
                            <MenuItem value="">All Hubs</MenuItem>
                            {stores.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name} ({s.city})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Channel Filter */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Channel"
                            value={selectedChannel}
                            onChange={(e) => {
                                setSelectedChannel(e.target.value);
                                handleFilterChange({ channel: e.target.value });
                            }}
                        >
                            <MenuItem value="">All Channels</MenuItem>
                            {channels.map((c) => (
                                <MenuItem key={c.value} value={c.value}>
                                    {c.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Status Filter */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label="Status"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            {statuses.map((s) => (
                                <MenuItem key={s.value} value={s.value}>
                                    {s.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                {/* Additional Date Row & Action Buttons */}
                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            type="date"
                            size="small"
                            label="From Date"
                            InputLabelProps={{ shrink: true }}
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                handleFilterChange({ date_from: e.target.value });
                            }}
                            sx={{ width: 155 }}
                        />
                        <TextField
                            type="date"
                            size="small"
                            label="To Date"
                            InputLabelProps={{ shrink: true }}
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                handleFilterChange({ date_to: e.target.value });
                            }}
                            sx={{ width: 155 }}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FilterListOffIcon />}
                            onClick={handleResetFilters}
                            color="inherit"
                        >
                            Reset
                        </Button>
                    </Box>

                    {viewMode === 'calendar' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<TodayIcon />} onClick={handleTodayMonth}>
                                Today
                            </Button>
                            <IconButton size="small" onClick={handlePrevMonth}>
                                <ChevronLeftIcon />
                            </IconButton>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 140, textAlign: 'center' }}>
                                {monthLabel}
                            </Typography>
                            <IconButton size="small" onClick={handleNextMonth}>
                                <ChevronRightIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Card>

            {/* ========================================================================= */}
            {/* VIEW MODE: CALENDAR */}
            {/* ========================================================================= */}
            {viewMode === 'calendar' ? (
                <Card sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    {/* Days of Week Header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'center', py: 1 }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                            <Typography key={d} variant="subtitle2" fontWeight={700} color="text.secondary">
                                {d}
                            </Typography>
                        ))}
                    </Box>

                    {/* Calendar Grid Cells */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', bgcolor: '#E2E8F0' }}>
                        {calendarDays.map((cd) => {
                            const isToday = cd.date === new Date().toISOString().slice(0, 10);
                            const dayEvents = eventsByDate[cd.date] || [];

                            return (
                                <Box
                                    key={cd.date}
                                    sx={{
                                        minHeight: 115,
                                        bgcolor: cd.isCurrentMonth ? '#FFFFFF' : '#F8FAFC',
                                        p: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'background-color 0.15s',
                                        '&:hover': { bgcolor: cd.isCurrentMonth ? '#F1F5F9' : '#F8FAFC' },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography
                                            variant="caption"
                                            fontWeight={isToday ? 800 : cd.isCurrentMonth ? 600 : 400}
                                            sx={{
                                                color: isToday ? '#FFFFFF' : cd.isCurrentMonth ? 'text.primary' : 'text.disabled',
                                                bgcolor: isToday ? 'primary.main' : 'transparent',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {cd.day}
                                        </Typography>
                                        {dayEvents.length > 0 && (
                                            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>
                                                {dayEvents.length} book{dayEvents.length > 1 ? 's' : ''}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Event Chips List */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto', maxHeight: 85 }}>
                                        {dayEvents.slice(0, 3).map((evt) => (
                                            <Box
                                                key={`${cd.date}-${evt.id}`}
                                                onClick={() => setSelectedEvent(evt)}
                                                sx={{
                                                    bgcolor: evt.color,
                                                    color: '#FFFFFF',
                                                    fontSize: 11,
                                                    px: 0.8,
                                                    py: 0.3,
                                                    borderRadius: 1,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    '&:hover': { opacity: 0.85 },
                                                }}
                                            >
                                                {evt.booking_reference} - {evt.customer_name}
                                            </Box>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <Typography
                                                variant="caption"
                                                sx={{ fontSize: 10, color: 'primary.main', fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}
                                                onClick={() => setSelectedEvent(dayEvents[0])}
                                            >
                                                +{dayEvents.length - 3} more
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Card>
            ) : (
                /* ========================================================================= */
                /* VIEW MODE: LIST */
                /* ========================================================================= */
                <Card sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Booking Ref & Channel</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Customer Details</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Bike Model</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Rental Dates</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Store Hub</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                            <Typography color="text.secondary" variant="body1">
                                                No bookings match the selected criteria.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookings.data.map((b) => {
                                        const chipProps = getStatusChipProps(b.status);
                                        return (
                                            <TableRow key={b.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700} color="primary.main">
                                                        {b.booking_reference}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        icon={b.channel === 'online' ? <LanguageIcon sx={{ fontSize: 14 }} /> : <StorefrontIcon sx={{ fontSize: 14 }} />}
                                                        label={b.channel === 'online' ? 'Online' : 'Walk-in'}
                                                        sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {b.user?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {b.user?.phone}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {b.bike?.model}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {b.bike?.registration_number}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {b.start_date}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        to {b.end_date}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {b.pickup_store?.name}
                                                    </Typography>
                                                    {b.return_store?.id !== b.pickup_store?.id && (
                                                        <Typography variant="caption" color="warning.main" display="block">
                                                            Return: {b.return_store?.name}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="small" {...chipProps} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        ₹{b.total_amount.toLocaleString('en-IN')}
                                                    </Typography>
                                                    {b.paid_amount > 0 && (
                                                        <Typography variant="caption" color="success.main" display="block">
                                                            Paid: ₹{b.paid_amount.toLocaleString('en-IN')}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="Edit Booking Details">
                                                            <IconButton
                                                                component={Link}
                                                                href={`/admin/bookings/${b.id}/edit`}
                                                                size="small"
                                                                color="primary"
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {b.paid_amount > 0 && (
                                                            <Tooltip title="Process Refund">
                                                                <IconButton
                                                                    component={Link}
                                                                    href={`/admin/bookings/${b.id}/refund`}
                                                                    size="small"
                                                                    color="secondary"
                                                                >
                                                                    <CurrencyRupeeIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {bookings.last_page > 1 && (
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                            <Pagination
                                count={bookings.last_page}
                                page={bookings.current_page}
                                onChange={(_, page) => {
                                    router.get('/admin/bookings', { ...filters, page }, { preserveState: true });
                                }}
                                color="primary"
                            />
                        </Box>
                    )}
                </Card>
            )}

            {/* Quick Event Popover / Dialog for Calendar */}
            {selectedEvent && (
                <Dialog open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                {selectedEvent.booking_reference}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedEvent.start} to {selectedEvent.end}
                            </Typography>
                        </Box>
                        <Chip size="small" {...getStatusChipProps(selectedEvent.status)} />
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ pt: 2 }}>
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <PersonIcon sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {selectedEvent.customer_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedEvent.customer_phone || 'No phone'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <TwoWheelerIcon sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {selectedEvent.bike_model}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Reg: {selectedEvent.registration_number || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <LocationOnIcon sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2">
                                        Pickup: {selectedEvent.pickup_store}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Return: {selectedEvent.return_store}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Booking Cost:
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                                    ₹{selectedEvent.total_amount?.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pt: 1 }}>
                        <Button
                            component={Link}
                            href={`/admin/bookings/${selectedEvent.id}/edit`}
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                        >
                            Edit Details
                        </Button>
                        <Button
                            component={Link}
                            href={`/admin/bookings/${selectedEvent.id}/refund`}
                            variant="contained"
                            size="small"
                            color="secondary"
                            startIcon={<CurrencyRupeeIcon />}
                        >
                            Refund
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </AdminLayout>
    );
}

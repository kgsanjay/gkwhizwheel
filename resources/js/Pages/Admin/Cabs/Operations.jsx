import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useColorMode } from '../../../theme/ColorModeContext';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    InputAdornment,
    Snackbar,
} from '@mui/material';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CancelIcon from '@mui/icons-material/Cancel';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const format = (value) =>
    value
        ? new Date(value).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

export default function CabOperations({
    dispatches = [],
    reschedules = [],
    refundReviews = [],
    bookings = [],
    vehicles = [],
    drivers = [],
    disputes = [],
    notificationEvents = [],
}) {
    const { mode } = useColorMode();
    const isDark = mode === 'dark';

    const [busy, setBusy] = useState(false);
    const [financePreview, setFinancePreview] = useState({});
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [assignment, setAssignment] = useState({
        service_booking_id: '',
        cab_vehicle_id: '',
        cab_driver_id: '',
    });
    const [reason, setReason] = useState({});
    const [dates, setDates] = useState({});
    const [confirmations, setConfirmations] = useState({});
    const [odometer, setOdometer] = useState({});
    const [disputeReviewNotes, setDisputeReviewNotes] = useState({});
    const [dispute, setDispute] = useState({
        bookingId: '',
        category: 'service_quality',
        description: '',
    });

    const submit = async (url, data, confirmation) => {
        if (busy || (confirmation && !window.confirm(confirmation))) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await axios.post(url, data);
            setNotice('Operational action recorded successfully.');
            router.reload({
                only: [
                    'dispatches',
                    'reschedules',
                    'refundReviews',
                    'disputes',
                    'notificationEvents',
                    'bookings',
                ],
            });
        } catch (e) {
            const errors = e.response?.data?.errors;
            setError(
                errors
                    ? Object.values(errors).flat().join(' ')
                    : e.response?.data?.message || 'Request could not be completed.'
            );
        } finally {
            setBusy(false);
        }
    };

    const inspectFinance = async (bookingId) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            const response = await axios.get(`/admin/cab-bookings/${bookingId}/settlement-preview`);
            setFinancePreview((prev) => ({ ...prev, [bookingId]: response.data.data }));
        } catch (e) {
            setError(e.response?.data?.message || 'Financial reconciliation was unavailable.');
        } finally {
            setBusy(false);
        }
    };

    const readyBookings = bookings.filter((b) => !dispatches.some((d) => d.service_booking_id === b.id));
    const selectedBooking = bookings.find((b) => String(b.id) === String(assignment.service_booking_id));
    const eligibleVehicles = vehicles.filter(
        (v) =>
            v.status === 'available' &&
            v.store_id === selectedBooking?.store_id &&
            v.service_item_id === selectedBooking?.service_item_id
    );
    const eligibleDrivers = drivers.filter(
        (v) =>
            v.status === 'available' &&
            v.store_id === selectedBooking?.store_id &&
            v.service_item_id === selectedBooking?.service_item_id
    );

    const activeTripsCount = dispatches.filter((d) => d.status === 'in_progress').length;
    const assignedTripsCount = dispatches.filter((d) => d.status === 'assigned').length;

    const getStatusChip = (st) => {
        switch (st) {
            case 'assigned':
                return <Chip label="Assigned" color="primary" size="small" sx={{ fontWeight: 700 }} />;
            case 'in_progress':
                return <Chip label="In Progress" color="success" size="small" sx={{ fontWeight: 700 }} />;
            case 'completed':
                return <Chip label="Completed" color="default" size="small" sx={{ fontWeight: 600 }} />;
            case 'cancelled':
                return <Chip label="Cancelled" color="error" size="small" sx={{ fontWeight: 700 }} />;
            default:
                return <Chip label={st.replaceAll('_', ' ')} size="small" sx={{ fontWeight: 600 }} />;
        }
    };

    return (
        <AdminLayout title="Taxi & Cab Operations Desk">
            <Head title="Cab Operations - Admin" />

            <Stack spacing={3.5}>
                {/* Header Section */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <LocalTaxiIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
                            >
                                Taxi Fleet & Cab Operations Desk
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Branch-scoped taxi dispatching, vehicle & driver assignment, meter readings, reschedule requests, and reconciliation audits.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Button
                            component={Link}
                            href="/admin/services/taxi/items"
                            variant="outlined"
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.primary' }}
                        >
                            Cab Fleet Items
                        </Button>
                        <Button
                            component={Link}
                            href="/admin/services/taxi/bookings"
                            variant="contained"
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5 }}
                        >
                            View Taxi Bookings
                        </Button>
                    </Stack>
                </Box>

                {/* Alerts */}
                {error && <Alert severity="error" role="alert" onClose={() => setError('')} sx={{ borderRadius: 2.5 }}>{error}</Alert>}
                {notice && <Alert severity="success" role="status" onClose={() => setNotice('')} sx={{ borderRadius: 2.5 }}>{notice}</Alert>}

                {/* KPI Metrics Ribbon */}
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Total Dispatches
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
                                {dispatches.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Assigned Drivers
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mt: 0.5 }}>
                                {assignedTripsCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <Typography variant="caption" color="success.main" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                In-Progress Trips
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                                {activeTripsCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Reschedule Requests
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ mt: 0.5 }}>
                                {reschedules.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <Typography variant="caption" color="secondary.main" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Refund Reviews
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="secondary.main" sx={{ mt: 0.5 }}>
                                {refundReviews.length}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Assignment Control Box */}
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <AssignmentIcon color="primary" />
                            <Typography variant="h6" fontWeight={800}>
                                Dispatch Allocation: Cab & Driver Assignment
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                            Only approved vehicles and verified drivers assigned to the booking's authorized branch can be dispatched.
                        </Typography>

                        <Grid container spacing={2.5} alignItems="center">
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Confirmed Taxi Booking"
                                    value={assignment.service_booking_id}
                                    onChange={(e) =>
                                        setAssignment({
                                            service_booking_id: e.target.value,
                                            cab_vehicle_id: '',
                                            cab_driver_id: '',
                                        })
                                    }
                                    helperText={readyBookings.length === 0 ? 'No unassigned confirmed bookings' : ''}
                                >
                                    {readyBookings.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            #{b.booking_number} · Hub #{b.store_id} ({b.booking_channel || 'Online'})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Eligible Cab Vehicle"
                                    value={assignment.cab_vehicle_id}
                                    disabled={!selectedBooking || eligibleVehicles.length === 0}
                                    onChange={(e) => setAssignment({ ...assignment, cab_vehicle_id: e.target.value })}
                                    helperText={selectedBooking && eligibleVehicles.length === 0 ? 'No available cabs at this branch' : ''}
                                >
                                    {eligibleVehicles.map((v) => (
                                        <MenuItem key={v.id} value={v.id}>
                                            Cab #{v.id} · {v.vehicle_class}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Eligible Cab Driver"
                                    value={assignment.cab_driver_id}
                                    disabled={!selectedBooking || eligibleDrivers.length === 0}
                                    onChange={(e) => setAssignment({ ...assignment, cab_driver_id: e.target.value })}
                                    helperText={selectedBooking && eligibleDrivers.length === 0 ? 'No available drivers at this branch' : ''}
                                >
                                    {eligibleDrivers.map((d) => (
                                        <MenuItem key={d.id} value={d.id}>
                                            {d.name} · Driver #{d.id}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, md: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    disabled={
                                        busy ||
                                        !assignment.service_booking_id ||
                                        !assignment.cab_vehicle_id ||
                                        !assignment.cab_driver_id
                                    }
                                    onClick={() =>
                                        submit(
                                            '/admin/cab-dispatches',
                                            assignment,
                                            'Assign this verified cab and driver to the selected booking?'
                                        )
                                    }
                                    sx={{ textTransform: 'none', fontWeight: 700, py: 1 }}
                                >
                                    Assign & Lock
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Dispatch Timeline */}
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                        Live Cab Dispatches ({dispatches.length})
                    </Typography>

                    {dispatches.length === 0 ? (
                        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                            <LocalTaxiIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="subtitle1" fontWeight={700}>No cab dispatch records found</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Dispatches will appear here once confirmed bookings are assigned to branch cabs and drivers.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {dispatches.map((d) => (
                                <Grid size={{ xs: 12, lg: 6 }} key={d.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                        }}
                                    >
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                                        Dispatch #{d.id}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        · Booking #{d.service_booking_id}
                                                    </Typography>
                                                </Box>
                                                {getStatusChip(d.status)}
                                            </Box>

                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Branch Hub #{d.store_id} · Cab #{d.cab_vehicle_id} · Driver #{d.cab_driver_id}
                                            </Typography>

                                            <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', mb: 2 }}>
                                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                                                    SCHEDULED TIMELINE
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3 }}>
                                                    {format(d.starts_at)} ➔ {format(d.ends_at)}
                                                </Typography>
                                            </Paper>

                                            {/* Action Bar Based on Status */}
                                            {d.status === 'assigned' && (
                                                <Stack spacing={2}>
                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                                        <TextField
                                                            size="small"
                                                            label="Start Odometer (km)"
                                                            type="number"
                                                            fullWidth
                                                            value={odometer[d.id] ?? ''}
                                                            onChange={(e) => setOdometer({ ...odometer, [d.id]: e.target.value })}
                                                            slotProps={{
                                                                input: {
                                                                    endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                                },
                                                            }}
                                                        />
                                                        <Button
                                                            disabled={busy}
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<PlayArrowIcon />}
                                                            onClick={() =>
                                                                submit(
                                                                    `/admin/cab-dispatches/${d.id}/start`,
                                                                    odometer[d.id] ? { start_odometer: Number(odometer[d.id]) } : {},
                                                                    'Start trip? This changes the booking status to In Progress.'
                                                                )
                                                            }
                                                            sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                        >
                                                            Start Trip
                                                        </Button>
                                                    </Stack>

                                                    <Box sx={{ p: 1.8, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                                        <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
                                                            Reschedule Proposal
                                                        </Typography>
                                                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                                <TextField
                                                                    size="small"
                                                                    fullWidth
                                                                    label="Proposed Start"
                                                                    type="datetime-local"
                                                                    InputLabelProps={{ shrink: true }}
                                                                    value={dates[d.id]?.start || ''}
                                                                    onChange={(e) =>
                                                                        setDates({
                                                                            ...dates,
                                                                            [d.id]: { ...dates[d.id], start: e.target.value },
                                                                        })
                                                                    }
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                                <TextField
                                                                    size="small"
                                                                    fullWidth
                                                                    label="Proposed End"
                                                                    type="datetime-local"
                                                                    InputLabelProps={{ shrink: true }}
                                                                    value={dates[d.id]?.end || ''}
                                                                    onChange={(e) =>
                                                                        setDates({
                                                                            ...dates,
                                                                            [d.id]: { ...dates[d.id], end: e.target.value },
                                                                        })
                                                                    }
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <TextField
                                                                    size="small"
                                                                    fullWidth
                                                                    label="Reason for Reschedule Request"
                                                                    value={reason[`res-${d.id}`] || ''}
                                                                    onChange={(e) =>
                                                                        setReason({ ...reason, [`res-${d.id}`]: e.target.value })
                                                                    }
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={
                                                                busy ||
                                                                !dates[d.id]?.start ||
                                                                !dates[d.id]?.end ||
                                                                (reason[`res-${d.id}`] || '').trim().length < 5
                                                            }
                                                            onClick={() =>
                                                                submit(`/admin/cab-dispatches/${d.id}/reschedule-requests`, {
                                                                    proposed_starts_at: dates[d.id].start,
                                                                    proposed_ends_at: dates[d.id].end,
                                                                    reason: reason[`res-${d.id}`],
                                                                })
                                                            }
                                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                                        >
                                                            Submit Reschedule Proposal
                                                        </Button>
                                                    </Box>

                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Cancellation Reason"
                                                            value={reason[`cancel-${d.id}`] || ''}
                                                            onChange={(e) => setReason({ ...reason, [`cancel-${d.id}`]: e.target.value })}
                                                        />
                                                        <Button
                                                            color="error"
                                                            variant="outlined"
                                                            disabled={busy || (reason[`cancel-${d.id}`] || '').trim().length < 5}
                                                            onClick={() =>
                                                                submit(
                                                                    `/admin/cab-dispatches/${d.id}/cancel`,
                                                                    { reason: reason[`cancel-${d.id}`] },
                                                                    'Cancel this cab booking and release its assigned cab/driver? This does NOT issue a refund.'
                                                                )
                                                            }
                                                            sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                        >
                                                            Cancel Before Departure
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            )}

                                            {d.status === 'in_progress' && (
                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                                                    <TextField
                                                        size="small"
                                                        label="End Odometer (km)"
                                                        type="number"
                                                        fullWidth
                                                        value={odometer[d.id] ?? ''}
                                                        onChange={(e) => setOdometer({ ...odometer, [d.id]: e.target.value })}
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                            },
                                                        }}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        disabled={busy}
                                                        startIcon={<DoneAllIcon />}
                                                        onClick={() =>
                                                            submit(
                                                                `/admin/cab-dispatches/${d.id}/complete`,
                                                                odometer[d.id] ? { end_odometer: Number(odometer[d.id]) } : {},
                                                                'Mark trip completed? This releases allocated vehicle and driver resources.'
                                                            )
                                                        }
                                                        sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                    >
                                                        Complete Trip
                                                    </Button>
                                                </Stack>
                                            )}

                                            {d.status === 'cancelled' && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            label="Refund Review Reason"
                                                            value={reason[`refund-${d.id}`] || ''}
                                                            onChange={(e) => setReason({ ...reason, [`refund-${d.id}`]: e.target.value })}
                                                        />
                                                        <Button
                                                            variant="outlined"
                                                            color="secondary"
                                                            disabled={busy || (reason[`refund-${d.id}`] || '').trim().length < 5}
                                                            onClick={() =>
                                                                submit(`/admin/cab-bookings/${d.service_booking_id}/refund-reviews`, {
                                                                    reason: reason[`refund-${d.id}`],
                                                                })
                                                            }
                                                            sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                        >
                                                            Request Refund Review
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>

                {/* Pending Reschedule Decisions */}
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                        Pending Rescheduling Decisions ({reschedules.length})
                    </Typography>

                    {reschedules.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">No pending reschedule proposals awaiting decision.</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {reschedules.map((p) => (
                                <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                                    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography fontWeight={800}>
                                                Proposal #{p.id} · Dispatch #{p.cab_dispatch_id}
                                            </Typography>
                                            <Typography variant="body2" sx={{ my: 1, fontWeight: 600 }}>
                                                {format(p.proposed_starts_at)} ➔ {format(p.proposed_ends_at)}
                                            </Typography>
                                            <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                                                Approval only supports unpaid offline trips. Confirm customer consent and unchanged fare first.
                                            </Alert>
                                            <Stack spacing={1.2}>
                                                <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!confirmations[`consent-${p.id}`]}
                                                        onChange={(e) =>
                                                            setConfirmations({ ...confirmations, [`consent-${p.id}`]: e.target.checked })
                                                        }
                                                    />
                                                    Customer consent verified
                                                </Box>
                                                <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!confirmations[`fare-${p.id}`]}
                                                        onChange={(e) =>
                                                            setConfirmations({ ...confirmations, [`fare-${p.id}`]: e.target.checked })
                                                        }
                                                    />
                                                    Unchanged fare authorized
                                                </Box>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    label="Rejection Reason"
                                                    value={reason[`reject-${p.id}`] || ''}
                                                    onChange={(e) => setReason({ ...reason, [`reject-${p.id}`]: e.target.value })}
                                                />
                                                <Stack direction="row" spacing={1.5}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        disabled={busy || !confirmations[`consent-${p.id}`] || !confirmations[`fare-${p.id}`]}
                                                        onClick={() =>
                                                            submit(
                                                                `/admin/cab-reschedule-requests/${p.id}/resolve`,
                                                                {
                                                                    decision: 'approved',
                                                                    customer_consent_confirmed: true,
                                                                    unchanged_fare_approved: true,
                                                                },
                                                                'Approve and atomically update cab and driver allocation times?'
                                                            )
                                                        }
                                                        sx={{ textTransform: 'none', fontWeight: 700 }}
                                                    >
                                                        Approve Schedule
                                                    </Button>
                                                    <Button
                                                        color="error"
                                                        variant="outlined"
                                                        disabled={busy || (reason[`reject-${p.id}`] || '').trim().length < 5}
                                                        onClick={() =>
                                                            submit(`/admin/cab-reschedule-requests/${p.id}/resolve`, {
                                                                decision: 'rejected',
                                                                reason: reason[`reject-${p.id}`],
                                                            })
                                                        }
                                                        sx={{ textTransform: 'none', fontWeight: 700 }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>

                {/* Incident / Dispute Logger */}
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <ReportProblemIcon color="warning" />
                            <Typography variant="h6" fontWeight={800}>
                                Operational Incident & Non-Financial Dispute Logger
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Internal record keeping for trip incidents, delays, or service quality remarks. Submitting does not create financial debits.
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Booking ID"
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={dispute.bookingId}
                                    onChange={(e) => setDispute({ ...dispute, bookingId: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Incident Category"
                                    value={dispute.category}
                                    onChange={(e) => setDispute({ ...dispute, category: e.target.value })}
                                >
                                    {['billing', 'refund', 'service_quality', 'schedule', 'safety', 'other'].map((v) => (
                                        <MenuItem key={v} value={v}>
                                            {v.replaceAll('_', ' ')}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    label="Incident Description (internal notes only)"
                                    value={dispute.description}
                                    inputProps={{ maxLength: 2000 }}
                                    onChange={(e) => setDispute({ ...dispute, description: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button
                                    variant="outlined"
                                    disabled={busy || Number(dispute.bookingId) < 1 || dispute.description.trim().length < 10}
                                    onClick={() =>
                                        submit(`/admin/cab-bookings/${dispute.bookingId}/disputes`, {
                                            category: dispute.category,
                                            description: dispute.description.trim(),
                                        })
                                    }
                                    sx={{ textTransform: 'none', fontWeight: 700 }}
                                >
                                    Record Incident Log
                                </Button>
                            </Grid>
                        </Grid>

                        <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 3, mb: 1 }}>
                            Recent Incident Logs ({disputes.length})
                        </Typography>
                        {disputes.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">No incident records reported.</Typography>
                        ) : (
                            <Stack spacing={1}>
                                {disputes.map((d) => (
                                    <Box
                                        key={d.id}
                                        sx={{
                                            p: 1.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: 1,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                Incident #{d.id} · Booking #{d.service_booking_id}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Category: {d.category.replaceAll('_', ' ')} · Hub #{d.store_id}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip size="small" label={d.status.replaceAll('_', ' ')} />
                                            {['open', 'reviewing'].includes(d.status) && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        submit(
                                                            `/admin/cab-disputes/${d.id}/transition`,
                                                            {
                                                                status: d.status === 'open' ? 'reviewing' : 'closed_internal',
                                                                review_notes: 'Reviewed by operations supervisor',
                                                            },
                                                            d.status === 'open' ? 'Move to reviewing?' : 'Close incident?'
                                                        )
                                                    }
                                                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                                                >
                                                    {d.status === 'open' ? 'Review' : 'Close'}
                                                </Button>
                                            )}
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </CardContent>
                </Card>

                {/* Refund Review Queue */}
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                        Refund Review Queue ({refundReviews.length})
                    </Typography>

                    {refundReviews.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">No pending cab refund reviews recorded.</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {refundReviews.map((r) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r.id}>
                                    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography fontWeight={800}>
                                                Review #{r.id} · Booking #{r.service_booking_id}
                                            </Typography>
                                            <Chip size="small" label={r.status.replaceAll('_', ' ')} sx={{ my: 1, fontWeight: 700 }} />
                                            <Typography color={r.reconciliation_required ? 'error.main' : 'text.secondary'} variant="body2" sx={{ fontWeight: 600 }}>
                                                {r.reconciliation_required ? 'Payment reconciliation required' : 'Advance matches receipts'}
                                            </Typography>
                                            <Typography variant="caption" display="block" sx={{ my: 0.5, color: 'text.secondary' }}>
                                                Internal verification only.
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={busy}
                                                onClick={() => inspectFinance(r.service_booking_id)}
                                                sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Inspect Payments
                                            </Button>

                                            {financePreview[r.service_booking_id] && (
                                                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 2 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        Receipts: ₹{(financePreview[r.service_booking_id].gateway_receipts_recorded_paise / 100).toFixed(2)}
                                                        {' · '}Advance: ₹{(financePreview[r.service_booking_id].recorded_advance_paise / 100).toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="caption" color={financePreview[r.service_booking_id].requires_manual_reconciliation ? 'warning.main' : 'text.secondary'}>
                                                        {financePreview[r.service_booking_id].issues.length
                                                            ? `Issues: ${financePreview[r.service_booking_id].issues.join(', ').replaceAll('_', ' ')}`
                                                            : 'Arithmetic matches.'}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Stack>
        </AdminLayout>
    );
}

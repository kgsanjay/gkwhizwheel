import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
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
    Alert,
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

export default function AdminDashboard({
    metrics = {},
    recent_bookings = [],
    current_store = null,
    stores = [],
}) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const userRole = user?.role || 'staff';
    const isSuperAdmin = userRole === 'super_admin';
    const isStoreManager = userRole === 'store_manager';

    const getStatusChip = (status) => {
        switch (status) {
            case 'confirmed':
                return <Chip label="Confirmed" color="info" size="small" sx={{ fontWeight: 700 }} />;
            case 'handed_over':
                return <Chip label="On Road" color="primary" size="small" sx={{ fontWeight: 700 }} />;
            case 'returned':
                return <Chip label="Returned" color="success" size="small" sx={{ fontWeight: 700 }} />;
            case 'held':
                return <Chip label="Hold Pending" color="warning" size="small" sx={{ fontWeight: 700 }} />;
            case 'cancelled':
                return <Chip label="Cancelled" color="error" size="small" sx={{ fontWeight: 700 }} />;
            default:
                return <Chip label={status} size="small" sx={{ fontWeight: 700 }} />;
        }
    };

    return (
        <AdminLayout title="Operational Dashboard" currentStore={current_store}>
            <Head title="Admin Dashboard - GkWhizWheel" />

            {/* Welcome Banner */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Welcome back, {user?.name || 'Admin'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {isSuperAdmin
                            ? 'All-store system overview and operational metrics across Karnataka hubs.'
                            : `Operational console for ${current_store?.name || 'Assigned Store Hub'}.`}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <Button
                        component={Link}
                        href="/admin/operations"
                        variant="contained"
                        color="secondary"
                        startIcon={<SwapHorizontalCircleIcon />}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                        Handover / Return
                    </Button>
                </Stack>
            </Box>

            {/* KPI Metric Cards */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {/* Active On-Road */}
                <Grid item xs={12} sm={6} md={isSuperAdmin || isStoreManager ? 2 : 3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Active Rentals
                                </Typography>
                                <Box sx={{ p: 0.8, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 2 }}>
                                    <TwoWheelerIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                {metrics.active_rentals ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                Currently on road
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Due Today: Handovers */}
                <Grid item xs={12} sm={6} md={isSuperAdmin || isStoreManager ? 2 : 3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pickups Today
                                </Typography>
                                <Box sx={{ p: 0.8, bgcolor: 'warning.50', color: 'warning.main', borderRadius: 2 }}>
                                    <SwapHorizontalCircleIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                {metrics.pending_handovers ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                                Awaiting key handover
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Due Today: Returns */}
                <Grid item xs={12} sm={6} md={isSuperAdmin || isStoreManager ? 2 : 3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Returns Today
                                </Typography>
                                <Box sx={{ p: 0.8, bgcolor: 'info.50', color: 'info.main', borderRadius: 2 }}>
                                    <AssignmentTurnedInIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                {metrics.expected_returns ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'info.dark', fontWeight: 600 }}>
                                Scheduled check-in
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Fleet Availability */}
                <Grid item xs={12} sm={6} md={isSuperAdmin || isStoreManager ? 2 : 3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Available Fleet
                                </Typography>
                                <Box sx={{ p: 0.8, bgcolor: 'success.50', color: 'success.main', borderRadius: 2 }}>
                                    <ElectricBoltIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                {metrics.fleet_available ?? 0}
                                <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5 }}>
                                    / {metrics.fleet_total ?? 0}
                                </Typography>
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Ready for instant booking
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pending KYC Queue */}
                <Grid item xs={12} sm={6} md={isSuperAdmin || isStoreManager ? 2 : 3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pending KYC
                                </Typography>
                                <Box sx={{ p: 0.8, bgcolor: 'secondary.50', color: 'secondary.main', borderRadius: 2 }}>
                                    <ContactEmergencyIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                {metrics.unverified_kyc ?? 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 600 }}>
                                Awaiting verification
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Month Revenue (Super Admin & Store Manager Only) */}
                {(isSuperAdmin || isStoreManager) && (
                    <Grid item xs={12} sm={6} md={2}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Month Revenue
                                    </Typography>
                                    <Box sx={{ p: 0.8, bgcolor: 'success.50', color: 'success.main', borderRadius: 2 }}>
                                        <CurrencyRupeeIcon fontSize="small" />
                                    </Box>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                    ₹{Number(metrics.month_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                    Collected this month
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* Recent Bookings Table */}
            <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Recent Bookings & Activity
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Live rental pipeline across active store operations
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        href="/admin/bookings"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        View All Bookings
                    </Button>
                </Box>

                <Divider />

                <TableContainer>
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Booking Ref</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Vehicle</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Pickup / Return</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Trip Dates</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recent_bookings.length > 0 ? (
                                recent_bookings.map((b) => (
                                    <TableRow key={b.id} hover>
                                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            {b.booking_reference}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {b.user?.name || 'Walk-in Customer'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {b.user?.phone}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {b.bike?.brand} {b.bike?.model_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {b.bike?.registration_number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {b.pickup_store?.name || 'Hub'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                                {b.start_date} to {b.end_date}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(b.status)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No recent bookings found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </AdminLayout>
    );
}

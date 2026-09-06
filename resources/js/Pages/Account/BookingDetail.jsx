import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import apiClient from '../../api/client';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DescriptionIcon from '@mui/icons-material/Description';
import CancelIcon from '@mui/icons-material/Cancel';
import UpdateIcon from '@mui/icons-material/Update';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PhoneIcon from '@mui/icons-material/Phone';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function AccountBookingDetail({ booking }) {
    const [bikeDocs, setBikeDocs] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [docsError, setDocsError] = useState(null);

    // Cancel modal state
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState('');

    // Extend modal state
    const [extendModalOpen, setExtendModalOpen] = useState(false);
    const [newEndDate, setNewEndDate] = useState('');
    const [extendLoading, setExtendLoading] = useState(false);
    const [extendError, setExtendError] = useState('');

    const bike = booking.bike || {};
    const pickupStore = booking.pickup_store || {};
    const returnStore = booking.return_store || {};
    const isOneWay = pickupStore.id !== returnStore.id;
    const addons = booking.addons || [];
    const payments = booking.payments || [];
    const refunds = booking.refunds || [];

    const activeStatuses = ['held', 'pending_payment', 'confirmed', 'handed_over'];
    const isActive = activeStatuses.includes(booking.status);
    const canCancel = ['held', 'pending_payment', 'confirmed'].includes(booking.status);
    const canExtend = ['confirmed', 'handed_over'].includes(booking.status);

    // Fetch legal bike documents per Section 5
    useEffect(() => {
        if (!isActive) return;
        setDocsLoading(true);
        apiClient
            .get(`/bookings/${booking.id}/documents`)
            .then((res) => {
                setBikeDocs(res.data?.documents || []);
            })
            .catch((err) => {
                setDocsError(err.message || 'Unable to retrieve bike legal documents.');
            })
            .finally(() => {
                setDocsLoading(false);
            });
    }, [booking.id, booking.status]);

    // Handle cancel submission
    const handleCancelSubmit = async (e) => {
        e.preventDefault();
        setCancelLoading(true);
        setCancelError('');

        try {
            await apiClient.post(`/bookings/${booking.id}/cancel`, {
                reason: cancelReason || 'Customer requested cancellation from account portal',
            });
            setCancelModalOpen(false);
            router.reload();
        } catch (err) {
            setCancelError(err.message || 'Cancellation failed. Please contact support.');
        } finally {
            setCancelLoading(false);
        }
    };

    // Handle extension submission
    const handleExtendSubmit = async (e) => {
        e.preventDefault();
        setExtendLoading(true);
        setExtendError('');

        try {
            await apiClient.post(`/bookings/${booking.id}/extend`, {
                new_end_date: newEndDate,
            });
            setExtendModalOpen(false);
            router.reload();
        } catch (err) {
            setExtendError(err.message || 'Unable to extend booking. The bike might be booked on the requested dates.');
        } finally {
            setExtendLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Booking ${booking.booking_reference} - GK WhizWheel`} />

            {/* Back Bar & Quick Actions */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Button component={Link} href="/account" startIcon={<ArrowBackIcon />} sx={{ color: '#64748B', fontWeight: 600 }}>
                    Back to My Bookings
                </Button>

                <Stack direction="row" spacing={1.5}>
                    {canExtend && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<UpdateIcon />}
                            onClick={() => setExtendModalOpen(true)}
                            sx={{ fontWeight: 700 }}
                        >
                            Extend Rental
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => setCancelModalOpen(true)}
                            sx={{ fontWeight: 600 }}
                        >
                            Cancel Booking
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Top Status Header */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                Booking #{booking.booking_reference}
                            </Typography>
                            <Chip
                                label={booking.status?.toUpperCase()}
                                color={
                                    booking.status === 'confirmed' || booking.status === 'handed_over'
                                        ? 'success'
                                        : booking.status === 'cancelled'
                                        ? 'error'
                                        : 'default'
                                }
                                sx={{ fontWeight: 700 }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                            Reserved on {booking.start_date} • {booking.channel?.toUpperCase()} Channel
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            Total Charged
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ₹{Number(booking.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={4}>
                {/* Left Column: Vehicle, Schedule, and Bike Legal Documents */}
                <Grid item xs={12} md={7}>
                    {/* Vehicle Card */}
                    <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>
                                Reserved Two-Wheeler
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2.5 }}>
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2.5,
                                        bgcolor: '#0F172A',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <TwoWheelerIcon sx={{ fontSize: 44, color: '#F59E0B' }} />
                                </Box>

                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {bike.brand} {bike.model_name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                                        {bike.category?.name || 'Standard'} • {bike.fuel_type?.toUpperCase()} • {bike.transmission?.toUpperCase()}
                                    </Typography>
                                    <Chip
                                        label={bike.registration_number}
                                        size="small"
                                        sx={{
                                            mt: 0.8,
                                            bgcolor: '#F1F5F9',
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Trip Hubs */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <LocationOnIcon sx={{ color: '#10B981', fontSize: 20 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                Pick-up Store
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {pickupStore.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                            {pickupStore.address_line}, {pickupStore.city}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A', display: 'block', mt: 1 }}>
                                            Date: {booking.start_date}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <LocationOnIcon sx={{ color: '#EA580C', fontSize: 20 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                Drop-off Store {isOneWay && '(One-Way)'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {returnStore.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                            {returnStore.address_line}, {returnStore.city}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A', display: 'block', mt: 1 }}>
                                            Date: {booking.end_date}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Section 5: Bike Legal Documents Feature */}
                    <Paper elevation={0} sx={{ p: 3, mb: 4, border: '2px solid #F59E0B', borderRadius: 3, bgcolor: '#FFFFFF' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <DescriptionIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                    Vehicle Legal Documents (Roadside Inspection)
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    RC, Insurance, and Emission Certificate for this booked bike per Section 5 requirements.
                                </Typography>
                            </Box>
                        </Box>

                        {docsLoading && (
                            <Box sx={{ py: 3, textAlign: 'center' }}>
                                <CircularProgress size={24} color="secondary" />
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748B' }}>
                                    Generating temporary signed document links...
                                </Typography>
                            </Box>
                        )}

                        {docsError && (
                            <Alert severity="warning" sx={{ my: 1.5 }}>
                                {docsError}
                            </Alert>
                        )}

                        {!docsLoading && bikeDocs.length === 0 && !docsError && (
                            <Alert severity="info" sx={{ my: 1.5 }}>
                                Bike documents are active and verified. Staff will provide physical copies during handover.
                            </Alert>
                        )}

                        {!docsLoading && bikeDocs.length > 0 && (
                            <Stack spacing={1.5} sx={{ mt: 2 }}>
                                {bikeDocs.map((doc) => (
                                    <Paper
                                        key={doc.id}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            bgcolor: '#F8FAFC',
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                                    {doc.document_type.replace('_', ' ')}
                                                </Typography>
                                                {doc.verified && (
                                                    <Chip label="Verified" size="small" color="success" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }} />
                                                )}
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                {doc.expiry_date ? `Valid until ${doc.expiry_date}` : 'Standard active certificate'}
                                            </Typography>
                                        </Box>

                                        <Button
                                            component="a"
                                            href={doc.temporary_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="outlined"
                                            size="small"
                                            color="primary"
                                            endIcon={<OpenInNewIcon fontSize="small" />}
                                            sx={{ fontWeight: 600 }}
                                        >
                                            View Document
                                        </Button>
                                    </Paper>
                                ))}

                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                                    🛡️ <em>Links are cryptographically signed and expire automatically to protect fleet credentials.</em>
                                </Typography>
                            </Stack>
                        )}
                    </Paper>
                </Grid>

                {/* Right Column: Itemized Receipt & Payment History */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', mb: 3 }}>
                        <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptLongIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                Itemized Financial Receipt
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B' }}>Base Rental</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            ₹{Number(booking.base_amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>

                                    {Number(booking.pricing_adjustments_amount) > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#64748B' }}>Adjustments</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#EA580C' }}>
                                                + ₹{Number(booking.pricing_adjustments_amount).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {Number(booking.one_way_fee_amount) > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#64748B' }}>One-Way Store Fee</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#EA580C' }}>
                                                + ₹{Number(booking.one_way_fee_amount).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {addons.length > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#64748B' }}>Add-ons ({addons.length})</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                + ₹{Number(booking.addon_amount).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {Number(booking.discount_amount) > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ color: '#10B981' }}>Coupon Discount</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: '#10B981' }}>
                                                - ₹{Number(booking.discount_amount).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    <TableRow>
                                        <TableCell sx={{ color: '#64748B' }}>Refundable Deposit</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            ₹{Number(booking.deposit_amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem', pt: 2 }}>
                                            Total Amount
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.25rem', pt: 2 }}>
                                            ₹{Number(booking.total_amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* Payment Records */}
                            {payments.length > 0 && (
                                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
                                        Transactions:
                                    </Typography>
                                    {payments.map((p) => (
                                        <Paper key={p.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    ₹{Number(p.amount).toFixed(2)} • {p.method?.toUpperCase()}
                                                </Typography>
                                                <Chip label={p.status} size="small" color={p.status === 'success' ? 'success' : 'default'} />
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>
                                                Ref: {p.gateway_reference || 'In-store'}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            )}

                            {/* Refunds History */}
                            {refunds.length > 0 && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', display: 'block', mb: 1 }}>
                                        Refunds Processed:
                                    </Typography>
                                    {refunds.map((r) => (
                                        <Alert key={r.id} severity="success" sx={{ mb: 1 }}>
                                            Refund of <strong>₹{Number(r.amount).toFixed(2)}</strong> ({r.status})
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Cancel Modal */}
            <Dialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Cancel Booking
                    </Typography>
                    <IconButton size="small" onClick={() => setCancelModalOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleCancelSubmit}>
                    <DialogContent dividers>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <strong>Cancellation Policy:</strong> Cancellations made &gt;24 hours before pickup receive a 100% rental + deposit refund. Cancellations within 24 hours receive partial refund per policy.
                        </Alert>
                        {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Reason for Cancellation"
                            placeholder="e.g. Plans changed / illness"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setCancelModalOpen(false)} disabled={cancelLoading}>
                            Keep Booking
                        </Button>
                        <Button type="submit" variant="contained" color="error" disabled={cancelLoading} sx={{ fontWeight: 700 }}>
                            {cancelLoading ? <CircularProgress size={22} color="inherit" /> : 'Confirm Cancellation'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Extend Modal */}
            <Dialog open={extendModalOpen} onClose={() => setExtendModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Extend Rental Trip
                    </Typography>
                    <IconButton size="small" onClick={() => setExtendModalOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleExtendSubmit}>
                    <DialogContent dividers>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Current return date is <strong>{booking.end_date}</strong>. Choose a new return date to extend your trip:
                        </Typography>
                        {extendError && <Alert severity="error" sx={{ mb: 2 }}>{extendError}</Alert>}
                        <TextField
                            fullWidth
                            type="date"
                            label="New Return Date"
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: booking.end_date }}
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setExtendModalOpen(false)} disabled={extendLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="secondary" disabled={extendLoading} sx={{ fontWeight: 700 }}>
                            {extendLoading ? <CircularProgress size={22} color="inherit" /> : 'Check Availability & Extend'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </AppLayout>
    );
}

import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Divider,
    Alert,
    CircularProgress,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    FormControlLabel,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PolicyIcon from '@mui/icons-material/Policy';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';

export default function BookingsRefund({
    booking = {},
    calculation = {},
    total_paid = 0,
    total_refunded = 0,
    max_refundable = 0,
}) {
    const defaultRefund = Math.min(calculation.refund_amount || 0, max_refundable);

    const { data, setData, post, processing, errors } = useForm({
        amount: defaultRefund > 0 ? defaultRefund : max_refundable,
        reason: '',
        payment_id: booking.payments?.[0]?.id || '',
        mark_cancelled: booking.status !== 'cancelled' && booking.status !== 'returned',
    });

    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleExecuteRefund = () => {
        setConfirmOpen(false);
        post(`/admin/bookings/${booking.id}/refund`);
    };

    return (
        <AdminLayout title={`Process Refund: ${booking.booking_reference}`}>
            <Head title={`Process Refund: ${booking.booking_reference} - Admin`} />

            {/* Top Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Button
                    component={Link}
                    href="/admin/bookings"
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    size="small"
                >
                    Back to Bookings
                </Button>
                <Typography variant="h5" fontWeight={700}>
                    Refund Processing: {booking.booking_reference}
                </Typography>
                <Chip label={booking.status} color="primary" size="small" />
            </Box>

            {/* Error alerts */}
            {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Please review the refund errors:
                    <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                        {Object.entries(errors).map(([f, msg]) => (
                            <li key={f}>{msg}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {/* Policy Calculation Alert */}
            <Alert
                icon={<PolicyIcon fontSize="inherit" />}
                severity={calculation.is_full_refund ? 'success' : calculation.refund_percentage > 0 ? 'warning' : 'info'}
                sx={{ mb: 3 }}
            >
                <Typography variant="subtitle2" fontWeight={700}>
                    Cancellation Policy Analysis
                </Typography>
                <Typography variant="body2">
                    {calculation.hours_until_pickup >= 24 ? (
                        <>Scheduled pickup is in <b>{Math.round(calculation.hours_until_pickup)} hours</b> (&ge; 24h). Eligible for <b>100% full refund</b> of rental fees + 100% security deposit.</>
                    ) : calculation.hours_until_pickup > 0 ? (
                        <>Scheduled pickup is in <b>{Math.round(calculation.hours_until_pickup)} hours</b> (&lt; 24h). Under standard policy, <b>{calculation.refund_percentage}% partial refund</b> of rental fees is applied, plus 100% security deposit.</>
                    ) : (
                        <>Pickup date has passed or trip has started. Under standard policy, <b>0% rental refund</b> applies. Security deposit (₹{booking.deposit_amount}) is refundable after vehicle return inspection.</>
                    )}
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                {/* Refund Action Card */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CurrencyRupeeIcon color="secondary" />
                                <Typography variant="h6" fontWeight={700}>
                                    Issue Refund
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Stack spacing={2.5}>
                                {/* Quick Fill Buttons */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setData('amount', Math.min(calculation.refund_amount || 0, max_refundable))}
                                    >
                                        Apply Policy Amount (₹{Math.min(calculation.refund_amount || 0, max_refundable)})
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setData('amount', max_refundable)}
                                    >
                                        Full Available Balance (₹{max_refundable})
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setData('amount', Math.min(booking.deposit_amount || 0, max_refundable))}
                                    >
                                        Deposit Only (₹{Math.min(booking.deposit_amount || 0, max_refundable)})
                                    </Button>
                                </Box>

                                {/* Refund Amount Input */}
                                <TextField
                                    label="Refund Amount (₹)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    error={Boolean(errors.amount)}
                                    helperText={errors.amount || `Maximum refundable balance: ₹${max_refundable}`}
                                    slotProps={{
                                        htmlInput: { min: 0.01, max: max_refundable, step: 'any' },
                                    }}
                                    InputProps={{
                                        inputProps: { min: 0.01, max: max_refundable, step: 'any' },
                                    }}
                                />

                                {/* Linked Payment */}
                                {booking.payments && booking.payments.length > 0 && (
                                    <TextField
                                        select
                                        label="Source Payment Transaction"
                                        fullWidth
                                        value={data.payment_id}
                                        onChange={(e) => setData('payment_id', e.target.value)}
                                        error={Boolean(errors.payment_id)}
                                        helperText={errors.payment_id || 'Select the original transaction to credit against'}
                                    >
                                        {booking.payments.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.gateway?.toUpperCase() || 'PAYMENT'} - ₹{p.amount} ({p.status}) - ID: {p.transaction_id || p.id}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                {/* Mark Cancelled Checkbox */}
                                {booking.status !== 'cancelled' && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={data.mark_cancelled}
                                                onChange={(e) => setData('mark_cancelled', e.target.checked)}
                                                color="secondary"
                                            />
                                        }
                                        label="Mark booking status as Cancelled"
                                    />
                                )}

                                {/* Submit Button */}
                                <Box sx={{ pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                                    <Button
                                        component={Link}
                                        href="/admin/bookings"
                                        variant="outlined"
                                        color="inherit"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        disabled={processing || max_refundable <= 0 || !data.amount || !data.reason}
                                        onClick={() => setConfirmOpen(true)}
                                        startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <CurrencyRupeeIcon />}
                                    >
                                        Execute Refund of ₹{data.amount || 0}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Financial Overview Card */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={3}>
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ReceiptIcon color="primary" /> Payment Ledger
                                </Typography>

                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Customer</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>{booking.user?.name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Bike Model</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>{booking.bike?.model}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Total Booking Cost</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.total_amount?.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Rental Portion</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.rental_amount?.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, color: 'text.secondary' }}>Security Deposit</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>₹{booking.deposit_amount?.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, fontWeight: 600, color: 'success.main' }}>Total Successfully Paid</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 700, color: 'success.main' }}>
                                                ₹{total_paid.toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ pl: 0, fontWeight: 600, color: 'error.main' }}>Total Previously Refunded</TableCell>
                                            <TableCell align="right" sx={{ pr: 0, fontWeight: 700, color: 'error.main' }}>
                                                -₹{total_refunded.toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell sx={{ pl: 1, fontWeight: 700 }}>Max Refundable Balance</TableCell>
                                            <TableCell align="right" sx={{ pr: 1, fontWeight: 700, fontSize: 16, color: 'secondary.main' }}>
                                                ₹{max_refundable.toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Past Refunds History */}
                        {booking.refunds && booking.refunds.length > 0 && (
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <HistoryIcon color="info" /> Refund History
                                    </Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ pl: 0, fontWeight: 600 }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                                                <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {booking.refunds.map((r) => (
                                                <TableRow key={r.id}>
                                                    <TableCell sx={{ pl: 0 }}>{r.created_at?.slice(0, 10)}</TableCell>
                                                    <TableCell>{r.reason}</TableCell>
                                                    <TableCell align="right" sx={{ pr: 0, fontWeight: 600, color: 'error.main' }}>
                                                        ₹{r.amount}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm Refund Execution</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to process an immediate refund of <b>₹{data.amount}</b> for booking <b>{booking.booking_reference}</b>?
                        This will record the transaction in the ledger and trigger the payment gateway credit.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setConfirmOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecuteRefund}
                        variant="contained"
                        color="secondary"
                        disabled={processing}
                    >
                        Confirm & Process
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}

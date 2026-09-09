import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
    Grid,
    Stack,
    Divider,
    Paper,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentsIcon from '@mui/icons-material/Payments';

export default function ServiceBookingShow({ serviceConfig = {}, booking = {} }) {
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const { data: statusData, setData: setStatusData, post: postStatus, processing: statusProcessing } = useForm({
        status: booking.status || 'confirmed',
        admin_notes: booking.admin_notes || '',
    });

    const { data: payData, setData: setPayData, post: postPayment, processing: payProcessing, reset: resetPayment } = useForm({
        amount: booking.balance_due > 0 ? booking.balance_due : '',
        payment_method: 'cash',
        notes: '',
    });

    const handleStatusSubmit = (e) => {
        e.preventDefault();
        postStatus(`/admin/services/${serviceConfig.slug}/bookings/${booking.id}/status`);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        postPayment(`/admin/services/${serviceConfig.slug}/bookings/${booking.id}/payment`, {
            onSuccess: () => {
                setPaymentModalOpen(false);
                resetPayment();
            },
        });
    };

    const formatDate = (dt) => {
        if (!dt) return '—';
        try {
            return new Date(dt).toLocaleString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dt;
        }
    };

    const getStatusChip = (st) => {
        switch (st) {
            case 'confirmed':
                return <Chip label="Confirmed" color="primary" sx={{ fontWeight: 800 }} />;
            case 'in_progress':
                return <Chip label="In Progress / Active" color="warning" sx={{ fontWeight: 800 }} />;
            case 'completed':
                return <Chip label="Completed" color="success" sx={{ fontWeight: 800 }} />;
            case 'cancelled':
                return <Chip label="Cancelled" color="error" sx={{ fontWeight: 800 }} />;
            default:
                return <Chip label={st} />;
        }
    };

    return (
        <AdminLayout title={`Booking #${booking.booking_number}`}>
            <Head title={`Booking #${booking.booking_number} - ${serviceConfig.title}`} />

            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
                {/* Header Back & Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
                    <Box>
                        <Button
                            component={Link}
                            href={`/admin/services/${serviceConfig.slug}/bookings`}
                            startIcon={<ArrowBackIcon />}
                            sx={{ textTransform: 'none', color: 'text.secondary', mb: 1 }}
                        >
                            Back to {serviceConfig.title} Bookings
                        </Button>
                        <Typography variant="h5" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {booking.booking_number} {getStatusChip(booking.status)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            Booked on {formatDate(booking.created_at)} • Source: {booking.booking_channel?.replace('_', ' ').toUpperCase()}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            component="a"
                            href={`/admin/services/${serviceConfig.slug}/bookings/${booking.id}/voucher`}
                            download
                            startIcon={<DownloadIcon />}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                            PDF Voucher
                        </Button>
                        <Button
                            variant="outlined"
                            component="a"
                            href={`/services/bookings/${booking.booking_number}/print`}
                            target="_blank"
                            startIcon={<PrintIcon />}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                            Print Pass
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            component="a"
                            href={`https://wa.me/91${booking.customer_phone}?text=Hello%20${encodeURIComponent(booking.customer_name)},%20this%20is%20GK%20WhizWheels%20Honnavar%20regarding%20your%20${encodeURIComponent(serviceConfig.title)}%20booking%20#${booking.booking_number}.`}
                            target="_blank"
                            rel="noreferrer"
                            startIcon={<WhatsAppIcon />}
                            sx={{ fontWeight: 800, textTransform: 'none' }}
                        >
                            WhatsApp Customer
                        </Button>
                    </Stack>
                </Box>

                <Grid container spacing={3}>
                    {/* Left Column: Customer & Service Details */}
                    <Grid item xs={12} md={7}>
                        {/* Package / Service Item Card */}
                        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2 }}>
                                    Reserved Service Package
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    {booking.service_item?.image_url && (
                                        <Box
                                            component="img"
                                            src={booking.service_item.image_url}
                                            alt={booking.service_item.name}
                                            sx={{ width: 100, height: 75, borderRadius: 2, objectFit: 'cover' }}
                                        />
                                    )}
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                            {booking.service_item?.name || 'Custom Package'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Category: {booking.service_item?.category || 'Standard'} • Units / Pax: {booking.quantity}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 800, mt: 0.5 }}>
                                            Base Rate: ₹{parseFloat(booking.base_amount).toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Customer Information Card */}
                        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon fontSize="small" /> Customer Profile
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Full Name</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{booking.customer_name}</Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phone Number</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PhoneIcon sx={{ fontSize: 15, color: 'success.main' }} /> +91 {booking.customer_phone}
                                        </Typography>
                                    </Grid>

                                    {booking.customer_email && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Email Address</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{booking.customer_email}</Typography>
                                        </Grid>
                                    )}

                                    {booking.creator && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Booked By Staff</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{booking.creator.name} (Hub Staff)</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Schedule & Pickup Point */}
                        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarMonthIcon fontSize="small" /> Schedule & Transit Locations
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Start Date & Time</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{formatDate(booking.start_datetime)}</Typography>
                                    </Grid>

                                    {booking.end_datetime && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>End Date & Time</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{formatDate(booking.end_datetime)}</Typography>
                                        </Grid>
                                    )}

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Pickup Point</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <LocationOnIcon sx={{ fontSize: 16, color: 'secondary.main' }} /> {booking.pickup_location || 'Palya Main Rd Hub'}
                                        </Typography>
                                    </Grid>

                                    {booking.drop_location && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Drop Destination</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{booking.drop_location}</Typography>
                                        </Grid>
                                    )}
                                </Grid>

                                {booking.customer_notes && (
                                    <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                            Customer Instructions / Requests:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            {booking.customer_notes}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column: Financials, Balance Collection & Operations Status */}
                    <Grid item xs={12} md={5}>
                        {/* Financial Card */}
                        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2 }}>
                                    Billing & Settlement
                                </Typography>

                                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Base Amount</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{parseFloat(booking.base_amount).toLocaleString('en-IN')}</Typography>
                                    </Box>

                                    {parseFloat(booking.discount_amount) > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'error.main' }}>Discount Applied</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>-₹{parseFloat(booking.discount_amount).toLocaleString('en-IN')}</Typography>
                                        </Box>
                                    )}

                                    <Divider />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total Payable</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>₹{parseFloat(booking.total_amount).toLocaleString('en-IN')}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>Advance Collected</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>₹{parseFloat(booking.advance_paid).toLocaleString('en-IN')}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: parseFloat(booking.balance_due) > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: parseFloat(booking.balance_due) > 0 ? 'error.main' : 'success.main' }}>
                                            Balance Remaining
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: parseFloat(booking.balance_due) > 0 ? 'error.main' : 'success.main' }}>
                                            ₹{parseFloat(booking.balance_due).toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                </Stack>

                                {parseFloat(booking.balance_due) > 0 && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        fullWidth
                                        startIcon={<PaymentsIcon />}
                                        onClick={() => setPaymentModalOpen(true)}
                                        sx={{ fontWeight: 800, textTransform: 'none', py: 1 }}
                                    >
                                        Record Balance Collection (₹{parseFloat(booking.balance_due).toLocaleString('en-IN')})
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Updater Card */}
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2 }}>
                                    Manage Operational Status
                                </Typography>

                                <Box component="form" onSubmit={handleStatusSubmit}>
                                    <TextField
                                        select
                                        label="Change Booking Status"
                                        fullWidth
                                        value={statusData.status}
                                        onChange={(e) => setStatusData('status', e.target.value)}
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="confirmed">Confirmed (Scheduled)</MenuItem>
                                        <MenuItem value="in_progress">In Progress (Tour / Ride Active)</MenuItem>
                                        <MenuItem value="completed">Completed (Trip Finished)</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </TextField>

                                    <TextField
                                        label="Staff / Operations Log Notes"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        value={statusData.admin_notes}
                                        onChange={(e) => setStatusData('admin_notes', e.target.value)}
                                        placeholder="Record boat assignment, driver phone, feedback..."
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={statusProcessing}
                                        sx={{ fontWeight: 800, textTransform: 'none' }}
                                    >
                                        {statusProcessing ? 'Updating...' : 'Update Status & Notes'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Collect Payment Modal */}
            <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Collect Balance Payment</DialogTitle>
                <Box component="form" onSubmit={handlePaymentSubmit}>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Record cash or UPI payment collected from customer at the hub or trip start.
                        </Typography>

                        <TextField
                            label="Amount Collected (₹)"
                            type="number"
                            required
                            fullWidth
                            value={payData.amount}
                            onChange={(e) => setPayData('amount', e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            select
                            label="Payment Mode"
                            required
                            fullWidth
                            value={payData.payment_method}
                            onChange={(e) => setPayData('payment_method', e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="cash">Cash at Counter</MenuItem>
                            <MenuItem value="upi">UPI / GPay / PhonePe</MenuItem>
                            <MenuItem value="card">Card POS</MenuItem>
                        </TextField>

                        <TextField
                            label="Reference / Transaction Note"
                            fullWidth
                            value={payData.notes}
                            onChange={(e) => setPayData('notes', e.target.value)}
                            placeholder="e.g. UPI Ref #402919, collected by Santosh"
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setPaymentModalOpen(false)} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={payProcessing}
                            sx={{ fontWeight: 800, textTransform: 'none' }}
                        >
                            {payProcessing ? 'Recording...' : 'Confirm Payment'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </AdminLayout>
    );
}

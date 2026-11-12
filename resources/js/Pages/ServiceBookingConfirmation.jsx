import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Grid,
    Stack,
    Divider,
    Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DirectionsIcon from '@mui/icons-material/Directions';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ShieldIcon from '@mui/icons-material/Shield';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';


export default function ServiceBookingConfirmation({ booking = {}, coordinator = {}, razorpayKey = '' }) {
    const [currentBooking, setCurrentBooking] = React.useState(booking);
    const [gateway, setGateway] = React.useState('phonepe');
    const [paying, setPaying] = React.useState(false);
    const [paySuccessMsg, setPaySuccessMsg] = React.useState('');
    const [payErrorMsg, setPayErrorMsg] = React.useState('');

    // Load Razorpay checkout script dynamically
    React.useEffect(() => {
        const existingScript = document.getElementById('razorpay-checkout-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'razorpay-checkout-script';
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const balanceDue = parseFloat(currentBooking.balance_due || 0);
    const advancePaid = parseFloat(currentBooking.advance_paid || 0);
    const isFullyPaid = currentBooking.payment_status === 'paid';
    const isConfirmed = ['confirmed', 'in_progress', 'completed'].includes(currentBooking.status);
    const isInactive = ['cancelled', 'expired'].includes(currentBooking.status);
    const isPayable = ['confirmed', 'in_progress'].includes(currentBooking.status) && balanceDue > 0 && !isFullyPaid;
    const isVoucherAvailable = isConfirmed && !isInactive;

    const handlePayOnline = async (payAmount = null) => {
        const amountToPay = payAmount || balanceDue;
        if (amountToPay <= 0 || !isPayable) return;

        setPaying(true);
        setPayErrorMsg('');
        setPaySuccessMsg('');

        try {
            const initRes = await window.axios.post(`/services/bookings/${currentBooking.booking_number}/initiate-payment`, {
                amount: amountToPay,
                gateway: gateway,
            });

            if (!initRes.data || !initRes.data.success) {
                throw new Error(initRes.data?.message || 'Could not initiate online payment.');
            }

            if (initRes.data.gateway === 'phonepe' && initRes.data.redirect_url) {
                window.location.href = initRes.data.redirect_url;
                return;
            }

            const { order, key_id, customer } = initRes.data;

            // If Razorpay SDK loaded and valid key (live/test)
            if (window.Razorpay && key_id && !key_id.includes('placeholder')) {
                const options = {
                    key: key_id,
                    amount: order.amount,
                    currency: order.currency || 'INR',
                    name: 'GK WhizWheels',
                    description: `Booking #${currentBooking.booking_number}`,
                    order_id: order.id,
                    prefill: {
                        name: customer?.name || '',
                        contact: customer?.phone || '',
                        email: customer?.email || '',
                    },
                    theme: { color: '#0F172A' },
                    handler: async (response) => {
                        try {
                            const verifyRes = await window.axios.post(`/services/bookings/${currentBooking.booking_number}/verify-payment`, {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                amount: amountToPay,
                            });
                            if (verifyRes.data.success) {
                                setCurrentBooking(verifyRes.data.booking);
                                setPaySuccessMsg(`Payment of ₹${amountToPay.toLocaleString('en-IN')} confirmed! Your receipt has been updated.`);
                            }
                        } catch (err) {
                            setPayErrorMsg('Payment verification failed. Please contact support.');
                        } finally {
                            setPaying(false);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setPaying(false);
                        },
                    },
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                throw new Error('Secure payment checkout is not configured. Please contact the service team; no payment was taken.');
            }
        } catch (err) {
            setPayErrorMsg(err.response?.data?.message || err.message || 'Payment initiation failed.');
            setPaying(false);
        }
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

    const serviceTitle = (currentBooking.service_type || '').replace('_', ' ').toUpperCase();

    return (
        <AppLayout>
            <Head title={`Service Booking ${currentBooking.booking_number} - GK WhizWheels`} />

            <Box sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, sm: 4 }, maxWidth: 850, mx: 'auto' }}>
                {/* Success Banner */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            bgcolor: isInactive ? 'rgba(220, 38, 38, 0.10)' : isConfirmed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isInactive ? '#DC2626' : isConfirmed ? '#10B981' : '#B45309',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        {isInactive ? <LockIcon sx={{ fontSize: 44 }} /> : <CheckCircleIcon sx={{ fontSize: 44 }} />}
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mb: 1 }}>
                        {isConfirmed ? 'Booking Confirmed' : currentBooking.status === 'held' ? 'Reservation Held' : currentBooking.status === 'pending_payment' ? 'Awaiting Payment' : currentBooking.status === 'cancelled' ? 'Booking Cancelled' : currentBooking.status === 'expired' ? 'Hold Expired' : 'Booking Status'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto' }}>
                        {isConfirmed ? 'Your reservation is confirmed. Review your service details and remaining balance.' : 'This service is not confirmed. Please check its current status before travelling or making a payment.'}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <Chip
                            label={`BOOKING REF: ${currentBooking.booking_number}`}
                            sx={{
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                py: 2.2,
                                px: 1,
                                bgcolor: '#0F172A',
                                color: '#F59E0B',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                letterSpacing: '0.05em',
                            }}
                        />

                        <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                component="a"
                                href={`/services/bookings/${currentBooking.booking_number}/voucher`}
                                disabled={!isVoucherAvailable}
                                download
                                startIcon={<DownloadIcon />}
                                size="small"
                                sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, fontWeight: 800, textTransform: 'none', px: 2, py: 0.8, borderRadius: 2 }}
                            >
                                Download Trip Voucher (PDF)
                            </Button>
                            <Button
                                variant="outlined"
                                component="a"
                                href={`/services/bookings/${currentBooking.booking_number}/print`}
                                disabled={!isVoucherAvailable}
                                target="_blank"
                                startIcon={<PrintIcon />}
                                size="small"
                                sx={{ fontWeight: 700, textTransform: 'none', px: 2, py: 0.8, borderRadius: 2 }}
                            >
                                Print Pass
                            </Button>
                        </Stack>
                    </Box>
                </Box>

                {paySuccessMsg && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
                        {paySuccessMsg}
                    </Alert>
                )}
                {payErrorMsg && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                        {payErrorMsg}
                    </Alert>
                )}

                {/* Operational Trip Status Stepper */}
                <Box sx={{ mb: 3, p: 2.5, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Live Trip & Dispatch Progress
                        </Typography>
                        <Chip
                            label={`STATUS: ${(currentBooking.status || 'unknown').toUpperCase()}`}
                            size="small"
                            color={currentBooking.status === 'completed' ? 'success' : currentBooking.status === 'in_progress' ? 'info' : currentBooking.status === 'cancelled' ? 'error' : 'default'}
                            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        />
                    </Box>
                    <Grid container spacing={1.5} alignItems="center">
                        {[
                            {
                                step: 1,
                                label: 'Reservation Confirmed',
                                desc: isConfirmed ? 'Reservation confirmed' : 'Awaiting confirmation',
                                active: isConfirmed,
                                completed: isConfirmed,
                            },
                            {
                                step: 2,
                                label: 'Desk & Crew Dispatched',
                                desc: 'Assignment details are provided when verified',
                                active: false,
                                completed: false,
                            },
                            {
                                step: 3,
                                label: 'Trip In Progress',
                                desc: currentBooking.status === 'in_progress' ? 'Activity / Transit underway' : currentBooking.status === 'completed' ? 'Trip concluded' : 'Scheduled for travel date',
                                active: currentBooking.status === 'in_progress' || currentBooking.status === 'completed',
                                completed: currentBooking.status === 'completed',
                            },
                            {
                                step: 4,
                                label: 'Completed',
                                desc: currentBooking.status === 'completed' ? 'Trip finished successfully' : 'Wrap-up & feedback',
                                active: currentBooking.status === 'completed',
                                completed: currentBooking.status === 'completed',
                            },
                        ].map((s) => (
                            <Grid key={s.step} size={{ xs: 6, sm: 3 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: s.completed ? 'rgba(16, 185, 129, 0.08)' : s.active ? 'rgba(2, 132, 199, 0.08)' : 'rgba(241, 245, 249, 0.6)',
                                        border: s.completed ? '1px solid rgba(16, 185, 129, 0.3)' : s.active ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #E2E8F0',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            mx: 'auto',
                                            mb: 0.8,
                                            bgcolor: s.completed ? '#10B981' : s.active ? '#0284C7' : '#CBD5E1',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 900,
                                        }}
                                    >
                                        {s.completed ? '✓' : s.step}
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: s.completed ? '#065F46' : s.active ? '#0369A1' : '#64748B', display: 'block', lineHeight: 1.2 }}>
                                        {s.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block', mt: 0.3 }}>
                                        {s.desc}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Main Confirmation Card */}
                <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden', mb: 4 }}>
                    {/* Header Strip */}
                    <Box sx={{ bgcolor: '#070D19', color: '#FFFFFF', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                GK WhizWheels Honnavar
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {currentBooking.service_item?.name || serviceTitle}
                            </Typography>
                        </Box>
                        <Chip
                            label={
                                isFullyPaid
                                    ? 'PAID IN FULL'
                                    : advancePaid > 0
                                    ? `ADVANCE PAID • BAL ₹${balanceDue}`
                                    : 'CONFIRMED • PAY ON ARRIVAL'
                            }
                            sx={{
                                bgcolor: isFullyPaid ? '#10B981' : advancePaid > 0 ? '#F59E0B' : '#0284C7',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                            }}
                        />
                    </Box>

                    <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                        <Grid container spacing={3}>
                            {/* Schedule & Pickups */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarMonthIcon sx={{ fontSize: 15 }} /> Date & Timing
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5 }}>
                                    {formatDate(currentBooking.start_datetime)}
                                </Typography>
                                {currentBooking.end_datetime && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                        Till: {formatDate(currentBooking.end_datetime)}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOnIcon sx={{ fontSize: 15 }} /> Meeting & Pickup Spot
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5 }}>
                                    {currentBooking.pickup_location || 'Palya Main Rd Hub, Honnavar'}
                                </Typography>
                                <Box
                                    component="a"
                                    href="https://www.google.com/maps/dir/?api=1&destination=Palya+Main+Rd,+Honnavar,+Karnataka+581334"
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#0284C7', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', mt: 0.5 }}
                                >
                                    <DirectionsIcon sx={{ fontSize: 13 }} /> Open in Google Maps ↗
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12 }}><Divider /></Grid>

                            {/* Customer Profile */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Lead Traveler Name
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.5 }}>
                                    {currentBooking.customer_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Phone: +91 {currentBooking.customer_phone}
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Total Payable / Settlement
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#10B981', mt: 0.5 }}>
                                    ₹{parseFloat(currentBooking.total_amount).toLocaleString('en-IN')}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                                    {advancePaid > 0 && (
                                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                                            Paid: ₹{advancePaid.toLocaleString('en-IN')}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" sx={{ color: balanceDue > 0 ? 'error.main' : 'success.main', fontWeight: 700 }}>
                                        {balanceDue > 0
                                            ? `Balance to pay: ₹${balanceDue.toLocaleString('en-IN')}`
                                            : 'Settled in Full'}
                                    </Typography>
                                </Stack>
                            </Grid>

                            {currentBooking.customer_notes && (
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
                                            Trip Configuration & Details:
                                        </Typography>
                                        <Stack spacing={0.8}>
                                            {currentBooking.customer_notes.split('\n').filter(Boolean).map((line, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0284C7', mt: 0.8, flexShrink: 0 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                        {line}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>

                        {/* Online Instant Payment Card (When balance is due) */}
                        {!isFullyPaid && isPayable && (
                            <Paper sx={{ mt: 4, p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#0F172A', color: '#F59E0B' }}>
                                            <CreditCardIcon fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                Online Balance Payment
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Pay the approved full remaining balance via available gateway methods
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        icon={<LockIcon sx={{ fontSize: '13px !important' }} />}
                                        label="100% Secure Checkout"
                                        size="small"
                                        sx={{ fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}
                                    />
                                </Box>

                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    Pay the approved outstanding balance securely online via UPI, PhonePe, Cards or NetBanking.
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
                                    <Paper
                                        variant="outlined"
                                        onClick={() => setGateway('phonepe')}
                                        sx={{
                                            p: 1.5,
                                            flex: 1,
                                            cursor: 'pointer',
                                            borderRadius: 2,
                                            border: gateway === 'phonepe' ? '2px solid #6739B7' : '1px solid #E2E8F0',
                                            bgcolor: gateway === 'phonepe' ? 'rgba(103, 57, 183, 0.05)' : '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                        }}
                                    >
                                        <AccountBalanceWalletIcon sx={{ color: '#6739B7' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                                PhonePe Payment
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                UPI, PhonePe Wallet & QR
                                            </Typography>
                                        </Box>
                                    </Paper>

                                    <Paper
                                        variant="outlined"
                                        onClick={() => setGateway('razorpay')}
                                        sx={{
                                            p: 1.5,
                                            flex: 1,
                                            cursor: 'pointer',
                                            borderRadius: 2,
                                            border: gateway === 'razorpay' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                                            bgcolor: gateway === 'razorpay' ? 'rgba(2, 132, 199, 0.05)' : '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                        }}
                                    >
                                        <CreditCardIcon sx={{ color: '#0284C7' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                                Razorpay Checkout
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                Cards, NetBanking, All UPI
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Stack>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        color={gateway === 'phonepe' ? 'secondary' : 'primary'}
                                        onClick={() => handlePayOnline(balanceDue)}
                                        disabled={paying}
                                        startIcon={paying ? <CircularProgress size={16} color="inherit" /> : <AccountBalanceWalletIcon />}
                                        sx={{ textTransform: 'none', fontWeight: 800, py: 1.4, px: 3, borderRadius: 2, flexGrow: 1 }}
                                    >
                                        {paying ? 'Processing...' : `Pay ₹${balanceDue.toLocaleString('en-IN')} via ${gateway === 'phonepe' ? 'PhonePe' : 'Razorpay'}`}
                                    </Button>

                                </Stack>
                            </Paper>
                        )}

                        {/* Trust Guarantee Badges */}
                        <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShieldIcon sx={{ color: '#F59E0B', fontSize: 32 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#B45309' }}>
                                    Clear Service Pricing and Payment Terms
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#92400E' }}>
                                    Review your approved booking price and any applicable payment terms. Charges and cancellation policies may differ by service.
                                </Typography>
                            </Box>
                        </Box>

                        {/* Assigned Service Coordinator Card */}
                        {(() => {
                            const coord = {
                                name: coordinator.name || 'GK WhizWheel Operations',
                                phone: (coordinator.phone || '').replace(/\D/g, ''),
                                displayPhone: coordinator.phone || '',
                                spot: currentBooking.pickup_location || coordinator.spot || 'Pickup point to be confirmed',
                                mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentBooking.pickup_location || coordinator.spot || '')}`,
                            };
                                                        return (
                                <Paper sx={{ mt: 3, p: 2.5, borderRadius: 3, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#0284C7', color: '#fff' }}>
                                                <SupportAgentIcon fontSize="small" />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                                                    Assigned Coordinator: {coord.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Booking support • Contact and pickup information
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                                            label="Contact details for your booking"
                                            size="small"
                                            sx={{ fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
                                        />
                                    </Box>

                                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Meeting Point / Coordinates:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                                                {currentBooking.pickup_location || coord.spot}
                                            </Typography>
                                            <Box
                                                component="a"
                                                href={coord.mapsUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#0284C7', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', mt: 0.5 }}
                                            >
                                                <DirectionsIcon sx={{ fontSize: 13 }} /> Start Navigation in Google Maps ↗
                                            </Box>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Direct Coordinator Dispatch:
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="success"
                                                    component="a"
                                                    href={`https://wa.me/${coord.phone}?text=Hi%20${encodeURIComponent(coord.name)},%20I%20have%20confirmed%20booking%20#${currentBooking.booking_number}%20for%20${encodeURIComponent(currentBooking.service_item?.name || serviceTitle)}.`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    disabled={!coord.phone}
                                                    startIcon={<WhatsAppIcon />}
                                                    sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}
                                                >
                                                    Chat with Coordinator
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    component="a"
                                                    href={`tel:${coord.phone}`}
                                                    disabled={!coord.phone}
                                                    startIcon={<PhoneIcon />}
                                                    sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}
                                                >
                                                    {coord.displayPhone ? `Call: ${coord.displayPhone}` : 'Phone unavailable'}
                                                </Button>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            );
                        })()}

                        {/* Customer Direct Action Buttons */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                            <Button
                                variant="contained"
                                component="a"
                                href={`/services/bookings/${currentBooking.booking_number}/voucher`}
                                download
                                startIcon={<DownloadIcon />}
                                sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, fontWeight: 800, textTransform: 'none', py: 1.2, flex: 1 }}
                            >
                                Download Voucher (PDF)
                            </Button>

                            <Button
                                variant="outlined"
                                component="a"
                                href={`/services/bookings/${currentBooking.booking_number}/print`}
                                target="_blank"
                                startIcon={<PrintIcon />}
                                sx={{ fontWeight: 700, textTransform: 'none', py: 1.2, flex: 1 }}
                            >
                                Print Boarding Pass
                            </Button>

                            <Button
                                variant="outlined"
                                color="success"
                                component="a"
                                href={`https://wa.me/918660989586?text=${encodeURIComponent(`Hello G.K. WhizWheel, please update the status of my ${serviceTitle} booking ${currentBooking.booking_number}. Payment: ${isFullyPaid ? 'Paid' : 'Pending'}.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                startIcon={<WhatsAppIcon />}
                                sx={{ fontWeight: 800, textTransform: 'none', py: 1.2, flex: 1 }}
                            >
                                WhatsApp Support
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Back to Hub Directory */}
                <Box sx={{ textAlign: 'center' }}>
                    <Button
                        component={Link}
                        href="/services"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
                    >
                        Explore Other Honnavar Travel Services
                    </Button>
                </Box>
            </Box>
        </AppLayout>
    );
}

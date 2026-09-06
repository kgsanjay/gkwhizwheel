import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    RadioGroup,
    Radio,
    FormControlLabel,
    Card,
    CardContent,
    Button,
    Divider,
    Alert,
    CircularProgress,
    Stack,
    IconButton,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import TimerIcon from '@mui/icons-material/Timer';
import apiClient from '../../api/client';

/**
 * Generate a client-side RFC4122 v4 UUID.
 */
function generateIdempotencyKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export default function CheckoutModal({
    open,
    onClose,
    bike,
    startDate,
    endDate,
    pickupStore,
    returnStore,
    selectedAddons = [],
    couponCode = '',
    quote,
    currentUser,
}) {
    const [gateway, setGateway] = useState('razorpay');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [heldBooking, setHeldBooking] = useState(null);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(900); // 15-minute countdown

    // Countdown timer once booking is held
    useEffect(() => {
        if (!heldBooking) return;
        const timer = setInterval(() => {
            setTimeLeftSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [heldBooking]);

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    /**
     * Primary action: Create hold with client-side UUID idempotency key,
     * then initiate payment checkout.
     */
    const handleBookAndPay = async () => {
        setIsSubmitting(true);
        setErrorMessage('');
        setStatusMessage('Generating reservation hold (15-min lock)...');

        try {
            // 1. Generate client-side Idempotency-Key UUID at the moment "Book Now" is clicked
            const idempotencyKey = generateIdempotencyKey();

            // 2. Dispatch POST /api/v1/bookings/hold with Idempotency-Key header
            const holdPayload = {
                bike_id: bike.id,
                start_date: startDate,
                end_date: endDate,
                pickup_store_id: Number(pickupStore.id),
                return_store_id: Number(returnStore.id),
                coupon_code: couponCode.trim() || undefined,
                addons: selectedAddons,
            };

            const holdRes = await apiClient.post('/bookings/hold', holdPayload, {
                headers: {
                    'Idempotency-Key': idempotencyKey,
                },
            });

            const booking = holdRes.data;
            setHeldBooking(booking);
            setStatusMessage(`Hold acquired! Ref: ${booking.booking_reference}. Creating ${gateway === 'phonepe' ? 'PhonePe' : 'Razorpay'} payment order...`);

            // 3. Initiate payment order creation on server
            const checkoutRes = await apiClient.post(`/bookings/${booking.id}/checkout`, {
                gateway: gateway,
            });

            const paymentData = checkoutRes.data;

            // 4. Handle Gateway Checkout
            if (gateway === 'razorpay') {
                await processRazorpayFlow(booking, paymentData);
            } else {
                await processPhonePeFlow(booking, paymentData);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to complete booking. Please try again.');
            setIsSubmitting(false);
        }
    };

    /**
     * Handle Razorpay standard modal or test simulation.
     */
    const processRazorpayFlow = async (booking, paymentData) => {
        setStatusMessage('Awaiting payment verification...');

        // Check if Razorpay script is loaded on window
        if (typeof window !== 'undefined' && window.Razorpay) {
            const options = {
                key: paymentData.key_id,
                amount: paymentData.amount_paise,
                currency: paymentData.currency || 'INR',
                name: 'GK WhizWheel',
                description: `Rental Booking ${booking.booking_reference}`,
                order_id: paymentData.order_id,
                prefill: {
                    name: currentUser?.name || '',
                    email: currentUser?.email || '',
                    contact: currentUser?.phone || '',
                },
                theme: {
                    color: '#0F172A',
                },
                handler: async function (response) {
                    setStatusMessage('Payment received! Verifying server confirmation...');
                    await awaitBookingConfirmation(booking.id);
                },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false);
                        setStatusMessage('Payment cancelled or dismissed. Hold is still active for 15 minutes.');
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            // Fallback in environments where external Razorpay script is unavailable:
            // Poll for server-to-server confirmation or simulate payment in test/local
            setStatusMessage('Order created! Ready for payment confirmation.');
        }
    };

    /**
     * Handle PhonePe checkout flow.
     */
    const processPhonePeFlow = async (booking, paymentData) => {
        if (paymentData.redirect_url && paymentData.redirect_url !== '#') {
            window.location.href = paymentData.redirect_url;
        } else {
            setStatusMessage('PhonePe transaction initialized! Awaiting webhook confirmation...');
        }
    };

    /**
     * Poll confirm-payment endpoint until booking is confirmed, then navigate to confirmation page.
     */
    const awaitBookingConfirmation = async (bookingId) => {
        let attempts = 0;
        const maxAttempts = 12;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await apiClient.post(`/bookings/${bookingId}/confirm-payment`);
                if (res.success && res.data?.status === 'confirmed') {
                    clearInterval(interval);
                    router.visit(`/bookings/${bookingId}/confirmation`);
                }
            } catch (e) {
                // Keep polling until max attempts
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                // Navigate to confirmation page anyway so customer sees current status
                router.visit(`/bookings/${bookingId}/confirmation`);
            }
        }, 1500);
    };

    /**
     * Local / Testing simulation helper for instant 1-click confirmation testing.
     */
    const handleSimulatePaymentConfirmation = async () => {
        if (!heldBooking) return;
        setIsSubmitting(true);
        setStatusMessage('Simulating server webhook payment confirmation...');

        try {
            const res = await apiClient.post(`/dev/bookings/${heldBooking.id}/simulate-payment`, {
                gateway: gateway,
            });

            if (res.success) {
                router.visit(`/bookings/${heldBooking.id}/confirmation`);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Simulation failed.');
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={isSubmitting ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        Confirm & Pay Reservation
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {bike.brand} {bike.model_name} • {startDate} to {endDate}
                    </Typography>
                </Box>
                {!isSubmitting && (
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {/* Hold Timer Alert if already held */}
                {heldBooking && (
                    <Alert
                        icon={<TimerIcon fontSize="inherit" />}
                        severity={timeLeftSeconds > 180 ? 'info' : 'warning'}
                        sx={{ mb: 2.5, fontWeight: 600 }}
                    >
                        Reservation Hold Active ({heldBooking.booking_reference}): Expires in{' '}
                        <strong>{formatTimer(timeLeftSeconds)}</strong>
                    </Alert>
                )}

                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2.5 }}>
                        {errorMessage}
                    </Alert>
                )}

                {statusMessage && (
                    <Alert severity="info" sx={{ mb: 2.5 }}>
                        {statusMessage}
                    </Alert>
                )}

                {/* Booking Route Summary Card */}
                <Card variant="outlined" sx={{ mb: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0F172A' }}>
                            Trip Details
                        </Typography>
                        <Stack spacing={0.8}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Pickup Location:
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {pickupStore.name} ({startDate})
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Return Location:
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {returnStore.name} ({endDate})
                                </Typography>
                            </Box>
                            {selectedAddons.length > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Add-ons:
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {selectedAddons.map((a) => `${a.addon_type} (${a.quantity})`).join(', ')}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Payment Gateway Selection */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0F172A' }}>
                    Select Payment Gateway
                </Typography>

                <RadioGroup value={gateway} onChange={(e) => setGateway(e.target.value)}>
                    <Card
                        variant="outlined"
                        onClick={() => setGateway('razorpay')}
                        sx={{
                            mb: 1.5,
                            borderRadius: 2,
                            borderColor: gateway === 'razorpay' ? '#F59E0B' : '#E2E8F0',
                            bgcolor: gateway === 'razorpay' ? 'rgba(245, 158, 11, 0.04)' : '#FFFFFF',
                            cursor: 'pointer',
                        }}
                    >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <FormControlLabel
                                value="razorpay"
                                control={<Radio color="secondary" />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <PaymentIcon sx={{ color: '#0F172A' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                Razorpay Secure Checkout
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                UPI (GPay/PhonePe), Credit/Debit Cards, NetBanking
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                                sx={{ width: '100%', m: 0 }}
                            />
                        </CardContent>
                    </Card>

                    <Card
                        variant="outlined"
                        onClick={() => setGateway('phonepe')}
                        sx={{
                            borderRadius: 2,
                            borderColor: gateway === 'phonepe' ? '#F59E0B' : '#E2E8F0',
                            bgcolor: gateway === 'phonepe' ? 'rgba(245, 158, 11, 0.04)' : '#FFFFFF',
                            cursor: 'pointer',
                        }}
                    >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <FormControlLabel
                                value="phonepe"
                                control={<Radio color="secondary" />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <AccountBalanceWalletIcon sx={{ color: '#6739B7' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                PhonePe Direct Payment
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                PhonePe UPI, PhonePe Wallet & QR Intent
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                                sx={{ width: '100%', m: 0 }}
                            />
                        </CardContent>
                    </Card>
                </RadioGroup>

                {/* Amount Due Summary */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                Total Amount Payable
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Rental advance + ₹{quote?.deposit_amount || 0} refundable deposit
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ₹{Number(quote?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    disabled={isSubmitting}
                    onClick={handleBookAndPay}
                    sx={{
                        py: 1.5,
                        fontWeight: 800,
                        fontSize: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)',
                    }}
                >
                    {isSubmitting ? (
                        <CircularProgress size={26} color="inherit" />
                    ) : (
                        `Book Now & Pay ₹${Number(quote?.total_amount || 0).toLocaleString('en-IN')}`
                    )}
                </Button>

                {/* Test / Dev Simulation Trigger when hold is active */}
                {heldBooking && (
                    <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        size="small"
                        onClick={handleSimulatePaymentConfirmation}
                        disabled={isSubmitting}
                        sx={{ fontSize: '0.8125rem' }}
                    >
                        ⚡ Simulate Successful Webhook Payment (Test Mode)
                    </Button>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                    <SecurityIcon sx={{ fontSize: 14, color: '#64748B' }} />
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                        256-bit encrypted transaction • Concurrency-safe hold • Instant deposit refund on return
                    </Typography>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

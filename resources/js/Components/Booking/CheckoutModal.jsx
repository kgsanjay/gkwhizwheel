import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
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
    TextField,
    MenuItem,
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
    bikeModelId = null,
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
    const [paymentOption, setPaymentOption] = useState('advance');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [heldBooking, setHeldBooking] = useState(null);
    const [pickupPointId, setPickupPointId] = useState('');
    const [returnPointId, setReturnPointId] = useState('');
    const [pickupDetails, setPickupDetails] = useState('');
    const [returnDetails, setReturnDetails] = useState('');
    const pickupPointsQuery = useQuery({
        queryKey: ['checkout-pickup-points', pickupStore?.id],
        queryFn: () => apiClient.get('/pickup-points', { params: { store_id: pickupStore.id } }),
        enabled: Boolean(open && pickupStore?.id),
        retry: false,
    });
    const returnPointsQuery = useQuery({
        queryKey: ['checkout-return-points', returnStore?.id],
        queryFn: () => apiClient.get('/pickup-points', { params: { store_id: returnStore.id } }),
        enabled: Boolean(open && returnStore?.id),
        retry: false,
    });
    const pickupPoints = (pickupPointsQuery.data?.data || []).filter((point) => point.supports_pickup);
    const returnPoints = (returnPointsQuery.data?.data || []).filter((point) => point.supports_return);
    const pickupPoint = pickupPoints.find((p) => String(p.id) === pickupPointId);
    const returnPoint = returnPoints.find((p) => String(p.id) === returnPointId);
    const hasPointOptions = pickupPoints.length > 0 && returnPoints.length > 0;
    const pointSelectionValid = hasPointOptions && Boolean(pickupPoint && returnPoint)
        && (pickupPoint.slug === 'hotel-delivery' ? pickupDetails.trim().length >= 5 : true)
        && (returnPoint.slug === 'hotel-delivery' ? returnDetails.trim().length >= 5 : true);
    const requestKey = useRef(null);
    const finalQuote = heldBooking || quote;
    const total = finalQuote ? Number(finalQuote.total_amount || 0) : null;
    const advance = total === null ? 100 : Math.min(total, 100);
    const payNow = total === null ? null : paymentOption === 'advance' ? advance : total;
    const balanceAtPickup = total === null ? null : Math.max(0, total - payNow);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

    // Use the real server deadline, not an independent 15-minute timer.
    useEffect(() => {
        if (!heldBooking?.held_until) return;
        const refreshRemaining = () => {
            const expiry = Date.parse(heldBooking.held_until);
            setTimeLeftSeconds(Number.isFinite(expiry)
                ? Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
                : 0);
        };
        refreshRemaining();
        const timer = setInterval(refreshRemaining, 1000);
        return () => clearInterval(timer);
    }, [heldBooking?.held_until]);

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
        if (!heldBooking && !pointSelectionValid) {
            setErrorMessage('Choose valid pickup and return points. Hotel/custom requests need an address.');
            return;
        }
        setIsSubmitting(true);
        setErrorMessage('');
        setStatusMessage(heldBooking ? 'Preparing secure payment checkout...' : 'Checking available vehicles and reserving a bike...');

        try {
            let booking = heldBooking;
            if (!booking) {
                // Keep the key stable for a retried hold after network errors.
                if (!requestKey.current) requestKey.current = generateIdempotencyKey();
                const holdPayload = {
                    ...(bikeModelId ? { bike_model_id: bikeModelId } : { bike_id: bike.id }),
                    start_date: startDate,
                    end_date: endDate,
                    pickup_store_id: Number(pickupStore.id),
                    return_store_id: Number(returnStore.id),
                    pickup_point_id: Number(pickupPointId),
                    return_point_id: Number(returnPointId),
                    pickup_location_details: pickupPoint?.name.toLowerCase().includes('hotel') ? pickupDetails.trim() : null,
                    return_location_details: returnPoint?.name.toLowerCase().includes('hotel') ? returnDetails.trim() : null,
                    coupon_code: couponCode.trim() || undefined,
                    addons: selectedAddons,
                };
                const holdRes = await apiClient.post(
                    bikeModelId ? '/bookings/model-hold' : '/bookings/hold',
                    holdPayload,
                    { headers: { 'Idempotency-Key': requestKey.current } }
                );
                booking = holdRes.data;
                setHeldBooking(booking);

                if (bikeModelId) {
                    // A model's exact rate may vary between physical vehicles.
                    // Require an explicit second click to accept the actual total.
                    setStatusMessage('Bike reserved. Review the exact amount below before continuing to payment.');
                    setIsSubmitting(false);
                    return;
                }
            }
            setStatusMessage(`Reservation ${booking.booking_reference}. Creating ${gateway === 'phonepe' ? 'PhonePe' : 'Razorpay'} payment order...`);

            // 3. Initiate payment order creation on server
            if (booking.held_until && Date.parse(booking.held_until) <= Date.now()) {
                throw new Error('Your reservation hold has expired. Close this dialog and start a new booking.');
            }
            const checkoutRes = await apiClient.post(`/bookings/${booking.id}/checkout`, {
                gateway: gateway,
                payment_option: paymentOption,
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
                        {timeLeftSeconds > 0 ? 'Reservation hold active' : 'Reservation hold expired'} ({heldBooking.booking_reference}):{' '}
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

                <Card variant="outlined" sx={{ borderRadius: 2, mb: 2, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                        Pickup and return locations
                    </Typography>
                    <Stack spacing={2}>
                        {(pickupPointsQuery.isError || returnPointsQuery.isError) && <Alert severity="error">
                            Unable to load pickup points. Retry after checking the connection.
                        </Alert>}
                        {!pickupPointsQuery.isLoading && !returnPointsQuery.isLoading && !hasPointOptions && <Alert severity="warning">
                            Pickup points are not published for both selected branches yet. Booking cannot continue until staff enables them.
                        </Alert>}
                        <TextField fullWidth select label={`Pickup point — ${pickupStore?.city || pickupStore?.name}`}
                            value={pickupPointId} disabled={Boolean(heldBooking) || !hasPointOptions}
                            onChange={(event) => { setPickupPointId(event.target.value); setPickupDetails(''); }}>
                            {pickupPoints.map((point) => <MenuItem key={point.id} value={String(point.id)}>{point.name}</MenuItem>)}
                        </TextField>
                        {pickupPoint?.name.toLowerCase().includes('hotel') && <TextField
                            fullWidth required label="Hotel name / exact pickup address" value={pickupDetails}
                            disabled={Boolean(heldBooking)} onChange={(event) => setPickupDetails(event.target.value)}
                            inputProps={{ maxLength: 255 }} />}
                        <TextField fullWidth select label={`Return point — ${returnStore?.city || returnStore?.name}`}
                            value={returnPointId} disabled={Boolean(heldBooking) || !hasPointOptions}
                            onChange={(event) => { setReturnPointId(event.target.value); setReturnDetails(''); }}>
                            {returnPoints.map((point) => <MenuItem key={point.id} value={String(point.id)}>{point.name}</MenuItem>)}
                        </TextField>
                        {returnPoint?.name.toLowerCase().includes('hotel') && <TextField
                            fullWidth required label="Hotel name / exact return address" value={returnDetails}
                            disabled={Boolean(heldBooking)} onChange={(event) => setReturnDetails(event.target.value)}
                            inputProps={{ maxLength: 255 }} />}
                        <Alert severity="info">
                            Pickup and return arrangements are subject to branch confirmation.
                            Location delivery charges have not been finalized and are not included in this rental quote.
                            Any additional charge must be confirmed with you before collection.
                        </Alert>
                    </Stack>
                </Card>
                {/* No refundable security deposit is required for new online bike bookings. */}
                <Alert severity="success" sx={{ mb: 2 }}>
                    No security deposit required. Pay ₹100 now to reserve, or pay the full rental amount.
                </Alert>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#0F172A' }}>
                    Choose payment option
                </Typography>
                <RadioGroup row value={paymentOption} onChange={(e) => setPaymentOption(e.target.value)}
                    sx={{ gap: 1.5, mb: 3 }}>
                    <Card variant="outlined" sx={{ flex: '1 1 190px', borderRadius: 2,
                        borderColor: paymentOption === 'advance' ? '#C66A42' : '#E2E8F0' }}>
                        <FormControlLabel value="advance" control={<Radio color="secondary" />}
                            sx={{ m: 0, p: 1.5, alignItems: 'flex-start', width: '100%' }}
                            label={<Box>
                                <Typography fontWeight={800}>Advance Payment</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Reserve your bike now. Pay the remaining rental amount at pickup.
                                </Typography>
                                <Typography fontWeight={800} sx={{ mt: 1, color: '#C66A42' }}>
                                    {total === null ? '₹100' : `Pay now ₹${advance.toLocaleString('en-IN')}`}
                                </Typography>
                            </Box>} />
                    </Card>
                    <Card variant="outlined" sx={{ flex: '1 1 190px', borderRadius: 2,
                        borderColor: paymentOption === 'full' ? '#C66A42' : '#E2E8F0' }}>
                        <FormControlLabel value="full" control={<Radio color="secondary" />}
                            sx={{ m: 0, p: 1.5, alignItems: 'flex-start', width: '100%' }}
                            label={<Box>
                                <Typography fontWeight={800}>Full Payment</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pay the full rental amount online. No rental balance at pickup.
                                </Typography>
                                <Typography fontWeight={800} sx={{ mt: 1, color: '#C66A42' }}>
                                    {total === null ? 'See total after reservation' : `Pay now ₹${total.toLocaleString('en-IN')}`}
                                </Typography>
                            </Box>} />
                    </Card>
                </RadioGroup>
                {finalQuote && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {paymentOption === 'advance'
                            ? `Pay ₹${advance.toLocaleString('en-IN')} online and ₹${balanceAtPickup.toLocaleString('en-IN')} at pickup. No deposit.`
                            : `Pay ₹${total.toLocaleString('en-IN')} online. Nothing due for the quoted rental at pickup.`}
                    </Alert>
                )}

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
                                Amount to Pay Now
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                No security deposit · Total rental {total === null ? 'calculated at reservation' : `₹${total.toLocaleString('en-IN')}`}
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            {payNow === null ? 'After reservation' : `₹${payNow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
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
                    disabled={isSubmitting || (!heldBooking && !pointSelectionValid) || (Boolean(heldBooking) && timeLeftSeconds <= 0)}
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
                        bikeModelId && !heldBooking
                            ? 'Reserve vehicle & check final price'
                            : `Pay ₹${Number(payNow || 0).toLocaleString('en-IN')} now`
                    )}
                </Button>

                {/* Test / Dev Simulation Trigger when hold is active */}
                {import.meta.env.DEV && heldBooking && (
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
                        Secure checkout • Concurrency-safe reservation • No security deposit
                    </Typography>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
